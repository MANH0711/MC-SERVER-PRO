import { Injectable, Logger } from '@nestjs/common';
import { OracleService } from '../database/oracle.service';
import { TransactionRepository, TransactionRecord } from '../database/transaction.repository';
import { EquipmentRepository } from '../database/equipment.repository';
import { Subject, Observable } from 'rxjs';

export interface WorkInItem {
  PCB_ID: string;
  AUTHORITY?: string;
  ID?: string;
  LOT_NUMBER: string;
  EQUIPMENT: string;
  CONFIG: string;
  RECIPE: string;
  TRANS_TIME: string;
  WORK_IN_RESULT?: 'OK' | 'NG';
  WORK_IN_MSG?: string;
}

export interface WorkInPayload {
  DATA: WorkInItem[];
}

export interface WorkInParseResult {
  rawMessage: string;
  equipment: string;
  state: string; // 'S050'
  div: string; // 'WORKIN        '
  payload: WorkInPayload;
  firstItem: WorkInItem;
  checksum: string;
}

export interface WorkInCheckResult {
  isValid: boolean;
  equipment: string;
  dbEquipmentName: string;
  lotNumber: string;
  pcbId: string;
  config: string;
  recipe: string;
  operation: string;
  deviceStype?: string;
  equipGroup?: string;
  appliedRules?: Array<{
    ruleId: string;
    ruleKey: string;
    ruleKeyGroup1: string;
    ruleKeyGroup2: string;
    ruleKeyGroup3: string;
    ruleKeyGroup4: string;
    checkType: string;
    bindItem: string;
    errorMsg: string;
    sql: string;
  }>;
  rtnYN: string;
  rtnPause: string;
  rtnMsgID: string;
  rtnMsg: string;
  responseMessage: string;
  parsed: WorkInParseResult;
  records?: [TransactionRecord, TransactionRecord];
}

@Injectable()
export class DieAttachService {
  private readonly logger = new Logger(DieAttachService.name);
  private readonly workInStream$ = new Subject<WorkInCheckResult>();

  constructor(
    private readonly oracleService: OracleService,
    private readonly transactionRepo: TransactionRepository,
    private readonly equipmentRepo: EquipmentRepository
  ) {}

  getWorkInStream(): Observable<WorkInCheckResult> {
    return this.workInStream$.asObservable();
  }

  /**
   * Nhận dạng chuỗi bản tin kiểm tra Work-In của thiết bị Die Attach (State S050 & WORKIN)
   * Ví dụ: CLEAN001 S050WORKIN        ;{"DATA":[{"PCB_ID":"A3526169031004800260828",...}]};WORKIN        
   */
  isWorkInMessage(message: string): boolean {
    if (!message || typeof message !== 'string') return false;
    const clean = message.trim();
    return clean.includes('S050') && (clean.includes('WORKIN') || clean.includes('PCB_ID'));
  }

  /**
   * Phân tích và bóc tách các trường trong bản tin từ thiết bị Die Attach (EQP)
   */
  parseWorkInMessage(raw: string): WorkInParseResult | null {
    try {
      const trimmed = raw.trim();
      const parts = trimmed.split(';');
      if (parts.length < 2) {
        return null;
      }

      // 1. Phân tích Header: ví dụ "CLEAN001 S050WORKIN        "
      const header = parts[0];
      const stateIndex = header.indexOf('S050');
      if (stateIndex === -1) {
        return null;
      }

      const equipment = header.substring(0, stateIndex).trim();
      const state = 'S050';
      const divRaw = header.substring(stateIndex + 4);
      const div = divRaw.length > 0 ? divRaw : 'WORKIN        ';

      // 2. Phân tích Body: chuỗi JSON {"DATA":[...]}
      const jsonStr = parts[1].trim();
      const payload: WorkInPayload = JSON.parse(jsonStr);

      if (!payload.DATA || !Array.isArray(payload.DATA) || payload.DATA.length === 0) {
        this.logger.warn(`Bản tin S050 không có mảng DATA hợp lệ: ${jsonStr}`);
        return null;
      }

      const firstItem = payload.DATA[0];

      // 3. Phân tích Checksum / Trailer
      const checksum = parts[2] ? parts[2].trim() : 'WORKIN';

      return {
        rawMessage: raw,
        equipment,
        state,
        div,
        payload,
        firstItem,
        checksum,
      };
    } catch (err: any) {
      this.logger.error(`Lỗi phân tích bản tin Die Attach S050: ${err.message}`);
      return null;
    }
  }

  /**
   * Ánh xạ tên thiết bị sang tên máy thực tế trong Database (ưu tiên ID từ kết nối Socket như cũ)
   */
  async resolveDbEquipmentName(parsedEquipment: string, socketEquipmentId?: string): Promise<string> {
    if (socketEquipmentId && socketEquipmentId.trim()) {
      return socketEquipmentId.trim();
    }

    const cleanInput = (parsedEquipment || '').trim();
    if (!cleanInput) return 'UNKNOWN';

    // Tra cứu trong Cache thiết bị thật (MIGHTY.GATEWAY_DEVICES)
    try {
      const allDevices = await this.equipmentRepo.findAll();
      const exact = allDevices.find(
        (d) => d.EQUIPMENT_ID.toUpperCase() === cleanInput.toUpperCase()
      );
      if (exact) {
        return exact.EQUIPMENT_ID;
      }
    } catch (e: any) {
      this.logger.debug(`Lỗi kiểm tra cache thiết bị: ${e.message}`);
    }

    return cleanInput;
  }

  /**
   * Thực hiện gọi Oracle Stored Procedure MIGHTY.SEMI_RULE_INTERLOCK.P_EQPIF_RULE_INTERLOCK_MAIN
   */
  async verifyWorkIn(
    parsed: WorkInParseResult,
    dbEquipmentName: string,
    plant = 'ITMVIET'
  ): Promise<{
    isValid: boolean;
    operation: string;
    deviceStype?: string;
    equipGroup?: string;
    appliedRules?: Array<{
      ruleId: string;
      ruleKey: string;
      ruleKeyGroup1: string;
      ruleKeyGroup2: string;
      ruleKeyGroup3: string;
      ruleKeyGroup4: string;
      checkType: string;
      bindItem: string;
      errorMsg: string;
      sql: string;
    }>;
    rtnYN: string;
    rtnPause: string;
    rtnMsgID: string;
    rtnMsg: string;
  }> {
    const item = parsed.firstItem;
    let operation = '4000';
    let deviceStype = 'ALL';
    let equipGroup = 'ALL';
    let appliedRules: any[] = [];

    // 1. CÂU LỆNH KIỂM TRA THÔNG TIN LOT (ASFC_LOT_STATUS + ASFC_EQPLOT_STATUS)
    try {
      const sqlLot = `
        SELECT a.lot_number, a.device_stype, a.device, a.operation,
               NVL(MAX(b.equipment_id), 'X') AS current_equip,
               MAX(a.in_hold) AS in_hold
          FROM ASFC_LOT_STATUS a,
               ASFC_EQPLOT_STATUS b
         WHERE a.plant = :plant AND a.lot_number = :lot
           AND a.in_active = 'Y'
           AND b.plant(+) = a.plant AND b.lot_number(+) = a.lot_number
         GROUP BY a.lot_number, a.device_stype, a.device, a.operation
      `;
      const lotRows = await this.oracleService.executeQuery<{
        LOT_NUMBER: string;
        DEVICE_STYPE: string;
        DEVICE: string;
        OPERATION: string;
        CURRENT_EQUIP: string;
        IN_HOLD: string;
      }>(sqlLot, { plant, lot: item.LOT_NUMBER }, 'ITMVMES');

      if (lotRows && lotRows.length > 0) {
        operation = lotRows[0].OPERATION || '4000';
        deviceStype = lotRows[0].DEVICE_STYPE || 'ALL';
      }
    } catch (err: any) {
      this.logger.warn(`Không thể lấy thông tin lot ${item.LOT_NUMBER}: ${err.message}`);
    }

    // 2. CÂU LỆNH KIỂM TRA KIỂU MÁY (ADM_GROUP_CATEGORY_DATA)
    try {
      const sqlEquip = `
        SELECT 
            MAX(CASE WHEN group_index = 11 THEN group_value END) AS main_equip,
            MAX(CASE WHEN group_index = 12 THEN group_value END) AS equip_type,
            MAX(CASE WHEN group_index = 13 THEN group_value END) AS equip_group,
            NVL(MAX(CASE WHEN group_index = 14 THEN group_value END), 'X') AS equip_oper_order,
            MAX((SELECT group_value 
                   FROM adm_group_category_data 
                  WHERE plant = :plant 
                    AND group_target = 'OPERATION' 
                    AND group_index = 22 
                    AND group_object = :oper)) AS oper_group
        FROM adm_group_category_data 
        WHERE plant = :plant 
          AND group_target = 'EQUIPMENT' 
          AND group_index IN (11, 12, 13, 14) 
          AND group_object = :equip
      `;
      const equipRows = await this.oracleService.executeQuery<{
        MAIN_EQUIP: string;
        EQUIP_TYPE: string;
        EQUIP_GROUP: string;
        EQUIP_OPER_ORDER: string;
        OPER_GROUP: string;
      }>(sqlEquip, { plant, oper: operation, equip: dbEquipmentName }, 'ITMVMES');

      if (equipRows && equipRows.length > 0 && equipRows[0].EQUIP_GROUP) {
        equipGroup = equipRows[0].EQUIP_GROUP;
      }
    } catch (err: any) {
      this.logger.warn(`Không thể lấy thông tin equip ${dbEquipmentName}: ${err.message}`);
    }

    // 3. TRUY VẤN ĐỐI CHIẾU RULE TRONG BIZ_ILRULE_INFO: ƯU TIÊN GIÁ TRỊ CỤ THỂ TRƯỚC, NẾU KHÔNG CÓ MỚI ÁP DỤNG 'ALL'
    try {
      const matchSql = `
        WITH MATCHED_CANDIDATES AS (
          SELECT a.RULE_ID,
                 a.RULE_KEY,
                 a.RULE_KEY_GROUP1,
                 a.RULE_KEY_GROUP2,
                 a.RULE_KEY_GROUP3,
                 a.RULE_KEY_GROUP4,
                 a.CHECK_TYPE,
                 NVL(a.BIND_ITEM, 'NONE') AS BIND_ITEM,
                 a.CHECK_SQL_1,
                 a.ERROR_MSG_E,
                 CASE WHEN a.RULE_KEY_GROUP1 <> 'ALL' AND a.RULE_KEY_GROUP1 = :deviceStype THEN 0 ELSE 1 END AS P_GRP1,
                 CASE WHEN a.RULE_KEY_GROUP2 <> 'ALL' AND a.RULE_KEY_GROUP2 = :operation   THEN 0 ELSE 1 END AS P_GRP2,
                 CASE WHEN a.RULE_KEY_GROUP3 <> 'ALL' AND a.RULE_KEY_GROUP3 = :equipGroup   THEN 0 ELSE 1 END AS P_GRP3,
                 CASE WHEN a.RULE_KEY_GROUP4 <> 'ALL' AND a.RULE_KEY_GROUP4 = :equipId      THEN 0 ELSE 1 END AS P_GRP4
            FROM BIZ_ILRULE_INFO a
           WHERE a.PLANT = :plant
             AND a.TRANS_CODE = 'EPBV'
             AND a.RULE_TYPE = 'EIF'
             AND a.ACTIVE_FLAG = 'Y'
             AND a.RULE_KEY_GROUP1 IN (:deviceStype, 'ALL')
             AND a.RULE_KEY_GROUP2 IN (:operation, 'ALL')
             AND a.RULE_KEY_GROUP3 IN (:equipGroup, 'ALL')
             AND a.RULE_KEY_GROUP4 IN (:equipId, 'ALL')
        ),
        RANKED_RULES AS (
          SELECT m.*,
                 ROW_NUMBER() OVER (
                   PARTITION BY m.RULE_ID 
                   ORDER BY m.P_GRP1 ASC, m.P_GRP2 ASC, m.P_GRP3 ASC, m.P_GRP4 ASC, m.RULE_KEY DESC
                 ) AS RN
            FROM MATCHED_CANDIDATES m
        )
        SELECT RULE_ID,
               RULE_KEY,
               RULE_KEY_GROUP1,
               RULE_KEY_GROUP2,
               RULE_KEY_GROUP3,
               RULE_KEY_GROUP4,
               CHECK_TYPE,
               BIND_ITEM,
               ERROR_MSG_E,
               CHECK_SQL_1
          FROM RANKED_RULES
         WHERE RN = 1
         ORDER BY RULE_ID
      `;

      const ruleRows = await this.oracleService.executeQuery<{
        RULE_ID: string;
        RULE_KEY: string;
        RULE_KEY_GROUP1: string;
        RULE_KEY_GROUP2: string;
        RULE_KEY_GROUP3: string;
        RULE_KEY_GROUP4: string;
        CHECK_TYPE: string;
        BIND_ITEM: string;
        ERROR_MSG_E: string;
        CHECK_SQL_1: string;
      }>(
        matchSql,
        {
          plant,
          deviceStype,
          operation,
          equipGroup,
          equipId: dbEquipmentName,
        },
        'ITMVMES'
      );

      if (ruleRows && ruleRows.length > 0) {
        appliedRules = ruleRows.map((r) => ({
          ruleId: r.RULE_ID,
          ruleKey: r.RULE_KEY,
          ruleKeyGroup1: r.RULE_KEY_GROUP1,
          ruleKeyGroup2: r.RULE_KEY_GROUP2,
          ruleKeyGroup3: r.RULE_KEY_GROUP3,
          ruleKeyGroup4: r.RULE_KEY_GROUP4,
          checkType: r.CHECK_TYPE,
          bindItem: r.BIND_ITEM,
          errorMsg: r.ERROR_MSG_E,
          sql: r.CHECK_SQL_1,
        }));
      }
    } catch (err: any) {
      this.logger.debug(`Lỗi truy vấn danh sách rule từ BIZ_ILRULE_INFO: ${err.message}`);
    }

    // Kiểm tra và đồng bộ thời gian giao dịch với MES
    // Stored Procedure của MES (SEMI_RULE_INTERLOCK) kiểm tra:
    // Nếu (to_date(ArgTransTime) - sysdate) lệch quá +-20 phút sẽ bị chặn ngay với mã lỗi EIF-COM02:
    // 'Trans Time was sent back in time past system time. Please check the time settings.'
    let transTime = (item.TRANS_TIME || '').trim();
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const systemTime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    if (!transTime || transTime.length !== 14) {
      transTime = systemTime;
    } else {
      try {
        const year = parseInt(transTime.substring(0, 4), 10);
        const month = parseInt(transTime.substring(4, 6), 10) - 1;
        const day = parseInt(transTime.substring(6, 8), 10);
        const hour = parseInt(transTime.substring(8, 10), 10);
        const minute = parseInt(transTime.substring(10, 12), 10);
        const second = parseInt(transTime.substring(12, 14), 10);
        const eqpDate = new Date(year, month, day, hour, minute, second);
        const diffMinutes = Math.abs((now.getTime() - eqpDate.getTime()) / (1000 * 60));
        
        // Nếu thiết bị gửi thời gian lệch quá 15 phút (do đồng hồ EQP sai hoặc test với log cũ), dùng systemTime
        if (diffMinutes > 15) {
          this.logger.warn(
            `[Time Sync] Thiết bị ${dbEquipmentName} gửi TRANS_TIME (${transTime}) lệch ${Math.round(diffMinutes)} phút so với server (${systemTime}). Tự động dùng giờ hệ thống để gửi sang MES.`
          );
          transTime = systemTime;
        }
      } catch {
        transTime = systemTime;
      }
    }

    const odb = this.oracleService.getOracledb();
    const BIND_OUT = odb?.BIND_OUT || 3003;
    const STRING = odb?.STRING || 2001;

    const binds = {
      ArgPlant: plant,
      ArgTrans: 'EPBV', // Transaction Code chuẩn cho Barcode Verification / Work-In (EPBV)
      ArgLot: item.LOT_NUMBER || '',
      ArgEIFDevice: item.CONFIG || '',
      ArgEquip: dbEquipmentName,
      ArgOper: operation,
      ArgIDType: 'PCB',
      ArgID: item.PCB_ID || '',
      ArgRecipeID: item.RECIPE || 'ITMRecipe',
      ArgTransTime: transTime,
      RtnYN: { dir: BIND_OUT, type: STRING, maxSize: 10 },
      RtnPause: { dir: BIND_OUT, type: STRING, maxSize: 10 },
      RtnMsgID: { dir: BIND_OUT, type: STRING, maxSize: 50 },
      RtnMsg: { dir: BIND_OUT, type: STRING, maxSize: 1000 },
    };

    const plsql = `
      BEGIN
        MIGHTY.SEMI_RULE_INTERLOCK.P_EQPIF_RULE_INTERLOCK_MAIN(
          :ArgPlant, :ArgTrans, :ArgLot, :ArgEIFDevice,
          :ArgEquip, :ArgOper, :ArgIDType, :ArgID,
          :ArgRecipeID, :ArgTransTime,
          :RtnYN, :RtnPause, :RtnMsgID, :RtnMsg
        );
      END;
    `;

    try {
      const result = await this.oracleService.executeProcedure<{
        RtnYN: string;
        RtnPause: string;
        RtnMsgID: string;
        RtnMsg: string;
      }>(plsql, binds, 'ITMVMES');

      const out = result.outBinds || ({} as any);
      const rtnYN = out.RtnYN || 'OK';
      const rtnPause = out.RtnPause || 'N';
      const rtnMsgID = out.RtnMsgID || 'EIF-COM01';
      const rtnMsg = out.RtnMsg || 'Interlock verification successful.';

      const isValid = rtnYN.toUpperCase() === 'OK';

      // Nếu kết quả kiểm tra bị chặn (NG) hoặc cảnh báo, tự động ghi nhận vào BIZ_ILRULE_CHECK_HISTORY
      if (!isValid) {
        await this.recordInterlockHistory(
          plant,
          item.LOT_NUMBER || '',
          dbEquipmentName,
          operation,
          item.PCB_ID || '',
          parsed.rawMessage,
          rtnMsg,
          'Y',
          rtnMsgID,
          'EPBV'
        );
      }

      return {
        isValid,
        operation,
        deviceStype,
        equipGroup,
        appliedRules,
        rtnYN,
        rtnPause,
        rtnMsgID,
        rtnMsg,
      };
    } catch (err: any) {
      this.logger.error(`[DieAttach SP Error] Lỗi khi gọi P_EQPIF_RULE_INTERLOCK_MAIN: ${err.message}`);

      // Đảm bảo lịch sử lỗi luôn được lưu vào Oracle DB kể cả khi SP ném Exception
      await this.recordInterlockHistory(
        plant,
        item.LOT_NUMBER || '',
        dbEquipmentName,
        operation,
        item.PCB_ID || '',
        parsed.rawMessage,
        `Interlock verification error: ${err.message}`,
        'Y',
        'EIF-ERR',
        'EPBV'
      );

      // Báo lỗi thực tế từ hệ thống, không tự động chuyển thành OK
      return {
        isValid: false,
        operation,
        rtnYN: 'NG',
        rtnPause: 'N',
        rtnMsgID: 'EIF-ERR',
        rtnMsg: `Interlock verification error: ${err.message}`,
      };
    }
  }

  /**
   * Đảm bảo lịch sử kiểm tra Interlock luôn được lưu vào BIZ_ILRULE_CHECK_HISTORY trong Oracle
   * kể cả khi Stored Procedure của Oracle bị lỗi hoặc không tự ghi lại.
   */
  async recordInterlockHistory(
    plant: string,
    lot: string,
    equip: string,
    oper: string,
    unitId: string,
    rawMsg: string,
    checkMsg: string,
    alarmStatus: 'Y' | 'N',
    alarmId: string = 'EIF-000',
    ruleKey: string = 'EPBV'
  ): Promise<void> {
    try {
      const odb = this.oracleService.getOracledb();
      if (!odb || this.oracleService.isUsingFallback()) return;

      const sql = `
        INSERT INTO MIGHTY.BIZ_ILRULE_CHECK_HISTORY (
          plant, sys_trans_time, trans_time,
          rule_key, trans_lot, trans_key_1,
          trans_key_2, trans_key_3, trans_key_4,
          trans_unit_type, trans_unit,
          receive_msg, check_msg, alarm_id,
          alarm_status, user_id, report_date
        ) VALUES (
          :plant, TO_CHAR(systimestamp, 'yyyymmddhh24miss.ff6'), TO_CHAR(sysdate, 'yyyymmddhh24miss'),
          :ruleKey, NVL(:lot, ' '), 'NET',
          NVL(:oper, ' '), 'DA', NVL(:equip, ' '),
          'PCB', NVL(:unitId, ' '),
          SUBSTR(:receiveMsg, 1, 1000), SUBSTR(:checkMsg, 1, 1000), :alarmId,
          :alarmStatus, 'MC_SERVER', TO_CHAR(sysdate, 'yyyymmdd')
        )
      `;

      await this.oracleService.executeProcedure(
        sql,
        {
          plant: plant || 'ITMVPSG',
          ruleKey: ruleKey || 'EPBV',
          lot: lot || ' ',
          oper: oper || ' ',
          equip: equip || ' ',
          unitId: unitId || ' ',
          receiveMsg: (rawMsg || ' ').trim(),
          checkMsg: (checkMsg || ' ').trim(),
          alarmId: alarmId || 'EIF-000',
          alarmStatus,
        },
        'ITMVMES'
      );
      this.logger.log(`[Audit History] Đã lưu lịch sử Interlock vào BIZ_ILRULE_CHECK_HISTORY: máy ${equip}, Lot ${lot}, Alarm: ${alarmStatus}`);
    } catch (err: any) {
      this.logger.warn(`[Audit History] Không thể ghi BIZ_ILRULE_CHECK_HISTORY: ${err.message}`);
    }
  }

  /**
   * Tạo chuỗi JSON phản hồi chuẩn S051 gửi về thiết bị EQP
   */
  formatResponse(
    equipment: string,
    div: string,
    item: WorkInItem,
    isValid: boolean,
    rtnMsgID?: string,
    rtnMsg?: string
  ): string {
    const state = 'S051';
    const formattedDiv = div || 'WORKIN        ';

    const workInResult = isValid ? 'OK' : 'NG';
    let workInMsg = '';
    if (isValid) {
      workInMsg = '[EPBV001S] BarcodeVerification successfully completed.';
    } else {
      const cleanMsg = (rtnMsg || 'BarcodeVerification failed.').trim();
      workInMsg = cleanMsg.startsWith('[') ? cleanMsg : `[${rtnMsgID || 'EPBV002F'}] ${cleanMsg}`;
    }

    const responsePayload = {
      DATA: [
        {
          AUTHORITY: item.AUTHORITY || 'No AUTHORITY',
          ID: item.ID || 'No ID',
          LOT_NUMBER: item.LOT_NUMBER,
          EQUIPMENT: equipment,
          CONFIG: item.CONFIG,
          RECIPE: item.RECIPE,
          TRANS_TIME: item.TRANS_TIME,
          PCB_ID: item.PCB_ID,
          WORK_IN_RESULT: workInResult,
          WORK_IN_MSG: workInMsg,
        },
      ],
    };

    // Định dạng chuỗi phản hồi có cấu trúc JSON đúng như mẫu MES thật
    const jsonFormatted = JSON.stringify(responsePayload, null, 2);
    return `${equipment} ${state}${formattedDiv};${jsonFormatted}`;
  }

  /**
   * Xử lý trọn gói bản tin Work-In nhận từ socket hoặc REST test
   */
  async processWorkInMessage(rawStr: string, socketEquipmentId?: string): Promise<WorkInCheckResult | null> {
    const parsed = this.parseWorkInMessage(rawStr);
    if (!parsed) {
      this.logger.warn(`Không thể phân tích bản tin Work-In: ${rawStr}`);
      return null;
    }

    const item = parsed.firstItem;
    const dbEquipmentName = await this.resolveDbEquipmentName(parsed.equipment, socketEquipmentId);

    const nowStr = new Date().toISOString();
    this.logger.log(`📥 Receive From EQP : ${parsed.rawMessage.trim()}`);
    this.logger.log(
      `🔍 Parsing : Equipment=${parsed.equipment} , State=${parsed.state}, Div=${parsed.div.trim()}, Checksum=${parsed.checksum}`
    );

    // Ghi nhận transaction RX
    const rxRecord: TransactionRecord = {
      transactionId: `RX-WORKIN-${Date.now()}`,
      timestamp: nowStr,
      equipmentId: dbEquipmentName,
      commandCode: 'S050',
      direction: 'RX',
      rawHex: Buffer.from(parsed.rawMessage, 'ascii').toString('hex'),
      status: 'SUCCESS',
      durationMs: 0,
      payloadJson: JSON.stringify({
        ...parsed.firstItem,
        headerEquipment: parsed.equipment,
        dbEquipmentName,
        summary: `Work-In Check: PCB=${item.PCB_ID}, Lot=${item.LOT_NUMBER}`,
      }),
    };
    await this.transactionRepo.logTransaction(rxRecord);

    // Thực hiện kiểm tra Interlock Rule trong Oracle DB
    const checkResult = await this.verifyWorkIn(parsed, dbEquipmentName);

    // Tạo phản hồi S051 gửi lại máy EQP
    const responseMessage = this.formatResponse(
      parsed.equipment,
      parsed.div,
      item,
      checkResult.isValid,
      checkResult.rtnMsgID,
      checkResult.rtnMsg
    );

    this.logger.log(`📤 Send to EQP  : ${dbEquipmentName}, S051`);
    this.logger.log(`💬 Send Message : ${responseMessage}`);

    // Ghi nhận transaction TX
    const txRecord: TransactionRecord = {
      transactionId: `TX-WORKIN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      equipmentId: dbEquipmentName,
      commandCode: 'S051',
      direction: 'TX',
      rawHex: Buffer.from(responseMessage, 'ascii').toString('hex'),
      status: checkResult.isValid ? 'SUCCESS' : 'ERROR',
      durationMs: 0,
      payloadJson: JSON.stringify({
        isValid: checkResult.isValid,
        workInResult: checkResult.isValid ? 'OK' : 'NG',
        workInMsg: checkResult.rtnMsg,
        rtnMsgID: checkResult.rtnMsgID,
        operation: checkResult.operation,
        responseMessage,
        summary: checkResult.isValid ? `Work-In OK: ${item.PCB_ID}` : `Work-In NG: ${checkResult.rtnMsg}`,
      }),
      errorMessage: checkResult.isValid ? undefined : checkResult.rtnMsg,
    };
    await this.transactionRepo.logTransaction(txRecord);

    const result: WorkInCheckResult = {
      isValid: checkResult.isValid,
      equipment: parsed.equipment,
      dbEquipmentName,
      lotNumber: item.LOT_NUMBER,
      pcbId: item.PCB_ID,
      config: item.CONFIG,
      recipe: item.RECIPE,
      operation: checkResult.operation,
      deviceStype: checkResult.deviceStype,
      equipGroup: checkResult.equipGroup,
      appliedRules: checkResult.appliedRules,
      rtnYN: checkResult.rtnYN,
      rtnPause: checkResult.rtnPause,
      rtnMsgID: checkResult.rtnMsgID,
      rtnMsg: checkResult.rtnMsg,
      responseMessage,
      parsed,
      records: [rxRecord, txRecord],
    };

    this.workInStream$.next(result);
    return result;
  }
}

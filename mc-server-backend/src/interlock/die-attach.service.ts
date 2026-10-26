import { Injectable, Logger } from '@nestjs/common';
import { OracleService } from '../database/oracle.service';
import { TransactionRepository, TransactionRecord } from '../database/transaction.repository';
import { EquipmentRepository, EquipmentRecord } from '../database/equipment.repository';
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
  plant?: string;
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
   * Lấy thông tin bản ghi thiết bị từ cấu hình thật trong MIGHTY.GATEWAY_DEVICES và MIGHTY.ADM_EQUIPMENT
   */
  async resolveEquipmentRecord(
    parsedEquipment?: string,
    socketEquipmentId?: string
  ): Promise<EquipmentRecord | null> {
    const candidateIds = [socketEquipmentId, parsedEquipment]
      .map((id) => (id || '').trim())
      .filter((id, index, self) => id.length > 0 && id.toUpperCase() !== 'UNKNOWN' && self.indexOf(id) === index);

    if (candidateIds.length === 0) return null;

    try {
      // 1. Thử tìm theo ID chính xác trước trong Cache
      for (const id of candidateIds) {
        const direct = await this.equipmentRepo.findById(id);
        if (direct && direct.PLANT) return direct;
      }

      // 2. Thử tìm trong toàn bộ danh sách thiết bị
      const allDevices = await this.equipmentRepo.findAll();
      for (const id of candidateIds) {
        const upper = id.toUpperCase();
        const matched = allDevices.find(
          (d) =>
            d.EQUIPMENT_ID?.toUpperCase() === upper ||
            String(d.DEVICE_ID || '').toUpperCase() === upper ||
            d.EQUIPMENT_MAIN?.toUpperCase() === upper
        );
        if (matched && matched.PLANT) return matched;
      }

      // 2.1 Khớp mềm (loại bỏ khoảng trắng và ký tự phân cách)
      for (const id of candidateIds) {
        const norm = id.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (norm) {
          const partial = allDevices.find((d) => {
            const dNorm = (d.EQUIPMENT_ID || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            const descNorm = (d.DESCRIPTION || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            return dNorm === norm || dNorm.includes(norm) || norm.includes(dNorm) || descNorm.includes(norm);
          });
          if (partial && partial.PLANT) return partial;
        }
      }

      // 3. Nếu chưa tìm thấy trong cache và Oracle đang online, truy vấn trực tiếp DB
      if (!this.oracleService.isUsingFallback()) {
        for (const id of candidateIds) {
          const sql = `
            SELECT PLANT, EQUIPMENT_ID, DESCRIPTION, HOST_ADDRESS, HOST_PORT, 
                   TO_CHAR(DEVICE_ID) as DEVICE_ID, SERVER_NO, GROUP_NAME, EQUIPMENT_ORDER, 
                   EQUIPMENT_MAIN, ENABLE, FIELD_01, FIELD_02, FIELD_03, 
                   INTERLOCK_RECIPE, EQUIPMENT_MODEL, INTERLOCK_PARAM, INTERLOCK_TRACE
            FROM (
              SELECT PLANT, EQUIPMENT_ID, DESCRIPTION, HOST_ADDRESS, HOST_PORT, 
                     DEVICE_ID, SERVER_NO, GROUP_NAME, EQUIPMENT_ORDER, 
                     EQUIPMENT_MAIN, ENABLE, FIELD_01, FIELD_02, FIELD_03, 
                     INTERLOCK_RECIPE, EQUIPMENT_MODEL, INTERLOCK_PARAM, INTERLOCK_TRACE,
                     1 as PRIORITY
              FROM MIGHTY.GATEWAY_DEVICES 
              WHERE UPPER(EQUIPMENT_ID) = UPPER(:id) OR UPPER(DEVICE_ID) = UPPER(:id)
              UNION ALL
              SELECT PLANT, EQUIPMENT_ID, DESCRIPTION, '127.0.0.1' as HOST_ADDRESS, 5000 as HOST_PORT, 
                     '0' as DEVICE_ID, 1 as SERVER_NO, 'DEFAULT' as GROUP_NAME, 0 as EQUIPMENT_ORDER, 
                     EQUIPMENT_ID as EQUIPMENT_MAIN, 'YES' as ENABLE, '' as FIELD_01, '' as FIELD_02, '' as FIELD_03, 
                     'YES' as INTERLOCK_RECIPE, 'DEFAULT' as EQUIPMENT_MODEL, '' as INTERLOCK_PARAM, '' as INTERLOCK_TRACE,
                     2 as PRIORITY
              FROM MIGHTY.ADM_EQUIPMENT 
              WHERE UPPER(EQUIPMENT_ID) = UPPER(:id)
            )
            ORDER BY PRIORITY ASC
          `;
          const rows = await this.oracleService.executeQuery<EquipmentRecord>(sql, { id }, 'ITMVMES');
          if (rows && rows.length > 0 && rows[0].PLANT) {
            return rows[0];
          }
        }
      }
    } catch (err: any) {
      this.logger.debug(`Lỗi tìm bản ghi thiết bị: ${err.message}`);
    }

    return null;
  }

  /**
   * Ánh xạ tên thiết bị sang tên máy thực tế trong Database (ưu tiên ID từ kết nối Socket như cũ)
   */
  async resolveDbEquipmentName(parsedEquipment: string, socketEquipmentId?: string): Promise<string> {
    const equipRecord = await this.resolveEquipmentRecord(parsedEquipment, socketEquipmentId);
    if (equipRecord && equipRecord.EQUIPMENT_ID) {
      return equipRecord.EQUIPMENT_ID;
    }
    if (socketEquipmentId && socketEquipmentId.trim()) {
      return socketEquipmentId.trim();
    }
    return (parsedEquipment || '').trim() || 'UNKNOWN';
  }

  /**
   * Thực hiện gọi Oracle Stored Procedure MIGHTY.SEMI_RULE_INTERLOCK.P_EQPIF_RULE_INTERLOCK_MAIN
   */
  async verifyWorkIn(
    parsed: WorkInParseResult,
    dbEquipmentName: string,
    plant?: string
  ): Promise<{
    isValid: boolean;
    plant: string;
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

    // 1. Xác định đúng Plant theo cấu hình thiết bị
    let targetPlant = (plant || '').trim();
    if (!targetPlant) {
      const equipRecord = await this.resolveEquipmentRecord(parsed.equipment, dbEquipmentName);
      if (equipRecord && equipRecord.PLANT && equipRecord.PLANT.trim()) {
        targetPlant = equipRecord.PLANT.trim();
      }
    }

    // 2. Nếu thiết bị chưa có Plant trong cấu hình, tự động truy vấn tìm Plant theo Lot Number từ ASFC_LOT_STATUS
    if (!targetPlant && item.LOT_NUMBER && !this.oracleService.isUsingFallback()) {
      try {
        const lotPlantRows = await this.oracleService.executeQuery<{ PLANT: string }>(
          `SELECT plant FROM ASFC_LOT_STATUS WHERE lot_number = :lot AND in_active = 'Y' AND ROWNUM = 1`,
          { lot: item.LOT_NUMBER },
          'ITMVMES'
        );
        if (lotPlantRows && lotPlantRows.length > 0 && lotPlantRows[0].PLANT) {
          targetPlant = lotPlantRows[0].PLANT.trim();
          this.logger.log(`🔍 Tự động phát hiện Plant [${targetPlant}] từ bảng Lot cho thiết bị ${dbEquipmentName}`);
        }
      } catch (e: any) {
        this.logger.debug(`Không thể dò Plant từ Lot: ${e.message}`);
      }
    }

    // 3. Fallback an toàn nếu không tìm thấy ở bất cứ đâu
    if (!targetPlant) {
      targetPlant = 'ITMVIET';
    }

    this.logger.log(`🏭 Kiểm tra Interlock với Plant [${targetPlant}] tương ứng theo thiết bị ${dbEquipmentName}`);

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
      }>(sqlLot, { plant: targetPlant, lot: item.LOT_NUMBER }, 'ITMVMES');

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
      }>(sqlEquip, { plant: targetPlant, oper: operation, equip: dbEquipmentName }, 'ITMVMES');

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
          plant: targetPlant,
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
      ArgPlant: targetPlant,
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
      const isFallback = this.oracleService.isUsingFallback();
      const rtnYN = out.RtnYN || (isFallback ? 'NG' : 'NG');
      const rtnPause = out.RtnPause || 'N';
      const rtnMsgID = out.RtnMsgID || (isFallback ? 'EIF-OFFLINE' : 'EIF-COM02');
      const rtnMsg = out.RtnMsg || (isFallback
        ? 'Oracle database is offline. Fail-safe: Work-In rejected.'
        : 'Interlock verification failed: No response from MES procedure.');

      const isValid = (rtnYN || '').toUpperCase() === 'OK';

      // Nếu kết quả kiểm tra bị chặn (NG) hoặc cảnh báo, tự động ghi nhận vào BIZ_ILRULE_CHECK_HISTORY
      if (!isValid) {
        // Tìm rule_key chuẩn từ appliedRules (bảng BIZ_ILRULE_INFO)
        let resolvedRuleKey = 'RK20260121-0001';
        if (appliedRules && appliedRules.length > 0) {
          const byId = appliedRules.find((r) => r.ruleId === rtnMsgID);
          if (byId && byId.ruleKey) {
            resolvedRuleKey = byId.ruleKey;
          } else if (rtnMsg.toLowerCase().includes('unit') || rtnMsg.toLowerCase().includes('bcr') || rtnMsg.toLowerCase().includes('pcb')) {
            const unitRule = appliedRules.find((r) => r.ruleId === 'EIF-IR004');
            if (unitRule) resolvedRuleKey = unitRule.ruleKey;
          } else if (rtnMsg.toLowerCase().includes('lot') || rtnMsg.toLowerCase().includes('spin')) {
            const lotRule = appliedRules.find((r) => r.ruleId === 'EIF-IR001');
            if (lotRule) resolvedRuleKey = lotRule.ruleKey;
          } else if (rtnMsg.toLowerCase().includes('run_start') || rtnMsg.toLowerCase().includes('status')) {
            const equipRule = appliedRules.find((r) => r.ruleId === 'EIF-IR002');
            if (equipRule) resolvedRuleKey = equipRule.ruleKey;
          } else {
            resolvedRuleKey = appliedRules[0].ruleKey;
          }
        }

        await this.recordInterlockHistory(
          targetPlant,
          item.LOT_NUMBER || '',
          dbEquipmentName,
          operation,
          item.PCB_ID || '',
          parsed.rawMessage,
          rtnMsg,
          'N',
          undefined,
          resolvedRuleKey,
          {
            recipeId: item.RECIPE || 'ITMRecipe',
            transTime: transTime,
            eifDevice: item.CONFIG || '',
            transCode: 'EPBV',
            deviceStype: deviceStype,
            userId: dbEquipmentName,
          }
        );
      }

      return {
        isValid,
        plant: targetPlant,
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

      let fallbackRuleKey = 'RK20260121-0001';
      if (appliedRules && appliedRules.length > 0) {
        fallbackRuleKey = appliedRules[0].ruleKey;
      }

      // Đảm bảo lịch sử lỗi luôn được lưu vào Oracle DB kể cả khi SP ném Exception
      await this.recordInterlockHistory(
        targetPlant,
        item.LOT_NUMBER || '',
        dbEquipmentName,
        operation,
        item.PCB_ID || '',
        parsed.rawMessage,
        `Interlock verification error: ${err.message}`,
        'N',
        undefined,
        fallbackRuleKey,
        {
          recipeId: item.RECIPE || 'ITMRecipe',
          transTime: transTime,
          eifDevice: item.CONFIG || '',
          transCode: 'EPBV',
          deviceStype: deviceStype,
          userId: dbEquipmentName,
        }
      );

      // Báo lỗi thực tế từ hệ thống, không tự động chuyển thành OK
      return {
        isValid: false,
        plant: targetPlant,
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
    alarmStatus: 'Y' | 'N' = 'N',
    alarmId?: string,
    ruleKey?: string,
    details?: {
      recipeId?: string;
      transTime?: string;
      eifDevice?: string;
      transCode?: string;
      deviceStype?: string;
      userId?: string;
    }
  ): Promise<void> {
    try {
      const odb = this.oracleService.getOracledb();
      if (!odb || this.oracleService.isUsingFallback()) return;

      let targetPlant = (plant || '').trim();
      if (!targetPlant && equip) {
        const equipRecord = await this.resolveEquipmentRecord(equip);
        if (equipRecord && equipRecord.PLANT && equipRecord.PLANT.trim()) {
          targetPlant = equipRecord.PLANT.trim();
        }
      }
      if (!targetPlant) {
        targetPlant = 'ITMVIET';
      }

      // transTime chuẩn 14 ký tự YYYYMMDDHHmmss (ví dụ 20261023174143)
      const tTime = details?.transTime || new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

      // 1. Mã ALARM_ID chuẩn theo yêu cầu: ILARM + TRANSTIME rút gọn (YYMMDDHHmmss) -> ví dụ: ILARM261023174143
      const shortTransTime = tTime.length === 14 ? tTime.slice(2) : tTime;
      const finalAlarmId = alarmId && alarmId.startsWith('ILARM') ? alarmId : `ILARM${shortTransTime}`;

      // 2. Cột ALARM_STATUS luôn là 'N'
      const finalAlarmStatus = 'N';

      // 3. USER_ID là ID thiết bị
      const finalUserId = (details?.userId || equip || 'MC_SERVER').trim();

      // 4. TRANS_KEY_1 là devicestype của lot (ví dụ 'SSDB-5SA', 'S27')
      const transKey1 = (details?.deviceStype || 'ALL').trim();

      // 5. RULE_KEY lấy từ bảng BIZ_ILRULE_INFO (ví dụ 'RK20260121-0004', 'RK20260121-0001'...)
      const finalRuleKey = (ruleKey || 'RK20260121-0001').trim();

      // Định dạng chuỗi RECEIVE_MSG chuẩn theo hệ thống MES:
      // Mẫu chuẩn: Plant: ITMVIET, Trans Code: EPBV, Lot: 6431V, Oper: 200, Equip: XREFL012A, IDType: PCB, BCR ID: B3726504040042400182325, RecipeID: ON3-ON4-LANE1-R01, TransTime: 20261023174143, EIFDevice:SP4743C-N-A-BW
      let formattedReceiveMsg = (rawMsg || '').trim();
      if (!formattedReceiveMsg.startsWith('Plant:')) {
        const tCode = details?.transCode || 'EPBV';
        const recId = details?.recipeId || 'ITMRecipe';
        const eifDev = details?.eifDevice ? `, EIFDevice:${details.eifDevice}` : '';
        formattedReceiveMsg = `Plant: ${targetPlant}, Trans Code: ${tCode}, Lot: ${lot || ' '}, Oper: ${oper || ' '}, Equip: ${equip || ' '}, IDType: PCB, BCR ID: ${unitId || ' '}, RecipeID: ${recId}, TransTime: ${tTime}${eifDev}`;
      }

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
          :ruleKey, NVL(:lot, ' '), NVL(:transKey1, 'ALL'),
          NVL(:oper, ' '), 'DA', NVL(:equip, ' '),
          'PCB', NVL(:unitId, ' '),
          SUBSTR(:receiveMsg, 1, 4000), SUBSTR(:checkMsg, 1, 4000), :alarmId,
          :alarmStatus, SUBSTR(:userId, 1, 20), TO_CHAR(sysdate, 'yyyymmdd')
        )
      `;

      const rowsAffected = await this.oracleService.executeDml(
        sql,
        {
          plant: targetPlant,
          ruleKey: finalRuleKey,
          lot: lot || ' ',
          transKey1: transKey1,
          oper: oper || ' ',
          equip: equip || ' ',
          unitId: unitId || ' ',
          receiveMsg: formattedReceiveMsg,
          checkMsg: (checkMsg || ' ').trim(),
          alarmId: finalAlarmId,
          alarmStatus: finalAlarmStatus,
          userId: finalUserId,
        },
        'ITMVMES'
      );
      this.logger.log(`[Audit History] Đã lưu lịch sử Interlock (Plant: ${targetPlant}, RuleKey: ${finalRuleKey}, LotType: ${transKey1}, AlarmId: ${finalAlarmId}, User: ${finalUserId}) vào BIZ_ILRULE_CHECK_HISTORY (rows=${rowsAffected})`);
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
  async processWorkInMessage(
    rawStr: string,
    socketEquipmentId?: string,
    customPlant?: string
  ): Promise<WorkInCheckResult | null> {
    const parsed = this.parseWorkInMessage(rawStr);
    if (!parsed) {
      this.logger.warn(`Không thể phân tích bản tin Work-In: ${rawStr}`);
      return null;
    }

    const item = parsed.firstItem;
    const equipRecord = await this.resolveEquipmentRecord(parsed.equipment, socketEquipmentId);
    const dbEquipmentName = equipRecord?.EQUIPMENT_ID || await this.resolveDbEquipmentName(parsed.equipment, socketEquipmentId);
    const devicePlant = (customPlant || '').trim() || equipRecord?.PLANT?.trim() || 'ITMVIET';

    const nowStr = new Date().toISOString();
    this.logger.log(`📥 Receive From EQP : ${parsed.rawMessage.trim()}`);
    this.logger.log(
      `🔍 Parsing : Equipment=${parsed.equipment} (DB=${dbEquipmentName}, Plant=${devicePlant}), State=${parsed.state}, Div=${parsed.div.trim()}, Checksum=${parsed.checksum}`
    );

    // Thực hiện kiểm tra Interlock Rule trong Oracle DB theo đúng Plant của thiết bị
    const checkResult = await this.verifyWorkIn(parsed, dbEquipmentName, devicePlant);

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
        plant: checkResult.plant,
        summary: `Work-In Check: PCB=${item.PCB_ID}, Lot=${item.LOT_NUMBER}`,
      }),
    };
    await this.transactionRepo.logTransaction(rxRecord);

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
        plant: checkResult.plant,
        responseHeader: `${parsed.equipment} S051${parsed.div.trim()}`,
        responseData: {
          DATA: [
            {
              AUTHORITY: item.AUTHORITY || 'No AUTHORITY',
              ID: item.ID || 'No ID',
              LOT_NUMBER: item.LOT_NUMBER,
              EQUIPMENT: parsed.equipment,
              CONFIG: item.CONFIG,
              RECIPE: item.RECIPE,
              TRANS_TIME: item.TRANS_TIME,
              PCB_ID: item.PCB_ID,
              WORK_IN_RESULT: checkResult.isValid ? 'OK' : 'NG',
              WORK_IN_MSG: checkResult.rtnMsg,
            },
          ],
        },
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
      plant: checkResult.plant,
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

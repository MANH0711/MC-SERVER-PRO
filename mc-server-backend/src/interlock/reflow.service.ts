import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { OracleService } from '../database/oracle.service';
import { TransactionRepository, TransactionRecord } from '../database/transaction.repository';
import { EquipmentRepository } from '../database/equipment.repository';
import { DeviceFileLoggerService } from '../device-logs/device-file-logger.service';

export interface ReflowItem {
  REFLOW_START?: string;
  P_CONVEYOR_SP?: string;
  P_N2_PPM?: string;
  P_TEMP_TOP_Z1?: string;
  P_TEMP_BOTTOM_Z1?: string;
  P_TEMP_TOP_Z2?: string;
  P_TEMP_BOTTOM_Z2?: string;
  P_TEMP_TOP_Z3?: string;
  P_TEMP_BOTTOM_Z3?: string;
  P_TEMP_TOP_Z4?: string;
  P_TEMP_BOTTOM_Z4?: string;
  P_TEMP_TOP_Z5?: string;
  P_TEMP_BOTTOM_Z5?: string;
  P_TEMP_TOP_Z6?: string;
  P_TEMP_BOTTOM_Z6?: string;
  P_TEMP_TOP_Z7?: string;
  P_TEMP_BOTTOM_Z7?: string;
  P_TEMP_TOP_Z8?: string;
  P_TEMP_BOTTOM_Z8?: string;
  P_TEMP_TOP_Z9?: string;
  P_TEMP_BOTTOM_Z9?: string;
  P_TEMP_TOP_Z10?: string;
  P_TEMP_BOTTOM_Z10?: string;
  P_TEMP_TOP_Z11?: string;
  P_TEMP_BOTTOM_Z11?: string;
  P_TEMP_TOP_Z12?: string;
  P_TEMP_BOTTOM_Z12?: string;
  P_TEMP_TOP_Z13?: string;
  P_TEMP_BOTTOM_Z13?: string;
  P_TEMP_TOP_C1?: string;
  P_TEMP_BOTTOM_C1?: string;
  AUTHORITY?: string;
  ID?: string;
  LOT_NUMBER?: string;
  EQUIPMENT?: string;
  CONFIG?: string;
  TRANS_TIME?: string;
  PCB_ID?: string;
  RECIPE?: string;
  OPERATION?: string;
}

export interface ReflowPayload {
  DATA: ReflowItem[];
}

export interface ReflowParseResult {
  rawMessage: string;
  equipment: string;
  state: string; // 'S090' hoặc 'M001'
  div: string; // 'WORKIN        '
  payload?: ReflowPayload;
  firstItem?: ReflowItem;
  checksum?: string;
}

export interface ReflowCheckResult {
  isValid: boolean;
  equipment: string;
  dbEquipmentName: string;
  plant: string;
  lotNumber?: string;
  pcbId?: string;
  config?: string;
  recipe?: string;
  operation?: string;
  device?: string;
  deviceStype?: string;
  equipType?: string;
  equipGroup?: string;
  equipmentModel?: string;
  operGroup?: string;
  equipGroupVal?: string;
  scanHistoryTable?: string;
  scanHistoryInserted?: boolean;
  scanHistoryRows?: number;
  oldRowsUpdated?: number;
  scanHistorySql?: string;
  appliedRules?: any[];
  rtnYN?: string;
  rtnPause?: string;
  rtnMsgID?: string;
  rtnMsg?: string;
  pcbIdResult?: string; // 'OK' | 'NG'
  pcbIdMsg?: string;
  paramResult?: string; // 'OK' | 'NG'
  paramMsg?: string;
  responseMessage?: string;
  parsed?: ReflowParseResult;
  records?: TransactionRecord[];
}

@Injectable()
export class ReflowService {
  private readonly logger = new Logger(ReflowService.name);
  private readonly reflowStream$ = new Subject<ReflowCheckResult>();
  private static globalPlant: string = '';

  static setGlobalPlant(plant: string) {
    if (plant && plant.trim()) {
      ReflowService.globalPlant = plant.trim();
    }
  }

  static getGlobalPlant(): string {
    return ReflowService.globalPlant;
  }

  constructor(
    private readonly oracleService: OracleService,
    private readonly transactionRepo: TransactionRepository,
    private readonly equipmentRepo: EquipmentRepository,
    private readonly deviceFileLogger: DeviceFileLoggerService
  ) {}

  getReflowStream(): Observable<ReflowCheckResult> {
    return this.reflowStream$.asObservable();
  }

  /**
   * Nhận dạng chuỗi bản tin kiểm tra Work-In của thiết bị REFLOW (State S090 & WORKIN)
   */
  isReflowMessage(message: string): boolean {
    if (!message || typeof message !== 'string') return false;
    const clean = message.trim();
    return (
      (clean.includes('S090') || clean.includes('S091')) &&
      (clean.includes('WORKIN') || clean.includes('PCB_ID') || clean.includes('DATA'))
    );
  }

  /**
   * Nhận dạng chuỗi bản tin Heartbeat / Monitor M001 của thiết bị REFLOW
   * Ví dụ: REFLOW12AM001
   */
  isHeartbeatMessage(message: string): boolean {
    if (!message || typeof message !== 'string') return false;
    const clean = message.trim();
    return clean.includes('M001') && !clean.includes(';{');
  }

  /**
   * Phân tích và bóc tách các trường trong bản tin từ thiết bị REFLOW
   */
  parseReflowMessage(raw: string): ReflowParseResult | null {
    try {
      const trimmed = raw.trim();

      // Trường hợp 1: Bản tin Heartbeat M001
      if (this.isHeartbeatMessage(trimmed)) {
        const mIdx = trimmed.indexOf('M001');
        const eqp = trimmed.substring(0, mIdx).trim();
        return {
          rawMessage: raw,
          equipment: eqp,
          state: 'M001',
          div: '',
          checksum: '',
        };
      }

      // Trường hợp 2: Bản tin Work-In S090 có cấu trúc JSON
      const parts = trimmed.split(';');
      if (parts.length < 2) {
        return null;
      }

      // 1. Header: bóc tách chính xác khi EQP gửi viết liền ví dụ "REFLOW12AS090WORKIN        "
      const header = parts[0].trim();
      let equipment = '';
      let state = 'S090';
      let div = 'WORKIN        ';

      const stateIndex = header.indexOf('S090');
      if (stateIndex !== -1) {
        equipment = header.substring(0, stateIndex).trim();
        state = 'S090';
        const divRaw = header.substring(stateIndex + 4);
        div = divRaw.length > 0 ? divRaw : 'WORKIN        ';
      } else {
        const match = header.match(/^([^\s]+)\s+([A-Za-z0-9]{4})(.*)$/);
        if (match) {
          equipment = match[1].trim();
          state = match[2].toUpperCase().trim();
          div = match[3] && match[3].length > 0 ? match[3] : 'WORKIN        ';
        } else {
          return null;
        }
      }

      // 2. Body JSON
      const jsonStr = parts[1].trim();
      const payload: ReflowPayload = JSON.parse(jsonStr);

      if (!payload.DATA || !Array.isArray(payload.DATA) || payload.DATA.length === 0) {
        this.logger.warn(`Bản tin S090 không có mảng DATA hợp lệ: ${jsonStr}`);
        return null;
      }

      const firstItem = payload.DATA[0];
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
      this.logger.error(`Lỗi phân tích bản tin REFLOW: ${err.message}`);
      return null;
    }
  }

  /**
   * Xử lý bản tin Heartbeat / Monitor M001
   */
  async processHeartbeatMessage(rawStr: string, socketEquipmentId?: string): Promise<ReflowCheckResult | null> {
    const parsed = this.parseReflowMessage(rawStr);
    if (!parsed) return null;

    const equipRecord = await this.resolveEquipmentRecord(parsed.equipment, socketEquipmentId);
    const dbEquipmentName = equipRecord?.EQUIPMENT_ID || parsed.equipment;

    this.logger.log(`📥 Receive From EQP : ${rawStr.trim()}`);
    this.logger.log(`🔍 Parsing : Equipment=${parsed.equipment}, State=M001, Div=, Checksum=`);

    const rxRecord: TransactionRecord = {
      transactionId: `RX-HEARTBEAT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      equipmentId: dbEquipmentName,
      commandCode: 'M001',
      direction: 'RX',
      rawHex: Buffer.from(rawStr, 'ascii').toString('hex'),
      status: 'SUCCESS',
      durationMs: 0,
      payloadJson: JSON.stringify({ state: 'M001', equipment: parsed.equipment, dbEquipmentName }),
    };
    await this.transactionRepo.logTransaction(rxRecord);

    // Ghi tệp nhật ký D:\log\<EQUIPMENT_ID>\<yyyy-mm-dd>.log
    await this.deviceFileLogger.logEquipmentCycle({
      equipmentId: dbEquipmentName,
      receiveRaw: rawStr.trim(),
      parsingInfo: `Equipment=${parsed.equipment}, State=M001, Div=, Checksum=`,
    });

    return {
      isValid: true,
      equipment: parsed.equipment,
      dbEquipmentName,
      plant: equipRecord?.PLANT || 'ITMVIET',
      parsed,
      records: [rxRecord],
    };
  }

  /**
   * Ánh xạ thông tin thiết bị thực tế trong Database
   */
  async resolveEquipmentRecord(headerEquipName: string, socketEquipId?: string): Promise<any | null> {
    let eqpIdToFind = (socketEquipId && socketEquipId !== 'UNKNOWN') ? socketEquipId : headerEquipName;
    if (!eqpIdToFind) return null;

    if (!this.oracleService.isUsingFallback()) {
      try {
        const query = `
          SELECT EQUIPMENT_ID, EQUIPMENT_MODEL, PLANT
            FROM MIGHTY.GATEWAY_DEVICES
           WHERE UPPER(EQUIPMENT_ID) = UPPER(:eqp)
              OR UPPER(EQUIPMENT_ID) = UPPER(:alt)
              OR UPPER(EQUIPMENT_ID) LIKE UPPER(:likePattern)
           ORDER BY CASE 
             WHEN UPPER(EQUIPMENT_ID) = UPPER(:eqp) THEN 1
             WHEN UPPER(EQUIPMENT_ID) = UPPER(:alt) THEN 2
             ELSE 3
           END
           FETCH FIRST 1 ROWS ONLY
        `;
        const altName = headerEquipName.startsWith('REFLOW') ? headerEquipName.replace('REFLOW', 'XREFL0') : headerEquipName;
        const rows = await this.oracleService.executeQuery<any>(
          query,
          { eqp: eqpIdToFind, alt: altName, likePattern: `%${eqpIdToFind}%` },
          'ITMVMES'
        );
        if (rows && rows.length > 0) {
          return rows[0];
        }

        // Tìm thêm trong ADM_EQUIPMENT
        const admQuery = `
          SELECT EQUIPMENT_ID, MODEL AS EQUIPMENT_MODEL, PLANT
            FROM MIGHTY.ADM_EQUIPMENT
           WHERE UPPER(EQUIPMENT_ID) = UPPER(:eqp) OR UPPER(EQUIPMENT_ID) = UPPER(:alt)
           FETCH FIRST 1 ROWS ONLY
        `;
        const admRows = await this.oracleService.executeQuery<any>(
          admQuery,
          { eqp: eqpIdToFind, alt: altName },
          'ITMVMES'
        );
        if (admRows && admRows.length > 0) {
          return admRows[0];
        }
      } catch (e: any) {
        this.logger.debug(`Không tìm thấy cấu hình thiết bị ${eqpIdToFind} trong DB: ${e.message}`);
      }
    }

    // Default Fallback
    const resolvedId = headerEquipName.startsWith('REFLOW') ? headerEquipName.replace('REFLOW', 'XREFL0') : (eqpIdToFind || 'XREFL012A');
    return {
      EQUIPMENT_ID: resolvedId,
      EQUIPMENT_MODEL: 'REFLOW',
      PLANT: 'ITMVIET',
    };
  }

  /**
   * Định dạng chuỗi phản hồi S091 gửi lại máy REFLOW theo chuẩn định dạng EQP yêu cầu
   */
  formatReflowResponse(
    equipment: string,
    div: string,
    item: ReflowItem,
    isValid: boolean,
    rtnMsgID?: string,
    rtnMsg?: string
  ): string {
    const rawDiv = div && div.trim().length > 0 ? div.trim() : 'WORKIN';
    const formattedDiv = rawDiv.padEnd(14, ' ');
    const finalEquip = item.EQUIPMENT || equipment;

    const pcbIdResult = isValid ? 'OK' : 'NG';
    const pcbIdMsg = isValid
      ? '[EPBV001S] BarcodeVerification successfully completed.'
      : (rtnMsg || '[EPBV001F] Barcode verification rejected by Interlock rule.');
    const paramResult = 'OK';
    const paramMsg = '';

    const responsePayload = {
      DATA: [
        {
          AUTHORITY: item.AUTHORITY || 'OP',
          ID: item.ID || 'VM3193023',
          LOT_NUMBER: item.LOT_NUMBER || '',
          CONFIG: item.CONFIG || '',
          RECIPE: item.RECIPE || '',
          EQUIPMENT: finalEquip,
          TRANS_TIME: item.TRANS_TIME || '',
          PCB_ID: item.PCB_ID || '',
          PCB_ID_RESULT: pcbIdResult,
          PCB_ID_MSG: pcbIdMsg,
          PARAM_RESULT: paramResult,
          PARAM_MSG: paramMsg,
        },
      ],
    };

    const jsonFormatted = JSON.stringify(responsePayload, null, 2);
    return `${equipment}S091${formattedDiv};${jsonFormatted};${formattedDiv}`;
  }

  /**
   * Lưu lịch sử kiểm tra liên khóa khi bị lỗi (NG)
   */
  private async recordInterlockHistory(
    plant: string,
    lotNumber: string,
    equipId: string,
    oper: string,
    pcbId: string,
    rawMsg: string,
    errorMsg: string,
    checkResult: string = 'N',
    msgId: string = 'EIF-COM02',
    ruleKey: string = 'RK20262802-0010',
    extra?: {
      recipeId?: string;
      transTime?: string;
      eifDevice?: string;
      transCode?: string;
      deviceStype?: string;
      userId?: string;
    }
  ) {
    if (this.oracleService.isUsingFallback()) return;

    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timeStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const transTime = extra?.transTime || timeStr;

      const sql = `
        INSERT INTO MIGHTY.BIZ_ILRULE_CHECK_HISTORY (
          PLANT, LOT_NUMBER, EQUIPMENT_ID, OPERATION, BARCODE_ID,
          TRANS_TIME, CHECK_RESULT, ERROR_MSG, RAW_MESSAGE,
          CREATE_TIME, RULE_ID, RULE_KEY, RECIPE_ID, EIF_DEVICE,
          TRANS_CODE, DEVICE_STYPE, USER_ID
        ) VALUES (
          :plant, :lot, :equip, :oper, :barcode,
          :transTime, :checkResult, :errorMsg, :rawMsg,
          :createTime, :ruleId, :ruleKey, :recipeId, :eifDevice,
          :transCode, :deviceStype, :userId
        )
      `;

      await this.oracleService.executeQuery(
        sql,
        {
          plant,
          lot: lotNumber,
          equip: equipId,
          oper,
          barcode: pcbId,
          transTime,
          checkResult,
          errorMsg: errorMsg.substring(0, 1000),
          rawMsg: rawMsg.substring(0, 2000),
          createTime: timeStr,
          ruleId: msgId,
          ruleKey,
          recipeId: extra?.recipeId || 'ITMRecipe',
          eifDevice: extra?.eifDevice || '',
          transCode: extra?.transCode || 'EPBV',
          deviceStype: extra?.deviceStype || 'ALL',
          userId: extra?.userId || equipId,
        },
        'ITMVMES'
      );
    } catch (e: any) {
      this.logger.error(`Lỗi ghi lịch sử kiểm tra liên khóa REFLOW: ${e.message}`);
    }
  }

  /**
   * Lưu lịch sử scan thành công vào bảng AFA_SEMI_REFLOW_SCAN_HIS
   */
  private async recordScanHistoryOnSuccess(params: {
    plant: string;
    equipmentId: string;
    parsedEquipment: string;
    operation: string;
    device: string;
    deviceStype: string;
    lotNumber: string;
    pcbId: string;
    transTime: string;
    recipeId: string;
    eqpOpt05?: string;
  }): Promise<{
    tableName?: string;
    inserted?: boolean;
    rowsAffected?: number;
    sql?: string;
  }> {
    const tableName = 'MIGHTY.AFA_SEMI_REFLOW_SCAN_HIS';
    if (this.oracleService.isUsingFallback()) {
      return { tableName, inserted: true, rowsAffected: 1 };
    }

    try {
      const sql = `
        INSERT INTO ${tableName} (
          PLANT, EQUIPMENT_ID, EQUIPMENT_TYPE, EQUIPMENT_GROUP,
          OPERATION, BARCODE_TYPE, BARCODE_ID, LOT_NUMBER,
          TRANS_TIME, APPLY_FLAG, PROCESS_FLAG, REWORK_FLAG,
          START_TIME, END_TIME, PCB_ID, DEVICE,
          DEVICE_STYPE, RECIPE_ID, EQP_OPT_05
        ) VALUES (
          :plant, :equipId, 'SMT', 'REFLOW',
          :operation, 'PCB', :barcodeId, :lotNumber,
          :transTime, 'Y', 'O', 'N',
          :transTime, :transTime, :pcbId, :device,
          :deviceStype, :recipeId, :opt05
        )
      `;

      const binds = {
        plant: params.plant,
        equipId: params.equipmentId,
        operation: params.operation,
        barcodeId: params.pcbId,
        lotNumber: params.lotNumber,
        transTime: params.transTime,
        pcbId: params.pcbId,
        device: params.device,
        deviceStype: params.deviceStype,
        recipeId: params.recipeId,
        opt05: params.eqpOpt05 || 'No ID',
      };

      await this.oracleService.executeQuery(sql, binds, 'ITMVMES');
      this.logger.log(`✅ [Scan History] Đã lưu thành công vào bảng ${tableName} cho thiết bị ${params.equipmentId}, PCB: ${params.pcbId}`);
      return { tableName, inserted: true, rowsAffected: 1, sql };
    } catch (err: any) {
      this.logger.error(`[Scan History Insert Error] ${tableName}: ${err.message}`);
      return { tableName, inserted: false, rowsAffected: 0 };
    }
  }

  /**
   * Kiểm tra liên khóa nghiệp vụ cho bản tin Work-In của REFLOW
   */
  async verifyReflowWorkIn(
    parsed: ReflowParseResult,
    dbEquipmentName: string,
    plant: string
  ): Promise<ReflowCheckResult> {
    const item = parsed.firstItem || ({} as ReflowItem);
    let operation = item.OPERATION || '200';
    let deviceStype = 'ALL';
    let device = item.CONFIG || 'ALL';
    let equipGroup = 'REFLOW';
    let equipType = 'SMT';
    let appliedRules: any[] = [];

    const equipRecord = await this.resolveEquipmentRecord(parsed.equipment, dbEquipmentName);
    const equipModel = (equipRecord?.EQUIPMENT_MODEL || 'REFLOW').toUpperCase().trim();
    const isReflowModel = equipModel === 'REFLOW' || equipModel.includes('REFLOW') || equipModel.includes('REFL');

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

        if (diffMinutes > 15) {
          this.logger.warn(
            `[Time Sync] Thiết bị REFLOW ${dbEquipmentName} gửi TRANS_TIME (${transTime}) lệch ${Math.round(diffMinutes)} phút so với server (${systemTime}). Tự động dùng giờ hệ thống để gửi sang MES.`
          );
          transTime = systemTime;
        }
      } catch {
        transTime = systemTime;
      }
    }

    let targetPlant = (plant || ReflowService.getGlobalPlant() || equipRecord?.PLANT || 'ITMVIET').trim();

    // 1. KIỂM TRA MÃ LỆNH: Model REFLOW bắt buộc phải gửi mã lệnh S090
    const commandCode = (parsed.state || '').toUpperCase().trim();
    if (isReflowModel && commandCode !== 'S090') {
      const errorMsg = `Thiết bị model REFLOW chỉ chấp nhận mã lệnh chuẩn S090 (mã lệnh nhận được: ${commandCode || 'Không xác định'}).`;
      this.logger.warn(`❌ [Check Reflow Command Mismatch] ${errorMsg}`);

      await this.recordInterlockHistory(
        targetPlant,
        item.LOT_NUMBER || '',
        dbEquipmentName,
        operation,
        item.PCB_ID || '',
        parsed.rawMessage,
        errorMsg,
        'N',
        'EIF-CMD01',
        'RK20262802-0010'
      );

      return {
        isValid: false,
        equipment: parsed.equipment,
        dbEquipmentName,
        plant: targetPlant,
        operation,
        device,
        deviceStype,
        equipGroup,
        equipType,
        equipmentModel: equipModel,
        rtnYN: 'NG',
        rtnPause: 'N',
        rtnMsgID: 'EIF-CMD01',
        rtnMsg: errorMsg,
        pcbIdResult: 'NG',
        pcbIdMsg: errorMsg,
        paramResult: 'NG',
        paramMsg: errorMsg,
      };
    }

    // 2. LẤY THÔNG TIN TỪ ASFC_LOT_STATUS
    try {
      const sqlLot = `
        SELECT a.lot_number, a.device_stype, a.device, a.operation, a.plant
          FROM MIGHTY.ASFC_LOT_STATUS a
         WHERE a.lot_number = :lot AND a.in_active = 'Y' AND ROWNUM = 1
      `;
      const lotRows = await this.oracleService.executeQuery<any>(sqlLot, { lot: item.LOT_NUMBER }, 'ITMVMES');
      if (lotRows && lotRows.length > 0) {
        operation = (item as any).OPERATION || lotRows[0].OPERATION || '200';
        deviceStype = lotRows[0].DEVICE_STYPE || 'ALL';
        device = lotRows[0].DEVICE || item.CONFIG || 'ALL';
        if (lotRows[0].PLANT) targetPlant = lotRows[0].PLANT.trim();
      }
    } catch (e: any) {
      this.logger.debug(`Không tìm thấy lot info: ${e.message}`);
    }

    // 3. ĐỐI CHIẾU NHÓM CÔNG ĐOẠN VÀ THIẾT BỊ (EIF_OPER_GROUP & EIF_EQP_GROUP)
    let operGroup = 'SMT';
    let equipGroupVal = 'REFLOW';
    let equipTypeVal = 'SMT';

    if (!this.oracleService.isUsingFallback()) {
      try {
        const sqlEquip = `
          SELECT GROUP_CATEGORY, GROUP_VALUE  
            FROM MIGHTY.ADM_GROUP_CATEGORY_DATA 
           WHERE PLANT = :plant 
             AND GROUP_TARGET = 'EQUIPMENT' 
             AND GROUP_OBJECT = :equip 
             AND GROUP_INDEX IN ('12', '13')
        `;
        const equipRows = await this.oracleService.executeQuery<any>(sqlEquip, { plant: targetPlant, equip: dbEquipmentName }, 'ITMVMES');
        if (equipRows && equipRows.length > 0) {
          for (const row of equipRows) {
            if (row.GROUP_CATEGORY === 'EIF_EQP_GROUP') equipGroupVal = (row.GROUP_VALUE || '').trim();
            if (row.GROUP_CATEGORY === 'EIF_EQP_TYPE') equipTypeVal = (row.GROUP_VALUE || '').trim();
          }
        }
      } catch (e: any) {
        this.logger.debug(`Lỗi kiểm tra nhóm ADM_GROUP_CATEGORY_DATA: ${e.message}`);
      }
    }

    equipGroup = equipGroupVal || 'REFLOW';
    equipType = equipTypeVal || 'SMT';

    // 4. TRUY VẤN ĐỐI CHIẾU RULE TRONG BIZ_ILRULE_INFO: ƯU TIÊN GIÁ TRỊ CỤ THỂ TRƯỚC, NẾU KHÔNG CÓ MỚI ÁP DỤNG 'ALL'
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
            FROM MIGHTY.BIZ_ILRULE_INFO a
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
               CHECK_SQL_1,
               (P_GRP1 + P_GRP2 + P_GRP3 + P_GRP4) AS SPECIFICITY_SCORE
          FROM RANKED_RULES
         WHERE RN = 1
         ORDER BY SPECIFICITY_SCORE ASC, RULE_ID ASC
      `;
      const ruleRows = await this.oracleService.executeQuery<any>(
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
        appliedRules = ruleRows.map((r: any) => {
          const isSpecific =
            r.RULE_KEY_GROUP1 !== 'ALL' ||
            r.RULE_KEY_GROUP2 !== 'ALL' ||
            r.RULE_KEY_GROUP3 !== 'ALL' ||
            r.RULE_KEY_GROUP4 !== 'ALL';
          return {
            ruleId: r.RULE_ID,
            ruleKey: r.RULE_KEY,
            ruleKeyGroup1: r.RULE_KEY_GROUP1,
            ruleKeyGroup2: r.RULE_KEY_GROUP2,
            ruleKeyGroup3: r.RULE_KEY_GROUP3,
            ruleKeyGroup4: r.RULE_KEY_GROUP4,
            checkType: r.CHECK_TYPE,
            bindItem: r.BIND_ITEM,
            errorMsg: r.ERROR_MSG_E,
            isSpecific,
          };
        });
      }
    } catch (e: any) {
      this.logger.debug(`Lỗi đọc BIZ_ILRULE_INFO: ${e.message}`);
    }

    // 5. GỌI STORED PROCEDURE KIỂM TRA LIÊN KHÓA MES (P_EQPIF_RULE_INTERLOCK_MAIN)
    const odb = this.oracleService.getOracledb();
    const BIND_OUT = odb?.BIND_OUT || 3003;
    const STRING = odb?.STRING || 2001;

    const binds = {
      ArgPlant: targetPlant,
      ArgTrans: 'EPBV',
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
      const result = await this.oracleService.executeProcedure<any>(plsql, binds, 'ITMVMES');
      const out = result.outBinds || {};
      const rtnYN = (out.RtnYN || 'NG').toUpperCase();
      const rtnPause = out.RtnPause || 'N';
      const rtnMsgID = out.RtnMsgID || 'EIF-COM02';
      const rtnMsg = out.RtnMsg || 'Interlock rejected by MES procedure.';
      const isValid = rtnYN === 'OK';

      let scanHistoryResult: any = {};
      if (isValid) {
        scanHistoryResult = await this.recordScanHistoryOnSuccess({
          plant: targetPlant,
          equipmentId: dbEquipmentName,
          parsedEquipment: parsed.equipment,
          operation,
          device,
          deviceStype,
          lotNumber: item.LOT_NUMBER || '',
          pcbId: item.PCB_ID || '',
          transTime,
          recipeId: item.RECIPE || 'ITMRecipe',
          eqpOpt05: item.ID || 'No ID',
        });
      } else {
        await this.recordInterlockHistory(
          targetPlant,
          item.LOT_NUMBER || '',
          dbEquipmentName,
          operation,
          item.PCB_ID || '',
          parsed.rawMessage,
          rtnMsg,
          'N',
          rtnMsgID,
          'RK20262802-0010'
        );
      }

      return {
        isValid,
        equipment: parsed.equipment,
        dbEquipmentName,
        plant: targetPlant,
        lotNumber: item.LOT_NUMBER,
        pcbId: item.PCB_ID,
        config: item.CONFIG,
        recipe: item.RECIPE,
        operation,
        device,
        deviceStype,
        equipType,
        equipGroup,
        equipmentModel: equipModel,
        operGroup,
        equipGroupVal,
        scanHistoryTable: scanHistoryResult.tableName,
        scanHistoryInserted: scanHistoryResult.inserted,
        scanHistoryRows: scanHistoryResult.rowsAffected,
        scanHistorySql: scanHistoryResult.sql,
        appliedRules,
        rtnYN,
        rtnPause,
        rtnMsgID,
        rtnMsg,
        pcbIdResult: isValid ? 'OK' : 'NG',
        pcbIdMsg: isValid ? '[EPBV001S] BarcodeVerification successfully completed.' : rtnMsg,
        paramResult: 'OK',
        paramMsg: '',
      };
    } catch (err: any) {
      this.logger.error(`[Reflow SP Error] ${err.message}`);
      await this.recordInterlockHistory(
        targetPlant,
        item.LOT_NUMBER || '',
        dbEquipmentName,
        operation,
        item.PCB_ID || '',
        parsed.rawMessage,
        err.message,
        'N',
        'EIF-COM02',
        'RK20262802-0010'
      );

      return {
        isValid: false,
        equipment: parsed.equipment,
        dbEquipmentName,
        plant: targetPlant,
        operation,
        device,
        deviceStype,
        equipGroup,
        equipType,
        equipmentModel: equipModel,
        rtnYN: 'NG',
        rtnPause: 'N',
        rtnMsgID: 'EIF-COM02',
        rtnMsg: err.message,
        pcbIdResult: 'NG',
        pcbIdMsg: err.message,
        paramResult: 'NG',
        paramMsg: err.message,
      };
    }
  }

  /**
   * Xử lý trọn gói bản tin Work-In nhận từ socket hoặc REST test cho máy REFLOW
   */
  async processReflowMessage(
    rawStr: string,
    socketEquipmentId?: string,
    customPlant?: string
  ): Promise<ReflowCheckResult | null> {
    const parsed = this.parseReflowMessage(rawStr);
    if (!parsed) {
      this.logger.warn(`Không thể phân tích bản tin REFLOW: ${rawStr}`);
      return null;
    }

    if (parsed.state === 'M001') {
      return this.processHeartbeatMessage(rawStr, socketEquipmentId);
    }

    const item = parsed.firstItem || ({} as ReflowItem);
    const equipRecord = await this.resolveEquipmentRecord(parsed.equipment, socketEquipmentId);
    const dbEquipmentName = equipRecord?.EQUIPMENT_ID || parsed.equipment;
    const devicePlant = (customPlant || ReflowService.getGlobalPlant() || equipRecord?.PLANT || 'ITMVIET').trim();

    this.logger.log(`📥 Receive From EQP : ${parsed.rawMessage.trim()}`);
    this.logger.log(
      `🔍 Parsing : Equipment=${parsed.equipment}, State=S090, Div=${parsed.div.trim()}, Checksum=${parsed.checksum}`
    );

    const checkResult = await this.verifyReflowWorkIn(parsed, dbEquipmentName, devicePlant);

    // Ghi nhận transaction RX
    const rxRecord: TransactionRecord = {
      transactionId: `RX-REFLOW-${Date.now()}`,
      timestamp: new Date().toISOString(),
      equipmentId: dbEquipmentName,
      commandCode: 'S090',
      direction: 'RX',
      rawHex: Buffer.from(parsed.rawMessage, 'ascii').toString('hex'),
      status: 'SUCCESS',
      durationMs: 0,
      payloadJson: JSON.stringify({
        ...item,
        headerEquipment: parsed.equipment,
        dbEquipmentName,
        plant: checkResult.plant,
        summary: `Reflow Work-In Check: PCB=${item.PCB_ID}, Lot=${item.LOT_NUMBER}`,
      }),
    };
    await this.transactionRepo.logTransaction(rxRecord);

    const finalEquipName = parsed.equipment;
    if (item) {
      item.EQUIPMENT = finalEquipName;
    }

    // Format bản tin phản hồi S091
    const responseMessage = this.formatReflowResponse(
      finalEquipName,
      parsed.div,
      item,
      checkResult.isValid,
      checkResult.rtnMsgID,
      checkResult.rtnMsg
    );

    this.logger.log(`📤 Send to EQP  : ${dbEquipmentName}, S091`);
    this.logger.log(`💬 Send Message : ${responseMessage}`);

    // Ghi nhận transaction TX
    const txRecord: TransactionRecord = {
      transactionId: `TX-REFLOW-${Date.now()}`,
      timestamp: new Date().toISOString(),
      equipmentId: dbEquipmentName,
      commandCode: 'S091',
      direction: 'TX',
      rawHex: Buffer.from(responseMessage, 'ascii').toString('hex'),
      status: checkResult.isValid ? 'SUCCESS' : 'ERROR',
      durationMs: 0,
      payloadJson: JSON.stringify({
        isValid: checkResult.isValid,
        pcbIdResult: checkResult.pcbIdResult,
        pcbIdMsg: checkResult.pcbIdMsg,
        paramResult: checkResult.paramResult,
        paramMsg: checkResult.paramMsg,
        responseHeader: `${parsed.equipment}S091${parsed.div.trim()}`,
        responseMessage,
      }),
      errorMessage: checkResult.isValid ? undefined : checkResult.rtnMsg,
    };
    await this.transactionRepo.logTransaction(txRecord);

    // Ghi file log D:\log\<EQUIPMENT_ID>\<yyyy-mm-dd>.log
    await this.deviceFileLogger.logEquipmentCycle({
      equipmentId: dbEquipmentName,
      receiveRaw: rawStr.trim(),
      parsingInfo: `Equipment=${parsed.equipment}, State=S090, Div=${parsed.div.trim()}, Checksum=${parsed.checksum}`,
      sendToEqpSummary: `${dbEquipmentName}, S091`,
      sendMessageRaw: responseMessage.trim(),
      errorMsg: checkResult.isValid ? undefined : (checkResult.rtnMsg || 'Reflow Interlock Failed'),
    });

    const finalResult: ReflowCheckResult = {
      ...checkResult,
      responseMessage,
      records: [rxRecord, txRecord],
    };

    this.reflowStream$.next(finalResult);
    return finalResult;
  }
}

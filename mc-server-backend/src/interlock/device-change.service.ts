import { Injectable, Logger } from '@nestjs/common';
import { OracleService } from '../database/oracle.service';
import { TransactionRepository, TransactionRecord } from '../database/transaction.repository';
import { EquipmentRepository } from '../database/equipment.repository';
import { Subject, Observable } from 'rxjs';

export interface DeviceChangeParseResult {
  rawMessage: string;
  equipment: string;
  state: string; // 'S000'
  div: string;   // 'CONFIG'
  divRaw: string; // 'CONFIG        '
  deviceName: string; // 'SP4743D-N-A-BW'
  deviceType: string; // 'SEMI'
  checksum: string;
}

export interface DeviceChangeRuleCheckResult {
  isValid: boolean;
  ruleId: string;
  ruleKey?: string;
  activeFlag?: string;
  equipment: string;
  model: string;
  operation: string;
  equipGroup: string;
  deviceName: string;
  deviceType: string;
  errorMessage?: string;
  sql?: string;
  rawResponse?: string;
}

export interface DeviceChangeProcessResult {
  parsed: DeviceChangeParseResult;
  checkResult: DeviceChangeRuleCheckResult;
  responseMessage: string;
  records: [TransactionRecord, TransactionRecord]; // [RX, TX]
}

@Injectable()
export class DeviceChangeService {
  private readonly logger = new Logger(DeviceChangeService.name);
  private readonly deviceChangeStream$ = new Subject<DeviceChangeProcessResult>();

  constructor(
    private readonly oracleService: OracleService,
    private readonly transactionRepo: TransactionRepository,
    private readonly equipmentRepo: EquipmentRepository
  ) {}

  getDeviceChangeStream(): Observable<DeviceChangeProcessResult> {
    return this.deviceChangeStream$.asObservable();
  }

  /**
   * Nhận dạng chuỗi bản tin kiểm tra Device Change (State S000 & CONFIG)
   * Ví dụ: XNGM003  S000CONFIG        ;SP4743D-N-A-BW^SEMI;CONFIG        
   */
  isDeviceChangeMessage(message: string): boolean {
    if (!message || typeof message !== 'string') return false;
    const clean = message.trim();
    return clean.includes('S000') && clean.includes('CONFIG');
  }

  /**
   * Phân tích bóc tách các trường trong bản tin S000 từ thiết bị EQP
   */
  parseMessage(raw: string, fallbackEquipId?: string): DeviceChangeParseResult | null {
    try {
      const trimmed = raw.trim();
      const parts = trimmed.split(';');
      if (parts.length < 2) return null;

      // 1. Phân tích Header: ví dụ "XNGM003  S000CONFIG        "
      const header = parts[0];
      const s000Idx = header.indexOf('S000');
      if (s000Idx === -1) return null;

      let equipment = header.substring(0, s000Idx).trim();
      if (!equipment && fallbackEquipId) {
        equipment = fallbackEquipId.trim();
      }

      const state = 'S000';
      const divRaw = header.substring(s000Idx + 4) || 'CONFIG        ';
      const div = divRaw.trim() || 'CONFIG';

      // 2. Phân tích Body: ví dụ "SP4743D-N-A-BW^SEMI"
      let body = parts[1].trim();
      if (body.endsWith('@')) {
        body = body.slice(0, -1);
      }
      const tokens = body.split('^');
      const deviceName = (tokens[0] || '').trim();
      const deviceType = (tokens[1] || 'SEMI').trim();

      // 3. Phân tích Checksum/Trailer
      const checksum = parts[2] ? parts[2].trim() : 'CONFIG';

      return {
        rawMessage: raw,
        equipment: equipment || 'UNKNOWN',
        state,
        div,
        divRaw,
        deviceName,
        deviceType,
        checksum,
      };
    } catch (err: any) {
      this.logger.error(`Lỗi phân tích bản tin Device Change: ${err.message}`);
      return null;
    }
  }

  /**
   * Thẩm định quy tắc EIF-IR010 trong BIZ_ILRULE_INFO cho bất kỳ model thiết bị nào
   */
  async checkRuleIR010(params: {
    plant: string;
    equipmentId: string;
    deviceName: string;
    deviceType?: string;
  }): Promise<DeviceChangeRuleCheckResult> {
    const { plant, equipmentId, deviceName, deviceType = 'SEMI' } = params;

    // 1. Lấy thông tin Model, EQP Group, Operation của thiết bị qua In-Memory Caching
    const meta = await this.equipmentRepo.getEquipmentMetadata(plant, equipmentId);
    const model = meta.model;
    const oper = meta.operation;
    const equipGroup = meta.equipGroup;

    this.logger.log(`🔍 [EIF-IR010] Thẩm định quy tắc cho EQP [${equipmentId}], Model [${model}], Group [${equipGroup}], Oper [${oper}], Device [${deviceName}]`);

    // 2. Tìm quy tắc ứng viên EIF-IR010 từ BIZ_ILRULE_INFO theo thứ tự ưu tiên phân cấp
    const candidateSql = `
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
             a.ACTIVE_FLAG,
             CASE WHEN a.RULE_KEY_GROUP1 <> 'ALL' AND a.RULE_KEY_GROUP1 = :model THEN 0 ELSE 1 END AS P_GRP1,
             CASE WHEN a.RULE_KEY_GROUP2 <> 'ALL' AND a.RULE_KEY_GROUP2 = :oper  THEN 0 ELSE 1 END AS P_GRP2,
             CASE WHEN a.RULE_KEY_GROUP3 <> 'ALL' AND a.RULE_KEY_GROUP3 = :grp   THEN 0 ELSE 1 END AS P_GRP3,
             CASE WHEN a.RULE_KEY_GROUP4 <> 'ALL' AND a.RULE_KEY_GROUP4 = :equip THEN 0 ELSE 1 END AS P_GRP4
        FROM BIZ_ILRULE_INFO a
       WHERE a.PLANT = :plant
         AND a.TRANS_CODE = 'EDVC'
         AND a.RULE_TYPE = 'EIF'
         AND a.RULE_ID = 'EIF-IR010'
         AND a.RULE_KEY_GROUP1 IN (:model, 'ALL')
         AND a.RULE_KEY_GROUP2 IN (:oper, 'ALL')
         AND a.RULE_KEY_GROUP3 IN (:grp, 'ALL')
         AND a.RULE_KEY_GROUP4 IN (:equip, 'ALL')
       ORDER BY P_GRP1 ASC, P_GRP2 ASC, P_GRP3 ASC, P_GRP4 ASC, a.RULE_KEY DESC
    `;

    let matchedRule: any = null;
    try {
      const candidateRows = await this.oracleService.executeQuery<any>(
        candidateSql,
        { plant, model, oper, grp: equipGroup, equip: equipmentId },
        'ITMVMES'
      );
      if (candidateRows && candidateRows.length > 0) {
        matchedRule = candidateRows[0];
      }
    } catch (err: any) {
      this.logger.error(`Lỗi truy vấn candidate rules EIF-IR010: ${err.message}`);
    }

    // 3. Đánh giá quy tắc
    if (!matchedRule) {
      this.logger.log(`ℹ️ Không có cấu hình quy tắc EIF-IR010 cho thiết bị [${equipmentId}]. Mặc định thông qua.`);
      return {
        isValid: true,
        ruleId: 'EIF-IR010',
        equipment: equipmentId,
        model,
        operation: oper,
        equipGroup,
        deviceName,
        deviceType,
        errorMessage: undefined,
      };
    }

    const activeFlag = matchedRule.ACTIVE_FLAG || 'Y';
    const ruleKey = matchedRule.RULE_KEY;
    const checkSql = matchedRule.CHECK_SQL_1 || '';

    // Nếu quy tắc bị vô hiệu hóa (ACTIVE_FLAG = 'N') -> Cho qua (Bypass)
    if (activeFlag === 'N') {
      this.logger.log(`🟢 Quy tắc [${ruleKey}] (EIF-IR010) đang ở trạng thái INACTIVE (N). Tự động thông qua cho máy [${equipmentId}].`);
      return {
        isValid: true,
        ruleId: 'EIF-IR010',
        ruleKey,
        activeFlag: 'N',
        equipment: equipmentId,
        model,
        operation: oper,
        equipGroup,
        deviceName,
        deviceType,
        sql: checkSql,
      };
    }

    // Nếu quy tắc là SKIP CCS
    const cleanCheckSql = checkSql.trim().toUpperCase();
    if (
      matchedRule.ERROR_MSG_E === 'SKIP CCS' ||
      cleanCheckSql === "SELECT 'OK' LOT_CHECK FROM DUAL" ||
      cleanCheckSql === "SELECT 'OK' FROM DUAL"
    ) {
      this.logger.log(`🟢 Quy tắc [${ruleKey}] là SKIP CCS. Thông qua cho máy [${equipmentId}].`);
      return {
        isValid: true,
        ruleId: 'EIF-IR010',
        ruleKey,
        activeFlag: 'Y',
        equipment: equipmentId,
        model,
        operation: oper,
        equipGroup,
        deviceName,
        deviceType,
        sql: checkSql,
      };
    }

    // Kiểm tra trạng thái máy trong AEM_EQUIPMENT_STATUS
    // Thường câu lệnh check là:
    // SELECT CASE WHEN count(equipment_id) = 0 THEN 'NG' ELSE 'OK' END equipment_check 
    // FROM aem_equipment_status 
    // WHERE plant = :plant AND equipment_id = :equip AND event_id = 'CV_START' AND status_index = 1 AND status_value = :id
    try {
      const execResult = await this.oracleService.executeQuery<any>(
        checkSql,
        { plant, equip: equipmentId, id: deviceName },
        'ITMVMES'
      );

      const checkVal = execResult && execResult[0] ? Object.values(execResult[0])[0] : 'NG';
      if (checkVal === 'OK') {
        this.logger.log(`✅ Thiết bị [${equipmentId}] thỏa mãn kiểm tra EIF-IR010 (CV_START status_value = "${deviceName}")`);
        return {
          isValid: true,
          ruleId: 'EIF-IR010',
          ruleKey,
          activeFlag: 'Y',
          equipment: equipmentId,
          model,
          operation: oper,
          equipGroup,
          deviceName,
          deviceType,
          sql: checkSql,
        };
      } else {
        const rawErrMsg = matchedRule.ERROR_MSG_E || 'The Equipment(%s) Status is not in CV_START or is different from the device at CV_WAIT.';
        const formattedErrMsg = rawErrMsg.replace('%s', equipmentId).trim() + ` [${deviceName}]`;
        this.logger.warn(`❌ Thiết bị [${equipmentId}] vi phạm quy tắc EIF-IR010: ${formattedErrMsg}`);

        // Ghi nhận vào bảng BIZ_ILRULE_CHECK_HISTORY
        try {
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, '0');
          const sysTransTime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.${now.getMilliseconds()}000`;
          const transTimeShort = sysTransTime.substring(0, 14);
          const reportDate = sysTransTime.substring(0, 8);
          const alarmId = `ILARM${transTimeShort.substring(2)}`;

          await this.oracleService.executeQuery(
            `INSERT INTO MIGHTY.BIZ_ILRULE_CHECK_HISTORY (
              PLANT, SYS_TRANS_TIME, TRANS_TIME, RULE_KEY, TRANS_LOT,
              TRANS_KEY_1, TRANS_KEY_2, TRANS_KEY_3, TRANS_KEY_4,
              RECEIVE_MSG, CHECK_MSG, ALARM_ID, ALARM_STATUS, USER_ID, REPORT_DATE
            ) VALUES (
              :plant, :sysTransTime, :transTime, :ruleKey, ' ',
              :model, :oper, :equipGroup, :equipmentId,
              :receiveMsg, :checkMsg, :alarmId, 'N', :equipmentId, :reportDate
            )`,
            {
              plant,
              sysTransTime,
              transTime: transTimeShort,
              ruleKey,
              model,
              oper,
              equipGroup,
              equipmentId,
              receiveMsg: `Plant: ${plant}, Trans Code: EDVC, Lot: , Oper: ${oper}, Equip: ${equipmentId}, IDType: DEVICE, BCR ID: ${deviceName}, RecipeID: CONFIG, TransTime: ${transTimeShort}`,
              checkMsg: formattedErrMsg,
              alarmId,
              reportDate,
            },
            'ITMVMES'
          );
        } catch (hisErr: any) {
          this.logger.warn(`Không thể ghi log BIZ_ILRULE_CHECK_HISTORY: ${hisErr.message}`);
        }

        return {
          isValid: false,
          ruleId: 'EIF-IR010',
          ruleKey,
          activeFlag: 'Y',
          equipment: equipmentId,
          model,
          operation: oper,
          equipGroup,
          deviceName,
          deviceType,
          errorMessage: formattedErrMsg,
          sql: checkSql,
        };
      }
    } catch (sqlErr: any) {
      this.logger.error(`Lỗi thực thi SQL check EIF-IR010: ${sqlErr.message}`);
      return {
        isValid: false,
        ruleId: 'EIF-IR010',
        ruleKey,
        activeFlag: 'Y',
        equipment: equipmentId,
        model,
        operation: oper,
        equipGroup,
        deviceName,
        deviceType,
        errorMessage: `Lỗi SQL kiểm tra EIF-IR010: ${sqlErr.message}`,
        sql: checkSql,
      };
    }
  }

  /**
   * Xử lý trọn gói bản tin Device Change S000 nhận được từ TCP Socket thiết bị
   */
  async processDeviceChangeMessage(
    rawStr: string,
    fallbackEquipId?: string,
    customPlant?: string
  ): Promise<DeviceChangeProcessResult | null> {
    const parsed = this.parseMessage(rawStr, fallbackEquipId);
    if (!parsed) return null;

    const plant = customPlant || 'ITMVIET';
    const checkResult = await this.checkRuleIR010({
      plant,
      equipmentId: parsed.equipment,
      deviceName: parsed.deviceName,
      deviceType: parsed.deviceType,
    });

    // Định dạng ID thiết bị chuẩn 10 ký tự (padding dấu cách phía sau nếu ngắn hơn 10 ký tự)
    const eqpFormatted = parsed.equipment.padEnd(10, ' ');
    const divHeader = parsed.divRaw || 'CONFIG        ';

    let responseBody = '';
    if (checkResult.isValid) {
      responseBody = 'OK^[EDVC001S] Device Change successfully completed.';
    } else {
      responseBody = `NG^[EDVC001E] ${checkResult.errorMessage || 'Device Change check failed.'}`;
    }

    const responseMessage = `${eqpFormatted}S001${divHeader};${responseBody};${parsed.checksum || 'CONFIG'}        `;

    // 1. Ghi nhận giao dịch RX (S000)
    const rxRecord: TransactionRecord = {
      transactionId: `RX-S000-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      equipmentId: parsed.equipment,
      commandCode: 'S000',
      direction: 'RX',
      rawHex: Buffer.from(rawStr, 'ascii').toString('hex'),
      status: 'SUCCESS',
      durationMs: 0,
      payloadJson: JSON.stringify({
        messageType: 'DEVICE_CHANGE_INQUIRY',
        equipment: parsed.equipment,
        state: 'S000',
        div: parsed.div,
        deviceName: parsed.deviceName,
        deviceType: parsed.deviceType,
        rawMessage: rawStr,
      }),
    };
    await this.transactionRepo.logTransaction(rxRecord);

    // 2. Ghi nhận giao dịch TX (S001)
    const txRecord: TransactionRecord = {
      transactionId: `TX-S001-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      equipmentId: parsed.equipment,
      commandCode: 'S001',
      direction: 'TX',
      rawHex: Buffer.from(responseMessage, 'ascii').toString('hex'),
      status: checkResult.isValid ? 'SUCCESS' : 'ERROR',
      durationMs: 15,
      payloadJson: JSON.stringify({
        messageType: 'DEVICE_CHANGE_RESPONSE',
        equipment: parsed.equipment,
        state: 'S001',
        div: parsed.div,
        result: checkResult.isValid ? 'OK' : 'NG',
        responseCode: checkResult.isValid ? 'EDVC001S' : 'EDVC001E',
        responseMessage: responseBody,
        ruleCheck: checkResult,
        rawMessage: responseMessage,
      }),
      errorMessage: checkResult.isValid ? undefined : checkResult.errorMessage,
    };
    await this.transactionRepo.logTransaction(txRecord);

    const result: DeviceChangeProcessResult = {
      parsed,
      checkResult,
      responseMessage,
      records: [rxRecord, txRecord],
    };

    this.deviceChangeStream$.next(result);
    return result;
  }
}

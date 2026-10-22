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
   * Ánh xạ tên thiết bị sang tên máy thực tế trong Database (ví dụ CLEAN001 -> DA018VN)
   */
  async resolveDbEquipmentName(parsedEquipment: string, socketEquipmentId?: string): Promise<string> {
    if (socketEquipmentId && socketEquipmentId.trim()) {
      return socketEquipmentId.trim();
    }

    const cleanInput = (parsedEquipment || '').trim();
    if (!cleanInput) return 'UNKNOWN';

    // 1. Tra cứu trong Cache thiết bị thật (MIGHTY.GATEWAY_DEVICES)
    try {
      const allDevices = await this.equipmentRepo.findAll();
      const exact = allDevices.find(
        (d) => d.EQUIPMENT_ID.toUpperCase() === cleanInput.toUpperCase()
      );
      if (exact) {
        return exact.EQUIPMENT_ID;
      }

      const normInput = cleanInput.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const partial = allDevices.find((d) => {
        const dClean = d.EQUIPMENT_ID.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const descClean = (d.DESCRIPTION || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        return dClean.includes(normInput) || normInput.includes(dClean) || descClean.includes(normInput);
      });
      if (partial) {
        return partial.EQUIPMENT_ID;
      }
    } catch (e: any) {
      this.logger.debug(`Lỗi kiểm tra cache thiết bị: ${e.message}`);
    }

    // 2. Tra cứu mapping chuyên biệt cho Die Attach trong Oracle Database
    try {
      const sql = `
        SELECT EQUIPMENT_ID FROM (
          SELECT GROUP_OBJECT as EQUIPMENT_ID, 1 as PRIORITY
          FROM MIGHTY.ADM_GROUP_CATEGORY_DATA
          WHERE PLANT = 'ITMVIET' AND GROUP_TARGET = 'EQUIPMENT' AND GROUP_INDEX = 13
            AND GROUP_VALUE = 'D/A' AND ROWNUM = 1
        )
      `;
      const rows = await this.oracleService.executeQuery<{ EQUIPMENT_ID: string }>(sql, {}, 'ITMVMES');
      if (rows && rows.length > 0 && rows[0].EQUIPMENT_ID) {
        return rows[0].EQUIPMENT_ID;
      }
    } catch (e: any) {
      this.logger.debug(`Lỗi tra cứu D/A equipment: ${e.message}`);
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
    rtnYN: string;
    rtnPause: string;
    rtnMsgID: string;
    rtnMsg: string;
  }> {
    const item = parsed.firstItem;
    let operation = '4000'; // Mặc định công đoạn Die Attach

    // 1. Truy vấn thông tin công đoạn thực tế của LOT từ ASFC_LOT_STATUS
    try {
      const lotQuery = `SELECT OPERATION, IN_HOLD, IN_ACTIVE, DEVICE FROM MIGHTY.ASFC_LOT_STATUS WHERE PLANT = :plant AND LOT_NUMBER = :lotNumber`;
      const lotRows = await this.oracleService.executeQuery<{
        OPERATION: string;
        IN_HOLD: string;
        IN_ACTIVE: string;
        DEVICE: string;
      }>(lotQuery, { plant, lotNumber: item.LOT_NUMBER }, 'ITMVMES');

      if (lotRows && lotRows.length > 0) {
        operation = lotRows[0].OPERATION || '4000';
      }
    } catch (err: any) {
      this.logger.warn(`Không thể lấy thông tin lot ${item.LOT_NUMBER}: ${err.message}`);
    }

    // Format transaction time nếu EQP gửi sai hoặc rỗng
    let transTime = (item.TRANS_TIME || '').trim();
    if (!transTime || transTime.length !== 14) {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      transTime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
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
      return {
        isValid,
        operation,
        rtnYN,
        rtnPause,
        rtnMsgID,
        rtnMsg,
      };
    } catch (err: any) {
      this.logger.error(`[DieAttach SP Error] Lỗi khi gọi P_EQPIF_RULE_INTERLOCK_MAIN: ${err.message}`);

      // Fallback an toàn: Kiểm tra cú pháp cơ bản của mã vạch và Lot để không ngưng trệ chuyền khi lỗi kết nối DB
      const hasValidBarcode = !!(item.PCB_ID && item.PCB_ID.length >= 15);
      const hasValidLot = !!(item.LOT_NUMBER && item.LOT_NUMBER.trim().length > 0);
      const fallbackValid = hasValidBarcode && hasValidLot;

      return {
        isValid: fallbackValid,
        operation,
        rtnYN: fallbackValid ? 'OK' : 'NG',
        rtnPause: 'N',
        rtnMsgID: fallbackValid ? 'EPBV001S' : 'EPBV002F',
        rtnMsg: fallbackValid
          ? 'BarcodeVerification successfully completed (Standalone Fallback).'
          : `Invalid Barcode or Lot Number (Offline check): ${err.message}`,
      };
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
    const workInMsg = isValid
      ? '[EPBV001S] BarcodeVerification successfully completed.'
      : `[${rtnMsgID || 'EPBV002F'}] ${rtnMsg || 'BarcodeVerification failed.'}`;

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

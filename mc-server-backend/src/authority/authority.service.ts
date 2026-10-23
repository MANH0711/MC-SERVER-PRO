import { Injectable, Logger } from '@nestjs/common';
import { OracleService } from '../database/oracle.service';
import { TransactionRepository, TransactionRecord } from '../database/transaction.repository';
import { EquipmentRepository, EquipmentRecord } from '../database/equipment.repository';
import { Subject, Observable } from 'rxjs';

export interface AuthorityParseResult {
  rawMessage: string;
  equipment: string;
  state: string;
  div: string;
  userType: 'OP' | 'ME' | string;
  userId: string;
  extra?: string;
  checksum: string;
}

export interface AuthorityCheckResult {
  isValid: boolean;
  userType: string;
  userId: string;
  equipment: string;
  userInfo?: any;
  responseMessage: string;
  reason?: string;
  parsed: AuthorityParseResult;
  records?: [TransactionRecord, TransactionRecord];
}

@Injectable()
export class AuthorityService {
  private readonly logger = new Logger(AuthorityService.name);
  private readonly authorityStream$ = new Subject<AuthorityCheckResult>();

  constructor(
    private readonly oracleService: OracleService,
    private readonly transactionRepo: TransactionRepository,
    private readonly equipmentRepo: EquipmentRepository
  ) {}

  getAuthorityStream(): Observable<AuthorityCheckResult> {
    return this.authorityStream$.asObservable();
  }

  /**
   * Nhận dạng chuỗi bản tin kiểm tra tài khoản (State S002 & AUTHORITY)
   * Ví dụ: REFLOW12AS002AUTHORITY     ;OP^VM3193023^VM3193023@;AUTHORITY     
   */
  isAuthorityMessage(message: string): boolean {
    if (!message || typeof message !== 'string') return false;
    const clean = message.trim();
    return clean.includes('S002') && (clean.includes('AUTHORITY') || clean.includes('OP^') || clean.includes('ME^'));
  }

  /**
   * Phân tích bóc tách các trường trong bản tin từ thiết bị EQP
   */
  parseMessage(raw: string): AuthorityParseResult | null {
    try {
      const trimmed = raw.trim();
      const parts = trimmed.split(';');
      if (parts.length < 2) {
        return null;
      }

      // 1. Phân tích Header: ví dụ "REFLOW12AS002AUTHORITY     "
      const header = parts[0];
      const stateIndex = header.indexOf('S002');
      if (stateIndex === -1) {
        return null;
      }

      const equipment = header.substring(0, stateIndex).trim();
      const state = 'S002';
      // Giữ nguyên khoảng trắng của Div để khi phản hồi thiết bị nhận diện chuẩn
      const divRaw = header.substring(stateIndex + 4);
      const div = divRaw.length > 0 ? divRaw : 'AUTHORITY     ';

      // 2. Phân tích Body: ví dụ "OP^VM3193023^VM3193023@"
      let body = parts[1];
      if (body.endsWith('@')) {
        body = body.slice(0, -1);
      }
      const userTokens = body.split('^');
      const userType = (userTokens[0] || '').trim().toUpperCase();
      const userId = (userTokens[1] || '').trim();
      const extra = userTokens[2] ? userTokens[2].trim() : undefined;

      // 3. Phân tích Trailer/Checksum: ví dụ "AUTHORITY     "
      const checksum = parts[2] ? parts[2].trim() : 'AUTHORITY';

      return {
        rawMessage: raw,
        equipment,
        state,
        div,
        userType,
        userId,
        extra,
        checksum,
      };
    } catch (err: any) {
      this.logger.error(`Lỗi phân tích bản tin Authority: ${err.message}`);
      return null;
    }
  }

  /**
   * Truy vấn Oracle Database ADM_USER_INFO kiểm tra quyền tài khoản
   * Theo yêu cầu:
   * - Nếu OP^: SELECT * FROM ADM_USER_INFO WHERE PLANT = 'ITMVIET' AND USER_ID = :1 AND EXPAND_FLAG4 = 'N'
   * - Nếu ME^: SELECT * FROM ADM_USER_INFO WHERE PLANT = 'ITMVIET' AND USER_ID = :1 AND EXPAND_FLAG4 = 'Y'
   */
  async validateUserInDb(
    userType: string,
    userId: string,
    plant = 'ITMVIET'
  ): Promise<{ isValid: boolean; userInfo?: any; reason?: string }> {
    const typeUpper = userType.toUpperCase();
    let expandFlag = 'N';

    if (typeUpper === 'ME') {
      expandFlag = 'Y';
    } else if (typeUpper === 'OP') {
      expandFlag = 'N';
    } else {
      return {
        isValid: false,
        reason: 'Invalid user role',
      };
    }

    const sql = `SELECT * FROM ADM_USER_INFO WHERE PLANT = :plant AND USER_ID = :userId AND EXPAND_FLAG4 = :expandFlag`;

    try {
      // Ưu tiên chạy trên pool ITMVMES hoặc default pool
      const rows = await this.oracleService.executeQuery(
        sql,
        { plant, userId, expandFlag },
        'ITMVMES'
      );

      if (rows && rows.length > 0) {
        return {
          isValid: true,
          userInfo: rows[0],
        };
      } else {
        return {
          isValid: false,
          reason: 'User authorization failed',
        };
      }
    } catch (err: any) {
      // Log chi tiết nội bộ server để kỹ thuật viên xem, không trả ra ngoài để tránh lộ thông tin DB
      this.logger.error(`[DB Error Security] Lỗi truy vấn nội bộ: ${err.message}`);
      return {
        isValid: false,
        reason: 'System database unavailable',
      };
    }
  }

  /**
   * Tạo chuỗi phản hồi chuẩn S003 gửi về thiết bị EQP
   * Mẫu: REFLOW12AS003AUTHORITY     ;OK^[ELIS001S] Validation successfully completed.
   */
  formatResponse(equipment: string, div: string, isValid: boolean, reason?: string): string {
    const state = 'S003';
    // Đảm bảo padding div đồng nhất (thường 14 ký tự nếu là AUTHORITY)
    const formattedDiv = div || 'AUTHORITY     ';

    if (isValid) {
      return `${equipment}${state}${formattedDiv};OK^[ELIS001S] Validation successfully completed.`;
    } else {
      const msg = reason || 'Validation failed.';
      return `${equipment}${state}${formattedDiv};NG^[ELIS001F] ${msg}`;
    }
  }

  /**
   * Tìm kiếm bản ghi thiết bị từ cấu hình trong MIGHTY.GATEWAY_DEVICES và MIGHTY.ADM_EQUIPMENT
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
      for (const id of candidateIds) {
        const direct = await this.equipmentRepo.findById(id);
        if (direct && direct.PLANT) return direct;
      }

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
                     0 as DEVICE_ID, 1 as SERVER_NO, 'DEFAULT' as GROUP_NAME, 0 as EQUIPMENT_ORDER, 
                     EQUIPMENT_ID as EQUIPMENT_MAIN, 'Y' as ENABLE, '' as FIELD_01, '' as FIELD_02, '' as FIELD_03, 
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
    } catch (e: any) {
      this.logger.debug(`Lỗi kiểm tra cache thiết bị: ${e.message}`);
    }

    return null;
  }

  /**
   * Tra cứu và chuyển đổi tên máy sang đúng tên máy chính thức trên Database (GATEWAY_DEVICES / ADM_EQUIPMENT)
   */
  async resolveDbEquipmentName(parsedEquipment: string, socketEquipmentId?: string): Promise<string> {
    const equipRecord = await this.resolveEquipmentRecord(parsedEquipment, socketEquipmentId);
    if (equipRecord && equipRecord.EQUIPMENT_ID) {
      return equipRecord.EQUIPMENT_ID;
    }
    // 1. Ưu tiên cao nhất: Tên máy từ Socket kết nối thật (được định nghĩa trong GATEWAY_DEVICES)
    if (socketEquipmentId && socketEquipmentId.trim()) {
      return socketEquipmentId.trim();
    }

    const cleanInput = (parsedEquipment || '').trim();
    if (!cleanInput) return 'UNKNOWN';

    // 2. Tra cứu trong Cache thiết bị thật (MIGHTY.GATEWAY_DEVICES)
    try {
      const allDevices = await this.equipmentRepo.findAll();

      // 2.1 Khớp chính xác EQUIPMENT_ID
      const exact = allDevices.find(
        (d) => d.EQUIPMENT_ID.toUpperCase() === cleanInput.toUpperCase()
      );
      if (exact) {
        return exact.EQUIPMENT_ID;
      }

      // 2.2 Khớp gần đúng trong GATEWAY_DEVICES
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

    // 3. Tra cứu trực tiếp trong Oracle Database (GATEWAY_DEVICES & ADM_EQUIPMENT)
    try {
      const upper = cleanInput.toUpperCase();
      const normPattern = upper.replace('REFLOW', 'REFL');
      const matchNum = normPattern.match(/\d+[A-Z]?/);
      const numPart = matchNum ? matchNum[0] : '';

      const sql = `
        SELECT EQUIPMENT_ID FROM (
          SELECT EQUIPMENT_ID, 1 as PRIORITY FROM MIGHTY.GATEWAY_DEVICES WHERE UPPER(EQUIPMENT_ID) = :upper
          UNION ALL
          SELECT EQUIPMENT_ID, 2 as PRIORITY FROM MIGHTY.ADM_EQUIPMENT WHERE UPPER(EQUIPMENT_ID) = :upper
          UNION ALL
          SELECT EQUIPMENT_ID, 3 as PRIORITY FROM MIGHTY.ADM_EQUIPMENT WHERE UPPER(EQUIPMENT_ID) = 'X' || :normPattern
          UNION ALL
          SELECT EQUIPMENT_ID, 4 as PRIORITY FROM MIGHTY.ADM_EQUIPMENT WHERE UPPER(EQUIPMENT_ID) LIKE '%' || :normPattern || '%'
          UNION ALL
          SELECT EQUIPMENT_ID, 5 as PRIORITY FROM MIGHTY.ADM_EQUIPMENT WHERE UPPER(EQUIPMENT_ID) LIKE '%REFL%' AND UPPER(EQUIPMENT_ID) LIKE '%' || :numPart
          UNION ALL
          SELECT EQUIPMENT_ID, 6 as PRIORITY FROM MIGHTY.GATEWAY_DEVICES WHERE UPPER(EQUIPMENT_ID) LIKE '%' || :upper || '%'
        ) ORDER BY PRIORITY ASC
      `;
      const rows = await this.oracleService.executeQuery<{ EQUIPMENT_ID: string }>(
        sql,
        { upper, normPattern, numPart },
        'ITMVMES'
      );
      if (rows && rows.length > 0 && rows[0].EQUIPMENT_ID) {
        return rows[0].EQUIPMENT_ID;
      }
    } catch (e: any) {
      this.logger.debug(`Lỗi tra cứu tên máy trong DB: ${e.message}`);
    }

    // 4. Nếu không tìm thấy trong DB, fallback về tên nhận từ gói tin
    return cleanInput;
  }

  /**
   * Xử lý trọn gói bản tin nhận từ thiết bị EQP (hoặc qua REST test)
   */
  async processAuthorityMessage(rawStr: string, socketEquipmentId?: string): Promise<AuthorityCheckResult | null> {
    const parsed = this.parseMessage(rawStr);
    if (!parsed) {
      this.logger.warn(`Không thể phân tích bản tin Authority: ${rawStr}`);
      return null;
    }

    // Xác định đúng tên máy và Plant hiện tại trên DB
    const equipRecord = await this.resolveEquipmentRecord(parsed.equipment, socketEquipmentId);
    const dbEquipmentName = equipRecord?.EQUIPMENT_ID || await this.resolveDbEquipmentName(parsed.equipment, socketEquipmentId);
    const devicePlant = equipRecord?.PLANT?.trim() || 'ITMVIET';

    const nowStr = new Date().toISOString();
    // In log theo đúng chuẩn của hệ thống EQP
    this.logger.log(`📥 Receive From EQP : ${parsed.rawMessage.trim()}`);
    this.logger.log(
      `🔍 Parsing : Equipment=${parsed.equipment} (DB=${dbEquipmentName}, Plant=${devicePlant}), State=${parsed.state}, Div=${parsed.div.trim()}, Checksum=${parsed.checksum}`
    );

    // Ghi nhận transaction RX
    const rxRecord: TransactionRecord = {
      transactionId: `RX-AUTH-${Date.now()}`,
      timestamp: nowStr,
      equipmentId: dbEquipmentName,
      commandCode: 'S002',
      direction: 'RX',
      rawHex: Buffer.from(parsed.rawMessage, 'ascii').toString('hex'),
      status: 'SUCCESS',
      durationMs: 0,
      payloadJson: JSON.stringify({
        ...parsed,
        dbEquipmentName,
        plant: devicePlant,
        summary: `Check ${parsed.userType}^${parsed.userId}`,
      }),
    };
    await this.transactionRepo.logTransaction(rxRecord);

    // Kiểm tra DB quyền hạn người dùng theo đúng Plant của thiết bị
    const dbResult = await this.validateUserInDb(parsed.userType, parsed.userId, devicePlant);

    // Tạo phản hồi S003 với đúng tên máy hiện tại trên DB
    const responseMessage = this.formatResponse(
      dbEquipmentName,
      parsed.div,
      dbResult.isValid,
      dbResult.reason
    );

    this.logger.log(`📤 Send to EQP  : ${dbEquipmentName}, S003`);
    this.logger.log(`💬 Send Message : ${responseMessage}`);

    // Ghi nhận transaction TX
    const txRecord: TransactionRecord = {
      transactionId: `TX-AUTH-${Date.now()}`,
      timestamp: new Date().toISOString(),
      equipmentId: dbEquipmentName,
      commandCode: 'S003',
      direction: 'TX',
      rawHex: Buffer.from(responseMessage, 'ascii').toString('hex'),
      status: dbResult.isValid ? 'SUCCESS' : 'ERROR',
      durationMs: 0,
      payloadJson: JSON.stringify({
        isValid: dbResult.isValid,
        userInfo: dbResult.userInfo,
        reason: dbResult.reason,
        responseMessage,
        summary: dbResult.isValid ? `OK: ${dbResult.userInfo?.USER_NAME || parsed.userId}` : `NG: ${dbResult.reason || 'Failed'}`,
      }),
      errorMessage: dbResult.isValid ? undefined : dbResult.reason,
    };
    await this.transactionRepo.logTransaction(txRecord);

    const result: AuthorityCheckResult = {
      isValid: dbResult.isValid,
      userType: parsed.userType,
      userId: parsed.userId,
      equipment: dbEquipmentName,
      userInfo: dbResult.userInfo,
      responseMessage,
      reason: dbResult.reason,
      parsed,
      records: [rxRecord, txRecord],
    };

    this.authorityStream$.next(result);
    return result;
  }
}

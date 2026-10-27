import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { TransactionRepository, TransactionRecord } from '../database/transaction.repository';
import { EquipmentRepository } from '../database/equipment.repository';
import { FrameCodec } from '../protocol/frame.codec';
import { CommandDispatcher } from '../commands/router/command.dispatcher';
import { ChecksumUtils } from '../protocol/checksum.utils';
import { AuthorityService } from '../authority/authority.service';
import { DieAttachService } from '../interlock/die-attach.service';

export interface ManualCommandDto {
  equipmentId: string;
  commandCode: string;
  subCode?: number;
  payloadHex?: string;
}

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);
  private readonly transactionStream$ = new Subject<TransactionRecord>();
  private txCounter = 0;

  private generateTxId(prefix: 'TX' | 'RX'): string {
    this.txCounter = (this.txCounter + 1) % 1000000;
    return `${prefix}-${Date.now()}-${this.txCounter.toString().padStart(6, '0')}`;
  }

  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly equipmentRepo: EquipmentRepository,
    private readonly frameCodec: FrameCodec,
    private readonly commandDispatcher: CommandDispatcher,
    private readonly authorityService: AuthorityService,
    private readonly dieAttachService: DieAttachService
  ) {}

  getTransactionStream(): Observable<TransactionRecord> {
    return this.transactionStream$.asObservable();
  }

  async getRecentTransactions(
    equipmentId?: string,
    commandCode?: string,
    limit = 100
  ): Promise<TransactionRecord[]> {
    return await this.transactionRepo.getRecent(limit, equipmentId, commandCode);
  }

  /**
   * Xử lý gửi lệnh thủ công (Manual Command) từ UI FE xuống thiết bị và nhận phản hồi
   */
  async executeManualCommand(cmd: ManualCommandDto): Promise<{
    success: boolean;
    txRecord: TransactionRecord;
    rxRecord?: TransactionRecord;
    parsedResult?: any;
    errorMessage?: string;
  }> {
    const equipment = await this.equipmentRepo.findById(cmd.equipmentId);
    if (!equipment) {
      throw new Error(`Thiết bị không tồn tại: ${cmd.equipmentId}`);
    }

    const startTime = Date.now();
    const payloadBuffer = cmd.payloadHex
      ? ChecksumUtils.hexStringToBuffer(cmd.payloadHex)
      : Buffer.alloc(0);

    // 1. Đóng gói Frame nhị phân chuẩn TX
    const txBuffer = this.frameCodec.encode(
      equipment.DEVICE_ID,
      equipment.SERVER_NO,
      cmd.commandCode,
      cmd.subCode || 0,
      payloadBuffer
    );

    const txId = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const txRecord: TransactionRecord = {
      transactionId: txId,
      timestamp: new Date().toISOString(),
      equipmentId: equipment.EQUIPMENT_ID,
      commandCode: cmd.commandCode,
      direction: 'TX',
      rawHex: ChecksumUtils.bufferToHexString(txBuffer),
      status: 'SUCCESS',
      durationMs: 0,
      payloadJson: JSON.stringify({ manualTrigger: true, length: txBuffer.length }),
    };

    await this.transactionRepo.logTransaction(txRecord);
    this.transactionStream$.next(txRecord);

    // 2. Phân phối và thực thi qua CommandDispatcher (Hoạt động cho cả môi trường thật lẫn thiết bị ảo)
    const decodedTx = this.frameCodec.decode(txBuffer);
    if (!decodedTx) {
      return {
        success: false,
        txRecord,
        errorMessage: 'Không thể giải mã frame TX vừa đóng gói',
      };
    }

    const dispatchResult = await this.commandDispatcher.dispatch(decodedTx, equipment);
    const durationMs = Date.now() - startTime;

    // 3. Đóng gói RX Record
    let rxRecord: TransactionRecord | undefined;
    if (dispatchResult.responsePayload) {
      const rxBuffer = this.frameCodec.encode(
        equipment.DEVICE_ID,
        equipment.SERVER_NO,
        cmd.commandCode,
        0,
        dispatchResult.responsePayload
      );

      const rxId = `RX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      rxRecord = {
        transactionId: rxId,
        timestamp: new Date().toISOString(),
        equipmentId: equipment.EQUIPMENT_ID,
        commandCode: cmd.commandCode,
        direction: 'RX',
        rawHex: ChecksumUtils.bufferToHexString(rxBuffer),
        status: dispatchResult.success ? 'SUCCESS' : 'ERROR',
        durationMs,
        payloadJson: JSON.stringify(dispatchResult.parsedData || {}),
        errorMessage: dispatchResult.errorMessage,
      };

      await this.transactionRepo.logTransaction(rxRecord);
      this.transactionStream$.next(rxRecord);
    } else if (!dispatchResult.success) {
      // Khi lệnh thất bại (mã lệnh không tồn tại / không khớp model) và không có responsePayload
      const rxId = `RX-ERR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      rxRecord = {
        transactionId: rxId,
        timestamp: new Date().toISOString(),
        equipmentId: equipment.EQUIPMENT_ID,
        commandCode: cmd.commandCode,
        direction: 'RX',
        rawHex: '',
        status: 'ERROR',
        durationMs,
        payloadJson: JSON.stringify({ error: dispatchResult.errorMessage }),
        errorMessage: dispatchResult.errorMessage,
      };

      await this.transactionRepo.logTransaction(rxRecord);
      this.transactionStream$.next(rxRecord);
    }

    return {
      success: dispatchResult.success,
      txRecord,
      rxRecord,
      parsedResult: dispatchResult.parsedData,
      errorMessage: dispatchResult.errorMessage,
    };
  }

  /**
   * Tiếp nhận dữ liệu raw buffer từ TCP Socket nhận được từ máy ngoài xưởng
   */
  async handleIncomingRawBuffer(equipmentId: string, rawBuffer: Buffer): Promise<Buffer | null> {
    const rawStr = rawBuffer.toString('ascii');

    // 1. Kiểm tra nếu là bản tin kiểm tra tài khoản (Authority S002)
    if (this.authorityService.isAuthorityMessage(rawStr)) {
      const authResult = await this.authorityService.processAuthorityMessage(rawStr, equipmentId);
      if (authResult?.records) {
        authResult.records.forEach((r) => this.transactionStream$.next(r));
      }
      if (authResult?.responseMessage) {
        return Buffer.from(authResult.responseMessage, 'ascii');
      }
      return null;
    }

    // 2. Kiểm tra nếu là bản tin kiểm tra Work-In Interlock thiết bị Die Attach (State S050)
    if (this.dieAttachService.isWorkInMessage(rawStr)) {
      const workInResult = await this.dieAttachService.processWorkInMessage(rawStr, equipmentId);
      if (workInResult?.records) {
        workInResult.records.forEach((r) => this.transactionStream$.next(r));
      }
      if (workInResult?.responseMessage) {
        return Buffer.from(workInResult.responseMessage, 'ascii');
      }
      return null;
    }

    // 2b. Bắt các bản tin ASCII định dạng Interlock / Work-In nhưng dùng mã lệnh không hợp lệ (ví dụ S052 thay vì S050)
    if (rawStr.includes(';{"') || (rawStr.includes('WORKIN') && rawStr.includes('{')) || (rawStr.includes('PCB_ID') && rawStr.includes(';'))) {
      const headerPart = rawStr.split(';')[0]?.trim() || '';
      const match = headerPart.match(/^([^\s]+)\s+([A-Za-z0-9]{4})(.*)$/);
      const eqpName = match ? match[1] : equipmentId;
      const cmdCode = match ? match[2].toUpperCase() : 'S052';
      const divRaw = match && match[3] ? match[3] : 'WORKIN        ';

      const errorMessage = 'Mã lệnh này không tồn tại trong model thiết bị nào hãy kiểm tra lại thông tin';
      this.logger.warn(`⚠️ Nhận bản tin Interlock ASCII với mã lệnh không hỗ trợ [${cmdCode}] từ thiết bị [${equipmentId}]: ${rawStr.substring(0, 80)}...`);

      // Ghi nhận RX giao dịch lỗi
      const rxRecord: TransactionRecord = {
        transactionId: this.generateTxId('RX'),
        timestamp: new Date().toISOString(),
        equipmentId: eqpName || equipmentId,
        commandCode: cmdCode,
        direction: 'RX',
        rawHex: Buffer.from(rawStr, 'ascii').toString('hex'),
        status: 'ERROR',
        durationMs: 0,
        payloadJson: JSON.stringify({ rawMessage: rawStr, error: errorMessage }),
        errorMessage: `${errorMessage} (Mã lệnh: ${cmdCode}, chuẩn quy định: S050)`,
      };
      await this.transactionRepo.logTransaction(rxRecord);
      this.transactionStream$.next(rxRecord);

      // Đóng gói bản tin phản hồi lỗi chuẩn ASCII gửi lại cho socket máy EQP
      const responsePayload = {
        RESULT: 'NG',
        WORK_IN_RESULT: 'NG',
        WORK_IN_MSG: `${errorMessage} (Mã lệnh "${cmdCode}" không hợp lệ, chuẩn quy định: S050)`,
        DATA: [
          {
            PCB_ID: (rawStr.match(/"PCB_ID"\s*:\s*"([^"]+)"/) || [])[1] || '',
            LOT_NUMBER: (rawStr.match(/"LOT_NUMBER"\s*:\s*"([^"]+)"/) || [])[1] || '',
            EQUIPMENT: eqpName,
            WORK_IN_RESULT: 'NG',
            WORK_IN_MSG: errorMessage,
          },
        ],
      };
      const responseStr = `${eqpName} S051${divRaw};${JSON.stringify(responsePayload, null, 2)};${divRaw.trim() || 'WORKIN'}        `;

      const txRecord: TransactionRecord = {
        transactionId: this.generateTxId('TX'),
        timestamp: new Date().toISOString(),
        equipmentId: eqpName || equipmentId,
        commandCode: 'S051',
        direction: 'TX',
        rawHex: Buffer.from(responseStr, 'utf-8').toString('hex'),
        status: 'ERROR',
        durationMs: 0,
        payloadJson: JSON.stringify(responsePayload),
        errorMessage: `${errorMessage} (Mã lệnh: ${cmdCode})`,
      };
      await this.transactionRepo.logTransaction(txRecord);
      this.transactionStream$.next(txRecord);

      return Buffer.from(responseStr, 'utf-8');
    }

    const equipment = await this.equipmentRepo.findById(equipmentId);
    if (!equipment) return null;

    const frame = this.frameCodec.decode(rawBuffer);
    if (!frame) return null;

    // Ghi nhận RX
    const rxRecord: TransactionRecord = {
      transactionId: this.generateTxId('RX'),
      timestamp: new Date().toISOString(),
      equipmentId: equipment.EQUIPMENT_ID,
      commandCode: frame.commandCode,
      direction: 'RX',
      rawHex: frame.rawHex || ChecksumUtils.bufferToHexString(rawBuffer),
      status: 'SUCCESS',
      durationMs: 0,
    };
    await this.transactionRepo.logTransaction(rxRecord);
    this.transactionStream$.next(rxRecord);

    // Xử lý lệnh
    const result = await this.commandDispatcher.dispatch(frame, equipment);

    if (result.responsePayload) {
      const respBuffer = this.frameCodec.encode(
        equipment.DEVICE_ID,
        equipment.SERVER_NO,
        frame.commandCode,
        0,
        result.responsePayload
      );

      // Ghi nhận TX phản hồi
      const txRecord: TransactionRecord = {
        transactionId: this.generateTxId('TX'),
        timestamp: new Date().toISOString(),
        equipmentId: equipment.EQUIPMENT_ID,
        commandCode: frame.commandCode,
        direction: 'TX',
        rawHex: ChecksumUtils.bufferToHexString(respBuffer),
        status: result.success ? 'SUCCESS' : 'ERROR',
        durationMs: 0,
        payloadJson: JSON.stringify(result.parsedData || {}),
        errorMessage: result.errorMessage,
      };
      await this.transactionRepo.logTransaction(txRecord);
      this.transactionStream$.next(txRecord);

      return respBuffer;
    } else if (!result.success) {
      // Đóng gói frame phản hồi NAK (0x15) và thông báo lỗi cho thiết bị
      const errBuffer = Buffer.from(`\x15${result.errorMessage || 'ERROR'}`, 'utf-8');
      const respBuffer = this.frameCodec.encode(
        equipment.DEVICE_ID,
        equipment.SERVER_NO,
        frame.commandCode,
        0,
        errBuffer
      );

      const txRecord: TransactionRecord = {
        transactionId: this.generateTxId('TX'),
        timestamp: new Date().toISOString(),
        equipmentId: equipment.EQUIPMENT_ID,
        commandCode: frame.commandCode,
        direction: 'TX',
        rawHex: ChecksumUtils.bufferToHexString(respBuffer),
        status: 'ERROR',
        durationMs: 0,
        payloadJson: JSON.stringify({ error: result.errorMessage }),
        errorMessage: result.errorMessage,
      };
      await this.transactionRepo.logTransaction(txRecord);
      this.transactionStream$.next(txRecord);

      return respBuffer;
    }

    return null;
  }
}

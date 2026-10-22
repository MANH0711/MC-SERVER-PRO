import { Injectable, Logger } from '@nestjs/common';
import { OracleService } from './oracle.service';

export interface TransactionRecord {
  transactionId: string;
  timestamp: string;
  equipmentId: string;
  commandCode: string;
  direction: 'TX' | 'RX';
  rawHex: string;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  durationMs: number;
  payloadJson?: string;
  errorMessage?: string;
}

@Injectable()
export class TransactionRepository {
  private readonly logger = new Logger(TransactionRepository.name);
  private recentRecords: TransactionRecord[] = [];
  private readonly MAX_IN_MEMORY = 5000;
  private writeQueue: TransactionRecord[] = [];
  private isFlushing = false;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(private readonly oracleService: OracleService) {
    // Tự động đẩy dữ liệu ghi vào Oracle định kỳ mỗi 500ms để tối ưu hóa chịu tải cao
    this.flushTimer = setInterval(() => this.flushQueueToOracle(), 500);
  }

  async logTransaction(record: TransactionRecord): Promise<void> {
    // 1. Cập nhật RAM tức thì (O(1)) phục vụ hiển thị Realtime và API
    this.recentRecords.unshift(record);
    if (this.recentRecords.length > this.MAX_IN_MEMORY) {
      this.recentRecords.pop();
    }

    // 2. Đưa vào hàng đợi ghi DB bất đồng bộ (Non-blocking) để không làm nghẽn TCP Socket
    if (!this.oracleService.isUsingFallback()) {
      this.writeQueue.push(record);
      // Giới hạn hàng đợi tối đa tránh tràn RAM nếu DB treo
      if (this.writeQueue.length > 10000) {
        this.writeQueue.shift();
      }
    }
  }

  private async flushQueueToOracle(): Promise<void> {
    if (this.isFlushing || this.writeQueue.length === 0 || this.oracleService.isUsingFallback()) {
      return;
    }

    this.isFlushing = true;
    const batch = this.writeQueue.splice(0, 50); // Xử lý từng batch tối đa 50 records

    try {
      const sql = `
        INSERT INTO MC_TRANSACTION_LOG (
          TRANSACTION_ID, EQUIPMENT_ID, COMMAND_CODE, DIRECTION, 
          RAW_HEX, STATUS, DURATION_MS, PAYLOAD_JSON, ERROR_MESSAGE, CREATED_AT
        ) VALUES (
          :transactionId, :equipmentId, :commandCode, :direction, 
          :rawHex, :status, :durationMs, :payloadJson, :errorMessage, CURRENT_TIMESTAMP
        )
      `;

      // Thực thi tuần tự hoặc theo nhóm nhỏ trong batch
      for (const record of batch) {
        try {
          await this.oracleService.executeDml(sql, record);
        } catch (singleErr: any) {
          this.logger.debug(`Bỏ qua lỗi ghi transaction [${record.transactionId}]: ${singleErr.message}`);
        }
      }
    } catch (err: any) {
      this.logger.debug(`Không thể lưu batch transaction vào Oracle: ${err.message}`);
    } finally {
      this.isFlushing = false;
    }
  }

  async getRecent(limit = 100, equipmentId?: string, commandCode?: string): Promise<TransactionRecord[]> {
    let filtered = this.recentRecords;
    if (equipmentId) {
      filtered = filtered.filter(r => r.equipmentId === equipmentId);
    }
    if (commandCode) {
      filtered = filtered.filter(r => r.commandCode === commandCode);
    }
    return filtered.slice(0, limit);
  }
}

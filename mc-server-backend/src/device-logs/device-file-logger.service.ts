import { Injectable, Logger, Optional, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { EquipmentRepository } from '../database/equipment.repository';

export interface DeviceLogFileEntry {
  filePath: string;
  exists: boolean;
  sizeBytes: number;
  content: string;
  linesCount: number;
}

@Injectable()
export class DeviceFileLoggerService implements OnModuleInit {
  private readonly logger = new Logger(DeviceFileLoggerService.name);
  private readonly baseDir: string;

  constructor(
    @Optional()
    @Inject(forwardRef(() => EquipmentRepository))
    private readonly equipmentRepo?: EquipmentRepository,
  ) {
    // Mặc định lưu tại ổ D:\log, hoặc cấu hình qua biến môi trường LOG_STORAGE_DIR
    this.baseDir = process.env.LOG_STORAGE_DIR || 'D:\\log';
    this.ensureBaseDirectory();
  }

  /**
   * Khởi động: Đồng bộ và tạo sẵn thư mục D:\log\<EQUIPMENT_ID> cho tất cả thiết bị trong Database
   */
  async onModuleInit() {
    await this.syncDbEquipmentDirectories();
  }

  /**
   * Chuẩn hóa ID thiết bị theo đúng định dạng viết hoa chuẩn mực của Database:
   * Ví dụ: 'xngm003' -> 'XNGM003', 'wb161vn' -> 'WB161VN'
   */
  public normalizeEquipmentId(equipmentId: string): string {
    if (!equipmentId) return 'UNKNOWN';
    return equipmentId.trim().toUpperCase().replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  }

  /**
   * Đảm bảo thư mục gốc D:\log tồn tại
   */
  private ensureBaseDirectory(): void {
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
        this.logger.log(`📁 Đã khởi tạo thư mục lưu trữ log thiết bị tại: ${this.baseDir}`);
      }
    } catch (err: any) {
      this.logger.error(`Không thể tạo thư mục gốc log [${this.baseDir}]: ${err.message}`);
    }
  }

  /**
   * Quét toàn bộ thiết bị trong DB và tự động tạo thư mục D:\log\<EQUIPMENT_ID>
   */
  public async syncDbEquipmentDirectories(): Promise<string[]> {
    const createdList: string[] = [];
    if (!this.equipmentRepo) return createdList;

    try {
      const records = await this.equipmentRepo.findAll();
      for (const rec of records) {
        if (!rec.EQUIPMENT_ID) continue;
        const safeId = this.normalizeEquipmentId(rec.EQUIPMENT_ID);
        const equipDir = path.join(this.baseDir, safeId);
        if (!fs.existsSync(equipDir)) {
          fs.mkdirSync(equipDir, { recursive: true });
          createdList.push(safeId);
        }
      }
      if (createdList.length > 0) {
        this.logger.log(`📁 Đã khởi tạo thư mục D:\\log\\ cho ${createdList.length} thiết bị từ DB: ${createdList.join(', ')}`);
      }
    } catch (err: any) {
      this.logger.warn(`Không thể đồng bộ thư mục thiết bị DB: ${err.message}`);
    }

    return createdList;
  }

  /**
   * Format thời gian chuẩn theo mẫu log thiết bị:
   * YYYY-MM-DD-hh:mm:ss.fff AM/PM (ví dụ: 2026-10-31-03:51:10.728 AM)
   */
  public formatLogTimestamp(date: Date = new Date()): string {
    const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());

    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 thành 12
    const hh = pad(hours);
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    const fff = pad(date.getMilliseconds(), 3);

    return `${yyyy}-${mm}-${dd}-${hh}:${min}:${ss}.${fff} ${ampm}`;
  }

  /**
   * Lấy tên file log theo ngày (yyyy-mm-dd.log)
   */
  public getLogDateFileName(date: Date = new Date()): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.log`;
  }

  /**
   * Lấy đường dẫn file log tuyệt đối: D:\log\<equipmentId>\<yyyy-mm-dd>.log
   */
  public getEquipmentLogPath(equipmentId: string, dateStr?: string): string {
    const safeEquipId = this.normalizeEquipmentId(equipmentId);
    const fileName = dateStr ? (dateStr.endsWith('.log') ? dateStr : `${dateStr}.log`) : this.getLogDateFileName();
    return path.join(this.baseDir, safeEquipId, fileName);
  }

  /**
   * Ghi log đơn dòng vào file log của thiết bị
   */
  public async writeLogLine(equipmentId: string, action: string, content: string, customDate?: Date): Promise<void> {
    const date = customDate || new Date();
    const safeEquipId = this.normalizeEquipmentId(equipmentId);
    const equipDir = path.join(this.baseDir, safeEquipId);

    try {
      if (!fs.existsSync(equipDir)) {
        fs.mkdirSync(equipDir, { recursive: true });
      }

      const filePath = this.getEquipmentLogPath(safeEquipId, this.getLogDateFileName(date));
      const timeStr = this.formatLogTimestamp(date);
      const line = `${timeStr} : ${action} : ${content}\r\n`;

      await fs.promises.appendFile(filePath, line, 'utf8');
    } catch (err: any) {
      this.logger.error(`Lỗi ghi file log cho thiết bị [${equipmentId}]: ${err.message}`);
    }
  }

  /**
   * Ghi nhận đầy đủ 4 bước giao dịch chuẩn theo mẫu log thực tế của thiết bị:
   * 1. Receive From EQP : <rawStr>
   * 2. Parsing : Equipment=<id>, State=<state>, Div=<div>, Checksum=<chk>
   * 3. Send to EQP  : <id>, <respCmd>
   * 4. Send Message : <responseMsg>
   */
  public async logEquipmentCycle(params: {
    equipmentId: string;
    receiveRaw?: string;
    parsingInfo?: string;
    sendToEqpSummary?: string;
    sendMessageRaw?: string;
    errorMsg?: string;
    timestamp?: Date;
  }): Promise<void> {
    const { equipmentId, receiveRaw, parsingInfo, sendToEqpSummary, sendMessageRaw, errorMsg } = params;
    const date = params.timestamp || new Date();

    const safeEquipId = this.normalizeEquipmentId(equipmentId);
    const equipDir = path.join(this.baseDir, safeEquipId);

    try {
      if (!fs.existsSync(equipDir)) {
        fs.mkdirSync(equipDir, { recursive: true });
      }

      const filePath = this.getEquipmentLogPath(safeEquipId, this.getLogDateFileName(date));
      const lines: string[] = [];

      if (receiveRaw) {
        lines.push(`${this.formatLogTimestamp(date)} : Receive From EQP : ${receiveRaw}`);
      }
      if (parsingInfo) {
        lines.push(`${this.formatLogTimestamp(date)} : Parsing : ${parsingInfo}`);
      }
      if (sendToEqpSummary) {
        lines.push(`${this.formatLogTimestamp(date)} : Send to EQP  : ${sendToEqpSummary}`);
      }
      if (sendMessageRaw) {
        lines.push(`${this.formatLogTimestamp(date)} : Send Message : ${sendMessageRaw}`);
      }
      if (errorMsg) {
        lines.push(`${this.formatLogTimestamp(date)} : Error / Interlock NG : ${errorMsg}`);
      }

      if (lines.length > 0) {
        await fs.promises.appendFile(filePath, lines.join('\r\n') + '\r\n', 'utf8');
      }
    } catch (err: any) {
      this.logger.error(`Lỗi ghi log chu kỳ cho thiết bị [${equipmentId}]: ${err.message}`);
    }
  }

  /**
   * Lấy danh sách toàn bộ ID thiết bị:
   * Hợp nhất thiết bị từ Database Oracle (MIGHTY.GATEWAY_DEVICES) và các thư mục đang có tại D:\log
   */
  public async getLoggedEquipments(): Promise<string[]> {
    try {
      // 1. Quét thư mục vật lý trong D:\log
      let fsEquipments: string[] = [];
      if (fs.existsSync(this.baseDir)) {
        const entries = await fs.promises.readdir(this.baseDir, { withFileTypes: true });
        fsEquipments = entries
          .filter((e) => e.isDirectory())
          .map((e) => e.name.toUpperCase());
      }

      // 2. Lấy danh sách thiết bị thật từ Database
      let dbEquipments: string[] = [];
      if (this.equipmentRepo) {
        try {
          const records = await this.equipmentRepo.findAll();
          dbEquipments = records.map((r) => r.EQUIPMENT_ID.trim().toUpperCase());
        } catch (dbErr: any) {
          this.logger.warn(`Không thể lấy danh sách thiết bị từ DB: ${dbErr.message}`);
        }
      }

      // 3. Hợp nhất và loại bỏ trùng lặp
      const merged = Array.from(new Set([...dbEquipments, ...fsEquipments])).filter(Boolean).sort();
      return merged;
    } catch (err: any) {
      this.logger.error(`Lỗi đọc danh mục thiết bị từ D:\\log: ${err.message}`);
      return [];
    }
  }

  /**
   * Lấy danh sách các ngày có file log của một thiết bị (định dạng YYYY-MM-DD)
   */
  public async getLogDatesForEquipment(equipmentId: string): Promise<string[]> {
    const safeEquipId = this.normalizeEquipmentId(equipmentId);
    const equipDir = path.join(this.baseDir, safeEquipId);

    try {
      if (!fs.existsSync(equipDir)) return [];
      const files = await fs.promises.readdir(equipDir);
      return files
        .filter((f) => f.endsWith('.log'))
        .map((f) => f.replace(/\.log$/, ''))
        .sort()
        .reverse(); // Ngày mới nhất lên đầu
    } catch (err: any) {
      this.logger.error(`Lỗi đọc danh sách file log của thiết bị [${equipmentId}]: ${err.message}`);
      return [];
    }
  }

  /**
   * Đọc nội dung file log của thiết bị theo ngày
   */
  public async readLogContent(
    equipmentId: string,
    dateStr: string,
    tailLines = 1000
  ): Promise<DeviceLogFileEntry> {
    const safeEquipId = this.normalizeEquipmentId(equipmentId);
    const filePath = this.getEquipmentLogPath(safeEquipId, dateStr);

    try {
      if (!fs.existsSync(filePath)) {
        return {
          filePath,
          exists: false,
          sizeBytes: 0,
          content: '',
          linesCount: 0,
        };
      }

      const stat = await fs.promises.stat(filePath);
      const rawContent = await fs.promises.readFile(filePath, 'utf8');
      const lines = rawContent.split(/\r?\n/).filter(Boolean);

      const displayLines = tailLines && tailLines > 0 && lines.length > tailLines
        ? lines.slice(lines.length - tailLines)
        : lines;

      return {
        filePath,
        exists: true,
        sizeBytes: stat.size,
        content: displayLines.join('\r\n'),
        linesCount: lines.length,
      };
    } catch (err: any) {
      this.logger.error(`Lỗi đọc nội dung file log [${filePath}]: ${err.message}`);
      return {
        filePath,
        exists: false,
        sizeBytes: 0,
        content: `Lỗi đọc file: ${err.message}`,
        linesCount: 0,
      };
    }
  }
}

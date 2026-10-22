import { Injectable, Logger } from '@nestjs/common';
import { OracleService } from './oracle.service';

export interface EquipmentRecord {
  PLANT: string;
  HOST_ADDRESS: string;
  HOST_PORT: number;
  DEVICE_ID: string;
  SERVER_NO: number;
  EQUIPMENT_ID: string;
  GROUP_NAME: string;
  EQUIPMENT_ORDER: number;
  EQUIPMENT_MAIN: string;
  DESCRIPTION: string;
  ENABLE: string;
  FIELD_01: string;
  FIELD_02: string;
  FIELD_03: string;
  INTERLOCK_RECIPE: string;
  EQUIPMENT_MODEL: string;
  INTERLOCK_PARAM: string;
  INTERLOCK_TRACE: string;
  CREATED_AT?: string;
}

@Injectable()
export class EquipmentRepository {
  private readonly logger = new Logger(EquipmentRepository.name);

  // In-memory cache synced exclusively with real Oracle table MIGHTY.GATEWAY_DEVICES
  private inMemoryCache: Map<string, EquipmentRecord> = new Map();

  constructor(private readonly oracleService: OracleService) {
    // Đã xóa toàn bộ dữ liệu mock mặc định. Hệ thống chỉ lấy và lưu dữ liệu thật!
  }

  /**
   * Lấy toàn bộ danh sách thiết bị thật từ bảng MIGHTY.GATEWAY_DEVICES
   */
  async findAll(): Promise<EquipmentRecord[]> {
    if (!this.oracleService.isUsingFallback()) {
      try {
        const sql = `
          SELECT 
            PLANT, HOST_ADDRESS, HOST_PORT, TO_CHAR(DEVICE_ID) as DEVICE_ID, SERVER_NO, 
            EQUIPMENT_ID, GROUP_NAME, EQUIPMENT_ORDER, EQUIPMENT_MAIN, 
            DESCRIPTION, ENABLE, FIELD_01, FIELD_02, FIELD_03, 
            INTERLOCK_RECIPE, EQUIPMENT_MODEL, INTERLOCK_PARAM, INTERLOCK_TRACE,
            TO_CHAR(CREATED_AT, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as CREATED_AT
          FROM MIGHTY.GATEWAY_DEVICES
          ORDER BY EQUIPMENT_ORDER ASC, EQUIPMENT_ID ASC
        `;
        const rows = await this.oracleService.executeQuery<EquipmentRecord>(sql);
        if (rows) {
          this.inMemoryCache.clear();
          for (const row of rows) {
            this.inMemoryCache.set(row.EQUIPMENT_ID, row);
          }
          this.logger.log(`📥 Đã tải thành công ${rows.length} thiết bị thật từ MIGHTY.GATEWAY_DEVICES`);
          return rows;
        }
      } catch (err: any) {
        this.logger.warn(`Truy vấn Oracle MIGHTY.GATEWAY_DEVICES thất bại: ${err.message}`);
      }
    }

    return Array.from(this.inMemoryCache.values());
  }

  /**
   * Lấy chi tiết 1 thiết bị theo EQUIPMENT_ID
   */
  async findById(equipmentId: string): Promise<EquipmentRecord | null> {
    if (this.inMemoryCache.has(equipmentId)) {
      return this.inMemoryCache.get(equipmentId)!;
    }

    if (!this.oracleService.isUsingFallback()) {
      try {
        const sql = `
          SELECT 
            PLANT, HOST_ADDRESS, HOST_PORT, TO_CHAR(DEVICE_ID) as DEVICE_ID, SERVER_NO, 
            EQUIPMENT_ID, GROUP_NAME, EQUIPMENT_ORDER, EQUIPMENT_MAIN, 
            DESCRIPTION, ENABLE, FIELD_01, FIELD_02, FIELD_03, 
            INTERLOCK_RECIPE, EQUIPMENT_MODEL, INTERLOCK_PARAM, INTERLOCK_TRACE,
            TO_CHAR(CREATED_AT, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') as CREATED_AT
          FROM MIGHTY.GATEWAY_DEVICES
          WHERE EQUIPMENT_ID = :id
        `;
        const rows = await this.oracleService.executeQuery<EquipmentRecord>(sql, { id: equipmentId });
        if (rows && rows.length > 0) {
          this.inMemoryCache.set(equipmentId, rows[0]);
          return rows[0];
        }
      } catch (err: any) {
        this.logger.warn(`Truy vấn thiết bị ${equipmentId} từ Oracle thất bại: ${err.message}`);
      }
    }

    return null;
  }

  /**
   * Thêm mới hoặc cập nhật thiết bị vào bảng MIGHTY.GATEWAY_DEVICES (Primary Key: EQUIPMENT_ID)
   */
  async upsert(record: EquipmentRecord): Promise<EquipmentRecord> {
    this.inMemoryCache.set(record.EQUIPMENT_ID, record);

    if (!this.oracleService.isUsingFallback()) {
      try {
        const sql = `
          MERGE INTO MIGHTY.GATEWAY_DEVICES t
          USING (SELECT :EQUIPMENT_ID as EQUIPMENT_ID FROM dual) s
          ON (t.EQUIPMENT_ID = s.EQUIPMENT_ID)
          WHEN MATCHED THEN
            UPDATE SET 
              PLANT = :PLANT,
              HOST_ADDRESS = :HOST_ADDRESS,
              HOST_PORT = :HOST_PORT,
              DEVICE_ID = :DEVICE_ID,
              SERVER_NO = :SERVER_NO,
              GROUP_NAME = :GROUP_NAME,
              EQUIPMENT_ORDER = :EQUIPMENT_ORDER,
              EQUIPMENT_MAIN = :EQUIPMENT_MAIN,
              DESCRIPTION = :DESCRIPTION,
              ENABLE = :ENABLE,
              FIELD_01 = :FIELD_01,
              FIELD_02 = :FIELD_02,
              FIELD_03 = :FIELD_03,
              INTERLOCK_RECIPE = :INTERLOCK_RECIPE,
              EQUIPMENT_MODEL = :EQUIPMENT_MODEL,
              INTERLOCK_PARAM = :INTERLOCK_PARAM,
              INTERLOCK_TRACE = :INTERLOCK_TRACE
          WHEN NOT MATCHED THEN
            INSERT (
              PLANT, HOST_ADDRESS, HOST_PORT, DEVICE_ID, SERVER_NO, 
              EQUIPMENT_ID, GROUP_NAME, EQUIPMENT_ORDER, EQUIPMENT_MAIN, 
              DESCRIPTION, ENABLE, FIELD_01, FIELD_02, FIELD_03, 
              INTERLOCK_RECIPE, EQUIPMENT_MODEL, INTERLOCK_PARAM, INTERLOCK_TRACE,
              CREATED_AT
            )
            VALUES (
              :PLANT, :HOST_ADDRESS, :HOST_PORT, :DEVICE_ID, :SERVER_NO, 
              :EQUIPMENT_ID, :GROUP_NAME, :EQUIPMENT_ORDER, :EQUIPMENT_MAIN, 
              :DESCRIPTION, :ENABLE, :FIELD_01, :FIELD_02, :FIELD_03, 
              :INTERLOCK_RECIPE, :EQUIPMENT_MODEL, :INTERLOCK_PARAM, :INTERLOCK_TRACE,
              CURRENT_TIMESTAMP
            )
        `;
        await this.oracleService.executeDml(sql, {
          PLANT: record.PLANT || '',
          HOST_ADDRESS: record.HOST_ADDRESS || '',
          HOST_PORT: Number(record.HOST_PORT) || 0,
          DEVICE_ID: String(record.DEVICE_ID ?? '0'),
          SERVER_NO: Number(record.SERVER_NO) || 15,
          EQUIPMENT_ID: record.EQUIPMENT_ID,
          GROUP_NAME: record.GROUP_NAME || 'NET',
          EQUIPMENT_ORDER: Number(record.EQUIPMENT_ORDER) || 20110,
          EQUIPMENT_MAIN: record.EQUIPMENT_MAIN || '',
          DESCRIPTION: record.DESCRIPTION || '',
          ENABLE: record.ENABLE || 'YES',
          FIELD_01: record.FIELD_01 || '',
          FIELD_02: record.FIELD_02 || '',
          FIELD_03: record.FIELD_03 || '',
          INTERLOCK_RECIPE: record.INTERLOCK_RECIPE || '',
          EQUIPMENT_MODEL: record.EQUIPMENT_MODEL || '',
          INTERLOCK_PARAM: record.INTERLOCK_PARAM || '',
          INTERLOCK_TRACE: record.INTERLOCK_TRACE || '',
        });
        this.logger.log(`💾 Đã đồng bộ thiết bị ${record.EQUIPMENT_ID} vào MIGHTY.GATEWAY_DEVICES`);
      } catch (err: any) {
        this.logger.error(`Lỗi ghi nhận Oracle thiết bị ${record.EQUIPMENT_ID} vào MIGHTY.GATEWAY_DEVICES: ${err.message}`);
      }
    }

    return record;
  }

  /**
   * Xóa thiết bị khỏi bảng MIGHTY.GATEWAY_DEVICES theo EQUIPMENT_ID
   */
  async delete(equipmentId: string): Promise<boolean> {
    this.inMemoryCache.delete(equipmentId);

    if (!this.oracleService.isUsingFallback()) {
      try {
        await this.oracleService.executeDml(
          `DELETE FROM MIGHTY.GATEWAY_DEVICES WHERE EQUIPMENT_ID = :id`,
          { id: equipmentId }
        );
        this.logger.log(`🗑️ Đã xóa thiết bị ${equipmentId} khỏi MIGHTY.GATEWAY_DEVICES`);
      } catch (err: any) {
        this.logger.error(`Lỗi xóa thiết bị ${equipmentId} trên MIGHTY.GATEWAY_DEVICES: ${err.message}`);
      }
    }

    return true;
  }
}

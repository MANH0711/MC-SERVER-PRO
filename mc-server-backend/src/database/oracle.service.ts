import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ORACLE_TNS_CONFIGS, OracleTnsConfig } from '../config/oracle.config';

let oracledb: any = null;
try {
  // Dynamically load oracledb if available in environment
  oracledb = require('oracledb');
  if (oracledb) {
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    oracledb.autoCommit = true;

    // Enable Thick mode via Oracle Client to support password verifier 0x939 (Oracle 11g/12c)
    try {
      const clientLibDir = process.env.ORACLE_CLIENT_PATH || 'C:\\app\\client\\IT2-LAP-007\\product\\12.2.0\\client_2\\bin';
      oracledb.initOracleClient({ libDir: clientLibDir });
    } catch (clientErr: any) {
      // Ignore if already initialized
    }
  }
} catch {
  // Will run in in-memory fallback mode if native driver is not yet installed
}

@Injectable()
export class OracleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OracleService.name);
  private pools: Map<string, any> = new Map();
  private isFallbackMode = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initPools();
  }

  async onModuleDestroy() {
    await this.closeAllPools();
  }

  private async initPools() {
    if (!oracledb) {
      this.logger.warn('⚠️ Thư viện oracledb chưa được cài đặt hoặc thiếu Oracle Client. Kích hoạt chế độ In-Memory Simulation.');
      this.isFallbackMode = true;
      return;
    }

    const defaultTns = this.configService.get<string>('oracle.defaultTns') || 'ITMDEV';
    const config = ORACLE_TNS_CONFIGS[defaultTns];

    if (!config) {
      this.logger.warn(`Không tìm thấy cấu hình TNS cho ${defaultTns}. Chuyển sang In-Memory mode.`);
      this.isFallbackMode = true;
      return;
    }

    try {
      this.logger.log(`Đang khởi tạo Oracle Connection Pool cho TNS [${defaultTns}] (${config.host}:${config.port}/${config.serviceName})...`);
      const pool = await oracledb.createPool({
        poolAlias: defaultTns,
        user: config.user,
        password: config.password,
        connectString: `${config.host}:${config.port}/${config.serviceName}`,
        poolMin: config.poolMin,
        poolMax: config.poolMax,
        poolIncrement: config.poolIncrement,
        poolTimeout: config.poolTimeout,
      });
      this.pools.set(defaultTns, pool);
      this.logger.log(`✅ Kết nối thành công Oracle Pool: [${defaultTns}]`);
    } catch (err: any) {
      this.logger.warn(`⚠️ Không thể kết nối tới máy chủ Oracle thực tế (${err.message}). Kích hoạt bộ đệm In-Memory thông minh.`);
      this.isFallbackMode = true;
    }
  }

  public async executeQuery<T = any>(
    sql: string,
    binds: Record<string, any> | any[] = {},
    tnsName?: string
  ): Promise<T[]> {
    if (this.isFallbackMode) {
      return [];
    }

    const targetTns = tnsName || this.configService.get<string>('oracle.defaultTns') || 'ITMDEV';
    const pool = this.pools.get(targetTns);

    if (!pool) {
      throw new Error(`Oracle pool [${targetTns}] chưa được khởi tạo.`);
    }

    let connection: any;
    try {
      connection = await pool.getConnection();
      const result = await connection.execute(sql, binds);
      return (result.rows as T[]) || [];
    } catch (error: any) {
      this.logger.error(`Lỗi thực thi Oracle SQL trên [${targetTns}]: ${error.message}`);
      if (error.message.includes('NJS-510') || error.message.includes('timed out') || error.message.includes('ORA-')) {
        this.logger.warn(`⚠️ Máy chủ Oracle [${targetTns}] không thể kết nối. Tự động chuyển toàn bộ hệ thống sang In-Memory Cache.`);
        this.isFallbackMode = true;
      }
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeErr) {
          this.logger.error('Lỗi giải phóng kết nối Oracle:', closeErr);
        }
      }
    }
  }

  public async executeDml(
    sql: string,
    binds: Record<string, any> | any[] = {},
    tnsName?: string
  ): Promise<number> {
    if (this.isFallbackMode) {
      return 1;
    }

    const targetTns = tnsName || this.configService.get<string>('oracle.defaultTns') || 'ITMDEV';
    const pool = this.pools.get(targetTns);
    if (!pool) throw new Error(`Oracle pool [${targetTns}] không sẵn sàng.`);

    let connection: any;
    try {
      connection = await pool.getConnection();
      const result = await connection.execute(sql, binds, { autoCommit: true });
      return result.rowsAffected || 0;
    } finally {
      if (connection) await connection.close();
    }
  }

  public isUsingFallback(): boolean {
    return this.isFallbackMode;
  }

  public getTnsStatuses(): Record<string, {
    tnsName: string;
    host: string;
    port: number;
    serviceName: string;
    status: 'CONNECTED' | 'FALLBACK_CACHE' | 'STANDBY';
    isDefault: boolean;
  }> {
    const defaultTns = this.configService.get<string>('oracle.defaultTns') || 'ITMDEV';
    const result: Record<string, any> = {};

    for (const [key, cfg] of Object.entries(ORACLE_TNS_CONFIGS)) {
      const isPoolActive = this.pools.has(key);
      let status: 'CONNECTED' | 'FALLBACK_CACHE' | 'STANDBY' = 'STANDBY';
      if (this.isFallbackMode) {
        status = 'FALLBACK_CACHE';
      } else if (isPoolActive) {
        status = 'CONNECTED';
      }

      result[key] = {
        tnsName: cfg.tnsName,
        host: cfg.host,
        port: cfg.port,
        serviceName: cfg.serviceName,
        status,
        isDefault: key === defaultTns,
      };
    }
    return result;
  }

  private async closeAllPools() {
    for (const [name, pool] of this.pools.entries()) {
      try {
        await pool.close(10);
        this.logger.log(`Đã đóng kết nối Oracle Pool [${name}]`);
      } catch (err: any) {
        this.logger.error(`Lỗi khi đóng pool [${name}]:`, err.message);
      }
    }
    this.pools.clear();
  }
}

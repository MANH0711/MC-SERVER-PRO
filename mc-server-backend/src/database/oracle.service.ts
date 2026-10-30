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
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initPools();
    this.startHeartbeat();
  }

  async onModuleDestroy() {
    this.stopHeartbeat();
    await this.closeAllPools();
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
      if (this.pools.size === 0 || this.isFallbackMode) return;
      for (const [tnsName, pool] of this.pools.entries()) {
        try {
          const conn = await pool.getConnection();
          await conn.execute('SELECT 1 FROM DUAL');
          await conn.close();
        } catch (err: any) {
          this.logger.warn(`[Heartbeat] TNS [${tnsName}] ping thất bại (${err.message}). Đang tái tạo pool...`);
          try {
            await pool.close(5);
          } catch {}
          this.pools.delete(tnsName);
          await this.getOrCreatePool(tnsName);
        }
      }
    }, 45000); // 45 giây ping 1 lần
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private async initPools() {
    if (!oracledb) {
      this.logger.warn('⚠️ Thư viện oracledb chưa được cài đặt hoặc thiếu Oracle Client. Kích hoạt chế độ In-Memory Simulation.');
      this.isFallbackMode = true;
      return;
    }

    const defaultTns = this.configService.get<string>('oracle.defaultTns') || 'ITMVMES';
    await this.getOrCreatePool(defaultTns);
  }

  public async getOrCreatePool(targetTns: string): Promise<any> {
    if (!oracledb) {
      this.isFallbackMode = true;
      return null;
    }

    if (this.pools.has(targetTns)) {
      return this.pools.get(targetTns);
    }

    const config = ORACLE_TNS_CONFIGS[targetTns];
    if (!config || !config.password) {
      this.logger.warn(`Không tìm thấy cấu hình hoặc mật khẩu TNS cho [${targetTns}].`);
      return null;
    }

    try {
      this.logger.log(`Đang khởi tạo Oracle Connection Pool cho TNS [${targetTns}] (${config.host}:${config.port}/${config.serviceName})...`);
      const pool = await oracledb.createPool({
        poolAlias: targetTns,
        user: config.user,
        password: config.password,
        connectString: `${config.host}:${config.port}/${config.serviceName}`,
        poolMin: config.poolMin,
        poolMax: config.poolMax,
        poolIncrement: config.poolIncrement,
        poolTimeout: config.poolTimeout,
      });
      this.pools.set(targetTns, pool);
      this.isFallbackMode = false;
      this.logger.log(`✅ Kết nối thành công Oracle Pool: [${targetTns}]`);
      return pool;
    } catch (err: any) {
      this.logger.warn(`⚠️ Không thể kết nối tới Oracle TNS [${targetTns}] (${err.message}).`);
      return null;
    }
  }

  public async executeQuery<T = any>(
    sql: string,
    binds: Record<string, any> | any[] = {},
    tnsName?: string
  ): Promise<T[]> {
    if (this.isFallbackMode && this.pools.size === 0) {
      return [];
    }

    const targetTns = tnsName || this.configService.get<string>('oracle.defaultTns') || 'ITMVMES';
    let pool = await this.getOrCreatePool(targetTns);

    if (!pool) {
      if (this.isFallbackMode) return [];
      throw new Error(`Oracle pool [${targetTns}] chưa được khởi tạo và không thể kết nối.`);
    }

    let connection: any;
    try {
      connection = await pool.getConnection();
      const result = await connection.execute(sql, binds);
      return (result.rows as T[]) || [];
    } catch (error: any) {
      this.logger.error(`Lỗi thực thi Oracle SQL trên [${targetTns}]: ${error.message}`);
      const isConnError =
        error.message.includes('NJS-510') ||
        error.message.includes('timed out') ||
        error.message.includes('ORA-12541') ||
        error.message.includes('ORA-12170') ||
        error.message.includes('ORA-12514') ||
        error.message.includes('ORA-03113') ||
        error.message.includes('ORA-03114');

      if (isConnError) {
        this.logger.warn(`⚠️ Kết nối Oracle [${targetTns}] gặp sự cố mạng (${error.message}). Đang thử tái kết nối tự động...`);
        try {
          await pool.close(2);
        } catch {}
        this.pools.delete(targetTns);
        // Tái tạo pool và thử lại 1 lần duy nhất
        const newPool = await this.getOrCreatePool(targetTns);
        if (newPool) {
          let retryConn: any;
          try {
            retryConn = await newPool.getConnection();
            const retryResult = await retryConn.execute(sql, binds);
            return (retryResult.rows as T[]) || [];
          } finally {
            if (retryConn) await retryConn.close();
          }
        }
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
    if (this.isFallbackMode && this.pools.size === 0) {
      return 1;
    }

    const targetTns = tnsName || this.configService.get<string>('oracle.defaultTns') || 'ITMVMES';
    let pool = await this.getOrCreatePool(targetTns);
    if (!pool) {
      if (this.isFallbackMode) return 1;
      throw new Error(`Oracle pool [${targetTns}] không sẵn sàng.`);
    }

    let connection: any;
    try {
      connection = await pool.getConnection();
      const result = await connection.execute(sql, binds, { autoCommit: true });
      return result.rowsAffected || 0;
    } catch (error: any) {
      const isConnError =
        error.message.includes('NJS-510') ||
        error.message.includes('timed out') ||
        error.message.includes('ORA-03113') ||
        error.message.includes('ORA-03114');

      if (isConnError) {
        this.logger.warn(`⚠️ DML trên [${targetTns}] rớt kết nối. Đang tái tạo pool...`);
        try { await pool.close(2); } catch {}
        this.pools.delete(targetTns);
        const newPool = await this.getOrCreatePool(targetTns);
        if (newPool) {
          let retryConn: any;
          try {
            retryConn = await newPool.getConnection();
            const retryRes = await retryConn.execute(sql, binds, { autoCommit: true });
            return retryRes.rowsAffected || 0;
          } finally {
            if (retryConn) await retryConn.close();
          }
        }
      }
      throw error;
    } finally {
      if (connection) await connection.close();
    }
  }

  public getOracledb(): any {
    return oracledb;
  }

  public async executeProcedure<T = any>(
    sql: string,
    binds: Record<string, any> = {},
    tnsName?: string
  ): Promise<{ outBinds: T }> {
    if (this.isFallbackMode && this.pools.size === 0) {
      return { outBinds: {} as T };
    }

    const targetTns = tnsName || this.configService.get<string>('oracle.defaultTns') || 'ITMVMES';
    let pool = await this.getOrCreatePool(targetTns);
    if (!pool) {
      if (this.isFallbackMode) return { outBinds: {} as T };
      throw new Error(`Oracle pool [${targetTns}] chưa được khởi tạo.`);
    }

    let connection: any;
    try {
      connection = await pool.getConnection();
      const result = await connection.execute(sql, binds, { autoCommit: true });
      return { outBinds: (result.outBinds as T) || ({} as T) };
    } catch (error: any) {
      const isConnError =
        error.message.includes('NJS-510') ||
        error.message.includes('timed out') ||
        error.message.includes('ORA-03113') ||
        error.message.includes('ORA-03114');

      if (isConnError) {
        this.logger.warn(`⚠️ Procedure trên [${targetTns}] rớt kết nối. Đang tái tạo pool...`);
        try { await pool.close(2); } catch {}
        this.pools.delete(targetTns);
        const newPool = await this.getOrCreatePool(targetTns);
        if (newPool) {
          let retryConn: any;
          try {
            retryConn = await newPool.getConnection();
            const retryRes = await retryConn.execute(sql, binds, { autoCommit: true });
            return { outBinds: (retryRes.outBinds as T) || ({} as T) };
          } finally {
            if (retryConn) await retryConn.close();
          }
        }
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

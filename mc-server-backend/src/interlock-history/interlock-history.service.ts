import { Injectable, Logger } from '@nestjs/common';
import { OracleService } from '../database/oracle.service';

export interface IlruleHistoryRecord {
  PLANT: string;
  SYS_TRANS_TIME: string;
  TRANS_TIME: string;
  RULE_KEY: string;
  RULE_ID?: string;
  RULE_TYPE?: string;
  RULE_DESC?: string;
  ERROR_MSG_E?: string;
  TRANS_LOT: string;
  MODEL?: string;
  OPER?: string;
  PROCESS_STAGE?: string;
  EQUIP_ID: string;
  TRANS_UNIT_TYPE?: string;
  UNIT_ID?: string;
  RECEIVE_MSG?: string;
  CHECK_MSG?: string;
  ALARM_ID?: string;
  ALARM_STATUS?: string;
  USER_ID?: string;
  REPORT_DATE?: string;
}

export interface IlruleHistoryQueryParams {
  startDate?: string; // YYYYMMDD
  endDate?: string;   // YYYYMMDD
  plant?: string;
  equipId?: string;
  lotNumber?: string;
  unitId?: string;
  ruleKey?: string;
  alarmStatus?: 'ALL' | 'ACTIVE' | 'CLEARED' | 'NO_ALARM';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TopRuleStat {
  RULE_KEY: string;
  RULE_ID: string;
  RULE_DESC: string;
  VIOLATION_COUNT: number;
}

export interface TopEquipStat {
  EQUIP_ID: string;
  VIOLATION_COUNT: number;
}

export interface DailyTrendStat {
  REPORT_DATE: string;
  TOTAL: number;
  ACTIVE_ALARMS: number;
  CLEARED_ALARMS: number;
}

export interface IlruleHistoryStats {
  totalCount: number;
  alarmCount: number;
  activeAlarms: number;
  clearedAlarms: number;
  topRules: TopRuleStat[];
  topEquipments: TopEquipStat[];
  dailyTrend: DailyTrendStat[];
}

@Injectable()
export class InterlockHistoryService {
  private readonly logger = new Logger(InterlockHistoryService.name);

  constructor(private readonly oracleService: OracleService) {}

  /**
   * Truy vấn danh sách lịch sử kiểm tra Interlock Rule có phân trang & bộ lọc tối ưu
   */
  async getHistory(params: IlruleHistoryQueryParams): Promise<{
    data: IlruleHistoryRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(200, Math.max(10, Number(params.pageSize) || 25));
    const offset = (page - 1) * pageSize;

    const plant = params.plant || 'ITMVIET';
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const defaultEndDate = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;

    // Mặc định lùi 7 ngày
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const defaultStartDate = `${sevenDaysAgo.getFullYear()}${pad(sevenDaysAgo.getMonth() + 1)}${pad(sevenDaysAgo.getDate())}`;

    const startDate = (params.startDate || defaultStartDate).replace(/-/g, '');
    const endDate = (params.endDate || defaultEndDate).replace(/-/g, '');

    const whereClauses: string[] = ['h.PLANT = :plant'];
    const binds: Record<string, any> = { plant };

    if (startDate && endDate) {
      whereClauses.push('h.REPORT_DATE BETWEEN :startDate AND :endDate');
      binds.startDate = startDate;
      binds.endDate = endDate;
    } else if (startDate) {
      whereClauses.push('h.REPORT_DATE >= :startDate');
      binds.startDate = startDate;
    } else if (endDate) {
      whereClauses.push('h.REPORT_DATE <= :endDate');
      binds.endDate = endDate;
    }

    if (params.equipId && params.equipId.trim()) {
      whereClauses.push('UPPER(h.TRANS_KEY_4) LIKE :equipId');
      binds.equipId = `%${params.equipId.trim().toUpperCase()}%`;
    }

    if (params.lotNumber && params.lotNumber.trim()) {
      whereClauses.push('UPPER(h.TRANS_LOT) LIKE :lotNumber');
      binds.lotNumber = `%${params.lotNumber.trim().toUpperCase()}%`;
    }

    if (params.unitId && params.unitId.trim()) {
      whereClauses.push('UPPER(h.TRANS_UNIT) LIKE :unitId');
      binds.unitId = `%${params.unitId.trim().toUpperCase()}%`;
    }

    if (params.ruleKey && params.ruleKey.trim()) {
      whereClauses.push('(UPPER(h.RULE_KEY) LIKE :ruleKey OR UPPER(r.RULE_ID) LIKE :ruleKey)');
      binds.ruleKey = `%${params.ruleKey.trim().toUpperCase()}%`;
    }

    if (params.alarmStatus && params.alarmStatus !== 'ALL') {
      if (params.alarmStatus === 'ACTIVE') {
        whereClauses.push("h.ALARM_STATUS = 'N'");
      } else if (params.alarmStatus === 'CLEARED') {
        whereClauses.push("h.ALARM_STATUS = 'Y'");
      } else if (params.alarmStatus === 'NO_ALARM') {
        whereClauses.push('h.ALARM_ID IS NULL');
      }
    }

    if (params.search && params.search.trim()) {
      whereClauses.push('(UPPER(h.CHECK_MSG) LIKE :search OR UPPER(h.RECEIVE_MSG) LIKE :search)');
      binds.search = `%${params.search.trim().toUpperCase()}%`;
    }

    const whereSql = whereClauses.join(' AND ');

    const countSql = `
      SELECT COUNT(*) AS TOTAL
      FROM MIGHTY.BIZ_ILRULE_CHECK_HISTORY h
      LEFT JOIN MIGHTY.BIZ_ILRULE_INFO r ON h.RULE_KEY = r.RULE_KEY AND h.PLANT = r.PLANT
      WHERE ${whereSql}
    `;

    const dataSql = `
      SELECT 
        h.PLANT,
        h.SYS_TRANS_TIME,
        h.TRANS_TIME,
        h.RULE_KEY,
        r.RULE_ID,
        r.RULE_TYPE,
        r.RULE_DESC,
        r.ERROR_MSG_E,
        h.TRANS_LOT,
        h.TRANS_KEY_1 AS MODEL,
        h.TRANS_KEY_2 AS OPER,
        h.TRANS_KEY_3 AS PROCESS_STAGE,
        h.TRANS_KEY_4 AS EQUIP_ID,
        h.TRANS_UNIT_TYPE,
        h.TRANS_UNIT AS UNIT_ID,
        h.RECEIVE_MSG,
        h.CHECK_MSG,
        h.ALARM_ID,
        h.ALARM_STATUS,
        h.USER_ID,
        h.REPORT_DATE
      FROM MIGHTY.BIZ_ILRULE_CHECK_HISTORY h
      LEFT JOIN MIGHTY.BIZ_ILRULE_INFO r ON h.RULE_KEY = r.RULE_KEY AND h.PLANT = r.PLANT
      WHERE ${whereSql}
      ORDER BY h.SYS_TRANS_TIME DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    try {
      const [countResult, rowsResult] = await Promise.all([
        this.oracleService.executeQuery<{ TOTAL: number }>(countSql, binds, 'ITMVMES'),
        this.oracleService.executeQuery<IlruleHistoryRecord>(
          dataSql,
          { ...binds, offset, limit: pageSize },
          'ITMVMES'
        ),
      ]);

      const total = countResult[0]?.TOTAL || 0;
      return {
        data: rowsResult || [],
        total,
        page,
        pageSize,
      };
    } catch (err: any) {
      this.logger.error(`Lỗi truy vấn BIZ_ILRULE_CHECK_HISTORY: ${err.message}`, err.stack);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
      };
    }
  }

  /**
   * Thống kê KPI, Top Rules, Top Equipments và Daily Trend
   */
  async getStats(params: IlruleHistoryQueryParams): Promise<IlruleHistoryStats> {
    const plant = params.plant || 'ITMVIET';
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const defaultEndDate = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const defaultStartDate = `${sevenDaysAgo.getFullYear()}${pad(sevenDaysAgo.getMonth() + 1)}${pad(sevenDaysAgo.getDate())}`;

    const startDate = (params.startDate || defaultStartDate).replace(/-/g, '');
    const endDate = (params.endDate || defaultEndDate).replace(/-/g, '');

    const baseWhere = ['h.PLANT = :plant', 'h.REPORT_DATE BETWEEN :startDate AND :endDate'];
    const binds: Record<string, any> = { plant, startDate, endDate };

    if (params.equipId && params.equipId.trim()) {
      baseWhere.push('UPPER(h.TRANS_KEY_4) LIKE :equipId');
      binds.equipId = `%${params.equipId.trim().toUpperCase()}%`;
    }

    const whereSql = baseWhere.join(' AND ');

    // 1. Tổng quát
    const summarySql = `
      SELECT 
        COUNT(*) AS TOTAL_COUNT,
        COUNT(CASE WHEN h.ALARM_ID IS NOT NULL THEN 1 END) AS ALARM_COUNT,
        COUNT(CASE WHEN h.ALARM_STATUS = 'N' THEN 1 END) AS ACTIVE_ALARMS,
        COUNT(CASE WHEN h.ALARM_STATUS = 'Y' THEN 1 END) AS CLEARED_ALARMS
      FROM MIGHTY.BIZ_ILRULE_CHECK_HISTORY h
      WHERE ${whereSql}
    `;

    // 2. Top 5 Rules vi phạm
    const topRulesSql = `
      SELECT * FROM (
        SELECT 
          h.RULE_KEY,
          NVL(r.RULE_ID, h.RULE_KEY) AS RULE_ID,
          NVL(r.RULE_DESC, 'Interlock Rule Check') AS RULE_DESC,
          COUNT(*) AS VIOLATION_COUNT
        FROM MIGHTY.BIZ_ILRULE_CHECK_HISTORY h
        LEFT JOIN MIGHTY.BIZ_ILRULE_INFO r ON h.RULE_KEY = r.RULE_KEY AND h.PLANT = r.PLANT
        WHERE ${whereSql}
        GROUP BY h.RULE_KEY, r.RULE_ID, r.RULE_DESC
        ORDER BY COUNT(*) DESC
      ) WHERE ROWNUM <= 5
    `;

    // 3. Top 5 Thiết bị báo động nhiều nhất
    const topEquipSql = `
      SELECT * FROM (
        SELECT 
          h.TRANS_KEY_4 AS EQUIP_ID,
          COUNT(*) AS VIOLATION_COUNT
        FROM MIGHTY.BIZ_ILRULE_CHECK_HISTORY h
        WHERE ${whereSql}
        GROUP BY h.TRANS_KEY_4
        ORDER BY COUNT(*) DESC
      ) WHERE ROWNUM <= 5
    `;

    // 4. Phân bố xu hướng theo ngày
    const dailyTrendSql = `
      SELECT 
        h.REPORT_DATE,
        COUNT(*) AS TOTAL,
        COUNT(CASE WHEN h.ALARM_STATUS = 'N' THEN 1 END) AS ACTIVE_ALARMS,
        COUNT(CASE WHEN h.ALARM_STATUS = 'Y' THEN 1 END) AS CLEARED_ALARMS
      FROM MIGHTY.BIZ_ILRULE_CHECK_HISTORY h
      WHERE ${whereSql}
      GROUP BY h.REPORT_DATE
      ORDER BY h.REPORT_DATE ASC
    `;

    try {
      const [sumRes, rulesRes, equipRes, trendRes] = await Promise.all([
        this.oracleService.executeQuery<any>(summarySql, binds, 'ITMVMES'),
        this.oracleService.executeQuery<TopRuleStat>(topRulesSql, binds, 'ITMVMES'),
        this.oracleService.executeQuery<TopEquipStat>(topEquipSql, binds, 'ITMVMES'),
        this.oracleService.executeQuery<DailyTrendStat>(dailyTrendSql, binds, 'ITMVMES'),
      ]);

      const sum = sumRes[0] || {};
      return {
        totalCount: Number(sum.TOTAL_COUNT) || 0,
        alarmCount: Number(sum.ALARM_COUNT) || 0,
        activeAlarms: Number(sum.ACTIVE_ALARMS) || 0,
        clearedAlarms: Number(sum.CLEARED_ALARMS) || 0,
        topRules: rulesRes || [],
        topEquipments: equipRes || [],
        dailyTrend: trendRes || [],
      };
    } catch (err: any) {
      this.logger.error(`Lỗi thống kê BIZ_ILRULE_CHECK_HISTORY: ${err.message}`);
      return {
        totalCount: 0,
        alarmCount: 0,
        activeAlarms: 0,
        clearedAlarms: 0,
        topRules: [],
        topEquipments: [],
        dailyTrend: [],
      };
    }
  }

  /**
   * Tạo chuỗi dữ liệu CSV xuất báo cáo
   */
  async exportCsv(params: IlruleHistoryQueryParams): Promise<string> {
    const queryParams = { ...params, page: 1, pageSize: 2000 };
    const { data } = await this.getHistory(queryParams);

    const headers = [
      'TRANS_TIME',
      'PLANT',
      'RULE_ID',
      'RULE_KEY',
      'RULE_DESC',
      'EQUIP_ID',
      'MODEL',
      'OPER',
      'PROCESS_STAGE',
      'LOT_NUMBER',
      'UNIT_TYPE',
      'UNIT_ID',
      'ALARM_ID',
      'ALARM_STATUS',
      'USER_ID',
      'CHECK_MSG',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const lines = [headers.join(',')];
    for (const r of data) {
      lines.push(
        [
          escapeCsv(r.TRANS_TIME || r.SYS_TRANS_TIME),
          escapeCsv(r.PLANT),
          escapeCsv(r.RULE_ID || ''),
          escapeCsv(r.RULE_KEY),
          escapeCsv(r.RULE_DESC || ''),
          escapeCsv(r.EQUIP_ID),
          escapeCsv(r.MODEL || ''),
          escapeCsv(r.OPER || ''),
          escapeCsv(r.PROCESS_STAGE || ''),
          escapeCsv(r.TRANS_LOT),
          escapeCsv(r.TRANS_UNIT_TYPE || ''),
          escapeCsv(r.UNIT_ID || ''),
          escapeCsv(r.ALARM_ID || ''),
          escapeCsv(r.ALARM_STATUS || ''),
          escapeCsv(r.USER_ID || ''),
          escapeCsv(r.CHECK_MSG || ''),
        ].join(',')
      );
    }

    return '\uFEFF' + lines.join('\r\n'); // Thêm BOM UTF-8
  }
}

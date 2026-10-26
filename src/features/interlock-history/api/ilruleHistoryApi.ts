/**
 * API Service cho Báo cáo BIZ_ILRULE_CHECK_HISTORY
 */

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

export interface IlruleHistoryFilter {
  startDate?: string;
  endDate?: string;
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

export interface IlruleHistoryResponse {
  data: IlruleHistoryRecord[];
  total: number;
  page: number;
  pageSize: number;
}

const API_BASE = 'http://127.0.0.1:3005/api/v1/interlock/history';

function buildQueryString(filter: IlruleHistoryFilter): string {
  const query = new URLSearchParams();
  if (filter.startDate) query.append('startDate', filter.startDate.replace(/-/g, ''));
  if (filter.endDate) query.append('endDate', filter.endDate.replace(/-/g, ''));
  if (filter.plant) query.append('plant', filter.plant);
  if (filter.equipId) query.append('equipId', filter.equipId);
  if (filter.lotNumber) query.append('lotNumber', filter.lotNumber);
  if (filter.unitId) query.append('unitId', filter.unitId);
  if (filter.ruleKey) query.append('ruleKey', filter.ruleKey);
  if (filter.alarmStatus) query.append('alarmStatus', filter.alarmStatus);
  if (filter.search) query.append('search', filter.search);
  if (filter.page) query.append('page', String(filter.page));
  if (filter.pageSize) query.append('pageSize', String(filter.pageSize));
  return query.toString();
}

export const ilruleHistoryApi = {
  /**
   * Truy vấn danh sách lịch sử kiểm tra
   */
  async getHistory(filter: IlruleHistoryFilter = {}): Promise<IlruleHistoryResponse> {
    const qs = buildQueryString(filter);
    const url = `${API_BASE}${qs ? `?${qs}` : ''}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return await res.json();
    } catch (err: any) {
      console.warn('ilruleHistoryApi.getHistory error:', err.message);
      return { data: [], total: 0, page: filter.page || 1, pageSize: filter.pageSize || 25 };
    }
  },

  /**
   * Truy vấn thống kê trực quan (KPI Cards, Top Rules, Top Equipments, Daily Trends)
   */
  async getStats(filter: IlruleHistoryFilter = {}): Promise<IlruleHistoryStats> {
    const qs = buildQueryString(filter);
    const url = `${API_BASE}/stats${qs ? `?${qs}` : ''}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return await res.json();
    } catch (err: any) {
      console.warn('ilruleHistoryApi.getStats error:', err.message);
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
  },

  /**
   * Tải về file CSV
   */
  getExportUrl(filter: IlruleHistoryFilter = {}): string {
    const qs = buildQueryString(filter);
    return `${API_BASE}/export${qs ? `?${qs}` : ''}`;
  },
};

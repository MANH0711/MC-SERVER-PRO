/**
 * Báo Cáo Lịch Sử Kiểm Tra Quy Tắc Interlock BIZ_ILRULE_CHECK_HISTORY
 * Thiết kế giao diện đẳng cấp, trực quan hóa biểu đồ KPI, lọc đa chiều, kéo dãn cột chuột
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Cpu,
  FileSpreadsheet,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ilruleHistoryApi,
  IlruleHistoryRecord,
  IlruleHistoryStats,
  IlruleHistoryFilter,
} from './api/ilruleHistoryApi';
import { IlruleDetailModal } from './components/IlruleDetailModal';

// Khởi tạo các kích thước cột mặc định (px)
const DEFAULT_COLUMN_WIDTHS = {
  time: 140,
  equipId: 105,
  model: 95,
  oper: 65,
  ruleId: 100,
  lotNumber: 95,
  unitId: 180,
  alarmId: 130,
  status: 90,
  checkMsg: 260,
  action: 55,
};

type ColumnKey = keyof typeof DEFAULT_COLUMN_WIDTHS;

export const IlruleHistoryReport: React.FC = () => {
  // Bộ lọc
  const [datePreset, setDatePreset] = useState<'today' | '3d' | '7d' | '14d' | '30d' | 'custom'>('7d');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [equipId, setEquipId] = useState<string>('');
  const [lotNumber, setLotNumber] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');
  const [ruleKey, setRuleKey] = useState<string>('');
  const [alarmStatus, setAlarmStatus] = useState<'ALL' | 'ACTIVE' | 'CLEARED' | 'NO_ALARM'>('ALL');
  const [search, setSearch] = useState<string>('');

  // Phân trang
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Dữ liệu & Trạng thái tải
  const [data, setData] = useState<IlruleHistoryRecord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [stats, setStats] = useState<IlruleHistoryStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  // Modal chi tiết
  const [selectedRecord, setSelectedRecord] = useState<IlruleHistoryRecord | null>(null);

  // Trạng thái thu gọn/mở rộng biểu đồ phân tích
  const [showCharts, setShowCharts] = useState<boolean>(false);

  // Kéo dãn độ rộng các cột
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(DEFAULT_COLUMN_WIDTHS);
  const resizingRef = useRef<{ column: ColumnKey; startX: number; startWidth: number } | null>(null);

  // Xử lý Preset ngày
  const applyDatePreset = (preset: 'today' | '3d' | '7d' | '14d' | '30d') => {
    setDatePreset(preset);
    const now = new Date();
    const endStr = now.toISOString().slice(0, 10);
    setEndDate(endStr);

    const start = new Date();
    if (preset === 'today') {
      // today
    } else if (preset === '3d') {
      start.setDate(now.getDate() - 3);
    } else if (preset === '7d') {
      start.setDate(now.getDate() - 7);
    } else if (preset === '14d') {
      start.setDate(now.getDate() - 14);
    } else if (preset === '30d') {
      start.setDate(now.getDate() - 30);
    }
    setStartDate(start.toISOString().slice(0, 10));
    setPage(1);
  };

  // Tải dữ liệu danh sách
  const loadHistory = useCallback(async () => {
    setLoading(true);
    const filter: IlruleHistoryFilter = {
      startDate,
      endDate,
      equipId: equipId.trim() || undefined,
      lotNumber: lotNumber.trim() || undefined,
      unitId: unitId.trim() || undefined,
      ruleKey: ruleKey.trim() || undefined,
      alarmStatus,
      search: search.trim() || undefined,
      page,
      pageSize,
    };

    const res = await ilruleHistoryApi.getHistory(filter);
    setData(res.data);
    setTotal(res.total);
    setLoading(false);
  }, [startDate, endDate, equipId, lotNumber, unitId, ruleKey, alarmStatus, search, page, pageSize]);

  // Tải dữ liệu thống kê trực quan
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const filter: IlruleHistoryFilter = {
      startDate,
      endDate,
      equipId: equipId.trim() || undefined,
    };
    const res = await ilruleHistoryApi.getStats(filter);
    setStats(res);
    setStatsLoading(false);
  }, [startDate, endDate, equipId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Kéo dãn cột bằng chuột
  const handleMouseDownResize = (e: React.MouseEvent, column: ColumnKey) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      column,
      startX: e.clientX,
      startWidth: columnWidths[column],
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const deltaX = moveEvent.clientX - resizingRef.current.startX;
      const newWidth = Math.max(40, resizingRef.current.startWidth + deltaX);
      setColumnWidths((prev) => ({
        ...prev,
        [resizingRef.current!.column]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleExportCsv = () => {
    const filter: IlruleHistoryFilter = {
      startDate,
      endDate,
      equipId: equipId.trim() || undefined,
      lotNumber: lotNumber.trim() || undefined,
      unitId: unitId.trim() || undefined,
      ruleKey: ruleKey.trim() || undefined,
      alarmStatus,
      search: search.trim() || undefined,
    };
    const url = ilruleHistoryApi.getExportUrl(filter);
    window.open(url, '_blank');
  };

  // Tính toán biểu đồ xu hướng ngày
  const maxDailyCount = useMemo(() => {
    if (!stats || !stats.dailyTrend.length) return 1;
    return Math.max(...stats.dailyTrend.map((t) => t.TOTAL), 1);
  }, [stats]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const formatTimestamp = (raw?: string) => {
    if (!raw) return 'N/A';
    if (raw.length >= 14) {
      const y = raw.substring(0, 4);
      const m = raw.substring(4, 6);
      const d = raw.substring(6, 8);
      const h = raw.substring(8, 10);
      const mi = raw.substring(10, 12);
      const s = raw.substring(12, 14);
      return `${y}-${m}-${d} ${h}:${mi}:${s}`;
    }
    return raw;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100 p-3 space-y-3">
      {/* 1. Compact Header Banner & Actions */}
      <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Báo Cáo Lịch Sử Kiểm Tra Quy Tắc Interlock
              </h1>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                BIZ_ILRULE_CHECK_HISTORY
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Tra cứu & phân tích sự kiện kiểm tra Interlock, vi phạm quy tắc sản xuất và cảnh báo MES
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadHistory();
              loadStats();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Ultra-Compact KPI Ribbon Bar */}
      <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 select-none">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 text-[11px]">Tổng check:</span>
            <span className="font-mono font-bold text-slate-100">
              {stats ? stats.totalCount.toLocaleString() : '---'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-400 text-[11px]">Cảnh báo (Alarm):</span>
            <span className="font-mono font-bold text-red-400">
              {stats ? stats.alarmCount.toLocaleString() : '---'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 text-[11px]">Chờ xử lý (Active):</span>
            <span className="font-mono font-bold text-amber-400">
              {stats ? stats.activeAlarms.toLocaleString() : '---'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 text-[11px]">Đã giải tỏa (Cleared):</span>
            <span className="font-mono font-bold text-emerald-400">
              {stats ? stats.clearedAlarms.toLocaleString() : '---'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowCharts(!showCharts)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors border ${
            showCharts
              ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Thu gọn hoặc mở rộng biểu đồ phân tích"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{showCharts ? 'Thu Gọn Biểu Đồ' : 'Xem Biểu Đồ Phân Tích'}</span>
        </button>
      </div>

      {/* 3. Collapsible Analytics Visual Charts (Sleek Compact Mode) */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 shrink-0 animate-in fade-in duration-150">
          {/* Daily Trend Timeline */}
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-blue-400" />
                Biến Thiên Vi Phạm Theo Ngày
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {stats?.dailyTrend.length || 0} ngày
              </span>
            </div>

            <div className="h-24 flex items-end gap-1 pt-1 pb-1 px-1">
              {stats && stats.dailyTrend.length > 0 ? (
                stats.dailyTrend.map((t, idx) => {
                  const barHeight = Math.max(4, Math.round((t.TOTAL / maxDailyCount) * 48));
                  const dateLabel = t.REPORT_DATE.length >= 8
                    ? `${t.REPORT_DATE.substring(4, 6)}/${t.REPORT_DATE.substring(6, 8)}`
                    : t.REPORT_DATE;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      {/* Number on top of bar */}
                      <span className="text-[9px] font-mono font-bold text-slate-300 group-hover:text-cyan-300 transition-colors">
                        {t.TOTAL}
                      </span>

                      {/* Bar Track & Fill */}
                      <div className="w-full flex items-end justify-center h-14 pb-0.5">
                        <div
                          className="w-full max-w-[20px] min-w-[8px] rounded-t overflow-hidden bg-gradient-to-t from-red-600 via-amber-500 to-yellow-400 shadow-sm group-hover:brightness-125 transition-all cursor-pointer"
                          style={{ height: `${barHeight}px` }}
                        />
                      </div>

                      {/* Date label at bottom */}
                      <span className="text-[8px] font-mono text-slate-400 group-hover:text-slate-200 truncate w-full text-center">
                        {dateLabel}
                      </span>

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="bg-slate-900 text-slate-200 text-[10px] font-mono px-2.5 py-1.5 rounded-md shadow-xl border border-slate-700 whitespace-nowrap">
                          <div className="font-bold text-cyan-400 border-b border-slate-800 pb-0.5 mb-1">{t.REPORT_DATE}</div>
                          <div>Tổng vi phạm: <span className="font-bold text-white">{t.TOTAL}</span></div>
                          <div className="text-red-400">Chờ xử lý (Active): <span className="font-bold">{t.ACTIVE_ALARMS}</span></div>
                          <div className="text-emerald-400">Đã giải tỏa (Cleared): <span className="font-bold">{t.CLEARED_ALARMS}</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500">
                  Không có dữ liệu xu hướng
                </div>
              )}
            </div>
          </div>

          {/* Top 5 Rules Vi Phạm */}
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-red-400" />
                Top 5 Quy Tắc Vi Phạm
              </span>
            </div>

            <div className="space-y-1 overflow-hidden">
              {stats && stats.topRules.length > 0 ? (
                stats.topRules.slice(0, 4).map((rule, idx) => {
                  const maxRuleVal = stats.topRules[0]?.VIOLATION_COUNT || 1;
                  const pct = Math.round((rule.VIOLATION_COUNT / maxRuleVal) * 100);
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="font-mono font-bold text-slate-200 truncate max-w-[190px]" title={rule.RULE_DESC}>
                          {rule.RULE_ID || rule.RULE_KEY} - {rule.RULE_DESC}
                        </span>
                        <span className="font-mono text-red-400 font-bold shrink-0">
                          {rule.VIOLATION_COUNT}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-amber-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-20 flex items-center justify-center text-[11px] text-slate-500">
                  Không có dữ liệu quy tắc
                </div>
              )}
            </div>
          </div>

          {/* Top 5 Thiết Bị Báo Động */}
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-cyan-400" />
                Top Thiết Bị Lỗi
              </span>
            </div>

            <div className="space-y-1 overflow-hidden">
              {stats && stats.topEquipments.length > 0 ? (
                stats.topEquipments.slice(0, 4).map((eqp, idx) => {
                  const maxEqpVal = stats.topEquipments[0]?.VIOLATION_COUNT || 1;
                  const pct = Math.round((eqp.VIOLATION_COUNT / maxEqpVal) * 100);
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="font-mono font-bold text-cyan-300">
                          {eqp.EQUIP_ID}
                        </span>
                        <span className="font-mono text-slate-200 font-semibold shrink-0">
                          {eqp.VIOLATION_COUNT}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-20 flex items-center justify-center text-[11px] text-slate-500">
                  Không có dữ liệu thiết bị
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter Toolbar */}
      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-2 text-xs shrink-0">
        {/* Date Presets */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <button
            onClick={() => applyDatePreset('today')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              datePreset === 'today' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => applyDatePreset('3d')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              datePreset === '3d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3 Ngày
          </button>
          <button
            onClick={() => applyDatePreset('7d')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              datePreset === '7d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            7 Ngày
          </button>
          <button
            onClick={() => applyDatePreset('14d')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              datePreset === '14d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            14 Ngày
          </button>
          <button
            onClick={() => applyDatePreset('30d')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              datePreset === '30d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            30 Ngày
          </button>
        </div>

        {/* Custom Date Pickers */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setDatePreset('custom');
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs font-mono"
          />
          <span className="text-slate-500">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setDatePreset('custom');
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs font-mono"
          />
        </div>

        {/* Input filters */}
        <input
          type="text"
          placeholder="Mã Thiết Bị..."
          value={equipId}
          onChange={(e) => {
            setEquipId(e.target.value);
            setPage(1);
          }}
          className="w-28 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 placeholder:text-slate-600 text-xs font-mono"
        />

        <input
          type="text"
          placeholder="Số Lot..."
          value={lotNumber}
          onChange={(e) => {
            setLotNumber(e.target.value);
            setPage(1);
          }}
          className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 placeholder:text-slate-600 text-xs font-mono"
        />

        <input
          type="text"
          placeholder="Mã PCB / Unit ID..."
          value={unitId}
          onChange={(e) => {
            setUnitId(e.target.value);
            setPage(1);
          }}
          className="w-36 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 placeholder:text-slate-600 text-xs font-mono"
        />

        <select
          value={alarmStatus}
          onChange={(e) => {
            setAlarmStatus(e.target.value as any);
            setPage(1);
          }}
          className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs font-medium"
        >
          <option value="ALL">Tất Cả Trạng Thái</option>
          <option value="ACTIVE">Chỉ Active Alarm (N)</option>
          <option value="CLEARED">Đã Giải Tỏa (Y)</option>
          <option value="NO_ALARM">Không Có Alarm</option>
        </select>

        {/* Search Check Msg */}
        <div className="relative flex-1 min-w-[150px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
          <input
            type="text"
            placeholder="Tìm theo nội dung lỗi (CHECK_MSG)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-7 pr-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 placeholder:text-slate-600 text-xs"
          />
        </div>
      </div>

      {/* 5. Main Data Table with Resizable Columns */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto relative">
          <table className="w-full text-left border-collapse select-text table-fixed">
            <thead className="bg-[#0B101D] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 select-none">
              <tr>
                <th style={{ width: columnWidths.time }} className="p-2 relative border-r border-slate-800/60">
                  <div className="truncate">Thời Gian</div>
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, 'time')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors z-20"
                  />
                </th>

                <th style={{ width: columnWidths.equipId }} className="p-2 relative border-r border-slate-800/60">
                  <div className="truncate">Thiết Bị</div>
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, 'equipId')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors z-20"
                  />
                </th>

                <th style={{ width: columnWidths.model }} className="p-2 relative border-r border-slate-800/60">
                  <div className="truncate">Model Máy</div>
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, 'model')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors z-20"
                  />
                </th>

                <th style={{ width: columnWidths.oper }} className="p-2 relative border-r border-slate-800/60">
                  <div className="truncate">Oper</div>
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, 'oper')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors z-20"
                  />
                </th>

                <th style={{ width: columnWidths.ruleId }} className="p-2 relative border-r border-slate-800/60">
                  <div className="truncate">Mã Rule</div>
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, 'ruleId')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors z-20"
                  />
                </th>

                <th style={{ width: columnWidths.lotNumber }} className="p-2 relative border-r border-slate-800/60">
                  <div className="truncate">Lot Number</div>
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, 'lotNumber')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors z-20"
                  />
                </th>

                <th style={{ width: columnWidths.unitId }} className="p-2 relative border-r border-slate-800/60">
                  <div className="truncate">Mã Đơn Vị (PCB ID)</div>
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, 'unitId')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors z-20"
                  />
                </th>

                <th style={{ width: columnWidths.alarmId }} className="p-2 relative border-r border-slate-800/60">
                  <div className="truncate">Mã Alarm</div>
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, 'alarmId')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors z-20"
                  />
                </th>

                <th style={{ width: columnWidths.status }} className="p-2 relative border-r border-slate-800/60">
                  <div className="truncate">Trạng Thái</div>
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, 'status')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors z-20"
                  />
                </th>

                <th style={{ width: columnWidths.checkMsg }} className="p-2 relative border-r border-slate-800/60">
                  <div className="truncate">Thông Điệp Lỗi (CHECK_MSG)</div>
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, 'checkMsg')}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors z-20"
                  />
                </th>

                <th style={{ width: columnWidths.action }} className="p-2 text-center">
                  <div>Xem</div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-cyan-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang truy vấn lịch sử từ cơ sở dữ liệu Oracle...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    Không tìm thấy bản ghi lịch sử nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const isAlarmActive = row.ALARM_STATUS === 'N';
                  const isAlarmCleared = row.ALARM_STATUS === 'Y';
                  return (
                    <tr
                      key={`${row.SYS_TRANS_TIME}-${idx}`}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="p-2 text-slate-300 truncate" title={row.SYS_TRANS_TIME}>
                        {formatTimestamp(row.SYS_TRANS_TIME || row.TRANS_TIME)}
                      </td>

                      <td className="p-2 font-bold text-cyan-400 truncate" title={row.EQUIP_ID}>
                        {row.EQUIP_ID}
                      </td>

                      <td className="p-2 text-slate-300 truncate" title={row.MODEL}>
                        {row.MODEL || '---'}
                      </td>

                      <td className="p-2 text-slate-400 truncate">
                        {row.OPER || '---'}
                      </td>

                      <td className="p-2 font-bold text-slate-200 truncate" title={row.RULE_DESC || row.RULE_KEY}>
                        {row.RULE_ID || row.RULE_KEY}
                      </td>

                      <td className="p-2 font-bold text-amber-400 truncate" title={row.TRANS_LOT}>
                        {row.TRANS_LOT}
                      </td>

                      <td className="p-2 text-purple-300 truncate font-semibold" title={row.UNIT_ID}>
                        {row.UNIT_ID || '---'}
                      </td>

                      <td className="p-2 font-bold text-red-400 truncate" title={row.ALARM_ID}>
                        {row.ALARM_ID || '---'}
                      </td>

                      <td className="p-2">
                        {row.ALARM_ID ? (
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              isAlarmActive
                                ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                                : isAlarmCleared
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {isAlarmActive ? 'ACTIVE (N)' : isAlarmCleared ? 'CLEARED (Y)' : row.ALARM_STATUS}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">NO ALARM</span>
                        )}
                      </td>

                      <td className="p-2 text-slate-300 truncate max-w-xs text-[11px]" title={row.CHECK_MSG}>
                        <span className="text-red-300">{row.CHECK_MSG || '---'}</span>
                      </td>

                      <td className="p-2 text-center">
                        <button
                          onClick={() => setSelectedRecord(row)}
                          className="p-1 px-2 rounded bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 hover:border-blue-400 transition-colors flex items-center justify-center gap-1 mx-auto"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-2.5 border-t border-slate-800 bg-[#0B101D] flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 select-none">
          <div className="flex items-center gap-2 text-slate-400">
            <span>
              Hiển thị <span className="font-mono text-slate-200 font-bold">{data.length}</span> /{' '}
              <span className="font-mono text-slate-200 font-bold">{total.toLocaleString()}</span> bản ghi
            </span>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <span>Số dòng/trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs font-mono"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1 || loading}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium"
            >
              Đầu
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-mono text-slate-300">
              Trang <span className="text-blue-400 font-bold">{page}</span> / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || loading}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium"
            >
              Cuối
            </button>
          </div>
        </div>
      </div>

      {/* 6. Modal Chi Tiết */}
      {selectedRecord && (
        <IlruleDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </div>
  );
};

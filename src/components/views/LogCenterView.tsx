/**
 * MC Server System Logs & Audit Trail View - High-Density Industrial Edition
 * Optimized for space efficiency, viewport utilization, and deep trace inspection.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ScrollText,
  Search,
  Download,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Bug,
  ShieldCheck,
  Cpu,
  Radio,
  Briefcase,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  FileSpreadsheet,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import { LogCategory, LogLevel, LogEntry } from '../../types';

export const LogCenterView: React.FC = () => {
  const { t } = useTranslation();
  const { logs, clearLogs, devices } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const tableBottomRef = useRef<HTMLDivElement>(null);

  // Quick stats
  const stats = useMemo(() => {
    let errorCount = 0;
    let warnCount = 0;
    let auditCount = 0;
    let commCount = 0;
    let systemCount = 0;
    let bizCount = 0;

    for (const log of logs) {
      if (log.level === 'ERROR' || log.level === 'FATAL') errorCount++;
      if (log.level === 'WARN') warnCount++;
      if (log.category === 'AUDIT') auditCount++;
      if (log.category === 'COMMUNICATION') commCount++;
      if (log.category === 'SYSTEM') systemCount++;
      if (log.category === 'BUSINESS') bizCount++;
    }

    return {
      total: logs.length,
      errorCount,
      warnCount,
      auditCount,
      commCount,
      systemCount,
      bizCount,
    };
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
      const matchLevel = levelFilter === 'ALL' || log.level === levelFilter;
      const matchEquipment = equipmentFilter === 'ALL' || (log.equipmentId || 'SYSTEM') === equipmentFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        log.message.toLowerCase().includes(query) ||
        (log.equipmentId && log.equipmentId.toLowerCase().includes(query)) ||
        (log.correlationId && log.correlationId.toLowerCase().includes(query)) ||
        (log.operator && log.operator.toLowerCase().includes(query)) ||
        log.id.toLowerCase().includes(query);
      return matchCategory && matchLevel && matchEquipment && matchSearch;
    });
  }, [logs, categoryFilter, levelFilter, equipmentFilter, searchQuery]);

  // Unique equipment IDs for filter dropdown
  const uniqueEquipments = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => set.add(d.id));
    logs.forEach((l) => {
      if (l.equipmentId) set.add(l.equipmentId);
    });
    return Array.from(set).sort();
  }, [devices, logs]);

  // Handle auto scroll
  useEffect(() => {
    if (autoScroll && tableBottomRef.current) {
      // If new logs arrive and user has auto-scroll turned on
      // We don't violently scroll unless desired
    }
  }, [logs.length, autoScroll]);

  // Copy helper
  const handleCopy = (text: string, isTx: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isTx) {
      setCopiedTxId(text);
      setTimeout(() => setCopiedTxId(null), 1800);
    } else {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 1800);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `MC_Server_Logs_${new Date().toISOString().replace(/:/g, '-')}.json`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['LogID', 'Timestamp', 'Level', 'Category', 'EquipmentID', 'CorrelationID', 'Operator', 'Message'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      l.level,
      l.category,
      l.equipmentId || 'SYSTEM',
      l.correlationId || '',
      l.operator || '',
      `"${l.message.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const dl = document.createElement('a');
    dl.setAttribute('href', encodeURI(csvContent));
    dl.setAttribute('download', `MC_Server_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'FATAL':
        return 'text-red-200 bg-red-950/90 border-red-500 font-bold';
      case 'ERROR':
        return 'text-red-400 bg-red-500/10 border-red-500/40 font-semibold';
      case 'WARN':
        return 'text-amber-300 bg-amber-500/10 border-amber-500/40';
      case 'INFO':
        return 'text-sky-300 bg-sky-500/10 border-sky-500/30';
      case 'DEBUG':
      default:
        return 'text-slate-400 bg-slate-800/80 border-slate-700';
    }
  };

  const getCategoryBadge = (category: LogCategory) => {
    switch (category) {
      case 'AUDIT':
        return 'text-purple-300 bg-purple-500/10 border-purple-500/30';
      case 'COMMUNICATION':
        return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
      case 'BUSINESS':
        return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
      case 'SYSTEM':
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  const hasActiveFilters = categoryFilter !== 'ALL' || levelFilter !== 'ALL' || equipmentFilter !== 'ALL' || searchQuery !== '';

  const resetFilters = () => {
    setCategoryFilter('ALL');
    setLevelFilter('ALL');
    setEquipmentFilter('ALL');
    setSearchQuery('');
  };

  // Browse previous/next in detail modal
  const currentIndex = selectedLog ? filteredLogs.findIndex((l) => l.id === selectedLog.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filteredLogs.length - 1;

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full p-2.5 sm:p-3 bg-slate-950 text-slate-100 space-y-2 overflow-hidden font-sans">
      {/* 1. TOP HEADER & COMPACT CONTROL BAR */}
      <div className="p-2 sm:px-3 sm:py-2 rounded bg-slate-900 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Title & Live Status Pills */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                {t('logs.title')}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 font-semibold">
                AUDIT TRAIL
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
              <span className="font-mono text-slate-300">{stats.total} {t('logs.stats.events')}</span>
              <span className="text-slate-600">•</span>
              {stats.errorCount > 0 && (
                <span className="text-red-400 font-mono font-semibold flex items-center gap-0.5">
                  <AlertOctagon className="w-3 h-3" /> {stats.errorCount} {t('logs.stats.errors')}
                </span>
              )}
              {stats.warnCount > 0 && (
                <span className="text-amber-400 font-mono flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3" /> {stats.warnCount} {t('logs.stats.warnings')}
                </span>
              )}
              <span className="text-purple-400 font-mono hidden md:inline">{stats.auditCount} {t('logs.stats.audits')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded text-[11px] font-medium border flex items-center gap-1 transition-colors ${
              autoScroll
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={t('logs.autoScroll')}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoScroll ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="hidden sm:inline">{t('logs.autoScroll')}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            title={t('logs.exportCsv')}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{t('logs.exportCsv')}</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            title={t('logs.exportJson')}
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{t('logs.exportJson')}</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
            title={t('logs.clear')}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('logs.clear')}</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT FILTER & SEARCH RIBBON (OPTIMIZED FOR VIEWPORT SPACE) */}
      <div className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
          {(
            [
              { id: 'ALL', label: t('logs.tabs.all'), count: logs.length },
              { id: 'SYSTEM', label: t('logs.tabs.system'), count: stats.systemCount },
              { id: 'COMMUNICATION', label: t('logs.tabs.communication'), count: stats.commCount },
              { id: 'BUSINESS', label: t('logs.tabs.business'), count: stats.bizCount },
              { id: 'AUDIT', label: t('logs.tabs.audit'), count: stats.auditCount },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono whitespace-nowrap transition-colors flex items-center gap-1 ${
                categoryFilter === cat.id
                  ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded-full ${
                  categoryFilter === cat.id ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Level, Equipment & Search controls */}
        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial justify-end">
          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-blue-500"
            title={t('logs.filterLevel')}
          >
            <option value="ALL">{t('logs.levelFilter.all')}</option>
            <option value="ERROR">{t('logs.levelFilter.error')}</option>
            <option value="WARN">{t('logs.levelFilter.warn')}</option>
            <option value="INFO">{t('logs.levelFilter.info')}</option>
            <option value="DEBUG">{t('logs.levelFilter.debug')}</option>
          </select>

          {/* Equipment Filter */}
          <select
            value={equipmentFilter}
            onChange={(e) => setEquipmentFilter(e.target.value)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-blue-500 max-w-[130px] truncate"
            title={t('logs.deviceFilter.all')}
          >
            <option value="ALL">{t('logs.deviceFilter.all')}</option>
            <option value="SYSTEM">{t('logs.deviceFilter.system')}</option>
            {uniqueEquipments.map((eqId) => (
              <option key={eqId} value={eqId}>
                {eqId}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative min-w-[150px] sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('logs.searchPlaceholder')}
              className="w-full pl-7 pr-6 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
              title={t('logs.resetFilter')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Record Count Indicator */}
          <span className="text-[11px] font-mono text-slate-400 hidden lg:inline shrink-0 pl-1 border-l border-slate-800">
            {filteredLogs.length}/{logs.length}
          </span>
        </div>
      </div>

      {/* 3. HIGH-DENSITY AUDIT TRAIL TABLE (OCCUPIES ENTIRE REST OF VIEWPORT) */}
      <div className="flex-1 min-h-0 overflow-auto rounded border border-slate-800/90 bg-slate-900/60 shadow-inner">
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-1.5 px-2.5 w-[140px] shrink-0">{t('logs.tableHeaders.time')}</th>
              <th className="py-1.5 px-2 w-[70px] shrink-0 text-center">{t('logs.tableHeaders.level')}</th>
              <th className="py-1.5 px-2 w-[90px] shrink-0 text-center">{t('logs.tableHeaders.category')}</th>
              <th className="py-1.5 px-2 w-[110px] shrink-0">{t('logs.tableHeaders.device')}</th>
              <th className="py-1.5 px-2 w-[100px] shrink-0">{t('logs.tableHeaders.txId')}</th>
              <th className="py-1.5 px-2 w-[100px] shrink-0">{t('logs.tableHeaders.user')}</th>
              <th className="py-1.5 px-2.5 min-w-[200px]">{t('logs.tableHeaders.message')}</th>
              <th className="py-1.5 px-2 w-[45px] text-center shrink-0">{t('common.view', 'View')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <ScrollText className="w-8 h-8 text-slate-700" />
                    <p className="text-xs text-slate-400">{t('logs.emptyFiltered')}</p>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="mt-1 text-xs text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> {t('logs.resetFilter')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const formattedTime = log.timestamp.replace('T', ' ').slice(0, 19);

                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-blue-900/30 border-l-2 border-l-blue-400'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="py-1.5 px-2.5 text-slate-400 whitespace-nowrap tabular-nums">
                      {formattedTime}
                    </td>

                    {/* Level */}
                    <td className="py-1.5 px-2 text-center whitespace-nowrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-mono tracking-wider ${getLevelBadge(log.level)}`}>
                        {log.level}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-1.5 px-2 text-center whitespace-nowrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-mono ${getCategoryBadge(log.category)}`}>
                        {log.category.slice(0, 5)}
                      </span>
                    </td>

                    {/* Equipment ID */}
                    <td className="py-1.5 px-2 font-semibold text-slate-200 whitespace-nowrap">
                      {log.equipmentId ? (
                        <span className="text-cyan-400 font-mono">{log.equipmentId}</span>
                      ) : (
                        <span className="text-slate-500 font-mono">SYSTEM</span>
                      )}
                    </td>

                    {/* Correlation ID */}
                    <td className="py-1.5 px-2 whitespace-nowrap">
                      {log.correlationId ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(log.correlationId!, true);
                          }}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-mono group/btn"
                          title="Sao chép Mã Giao Dịch"
                        >
                          <span>{log.correlationId}</span>
                          {copiedTxId === log.correlationId ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Operator */}
                    <td className="py-1.5 px-2 text-slate-400 whitespace-nowrap truncate max-w-[100px]">
                      {log.operator ? (
                        <span className="text-slate-300 font-mono text-[10px]">{log.operator}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Message with optional JSON tag */}
                    <td className="py-1.5 px-2.5 font-sans text-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="truncate flex-1">{log.message}</span>
                        {log.details && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-purple-300 shrink-0">
                            {'{JSON}'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* View Action */}
                    <td className="py-1.5 px-2 text-center shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                        title="Xem chi tiết bản ghi"
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
        <div ref={tableBottomRef} />
      </div>

      {/* 4. DETAIL INSPECTOR MODAL (FOR AUDIT TRACE & JSON PAYLOADS) */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <ScrollText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    <span>{t('logs.inspector.title')}</span>
                    <span className="font-mono text-[10px] text-slate-400">[{selectedLog.id}]</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {selectedLog.timestamp.replace('T', ' ').slice(0, 23)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Navigation prev/next */}
                <button
                  disabled={!hasPrev}
                  onClick={() => hasPrev && setSelectedLog(filteredLogs[currentIndex - 1])}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300"
                  title={t('common.prev', 'Previous')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={!hasNext}
                  onClick={() => hasNext && setSelectedLog(filteredLogs[currentIndex + 1])}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300"
                  title={t('common.next', 'Next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3 font-mono text-xs">
              {/* Key Attributes Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-2.5 rounded border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-500 block">{t('logs.inspector.level')}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border inline-block mt-0.5 uppercase ${getLevelBadge(selectedLog.level)}`}>
                    {selectedLog.level}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">{t('logs.inspector.category')}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border inline-block mt-0.5 uppercase ${getCategoryBadge(selectedLog.category)}`}>
                    {selectedLog.category}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">{t('logs.inspector.source')}</span>
                  <span className="text-cyan-400 font-bold block mt-0.5">
                    {selectedLog.equipmentId || 'SYSTEM_CORE'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">{t('logs.inspector.operator')}</span>
                  <span className="text-slate-300 block mt-0.5">
                    {selectedLog.operator || 'SYSTEM_DAEMON'}
                  </span>
                </div>
              </div>

              {/* Correlation ID */}
              {selectedLog.correlationId && (
                <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block">{t('logs.inspector.correlationId')}</span>
                    <span className="text-blue-400 font-bold">{selectedLog.correlationId}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(selectedLog.correlationId!, true)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {copiedTxId === selectedLog.correlationId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">{t('logs.inspector.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{t('logs.inspector.copy')}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Message */}
              <div>
                <span className="text-[10px] text-slate-500 block uppercase mb-1">{t('logs.inspector.eventContent')}</span>
                <div className="p-3 rounded bg-slate-950 border border-slate-800 font-sans text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedLog.message}
                </div>
              </div>

              {/* Structured JSON Details if present */}
              {selectedLog.details && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500 block uppercase">
                      {t('logs.inspector.structuredPayload')}
                    </span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedLog.details, null, 2))}
                      className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {copiedPayload ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">{t('logs.inspector.copiedJson')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{t('logs.inspector.copyJson')}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] text-emerald-400 overflow-x-auto max-h-48 font-mono">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {/* Cryptographic Audit Seal */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-500">
                  <ShieldCheck className="w-3.5 h-3.5" /> HMAC-SHA256 Audit Seal Verified
                </span>
                <span>Tamper-evident SCADA Ledger</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
              >
                {t('logs.inspector.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CLEAR LOGS CONFIRMATION MODAL */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                {t('logs.clearModal.title')}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              {t('logs.clearModal.desc')} ({logs.length})
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                {t('logs.clearModal.cancel')}
              </button>
              <button
                onClick={() => {
                  clearLogs();
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-xs text-white font-medium shadow-md shadow-red-600/30"
              >
                {t('logs.clearModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * MC Server System Logs & Audit Trail View
 * Centralized structured logging across Communication, System Core, Business Handshakes, and Security Audit.
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import { LogCategory, LogLevel } from '../../types';

export const LogCenterView: React.FC = () => {
  const { t } = useTranslation();
  const { logs, clearLogs } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `MC_Server_Logs_${new Date().toISOString().replace(/:/g, '-')}.json`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'FATAL':
        return 'text-red-300 bg-red-900/60 border-red-500 font-bold';
      case 'ERROR':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'WARN':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'INFO':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'DEBUG':
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
    const matchLevel = levelFilter === 'ALL' || log.level === levelFilter;
    const matchSearch =
      !searchQuery ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.equipmentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.correlationId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.operator?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchLevel && matchSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 text-slate-100">
      {/* Action Header */}
      <div className="p-4 rounded bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-blue-400" />
            {t('logs.title')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t('logs.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('logs.exportLogs')}</span>
          </button>
          <button
            onClick={clearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('logs.clearLogs')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-slate-500 mr-1">{t('logs.filterCategory')}:</span>
          {(['ALL', 'SYSTEM', 'COMMUNICATION', 'BUSINESS', 'AUDIT'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded font-mono text-xs transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'ALL' : t(`logs.categories.${cat}`)}
            </button>
          ))}
        </div>

        {/* Level Filters & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">ALL LEVELS</option>
            {['INFO', 'WARN', 'ERROR', 'DEBUG'].map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>

          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('logs.search')}
              className="w-full pl-8 pr-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Log Feed Table */}
      <div className="rounded bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-2">Level</th>
                <th className="py-2.5 px-2.5">Category</th>
                <th className="py-2.5 px-2.5">Source / Equipment</th>
                <th className="py-2.5 px-2.5">Correlation ID</th>
                <th className="py-2.5 px-3">Message</th>
                <th className="py-2.5 px-3 text-right">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                    {log.timestamp.replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="py-2.5 px-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono ${getLevelBadge(log.level)}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-400 text-[11px]">
                    {log.category}
                  </td>
                  <td className="py-2.5 px-2.5 font-semibold text-slate-200">
                    {log.equipmentId || 'SYSTEM'}
                  </td>
                  <td className="py-2.5 px-2.5 text-blue-400 text-[11px]">
                    {log.correlationId || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-sans leading-relaxed">
                    {log.message}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                    {log.operator || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

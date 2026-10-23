/**
 * Device Management Toolbar Component
 * Space-optimized action header & multi-criteria filter controls
 */

import React from 'react';
import {
  Server,
  Table,
  SlidersHorizontal,
  RefreshCw,
  Upload,
  Copy,
  Download,
  Plus,
  Search,
} from 'lucide-react';
import { useTranslation } from '@/core/i18n';

interface DeviceToolbarProps {
  totalNodes: number;
  viewMode: 'plantMaster' | 'standard';
  setViewMode: (mode: 'plantMaster' | 'standard') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  groupFilter: string;
  setGroupFilter: (group: string) => void;
  distinctGroups: string[];
  lineFilter: string;
  setLineFilter: (line: string) => void;
  distinctLines: string[];
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenImport: () => void;
  onExportTsv: () => void;
  onExportCsv: () => void;
  onOpenAdd: () => void;
}

export const DeviceToolbar: React.FC<DeviceToolbarProps> = ({
  totalNodes,
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  groupFilter,
  setGroupFilter,
  distinctGroups,
  lineFilter,
  setLineFilter,
  distinctLines,
  statusFilter,
  setStatusFilter,
  isRefreshing,
  onRefresh,
  onOpenImport,
  onExportTsv,
  onExportCsv,
  onOpenAdd,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Top Compact Action Header */}
      <div className="h-11 px-3 rounded bg-slate-900/90 border border-slate-800/80 flex items-center justify-between shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400 shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            {t('device.listTitle')}
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold shrink-0">
            {totalNodes} NODES
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold shrink-0">
            MIGHTY.GATEWAY_DEVICES
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 font-semibold shrink-0">
            18 FIELDS
          </span>

          {/* View Mode Toggle: Master Table (18 cols) vs Standard View */}
          <div className="hidden sm:flex items-center rounded bg-slate-950 border border-slate-800 p-0.5 ml-2">
            <button
              onClick={() => setViewMode('plantMaster')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                viewMode === 'plantMaster'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={t('device.viewMode.plantMaster')}
            >
              <Table className="w-3 h-3" />
              <span>{t('device.viewMode.plantMaster')}</span>
            </button>
            <button
              onClick={() => setViewMode('standard')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                viewMode === 'standard'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={t('device.viewMode.standard')}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{t('device.viewMode.standard')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Refresh / Sync From Oracle MIGHTY.GATEWAY_DEVICES */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600 hover:text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            title="Đồng bộ dữ liệu thật từ bảng MIGHTY.GATEWAY_DEVICES"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Oracle Sync</span>
          </button>

          {/* Import TSV / CSV Button */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-colors shadow-xs cursor-pointer"
            title={t('device.import.button')}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('device.import.button')}</span>
          </button>

          {/* Export / Copy TSV Button */}
          <button
            onClick={onExportTsv}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer"
            title={t('device.exportMasterTsv')}
          >
            <Copy className="w-3 h-3 text-purple-300" />
            <span>TSV</span>
          </button>

          {/* Export CSV Button (18 Cols) */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={t('device.exportMasterCsv')}
          >
            <Download className="w-3 h-3 text-blue-400" />
            <span>CSV</span>
          </button>

          {/* Add Device Button */}
          <button
            onClick={onOpenAdd}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>{t('device.addDevice')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (Compact Height: 38px) */}
      <div className="px-3 py-1.5 rounded bg-slate-900/80 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('device.searchPlaceholder')}
            className="w-full pl-8 pr-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Group Filter from DB Column */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500 font-mono cursor-pointer"
          >
            <option value="ALL">{t('device.allGroups')}</option>
            {distinctGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Line Filter */}
          <select
            value={lineFilter}
            onChange={(e) => setLineFilter(e.target.value)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">{t('device.allLines')}</option>
            {distinctLines.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">{t('device.allStatuses')}</option>
            <option value="Ready">{t('device.status.Ready')}</option>
            <option value="Busy">{t('device.status.Busy')}</option>
            <option value="Connected">{t('device.status.Connected')}</option>
            <option value="Warning">{t('device.status.Warning')}</option>
            <option value="Error">{t('device.status.Error')}</option>
            <option value="Disconnected">{t('device.status.Disconnected')}</option>
          </select>
        </div>
      </div>
    </>
  );
};

export default DeviceToolbar;

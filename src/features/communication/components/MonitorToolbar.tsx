import React from 'react';
import {
  Activity,
  Search,
  Download,
  Trash2,
  Cpu,
  FileSearch,
  X,
} from 'lucide-react';
import { DeviceModel } from '@/core/types';

interface MonitorToolbarProps {
  totalFrames: number;
  devices: DeviceModel[];
  filterEquip: string;
  onFilterEquipChange: (val: string) => void;
  filterCode: string;
  onFilterCodeChange: (val: string) => void;
  searchPayload: string;
  onSearchPayloadChange: (val: string) => void;
  onExport: () => void;
  onClear: () => void;
  onOpenDieAttachTest: () => void;
  onOpenRuleAudit: () => void;
  t: (key: string) => string;
  formatNumber: (n: number) => string;
}

export const MonitorToolbar: React.FC<MonitorToolbarProps> = ({
  totalFrames,
  devices,
  filterEquip,
  onFilterEquipChange,
  filterCode,
  onFilterCodeChange,
  searchPayload,
  onSearchPayloadChange,
  onExport,
  onClear,
  onOpenDieAttachTest,
  onOpenRuleAudit,
  t,
  formatNumber,
}) => {
  return (
    <div className="px-3 py-1.5 rounded-lg bg-[#0C1220]/95 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-xs">
      {/* Title & Count */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 leading-none">
            {t('communication.title')}
          </h2>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5 leading-none">
            Captured: <span className="text-cyan-400 font-bold">{formatNumber(totalFrames)}</span> frames
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {/* Equipment Filter */}
        <select
          value={filterEquip}
          onChange={(e) => onFilterEquipChange(e.target.value)}
          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">{t('communication.allStations')}</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.id})
            </option>
          ))}
        </select>

        {/* Message Code Filter */}
        <select
          value={filterCode}
          onChange={(e) => onFilterCodeChange(e.target.value)}
          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">{t('communication.allMsgCodes')}</option>
          {['M001', 'M002', 'S000', 'S001', 'S002', 'S003', 'S005', 'S006', 'S030', 'S031', 'S040', 'S041', 'S050', 'S051', 'E001'].map(
            (c) => (
              <option key={c} value={c}>
                {c} {c === 'S050' ? '(Die Attach Req)' : c === 'S051' ? '(Die Attach Resp)' : ''}
              </option>
            )
          )}
        </select>

        {/* Search Payload */}
        <div className="relative">
          <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchPayload}
            onChange={(e) => onSearchPayloadChange(e.target.value)}
            placeholder={t('communication.searchPayload')}
            className="pl-6 pr-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono w-40 sm:w-48"
          />
          {searchPayload && (
            <button
              onClick={() => onSearchPayloadChange('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <button
          onClick={onExport}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors text-[11px]"
          title={t('communication.exportCapture')}
        >
          <Download className="w-3 h-3 text-cyan-400" />
          <span>{t('communication.exportBtn')}</span>
        </button>
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-red-400 transition-colors text-[11px]"
          title={t('communication.clearBuffer')}
        >
          <Trash2 className="w-3 h-3" />
          <span>{t('communication.clearBtn')}</span>
        </button>

        <button
          onClick={onOpenDieAttachTest}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600/30 border border-cyan-500/80 text-cyan-200 hover:bg-cyan-600/50 hover:text-white transition-all text-[11px] font-semibold shadow-[0_0_8px_rgba(6,182,212,0.25)]"
          title="Kiểm Tra Nghiệp Vụ Interlock Die Attach (S050/S051)"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Die Attach (S050)</span>
        </button>

        <button
          onClick={onOpenRuleAudit}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600/30 border border-indigo-500/80 text-indigo-200 hover:bg-indigo-600/50 hover:text-white transition-all text-[11px] font-semibold shadow-[0_0_8px_rgba(99,102,241,0.25)]"
          title="Báo Cáo Tra Cứu Quy Tắc Liên Khóa BIZ_ILRULE_INFO"
        >
          <FileSearch className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tra Cứu BIZ_ILRULE_INFO</span>
        </button>
      </div>
    </div>
  );
};

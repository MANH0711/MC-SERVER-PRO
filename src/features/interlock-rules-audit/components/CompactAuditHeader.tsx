import React from 'react';
import {
  FileSearch,
  RefreshCw,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { AuditApiResponse } from '../types';
import { interlockRuleApi } from '../api';

interface CompactAuditHeaderProps {
  loading: boolean;
  data: AuditApiResponse | null;
  equipmentId: string;
  onRefresh: () => void;
}

export const CompactAuditHeader: React.FC<CompactAuditHeaderProps> = ({
  loading,
  data,
  equipmentId,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <FileSearch className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-100 font-mono tracking-wide flex items-center gap-2">
            TRA CỨU QUY TẮC INTERLOCK
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-normal">
              BIZ_ILRULE_INFO
            </span>
          </h1>
          <p className="text-[11px] text-slate-400">
            Đối chiếu Model, Công Đoạn, Mã Thiết Bị & Nhóm EIF_EQP_GROUP
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors disabled:opacity-50"
          title="Làm mới kết quả tra cứu"
        >
          <RefreshCw className={`w-3 h-3 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm Mới</span>
        </button>
        <button
          onClick={() => data?.matchedRules && interlockRuleApi.exportToCsv(data.matchedRules, equipmentId)}
          disabled={!data || data.totalRules === 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 text-xs border border-emerald-500/30 transition-colors disabled:opacity-50"
          title="Xuất CSV"
        >
          <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
          <span>Xuất CSV</span>
        </button>
        <button
          onClick={() => data && interlockRuleApi.exportToJson(data)}
          disabled={!data}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 text-xs border border-indigo-500/30 transition-colors disabled:opacity-50"
          title="Xuất JSON"
        >
          <Download className="w-3 h-3 text-indigo-400" />
          <span>JSON</span>
        </button>
      </div>
    </div>
  );
};

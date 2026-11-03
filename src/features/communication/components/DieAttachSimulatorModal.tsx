import React, { useState } from 'react';
import {
  X,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Layers,
  Flame,
} from 'lucide-react';
import { useApp } from '@/core/context';
import { DeviceChangeTab, DieAttachWorkInTab, ReflowWorkInTab } from './simulator';

interface DieAttachSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRuleAudit?: (params: { equip: string; oper?: string; transCode?: string }) => void;
}

export const DieAttachSimulatorModal: React.FC<DieAttachSimulatorModalProps> = ({
  isOpen,
  onClose,
  onOpenRuleAudit,
}) => {
  const { selectedPlant } = useApp();
  const [activeTab, setActiveTab] = useState<'device-change' | 'work-in' | 'reflow'>('device-change');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150 font-sans">
      <div className="bg-[#0B111E] border border-cyan-500/50 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.25)] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-xs uppercase tracking-wider text-cyan-200">
                Thử Nghiệm Lệnh & Liên Khóa Interlock Thiết Bị
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Kiểm thử giao dịch S000 (EIF-IR010 mọi Model), S050 (Die Attach) & S090 (Reflow)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold flex items-center gap-1">
              <Building2 className="w-3 h-3 text-emerald-400" />
              PLANT: {selectedPlant}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/80 px-4 pt-1 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('device-change')}
            className={`px-3 py-1.5 text-xs font-bold font-mono rounded-t-lg transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'device-change'
                ? 'bg-[#0B111E] border-cyan-500/60 text-cyan-300 shadow-[0_-2px_10px_rgba(6,182,212,0.2)]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Device Change (S000/S001)</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
              Rule IR010
            </span>
          </button>

          <button
            onClick={() => setActiveTab('work-in')}
            className={`px-3 py-1.5 text-xs font-bold font-mono rounded-t-lg transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'work-in'
                ? 'bg-[#0B111E] border-cyan-500/60 text-cyan-300 shadow-[0_-2px_10px_rgba(6,182,212,0.2)]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Die Attach Work-In (S050/S051)</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
              Model D/A
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reflow')}
            className={`px-3 py-1.5 text-xs font-bold font-mono rounded-t-lg transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'reflow'
                ? 'bg-[#0B111E] border-orange-500/60 text-orange-300 shadow-[0_-2px_10px_rgba(249,115,22,0.2)]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Reflow Work-In (S090/S091)</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-orange-500/20 text-orange-300 border border-orange-500/40 font-mono">
              Model REFLOW
            </span>
          </button>
        </div>

        {/* Modal Body: Render Tab Component */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'device-change' && (
            <DeviceChangeTab
              selectedPlant={selectedPlant}
              onOpenRuleAudit={onOpenRuleAudit}
            />
          )}
          {activeTab === 'work-in' && (
            <DieAttachWorkInTab
              selectedPlant={selectedPlant}
              onOpenRuleAudit={onOpenRuleAudit}
            />
          )}
          {activeTab === 'reflow' && (
            <ReflowWorkInTab
              selectedPlant={selectedPlant}
              onOpenRuleAudit={onOpenRuleAudit}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn hóa giao tiếp Thiết Bị S000 (EIF-IR010), S050 (Die Attach) & S090 (Reflow)
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

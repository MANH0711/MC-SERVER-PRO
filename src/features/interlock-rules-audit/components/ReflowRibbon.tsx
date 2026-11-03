import React from 'react';
import { Flame, CheckCircle2, ShieldCheck, Database, Cpu, Layers } from 'lucide-react';

interface ReflowRibbonProps {
  isValid?: boolean;
  message?: string;
  equipId?: string;
  equipGroup?: string;
}

export const ReflowRibbon: React.FC<ReflowRibbonProps> = ({
  isValid = true,
  message,
  equipId = 'XREFL012A',
  equipGroup = 'REFLOW',
}) => {
  return (
    <div className="p-3 bg-linear-to-r from-orange-950/40 via-amber-950/30 to-slate-950 border border-orange-500/40 rounded-xl shadow-md text-orange-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2 border-b border-orange-500/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-300 shrink-0">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-orange-100 tracking-wide uppercase">
                Quy Chuẩn Liên Khóa Model REFLOW (Lò Hàn Reflow)
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-orange-500/20 text-orange-300 border border-orange-500/40">
                Lệnh S090 → S091
              </span>
            </div>
            <span className="text-[10px] text-orange-300/80 font-mono">
              Thiết bị: <strong className="text-white">{equipId}</strong> | Nhóm quy định: <strong className="text-white">REFLOW / SMT</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
            <CheckCircle2 className="w-3 h-3" />
            Scan History: AFA_SEMI_REFLOW_SCAN_HIS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-[11px] font-mono">
        <div className="p-2 rounded bg-black/40 border border-orange-500/20 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-orange-400 font-semibold block flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Mã Lệnh Giao Tiếp:
            </span>
            <span className="text-slate-200 text-[10px]">
              Gửi lên: <strong className="text-cyan-300">S090</strong> (Work-In) | Phản hồi: <strong className="text-emerald-300">S091</strong> | Heartbeat: <strong className="text-amber-300">M001</strong>
            </span>
          </div>
        </div>

        <div className="p-2 rounded bg-black/40 border border-orange-500/20 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-orange-400 font-semibold block flex items-center gap-1">
              <Layers className="w-3 h-3" /> Đối Chiếu Nhóm Oracle MES:
            </span>
            <span className="text-slate-200 text-[10px]">
              EIF_EQP_GROUP = <strong className="text-white">REFLOW</strong>, EIF_EQP_TYPE = <strong className="text-white">SMT</strong>
            </span>
          </div>
        </div>

        <div className="p-2 rounded bg-black/40 border border-orange-500/20 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-orange-400 font-semibold block flex items-center gap-1">
              <Database className="w-3 h-3" /> Thủ Tục MES & Bảng Scan:
            </span>
            <span className="text-slate-200 text-[10px]">
              Thủ tục: <strong className="text-white">P_EQPIF_RULE_INTERLOCK_MAIN</strong> (Trans: EPBV, PCB)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

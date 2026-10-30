import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { DieAttachValidation } from '../types';

interface DieAttachRibbonProps {
  isDA: boolean;
  validation?: DieAttachValidation;
  operGroup?: string;
  equipGroup?: string;
}

export const DieAttachRibbon: React.FC<DieAttachRibbonProps> = ({
  isDA,
  validation,
  operGroup,
  equipGroup,
}) => {
  if (!isDA || !validation) return null;

  const isDaValid = validation.isValid;

  return (
    <div
      className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all shrink-0 ${
        isDaValid
          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
          : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
      }`}
    >
      <div className="flex items-center gap-2">
        {isDaValid ? (
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
        )}
        <span className="font-medium text-[11px]">{validation.message}</span>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] shrink-0">
        <span className="px-1.5 py-0.5 rounded bg-black/40 border border-slate-700">
          OperGrp: <strong className={validation.isDaOper ? 'text-emerald-400' : 'text-rose-400'}>{operGroup || 'N/A'}</strong>
        </span>
        <span className="px-1.5 py-0.5 rounded bg-black/40 border border-slate-700">
          EqpGrp: <strong className={validation.isDaEquip ? 'text-emerald-400' : 'text-rose-400'}>{equipGroup || 'N/A'}</strong>
        </span>
        <span
          className={`px-2 py-0.5 rounded font-bold ${
            isDaValid
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}
        >
          {isDaValid ? 'LỆNH S050: OK' : 'LỆNH S050: CHẶN'}
        </span>
      </div>
    </div>
  );
};

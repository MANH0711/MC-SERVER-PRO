import React from 'react';
import { ServerConfig } from '@/core/types';

interface MesConfigTabProps {
  mes: ServerConfig['mes'];
  onChange: (mes: ServerConfig['mes']) => void;
  t: (key: string) => string;
}

export const MesConfigTab: React.FC<MesConfigTabProps> = ({
  mes,
  onChange,
  t,
}) => {
  return (
    <div className="space-y-3 font-sans">
      <div className="pb-1.5 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Upstream MES & Circuit Breaker
        </span>
        <span className="text-[10px] text-slate-500 font-mono">{t('config.restTlsIntegration')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="lg:col-span-2">
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            Endpoint URL
          </label>
          <input
            type="text"
            value={mes.endpointUrl}
            onChange={(e) => onChange({ ...mes, endpointUrl: e.target.value })}
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            Timeout (ms)
          </label>
          <input
            type="number"
            value={mes.timeoutMs}
            onChange={(e) => onChange({ ...mes, timeoutMs: Number(e.target.value) })}
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            Breaker Trip Threshold
          </label>
          <input
            type="number"
            value={mes.circuitBreakerFailureThreshold}
            onChange={(e) =>
              onChange({ ...mes, circuitBreakerFailureThreshold: Number(e.target.value) })
            }
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

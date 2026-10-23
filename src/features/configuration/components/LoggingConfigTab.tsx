import React from 'react';
import { ServerConfig, LogLevel } from '@/core/types';

interface LoggingConfigTabProps {
  logging: ServerConfig['logging'];
  onChange: (logging: ServerConfig['logging']) => void;
  t: (key: string) => string;
}

export const LoggingConfigTab: React.FC<LoggingConfigTabProps> = ({
  logging,
  onChange,
  t,
}) => {
  return (
    <div className="space-y-3 font-sans">
      <div className="pb-1.5 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Logging & Data Retention
        </span>
        <span className="text-[10px] text-slate-500 font-mono">{t('config.auditAndTrace')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            Minimum Log Level
          </label>
          <select
            value={logging.level}
            onChange={(e) => onChange({ ...logging, level: e.target.value as LogLevel })}
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="DEBUG">DEBUG</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            Retention Period (Days)
          </label>
          <input
            type="number"
            value={logging.retentionDays}
            onChange={(e) => onChange({ ...logging, retentionDays: Number(e.target.value) })}
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            Flush Interval (ms)
          </label>
          <input
            type="number"
            value={logging.flushIntervalMs}
            onChange={(e) => onChange({ ...logging, flushIntervalMs: Number(e.target.value) })}
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ServerConfig } from '@/core/types';

interface SecurityConfigTabProps {
  security: ServerConfig['security'];
  onChange: (security: ServerConfig['security']) => void;
  t: (key: string) => string;
}

export const SecurityConfigTab: React.FC<SecurityConfigTabProps> = ({
  security,
  onChange,
  t,
}) => {
  return (
    <div className="space-y-3 font-sans">
      <div className="pb-1.5 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Security & Access Control
        </span>
        <span className="text-[10px] text-slate-500 font-mono">{t('config.rbacAndTls')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            Session Timeout (Minutes)
          </label>
          <input
            type="number"
            value={security.sessionTimeoutMinutes}
            onChange={(e) =>
              onChange({ ...security, sessionTimeoutMinutes: Number(e.target.value) })
            }
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            Max Failed Login Attempts
          </label>
          <input
            type="number"
            value={security.maxFailedLoginAttempts}
            onChange={(e) =>
              onChange({ ...security, maxFailedLoginAttempts: Number(e.target.value) })
            }
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            Account Lockout Duration (Minutes)
          </label>
          <input
            type="number"
            value={security.lockoutDurationMinutes}
            onChange={(e) =>
              onChange({ ...security, lockoutDurationMinutes: Number(e.target.value) })
            }
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

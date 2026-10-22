/**
 * MC Server Bottom Status Bar
 * Displays operational telemetry, socket totals, memory footprint, and protocol compliance.
 */

import React from 'react';
import { Database, Network, Shield, Cpu } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { useApp } from '../context/AppContext';

export const StatusBar: React.FC = () => {
  const { t, formatNumber } = useTranslation();
  const { devices, transactions, mesStatus, config } = useApp();

  const connectedCount = devices.filter((d) => d.status === 'Connected' || d.status === 'Ready' || d.status === 'Busy').length;
  const totalRequests = devices.reduce((acc, d) => acc + d.totalRequests, 0);

  return (
    <footer className="h-7 bg-slate-950 border-t border-slate-800/80 px-3 flex items-center justify-between text-[11px] text-slate-400 select-none z-10 shrink-0 font-mono">
      {/* Left Telemetry */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>TCP PORT {config.server.listenPort}</span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="flex items-center gap-1 text-slate-300">
          <Network className="w-3 h-3 text-blue-400" />
          <span>SESSIONS: {connectedCount}/{devices.length} ACTIVE</span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="flex items-center gap-1 text-slate-300">
          <Database className="w-3 h-3 text-cyan-400" />
          <span>TX TOTAL: {formatNumber(totalRequests + transactions.length)}</span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="flex items-center gap-1 text-slate-400">
          <Cpu className="w-3 h-3 text-slate-500" />
          <span>HEAP: 48.2 MB / 1024 MB</span>
        </span>
      </div>

      {/* Right Compliance & Architecture */}
      <div className="flex items-center gap-3 text-slate-500">
        <span className="flex items-center gap-1 text-slate-400">
          <Shield className="w-3 h-3 text-emerald-500" />
          <span>{t('statusbar.rbacEnforced')}</span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-400">{t('statusbar.protoAuto')}</span>
        <span className="text-slate-700">|</span>
        <span className="text-blue-400 font-semibold">{t('statusbar.enterpriseEdition')}</span>
      </div>
    </footer>
  );
};

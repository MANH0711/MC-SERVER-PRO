import React from 'react';
import { ServerConfig } from '@/core/types';

interface NetworkConfigTabProps {
  server: ServerConfig['server'];
  onChange: (server: ServerConfig['server']) => void;
  t: (key: string) => string;
}

export const NetworkConfigTab: React.FC<NetworkConfigTabProps> = ({
  server,
  onChange,
  t,
}) => {
  return (
    <div className="space-y-3 font-sans">
      <div className="pb-1.5 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          TCP Sockets & Watchdog Settings
        </span>
        <span className="text-[10px] text-slate-500 font-mono">{t('config.portsAndSessions')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            {t('config.network.instanceName')}
          </label>
          <input
            type="text"
            value={server.instanceName}
            onChange={(e) => onChange({ ...server, instanceName: e.target.value })}
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            {t('config.network.listenPort')}
          </label>
          <input
            type="number"
            value={server.listenPort}
            onChange={(e) => onChange({ ...server, listenPort: Number(e.target.value) })}
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            {t('config.network.maxClients')}
          </label>
          <input
            type="number"
            value={server.maxConcurrentClients}
            onChange={(e) => onChange({ ...server, maxConcurrentClients: Number(e.target.value) })}
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            {t('config.network.bufferSize')}
          </label>
          <input
            type="number"
            value={server.bufferSizeLimitBytes}
            onChange={(e) => onChange({ ...server, bufferSizeLimitBytes: Number(e.target.value) })}
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            {t('config.network.keepAlive')}
          </label>
          <input
            type="number"
            value={server.keepAliveIntervalMs}
            onChange={(e) => onChange({ ...server, keepAliveIntervalMs: Number(e.target.value) })}
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            {t('config.network.watchdogTimeout')}
          </label>
          <input
            type="number"
            value={server.watchdogTimeoutMs}
            onChange={(e) => onChange({ ...server, watchdogTimeoutMs: Number(e.target.value) })}
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            {t('config.network.maxReconnectAttempts')}
          </label>
          <input
            type="number"
            value={server.reconnectMaxAttempts}
            onChange={(e) => onChange({ ...server, reconnectMaxAttempts: Number(e.target.value) })}
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            {t('config.network.backoffBase')}
          </label>
          <input
            type="number"
            value={server.backoffBaseDelayMs}
            onChange={(e) => onChange({ ...server, backoffBaseDelayMs: Number(e.target.value) })}
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

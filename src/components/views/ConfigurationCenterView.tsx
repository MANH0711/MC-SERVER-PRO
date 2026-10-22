/**
 * MC Server Configuration Center View
 * Space-optimized parameter management for socket ports, timeouts, reconnect policies, and MES endpoints.
 */

import React, { useState } from 'react';
import {
  Settings,
  Server,
  Network,
  Share2,
  Shield,
  FileCode2,
  Save,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import { ServerConfig, ChecksumAlgorithm, FrameBoundary, LogLevel } from '../../types';

export const ConfigurationCenterView: React.FC = () => {
  const { t } = useTranslation();
  const { config, updateConfig } = useApp();

  const [activeTab, setActiveTab] = useState<'network' | 'protocol' | 'mes' | 'logging' | 'security'>('network');
  const [formData, setFormData] = useState<ServerConfig>({ ...config });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    setFormData({ ...config });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 space-y-2.5 bg-[#080C15] text-slate-100">
      {/* Header Bar */}
      <div className="h-11 px-3 rounded bg-slate-900/90 border border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            {t('config.title')}
          </h2>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            SYSTEM PARAMETERS ENGINE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('config.saved')}</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('config.resetBtn')}</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-xs"
          >
            <Save className="w-3 h-3" />
            <span>{t('config.saveBtn')}</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher Bar */}
      <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded border border-slate-800/80 text-xs shrink-0">
        <button
          onClick={() => setActiveTab('network')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'network' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>{t('config.tabs.network')}</span>
        </button>
        <button
          onClick={() => setActiveTab('protocol')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'protocol' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>{t('config.tabs.protocol')}</span>
        </button>
        <button
          onClick={() => setActiveTab('mes')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'mes' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{t('config.tabs.mes')}</span>
        </button>
        <button
          onClick={() => setActiveTab('logging')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'logging' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>{t('config.tabs.logging')}</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'security' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{t('config.tabs.security')}</span>
        </button>
      </div>

      {/* Form Content - Space-Optimized */}
      <div className="flex-1 rounded bg-slate-900/90 border border-slate-800/80 p-3.5 overflow-y-auto min-h-0 text-xs">
        <form onSubmit={handleSave} className="space-y-3">
          {/* Tab 1: Network & Socket */}
          {activeTab === 'network' && (
            <div className="space-y-3">
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
                    value={formData.server.instanceName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        server: { ...formData.server, instanceName: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('config.network.listenPort')}
                  </label>
                  <input
                    type="number"
                    value={formData.server.listenPort}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        server: { ...formData.server, listenPort: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('config.network.maxClients')}
                  </label>
                  <input
                    type="number"
                    value={formData.server.maxConcurrentClients}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        server: { ...formData.server, maxConcurrentClients: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('config.network.bufferSize')}
                  </label>
                  <input
                    type="number"
                    value={formData.server.bufferSizeLimitBytes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        server: { ...formData.server, bufferSizeLimitBytes: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('config.network.keepAlive')}
                  </label>
                  <input
                    type="number"
                    value={formData.server.keepAliveIntervalMs}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        server: { ...formData.server, keepAliveIntervalMs: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('config.network.watchdogTimeout')}
                  </label>
                  <input
                    type="number"
                    value={formData.server.watchdogTimeoutMs}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        server: { ...formData.server, watchdogTimeoutMs: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('config.network.maxReconnectAttempts')}
                  </label>
                  <input
                    type="number"
                    value={formData.server.reconnectMaxAttempts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        server: { ...formData.server, reconnectMaxAttempts: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('config.network.backoffBase')}
                  </label>
                  <input
                    type="number"
                    value={formData.server.backoffBaseDelayMs}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        server: { ...formData.server, backoffBaseDelayMs: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Protocol Options */}
          {activeTab === 'protocol' && (
            <div className="space-y-3">
              <div className="pb-1.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Framing & Boundary Rules
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{t('config.semiCustomProtocol')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('config.defaultBoundaryLabel')}
                  </label>
                  <select
                    value={formData.protocol.defaultBoundary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        protocol: { ...formData.protocol, defaultBoundary: e.target.value as FrameBoundary },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="AUTO_DETECT">AUTO_DETECT (Dual Support 20.013 & 20.014)</option>
                    <option value="20013_STANDARD">20013_STANDARD (Strict ETX 0x03)</option>
                    <option value="20014_EXTENDED">20014_EXTENDED (ETX + LF 0x0A or Null 0x00)</option>
                    <option value="VARIABLE_LENGTH">VARIABLE_LENGTH (Variable Sized Frames)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('config.defaultChecksumLabel')}
                  </label>
                  <select
                    value={formData.protocol.checksumAlgorithm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        protocol: { ...formData.protocol, checksumAlgorithm: e.target.value as ChecksumAlgorithm },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="LRC_MOD256">LRC Modulo-256 (Default)</option>
                    <option value="XOR_HEX">XOR 8-Bit</option>
                    <option value="CRC16_CCITT">CRC16-CCITT (16-Bit Polynomial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('config.delimitersLabel')}
                  </label>
                  <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs flex justify-between">
                    <span>STX: 0x02</span>
                    <span>ETX: 0x03</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: MES Integration */}
          {activeTab === 'mes' && (
            <div className="space-y-3">
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
                    value={formData.mes.endpointUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mes: { ...formData.mes, endpointUrl: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={formData.mes.timeoutMs}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mes: { ...formData.mes, timeoutMs: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    Breaker Trip Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.mes.circuitBreakerFailureThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mes: { ...formData.mes, circuitBreakerFailureThreshold: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Logging */}
          {activeTab === 'logging' && (
            <div className="space-y-3">
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
                    value={formData.logging.level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        logging: { ...formData.logging, level: e.target.value as LogLevel },
                      })
                    }
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
                    value={formData.logging.retentionDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        logging: { ...formData.logging, retentionDays: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="maskCheck"
                    checked={formData.logging.maskSensitivePayloads}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        logging: { ...formData.logging, maskSensitivePayloads: e.target.checked },
                      })
                    }
                    className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                  />
                  <label htmlFor="maskCheck" className="text-slate-300 text-[11px]">
                    Mask secrets & tokens
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Security */}
          {activeTab === 'security' && (
            <div className="space-y-3">
              <div className="pb-1.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Security Policies & Safeguards
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{t('config.rbacAccess')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    Session Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.security.sessionTimeoutMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        security: { ...formData.security, sessionTimeoutMinutes: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="auditNoteCheck"
                    checked={formData.security.requireAuditNoteForEquipmentChanges}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        security: {
                          ...formData.security,
                          requireAuditNoteForEquipmentChanges: e.target.checked,
                        },
                      })
                    }
                    className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                  />
                  <label htmlFor="auditNoteCheck" className="text-slate-300 text-[11px]">
                    Require sign-off notes for IP/Port updates
                  </label>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

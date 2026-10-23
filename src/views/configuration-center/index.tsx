/**
 * MC Server Industrial Enterprise Edition
 * Configuration Center Form (File Cha Điều Phối)
 * 
 * Quản trị toàn bộ các tham số cấu hình hệ thống máy chủ:
 * - NetworkConfigTab: Cấu hình cổng lắng nghe TCP Sockets, buffer, keep-alive, watchdog
 * - ProtocolConfigTab: Cấu hình phân tách khung truyền STX/ETX, thuật toán Checksum LRC/CRC
 * - MesConfigTab: Cấu hình cổng kết nối upstream MES và Circuit Breaker
 * - LoggingConfigTab: Cấu hình mức độ Log, chu kỳ dọn dẹp và flush bộ đệm
 * - SecurityConfigTab: Cấu hình chính sách bảo mật, thời gian timeout phiên và khóa tài khoản
 */

import React, { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  Network,
  FileCode2,
  Share2,
  Server,
  Shield,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import { ServerConfig } from '../../types';

// Các sub-components thuộc form Configuration Center
import { NetworkConfigTab } from './components/NetworkConfigTab';
import { ProtocolConfigTab } from './components/ProtocolConfigTab';
import { MesConfigTab } from './components/MesConfigTab';
import { LoggingConfigTab } from './components/LoggingConfigTab';
import { SecurityConfigTab } from './components/SecurityConfigTab';

export const ConfigurationCenterView: React.FC = () => {
  const { t } = useTranslation();
  const { serverConfig, updateServerConfig } = useApp();

  const [activeTab, setActiveTab] = useState<'network' | 'protocol' | 'mes' | 'logging' | 'security'>('network');
  const [formData, setFormData] = useState<ServerConfig>({ ...serverConfig });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateServerConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    setFormData({ ...serverConfig });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-2.5 sm:p-3 space-y-2 bg-[#070B14] text-slate-100 font-sans">
      {/* ─── 1. Header Toolbar (Compact) ─── */}
      <div className="px-3 py-1.5 rounded-lg bg-[#0C1220]/95 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Settings className="w-3.5 h-3.5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 leading-none">
              {t('config.title')}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 leading-none">
              {t('config.subtitle')}
            </p>
          </div>
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
            onClick={() => handleSave()}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-xs"
          >
            <Save className="w-3 h-3" />
            <span>{t('config.saveBtn')}</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Tabs Switcher Bar ─── */}
      <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded border border-slate-800/80 text-xs shrink-0 font-sans">
        <button
          onClick={() => setActiveTab('network')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'network' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>{t('config.tabs.network')}</span>
        </button>
        <button
          onClick={() => setActiveTab('protocol')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'protocol' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>{t('config.tabs.protocol')}</span>
        </button>
        <button
          onClick={() => setActiveTab('mes')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'mes' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{t('config.tabs.mes')}</span>
        </button>
        <button
          onClick={() => setActiveTab('logging')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'logging' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>{t('config.tabs.logging')}</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'security' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{t('config.tabs.security')}</span>
        </button>
      </div>

      {/* ─── 3. Form Content (Modular Tabs) ─── */}
      <div className="flex-1 rounded-lg bg-slate-900/90 border border-slate-800/80 p-3.5 overflow-y-auto min-h-0 text-xs">
        <form onSubmit={handleSave} className="space-y-3">
          {activeTab === 'network' && (
            <NetworkConfigTab
              server={formData.server}
              onChange={(s) => setFormData({ ...formData, server: s })}
              t={t}
            />
          )}

          {activeTab === 'protocol' && (
            <ProtocolConfigTab
              protocol={formData.protocol}
              onChange={(p) => setFormData({ ...formData, protocol: p })}
              t={t}
            />
          )}

          {activeTab === 'mes' && (
            <MesConfigTab
              mes={formData.mes}
              onChange={(m) => setFormData({ ...formData, mes: m })}
              t={t}
            />
          )}

          {activeTab === 'logging' && (
            <LoggingConfigTab
              logging={formData.logging}
              onChange={(l) => setFormData({ ...formData, logging: l })}
              t={t}
            />
          )}

          {activeTab === 'security' && (
            <SecurityConfigTab
              security={formData.security}
              onChange={(sec) => setFormData({ ...formData, security: sec })}
              t={t}
            />
          )}
        </form>
      </div>
    </div>
  );
};

export default ConfigurationCenterView;

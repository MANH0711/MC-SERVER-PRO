/**
 * MC Server Top Bar Header
 * Sleek, glassmorphic industrial control header with factory breadcrumbs, MES link indicator,
 * 4-language switcher, theme toggle, and millisecond system clock.
 */

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Bell,
  Play,
  Pause,
  Server,
  CloudLightning,
  User,
  Sun,
  Moon,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n/LanguageContext';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const TopBar: React.FC = () => {
  const { t, language, setLanguage, formatTimeOnly } = useTranslation();
  const {
    serverOnline,
    setServerOnline,
    mesStatus,
    alarms,
    isSimulating,
    toggleSimulation,
    userSession,
    switchUserRole,
    theme,
    setTheme,
    setActiveView,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [langMenuOpen, setLangMenuOpen] = useState<boolean>(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 250);
    return () => clearInterval(timer);
  }, []);

  const unacknowledgedAlarms = alarms.filter((a) => !a.acknowledged);

  return (
    <header className="h-14 bg-[#0B101D]/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-10 shrink-0 select-none">
      {/* Left: Factory Line & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span>{t('topbar.factoryName')}</span>
            <span className="text-slate-600">/</span>
            <span className="text-blue-400 font-bold">SMT Line-A & B</span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-0.5">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  serverOnline
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse'
                    : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                }`}
              />
              <span className="font-mono text-slate-300">
                {t('topbar.serverStatus')}: {serverOnline ? t('topbar.serverOnline') : t('topbar.serverOffline')}
              </span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5">
              <CloudLightning
                className={`w-3.5 h-3.5 ${
                  mesStatus.connected ? 'text-emerald-400' : 'text-amber-400 animate-bounce'
                }`}
              />
              <span className="font-mono text-slate-300">
                MES:{' '}
                <span
                  className={
                    mesStatus.circuitBreakerState === 'CLOSED'
                      ? 'text-emerald-400 font-semibold'
                      : mesStatus.circuitBreakerState === 'HALF_OPEN'
                      ? 'text-amber-400 font-semibold'
                      : 'text-red-400 font-semibold'
                  }
                >
                  {mesStatus.circuitBreakerState}
                </span>
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Live Shopfloor Simulation Toggle */}
        <button
          onClick={toggleSimulation}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors ${
            isSimulating
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title={isSimulating ? 'Pause traffic simulator' : 'Resume traffic simulator'}
        >
          {isSimulating ? (
            <>
              <Pause className="w-3.5 h-3.5 text-blue-400" />
              <span>SIM: ON</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-slate-400" />
              <span>SIM: OFF</span>
            </>
          )}
        </button>

        {/* Server Start/Stop */}
        <button
          onClick={() => setServerOnline(!serverOnline)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
            serverOnline
              ? 'bg-emerald-600/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/25'
              : 'bg-red-600/20 text-red-300 border-red-500/40 hover:bg-red-600/30'
          }`}
        >
          <Server className="w-3 h-3" />
          <span>{serverOnline ? 'ONLINE' : 'STOPPED'}</span>
        </button>

        {/* Alarm Ticker Bell */}
        <button
          onClick={() => setActiveView('alarmCenter')}
          className="relative p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          title={`${unacknowledgedAlarms.length} unacknowledged alarms`}
        >
          <Bell className="w-4 h-4" />
          {unacknowledgedAlarms.length > 0 && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        {/* 4-Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 border border-slate-700 text-slate-200 text-xs hover:border-slate-500 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">
              {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.flag}{' '}
              {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-[#0F172A] border border-slate-700 rounded shadow-2xl py-1 z-50">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setLangMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    language === l.code ? 'text-blue-400 font-bold bg-slate-800/60' : 'text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{l.code.split('-')[0].toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Toggle Dark/Light Industrial Theme"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
        </button>

        {/* User Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 pl-2.5 pr-2 py-1 rounded bg-slate-800/90 border border-slate-700 text-slate-200 text-xs hover:border-slate-500 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <div className="text-left leading-tight hidden md:block">
              <span className="font-mono text-[9px] text-slate-400 block">{userSession.role}</span>
              <span className="font-semibold text-xs text-slate-200 block truncate max-w-[110px]">
                {userSession.displayName.split(' ')[0]}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-[#0F172A] border border-slate-700 rounded shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                SWITCH RBAC ROLE
              </div>
              {(['OPERATOR', 'SUPERVISOR', 'ENGINEER', 'ADMIN'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    switchUserRole(role);
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    userSession.role === role ? 'text-blue-400 font-bold bg-slate-800/60' : 'text-slate-200'
                  }`}
                >
                  <span>{t(`topbar.${role.toLowerCase()}`)}</span>
                  <span className="text-[10px] font-mono text-slate-500">{role}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Clock with Milliseconds */}
        <div className="hidden xl:flex flex-col text-right pl-3 border-l border-slate-800/80 font-mono">
          <span className="text-xs text-slate-100 font-bold tracking-wider tabular-nums">
            {formatTimeOnly(currentTime)}
          </span>
          <span className="text-[9px] text-slate-500">
            {currentTime.toISOString().split('T')[0]} (UTC+7)
          </span>
        </div>
      </div>
    </header>
  );
};

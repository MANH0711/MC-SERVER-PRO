/**
 * MC Server Top Bar Header
 * Sleek, glassmorphic industrial control header displaying:
 * - Live real-time API connection status (Ping & Latency)
 * - Real Oracle DB & MES status
 * - Live Active EQP Sockets count
 * - 4-language switcher, theme toggle, and millisecond system clock
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Bell,
  Server,
  CloudLightning,
  User,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Users,
  Database,
  Cpu,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES } from '@/core/i18n';
import { useApp } from '@/core/context';
import { UserRole } from '@/core/types';

interface ApiStatusState {
  connected: boolean;
  latencyMs: number;
  httpPort: number;
  grpcPort: number;
  activeSockets: number;
  oracleTns: string;
  oracleConnected: boolean;
  checking: boolean;
}

const BACKEND_URL = 'http://localhost:3005';

export const TopBar: React.FC = () => {
  const { t, language, setLanguage, formatTimeOnly } = useTranslation();
  const {
    serverOnline,
    setServerOnline,
    mesStatus,
    alarms,
    userSession,
    switchUserRole,
    users,
    switchActiveUser,
    theme,
    setTheme,
    setActiveView,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [langMenuOpen, setLangMenuOpen] = useState<boolean>(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState<boolean>(false);

  // Trạng thái kết nối thực tế tới Backend API
  const [apiStatus, setApiStatus] = useState<ApiStatusState>({
    connected: false,
    latencyMs: 0,
    httpPort: 3005,
    grpcPort: 50051,
    activeSockets: 0,
    oracleTns: 'ITMVMES',
    oracleConnected: true,
    checking: false,
  });

  // Kiểm tra sức khỏe kết nối API Backend thực tế
  const checkApiHealth = useCallback(async () => {
    setApiStatus((prev) => ({ ...prev, checking: true }));
    const startTime = performance.now();
    try {
      const resp = await fetch(`${BACKEND_URL}/api/system/health`, {
        signal: AbortSignal.timeout(2500),
      });

      if (resp.ok) {
        const data = await resp.json();
        const latency = Math.round(performance.now() - startTime);
        const oracleConn =
          data.oracle?.tnsList?.ITMVMES?.status === 'CONNECTED' || !data.oracle?.isFallbackMode;

        setApiStatus({
          connected: true,
          latencyMs: latency,
          httpPort: data.network?.httpPort || 3005,
          grpcPort: data.network?.grpcPort || 50051,
          activeSockets: data.network?.activeSocketsCount ?? 0,
          oracleTns: 'ITMVMES',
          oracleConnected: !!oracleConn,
          checking: false,
        });

        if (!serverOnline) {
          setServerOnline(true);
        }
        return;
      }
    } catch {
      // Backend không phản hồi
    }

    setApiStatus((prev) => ({
      ...prev,
      connected: false,
      latencyMs: 0,
      checking: false,
    }));

    if (serverOnline) {
      setServerOnline(false);
    }
  }, [serverOnline, setServerOnline]);

  // Đồng hồ mili-giây
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 250);
    return () => clearInterval(timer);
  }, []);

  // Lặp kiểm tra trạng thái API thực tế mỗi 3.5 giây
  useEffect(() => {
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 3500);
    return () => clearInterval(interval);
  }, [checkApiHealth]);

  const unacknowledgedAlarms = alarms.filter((a) => !a.acknowledged);
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'text-rose-300 bg-rose-500/15 border-rose-500/40';
      case 'ENGINEER':
        return 'text-indigo-300 bg-indigo-500/15 border-indigo-500/40';
      case 'SUPERVISOR':
        return 'text-sky-300 bg-sky-500/15 border-sky-500/40';
      case 'OPERATOR':
      default:
        return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40';
    }
  };

  return (
    <header className="h-14 bg-[#0B101D]/95 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Invisible backdrop to dismiss menus when clicking outside */}
      {(langMenuOpen || roleMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-transparent cursor-default"
          onClick={() => {
            setLangMenuOpen(false);
            setRoleMenuOpen(false);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* LEFT: BRAND, INDUSTRIAL LINE BREADCRUMBS & LIVE BACKEND API STATUS        */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-3">
        {/* Company Logo Badge */}
        <div className="h-8 px-2.5 rounded-lg bg-white/95 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-sm hover:opacity-95 transition-opacity">
          <img
            src="/logo.png"
            alt="Company Logo"
            className="h-4.5 w-auto object-contain"
          />
        </div>

        {/* Factory Hierarchy */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span className="tracking-tight">{t('topbar.factoryName')}</span>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-400 font-bold">SMT & BE Factory</span>
          </div>

          {/* Sub-status: Real API + Oracle DB + MES */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            {/* Real API Status Indicator */}
            <div
              onClick={() => checkApiHealth()}
              className={`flex items-center gap-1.5 px-1.5 py-0.2 rounded border cursor-pointer transition-colors ${
                apiStatus.connected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
              }`}
              title="Nhấp để kiểm tra lại kết nối API ngay lập tức"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  apiStatus.connected
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
                    : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]'
                }`}
              />
              <span className="font-mono text-[10px] font-semibold">
                {apiStatus.connected ? `API :${apiStatus.httpPort}` : 'API OFFLINE'}
              </span>
              {apiStatus.connected && (
                <span className="font-mono text-[9px] text-emerald-400 font-bold">
                  {apiStatus.latencyMs}ms
                </span>
              )}
              {apiStatus.checking && <RefreshCw className="w-2.5 h-2.5 animate-spin text-slate-400" />}
            </div>

            <span className="text-slate-700">|</span>

            {/* Oracle DB Connection Indicator */}
            <div
              className="flex items-center gap-1 font-mono text-[10px] text-slate-300"
              title="Trạng thái kết nối Oracle Database thực tế"
            >
              <Database className="w-3 h-3 text-blue-400" />
              <span>DB:</span>
              <span
                className={`font-semibold ${
                  apiStatus.oracleConnected ? 'text-blue-300' : 'text-amber-400'
                }`}
              >
                {apiStatus.oracleTns}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  apiStatus.oracleConnected ? 'bg-blue-400' : 'bg-amber-400'
                }`}
              />
            </div>

            <span className="text-slate-700 hidden sm:inline">|</span>

            {/* MES Connection State */}
            <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-slate-300">
              <CloudLightning
                className={`w-3 h-3 ${
                  mesStatus.connected ? 'text-amber-400' : 'text-slate-500'
                }`}
              />
              <span>MES:</span>
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
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT: REAL SOCKETS BADGE, ALARMS, LANGUAGE, USER PROFILE & SYSTEM CLOCK  */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2">
        {/* Real Equipment Socket Connection Badge */}
        <button
          onClick={() => setActiveView('communication')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-xs font-mono text-slate-300 transition-colors shadow-xs"
          title="Xem chi tiết kết nối TCP Socket với máy ngoài xưởng"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px]">EQP:</span>
          <span
            className={`font-bold text-[11px] ${
              apiStatus.activeSockets > 0 ? 'text-cyan-300' : 'text-slate-400'
            }`}
          >
            {apiStatus.activeSockets} Socket
          </span>
          {apiStatus.activeSockets > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>

        {/* Alarm Ticker Bell */}
        <button
          onClick={() => setActiveView('alarmCenter')}
          className="relative p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          title={`${unacknowledgedAlarms.length} ${t('topbar.unackAlarmsCount')}`}
        >
          <Bell className="w-4 h-4" />
          {unacknowledgedAlarms.length > 0 && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        {/* 1. 4-LANGUAGE SWITCHER */}
        <div className="relative">
          <button
            onClick={() => {
              setLangMenuOpen(!langMenuOpen);
              setRoleMenuOpen(false);
            }}
            className="h-8 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 border border-slate-700/80 text-slate-200 text-xs hover:border-slate-500 transition-colors whitespace-nowrap"
            title={t('topbar.langDropdownTitle')}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="px-1 py-0.2 rounded bg-blue-500/15 text-blue-400 font-mono text-[10px] font-bold shrink-0">
              {currentLang.flag}
            </span>
            <span className="font-semibold text-xs text-slate-200 whitespace-nowrap">
              {currentLang.label}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                langMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 bg-[#0F172A] border border-slate-700/90 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-800/80 mb-1">
                {t('topbar.langDropdownHeader')}
              </div>
              <div className="space-y-0.5 px-1">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between rounded-md transition-colors whitespace-nowrap ${
                      language === l.code
                        ? 'text-blue-400 font-bold bg-blue-600/15 border border-blue-500/30'
                        : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px] font-bold">
                        {l.flag}
                      </span>
                      <span className="font-medium">{l.label}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {l.code.split('-')[0].toUpperCase()}
                      </span>
                      {language === l.code && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title={t('topbar.themeToggle')}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-blue-400" />
          )}
        </button>

        {/* 2. USER PROFILE & RBAC ROLE SWITCHER */}
        <div className="relative">
          <button
            onClick={() => {
              setRoleMenuOpen(!roleMenuOpen);
              setLangMenuOpen(false);
            }}
            className="h-8 flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/90 border border-slate-700/80 text-slate-200 text-xs hover:border-slate-500 transition-colors whitespace-nowrap"
            title={t('topbar.userDropdownTitle')}
          >
            {/* User Avatar Circle with Online indicator */}
            <div className="relative w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">
              <User className="w-3 h-3" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 ring-1 ring-slate-900" />
            </div>

            {/* Role Badge */}
            <span
              className={`px-1.5 py-0.2 rounded border font-mono text-[9px] font-bold shrink-0 ${getRoleBadge(
                userSession.role
              )}`}
            >
              {userSession.role}
            </span>

            {/* Display Name */}
            <span className="font-semibold text-xs text-slate-200 whitespace-nowrap truncate max-w-[120px] hidden sm:inline">
              {userSession.displayName}
            </span>

            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform duration-150 shrink-0 ${
                roleMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-[#0F172A] border border-slate-700/90 rounded-lg shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Current Session Profile Strip */}
              <div className="px-3 pb-2 border-b border-slate-800/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-100 truncate">
                      {userSession.displayName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 truncate">
                      @{userSession.username}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {userSession.department}
                  </p>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono font-bold shrink-0 ${getRoleBadge(
                    userSession.role
                  )}`}
                >
                  {userSession.role}
                </span>
              </div>

              {/* Section 1: Switch Account from users list */}
              <div className="px-3 pt-2 pb-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>{t('topbar.selectUserAccount')}</span>
                <span className="text-[9px] text-slate-600">
                  {users.length} {t('topbar.accountsCount')}
                </span>
              </div>
              <div className="max-h-44 overflow-y-auto space-y-0.5 px-1 divide-y divide-slate-800/30">
                {users.map((u) => {
                  const isCurrent = userSession.username === u.username;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchActiveUser(u);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors whitespace-nowrap group ${
                        isCurrent
                          ? 'bg-blue-600/15 text-blue-300 font-bold border border-blue-500/30'
                          : 'hover:bg-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[9px] text-slate-300 shrink-0">
                          {u.displayName.charAt(0)}
                        </div>
                        <div className="min-w-0 text-left">
                          <span className="font-medium text-xs block truncate max-w-[130px]">
                            {u.displayName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[110px]">
                            @{u.username}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-mono font-bold ${getRoleBadge(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Section 2: Quick Test Role Switcher */}
              <div className="px-3 pt-2 pb-1 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {t('topbar.testRbacRole')}
              </div>
              <div className="grid grid-cols-4 gap-1 px-2.5 pb-1 font-mono text-[10px]">
                {(['OPERATOR', 'SUPERVISOR', 'ENGINEER', 'ADMIN'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      switchUserRole(role);
                      setRoleMenuOpen(false);
                    }}
                    className={`py-1 rounded text-center border transition-colors ${
                      userSession.role === role
                        ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-sm shadow-blue-500/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {role === 'OPERATOR'
                      ? 'OP'
                      : role === 'SUPERVISOR'
                      ? 'SUP'
                      : role === 'ENGINEER'
                      ? 'ENG'
                      : 'ADM'}
                  </button>
                ))}
              </div>

              {/* Section 3: Navigation to User Management View */}
              <div className="pt-1 border-t border-slate-800/80 px-2">
                <button
                  onClick={() => {
                    setActiveView('users');
                    setRoleMenuOpen(false);
                  }}
                  className="w-full text-center px-2 py-1 rounded text-[11px] text-blue-400 hover:text-blue-300 hover:bg-slate-800/60 font-mono transition-colors flex items-center justify-center gap-1"
                >
                  <Users className="w-3 h-3" />
                  <span>{t('topbar.openUserManagement')}</span>
                </button>
              </div>
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

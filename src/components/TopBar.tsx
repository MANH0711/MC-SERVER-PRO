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
  Check,
  Users,
} from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n/LanguageContext';
import { useApp } from '../context/AppContext';
import { UserRole, SystemUser } from '../types';

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
    users,
    switchActiveUser,
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
    <header className="h-14 bg-[#0B101D]/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-20 shrink-0 select-none">
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

        {/* 1. 4-LANGUAGE SWITCHER (TỐI ƯU KHUNG KÉO XUỐNG VỪA VẶN & ĐẸP) */}
        <div className="relative">
          <button
            onClick={() => {
              setLangMenuOpen(!langMenuOpen);
              setRoleMenuOpen(false);
            }}
            className="h-8 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 border border-slate-700/80 text-slate-200 text-xs hover:border-slate-500 transition-colors whitespace-nowrap"
            title="Chọn ngôn ngữ hiển thị"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="px-1 py-0.2 rounded bg-blue-500/15 text-blue-400 font-mono text-[10px] font-bold shrink-0">
              {currentLang.flag}
            </span>
            <span className="font-semibold text-xs text-slate-200 whitespace-nowrap">
              {currentLang.label}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${langMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 bg-[#0F172A] border border-slate-700/90 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-800/80 mb-1">
                CHỌN NGÔN NGỮ (LANGUAGE)
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
                      <span className="text-[10px] text-slate-500 font-mono">{l.code.split('-')[0].toUpperCase()}</span>
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
          title="Toggle Dark/Light Industrial Theme"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
        </button>

        {/* 2. USER SELECTOR (TRÁNH XUỐNG DÒNG, THIẾT KẾ ĐẸP, ĐỒNG BỘ 1 DÒNG) */}
        <div className="relative">
          <button
            onClick={() => {
              setRoleMenuOpen(!roleMenuOpen);
              setLangMenuOpen(false);
            }}
            className="h-8 flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/90 border border-slate-700/80 text-slate-200 text-xs hover:border-slate-500 transition-colors whitespace-nowrap"
            title="Tài khoản người dùng & Quyền hạn"
          >
            {/* User Avatar Circle with Online indicator */}
            <div className="relative w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">
              <User className="w-3 h-3" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 ring-1 ring-slate-900" />
            </div>

            {/* Role Badge (Single-line) */}
            <span className={`px-1.5 py-0.2 rounded border font-mono text-[9px] font-bold shrink-0 ${getRoleBadge(userSession.role)}`}>
              {userSession.role}
            </span>

            {/* Display Name (Single-line, NO WRAPPING) */}
            <span className="font-semibold text-xs text-slate-200 whitespace-nowrap truncate max-w-[120px] hidden sm:inline">
              {userSession.displayName}
            </span>

            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 shrink-0 ${roleMenuOpen ? 'rotate-180' : ''}`} />
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
                <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono font-bold shrink-0 ${getRoleBadge(userSession.role)}`}>
                  {userSession.role}
                </span>
              </div>

              {/* Section 1: Switch Account from users list */}
              <div className="px-3 pt-2 pb-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>CHỌN TÀI KHOẢN NGƯỜI DÙNG</span>
                <span className="text-[9px] text-slate-600">{users.length} tài khoản</span>
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
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-mono font-bold ${getRoleBadge(u.role)}`}>
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
                CHUYỂN VAI TRÒ THỬ NGHIỆM (TEST RBAC)
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
                    {role === 'OPERATOR' ? 'OP' : role === 'SUPERVISOR' ? 'SUP' : role === 'ENGINEER' ? 'ENG' : 'ADM'}
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
                  <span>Mở Trang Phân Quyền & Quản Lý User (RBAC) →</span>
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

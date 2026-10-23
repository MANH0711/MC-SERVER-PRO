/**
 * MC Server Industrial Navigation Sidebar
 * Clean, high-density, collapsible navigation menu with Lucide vector icons and active badges.
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Activity,
  FileCode2,
  Share2,
  AlertTriangle,
  ScrollText,
  Settings,
  ShieldCheck,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { useApp, NavView } from '@/core/context';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { activeView, setActiveView, alarms } = useApp();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const unacknowledgedAlarms = alarms.filter((a) => !a.acknowledged).length;

  const navItems: { id: NavView; labelKey: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { id: 'equipment', labelKey: 'nav.equipment', icon: Cpu },
    { id: 'communication', labelKey: 'nav.communication', icon: Activity },
    { id: 'protocol', labelKey: 'nav.protocol', icon: FileCode2 },
    { id: 'mesMonitor', labelKey: 'nav.mesMonitor', icon: Share2 },
    {
      id: 'alarmCenter',
      labelKey: 'nav.alarmCenter',
      icon: AlertTriangle,
      badge: unacknowledgedAlarms > 0 ? unacknowledgedAlarms : undefined,
    },
    { id: 'logs', labelKey: 'nav.logs', icon: ScrollText },
    { id: 'configuration', labelKey: 'nav.configuration', icon: Settings },
    { id: 'users', labelKey: 'nav.users', icon: ShieldCheck },
    { id: 'systemHealth', labelKey: 'nav.systemHealth', icon: HeartPulse },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-[#0B101D] border-r border-slate-800/80 transition-all duration-200 select-none z-20 shrink-0 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header with Company Logo */}
      <div className="h-14 flex items-center px-3 border-b border-slate-800/80 justify-between bg-slate-950/40">
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/95 p-0.5 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-sm overflow-hidden group">
            <img
              src="/assets/images/logomini.png"
              alt="ITM Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {!collapsed && (
            <div className="leading-tight truncate flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-slate-100 text-xs truncate">
                  ITM MC-SERVER
                </span>
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                  PRO
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono tracking-wider block font-semibold truncate">
                ITM SEMICONDUCTOR
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors shrink-0"
          title={collapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-semibold transition-all relative group ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title={collapsed ? t(item.labelKey) : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!collapsed && (
                <span className="truncate flex-1 text-left">{t(item.labelKey)}</span>
              )}
              {item.badge !== undefined && (
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    collapsed
                      ? 'absolute top-1 right-1 bg-red-600 text-white'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-blue-500 rounded-r" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info & Company Branding */}
      <div className="p-2.5 border-t border-slate-800/80 text-[10px] text-slate-500 bg-slate-950/40">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-400 font-medium">v2.4.0-ENT</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse"></span>
                {t('sidebar.coreActive')}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between gap-1.5">
              <span className="text-[9px] font-mono text-slate-400 truncate">ITM Semiconductor</span>
              <img
                src="/assets/images/ItmLogo.png"
                alt="ITM Semiconductor Logo"
                className="h-3.5 w-auto object-contain bg-white/95 px-1.5 py-0.5 rounded shadow-2xs"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse"></span>
          </div>
        )}
      </div>
    </aside>
  );
};

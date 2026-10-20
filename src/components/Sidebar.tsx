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
import { useTranslation } from '../i18n/LanguageContext';
import { useApp, NavView } from '../context/AppContext';

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
      {/* Brand Header */}
      <div className="h-14 flex items-center px-3.5 border-b border-slate-800/80 justify-between bg-slate-950/40">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          {!collapsed && (
            <div className="leading-tight truncate">
              <span className="font-extrabold tracking-tight text-slate-100 text-xs block">
                MC SERVER
              </span>
              <span className="text-[9px] text-blue-400 font-mono tracking-wider block font-bold">
                ENTERPRISE
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-800/80 text-[10px] text-slate-500 bg-slate-950/40">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <span className="font-mono text-slate-400 font-medium">v2.4.0-ENT</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse"></span>
              CORE ACTIVE
            </span>
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

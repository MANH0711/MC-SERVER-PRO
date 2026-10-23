import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';

interface UserToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  roleFilter: string;
  onRoleFilterChange: (r: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  onReset: () => void;
  t: (key: string) => string;
}

export const UserToolbar: React.FC<UserToolbarProps> = ({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onReset,
  t,
}) => {
  return (
    <div className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs font-sans">
      <div className="flex items-center gap-1.5 flex-wrap flex-1">
        {/* Search */}
        <div className="relative min-w-[160px] sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('users.searchPlaceholder')}
            className="w-full pl-7 pr-6 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">{t('users.roles.all')}</option>
          <option value="ADMIN">{t('users.roles.admin')}</option>
          <option value="ENGINEER">{t('users.roles.engineer')}</option>
          <option value="SUPERVISOR">{t('users.roles.supervisor')}</option>
          <option value="OPERATOR">{t('users.roles.operator')}</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">{t('users.statuses.all')}</option>
          <option value="ACTIVE">{t('users.statuses.active')}</option>
          <option value="LOCKED">{t('users.statuses.locked')}</option>
        </select>

        {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            onClick={onReset}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
            title={t('users.resetFilter')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

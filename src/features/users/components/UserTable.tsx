import React from 'react';
import {
  Users,
  Edit2,
  Trash2,
  Lock,
  Unlock,
} from 'lucide-react';
import { SystemUser, UserRole } from '@/core/types';

interface UserTableProps {
  filteredUsers: SystemUser[];
  activeUsername: string;
  onEdit: (user: SystemUser) => void;
  onDelete: (user: SystemUser) => void;
  onToggleStatus: (userId: string, currentStatus: 'ACTIVE' | 'LOCKED') => void;
  getRoleBadge: (role: UserRole) => string;
  t: (key: string) => string;
}

export const UserTable: React.FC<UserTableProps> = ({
  filteredUsers,
  activeUsername,
  onEdit,
  onDelete,
  onToggleStatus,
  getRoleBadge,
  t,
}) => {
  return (
    <div className="flex-1 min-h-0 overflow-auto rounded border border-slate-800/90 bg-slate-900/60 shadow-inner font-sans">
      <table className="w-full text-left font-mono text-[11px] border-collapse">
        <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
          <tr>
            <th className="py-1.5 px-2.5 w-[140px]">{t('users.tableHeaders.username')}</th>
            <th className="py-1.5 px-2.5 w-[180px]">{t('users.tableHeaders.fullName')}</th>
            <th className="py-1.5 px-2 w-[100px] text-center">{t('users.tableHeaders.role')}</th>
            <th className="py-1.5 px-2.5 min-w-[150px]">{t('users.tableHeaders.department')}</th>
            <th className="py-1.5 px-2 w-[130px]">{t('users.tableHeaders.shift')}</th>
            <th className="py-1.5 px-2 w-[90px] text-center">{t('users.tableHeaders.status')}</th>
            <th className="py-1.5 px-2 w-[130px]">{t('users.tableHeaders.lastLogin')}</th>
            <th className="py-1.5 px-2 w-[120px] text-right">{t('users.tableHeaders.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-300">
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                <Users className="w-7 h-7 mx-auto mb-1 text-slate-700" />
                <span>{t('users.noUsersFound')}</span>
              </td>
            </tr>
          ) : (
            filteredUsers.map((u) => {
              const isActiveSession = activeUsername === u.username;

              return (
                <tr
                  key={u.id}
                  className={`hover:bg-slate-800/50 transition-colors ${
                    isActiveSession ? 'bg-blue-900/15' : ''
                  }`}
                >
                  {/* Username & RFID */}
                  <td className="py-1.5 px-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-200 font-mono">@{u.username}</span>
                      {u.rfidBadge && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400">
                          {u.rfidBadge}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Display Name & Email */}
                  <td className="py-1.5 px-2.5 font-sans whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-100">{u.displayName}</span>
                      {isActiveSession && (
                        <span className="text-[9px] font-mono px-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {t('users.currentSessionBadge')}
                        </span>
                      )}
                    </div>
                    {u.email && (
                      <span className="text-[10px] text-slate-500 block truncate">{u.email}</span>
                    )}
                  </td>

                  {/* Role */}
                  <td className="py-1.5 px-2 text-center whitespace-nowrap">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-mono ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </td>

                  {/* Department */}
                  <td className="py-1.5 px-2.5 font-sans text-slate-300 truncate max-w-[200px]">
                    {u.department}
                  </td>

                  {/* Shift */}
                  <td className="py-1.5 px-2 text-slate-400 whitespace-nowrap text-[10px]">
                    {u.shift}
                  </td>

                  {/* Status Toggle */}
                  <td className="py-1.5 px-2 text-center whitespace-nowrap">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>

                  {/* Last Login */}
                  <td className="py-1.5 px-2 text-slate-500 text-[10px] whitespace-nowrap tabular-nums">
                    {u.lastLogin ? u.lastLogin.split('T')[0] : 'Chưa đăng nhập'}
                  </td>

                  {/* Actions */}
                  <td className="py-1.5 px-2 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onToggleStatus(u.id, u.status)}
                        className={`p-1 rounded transition-colors ${
                          u.status === 'ACTIVE'
                            ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                            : 'text-amber-400 hover:text-emerald-400 hover:bg-slate-800'
                        }`}
                        title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {u.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => onEdit(u)}
                        className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                        title={t('users.actions.edit')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDelete(u)}
                        disabled={isActiveSession}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                        title={isActiveSession ? t('users.actions.cannotDeleteSelf') : t('users.actions.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

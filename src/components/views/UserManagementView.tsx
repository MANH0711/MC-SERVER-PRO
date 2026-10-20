/**
 * MC Server User Management & RBAC View
 * Role-Based Access Control matrix, active operator session details, and security policies.
 */

import React from 'react';
import {
  ShieldCheck,
  User,
  Check,
  X,
  KeyRound,
  Lock,
  Clock,
  Building,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const UserManagementView: React.FC = () => {
  const { t } = useTranslation();
  const { userSession, switchUserRole } = useApp();

  const permissions = [
    {
      name: t('users.table.viewDashboard'),
      OPERATOR: true,
      SUPERVISOR: true,
      ENGINEER: true,
      ADMIN: true,
    },
    {
      name: t('users.table.deviceControl'),
      OPERATOR: false,
      SUPERVISOR: true,
      ENGINEER: true,
      ADMIN: true,
    },
    {
      name: t('users.table.editConfig'),
      OPERATOR: false,
      SUPERVISOR: false,
      ENGINEER: true,
      ADMIN: true,
    },
    {
      name: t('users.table.ackAlarms'),
      OPERATOR: false,
      SUPERVISOR: true,
      ENGINEER: true,
      ADMIN: true,
    },
    {
      name: t('users.table.exportData'),
      OPERATOR: false,
      SUPERVISOR: true,
      ENGINEER: true,
      ADMIN: true,
    },
    {
      name: t('users.table.administerUsers'),
      OPERATOR: false,
      SUPERVISOR: false,
      ENGINEER: false,
      ADMIN: true,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 text-slate-100">
      {/* View Header */}
      <div className="p-4 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              {t('users.title')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t('users.subtitle')}</p>
          </div>
        </div>

        <span className="text-xs font-mono px-2.5 py-1 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
          TLS / AES-256 SECURED
        </span>
      </div>

      {/* Active Session & Role Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Profile */}
        <div className="md:col-span-2 p-4 rounded bg-slate-900 border border-slate-800 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block pb-2 border-b border-slate-800">
            {t('users.currentSession')}
          </span>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">OPERATOR NAME</span>
              <span className="text-slate-200 font-bold mt-0.5 block">{userSession.displayName}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">USERNAME</span>
              <span className="text-cyan-400 font-bold mt-0.5 block">{userSession.username}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">ACTIVE ROLE</span>
              <span className="text-purple-400 font-bold mt-0.5 block">{userSession.role}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">FACILITY / PLANT</span>
              <span className="text-slate-300 mt-0.5 block">{userSession.factory}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">DEPARTMENT</span>
              <span className="text-slate-300 mt-0.5 block truncate">{userSession.department}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">SESSION LOGIN TIME</span>
              <span className="text-slate-400 mt-0.5 block">{userSession.loginTime.split('T')[1].slice(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* Quick Role Switcher for Testing */}
        <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block pb-2 border-b border-slate-800">
            {t('users.switchRole')}
          </span>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Instantly switch active role to test privilege enforcement across views:
          </p>

          <div className="space-y-1.5 font-mono text-xs">
            {(['OPERATOR', 'SUPERVISOR', 'ENGINEER', 'ADMIN'] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => switchUserRole(role)}
                className={`w-full text-left px-3 py-2 rounded flex items-center justify-between border transition-colors ${
                  userSession.role === role
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>{role}</span>
                {userSession.role === role && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Role Matrix Table */}
      <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block pb-2 border-b border-slate-800">
          {t('users.roleMatrix')}
        </span>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border border-slate-800 rounded">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <th className="py-2.5 px-3">System Permission Action</th>
                <th className="py-2.5 px-3 text-center">OPERATOR</th>
                <th className="py-2.5 px-3 text-center">SUPERVISOR</th>
                <th className="py-2.5 px-3 text-center">ENGINEER</th>
                <th className="py-2.5 px-3 text-center">ADMIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {permissions.map((perm, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200">{perm.name}</td>
                  <td className="py-2.5 px-3 text-center">
                    {perm.OPERATOR ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {perm.SUPERVISOR ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {perm.ENGINEER ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {perm.ADMIN ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

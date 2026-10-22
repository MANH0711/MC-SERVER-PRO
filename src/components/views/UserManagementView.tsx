/**
 * MC Server User Management & RBAC View - High-Density Industrial Edition
 * Compact layout, zero wasted space, active session switcher, user account management & RBAC matrix.
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  User,
  Check,
  X,
  KeyRound,
  Lock,
  Clock,
  Building,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  LogIn,
  Download,
  RotateCcw,
  Shield,
  BadgeCheck,
  FileSpreadsheet,
  Users,
  Grid3X3,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import { UserRole, SystemUser } from '../../types';

export const UserManagementView: React.FC = () => {
  const { t } = useTranslation();
  const {
    userSession,
    switchUserRole,
    users,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    switchActiveUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix' | 'policies'>('users');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    username: string;
    displayName: string;
    role: UserRole;
    factory: string;
    department: string;
    shift: string;
    rfidBadge: string;
    status: 'ACTIVE' | 'LOCKED';
    email: string;
  }>({
    username: '',
    displayName: '',
    role: 'OPERATOR',
    factory: 'Smart Plant #01',
    department: 'Tổ Vận Hành Dây Chuyền SMT',
    shift: 'Ca 1 (06:00 - 14:00)',
    rfidBadge: '',
    status: 'ACTIVE',
    email: '',
  });

  const [formError, setFormError] = useState<string>('');

  // Quick role pill styling
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'text-rose-300 bg-rose-500/15 border-rose-500/40 font-bold';
      case 'ENGINEER':
        return 'text-indigo-300 bg-indigo-500/15 border-indigo-500/40 font-semibold';
      case 'SUPERVISOR':
        return 'text-sky-300 bg-sky-500/15 border-sky-500/40 font-medium';
      case 'OPERATOR':
      default:
        return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40 font-medium';
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        u.username.toLowerCase().includes(query) ||
        u.displayName.toLowerCase().includes(query) ||
        u.department.toLowerCase().includes(query) ||
        (u.rfidBadge && u.rfidBadge.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query));
      return matchRole && matchStatus && matchSearch;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Handle open add modal
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      displayName: '',
      role: 'OPERATOR',
      factory: 'Smart Plant #01',
      department: 'Tổ Vận Hành Dây Chuyền SMT',
      shift: 'Ca 1 (06:00 - 14:00)',
      rfidBadge: `RFID-OP-${Math.floor(100 + Math.random() * 900)}`,
      status: 'ACTIVE',
      email: '',
    });
    setFormError('');
    setIsAddUserModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (user: SystemUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      factory: user.factory,
      department: user.department,
      shift: user.shift,
      rfidBadge: user.rfidBadge || '',
      status: user.status,
      email: user.email || '',
    });
    setFormError('');
    setIsAddUserModalOpen(true);
  };

  // Handle save user (add or update)
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      setFormError('Vui lòng nhập Tên đăng nhập (Username)');
      return;
    }
    if (!formData.displayName.trim()) {
      setFormError('Vui lòng nhập Họ và Tên hiển thị');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        displayName: formData.displayName.trim(),
        role: formData.role,
        factory: formData.factory,
        department: formData.department,
        shift: formData.shift,
        rfidBadge: formData.rfidBadge.trim() || undefined,
        status: formData.status,
        email: formData.email.trim() || undefined,
      });
    } else {
      // Check duplicate username
      if (users.some((u) => u.username.toLowerCase() === formData.username.trim().toLowerCase())) {
        setFormError('Tên đăng nhập này đã tồn tại trong hệ thống');
        return;
      }

      const newUser: SystemUser = {
        id: `USR_${Date.now().toString().slice(-4)}`,
        username: formData.username.trim().toLowerCase(),
        displayName: formData.displayName.trim(),
        role: formData.role,
        factory: formData.factory,
        department: formData.department,
        shift: formData.shift,
        rfidBadge: formData.rfidBadge.trim() || undefined,
        status: formData.status,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        email: formData.email.trim() || undefined,
      };
      addUser(newUser);
    }

    setIsAddUserModalOpen(false);
  };

  // Export Users CSV
  const handleExportCSV = () => {
    const headers = ['UserID', 'Username', 'DisplayName', 'Role', 'Department', 'Shift', 'RFIDBadge', 'Status', 'LastLogin'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.username}"`,
      `"${u.displayName}"`,
      u.role,
      `"${u.department}"`,
      `"${u.shift}"`,
      `"${u.rfidBadge || ''}"`,
      u.status,
      `"${u.lastLogin}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const dl = document.createElement('a');
    dl.setAttribute('href', encodeURI(csvContent));
    dl.setAttribute('download', `MC_Server_User_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

  // Structured RBAC matrix permissions (fully localized)
  const rbacMatrix = useMemo(() => [
    {
      category: t('users.matrix.cat1'),
      permissions: [
        { name: t('users.matrix.perm1_1'), desc: t('users.matrix.perm1_1_desc'), OPERATOR: true, SUPERVISOR: true, ENGINEER: true, ADMIN: true },
        { name: t('users.matrix.perm1_2'), desc: t('users.matrix.perm1_2_desc'), OPERATOR: true, SUPERVISOR: true, ENGINEER: true, ADMIN: true },
        { name: t('users.matrix.perm1_3'), desc: t('users.matrix.perm1_3_desc'), OPERATOR: false, SUPERVISOR: true, ENGINEER: true, ADMIN: true },
      ],
    },
    {
      category: t('users.matrix.cat2'),
      permissions: [
        { name: t('users.matrix.perm2_1'), desc: t('users.matrix.perm2_1_desc'), OPERATOR: false, SUPERVISOR: true, ENGINEER: true, ADMIN: true },
        { name: t('users.matrix.perm2_2'), desc: t('users.matrix.perm2_2_desc'), OPERATOR: false, SUPERVISOR: false, ENGINEER: true, ADMIN: true },
        { name: t('users.matrix.perm2_3'), desc: t('users.matrix.perm2_3_desc'), OPERATOR: false, SUPERVISOR: true, ENGINEER: true, ADMIN: true },
      ],
    },
    {
      category: t('users.matrix.cat3'),
      permissions: [
        { name: t('users.matrix.perm3_1'), desc: t('users.matrix.perm3_1_desc'), OPERATOR: false, SUPERVISOR: false, ENGINEER: true, ADMIN: true },
        { name: t('users.matrix.perm3_2'), desc: t('users.matrix.perm3_2_desc'), OPERATOR: false, SUPERVISOR: false, ENGINEER: true, ADMIN: true },
        { name: t('users.matrix.perm3_3'), desc: t('users.matrix.perm3_3_desc'), OPERATOR: false, SUPERVISOR: false, ENGINEER: true, ADMIN: true },
      ],
    },
    {
      category: t('users.matrix.cat4'),
      permissions: [
        { name: t('users.matrix.perm4_1'), desc: t('users.matrix.perm4_1_desc'), OPERATOR: false, SUPERVISOR: true, ENGINEER: true, ADMIN: true },
        { name: t('users.matrix.perm4_2'), desc: t('users.matrix.perm4_2_desc'), OPERATOR: false, SUPERVISOR: false, ENGINEER: true, ADMIN: true },
      ],
    },
    {
      category: t('users.matrix.cat5'),
      permissions: [
        { name: t('users.matrix.perm5_1'), desc: t('users.matrix.perm5_1_desc'), OPERATOR: false, SUPERVISOR: false, ENGINEER: false, ADMIN: true },
        { name: t('users.matrix.perm5_2'), desc: t('users.matrix.perm5_2_desc'), OPERATOR: false, SUPERVISOR: false, ENGINEER: false, ADMIN: true },
        { name: t('users.matrix.perm5_3'), desc: t('users.matrix.perm5_3_desc'), OPERATOR: false, SUPERVISOR: false, ENGINEER: false, ADMIN: true },
      ],
    },
  ], [t]);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full p-2.5 sm:p-3 bg-slate-950 text-slate-100 space-y-2 overflow-hidden font-sans">
      {/* 1. TOP HEADER & COMPACT ACTIVE SESSION BANNER (ULTRA SPACE-SAVING) */}
      <div className="p-2 sm:px-3 sm:py-2 rounded bg-slate-900 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Title & Security Tag */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                {t('users.title')}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold">
                TLS 1.3 / AES-256 RBAC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              {t('users.subtitle')}
            </p>
          </div>
        </div>

        {/* Action Controls & New User Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors"
            title={t('users.actions.exportCsv')}
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{t('users.actions.exportCsv')}</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm shadow-emerald-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('users.actions.addUser')}</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT ACTIVE OPERATOR SESSION STRIP & ROLE SWITCHER */}
      <div className="p-2 sm:px-3 sm:py-2 rounded bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs font-mono">
        {/* Left: Active User Session Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200 shrink-0">
            {userSession.displayName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sans font-bold text-slate-200 text-xs">
                {userSession.displayName}
              </span>
              <span className="text-slate-500 text-[11px]">(@{userSession.username})</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded border uppercase font-mono ${getRoleBadge(userSession.role)}`}>
                {userSession.role}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans flex items-center gap-2 mt-0.5 truncate">
              <span>{userSession.factory}</span>
              <span className="text-slate-600">•</span>
              <span className="truncate">{userSession.department}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-500 font-mono">
                {t('users.actions.loginPrefix')} {userSession.loginTime.split('T')[1].slice(0, 8)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Role Switcher Pill Bar (Takes minimal space!) */}
        <div className="flex items-center gap-1 shrink-0 bg-slate-950 p-1 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 px-1 hidden md:inline">TEST ROLE:</span>
          {(['OPERATOR', 'SUPERVISOR', 'ENGINEER', 'ADMIN'] as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => switchUserRole(role)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors flex items-center gap-1 ${
                userSession.role === role
                  ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={`${t('users.actions.testRoleTooltip')} ${role}`}
            >
              <span>{role}</span>
              {userSession.role === role && <Check className="w-2.5 h-2.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* 3. TAB NAVIGATION RIBBON */}
      <div className="flex items-center justify-between border-b border-slate-800 shrink-0 text-xs font-mono">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('users.tabs.users')} ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'matrix'
                ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>{t('users.tabs.matrix')}</span>
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-3 py-1.5 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'policies'
                ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('users.tabs.policies')}</span>
          </button>
        </div>

        {/* Tab-specific quick count / note */}
        {activeTab === 'users' && (
          <span className="text-[11px] text-slate-500 pr-2 hidden sm:inline">
            {t('users.showing')} {filteredUsers.length} / {users.length} {t('users.accounts')}
          </span>
        )}
      </div>

      {/* 4. MAIN VIEWPORT CONTENT (TAB 1: USERS LIST & MANAGEMENT) */}
      {activeTab === 'users' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-2 overflow-hidden">
          {/* Compact Filter Bar */}
          <div className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {/* Search */}
              <div className="relative min-w-[160px] sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('users.searchPlaceholder')}
                  className="w-full pl-7 pr-6 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
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
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">{t('users.statuses.all')}</option>
                <option value="ACTIVE">{t('users.statuses.active')}</option>
                <option value="LOCKED">{t('users.statuses.locked')}</option>
              </select>

              {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                  title={t('users.resetFilter')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* High-Density Users Table */}
          <div className="flex-1 min-h-0 overflow-auto rounded border border-slate-800/90 bg-slate-900/60 shadow-inner">
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
                    const isActiveSession = userSession.username === u.username;

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

                        {/* Status */}
                        <td className="py-1.5 px-2 text-center whitespace-nowrap">
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-colors flex items-center gap-1 mx-auto ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25'
                            }`}
                            title={t('users.actions.toggleStatus')}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span>{u.status}</span>
                          </button>
                        </td>

                        {/* Last Login */}
                        <td className="py-1.5 px-2 text-slate-400 whitespace-nowrap tabular-nums text-[10px]">
                          {u.lastLogin.replace('T', ' ').slice(0, 16)}
                        </td>

                        {/* Actions */}
                        <td className="py-1.5 px-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Switch active user */}
                            {!isActiveSession && (
                              <button
                                onClick={() => switchActiveUser(u)}
                                className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                                title={t('users.actions.impersonate')}
                              >
                                <LogIn className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                              title={t('users.actions.edit')}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              disabled={isActiveSession}
                              onClick={() => setDeletingUser(u)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                              title={t('users.actions.delete')}
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
        </div>
      )}

      {/* 5. TAB 2: ROLE-BASED ACCESS CONTROL MATRIX (HIGH DENSITY) */}
      {activeTab === 'matrix' && (
        <div className="flex-1 min-h-0 overflow-auto rounded border border-slate-800/90 bg-slate-900/60 shadow-inner">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2 px-3 min-w-[280px]">{t('users.matrix.headerAction')}</th>
                <th className="py-2 px-3 w-[100px] text-center text-emerald-400">OPERATOR</th>
                <th className="py-2 px-3 w-[110px] text-center text-sky-400">SUPERVISOR</th>
                <th className="py-2 px-3 w-[110px] text-center text-indigo-400">ENGINEER</th>
                <th className="py-2 px-3 w-[100px] text-center text-rose-400">ADMIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {rbacMatrix.map((group, gIdx) => (
                <React.Fragment key={gIdx}>
                  {/* Category Section Header */}
                  <tr className="bg-slate-950/80">
                    <td colSpan={5} className="py-1.5 px-3 text-[11px] font-bold text-slate-300 tracking-wider">
                      {group.category}
                    </td>
                  </tr>

                  {/* Actions */}
                  {group.permissions.map((perm, pIdx) => (
                    <tr key={pIdx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-1.5 px-3 font-sans">
                        <span className="font-medium text-slate-100 text-xs block">{perm.name}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{perm.desc}</span>
                      </td>

                      {/* OPERATOR */}
                      <td className="py-1.5 px-3 text-center">
                        {perm.OPERATOR ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-800/80 text-slate-600 flex items-center justify-center mx-auto">
                            <X className="w-3 h-3" />
                          </div>
                        )}
                      </td>

                      {/* SUPERVISOR */}
                      <td className="py-1.5 px-3 text-center">
                        {perm.SUPERVISOR ? (
                          <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-800/80 text-slate-600 flex items-center justify-center mx-auto">
                            <X className="w-3 h-3" />
                          </div>
                        )}
                      </td>

                      {/* ENGINEER */}
                      <td className="py-1.5 px-3 text-center">
                        {perm.ENGINEER ? (
                          <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-800/80 text-slate-600 flex items-center justify-center mx-auto">
                            <X className="w-3 h-3" />
                          </div>
                        )}
                      </td>

                      {/* ADMIN */}
                      <td className="py-1.5 px-3 text-center">
                        {perm.ADMIN ? (
                          <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-800/80 text-slate-600 flex items-center justify-center mx-auto">
                            <X className="w-3 h-3" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. TAB 3: SECURITY POLICIES & ENFORCEMENT */}
      {activeTab === 'policies' && (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 font-sans text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Policy Card 1 */}
            <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Lock className="w-4 h-4" />
                <h4 className="font-bold uppercase tracking-wider text-slate-200">{t('users.policies.sessionTitle')}</h4>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {t('users.policies.sessionDesc')}
              </p>
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-slate-300">
                Session Timeout: 60 min • Single-Sign-On Token: JWT RS256
              </div>
            </div>

            {/* Policy Card 2 */}
            <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-blue-400">
                <BadgeCheck className="w-4 h-4" />
                <h4 className="font-bold uppercase tracking-wider text-slate-200">{t('users.policies.auditTitle')}</h4>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {t('users.policies.auditDesc')}
              </p>
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-slate-300">
                Enforcement: NON_REPUDIATION • Log Level: AUDIT_STRICT
              </div>
            </div>

            {/* Policy Card 3 */}
            <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400">
                <KeyRound className="w-4 h-4" />
                <h4 className="font-bold uppercase tracking-wider text-slate-200">{t('users.policies.securityTitle')}</h4>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {t('users.policies.securityDesc')}
              </p>
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-slate-300">
                Cipher: TLS_AES_256_GCM_SHA384 • VLAN: 10.0.10.0/24
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: ADD / EDIT USER FORM */}
      {isAddUserModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={() => setIsAddUserModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    {editingUser ? t('users.modal.editTitle') : t('users.modal.addTitle')}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">
                    {t('users.modal.subtitle')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-4 space-y-3 font-sans text-xs">
              {formError && (
                <div className="p-2 rounded bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Username */}
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    {t('users.modal.username')}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="vd: operator.vuong"
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                </div>

                {/* Display Name */}
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    {t('users.modal.displayName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="vd: Vuong T. D."
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    {t('users.modal.role')}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="OPERATOR">{t('users.roles.operator')}</option>
                    <option value="SUPERVISOR">{t('users.roles.supervisor')}</option>
                    <option value="ENGINEER">{t('users.roles.engineer')}</option>
                    <option value="ADMIN">{t('users.roles.admin')}</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    {t('users.modal.status')}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'LOCKED' })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">{t('users.statuses.active')}</option>
                    <option value="LOCKED">{t('users.statuses.locked')}</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    {t('users.modal.department')}
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder={t('users.modal.departmentPlaceholder')}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Shift */}
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    {t('users.modal.shift')}
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Ca 1 (06:00 - 14:00)">Ca 1 (06:00 - 14:00)</option>
                    <option value="Ca 2 (14:00 - 22:00)">Ca 2 (14:00 - 22:00)</option>
                    <option value="Ca 3 (22:00 - 06:00)">Ca 3 (22:00 - 06:00)</option>
                    <option value="Hành chính">{t('users.modal.shiftOffice')}</option>
                  </select>
                </div>

                {/* RFID Badge */}
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    {t('users.modal.rfid')}
                  </label>
                  <input
                    type="text"
                    value={formData.rfidBadge}
                    onChange={(e) => setFormData({ ...formData, rfidBadge: e.target.value })}
                    placeholder="vd: RFID-OP-109"
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    {t('users.modal.email')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vd: user@smartfactory.internal"
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                >
                  {t('users.modal.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs text-white font-medium shadow-md shadow-blue-600/30"
                >
                  {editingUser ? t('users.modal.update') : t('users.modal.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: DELETE USER CONFIRMATION */}
      {deletingUser && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={() => setDeletingUser(null)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                {t('users.deleteModal.title')}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              {t('users.deleteModal.descPre')} <span className="font-bold text-white font-mono">@{deletingUser.username}</span> ({deletingUser.displayName}) {t('users.deleteModal.descPost')}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                {t('users.deleteModal.cancel')}
              </button>
              <button
                onClick={() => {
                  deleteUser(deletingUser.id);
                  setDeletingUser(null);
                }}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-xs text-white font-medium shadow-md shadow-red-600/30"
              >
                {t('users.deleteModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

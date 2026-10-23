/**
 * MC Server Industrial Enterprise Edition
 * User Management Form (File Cha Điều Phối)
 * 
 * Quản trị phân quyền, tài khoản & an toàn hệ thống:
 * - UserToolbar: Tìm kiếm, lọc vai trò (Admin, Engineer, Supervisor, Operator), lọc trạng thái
 * - UserTable: Danh sách người dùng, chuyển đổi vai trò, khóa/mở tài khoản
 * - UserFormModal: Modal tạo mới & cập nhật thông tin người dùng
 * - UserDeleteModal: Modal xác nhận xóa người dùng
 * - PermissionMatrixTab: Bảng phân quyền chi tiết RBAC theo vai trò
 * - SecurityPoliciesTab: Chính sách phiên đăng nhập, chữ ký số & kiểm toán
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Download,
  Grid3X3,
  Sliders,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { useApp } from '@/core/context';
import { UserRole, SystemUser } from '@/core/types';

// Các sub-components thuộc form User Management
import { UserToolbar } from './components/UserToolbar';
import { UserTable } from './components/UserTable';
import { UserFormModal } from './components/UserFormModal';
import { UserDeleteModal } from './components/UserDeleteModal';
import { PermissionMatrixTab } from './components/PermissionMatrixTab';
import { SecurityPoliciesTab } from './components/SecurityPoliciesTab';

export const UserManagementView: React.FC = () => {
  const { t, formatNumber } = useTranslation();
  const {
    users,
    userSession,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    setUserRole,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix' | 'policies'>('users');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    role: 'OPERATOR' as UserRole,
    factory: 'Smart Plant #01',
    department: 'Tổ Vận Hành Dây Chuyền SMT',
    shift: 'Ca 1 (06:00 - 14:00)',
    rfidBadge: '',
    status: 'ACTIVE' as 'ACTIVE' | 'LOCKED',
    email: '',
  });

  const [formError, setFormError] = useState<string>('');

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

  const filteredUsers = useMemo(() => {
    return users.filter((u: SystemUser) => {
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        u.username.toLowerCase().includes(query) ||
        u.displayName.toLowerCase().includes(query) ||
        u.department.toLowerCase().includes(query) ||
        (u.rfidBadge && u.rfidBadge.toLowerCase().includes(query));
      return matchRole && matchStatus && matchSearch;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

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
    setIsFormModalOpen(true);
  };

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
    setIsFormModalOpen(true);
  };

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
      if (users.some((u: SystemUser) => u.username.toLowerCase() === formData.username.trim().toLowerCase())) {
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

    setIsFormModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['UserID', 'Username', 'DisplayName', 'Role', 'Department', 'Shift', 'RFIDBadge', 'Status', 'LastLogin'];
    const rows = filteredUsers.map((u: SystemUser) => [
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
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: (string | undefined)[]) => e.join(','))].join('\n');
    const dl = document.createElement('a');
    dl.setAttribute('href', encodeURI(csvContent));
    dl.setAttribute('download', `MC_Server_User_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

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
  ], [t]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-2.5 sm:p-3 space-y-2 bg-[#070B14] text-slate-100 font-sans">
      {/* ─── 1. Header Toolbar (Compact) ─── */}
      <div className="px-3 py-1.5 rounded-lg bg-[#0C1220]/95 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 leading-none">
              {t('users.title')}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 leading-none">
              {formatNumber(users.length)} {t('users.totalRegistered')} · Session: <span className="text-cyan-400 font-bold">@{userSession.username}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>{t('users.actions.exportCsv')}</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t('users.actions.addUser')}</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Tab Navigation Ribbon ─── */}
      <div className="flex items-center justify-between border-b border-slate-800 shrink-0 text-xs font-mono">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'users'
                ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20'
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
                ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20'
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
                ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('users.tabs.policies')}</span>
          </button>
        </div>

        {activeTab === 'users' && (
          <span className="text-[11px] text-slate-500 pr-2 hidden sm:inline">
            {t('users.showing')} {filteredUsers.length} / {users.length} {t('users.accounts')}
          </span>
        )}
      </div>

      {/* ─── 3. Main Viewport Content ─── */}
      {activeTab === 'users' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-2 overflow-hidden">
          {/* UserToolbar */}
          <UserToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onReset={() => {
              setSearchQuery('');
              setRoleFilter('ALL');
              setStatusFilter('ALL');
            }}
            t={t}
          />

          {/* UserTable */}
          <UserTable
            filteredUsers={filteredUsers}
            activeUsername={userSession.username}
            onEdit={handleOpenEditModal}
            onDelete={setDeletingUser}
            onToggleStatus={toggleUserStatus}
            getRoleBadge={getRoleBadge}
            t={t}
          />
        </div>
      )}

      {activeTab === 'matrix' && (
        <PermissionMatrixTab rbacMatrix={rbacMatrix} t={t} />
      )}

      {activeTab === 'policies' && (
        <SecurityPoliciesTab t={t} />
      )}

      {/* ─── 4. Modals ─── */}
      <UserFormModal
        isOpen={isFormModalOpen}
        editingUser={editingUser}
        formData={formData}
        formError={formError}
        onChange={setFormData}
        onSubmit={handleSaveUser}
        onClose={() => setIsFormModalOpen(false)}
        t={t}
      />

      <UserDeleteModal
        user={deletingUser}
        onConfirm={() => {
          if (deletingUser) {
            deleteUser(deletingUser.id);
            setDeletingUser(null);
          }
        }}
        onCancel={() => setDeletingUser(null)}
        t={t}
      />
    </div>
  );
};

export default UserManagementView;

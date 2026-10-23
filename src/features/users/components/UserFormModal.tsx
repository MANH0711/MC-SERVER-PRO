import React from 'react';
import {
  X,
  UserPlus,
  Edit2,
  AlertTriangle,
} from 'lucide-react';
import { SystemUser, UserRole } from '@/core/types';

interface UserFormData {
  username: string;
  displayName: string;
  role: UserRole;
  factory: string;
  department: string;
  shift: string;
  rfidBadge: string;
  status: 'ACTIVE' | 'LOCKED';
  email: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  editingUser: SystemUser | null;
  formData: UserFormData;
  formError: string;
  onChange: (data: UserFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  t: (key: string) => string;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  editingUser,
  formData,
  formError,
  onChange,
  onSubmit,
  onClose,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden text-xs">
        {/* Header */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              {editingUser ? <Edit2 className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider">
                {editingUser ? t('users.modal.editTitle') : t('users.modal.addTitle')}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                {editingUser ? `ID: ${editingUser.id} (@${editingUser.username})` : t('users.modal.addDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSubmit} className="p-4 space-y-3">
          {formError && (
            <div className="p-2 rounded bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Username */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                {t('users.modal.usernameLabel')} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                disabled={!!editingUser}
                value={formData.username}
                onChange={(e) => onChange({ ...formData, username: e.target.value })}
                placeholder="vd: manh.nv"
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono text-xs disabled:opacity-50"
              />
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                {t('users.modal.fullNameLabel')} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => onChange({ ...formData, displayName: e.target.value })}
                placeholder="vd: Nguyễn Văn Mạnh"
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Role */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                {t('users.modal.roleLabel')}
              </label>
              <select
                value={formData.role}
                onChange={(e) => onChange({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-mono"
              >
                <option value="OPERATOR">OPERATOR (Kỹ thuật viên thao tác)</option>
                <option value="SUPERVISOR">SUPERVISOR (Giám sát chuyền)</option>
                <option value="ENGINEER">ENGINEER (Kỹ sư thiết bị & SECS/GEM)</option>
                <option value="ADMIN">ADMIN (Quản trị hệ thống toàn quyền)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                {t('users.modal.statusLabel')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => onChange({ ...formData, status: e.target.value as 'ACTIVE' | 'LOCKED' })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-mono"
              >
                <option value="ACTIVE">ACTIVE (Kích hoạt bình thường)</option>
                <option value="LOCKED">LOCKED (Tạm khóa đăng nhập)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Department */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                {t('users.modal.departmentLabel')}
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => onChange({ ...formData, department: e.target.value })}
                placeholder="vd: Tổ Vận Hành SMT"
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>

            {/* Shift */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                {t('users.modal.shiftLabel')}
              </label>
              <select
                value={formData.shift}
                onChange={(e) => onChange({ ...formData, shift: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-mono"
              >
                <option value="Ca 1 (06:00 - 14:00)">Ca 1 (06:00 - 14:00)</option>
                <option value="Ca 2 (14:00 - 22:00)">Ca 2 (14:00 - 22:00)</option>
                <option value="Ca 3 (22:00 - 06:00)">Ca 3 (22:00 - 06:00)</option>
                <option value="Giờ Hành Chính (08:00 - 17:00)">Giờ Hành Chính (08:00 - 17:00)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* RFID Badge */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                {t('users.modal.rfidLabel')}
              </label>
              <input
                type="text"
                value={formData.rfidBadge}
                onChange={(e) => onChange({ ...formData, rfidBadge: e.target.value })}
                placeholder="RFID-OP-101"
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                {t('users.modal.emailLabel')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => onChange({ ...formData, email: e.target.value })}
                placeholder="user@smartfactory.vn"
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {t('users.modal.cancelBtn')}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              {editingUser ? t('users.modal.saveBtn') : t('users.modal.createBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

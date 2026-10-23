import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { SystemUser } from '../../../types';

interface UserDeleteModalProps {
  user: SystemUser | null;
  onConfirm: () => void;
  onCancel: () => void;
  t: (key: string) => string;
}

export const UserDeleteModal: React.FC<UserDeleteModalProps> = ({
  user,
  onConfirm,
  onCancel,
  t,
}) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden text-xs">
        <div className="p-4 space-y-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-bold text-slate-100 text-sm">
              {t('users.modal.confirmDeleteTitle')}
            </h3>
            <p className="text-slate-400 text-xs">
              {t('users.modal.confirmDeleteDesc')}{' '}
              <span className="font-bold text-rose-400 font-mono">@{user.username}</span>?
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {t('users.modal.cancelBtn')}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors"
            >
              {t('users.modal.deleteBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

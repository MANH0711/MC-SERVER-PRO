/**
 * MODAL: InterlockRuleAuditModal (COMPACT EDITION)
 * Modal pop-up tái sử dụng tra cứu quy tắc Interlock
 */

import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { InterlockRuleAuditView } from './InterlockRuleAuditView';
import { useApp } from '@/core/context';

interface InterlockRuleAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEquipmentId?: string;
  initialModel?: string;
  initialOperation?: string;
  initialEqpGroup?: string;
}

export const InterlockRuleAuditModal: React.FC<InterlockRuleAuditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { setActiveView } = useApp();

  if (!isOpen) return null;

  const handleOpenFullPage = () => {
    onClose();
    setActiveView('interlockRulesAudit' as any);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-6xl xl:max-w-7xl bg-[#0B101D] border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <h2 className="text-xs font-bold text-slate-100 font-mono tracking-wide">
              TRA CỨU QUY TẮC INTERLOCK (BIZ_ILRULE_INFO)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenFullPage}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-indigo-300 hover:text-indigo-200 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/30 transition-colors"
              title="Mở toàn màn hình trong module riêng"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Toàn Màn Hình</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content: Nhúng trực tiếp View nhỏ gọn */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <InterlockRuleAuditView />
        </div>
      </div>
    </div>
  );
};

export default InterlockRuleAuditModal;

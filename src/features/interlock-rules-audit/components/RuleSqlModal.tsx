import React, { useState } from 'react';
import { X, Code, Terminal, Copy, Check } from 'lucide-react';
import { BizIlruleItem } from '../types/interlockRuleAudit.types';

interface RuleSqlModalProps {
  rule: BizIlruleItem | null;
  onClose: () => void;
}

export const RuleSqlModal: React.FC<RuleSqlModalProps> = ({ rule, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!rule) return null;

  const handleCopySql = () => {
    if (rule.sql) {
      navigator.clipboard.writeText(rule.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-100 font-mono">
              CHI TIẾT QUY TẮC: {rule.ruleId}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3 text-xs">
          {/* Thông điệp lỗi */}
          <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300">
            <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">
              Nội dung lỗi (ERROR_MSG_E):
            </span>
            <span>{rule.errorMsg || 'Không có mô tả lỗi'}</span>
          </div>

          {/* BIND_ITEM */}
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono">
            <span className="text-[10px] text-slate-500 block mb-0.5">
              THAM SỐ BIND (BIND_ITEM):
            </span>
            <span className="text-indigo-300 break-all">{rule.bindItem || 'NONE'}</span>
          </div>

          {/* SQL */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-cyan-400" />
                CÂU LỆNH SQL (CHECK_SQL_1):
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 shadow-inner">
              {rule.sql || '-- Không có câu lệnh SQL'}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

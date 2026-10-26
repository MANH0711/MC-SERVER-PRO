/**
 * Modal Xem Chi Tiết Bản Tin Kiểm Tra Interlock BIZ_ILRULE_CHECK_HISTORY
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  Database,
  Cpu,
  Layers,
  Clock,
  User,
  Info,
  FileText,
  FileCode,
} from 'lucide-react';
import { IlruleHistoryRecord } from '../api/ilruleHistoryApi';
import { copyToClipboard } from '@/core/utils/clipboard';

interface IlruleDetailModalProps {
  record: IlruleHistoryRecord | null;
  onClose: () => void;
}

export const IlruleDetailModal: React.FC<IlruleDetailModalProps> = ({ record, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'receiveMsg' | 'checkMsg'>('overview');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!record) return null;

  const handleCopy = (text: string, key: string) => {
    copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatTimestamp = (raw?: string) => {
    if (!raw) return 'N/A';
    if (raw.length >= 14) {
      const y = raw.substring(0, 4);
      const m = raw.substring(4, 6);
      const d = raw.substring(6, 8);
      const h = raw.substring(8, 10);
      const mi = raw.substring(10, 12);
      const s = raw.substring(12, 14);
      const ms = raw.length > 14 ? raw.substring(14) : '';
      return `${y}-${m}-${d} ${h}:${mi}:${s}${ms ? `.${ms.replace('.', '')}` : ''}`;
    }
    return raw;
  };

  const isAlarm = Boolean(record.ALARM_ID);
  const isAlarmActive = record.ALARM_STATUS === 'N';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl h-[620px] max-h-[90vh] bg-[#0d1322] border border-slate-700/80 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg border ${
                isAlarmActive
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : isAlarm
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">
                  {record.RULE_ID || record.RULE_KEY}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {record.PLANT}
                </span>
                {record.ALARM_ID && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                      isAlarmActive
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {isAlarmActive ? `ALARM: ${record.ALARM_ID} (ACTIVE)` : `ALARM: ${record.ALARM_ID} (CLEARED)`}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {record.RULE_DESC || record.ERROR_MSG_E || 'Interlock Check Record'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 px-5 bg-slate-950/40 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Tổng Quan Sự Kiện
          </button>
          <button
            onClick={() => setActiveTab('checkMsg')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'checkMsg'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Nội Dung Lỗi (CHECK_MSG)
          </button>
          <button
            onClick={() => setActiveTab('receiveMsg')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'receiveMsg'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Bản Tin Nhận Được (RECEIVE_MSG)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 min-h-0 overflow-y-auto space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Highlight Box for Error */}
              {record.CHECK_MSG && (
                <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-500/40 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-red-300 uppercase tracking-wider block">
                      Chi Tiết Thông Điệp Kiểm Tra (Check Message)
                    </span>
                    <p className="text-xs text-red-200 font-mono mt-1 break-words">
                      {record.CHECK_MSG}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(record.CHECK_MSG || '', 'checkMsg')}
                    className="p-1 rounded text-red-400 hover:text-red-200 hover:bg-red-900/40"
                    title="Sao chép lỗi"
                  >
                    {copiedKey === 'checkMsg' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Grid Properties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1">
                    Thông Tin Thiết Bị & Sản Xuất
                  </span>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Mã Thiết Bị (EQUIP_ID):</span>
                    <span className="font-mono font-bold text-cyan-400">{record.EQUIP_ID}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Model / Device:</span>
                    <span className="font-mono font-semibold text-slate-200">{record.MODEL || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Công Đoạn (Oper):</span>
                    <span className="font-mono text-slate-300">{record.OPER || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Process / Stage:</span>
                    <span className="font-mono text-slate-300">{record.PROCESS_STAGE || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Người vận hành (User):</span>
                    <span className="font-mono text-slate-300">{record.USER_ID || 'N/A'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1">
                    Thông Tin Vật Phẩm & Thời Gian
                  </span>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Số Lot (Lot Number):</span>
                    <span className="font-mono font-bold text-amber-400">{record.TRANS_LOT}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Mã Đơn Vị (PCB / Unit ID):</span>
                    <span className="font-mono font-semibold text-purple-400">{record.UNIT_ID || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Loại Đơn Vị (Unit Type):</span>
                    <span className="font-mono text-slate-300">{record.TRANS_UNIT_TYPE || 'PCB'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Thời Gian Ghi Nhận:</span>
                    <span className="font-mono text-emerald-400">{formatTimestamp(record.SYS_TRANS_TIME)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Ngày Báo Cáo:</span>
                    <span className="font-mono text-slate-300">{record.REPORT_DATE || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Rule Definition Box */}
              <div className="p-3.5 rounded-lg bg-blue-950/20 border border-blue-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold uppercase tracking-wider">
                    Quy Tắc Interlock ({record.RULE_ID || record.RULE_KEY})
                  </span>
                  {record.RULE_TYPE && (
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px]">
                      {record.RULE_TYPE}
                    </span>
                  )}
                </div>
                <p className="text-slate-300">
                  {record.RULE_DESC || 'Quy tắc xác thực trước khi tiến hành sản xuất / nạp vật phẩm.'}
                </p>
                {record.ERROR_MSG_E && (
                  <p className="text-slate-400 font-mono text-[11px] mt-1 pt-1 border-t border-blue-500/20">
                    Template: {record.ERROR_MSG_E}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'checkMsg' && (
            <div className="h-full flex flex-col space-y-2">
              <div className="flex justify-between items-center shrink-0">
                <span className="text-xs text-slate-400 font-medium">Toàn bộ thông điệp kiểm tra (CHECK_MSG):</span>
                <button
                  onClick={() => handleCopy(record.CHECK_MSG || '', 'checkMsgTab')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                >
                  {copiedKey === 'checkMsgTab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Sao chép</span>
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-red-300 whitespace-pre-wrap break-words leading-relaxed select-text flex-1 min-h-[360px] overflow-y-auto">
                {record.CHECK_MSG || 'Không có thông báo lỗi'}
              </pre>
            </div>
          )}

          {activeTab === 'receiveMsg' && (
            <div className="h-full flex flex-col space-y-2">
              <div className="flex justify-between items-center shrink-0">
                <span className="text-xs text-slate-400 font-medium">Bản tin hoặc chuỗi tham số nhận được (RECEIVE_MSG):</span>
                <button
                  onClick={() => handleCopy(record.RECEIVE_MSG || '', 'receiveMsgTab')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                >
                  {copiedKey === 'receiveMsgTab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Sao chép</span>
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 whitespace-pre-wrap break-words leading-relaxed select-text flex-1 min-h-[360px] overflow-y-auto">
                {record.RECEIVE_MSG || 'Không có dữ liệu bản tin'}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            RULE_KEY: {record.RULE_KEY}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Đóng (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  FileCode,
  Binary,
  Hash,
  ExternalLink,
  Cpu,
  Database,
  Tag,
  Radio,
  Search,
} from 'lucide-react';
import { CommunicationTransaction } from '../../types';

interface TransactionDetailModalProps {
  transaction: CommunicationTransaction | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'json' | 'hex' | 'raw'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!transaction) return null;

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transaction, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `Transaction_${transaction.messageCode}_${transaction.equipmentId}_${transaction.id}.json`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

  // Format Hex with 16 bytes per row and ASCII view
  const formatOffsetHex = (rawHex: string) => {
    if (!rawHex) return [];
    const hexBytes = rawHex.trim().split(/\s+/).filter(Boolean);
    const rows: { offset: string; hex: string; ascii: string }[] = [];

    for (let i = 0; i < hexBytes.length; i += 16) {
      const slice = hexBytes.slice(i, i + 16);
      const offset = i.toString(16).toUpperCase().padStart(4, '0');
      const hex = slice.join(' ').padEnd(48, ' ');
      const ascii = slice
        .map((h) => {
          const code = parseInt(h, 16);
          return code >= 32 && code <= 126 ? String.fromCharCode(code) : '.';
        })
        .join('');
      rows.push({ offset, hex, ascii });
    }
    return rows;
  };

  // Trích xuất các trường dữ liệu quan trọng từ payload JSON hoặc rawAscii
  const payload = transaction.payloadJson || {};
  const isWorkInOrInterlock =
    transaction.messageCode === 'S050' ||
    transaction.messageCode === 'S051' ||
    !!payload.PCB_ID ||
    !!payload.LOT_NUMBER ||
    (Array.isArray(payload.DATA) && payload.DATA.length > 0);

  const firstItem = Array.isArray(payload.DATA) && payload.DATA[0] ? payload.DATA[0] : payload;

  const pcbId = firstItem.PCB_ID || payload.PCB_ID || payload.pcbId || '';
  const lotNumber = firstItem.LOT_NUMBER || payload.LOT_NUMBER || payload.lotNumber || '';
  const config = firstItem.CONFIG || payload.CONFIG || payload.config || '';
  const recipe = firstItem.RECIPE || payload.RECIPE || payload.recipe || '';
  const transTime = firstItem.TRANS_TIME || payload.TRANS_TIME || payload.transTime || '';
  const workInResult = firstItem.WORK_IN_RESULT || payload.workInResult || (transaction.status === 'SUCCESS' ? 'OK' : 'NG');
  const workInMsg = firstItem.WORK_IN_MSG || payload.workInMsg || payload.rtnMsg || payload.summary || '';
  const operation = payload.operation || '';
  const deviceStype = payload.deviceStype || '';
  const equipGroup = payload.equipGroup || '';

  // Xác định trạng thái Thành Công / Lỗi
  const isSuccess =
    workInResult === 'OK' ||
    (transaction.status === 'SUCCESS' && (!workInResult || workInResult === 'OK'));
  const isTimeout = transaction.status === 'TIMEOUT';

  // Format full date time
  const formatDateTime = (ts: string) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${d.getMilliseconds().toString().padStart(3, '0')}`;
    } catch {
      return ts;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0A0F1D] border border-cyan-500/40 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.18)] max-w-4xl w-full h-[85vh] max-h-[820px] min-h-[560px] flex flex-col overflow-hidden text-slate-100 font-sans border-t-2 border-t-cyan-400">
        
        {/* ─── 1. MODAL HEADER ─── */}
        <div className="px-4 py-3 bg-[#0D1527] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Command Code Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <span className="font-mono font-black text-sm text-cyan-300 tracking-wider">
                {transaction.messageCode}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm text-slate-100 truncate">
                  {transaction.equipmentId}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-mono text-slate-400 truncate">
                  TxID: <span className="text-slate-300 font-semibold">{transaction.correlationId}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {formatDateTime(transaction.timestamp)}
                </span>
                <span>·</span>
                <span className="text-slate-400">Độ trễ: <b className="text-slate-200">{transaction.responseTimeMs} ms</b></span>
              </div>
            </div>
          </div>

          {/* Right Header Status & Close */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status Pill */}
            {isSuccess ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>THÀNH CÔNG (OK)</span>
              </span>
            ) : isTimeout ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                <Clock className="w-3.5 h-3.5" />
                <span>QUÁ THỜI GIAN (TIMEOUT)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/25 text-rose-300 border border-rose-500/70 shadow-[0_0_14px_rgba(244,63,94,0.35)] animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>TỪ CHỐI / LỖI (NG)</span>
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all ml-1 group"
              title="Đóng (Phím ESC)"
            >
              <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* ─── 2. HERO HIGHLIGHT: BUSINESS CARD (NGHIỆP VỤ LIÊN KHÓA/INTERLOCK) ─── */}
        {isWorkInOrInterlock && (
          <div className="px-4 py-3 bg-[#0D1629]/90 border-b border-slate-800/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-cyan-600/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                  Thông Tin Nghiệp Vụ Interlock (Die Attach Work-In)
                </span>
              </div>

              {/* Direction Indicator */}
              <div className="flex items-center gap-1 text-[11px] font-mono">
                {transaction.direction === 'INBOUND' ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-1 font-bold">
                    <ArrowDownLeft className="w-3 h-3" />
                    Thiết Bị ➔ Server (INBOUND)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 flex items-center gap-1 font-bold">
                    <ArrowUpRight className="w-3 h-3" />
                    Server ➔ Thiết Bị (OUTBOUND)
                  </span>
                )}
              </div>
            </div>

            {/* Structured Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              {/* PCB ID */}
              <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800/90 flex flex-col justify-between group">
                <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
                  <span>MÃ VẠCH (PCB ID)</span>
                  {pcbId && (
                    <button
                      onClick={() => handleCopy(pcbId, 'pcbId')}
                      className="text-slate-500 hover:text-cyan-400 transition-colors"
                      title="Sao chép PCB ID"
                    >
                      {copiedKey === 'pcbId' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </span>
                <span className="font-bold text-cyan-300 text-xs mt-1 truncate" title={pcbId || 'Không có'}>
                  {pcbId || <span className="text-slate-600 italic">Không có</span>}
                </span>
              </div>

              {/* LOT NUMBER */}
              <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800/90 flex flex-col justify-between group">
                <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
                  <span>SỐ LÔ (LOT NO)</span>
                  {lotNumber && (
                    <button
                      onClick={() => handleCopy(lotNumber, 'lotNumber')}
                      className="text-slate-500 hover:text-amber-400 transition-colors"
                      title="Sao chép Lot Number"
                    >
                      {copiedKey === 'lotNumber' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </span>
                <span className="font-bold text-amber-300 text-xs mt-1 truncate" title={lotNumber || 'Không có'}>
                  {lotNumber || <span className="text-slate-600 italic">Không có</span>}
                </span>
              </div>

              {/* CONFIG / DEVICE */}
              <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800/90 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">CẤU HÌNH (CONFIG)</span>
                <span className="font-bold text-purple-300 text-xs mt-1 truncate" title={config || 'Không có'}>
                  {config || <span className="text-slate-600 italic">Không có</span>}
                </span>
              </div>

              {/* RECIPE */}
              <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800/90 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">CÔNG THỨC (RECIPE)</span>
                <span className="font-bold text-slate-200 text-xs mt-1 truncate" title={recipe || 'Không có'}>
                  {recipe || <span className="text-slate-600 italic">Không có</span>}
                </span>
              </div>
            </div>

            {/* Work-In Result Banner */}
            <div
              className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                isSuccess
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-rose-950/40 border-rose-500/60 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.18)]'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-xs">
                    KẾT QUẢ INTERLOCK: <span className={isSuccess ? 'text-emerald-400' : 'text-rose-400'}>{workInResult}</span>
                  </span>
                  {operation && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      Công đoạn: {operation}
                    </span>
                  )}
                  {deviceStype && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      Dòng máy: {deviceStype}
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono mt-0.5 font-semibold text-slate-100 break-words">
                  {workInMsg || (isSuccess ? '[EPBV001S] BarcodeVerification successfully completed.' : 'Không có thông báo chi tiết.')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── 3. TABS NAVIGATION ─── */}
        <div className="px-4 bg-[#090E1B] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20 shadow-xs'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tổng Quan & Thuộc Tính</span>
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'json'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20 shadow-xs'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>JSON Payload</span>
            </button>

            <button
              onClick={() => setActiveTab('hexdump')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'hexdump'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20 shadow-xs'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>Hex Dump (16-Bytes Offset)</span>
            </button>

            <button
              onClick={() => setActiveTab('raw')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'raw'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20 shadow-xs'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Khung Raw Frame (STX/ETX)</span>
            </button>
          </div>

          {/* Tab Quick Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:bg-slate-700 text-xs transition-colors"
              title="Xuất file JSON giao dịch này"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Xuất JSON</span>
            </button>
          </div>
        </div>

        {/* ─── 4. TAB CONTENTS ─── */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-4 font-mono text-xs">
          
          {/* TAB 1: OVERVIEW & PROPERTIES */}
          {activeTab === 'overview' && (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
              {/* Protocol Metrics KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Chiều Dữ Liệu</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {transaction.direction === 'INBOUND' ? (
                      <>
                        <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-emerald-400 text-sm">INBOUND (Nhận)</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-blue-400 text-sm">OUTBOUND (Gửi)</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Độ Trễ Xử Lý</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-cyan-300 text-sm">{transaction.responseTimeMs} ms</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Kích Thước Khung</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-purple-300 text-sm">{transaction.payloadLength} bytes</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Checksum LRC/CRC</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-200 text-sm">{transaction.checksum}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        transaction.checksumStatus === 'VALID'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {transaction.checksumStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Decoded Key-Value Dictionary Table */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
                    Bảng Phân Tích Chi Tiết Thuộc Tính
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {Object.keys(payload).length} trường được giải mã
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-800/80">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[#0C1322] text-slate-400 text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3 w-1/3">Thuộc Tính (Key)</th>
                        <th className="py-2 px-3 w-2/3">Giá Trị Giải Mã (Value)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-cyan-400 font-semibold">equipmentId</td>
                        <td className="py-2 px-3 text-slate-200 font-bold">{transaction.equipmentId}</td>
                      </tr>
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-cyan-400 font-semibold">messageCode</td>
                        <td className="py-2 px-3 text-slate-200 font-bold">{transaction.messageCode}</td>
                      </tr>
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-cyan-400 font-semibold">correlationId</td>
                        <td className="py-2 px-3 text-slate-300">{transaction.correlationId}</td>
                      </tr>
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-cyan-400 font-semibold">timestamp</td>
                        <td className="py-2 px-3 text-slate-300">{formatDateTime(transaction.timestamp)}</td>
                      </tr>

                      {/* Dynamic Payload Keys */}
                      {Object.entries(payload).map(([k, v]) => {
                        if (k === 'DATA' || typeof v === 'object') return null;
                        return (
                          <tr key={k} className="hover:bg-slate-900/40">
                            <td className="py-2 px-3 text-purple-300 font-medium">{k}</td>
                            <td className="py-2 px-3 text-slate-200 break-all">{String(v)}</td>
                          </tr>
                        );
                      })}

                      {/* Display nested DATA if present */}
                      {Array.isArray(payload.DATA) &&
                        payload.DATA.length > 0 &&
                        Object.entries(payload.DATA[0]).map(([k, v]) => (
                          <tr key={`data-${k}`} className="hover:bg-slate-900/40 bg-cyan-950/10">
                            <td className="py-2 px-3 text-cyan-300 font-medium flex items-center gap-1">
                              <span className="text-[10px] text-slate-500">DATA[0].</span>
                              {k}
                            </td>
                            <td className="py-2 px-3 text-emerald-300 font-semibold break-all">{String(v)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JSON PAYLOAD */}
          {activeTab === 'json' && (
            <div className="h-full flex flex-col min-h-0 space-y-2">
              <div className="flex items-center justify-between text-xs shrink-0">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  Định Dạng Cấu Trúc JSON Phân Cấp
                </span>
                <button
                  onClick={() => handleCopy(JSON.stringify(payload, null, 2), 'jsonTab')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  {copiedKey === 'jsonTab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'jsonTab' ? 'Đã sao chép' : 'Sao chép JSON'}</span>
                </button>
              </div>

              <div className="flex-1 min-h-0 relative rounded-xl bg-slate-950/95 border border-slate-800/90 overflow-hidden shadow-inner flex flex-col">
                <pre className="flex-1 min-h-0 p-3.5 text-emerald-300 overflow-auto text-xs leading-relaxed font-mono selection:bg-cyan-500/30">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: HEX DUMP */}
          {activeTab === 'hexdump' && (
            <div className="h-full flex flex-col min-h-0 space-y-2">
              <div className="flex items-center justify-between text-xs shrink-0">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-cyan-400" />
                  Hex Dump 16 Bytes & Ký Tự ASCII Tương Ứng
                </span>
                <button
                  onClick={() => handleCopy(transaction.rawHex, 'hexTab')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  {copiedKey === 'hexTab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'hexTab' ? 'Đã sao chép' : 'Sao chép Hex'}</span>
                </button>
              </div>

              <div className="flex-1 min-h-0 rounded-xl bg-slate-950/95 border border-slate-800/90 overflow-hidden shadow-inner flex flex-col">
                <div className="px-3 py-1.5 bg-[#0C1322] border-b border-slate-800 grid grid-cols-12 text-[10px] uppercase font-bold text-slate-400 shrink-0">
                  <span className="col-span-2">Offset</span>
                  <span className="col-span-7">Hexadecimal Bytes (16 Bytes / Dòng)</span>
                  <span className="col-span-3 text-right">ASCII Decode</span>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-y-auto text-[11px] leading-relaxed font-mono space-y-1">
                  {formatOffsetHex(transaction.rawHex).map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 hover:bg-slate-900/60 py-0.5 rounded px-1 transition-colors">
                      <span className="col-span-2 text-slate-500 font-bold select-none">{row.offset}</span>
                      <span className="col-span-7 text-cyan-300 tracking-wider whitespace-pre">{row.hex}</span>
                      <span className="col-span-3 text-right text-emerald-400 font-bold whitespace-pre border-l border-slate-800 pl-2">
                        {row.ascii}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RAW ASCII & FRAME BOUNDARIES */}
          {activeTab === 'raw' && (
            <div className="h-full flex flex-col min-h-0 space-y-3">
              <div className="flex items-center justify-between text-xs shrink-0">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-cyan-400" />
                  Khung Truyền Nhận ASCII Thô (Kèm Phân Định STX/ETX)
                </span>
                <button
                  onClick={() => handleCopy(transaction.rawAscii, 'rawTab')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  {copiedKey === 'rawTab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'rawTab' ? 'Đã sao chép' : 'Sao chép ASCII'}</span>
                </button>
              </div>

              {/* Physical Boundary Markers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">KÝ TỰ BẮT ĐẦU (STX)</span>
                  <span className="font-bold text-emerald-400 font-mono">0x02 [STX]</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">ĐỘ DÀI PAYLOAD</span>
                  <span className="font-bold text-cyan-400 font-mono">{transaction.payloadLength} ký tự</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">KIỂM TRA CHECKSUM</span>
                  <span className="font-bold text-purple-400 font-mono">{transaction.checksum}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">KÝ TỰ KẾT THÚC (ETX)</span>
                  <span className="font-bold text-emerald-400 font-mono">0x03 [ETX]</span>
                </div>
              </div>

              {/* Full ASCII Box */}
              <div className="flex-1 min-h-0 rounded-xl bg-slate-950/95 border border-slate-800/90 p-3.5 font-mono text-xs text-cyan-300 break-all select-all leading-relaxed shadow-inner overflow-y-auto">
                {transaction.rawAscii}
              </div>
            </div>
          )}
        </div>

        {/* ─── 5. MODAL FOOTER ─── */}
        <div className="px-4 py-2.5 bg-[#0C1322] border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span className="text-[11px] font-mono text-slate-500">
              Nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">ESC</kbd> hoặc click ngoài để đóng
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(transaction.rawAscii || JSON.stringify(payload), 'all')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              {copiedKey === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'all' ? 'Đã sao chép' : 'Sao chép nhanh'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

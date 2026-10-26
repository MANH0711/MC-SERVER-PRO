import React, { useMemo, useState, useRef } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import { CommunicationTransaction, DeviceModel } from '@/core/types';

/**
 * CẤU HÌNH ĐỘ RỘNG MẶC ĐỊNH TỪNG CỘT (Đơn vị: Pixel)
 * Bạn có thể tự do điều chỉnh các số pixel dưới đây hoặc chỉnh trực tiếp trên giao diện:
 */
export interface ColumnWidthConfig {
  time: number;       // Cột Thời gian (px)
  direction: number;  // Cột Chiều IN/OUT (px)
  equipId: number;    // Cột Mã Thiết Bị (px)
  model: number;      // Cột Model Máy (px)
  msgCode: number;    // Cột Message Code (px)
  status: number;     // Cột RESULT OK/NG/TO (px)
  txId: number;       // Cột Transaction ID (px)
  length: number;     // Cột Độ dài (px)
  checksum: number;   // Cột Checksum (px)
}

export const DEFAULT_COLUMN_WIDTHS: ColumnWidthConfig = {
  time: 85,       // Cột Thời gian (px)
  direction: 45,  // Cột Chiều IN/OUT (px)
  equipId: 45,   // Cột Mã Thiết Bị (px)
  model: 45,      // Cột Model Máy (px)
  msgCode: 70,    // Cột Message Code (px)
  status: 55,     // Cột RESULT OK/NG/TO (px)
  txId: 45,      // Cột Transaction ID (px)
  length: 45,     // Cột Độ dài (px)
  checksum: 65,   // Cột Checksum (px)
};

interface TransactionTableProps {
  transactions: CommunicationTransaction[];
  filteredTransactions: CommunicationTransaction[];
  activeTx: CommunicationTransaction | null;
  onSelectTx: (tx: CommunicationTransaction) => void;
  onOpenModalTx: (tx: CommunicationTransaction) => void;
  devices?: DeviceModel[];
  t: (key: string) => string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  filteredTransactions,
  activeTx,
  onSelectTx,
  onOpenModalTx,
  devices,
  t,
}) => {
  // Đọc cấu hình độ rộng pixel từ localStorage nếu có, mặc định lấy từ DEFAULT_COLUMN_WIDTHS
  const [colWidths, setColWidths] = useState<ColumnWidthConfig>(() => {
    try {
      const saved = localStorage.getItem('mcserver_transaction_table_col_widths_v3');
      if (saved) {
        return { ...DEFAULT_COLUMN_WIDTHS, ...JSON.parse(saved) };
      }
    } catch { }
    return DEFAULT_COLUMN_WIDTHS;
  });

  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [tempWidths, setTempWidths] = useState<ColumnWidthConfig>(colWidths);

  // Tính tổng chiều rộng tối thiểu của bảng
  const totalTableWidth = useMemo(() => {
    return (
      (colWidths.time || 45) +
      (colWidths.direction || 45) +
      (colWidths.equipId || 45) +
      (colWidths.model || 45) +
      (colWidths.msgCode || 70) +
      (colWidths.status || 55) +
      (colWidths.txId || 45) +
      (colWidths.length || 45) +
      (colWidths.checksum || 65)
    );
  }, [colWidths]);

  // Lưu cấu hình số px vào localStorage
  const handleSaveWidths = () => {
    setColWidths(tempWidths);
    try {
      localStorage.setItem('mcserver_transaction_table_col_widths_v3', JSON.stringify(tempWidths));
    } catch { }
    setShowConfigModal(false);
  };

  // Khôi phục về mặc định
  const handleResetWidths = () => {
    setTempWidths(DEFAULT_COLUMN_WIDTHS);
    setColWidths(DEFAULT_COLUMN_WIDTHS);
    try {
      localStorage.removeItem('mcserver_transaction_table_col_widths_v3');
      localStorage.removeItem('mcserver_transaction_table_col_widths_v2');
      localStorage.removeItem('mcserver_transaction_table_col_widths');
    } catch { }
  };

  // Kéo dãn độ rộng cột bằng con trỏ chuột (Mouse drag column resizing)
  const resizingRef = useRef<{
    colKey: keyof ColumnWidthConfig;
    startX: number;
    startWidth: number;
  } | null>(null);

  const startResizing = (e: React.MouseEvent, colKey: keyof ColumnWidthConfig) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      colKey,
      startX: e.clientX,
      startWidth: colWidths[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 45,
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const { colKey, startX, startWidth } = resizingRef.current;
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(30, Math.round(startWidth + deltaX));
      setColWidths((prev) => ({
        ...prev,
        [colKey]: newWidth,
      }));
    };

    const onMouseUp = () => {
      if (resizingRef.current) {
        setColWidths((latest) => {
          try {
            localStorage.setItem('mcserver_transaction_table_col_widths_v3', JSON.stringify(latest));
          } catch { }
          return latest;
        });
      }
      resizingRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const deviceModelMap = useMemo(() => {
    const map: Record<string, string> = {};
    devices?.forEach((d) => {
      const m = d.model || d.equipmentModel;
      if (m) {
        if (d.id) map[d.id] = m;
        if (d.equipmentId) map[d.equipmentId] = m;
        if (d.name) map[d.name] = m;
      }
    });
    return map;
  }, [devices]);

  return (
    <div className="lg:col-span-6 rounded-lg bg-[#0C1220]/95 border border-slate-800/90 flex flex-col min-h-0 overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <span className="font-semibold uppercase tracking-wider text-slate-300 text-[11px]">
          {t('communication.liveStreamHeader')}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-500">
            {t('communication.showingCount')} {filteredTransactions.length} {t('communication.ofTotal')} {transactions.length}
          </span>
          <button
            onClick={() => {
              setTempWidths(colWidths);
              setShowConfigModal(true);
            }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-[10px] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-slate-800 transition-all font-sans cursor-pointer shadow-xs active:scale-95"
            title="Nhập số pixel (px) để điều chỉnh độ rộng từng cột"
          >
            <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
            <span>Chỉnh cột (px)</span>
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu có thanh cuộn mượt và kích thước cố định theo Pixel */}
      <div className="flex-1 overflow-auto">
        <table
          className="w-full text-left font-mono text-[11px] table-fixed"
          style={{ minWidth: `${totalTableWidth}px` }}
        >
          <colgroup>
            <col style={{ width: `${colWidths.time}px` }} />
            <col style={{ width: `${colWidths.direction}px` }} />
            <col style={{ width: `${colWidths.equipId}px` }} />
            <col style={{ width: `${colWidths.model}px` }} />
            <col style={{ width: `${colWidths.msgCode}px` }} />
            <col style={{ width: `${colWidths.status}px` }} />
            <col style={{ width: `${colWidths.txId}px` }} />
            <col style={{ width: `${colWidths.length}px` }} />
            <col style={{ width: `${colWidths.checksum}px` }} />
          </colgroup>
          <thead className="sticky top-0 bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800 z-10 select-none">
            <tr>
              <th className="py-1.5 px-2 truncate relative group" title="Thời gian">
                <span>{t('communication.columns.time')}</span>
                <div
                  onMouseDown={(e) => startResizing(e, 'time')}
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                  title="Kéo chuột để co giãn độ rộng cột"
                >
                  <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                </div>
              </th>
              <th className="py-1.5 px-1 text-center truncate relative group" title="Chiều IN/OUT">
                <span>{t('communication.columns.direction')}</span>
                <div
                  onMouseDown={(e) => startResizing(e, 'direction')}
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                  title="Kéo chuột để co giãn độ rộng cột"
                >
                  <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                </div>
              </th>
              <th className="py-1.5 px-2 truncate relative group" title="Mã thiết bị">
                <span>{t('communication.columns.equipId')}</span>
                <div
                  onMouseDown={(e) => startResizing(e, 'equipId')}
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                  title="Kéo chuột để co giãn độ rộng cột"
                >
                  <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                </div>
              </th>
              <th className="py-1.5 px-2 truncate relative group" title="Model máy">
                <span>{t('communication.columns.model') || 'MODEL'}</span>
                <div
                  onMouseDown={(e) => startResizing(e, 'model')}
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                  title="Kéo chuột để co giãn độ rộng cột"
                >
                  <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                </div>
              </th>
              <th className="py-1.5 px-1.5 truncate relative group" title="Message Code">
                <span>{t('communication.columns.msgCode')}</span>
                <div
                  onMouseDown={(e) => startResizing(e, 'msgCode')}
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                  title="Kéo chuột để co giãn độ rộng cột"
                >
                  <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                </div>
              </th>
              <th className="py-1.5 px-1 text-center font-bold text-slate-200 truncate relative group" title="Kết quả">
                <span>RESULT</span>
                <div
                  onMouseDown={(e) => startResizing(e, 'status')}
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                  title="Kéo chuột để co giãn độ rộng cột"
                >
                  <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                </div>
              </th>
              <th className="py-1.5 px-2 truncate relative group" title="Transaction ID">
                <span>{t('communication.columns.txId')}</span>
                <div
                  onMouseDown={(e) => startResizing(e, 'txId')}
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                  title="Kéo chuột để co giãn độ rộng cột"
                >
                  <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                </div>
              </th>
              <th className="py-1.5 px-1.5 text-right truncate relative group" title="Độ dài">
                <span>{t('communication.columns.length')}</span>
                <div
                  onMouseDown={(e) => startResizing(e, 'length')}
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                  title="Kéo chuột để co giãn độ rộng cột"
                >
                  <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                </div>
              </th>
              <th className="py-1.5 px-2 text-right truncate relative group" title="Checksum">
                <span>{t('communication.columns.checksum')}</span>
                <div
                  onMouseDown={(e) => startResizing(e, 'checksum')}
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                  title="Kéo chuột để co giãn độ rộng cột"
                >
                  <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredTransactions.map((tx) => {
              const isSelected = activeTx?.id === tx.id;
              const model = tx.equipmentModel || deviceModelMap[tx.equipmentId] || '-';
              return (
                <tr
                  key={tx.id}
                  onClick={() => onSelectTx(tx)}
                  onDoubleClick={() => onOpenModalTx(tx)}
                  className={`cursor-pointer transition-colors ${isSelected
                      ? 'bg-blue-600/20 text-white border-l-2 border-blue-500'
                      : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  title="Nhấp để xem khung bên phải · Nhấp đúp để mở Modal chi tiết toàn diện"
                >
                  <td className="py-1.5 px-2 text-slate-400 text-[10px] tabular-nums truncate">
                    {tx.timestamp.split('T')[1]?.slice(0, 11) || tx.timestamp}
                  </td>
                  <td className="py-1.5 px-1 text-center">
                    {tx.direction === 'INBOUND' ? (
                      <span className="text-emerald-400 font-bold inline-flex items-center">
                        <ArrowDownLeft className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-blue-400 font-bold inline-flex items-center">
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 font-semibold text-slate-200 truncate" title={tx.equipmentId}>
                    {tx.equipmentId}
                  </td>
                  <td className="py-1.5 px-2 font-mono text-[10px] text-amber-300 font-medium truncate" title={model}>
                    {model !== '-' ? (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/25 text-amber-300 truncate inline-block max-w-full">
                        {model}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="py-1.5 px-1.5 font-bold text-cyan-400 truncate" title={tx.messageCode}>
                    {tx.messageCode}
                  </td>
                  <td className="py-1.5 px-1 text-center">
                    {tx.status === 'SUCCESS' ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/60 shadow-[0_0_6px_rgba(16,185,129,0.3)]">
                        OK
                      </span>
                    ) : tx.status === 'TIMEOUT' ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/60 shadow-[0_0_6px_rgba(245,158,11,0.3)]">
                        TO
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/25 text-rose-400 border border-rose-500/70 shadow-[0_0_6px_rgba(244,63,94,0.35)]">
                        NG
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-slate-400 truncate text-[10px]" title={tx.correlationId}>
                    {tx.correlationId}
                  </td>
                  <td className="py-1.5 px-1.5 text-right text-slate-400 truncate">
                    {tx.payloadLength}
                  </td>
                  <td className="py-1.5 px-2 text-right truncate">
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-mono ${tx.checksumStatus === 'VALID'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-red-400 bg-red-500/10'
                        }`}
                    >
                      {tx.checksum}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Cấu hình Độ rộng từng cột bằng số Pixel */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#0C1220] border border-cyan-500/40 rounded-xl shadow-2xl max-w-lg w-full p-4 space-y-4 text-slate-100 font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Điều Chỉnh Độ Rộng Cột (Pixel)
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Nhập số pixel (px) cho từng cột theo ý bạn. Bảng sẽ lưu lại vào trình duyệt và giữ nguyên kích thước này.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {[
                { key: 'time', label: 'Thời gian' },
                { key: 'direction', label: 'Chiều (IN/OUT)' },
                { key: 'equipId', label: 'Mã Thiết Bị' },
                { key: 'model', label: 'Model Máy' },
                { key: 'msgCode', label: 'Message Code' },
                { key: 'status', label: 'Kết quả (RESULT)' },
                { key: 'txId', label: 'Transaction ID' },
                { key: 'length', label: 'Độ dài' },
                { key: 'checksum', label: 'Checksum' },
              ].map(({ key, label }) => (
                <div key={key} className="bg-slate-900/90 border border-slate-800 p-2 rounded-md space-y-1">
                  <label className="text-[11px] text-slate-300 font-medium block truncate" title={label}>
                    {label}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={30}
                      max={500}
                      step={5}
                      value={tempWidths[key as keyof ColumnWidthConfig] || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setTempWidths((prev) => ({
                          ...prev,
                          [key]: Math.max(30, val),
                        }));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-cyan-300 focus:outline-hidden focus:border-cyan-500"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">px</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={handleResetWidths}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Khôi phục về kích thước mặc định"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Mặc định</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveWidths}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Áp Dụng</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

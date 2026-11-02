import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  RefreshCw,
  Download,
  Copy,
  Check,
  HardDrive,
  FolderOpen,
  Calendar,
  Cpu,
  Search,
  X,
  FileCode,
  SlidersHorizontal,
  ArrowDownToLine,
  Filter,
} from 'lucide-react';
import { useApp } from '@/core/context';
import { deviceLogApi, DeviceLogFileResponse } from '../api/deviceLogApi';
import { copyToClipboard } from '@/core/utils/clipboard';

interface DeviceFileLogsViewerProps {
  currentEquipId?: string;
  currentDate?: string;
  onDeviceChange?: (equipId: string) => void;
  compact?: boolean;
}

type ActionFilterType = 'ALL' | 'RECEIVE' | 'SEND' | 'PARSING' | 'ERROR';

export const DeviceFileLogsViewer: React.FC<DeviceFileLogsViewerProps> = ({
  currentEquipId,
  currentDate,
  onDeviceChange,
  compact = false,
}) => {
  const { devices } = useApp();
  const [loggedEquipments, setLoggedEquipments] = useState<string[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<string>(() => {
    return currentEquipId || (devices.length > 0 ? devices[0].id : 'WB161VN');
  });
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return currentDate || new Date().toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [logData, setLogData] = useState<DeviceLogFileResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // Bộ tìm kiếm và lọc nhanh
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<ActionFilterType>('ALL');

  const terminalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ khi props thay đổi
  useEffect(() => {
    if (currentEquipId && currentEquipId !== selectedEquip) {
      setSelectedEquip(currentEquipId);
    }
  }, [currentEquipId]);

  useEffect(() => {
    if (currentDate && currentDate !== selectedDate) {
      setSelectedDate(currentDate);
    }
  }, [currentDate]);

  // 1. Tải danh sách thiết bị chuẩn từ Database và thư mục D:\log
  const loadEquipments = async () => {
    const list = await deviceLogApi.getLoggedEquipments();
    setLoggedEquipments(list);

    if (list.length > 0) {
      if (!selectedEquip || !list.includes(selectedEquip)) {
        const initial = currentEquipId && list.includes(currentEquipId) ? currentEquipId : list[0];
        setSelectedEquip(initial);
        onDeviceChange?.(initial);
      }
    }
  };

  useEffect(() => {
    loadEquipments();
  }, []);

  // 2. Tải danh sách ngày khi chọn thiết bị
  useEffect(() => {
    if (!selectedEquip) return;
    deviceLogApi.getLogDates(selectedEquip).then((dates) => {
      setAvailableDates(dates);
      if (dates.length > 0) {
        if (!dates.includes(selectedDate)) {
          setSelectedDate(dates[0]);
        }
      } else {
        setSelectedDate(new Date().toISOString().slice(0, 10));
      }
    });
  }, [selectedEquip]);

  // 3. Tải nội dung file log D:\log\<selectedEquip>\<selectedDate>.log
  const loadContent = async () => {
    if (!selectedEquip || !selectedDate) return;
    setLoading(true);
    try {
      const data = await deviceLogApi.getLogContent(selectedEquip, selectedDate, 1500);
      setLogData(data);
    } catch {
      setLogData({
        filePath: `D:\\log\\${selectedEquip}\\${selectedDate}.log`,
        exists: false,
        sizeBytes: 0,
        content: '',
        linesCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [selectedEquip, selectedDate]);

  // Tự động cuộn xuống đáy terminal khi có log mới
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logData, autoScroll, searchQuery, actionFilter]);

  // Đổi thiết bị
  const handleSelectEquip = (equipId: string) => {
    setSelectedEquip(equipId);
    onDeviceChange?.(equipId);
  };

  // Gom toàn bộ danh sách thiết bị hiển thị
  const allEquipmentOptions = Array.from(
    new Set([...loggedEquipments, ...devices.map((d) => d.id)])
  ).filter(Boolean).sort();

  // Danh sách dòng thô
  const rawLines = useMemo(() => {
    if (!logData?.content) return [];
    return logData.content.split(/\r?\n/).filter(Boolean);
  }, [logData?.content]);

  // Lọc dòng log tự động theo searchQuery và actionFilter
  const filteredLines = useMemo(() => {
    if (!rawLines.length) return [];
    const query = searchQuery.trim().toLowerCase();

    return rawLines
      .map((line, originalIndex) => ({ line, originalIndex }))
      .filter(({ line }) => {
        // 1. Lọc theo Action
        if (actionFilter !== 'ALL') {
          if (actionFilter === 'RECEIVE' && !line.includes('Receive From EQP')) return false;
          if (actionFilter === 'SEND' && !line.includes('Send to EQP') && !line.includes('Send Message')) return false;
          if (actionFilter === 'PARSING' && !line.includes('Parsing')) return false;
          if (actionFilter === 'ERROR' && !line.includes('Error') && !line.includes('NG')) return false;
        }

        // 2. Lọc tự động theo từ khóa tìm kiếm
        if (query) {
          return line.toLowerCase().includes(query);
        }

        return true;
      });
  }, [rawLines, searchQuery, actionFilter]);

  // Sao chép nội dung log (nếu đang lọc thì sao chép nội dung đã lọc)
  const handleCopy = async () => {
    const textToCopy = (searchQuery || actionFilter !== 'ALL')
      ? filteredLines.map((x) => x.line).join('\r\n')
      : (logData?.content || '');

    if (!textToCopy) return;
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Hàm highlight từ khóa tìm kiếm
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-400 text-slate-950 font-bold px-0.5 rounded-xs shadow-xs">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#070C18] text-slate-100 font-sans overflow-hidden select-text border border-slate-800/90 rounded-md">
      {/* ─── 1. TOOLBAR TỐI ƯU DIỆN TÍCH: BỘ CHỌN, TÌM KIẾM TỰ ĐỘNG & NÚT THAO TÁC ─── */}
      <div className="px-3 py-1.5 bg-slate-950/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
        {/* Nhóm bên trái: Chọn Thiết bị & Ngày & Badge D:\log */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Badge đường dẫn file */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[11px]">
            <HardDrive className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="font-semibold text-cyan-200">D:\log\{selectedEquip}</span>
          </div>

          {/* Chọn Thiết Bị */}
          <div className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-400" />
            <select
              value={selectedEquip}
              onChange={(e) => handleSelectEquip(e.target.value)}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px] font-bold focus:outline-none focus:border-cyan-500 max-w-[150px] truncate"
              title="Chọn ID thiết bị theo Database"
            >
              {allEquipmentOptions.map((eqp) => {
                const hasLog = loggedEquipments.includes(eqp);
                const matchedDev = devices.find((d) => d.id === eqp);
                const modelStr = matchedDev?.model || matchedDev?.name;
                const label = modelStr ? `${eqp} (${modelStr})` : eqp;
                return (
                  <option key={eqp} value={eqp}>
                    {label} {hasLog ? '📁' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Chọn Ngày */}
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {availableDates.length > 0 ? (
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-[11px] font-semibold focus:outline-none focus:border-emerald-500"
                title="Chọn ngày có file log"
              >
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {date}.log
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
              />
            )}
          </div>
        </div>

        {/* Nhóm trung tâm: Ô Tìm Kiếm Tự Động (Auto-Search Input) */}
        <div className="flex items-center gap-1.5 flex-1 max-w-xs min-w-[180px]">
          <div className="relative w-full">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tự động (PCB, LOT, S000, NG...)..."
              className="w-full pl-6 pr-6 py-0.5 rounded bg-slate-900/90 border border-slate-700 focus:border-cyan-500 text-slate-100 placeholder-slate-500 font-mono text-[11px] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title="Xóa tìm kiếm (Esc)"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Nhóm bên phải: Nút Filter nhanh & Thao tác */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Action Filter Pills */}
          <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded border border-slate-800 text-[10px] font-mono">
            {(
              [
                { id: 'ALL', label: 'Tất cả' },
                { id: 'RECEIVE', label: 'Receive' },
                { id: 'SEND', label: 'Send' },
                { id: 'PARSING', label: 'Parse' },
                { id: 'ERROR', label: 'Lỗi/NG' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setActionFilter(f.id)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  actionFilter === f.id
                    ? f.id === 'ERROR'
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Toggle Auto-scroll */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded border text-[11px] transition-colors ${
              autoScroll
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={autoScroll ? 'Tự động cuộn đang BẬT' : 'Tự động cuộn đang TẮT'}
          >
            <ArrowDownToLine className="w-3 h-3" />
          </button>

          {/* Làm mới */}
          <button
            onClick={loadContent}
            disabled={loading}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Tải lại file log từ đĩa"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Sao chép */}
          <button
            onClick={handleCopy}
            disabled={!logData?.exists}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 text-[11px] font-mono transition-colors disabled:opacity-40"
            title="Sao chép các dòng đang hiển thị"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>

          {/* Tải về .LOG */}
          {logData?.exists && (
            <a
              href={deviceLogApi.getDownloadUrl(selectedEquip, selectedDate)}
              download={`${selectedEquip}_${selectedDate}.log`}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-700/80 hover:bg-cyan-600 text-white font-mono text-[11px] font-semibold transition-colors"
              title="Tải tệp .log về máy"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Tải .LOG</span>
            </a>
          )}
        </div>
      </div>

      {/* ─── 2. THANH BÁO THÔNG SỐ VÀ TRẠNG THÁI TÌM KIẾM (SIÊU MỎNG) ─── */}
      <div className="px-3 py-1 bg-[#0A1020] border-b border-slate-800/80 flex items-center justify-between text-[10px] font-mono shrink-0">
        <div className="flex items-center gap-2 text-slate-400 truncate">
          <FolderOpen className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="truncate text-slate-300 select-all">
            {logData?.filePath || `D:\\log\\${selectedEquip}\\${selectedDate}.log`}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 text-slate-400">
          {(searchQuery || actionFilter !== 'ALL') && (
            <span className="text-amber-300 font-bold bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.2 rounded">
              🔍 Khớp: {filteredLines.length} / {rawLines.length} dòng
            </span>
          )}
          <span>
            {logData?.exists ? (
              <span className="text-emerald-400 font-semibold">Tồn tại ({logData.sizeBytes} B)</span>
            ) : (
              <span className="text-amber-400 font-semibold">Chưa có bản ghi hôm nay</span>
            )}
          </span>
          <span>·</span>
          <span>Tổng: {rawLines.length} dòng</span>
        </div>
      </div>

      {/* ─── 3. LOG CONTENT TERMINAL VIEWER (TẬN DỤNG TỐI ĐA VIEWPORT) ─── */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-2.5 font-mono text-[11px] bg-[#050811] select-text space-y-0.5 leading-relaxed"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
            <p className="text-[11px] font-mono">Đang đọc tệp D:\log\{selectedEquip}\{selectedDate}.log...</p>
          </div>
        ) : !logData?.exists ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-500">
            <FileCode className="w-8 h-8 text-slate-600" />
            <div className="text-center space-y-0.5">
              <p className="text-xs font-semibold text-slate-300 font-mono">
                Chưa có file log ngày [{selectedDate}] cho thiết bị [{selectedEquip}]
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Đường dẫn dự kiến: D:\log\{selectedEquip}\{selectedDate}.log
              </p>
            </div>
          </div>
        ) : filteredLines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-500">
            <Filter className="w-6 h-6 text-slate-600" />
            <p className="text-xs text-slate-400 font-mono">
              Không có dòng nào khớp với bộ lọc hoặc từ khóa "{searchQuery}".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActionFilter('ALL');
              }}
              className="text-[11px] text-cyan-400 underline hover:text-cyan-300"
            >
              Xóa bộ lọc để xem toàn bộ {rawLines.length} dòng
            </button>
          </div>
        ) : (
          filteredLines.map(({ line, originalIndex }) => {
            const parts = line.split(' : ');
            const timestamp = parts[0] || '';
            const action = parts[1] || '';
            const content = parts.slice(2).join(' : ');

            let actionBadgeStyle = 'text-slate-300 bg-slate-900 border-slate-700';
            let contentStyle = 'text-slate-200';

            if (action.includes('Receive From EQP')) {
              actionBadgeStyle = 'text-cyan-300 bg-cyan-950/80 border-cyan-700/60 font-bold';
              contentStyle = 'text-cyan-100';
            } else if (action.includes('Send to EQP')) {
              actionBadgeStyle = 'text-sky-300 bg-sky-950/80 border-sky-700/60 font-bold';
              contentStyle = 'text-sky-100';
            } else if (action.includes('Send Message')) {
              actionBadgeStyle = 'text-emerald-300 bg-emerald-950/80 border-emerald-700/60 font-bold';
              contentStyle = 'text-emerald-100 font-medium';
            } else if (action.includes('Parsing')) {
              actionBadgeStyle = 'text-amber-300 bg-amber-950/80 border-amber-700/60 font-bold';
              contentStyle = 'text-amber-100';
            } else if (action.includes('Error') || action.includes('NG')) {
              actionBadgeStyle = 'text-rose-200 bg-rose-950 border-rose-600 font-bold';
              contentStyle = 'text-rose-200 font-semibold bg-rose-950/30 px-1 rounded';
            }

            return (
              <div
                key={originalIndex}
                className="hover:bg-slate-900/70 px-1.5 py-0.5 rounded flex items-start gap-1.5 font-mono text-[11px] leading-relaxed transition-colors border-l-2 border-transparent hover:border-cyan-500/60"
              >
                {/* Số thứ tự dòng */}
                <span className="text-slate-600 select-none text-[10px] w-7 text-right shrink-0 font-mono">
                  {originalIndex + 1}
                </span>

                {/* Dấu thời gian */}
                <span className="text-slate-400 shrink-0 font-mono">
                  {renderHighlightedText(timestamp, searchQuery)}
                </span>

                <span className="text-slate-600 shrink-0">:</span>

                {/* Badge Hành động */}
                <span className={`shrink-0 px-1 py-0.2 rounded border text-[10px] ${actionBadgeStyle}`}>
                  {renderHighlightedText(action, searchQuery)}
                </span>

                <span className="text-slate-600 shrink-0">:</span>

                {/* Nội dung bản tin (có highlight từ khóa tự động) */}
                <span className={`break-all ${contentStyle} flex-1`}>
                  {renderHighlightedText(content, searchQuery)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

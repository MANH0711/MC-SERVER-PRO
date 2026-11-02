import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  RefreshCw,
  Download,
  Copy,
  Check,
  HardDrive,
  FolderOpen,
  Calendar,
  Cpu,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { useApp } from '@/core/context';
import { deviceLogApi, DeviceLogFileResponse } from '../api/deviceLogApi';
import { copyToClipboard } from '@/core/utils/clipboard';

interface DeviceFileLogsViewerProps {
  currentEquipId?: string;
  onDeviceChange?: (equipId: string) => void;
}

export const DeviceFileLogsViewer: React.FC<DeviceFileLogsViewerProps> = ({
  currentEquipId,
  onDeviceChange,
}) => {
  const { devices } = useApp();
  const [loggedEquipments, setLoggedEquipments] = useState<string[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<string>(() => {
    return currentEquipId || (devices.length > 0 ? devices[0].id : 'WB161VN');
  });
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [logData, setLogData] = useState<DeviceLogFileResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Đồng bộ khi prop currentEquipId thay đổi từ ngoài
  useEffect(() => {
    if (currentEquipId && currentEquipId !== selectedEquip) {
      setSelectedEquip(currentEquipId);
    }
  }, [currentEquipId]);

  // 1. Tải danh sách thiết bị chuẩn từ Database và thư mục D:\log
  const loadEquipments = async () => {
    const list = await deviceLogApi.getLoggedEquipments();
    setLoggedEquipments(list);

    if (list.length > 0) {
      if (!selectedEquip || !list.includes(selectedEquip)) {
        // Ưu tiên thiết bị từ prop, nếu không lấy thiết bị đầu tiên của DB
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
        setSelectedDate(dates[0]); // Chọn ngày mới nhất có log
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
      const data = await deviceLogApi.getLogContent(selectedEquip, selectedDate);
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
  }, [logData, autoScroll]);

  // Đổi thiết bị
  const handleSelectEquip = (equipId: string) => {
    setSelectedEquip(equipId);
    onDeviceChange?.(equipId);
  };

  // Sao chép nội dung log
  const handleCopy = async () => {
    if (!logData?.content) return;
    const ok = await copyToClipboard(logData.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Tô màu từng dòng log theo chuẩn cú pháp thiết bị
  const renderLogLines = (rawContent: string) => {
    if (!rawContent) return null;
    const lines = rawContent.split(/\r?\n/).filter(Boolean);

    return lines.map((line, idx) => {
      // Mẫu: 2026-10-31-03:51:10.728 AM : Action : Content
      const parts = line.split(' : ');
      const timestamp = parts[0] || '';
      const action = parts[1] || '';
      const content = parts.slice(2).join(' : ');

      let actionStyle = 'text-slate-300';
      let contentStyle = 'text-slate-200';

      if (action.includes('Receive From EQP')) {
        actionStyle = 'text-cyan-400 font-bold';
        contentStyle = 'text-cyan-200';
      } else if (action.includes('Send to EQP')) {
        actionStyle = 'text-sky-400 font-bold';
        contentStyle = 'text-sky-200';
      } else if (action.includes('Send Message')) {
        actionStyle = 'text-emerald-400 font-bold';
        contentStyle = 'text-emerald-200 font-semibold';
      } else if (action.includes('Parsing')) {
        actionStyle = 'text-amber-400 font-bold';
        contentStyle = 'text-amber-200';
      } else if (action.includes('Error') || action.includes('NG')) {
        actionStyle = 'text-rose-400 font-bold';
        contentStyle = 'text-rose-200 font-bold bg-rose-950/40 px-1 rounded';
      }

      return (
        <div
          key={idx}
          className="hover:bg-slate-900/80 px-2 py-0.5 rounded flex items-start gap-2 font-mono text-[11px] leading-relaxed transition-colors border-l-2 border-transparent hover:border-cyan-500/50"
        >
          <span className="text-slate-500 select-none text-[10px] w-8 text-right shrink-0">
            {idx + 1}
          </span>
          <span className="text-slate-400 shrink-0 font-medium">{timestamp}</span>
          <span className="text-slate-600 shrink-0">:</span>
          <span className={`shrink-0 ${actionStyle}`}>{action}</span>
          <span className="text-slate-600 shrink-0">:</span>
          <span className={`break-all ${contentStyle}`}>{content}</span>
        </div>
      );
    });
  };

  // Gom toàn bộ danh sách thiết bị hiển thị (từ Database MIGHTY.GATEWAY_DEVICES và D:\log)
  const allEquipmentOptions = Array.from(
    new Set([...loggedEquipments, ...devices.map((d) => d.id)])
  ).filter(Boolean).sort();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0A0F1D] text-slate-100 font-sans overflow-hidden">
      {/* ─── 1. TOOLBAR: CHỌN THIẾT BỊ, NGÀY & HÀNH ĐỘNG ─── */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Badge Hiển thị đường dẫn file log thật theo ID thiết bị DB */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 font-mono text-xs shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">File Log:</span>
            <span className="font-bold text-cyan-200">D:\log\{selectedEquip}\{selectedDate}.log</span>
          </div>

          {/* Chọn Thiết Bị Theo ID Chuẩn Trong Database */}
          <div className="flex items-center gap-1.5 text-xs">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Thiết Bị (DB ID):</span>
            <select
              value={selectedEquip}
              onChange={(e) => handleSelectEquip(e.target.value)}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500 font-bold"
            >
              {allEquipmentOptions.map((eqp) => {
                const hasLog = loggedEquipments.includes(eqp);
                const matchedDev = devices.find((d) => d.id === eqp);
                const modelStr = matchedDev?.model || matchedDev?.name;
                const label = modelStr ? `${eqp} (${modelStr})` : eqp;
                return (
                  <option key={eqp} value={eqp}>
                    {label} {hasLog ? '📁 (Có file)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Chọn Ngày Log */}
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Ngày Log:</span>
            {availableDates.length > 0 ? (
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500 font-bold"
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
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            )}
          </div>
        </div>

        {/* Nút thao tác bên phải */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Cuộn xuống đáy</span>
          </label>

          <button
            onClick={loadContent}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors text-xs font-semibold"
            title="Làm mới nội dung file"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!logData?.exists}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors text-xs font-semibold disabled:opacity-50"
            title="Sao chép toàn bộ nội dung"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã Sao Chép' : 'Sao Chép'}</span>
          </button>

          {logData?.exists && (
            <a
              href={deviceLogApi.getDownloadUrl(selectedEquip, selectedDate)}
              download={`${selectedEquip}_${selectedDate}.log`}
              className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(6,182,212,0.35)] transition-all"
              title={`Tải file D:\\log\\${selectedEquip}\\${selectedDate}.log về máy`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải File .LOG</span>
            </a>
          )}
        </div>
      </div>

      {/* ─── 2. THÔNG TIN FILE VẬT LÝ TRÊN Ổ D:\ THEO ID THIẾT BỊ DB ─── */}
      <div className="px-4 py-1.5 bg-[#0B1324] border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono shrink-0">
        <div className="flex items-center gap-2 text-slate-300 truncate">
          <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-400">Đường Dẫn Vật Lý:</span>
          <span className="font-bold text-cyan-300 truncate cursor-text select-text select-all">
            {logData?.filePath || `D:\\log\\${selectedEquip}\\${selectedDate}.log`}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-slate-400">
          <span>
            Trạng Thái:{' '}
            {logData?.exists ? (
              <b className="text-emerald-400">Tồn Tại</b>
            ) : (
              <b className="text-amber-400">Chưa có bản ghi hôm nay</b>
            )}
          </span>
          <span>·</span>
          <span>
            Dung Lượng: <b className="text-slate-200">{logData?.sizeBytes || 0} bytes</b>
          </span>
          <span>·</span>
          <span>
            Tổng Dòng: <b className="text-slate-200">{logData?.linesCount || 0}</b>
          </span>
        </div>
      </div>

      {/* ─── 3. LOG CONTENT TERMINAL VIEWER ─── */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-[#060913] select-text space-y-0.5 leading-relaxed"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <p className="text-xs font-mono">Đang tải file log D:\log\{selectedEquip}\{selectedDate}.log...</p>
          </div>
        ) : !logData?.exists ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <FileCode className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-slate-300 font-mono">
                Chưa có file log ngày [{selectedDate}] cho thiết bị [{selectedEquip}]
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Đường dẫn dự kiến: D:\log\{selectedEquip}\{selectedDate}.log
              </p>
              <p className="text-[10px] text-slate-500">
                File log sẽ tự động được tạo và ghi nhận khi thiết bị [{selectedEquip}] gửi bản tin (S000, S050, Socket...)
              </p>
            </div>
          </div>
        ) : (
          renderLogLines(logData.content)
        )}
      </div>
    </div>
  );
};

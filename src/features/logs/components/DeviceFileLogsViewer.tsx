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

export const DeviceFileLogsViewer: React.FC = () => {
  const { devices } = useApp();
  const [loggedEquipments, setLoggedEquipments] = useState<string[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<string>('XNGM003');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [logData, setLogData] = useState<DeviceLogFileResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  // 1. Tải danh sách thiết bị có log thực tế trong D:\log
  const loadEquipments = async () => {
    const list = await deviceLogApi.getLoggedEquipments();
    setLoggedEquipments(list);
    if (list.length > 0 && !list.includes(selectedEquip)) {
      setSelectedEquip(list[0]);
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
        setSelectedDate(dates[0]); // Chọn ngày mới nhất
      } else {
        setSelectedDate(new Date().toISOString().slice(0, 10));
      }
    });
  }, [selectedEquip]);

  // 3. Tải nội dung file log
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

  // Gom toàn bộ danh sách thiết bị hiển thị (từ D:\log và từ GATEWAY_DEVICES)
  const allEquipmentOptions = Array.from(
    new Set([...loggedEquipments, ...devices.map((d) => d.id)])
  ).sort();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0A0F1D] text-slate-100 font-sans overflow-hidden">
      {/* ─── 1. TOOLBAR: CHỌN THIẾT BỊ, NGÀY & HÀNH ĐỘNG ─── */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Badge Ổ đĩa D:\log */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono text-xs shadow-[0_0_10px_rgba(6,182,212,0.15)]">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">Ổ D:\log</span>
          </div>

          {/* Chọn Thiết Bị */}
          <div className="flex items-center gap-1.5 text-xs">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Thiết Bị:</span>
            <select
              value={selectedEquip}
              onChange={(e) => setSelectedEquip(e.target.value)}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500 font-bold"
            >
              {allEquipmentOptions.map((eqp) => {
                const hasLog = loggedEquipments.includes(eqp);
                return (
                  <option key={eqp} value={eqp}>
                    {eqp} {hasLog ? '📁 (Có file)' : ''}
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
              title="Tải file .log về máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải File .LOG</span>
            </a>
          )}
        </div>
      </div>

      {/* ─── 2. THÔNG TIN FILE VẬT LÝ TRÊN Ổ D:\ ─── */}
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
            Tổng Dòng: <b className="text-cyan-300">{logData?.linesCount || 0}</b>
          </span>
        </div>
      </div>

      {/* ─── 3. TERMINAL/CONSOLE LOG VIEWER ─── */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 bg-black/90 font-mono text-xs select-text selection:bg-cyan-500/30 selection:text-white"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
            <span>Đang đọc dữ liệu file log từ ổ đĩa D:\...</span>
          </div>
        ) : logData?.exists && logData.content ? (
          <div className="space-y-0.5">{renderLogLines(logData.content)}</div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 italic space-y-2 select-none">
            <AlertCircle className="w-8 h-8 text-slate-600" />
            <div>
              Chưa có dữ liệu file log tại{' '}
              <code className="text-cyan-400 not-italic font-bold">
                D:\log\{selectedEquip}\{selectedDate}.log
              </code>
            </div>
            <div className="text-[11px] text-slate-600">
              Hệ thống sẽ tự động tạo file và ghi nhật ký ngay khi thiết bị thực hiện kết nối hoặc gửi/nhận lệnh.
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. FOOTER STATUS BAR ─── */}
      <div className="px-4 py-1.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[10.5px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          <span>Định dạng ghi chuẩn: <code className="text-slate-300">YYYY-MM-DD-hh:mm:ss.fff AM/PM : Action : Payload</code></span>
        </div>
        <div className="text-emerald-400 font-bold">
          ● Hệ thống tự động ghi nhật ký thời gian thực vào ổ D:\log
        </div>
      </div>
    </div>
  );
};

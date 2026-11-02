import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  Maximize2,
  Minimize2,
  Terminal,
} from 'lucide-react';
import { DeviceFileLogsViewer } from './DeviceFileLogsViewer';

interface DeviceLogViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEquipmentId?: string;
  initialDate?: string;
}

export const DeviceLogViewerModal: React.FC<DeviceLogViewerModalProps> = ({
  isOpen,
  onClose,
  initialEquipmentId,
  initialDate,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentEquip, setCurrentEquip] = useState<string>(initialEquipmentId || '');

  useEffect(() => {
    if (initialEquipmentId) {
      setCurrentEquip(initialEquipmentId);
    }
  }, [initialEquipmentId]);

  // Đóng bằng phím ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`bg-[#0A0F1D] border border-slate-700/80 rounded-lg shadow-2xl flex flex-col overflow-hidden transition-all duration-150 ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-6xl h-[88vh] max-h-[920px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── MODAL HEADER (ĐỒNG BỘ CÁC FORM CHUẨN CÔNG NGHIỆP) ─── */}
        <div className="px-3.5 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                  <span>Trình Xem Log Trực Tiếp Từ File Vật Lý</span>
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold">
                  D:\log\{currentEquip || 'EQP'}\
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Đọc trực tiếp dữ liệu thô (Raw Device Cycle) từ ổ đĩa máy chủ Windows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Phóng to / thu nhỏ */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Đóng Modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-rose-950/40 hover:border-rose-700/60 transition-colors group"
              title="Đóng (Phím ESC)"
            >
              <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-150" />
            </button>
          </div>
        </div>

        {/* ─── MODAL BODY: DEVICE FILE LOGS COMPACT VIEWER ─── */}
        <div className="flex-1 min-h-0 p-2 overflow-hidden flex flex-col bg-[#070C18]">
          <DeviceFileLogsViewer
            currentEquipId={initialEquipmentId}
            currentDate={initialDate}
            onDeviceChange={setCurrentEquip}
            compact={true}
          />
        </div>

        {/* ─── MODAL FOOTER: THÔNG TIN HƯỚNG DẪN ─── */}
        <div className="px-3 py-1 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Đồng bộ thời gian thực theo ID thiết bị Oracle & File vật lý D:\log</span>
          </div>
          <div>
            <span className="text-slate-500">Nhấn <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">ESC</kbd> để đóng</span>
          </div>
        </div>
      </div>
    </div>
  );
};

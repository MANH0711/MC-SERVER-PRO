/**
 * Device Delete Confirmation Modal Component
 * Modern, high-aesthetic, intuitive confirmation dialog for safe equipment removal
 */

import React, { useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  Server,
  Wifi,
  Building2,
  Layers,
  Cpu,
  ShieldAlert,
  Copy,
  Check,
} from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { DeviceModel, DeviceStatus } from '@/core/types';

export interface DeviceDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceModel | null;
  onConfirmDelete: (id: string) => void;
  getStatusBadge?: (status: DeviceStatus) => string;
}

export const DeviceDeleteModal: React.FC<DeviceDeleteModalProps> = ({
  isOpen,
  onClose,
  device,
  onConfirmDelete,
  getStatusBadge,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState<boolean>(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !device) return null;

  const deviceId = device.equipmentId || device.id;
  const plant = device.plant || device.factory || 'ITMVIET';
  const group = device.groupName || device.groupId || 'NET';
  const model = device.equipmentModel || device.model || 'IBS_BAKE';
  const hostAddr = device.hostAddress || device.ipAddress || '127.0.0.1';
  const hostPort = device.hostPort || device.port || 5010;
  const description = device.description || device.name || 'Không có mô tả';
  const status = device.status || 'Disconnected';

  const handleCopyId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    onConfirmDelete(device.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0B101D] border border-rose-500/40 rounded-xl shadow-[0_0_40px_rgba(244,63,94,0.18)] overflow-hidden animate-in zoom-in-95 duration-150 text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative hazard top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0 shadow-inner">
              <Trash2 className="w-4 h-4 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping opacity-75" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-100 flex items-center gap-2">
                <span>{t('device.deleteModal.title')}</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-700">
                  DANGER
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {t('device.deleteModal.subtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* Main Visual Profile Card of the Machine */}
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3.5 space-y-3 shadow-inner">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Server className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-100 tracking-wide">
                      {deviceId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Sao chép mã máy"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {description}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border shrink-0 ${
                  getStatusBadge
                    ? getStatusBadge(status)
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {t(`device.status.${status}`) || status}
              </span>
            </div>

            {/* Detailed Attribute Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">{t('device.deleteModal.plant')}</span>
                  <span className="text-amber-300 font-semibold">{plant}</span>
                </div>
              </div>

              <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">{t('device.deleteModal.group')}</span>
                  <span className="text-cyan-300 font-semibold">{group}</span>
                </div>
              </div>

              <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">{t('device.deleteModal.model')}</span>
                  <span className="text-emerald-300 font-semibold truncate block">{model}</span>
                </div>
              </div>

              <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80 flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">{t('device.deleteModal.network')}</span>
                  <span className="text-purple-300 font-semibold truncate block">
                    {hostAddr}:{hostPort}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Caution Callout */}
          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-300/90 leading-relaxed shadow-sm">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-rose-200 block text-[11px] uppercase tracking-wide">
                {t('device.deleteModal.warningTitle')}
              </span>
              <p className="text-[11px] text-slate-300">
                {t('device.deleteModal.warningDesc')}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic text-center">
            {t('device.deleteModal.confirmPrompt')}
          </p>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-5 py-3.5 bg-slate-950/95 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
            <span>ID: {deviceId}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              {t('device.deleteModal.cancelBtn')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('device.deleteModal.confirmBtn')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDeleteModal;

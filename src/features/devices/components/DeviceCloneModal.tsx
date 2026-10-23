/**
 * Device Quick Clone Modal Component
 * Copies 18-column configuration from template machine with minimal input (ID & IP)
 */

import React from 'react';
import {
  Copy,
  Server,
  CheckCircle2,
  Zap,
  SlidersHorizontal,
  Check,
  X,
} from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { DeviceModel } from '@/core/types';

interface DeviceCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceDevice: DeviceModel | null;
  newId: string;
  setNewId: (id: string) => void;
  newIp: string;
  setNewIp: (ip: string) => void;
  newPort: number | string;
  setNewPort: (port: number | string) => void;
  newName: string;
  setNewName: (name: string) => void;
  error: string;
  onConfirm: (e?: React.FormEvent) => void;
  onSwitchToFullEdit: () => void;
  onSuggestNextId: () => void;
}

export const DeviceCloneModal: React.FC<DeviceCloneModalProps> = ({
  isOpen,
  onClose,
  sourceDevice,
  newId,
  setNewId,
  newIp,
  setNewIp,
  newPort,
  setNewPort,
  newName,
  setNewName,
  error,
  onConfirm,
  onSwitchToFullEdit,
  onSuggestNextId,
}) => {
  const { t } = useTranslation();

  if (!isOpen || !sourceDevice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#0A0F1D] border border-cyan-500/50 rounded-xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-xs font-sans">
        
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shrink-0">
              <Copy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  {t('device.cloneModal.title')}
                </h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                  {sourceDevice.equipmentId || sourceDevice.id}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {t('device.cloneModal.subtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-3 p-2 rounded-md bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body */}
        <form onSubmit={onConfirm} className="p-4 space-y-3.5">
          
          {/* Template Source Summary Card */}
          <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Server className="w-3.5 h-3.5" />
                <span>{t('device.cloneModal.sourceDevice')}: <strong>{sourceDevice.equipmentId || sourceDevice.id}</strong></span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                {sourceDevice.equipmentModel || sourceDevice.model || 'IBS_BAKE'}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono bg-slate-950/60 p-2 rounded border border-slate-800/60 text-slate-400">
              <div>
                <span className="text-slate-500 block">PLANT / GROUP:</span>
                <span className="text-amber-400 font-semibold">{sourceDevice.plant || sourceDevice.factory || 'ITMVIET'} / {sourceDevice.groupName || sourceDevice.groupId || 'NET'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">TCP PROTOCOL:</span>
                <span className="text-purple-300">{sourceDevice.protocolVersion || 'v2.0'} ({sourceDevice.checksumAlgorithm || 'LRC'})</span>
              </div>
              <div>
                <span className="text-slate-500 block">RECIPE / INTERLOCK:</span>
                <span className="text-emerald-400">{sourceDevice.interlockRecipe || 'YES'} (SRV:{sourceDevice.serverNo ?? 15})</span>
              </div>
            </div>

            <p className="text-[10px] text-cyan-300/90 italic flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{t('device.cloneModal.cloneNotice')}</span>
            </p>
          </div>

          {/* Input Fields Card (Chỉ cần nhập ID và IP khác) */}
          <div className="rounded-lg bg-slate-900/60 border border-cyan-500/30 p-3.5 space-y-3 shadow-inner">
            
            {/* 1. MÃ THIẾT BỊ MỚI (NEW EQUIPMENT ID) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                  <span>{t('device.cloneModal.newIdLabel')}</span>
                  <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={onSuggestNextId}
                  className="text-[10px] text-cyan-400 hover:text-cyan-200 underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Zap className="w-2.5 h-2.5" />
                  <span>{t('device.cloneModal.autoNextId')}</span>
                </button>
              </div>
              <input
                type="text"
                required
                autoFocus
                value={newId}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setNewId(val);
                  setNewName(`${val} - ${sourceDevice.equipmentModel || sourceDevice.model || 'IBS_BAKE'}`);
                }}
                placeholder={t('device.cloneModal.newIdPlaceholder')}
                className="w-full bg-slate-950 border border-cyan-500/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-md px-3 py-1.5 text-xs font-mono font-bold text-cyan-200 placeholder:text-slate-600 transition-colors uppercase"
              />
            </div>

            {/* 2. ĐỊA CHỈ IP MỚI & PORT (NEW IP & PORT) */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-1">
                  <span>{t('device.cloneModal.newIpLabel')}</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder={t('device.cloneModal.newIpPlaceholder')}
                  className="w-full bg-slate-950 border border-cyan-500/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-md px-3 py-1.5 text-xs font-mono font-bold text-slate-100 placeholder:text-slate-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  <span>{t('device.cloneModal.newPortLabel')}</span>
                </label>
                <input
                  type="number"
                  required
                  value={newPort}
                  onChange={(e) => setNewPort(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-200"
                />
              </div>
            </div>

            {/* 3. TÊN / MÔ TẢ (TÙY CHỌN) */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <span>{t('device.cloneModal.newNameLabel')}</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('device.cloneModal.newNamePlaceholder')}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-600 rounded-md px-2.5 py-1.5 text-xs text-slate-300 placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onSwitchToFullEdit}
              className="px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="Mở toàn bộ 18 cột để tinh chỉnh trước khi lưu"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('device.cloneModal.openFullModalBtn')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-sans cursor-pointer"
              >
                {t('device.modal.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-900/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('device.cloneModal.confirmBtn')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceCloneModal;

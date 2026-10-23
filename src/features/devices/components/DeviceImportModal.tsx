/**
 * Device Management Batch TSV / CSV Import Modal Component
 */

import React from 'react';
import {
  Upload,
  FileSpreadsheet,
  Check,
  X,
} from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { DeviceModel } from '@/core/types';

interface DeviceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importText: string;
  importPreview: DeviceModel[];
  importError: string;
  onTextChange: (text: string) => void;
  onLoadSample: () => void;
  onConfirm: () => void;
}

export const DeviceImportModal: React.FC<DeviceImportModalProps> = ({
  isOpen,
  onClose,
  importText,
  importPreview,
  importError,
  onTextChange,
  onLoadSample,
  onConfirm,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3">
      <div className="bg-[#0C1220] border border-slate-700 rounded-lg shadow-2xl max-w-2xl w-full p-4 space-y-3 font-sans text-xs animate-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                {t('device.import.title')}
              </h3>
              <p className="text-[10px] text-slate-400 font-normal">
                {t('device.import.pastePrompt')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick action bar */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 font-medium">
            {t('device.import.pastePrompt')}
          </span>
          <button
            type="button"
            onClick={onLoadSample}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-mono text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3 h-3 text-cyan-400" />
            <span>{t('device.import.sampleBtn')}</span>
          </button>
        </div>

        {/* Textarea */}
        <textarea
          rows={6}
          value={importText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="PLANT&#9;HOST_ADDRESS&#9;HOST_PORT&#9;DEVICE_ID&#9;SERVER_NO&#9;EQUIPMENT_ID&#9;GROUP_NAME&#9;EQUIPMENT_ORDER&#9;EQUIPMENT_MAIN&#9;DESCRIPTION&#9;ENABLE&#9;FIELD_01&#9;FIELD_02&#9;FIELD_03&#9;INTERLOCK_RECIPE&#9;EQUIPMENT_MODEL&#9;INTERLOCK_PARAM&#9;INTERLOCK_TRACE..."
          className="w-full p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-emerald-500 whitespace-pre"
        />

        {importError && (
          <div className="p-2 rounded bg-red-950/50 border border-red-500/50 text-red-300 text-[11px]">
            {importError}
          </div>
        )}

        {/* Preview Section */}
        {importPreview.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('device.import.previewTitle')} ({importPreview.length} {t('device.import.rowsParsed')}):
              </span>
            </div>
            <div className="max-h-36 overflow-y-auto border border-slate-800 rounded bg-slate-950/80 p-1">
              <table className="w-full text-left font-mono text-[10px]">
                <thead className="text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="p-1">PLANT</th>
                    <th className="p-1">ID</th>
                    <th className="p-1">HOST</th>
                    <th className="p-1">PORT</th>
                    <th className="p-1">GROUP</th>
                    <th className="p-1">ORDER</th>
                    <th className="p-1">MODEL</th>
                    <th className="p-1">RECIPE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {importPreview.map((d, i) => (
                    <tr key={i} className="text-slate-300">
                      <td className="p-1 text-amber-400">{d.plant || d.factory}</td>
                      <td className="p-1 font-bold text-blue-400">{d.id}</td>
                      <td className="p-1">{d.ipAddress}</td>
                      <td className="p-1">{d.port}</td>
                      <td className="p-1 text-cyan-300">{d.groupName || d.groupId}</td>
                      <td className="p-1">{d.equipmentOrder}</td>
                      <td className="p-1 text-emerald-400">{d.model}</td>
                      <td className="p-1 text-slate-400">{d.interlockRecipe || 'YES'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-sans cursor-pointer"
          >
            {t('device.modal.cancel')}
          </button>
          <button
            type="button"
            disabled={importPreview.length === 0}
            onClick={onConfirm}
            className="px-3.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 font-semibold text-xs shadow-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t('device.import.confirmImport')} ({importPreview.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceImportModal;

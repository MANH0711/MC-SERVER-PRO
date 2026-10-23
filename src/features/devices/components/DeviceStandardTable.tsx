/**
 * Device Management Standard Operational View Table Component
 * High-density operational monitoring summary
 */

import React from 'react';
import {
  Zap,
  RefreshCw,
  Edit2,
  Copy,
  Trash2,
} from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { DeviceModel, DeviceStatus } from '@/core/types';

interface DeviceStandardTableProps {
  devices: DeviceModel[];
  pingResult: { id: string; latency: number; ok: boolean } | null;
  onPing: (dev: DeviceModel) => void;
  onReconnect: (id: string) => void;
  onEdit: (dev: DeviceModel) => void;
  onClone: (dev: DeviceModel) => void;
  onDelete: (dev: DeviceModel) => void;
  getStatusBadge: (status: DeviceStatus) => string;
  formatNumber: (n: number) => string;
}

export const DeviceStandardTable: React.FC<DeviceStandardTableProps> = ({
  devices,
  pingResult,
  onPing,
  onReconnect,
  onEdit,
  onClone,
  onDelete,
  getStatusBadge,
  formatNumber,
}) => {
  const { t } = useTranslation();

  return (
    <table className="w-full text-left font-mono text-xs">
      <thead className="sticky top-0 bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800/80 z-10">
        <tr>
          <th className="py-2 px-3 text-left">{t('device.columns.id')}</th>
          <th className="py-2 px-2.5 text-center">{t('device.columns.group')}</th>
          <th className="py-2 px-3 text-left">{t('device.columns.name')}</th>
          <th className="py-2 px-3 text-left">{t('device.columns.lineStation')}</th>
          <th className="py-2 px-3 text-left">{t('device.columns.ipPort')}</th>
          <th className="py-2 px-2.5 text-center">BOUNDARY</th>
          <th className="py-2 px-2.5 text-center">{t('device.columns.status')}</th>
          <th className="py-2 px-3 text-right">{t('device.columns.stats')}</th>
          <th className="py-2 px-3 text-center">{t('device.columns.actions')}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/50">
        {devices.map((dev) => {
          const groupName = dev.groupName || dev.groupId;

          return (
            <tr key={dev.id} className="hover:bg-slate-800/40 transition-colors text-[11px]">
              <td className="py-2 px-3 text-left font-bold text-blue-400">{dev.id}</td>
              <td className="py-2 px-2.5 text-center">
                {groupName ? (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/30 font-sans inline-block whitespace-nowrap"
                    title={`Nhóm thiết bị: ${groupName}`}
                  >
                    {groupName}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono italic">--</span>
                )}
              </td>
              <td className="py-2 px-3 text-left text-slate-200">
                <span className="font-semibold block truncate max-w-[200px] font-sans">{dev.name}</span>
                <span className="text-[10px] text-slate-500 font-sans">{dev.model}</span>
              </td>
              <td className="py-2 px-3 text-left text-slate-300 font-sans">
                <span className="block text-[11px]">{dev.line}</span>
                <span className="text-[10px] text-slate-500 font-mono">{dev.station}</span>
              </td>
              <td className="py-2 px-3 text-left text-slate-300 font-mono">
                {dev.ipAddress}:{dev.port}
              </td>
              <td className="py-2 px-2.5 text-center">
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    dev.frameBoundary === '20014_EXTENDED'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {dev.frameBoundary === '20014_EXTENDED' ? '20.014 (+LF)' : '20.013 (ETX)'}
                </span>
              </td>
              <td className="py-2 px-2.5 text-center">
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getStatusBadge(
                    dev.status
                  )}`}
                >
                  {t(`device.status.${dev.status}`)}
                </span>
              </td>
              <td className="py-2 px-3 text-right font-mono">
                <span className="text-slate-200 block">{formatNumber(dev.totalRequests)}</span>
                <span
                  className={`text-[10px] block ${dev.errorCount > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}`}
                >
                  {dev.errorCount} err
                </span>
              </td>
              <td className="py-2 px-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onPing(dev)}
                    className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors relative cursor-pointer"
                    title={t('device.actions.ping')}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {pingResult?.id === dev.id && (
                      <span className="absolute -top-6 -left-3 bg-cyan-950 text-cyan-200 text-[9px] px-1 py-0.2 rounded shadow z-10 whitespace-nowrap border border-cyan-700">
                        {pingResult.latency}ms
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => onReconnect(dev.id)}
                    className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title={t('device.actions.reconnect')}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEdit(dev)}
                    className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title={t('device.actions.edit')}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onClone(dev)}
                    className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/60 transition-colors cursor-pointer"
                    title={t('device.actions.clone')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(dev)}
                    className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title={t('device.actions.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default DeviceStandardTable;

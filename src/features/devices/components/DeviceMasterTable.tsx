/**
 * Device Management 18-Column Master Data Table Component
 * Complete ITM / MES Master Table Schema
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

interface DeviceMasterTableProps {
  devices: DeviceModel[];
  pingResult: { id: string; latency: number; ok: boolean } | null;
  onPing: (dev: DeviceModel) => void;
  onReconnect: (id: string) => void;
  onEdit: (dev: DeviceModel) => void;
  onClone: (dev: DeviceModel) => void;
  onDelete: (dev: DeviceModel) => void;
  getStatusBadge: (status: DeviceStatus) => string;
}

export const DeviceMasterTable: React.FC<DeviceMasterTableProps> = ({
  devices,
  pingResult,
  onPing,
  onReconnect,
  onEdit,
  onClone,
  onDelete,
  getStatusBadge,
}) => {
  const { t } = useTranslation();

  return (
    <table className="w-full text-left font-mono text-[11px] whitespace-nowrap">
      <thead className="sticky top-0 bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800/80 z-10">
        <tr>
          <th className="py-2 px-2.5 text-left text-amber-400">PLANT</th>
          <th className="py-2 px-2.5 text-left" title="HOST_ADDRESS">HOST_ADDR</th>
          <th className="py-2 px-2 text-center" title="HOST_PORT">PORT</th>
          <th className="py-2 px-2 text-center text-cyan-400" title="DEVICE_ID">DEV_ID</th>
          <th className="py-2 px-2 text-center text-purple-400" title="SERVER_NO">SRV_NO</th>
          <th className="py-2 px-2.5 text-left text-blue-400 font-bold" title="EQUIPMENT_ID">EQUIP_ID</th>
          <th className="py-2 px-2 text-center text-cyan-300" title="GROUP_NAME">GROUP</th>
          <th className="py-2 px-2 text-center" title="EQUIPMENT_ORDER">ORDER</th>
          <th className="py-2 px-2 text-center" title="EQUIPMENT_MAIN">MAIN</th>
          <th className="py-2 px-2.5 text-left" title="DESCRIPTION">DESCRIPTION</th>
          <th className="py-2 px-2 text-center">ENABLE</th>
          <th className="py-2 px-1.5 text-center" title="FIELD_01">F1</th>
          <th className="py-2 px-1.5 text-center" title="FIELD_02">F2</th>
          <th className="py-2 px-2 text-center text-emerald-300" title="FIELD_03">FIELD_03</th>
          <th className="py-2 px-2 text-center text-blue-300" title="INTERLOCK_RECIPE">RECIPE</th>
          <th className="py-2 px-2.5 text-left text-emerald-400" title="EQUIPMENT_MODEL">MODEL</th>
          <th className="py-2 px-2 text-center" title="INTERLOCK_PARAM">PARAM</th>
          <th className="py-2 px-2 text-center" title="INTERLOCK_TRACE">TRACE</th>
          <th className="py-2 px-2.5 text-center">{t('device.columns.status')}</th>
          <th className="py-2 px-2.5 text-center">{t('device.columns.actions')}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/50">
        {devices.map((dev) => {
          const plantVal = dev.plant || dev.factory || 'ITMVPSG';
          const hostAddr = dev.hostAddress || dev.ipAddress;
          const hostPort = dev.hostPort || dev.port;
          const devId = dev.deviceId !== undefined ? dev.deviceId : '0';
          const srvNo = dev.serverNo !== undefined ? dev.serverNo : '15';
          const equipId = dev.equipmentId || dev.id;
          const groupVal = dev.groupName || dev.groupId || 'NET';
          const orderVal = dev.equipmentOrder !== undefined ? dev.equipmentOrder : 20110;
          const mainVal = dev.equipmentMain || '--';
          const descVal = dev.description || dev.name;
          const enableVal = dev.enable || (dev.enabled ? 'YES' : 'NO');
          const f01 = dev.field01 || '--';
          const f02 = dev.field02 || '--';
          const f03 = dev.field03 || 'ITMVIET';
          const rcpLock = dev.interlockRecipe || 'YES';
          const eqModel = dev.equipmentModel || dev.model || 'IBS_BAKE';
          const pLock = dev.interlockParam || '--';
          const tLock = dev.interlockTrace || '--';

          return (
            <tr key={dev.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="py-2 px-2.5 text-left font-semibold text-amber-400">{plantVal}</td>
              <td className="py-2 px-2.5 text-left text-slate-200">{hostAddr}</td>
              <td className="py-2 px-2 text-center text-slate-300">{hostPort}</td>
              <td className="py-2 px-2 text-center text-cyan-400 font-bold">{devId}</td>
              <td className="py-2 px-2 text-center text-purple-400 font-bold">{srvNo}</td>
              <td className="py-2 px-2.5 text-left font-bold text-blue-400">{equipId}</td>
              <td className="py-2 px-2 text-center">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-sans inline-block">
                  {groupVal}
                </span>
              </td>
              <td className="py-2 px-2 text-center text-slate-300">{orderVal}</td>
              <td className="py-2 px-2 text-center text-slate-500">{mainVal}</td>
              <td className="py-2 px-2.5 text-left text-slate-200 font-sans truncate max-w-[160px]" title={descVal}>
                {descVal}
              </td>
              <td className="py-2 px-2 text-center">
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    enableVal === 'YES'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {enableVal}
                </span>
              </td>
              <td className="py-2 px-1.5 text-center text-slate-500">{f01}</td>
              <td className="py-2 px-1.5 text-center text-slate-500">{f02}</td>
              <td className="py-2 px-2 text-center text-cyan-300 font-semibold">{f03}</td>
              <td className="py-2 px-2 text-center">
                <span className="px-1.5 py-0.2 rounded bg-blue-900/40 text-blue-300 border border-blue-800/60 text-[9px]">
                  {rcpLock}
                </span>
              </td>
              <td className="py-2 px-2.5 text-left text-emerald-400 font-medium">{eqModel}</td>
              <td className="py-2 px-2 text-center text-slate-500">{pLock}</td>
              <td className="py-2 px-2 text-center text-slate-500">{tLock}</td>
              <td className="py-2 px-2.5 text-center">
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getStatusBadge(
                    dev.status
                  )}`}
                >
                  {t(`device.status.${dev.status}`)}
                </span>
              </td>
              <td className="py-2 px-2.5 text-center">
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

export default DeviceMasterTable;

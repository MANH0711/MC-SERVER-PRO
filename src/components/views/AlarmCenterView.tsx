/**
 * MC Server Alarm Center View
 * Space-optimized incident resolution, quick resolution templates, and dense alarm table.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  Download,
  Filter,
  Check,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import { AlarmItem, AlarmSeverity } from '../../types';

export const AlarmCenterView: React.FC = () => {
  const { t } = useTranslation();
  const { alarms, acknowledgeAlarm } = useApp();

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');

  const quickTemplates = [
    'Component jam cleared & sensor calibrated',
    'Feeder reel replenished & barcode scanned',
    'Pneumatic exhaust pressure restored to 3.2 bar',
    'Emergency interlock reset after routine inspection',
  ];

  const handleOpenAckModal = (alarm: AlarmItem) => {
    setSelectedAlarm(alarm);
    setResolutionNote(alarm.resolutionNote || '');
  };

  const handleConfirmAck = () => {
    if (selectedAlarm) {
      acknowledgeAlarm(selectedAlarm.id, resolutionNote || 'Acknowledged by technician');
      setSelectedAlarm(null);
    }
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'EquipmentID', 'AlarmCode', 'Severity', 'Description', 'Acknowledged', 'HandledBy', 'Created'];
    const rows = alarms.map((a) => [
      a.id,
      a.equipmentId,
      a.alarmCode,
      a.severity,
      `"${a.description.replace(/"/g, '""')}"`,
      a.acknowledged ? 'YES' : 'NO',
      a.acknowledgedBy || '',
      a.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MC_Server_Alarms_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (severity: AlarmSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'ERROR':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'WARNING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'INFO':
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
  };

  const filteredAlarms = alarms.filter((a) => {
    const matchSev = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'UNACK' && !a.acknowledged) ||
      (statusFilter === 'ACK' && a.acknowledged);
    return matchSev && matchStatus;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 space-y-2.5 bg-[#080C15] text-slate-100">
      {/* Top Header Bar */}
      <div className="h-11 px-3 rounded bg-slate-900/90 border border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            {t('alarm.title')}
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
            {alarms.filter((a) => !a.acknowledged).length} ACTIVE
          </span>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <Download className="w-3 h-3 text-blue-400" />
          <span>CSV</span>
        </button>
      </div>

      {/* Filter Bar (Compact Height: 36px) */}
      <div className="px-3 py-1.5 rounded bg-slate-900/80 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-slate-500 text-[11px] mr-1">{t('alarm.severityLabel')}</span>
          {(['ALL', 'CRITICAL', 'ERROR', 'WARNING', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors ${
                severityFilter === sev
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-500 text-[11px] mr-1">{t('alarm.statusLabel')}</span>
          {(['ALL', 'UNACK', 'ACK'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'ALL' ? t('alarm.statusAll') : st === 'UNACK' ? t('alarm.statusPending') : t('alarm.statusResolved')}
            </button>
          ))}
        </div>
      </div>

      {/* Alarms Table (High Space Density) */}
      <div className="flex-1 rounded bg-slate-900/90 border border-slate-800/80 overflow-hidden flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800/80 z-10">
              <tr>
                <th className="py-2 px-3">{t('alarm.columns.time')}</th>
                <th className="py-2 px-2.5">{t('alarm.columns.severity')}</th>
                <th className="py-2 px-2.5">{t('alarm.columns.equipId')}</th>
                <th className="py-2 px-3">{t('alarm.columns.alarmCode')}</th>
                <th className="py-2 px-3">{t('alarm.columns.description')}</th>
                <th className="py-2 px-3">{t('alarm.columns.status')}</th>
                <th className="py-2 px-3 text-center">{t('alarm.columns.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredAlarms.map((alarm) => (
                <tr key={alarm.id} className="hover:bg-slate-800/40 transition-colors text-[11px]">
                  <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">
                    {alarm.createdAt.replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="py-2 px-2.5">
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold ${getSeverityBadge(
                        alarm.severity
                      )}`}
                    >
                      {alarm.severity}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 font-bold text-slate-200">{alarm.equipmentId}</td>
                  <td className="py-2 px-3 font-mono font-bold text-red-400">{alarm.alarmCode}</td>
                  <td className="py-2 px-3 text-slate-300 font-sans max-w-sm truncate" title={alarm.description}>
                    {alarm.description}
                  </td>
                  <td className="py-2 px-3">
                    {alarm.acknowledged ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t('alarm.statusResolved')} ({alarm.acknowledgedBy})</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-bold uppercase font-mono animate-pulse">
                        {t('alarm.unacknowledged')}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {!alarm.acknowledged ? (
                      <button
                        onClick={() => handleOpenAckModal(alarm)}
                        className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600 hover:text-white transition-colors text-[10px] font-sans font-semibold"
                      >
                        {t('dashboard.recentAlarms.acknowledge')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenAckModal(alarm)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 font-sans underline"
                      >
                        {t('common.view', 'View Note')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Acknowledge Resolution Modal */}
      {selectedAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-xs">
          <div className="bg-[#0D1424] border border-slate-700 rounded-lg shadow-2xl max-w-md w-full p-4 space-y-3 text-xs animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('alarm.modal.title')}</span>
              </h3>
              <button
                onClick={() => setSelectedAlarm(null)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('alarm.nodeLabel')}</span>
                <span className="text-slate-200 font-bold">{selectedAlarm.equipmentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('alarm.alarmLabel')}</span>
                <span className="text-red-400 font-bold">{selectedAlarm.alarmCode}</span>
              </div>
              <p className="text-slate-300 font-sans text-xs border-t border-slate-900 pt-1">
                {selectedAlarm.description}
              </p>
            </div>

            {/* Quick Resolution Templates */}
            {!selectedAlarm.acknowledged && (
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  {t('alarm.quickTemplates')}
                </label>
                <div className="space-y-1">
                  {quickTemplates.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setResolutionNote(tmpl)}
                      className="w-full text-left px-2 py-1 rounded bg-slate-950 border border-slate-800/80 hover:border-blue-500/60 text-slate-300 text-[11px] font-sans truncate hover:text-white transition-colors block"
                    >
                      • {tmpl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-[10px] uppercase font-semibold mb-1">
                {t('alarm.modal.noteLabel')} *
              </label>
              <textarea
                rows={2}
                value={resolutionNote}
                disabled={selectedAlarm.acknowledged}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder={t('alarm.modal.notePlaceholder')}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-100 font-sans text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedAlarm(null)}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-xs"
              >
                {t('alarm.modal.cancel')}
              </button>
              {!selectedAlarm.acknowledged && (
                <button
                  type="button"
                  onClick={handleConfirmAck}
                  className="px-3.5 py-1 rounded bg-blue-600 font-semibold text-white hover:bg-blue-500 transition-colors shadow-xs text-xs"
                >
                  {t('alarm.modal.confirm')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

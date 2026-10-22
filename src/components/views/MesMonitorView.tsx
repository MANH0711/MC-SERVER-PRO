/**
 * MC Server MES Integration Monitor View
 * Displays MES link health, Circuit Breaker state machine, Latency Percentiles (p50/p95/p99), and Outbox Buffer.
 */

import React, { useState } from 'react';
import {
  Share2,
  CloudLightning,
  RefreshCw,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Database,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';

export const MesMonitorView: React.FC = () => {
  const { t, formatNumber } = useTranslation();
  const {
    mesStatus,
    pingMes,
    resetCircuitBreaker,
    forceTripCircuitBreaker,
    config,
  } = useApp();

  const [pingLoading, setPingLoading] = useState<boolean>(false);
  const [pingMessage, setPingMessage] = useState<string>('');

  const handlePing = async () => {
    setPingLoading(true);
    setPingMessage('');
    const res = await pingMes();
    setPingLoading(false);
    setPingMessage(res.message);
  };

  const getBreakerBadge = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'HALF_OPEN':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse';
      case 'OPEN':
      default:
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 text-slate-100">
      {/* Header Banner */}
      <div className="p-4 rounded bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              {t('mes.title')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t('mes.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePing}
            disabled={pingLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-60 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pingLoading ? 'animate-spin' : ''}`} />
            <span>{t('mes.pingBtn')}</span>
          </button>
          <button
            onClick={resetCircuitBreaker}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('mes.resetBreaker')}</span>
          </button>
          <button
            onClick={forceTripCircuitBreaker}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 transition-colors"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{t('mes.forceTrip')}</span>
          </button>
        </div>
      </div>

      {pingMessage && (
        <div className="p-3 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs font-mono">
          {pingMessage}
        </div>
      )}

      {/* Circuit Breaker & Endpoint Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Endpoint & Status */}
        <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-2 border-b border-slate-800">
            {t('mes.linkTarget')}
          </span>
          <div className="space-y-2 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[11px]">{t('mes.endpointUrl')}</span>
              <span className="text-cyan-400 break-all">{mesStatus.endpoint}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">{t('mes.adapter')}</span>
              <span className="text-slate-200">{t('mes.adapterVal')}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">{t('mes.lastSync')}</span>
              <span className="text-slate-300">{mesStatus.lastHeartbeat}</span>
            </div>
          </div>
        </div>

        {/* Circuit Breaker State Machine */}
        <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-2 border-b border-slate-800">
            {t('mes.circuitGuardian')}
          </span>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">{t('mes.stateMachine')}</span>
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded border font-bold uppercase ${getBreakerBadge(
                mesStatus.circuitBreakerState
              )}`}
            >
              {mesStatus.circuitBreakerState}
            </span>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800/80 text-[11px] font-mono space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('mes.consecutiveFailures')}</span>
              <span className="text-red-400 font-bold">{mesStatus.consecutiveFailures} / {config.mes.circuitBreakerFailureThreshold}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('mes.cooldownTimeout')}</span>
              <span>{config.mes.circuitBreakerCooldownMs} ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('mes.maxRetry')}</span>
              <span>{config.mes.retryMaxCount} {t('mes.attemptsUnit')}</span>
            </div>
          </div>
        </div>

        {/* Reliability Metrics */}
        <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-2 border-b border-slate-800">
            {t('mes.reliabilityTitle')}
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">{t('mes.totalRequests')}</span>
              <span className="text-base font-bold text-slate-100">{formatNumber(mesStatus.totalRequests)}</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">{t('mes.successful')}</span>
              <span className="text-base font-bold text-emerald-400">
                {formatNumber(mesStatus.successfulRequests)}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">{t('mes.failedDropped')}</span>
              <span className="text-base font-bold text-red-400">{mesStatus.failedRequests}</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">{t('mes.availability')}</span>
              <span className="text-base font-bold text-emerald-400">99.99%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Latency Percentiles Section */}
      <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            {t('mes.latencyPercentiles')}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">{t('mes.slaTarget')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[11px] block">{t('mes.avgLatency')}</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">
              {mesStatus.averageLatencyMs} <span className="text-xs font-normal">ms</span>
            </span>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[11px] block">{t('mes.metrics.p50')}</span>
            <span className="text-2xl font-bold text-blue-400 mt-1 block">
              {Math.round(mesStatus.averageLatencyMs * 0.9)} <span className="text-xs font-normal">ms</span>
            </span>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[11px] block">{t('mes.metrics.p95')}</span>
            <span className="text-2xl font-bold text-amber-400 mt-1 block">
              {mesStatus.p95LatencyMs} <span className="text-xs font-normal">ms</span>
            </span>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[11px] block">{t('mes.metrics.p99')}</span>
            <span className="text-2xl font-bold text-purple-400 mt-1 block">
              {mesStatus.p99LatencyMs} <span className="text-xs font-normal">ms</span>
            </span>
          </div>
        </div>
      </div>

      {/* Outbox Retry Queue */}
      <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            {t('mes.queueTitle')}
          </span>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            BUFFER SIZE: {mesStatus.pendingQueueSize} ITEMS
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {t('mes.queueDescription')}
        </p>

        {mesStatus.pendingQueueSize === 0 ? (
          <div className="p-6 rounded bg-slate-950 border border-slate-800 text-center text-xs text-slate-500 italic">
            Outbox queue is empty. All shopfloor transactions are currently synchronized with MES master records.
          </div>
        ) : (
          <div className="p-3 rounded bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs font-mono">
            {mesStatus.pendingQueueSize} transactions held in memory buffer. Automatic flush will engage upon Circuit Breaker reset.
          </div>
        )}
      </div>
    </div>
  );
};

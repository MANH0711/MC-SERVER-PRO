/**
 * MC Server Communication Monitor & Hex Dump Sniffer
 * High-density industrial packet capture, offset hex inspector, frame boundary analyzer, and decoded payload tree.
 */

import React, { useState } from 'react';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  Trash2,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import { CommunicationTransaction } from '../../types';

export const CommunicationMonitorView: React.FC = () => {
  const { t, formatNumber } = useTranslation();
  const { transactions, devices, clearTransactions } = useApp();

  const [selectedTx, setSelectedTx] = useState<CommunicationTransaction | null>(null);
  const [filterEquip, setFilterEquip] = useState<string>('ALL');
  const [filterCode, setFilterCode] = useState<string>('ALL');
  const [searchPayload, setSearchPayload] = useState<string>('');
  const [copiedHex, setCopiedHex] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const activeTx = selectedTx || transactions[0] || null;

  const handleCopy = (text: string, isHex: boolean) => {
    navigator.clipboard.writeText(text);
    if (isHex) {
      setCopiedHex(true);
      setTimeout(() => setCopiedHex(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const handleExportPackets = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `MC_Server_Packets_${new Date().toISOString().replace(/:/g, '-')}.json`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

  // Format Hex with standard offset rows (16 bytes per row)
  const formatOffsetHex = (rawHex: string) => {
    const hexBytes = rawHex.split(' ').filter(Boolean);
    const rows: { offset: string; hex: string; ascii: string }[] = [];

    for (let i = 0; i < hexBytes.length; i += 16) {
      const slice = hexBytes.slice(i, i + 16);
      const offset = i.toString(16).toUpperCase().padStart(4, '0');
      const hex = slice.join(' ').padEnd(48, ' ');
      const ascii = slice
        .map((h) => {
          const code = parseInt(h, 16);
          return code >= 32 && code <= 126 ? String.fromCharCode(code) : '.';
        })
        .join('');
      rows.push({ offset, hex, ascii });
    }
    return rows;
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchEquip = filterEquip === 'ALL' || tx.equipmentId === filterEquip;
    const matchCode = filterCode === 'ALL' || tx.messageCode === filterCode;
    const matchSearch =
      !searchPayload ||
      tx.rawAscii.toLowerCase().includes(searchPayload.toLowerCase()) ||
      tx.correlationId.toLowerCase().includes(searchPayload.toLowerCase()) ||
      JSON.stringify(tx.payloadJson).toLowerCase().includes(searchPayload.toLowerCase());
    return matchEquip && matchCode && matchSearch;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-2.5 sm:p-3 space-y-2 bg-[#070B14] text-slate-100 font-sans">
      {/* Header & Controls Bar - Compact 44px */}
      <div className="px-3 py-1.5 rounded-lg bg-[#0C1220]/95 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 leading-none">
              {t('communication.title')}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 leading-none">
              Captured: <span className="text-cyan-400 font-bold">{formatNumber(transactions.length)}</span> frames
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Equipment Filter */}
          <select
            value={filterEquip}
            onChange={(e) => setFilterEquip(e.target.value)}
            className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">{t('communication.allStations')}</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.id})
              </option>
            ))}
          </select>

          {/* Message Code Filter */}
          <select
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
            className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">{t('communication.allMsgCodes')}</option>
            {['M001', 'M002', 'S000', 'S001', 'S002', 'S003', 'S005', 'S006', 'S030', 'S031', 'S040', 'S041', 'E001'].map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
          </select>

          {/* Search Payload */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchPayload}
              onChange={(e) => setSearchPayload(e.target.value)}
              placeholder={t('communication.searchPayload')}
              className="pl-6 pr-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono w-40 sm:w-48"
            />
            {searchPayload && (
              <button
                onClick={() => setSearchPayload('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleExportPackets}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors text-[11px]"
            title={t('communication.exportCapture')}
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>{t('communication.exportBtn')}</span>
          </button>
          <button
            onClick={clearTransactions}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-red-400 transition-colors text-[11px]"
            title={t('communication.clearBuffer')}
          >
            <Trash2 className="w-3 h-3" />
            <span>{t('communication.clearBtn')}</span>
          </button>
        </div>
      </div>

      {/* Split Dual-Pane View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 min-h-0 overflow-hidden">
        {/* Left Pane: Packet Table */}
        <div className="lg:col-span-6 rounded-lg bg-[#0C1220]/95 border border-slate-800/90 flex flex-col min-h-0 overflow-hidden shadow-xs">
          <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span className="font-semibold uppercase tracking-wider text-slate-300 text-[11px]">{t('communication.liveStreamHeader')}</span>
            <span className="font-mono text-[10px] text-slate-500">
              {t('communication.showingCount')} {filteredTransactions.length} {t('communication.ofTotal')} {transactions.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="sticky top-0 bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800 z-10">
                <tr>
                  <th className="py-1.5 px-2">{t('communication.columns.time')}</th>
                  <th className="py-1.5 px-1 text-center">{t('communication.columns.direction')}</th>
                  <th className="py-1.5 px-2">{t('communication.columns.equipId')}</th>
                  <th className="py-1.5 px-1.5">{t('communication.columns.msgCode')}</th>
                  <th className="py-1.5 px-1 text-center font-bold text-slate-200">RESULT</th>
                  <th className="py-1.5 px-2">{t('communication.columns.txId')}</th>
                  <th className="py-1.5 px-1.5 text-right">{t('communication.columns.length')}</th>
                  <th className="py-1.5 px-2 text-right">{t('communication.columns.checksum')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredTransactions.map((tx) => {
                  const isSelected = activeTx?.id === tx.id;
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-600/20 text-white border-l-2 border-blue-500'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="py-1.5 px-2 text-slate-400 text-[10px] tabular-nums">
                        {tx.timestamp.split('T')[1]?.slice(0, 11) || tx.timestamp}
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        {tx.direction === 'INBOUND' ? (
                          <span className="text-emerald-400 font-bold inline-flex items-center">
                            <ArrowDownLeft className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-blue-400 font-bold inline-flex items-center">
                            <ArrowUpRight className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 font-semibold text-slate-200 truncate max-w-[100px]">
                        {tx.equipmentId}
                      </td>
                      <td className="py-1.5 px-1.5 font-bold text-cyan-400">{tx.messageCode}</td>
                      <td className="py-1.5 px-1 text-center">
                        {tx.status === 'SUCCESS' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/60 shadow-[0_0_6px_rgba(16,185,129,0.3)]">
                            OK
                          </span>
                        ) : tx.status === 'TIMEOUT' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/60 shadow-[0_0_6px_rgba(245,158,11,0.3)]">
                            TO
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/25 text-rose-400 border border-rose-500/70 shadow-[0_0_6px_rgba(244,63,94,0.35)]">
                            NG
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-slate-400 truncate max-w-[90px] text-[10px]">
                        {tx.correlationId}
                      </td>
                      <td className="py-1.5 px-1.5 text-right text-slate-400">{tx.payloadLength}</td>
                      <td className="py-1.5 px-2 text-right">
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                            tx.checksumStatus === 'VALID'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-red-400 bg-red-500/10'
                          }`}
                        >
                          {tx.checksum}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Pane: Deep Hex & Protocol Breakdown */}
        <div className="lg:col-span-6 rounded-lg bg-[#0C1220]/95 border border-slate-800/90 flex flex-col min-h-0 overflow-hidden shadow-xs">
          {activeTx ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Active Frame Header */}
              <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-blue-400">{activeTx.messageCode}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-slate-200 font-mono font-semibold">{activeTx.equipmentId}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-[10px] text-slate-400 font-mono">{activeTx.correlationId}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Frame Size: {activeTx.rawHex.split(' ').length} bytes · Latency: {activeTx.responseTimeMs} ms
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(activeTx.rawHex, true)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 hover:text-white transition-colors"
                  >
                    {copiedHex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHex ? 'Copied' : 'Hex'}</span>
                  </button>
                  <button
                    onClick={() => handleCopy(JSON.stringify(activeTx.payloadJson, null, 2), false)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 hover:text-white transition-colors"
                  >
                    {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedJson ? 'Copied' : 'JSON'}</span>
                  </button>
                </div>
              </div>

              {/* Inspector Content */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 font-mono text-xs">
                {/* Frame Structural Breakdown */}
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {t('communication.inspector.frameBreakdown')}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-[10px]">
                    <div className="p-1 rounded bg-slate-900 border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px]">{t('communication.stxDelimiter')}</span>
                      <span className="text-emerald-400 font-bold">0x02 [STX]</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px]">{t('communication.lengthHeader')}</span>
                      <span className="text-cyan-400 font-bold">{activeTx.payloadLength} bytes</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px]">{t('communication.checksumLrc')}</span>
                      <span className="text-purple-400 font-bold">
                        {activeTx.checksum} ({activeTx.checksumStatus})
                      </span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px]">{t('communication.etxBoundary')}</span>
                      <span className="text-emerald-400 font-bold">0x03 [ETX]</span>
                    </div>
                  </div>
                </div>

                {/* Hex Dump Offset Table */}
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {t('communication.inspector.hexDump')}
                  </div>
                  <div className="overflow-x-auto text-[10px] leading-tight text-slate-300 bg-slate-900/60 p-2 rounded">
                    {formatOffsetHex(activeTx.rawHex).map((row, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="text-slate-500 select-none">{row.offset}</span>
                        <span className="text-cyan-400 whitespace-pre">{row.hex}</span>
                        <span className="text-slate-400 whitespace-pre border-l border-slate-800 pl-2">
                          {row.ascii}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decoded Payload JSON */}
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {t('communication.inspector.decodedPayload')}
                  </div>
                  <pre className="p-2 rounded bg-slate-900/80 border border-slate-800/80 text-emerald-400 overflow-x-auto text-[10px] leading-relaxed max-h-48">
                    {JSON.stringify(activeTx.payloadJson, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500 italic p-6">
              {t('communication.inspector.selectPrompt')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

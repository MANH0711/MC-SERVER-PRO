import React, { useMemo } from 'react';
import {
  Copy,
  Check,
  Maximize2,
  AlertTriangle,
} from 'lucide-react';
import { CommunicationTransaction } from '@/core/types';
import { cleanPayloadForDisplay } from '@/core/utils/payloadUtils';

interface TransactionInspectorProps {
  activeTx: CommunicationTransaction | null;
  onCopy: (text: string, isHex: boolean) => void;
  copiedHex: boolean;
  copiedJson: boolean;
  onOpenModal: (tx: CommunicationTransaction) => void;
  formatOffsetHex: (rawHex: string) => { offset: string; hex: string; ascii: string }[];
  t: (key: string) => string;
}

export const TransactionInspector: React.FC<TransactionInspectorProps> = ({
  activeTx,
  onCopy,
  copiedHex,
  copiedJson,
  onOpenModal,
  formatOffsetHex,
  t,
}) => {
  const displayPayload = useMemo(() => {
    return activeTx?.payloadJson ? cleanPayloadForDisplay(activeTx.payloadJson) : null;
  }, [activeTx?.payloadJson]);

  return (
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
                {activeTx.equipmentModel && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-[10px] text-amber-300 font-mono px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 font-medium">
                      {activeTx.equipmentModel}
                    </span>
                  </>
                )}
                <span className="text-slate-600">·</span>
                <span className="text-[10px] text-slate-400 font-mono">{activeTx.correlationId}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Frame Size: {activeTx.rawHex.split(' ').length} bytes · Latency: {activeTx.responseTimeMs} ms
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onCopy(activeTx.rawHex, true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copiedHex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHex ? 'Copied' : 'Hex'}</span>
              </button>
              <button
                onClick={() => onCopy(JSON.stringify(displayPayload, null, 2), false)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedJson ? 'Copied' : 'JSON'}</span>
              </button>
              <button
                onClick={() => onOpenModal(activeTx)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/60 text-[10px] text-cyan-300 hover:text-white hover:bg-cyan-900 transition-colors shadow-xs ml-0.5 cursor-pointer"
                title="Mở Modal xem chi tiết toàn diện (Interlock, JSON, Hex offset)"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Mở Modal</span>
              </button>
            </div>
          </div>

          {/* Inspector Content */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 font-mono text-xs">
            {/* Error Notification Alert */}
            {(activeTx.status === 'ERROR' || activeTx.errorDetail) && (
              <div className="p-2 rounded bg-rose-950/70 border border-rose-500/50 flex items-start gap-2 text-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 text-[11px] font-mono leading-tight">
                  <span className="font-bold text-rose-300 mr-1.5 uppercase tracking-wide">Cảnh báo lỗi:</span>
                  <span className="text-slate-200 font-medium break-words select-text">
                    {activeTx.errorDetail || (displayPayload && (displayPayload.error || displayPayload.errorMessage)) || 'Lệnh thực thi không thành công'}
                  </span>
                </div>
              </div>
            )}

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
              <pre className="p-2 rounded bg-slate-900/80 border border-slate-800/80 text-emerald-400 overflow-x-auto text-[10px] leading-relaxed max-h-48 cursor-text select-text selection:bg-cyan-500/30 selection:text-white">
                {JSON.stringify(displayPayload, null, 2)}
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
  );
};

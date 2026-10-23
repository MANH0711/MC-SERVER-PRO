import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { CommunicationTransaction } from '@/core/types';

interface TransactionTableProps {
  transactions: CommunicationTransaction[];
  filteredTransactions: CommunicationTransaction[];
  activeTx: CommunicationTransaction | null;
  onSelectTx: (tx: CommunicationTransaction) => void;
  onOpenModalTx: (tx: CommunicationTransaction) => void;
  t: (key: string) => string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  filteredTransactions,
  activeTx,
  onSelectTx,
  onOpenModalTx,
  t,
}) => {
  return (
    <div className="lg:col-span-6 rounded-lg bg-[#0C1220]/95 border border-slate-800/90 flex flex-col min-h-0 overflow-hidden shadow-xs">
      <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <span className="font-semibold uppercase tracking-wider text-slate-300 text-[11px]">
          {t('communication.liveStreamHeader')}
        </span>
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
                  onClick={() => onSelectTx(tx)}
                  onDoubleClick={() => onOpenModalTx(tx)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-600/20 text-white border-l-2 border-blue-500'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                  title="Nhấp để xem khung bên phải · Nhấp đúp để mở Modal chi tiết toàn diện"
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
  );
};

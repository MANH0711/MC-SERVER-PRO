/**
 * MC Server Industrial Enterprise Edition
 * Communication Monitor Form (File Cha Điều Phối)
 * 
 * Quản lý & Giám sát truyền thông dữ liệu SECS-I / TCP Socket công nghiệp:
 * - MonitorToolbar: Bộ lọc thiết bị, mã lệnh, tìm kiếm & công cụ xuất dữ liệu
 * - TransactionTable: Bảng luồng giao dịch thời gian thực
 * - TransactionInspector: Panel phân tích chi tiết Hex/ASCII/JSON khung truyền
 * - DieAttachSimulatorModal: Form giả lập & thử nghiệm liên khóa Die Attach (S050/S051)
 * - TransactionDetailModal: Modal soi chi tiết toàn diện giao dịch
 */

import React, { useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import { CommunicationTransaction } from '../../types';

// Các sub-components thuộc form Communication Monitor
import { MonitorToolbar } from './components/MonitorToolbar';
import { TransactionTable } from './components/TransactionTable';
import { TransactionInspector } from './components/TransactionInspector';
import { DieAttachSimulatorModal } from './components/DieAttachSimulatorModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';

export const CommunicationMonitorView: React.FC = () => {
  const { t, formatNumber } = useTranslation();
  const { transactions, devices, clearTransactions } = useApp();

  const [selectedTx, setSelectedTx] = useState<CommunicationTransaction | null>(null);
  const [modalTx, setModalTx] = useState<CommunicationTransaction | null>(null);
  const [filterEquip, setFilterEquip] = useState<string>('ALL');
  const [filterCode, setFilterCode] = useState<string>('ALL');
  const [searchPayload, setSearchPayload] = useState<string>('');
  const [copiedHex, setCopiedHex] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [showDieAttachModal, setShowDieAttachModal] = useState<boolean>(false);

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
      {/* ─── 1. Thanh Công Cụ & Bộ Lọc (MonitorToolbar) ─── */}
      <MonitorToolbar
        totalFrames={transactions.length}
        devices={devices}
        filterEquip={filterEquip}
        onFilterEquipChange={setFilterEquip}
        filterCode={filterCode}
        onFilterCodeChange={setFilterCode}
        searchPayload={searchPayload}
        onSearchPayloadChange={setSearchPayload}
        onExport={handleExportPackets}
        onClear={clearTransactions}
        onOpenDieAttachTest={() => setShowDieAttachModal(true)}
        t={t}
        formatNumber={formatNumber}
      />

      {/* ─── 2. Bố Cục Chia Đôi: Bảng Giao Dịch & Khung Soi Bản Tin ─── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 min-h-0 overflow-hidden">
        {/* Left Pane: Packet Table (TransactionTable) */}
        <TransactionTable
          transactions={transactions}
          filteredTransactions={filteredTransactions}
          activeTx={activeTx}
          onSelectTx={setSelectedTx}
          onOpenModalTx={setModalTx}
          t={t}
        />

        {/* Right Pane: Deep Hex & Protocol Breakdown (TransactionInspector) */}
        <TransactionInspector
          activeTx={activeTx}
          onCopy={handleCopy}
          copiedHex={copiedHex}
          copiedJson={copiedJson}
          onOpenModal={setModalTx}
          formatOffsetHex={formatOffsetHex}
          t={t}
        />
      </div>

      {/* ─── 3. Modal Giả Lập Die Attach (DieAttachSimulatorModal) ─── */}
      <DieAttachSimulatorModal
        isOpen={showDieAttachModal}
        onClose={() => setShowDieAttachModal(false)}
      />

      {/* ─── 4. Modal Chi Tiết Toàn Diện Giao Dịch (TransactionDetailModal) ─── */}
      <TransactionDetailModal
        transaction={modalTx}
        onClose={() => setModalTx(null)}
      />
    </div>
  );
};

export default CommunicationMonitorView;

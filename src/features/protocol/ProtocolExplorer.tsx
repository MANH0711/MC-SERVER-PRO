/**
 * MC Server Protocol Explorer & Diagnostic Workbench
 * Space-optimized message catalog, frame encoder/decoder, 20.013 vs 20.014 boundary tester, and checksum calculator.
 */

import React, { useState } from 'react';
import {
  FileCode2,
  Cpu,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Code,
  Terminal,
  Calculator,
  Layers,
  Send,
} from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { useApp } from '@/core/context';
import { MESSAGE_DEFINITIONS } from './engine/messageDefinitions';
import { encodeFrame, EncodedFrameResult } from './engine/frameEncoder';
import { IndustrialFrameParser } from './engine/frameParser';
import { calculateChecksum } from './engine/checksum';
import { ParsedFrame, ChecksumAlgorithm } from '@/core/types';

export const ProtocolExplorerView: React.FC = () => {
  const { t } = useTranslation();
  const { devices, injectRawFrame } = useApp();

  const [activeTab, setActiveTab] = useState<'catalog' | 'workbench' | 'boundaryTest' | 'checksumCalc'>('workbench');
  const [selectedCode, setSelectedCode] = useState<string>('M001');

  // Workbench Form State
  const [wbEquipId, setWbEquipId] = useState<string>(devices[0]?.id || 'EQP_SMT_01');
  const [wbMsgCode, setWbMsgCode] = useState<string>('M001');
  const [wbTxId, setWbTxId] = useState<string>('TX100084');
  const [wbPayload, setWbPayload] = useState<string>(
    JSON.stringify(MESSAGE_DEFINITIONS['M001'].samplePayload, null, 2)
  );
  const [wbEncoded, setWbEncoded] = useState<EncodedFrameResult | null>(null);
  const [wbParseResult, setWbParseResult] = useState<ParsedFrame | null>(null);
  const [injectedSuccess, setInjectedSuccess] = useState<boolean>(false);

  // Checksum Calc state
  const [calcInput, setCalcInput] = useState<string>('0034EQP_SMT_01M001TX100001{"status":"IDLE"}');
  const [calcLrc, setCalcLrc] = useState<string>('');
  const [calcXor, setCalcXor] = useState<string>('');
  const [calcCrc, setCalcCrc] = useState<string>('');

  // Boundary test state
  const [boundaryTestResult, setBoundaryTestResult] = useState<string>('');

  const handleSelectCode = (code: string) => {
    setSelectedCode(code);
    setWbMsgCode(code);
    if (MESSAGE_DEFINITIONS[code]) {
      setWbPayload(JSON.stringify(MESSAGE_DEFINITIONS[code].samplePayload, null, 2));
    }
  };

  const handleEncode = () => {
    try {
      const parsedJson = JSON.parse(wbPayload);
      const res = encodeFrame({
        equipmentId: wbEquipId,
        messageCode: wbMsgCode,
        txId: wbTxId,
        payload: parsedJson,
        checksumAlg: 'LRC_MOD256',
        boundary: '20013_STANDARD',
      });
      setWbEncoded(res);

      const parser = new IndustrialFrameParser();
      const frames = parser.pushChunk(res.bytes);
      setWbParseResult(frames[0] || null);
    } catch (err: any) {
      alert(`Invalid JSON in payload: ${err.message}`);
    }
  };

  const handleInjectSocket = () => {
    if (!wbEncoded) {
      handleEncode();
    }
    const currentEncoded = wbEncoded;
    if (currentEncoded) {
      injectRawFrame(wbEquipId, currentEncoded.bytes);
      setInjectedSuccess(true);
      setTimeout(() => setInjectedSuccess(false), 2500);
    }
  };

  const runBoundaryTest = (type: '20013' | '20014' | 'corrupted') => {
    const parser = new IndustrialFrameParser();
    let sampleFrame: Uint8Array;

    if (type === '20013') {
      const encoded = encodeFrame({
        equipmentId: 'EQP_SMT_01',
        messageCode: 'S005',
        txId: 'TX200130',
        payload: { pcbBarcode: 'PCB_BRD_994827104' },
        boundary: '20013_STANDARD',
      });
      sampleFrame = encoded.bytes;
    } else if (type === '20014') {
      const encoded = encodeFrame({
        equipmentId: 'EQP_SMT_01',
        messageCode: 'S005',
        txId: 'TX200140',
        payload: { pcbBarcode: 'PCB_BRD_994827104' },
        boundary: '20014_EXTENDED',
      });
      sampleFrame = encoded.bytes;
    } else {
      const encoded = encodeFrame({
        equipmentId: 'EQP_SMT_01',
        messageCode: 'S005',
        txId: 'TX_BAD01',
        payload: { pcbBarcode: 'PCB_BRD_994827104' },
      });
      sampleFrame = new Uint8Array(encoded.bytes);
      sampleFrame[sampleFrame.length - 2] = 0x5a;
    }

    const parsed = parser.pushChunk(sampleFrame);
    if (parsed.length > 0) {
      const res = parsed[0];
      setBoundaryTestResult(
        `[${type.toUpperCase()}] Valid: ${res.isValid} | Boundary: ${res.detectedBoundary} | Checksum: ${
          res.checksum
        } (Expected: ${res.expectedChecksum}, Status: ${res.checksumStatus}) | Note: ${res.error || 'Clean ETX parsing'}`
      );
    } else {
      setBoundaryTestResult(`[${type.toUpperCase()}] Frame dropped: could not locate STX/ETX.`);
    }
  };

  const runChecksumCalculation = () => {
    setCalcLrc(calculateChecksum(calcInput, 'LRC_MOD256'));
    setCalcXor(calculateChecksum(calcInput, 'XOR_HEX'));
    setCalcCrc(calculateChecksum(calcInput, 'CRC16_CCITT'));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 space-y-2.5 bg-[#080C15] text-slate-100">
      {/* Top Header Bar */}
      <div className="h-11 px-3 rounded bg-slate-900/90 border border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            {t('protocol.title')}
          </h2>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            SPECIFICATION & HARNESS
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('workbench')}
            className={`px-2.5 py-0.5 font-medium rounded transition-colors text-xs ${
              activeTab === 'workbench' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('protocol.tabs.workbench')}
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-2.5 py-0.5 font-medium rounded transition-colors text-xs ${
              activeTab === 'catalog' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('protocol.tabs.catalog')}
          </button>
          <button
            onClick={() => setActiveTab('boundaryTest')}
            className={`px-2.5 py-0.5 font-medium rounded transition-colors text-xs ${
              activeTab === 'boundaryTest' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('protocol.tabs.boundaryTest')}
          </button>
          <button
            onClick={() => {
              setActiveTab('checksumCalc');
              runChecksumCalculation();
            }}
            className={`px-2.5 py-0.5 font-medium rounded transition-colors text-xs ${
              activeTab === 'checksumCalc' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('protocol.tabs.checksumCalc')}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 rounded bg-slate-900/90 border border-slate-800/80 p-3 overflow-y-auto min-h-0 text-xs">
        {/* Tab 1: Workbench */}
        {activeTab === 'workbench' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Construction Form */}
            <div className="lg:col-span-6 space-y-2.5">
              <div className="pb-1.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t('protocol.workbench.constructFrame')}</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{t('protocol.frameAssembly')}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('protocol.workbench.equipId')}
                  </label>
                  <select
                    value={wbEquipId}
                    onChange={(e) => setWbEquipId(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('protocol.workbench.msgCode')}
                  </label>
                  <select
                    value={wbMsgCode}
                    onChange={(e) => handleSelectCode(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-400 font-mono font-bold text-xs focus:outline-none focus:border-blue-500"
                  >
                    {Object.keys(MESSAGE_DEFINITIONS).map((code) => (
                      <option key={code} value={code}>
                        {code} - {MESSAGE_DEFINITIONS[code].name.slice(0, 16)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('protocol.workbench.txId')}
                  </label>
                  <input
                    type="text"
                    value={wbTxId}
                    onChange={(e) => setWbTxId(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                  {t('protocol.workbench.payloadJson')} (JSON)
                </label>
                <textarea
                  rows={4}
                  value={wbPayload}
                  onChange={(e) => setWbPayload(e.target.value)}
                  className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs focus:outline-none focus:border-blue-500 leading-tight"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleEncode}
                  className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Code className="w-3 h-3" />
                  <span>{t('protocol.workbench.encodeBtn')}</span>
                </button>
                <button
                  onClick={handleInjectSocket}
                  className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>{t('protocol.workbench.injectToSocket')}</span>
                </button>
                {injectedSuccess && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono animate-pulse">
                    <CheckCircle2 className="w-3 h-3" /> Sent!
                  </span>
                )}
              </div>
            </div>

            {/* Encoded Output & Hex Result */}
            <div className="lg:col-span-6 space-y-2 font-mono text-xs">
              <div className="pb-1.5 border-b border-slate-800 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-200">
                <span>{t('protocol.workbench.frameOutput')}</span>
                {wbEncoded && (
                  <span className="text-emerald-400 text-[10px]">
                    Len: {wbEncoded.lengthHeader} | Chk: {wbEncoded.checksum}
                  </span>
                )}
              </div>

              {wbEncoded ? (
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                      ASCII Stream
                    </span>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-cyan-300 break-all select-all text-[11px]">
                      {wbEncoded.asciiString}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                      Binary Hex Dump
                    </span>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 break-all select-all text-[10px] max-h-24 overflow-y-auto leading-relaxed">
                      {wbEncoded.hexDump}
                    </div>
                  </div>

                  {wbParseResult && (
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5 text-[10px]">
                      <span className="text-slate-400 uppercase font-semibold block">
                        Self-Verification
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-bold">
                          {wbParseResult.isValid ? 'VALID' : 'INVALID'}
                        </span>
                        <span className="text-purple-400 font-mono">
                          {wbParseResult.detectedBoundary}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 italic text-xs font-sans">
                  Click "Encode Frame" to generate wire bytes.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Catalog */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4 p-2 rounded bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1 pb-1 border-b border-slate-800/80">
                Message Dictionary
              </span>
              <div className="max-h-72 overflow-y-auto space-y-0.5 font-mono">
                {Object.values(MESSAGE_DEFINITIONS).map((def) => (
                  <button
                    key={def.code}
                    onClick={() => handleSelectCode(def.code)}
                    className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors flex items-center justify-between ${
                      selectedCode === def.code
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="font-bold text-cyan-400">{def.code}</span>
                    <span className="truncate max-w-[140px] font-sans">{def.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-8 p-3 rounded bg-slate-950 border border-slate-800 space-y-2">
              {MESSAGE_DEFINITIONS[selectedCode] && (
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold font-mono text-cyan-400">
                        {MESSAGE_DEFINITIONS[selectedCode].code} - {MESSAGE_DEFINITIONS[selectedCode].name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                        {MESSAGE_DEFINITIONS[selectedCode].description}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-blue-500/30 text-blue-400">
                      {MESSAGE_DEFINITIONS[selectedCode].direction}
                    </span>
                  </div>

                  <div className="mt-2">
                    <table className="w-full text-left font-mono text-[10px] border border-slate-800 rounded">
                      <thead className="bg-slate-900 text-slate-400">
                        <tr>
                          <th className="py-1 px-2">{t('protocol.colField')}</th>
                          <th className="py-1 px-2">{t('protocol.colType')}</th>
                          <th className="py-1 px-2">{t('protocol.colReq')}</th>
                          <th className="py-1 px-2">{t('protocol.colDesc')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {MESSAGE_DEFINITIONS[selectedCode].fields.map((f) => (
                          <tr key={f.name}>
                            <td className="py-1 px-2 font-bold text-blue-400">{f.name}</td>
                            <td className="py-1 px-2 text-purple-400">{f.type}</td>
                            <td className="py-1 px-2">{f.required ? 'YES' : 'OPT'}</td>
                            <td className="py-1 px-2 font-sans">{f.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Boundary Test */}
        {activeTab === 'boundaryTest' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {t('protocol.boundaryTest.title')}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              {t('protocol.boundaryTest.description')}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
              <button
                onClick={() => runBoundaryTest('20013')}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 hover:border-blue-500 text-slate-200 transition-colors"
              >
                {t('protocol.boundaryTest.test20013')}
              </button>
              <button
                onClick={() => runBoundaryTest('20014')}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 hover:border-purple-500 text-slate-200 transition-colors"
              >
                {t('protocol.boundaryTest.test20014')}
              </button>
              <button
                onClick={() => runBoundaryTest('corrupted')}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 hover:border-red-500 text-red-300 transition-colors"
              >
                {t('protocol.boundaryTest.testCorrupted')}
              </button>
            </div>

            {boundaryTestResult && (
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300">
                {boundaryTestResult}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Checksum Calculator */}
        {activeTab === 'checksumCalc' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-purple-400" />
              Industrial Checksum Engine
            </h3>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-0.5">
                Input String for Real-time Hash Calculation
              </label>
              <textarea
                rows={2}
                value={calcInput}
                onChange={(e) => {
                  setCalcInput(e.target.value);
                  setCalcLrc(calculateChecksum(e.target.value, 'LRC_MOD256'));
                  setCalcXor(calculateChecksum(e.target.value, 'XOR_HEX'));
                  setCalcCrc(calculateChecksum(e.target.value, 'CRC16_CCITT'));
                }}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">LRC (Modulo 256)</span>
                <span className="text-lg font-bold text-cyan-400 mt-0.5 block">{calcLrc || '-'}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">XOR 8-Bit</span>
                <span className="text-lg font-bold text-purple-400 mt-0.5 block">{calcXor || '-'}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">CRC16-CCITT</span>
                <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{calcCrc || '-'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

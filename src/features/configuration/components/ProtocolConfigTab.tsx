import React from 'react';
import { ServerConfig, FrameBoundary, ChecksumAlgorithm } from '@/core/types';

interface ProtocolConfigTabProps {
  protocol: ServerConfig['protocol'];
  onChange: (protocol: ServerConfig['protocol']) => void;
  t: (key: string) => string;
}

export const ProtocolConfigTab: React.FC<ProtocolConfigTabProps> = ({
  protocol,
  onChange,
  t,
}) => {
  return (
    <div className="space-y-3 font-sans">
      <div className="pb-1.5 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Framing & Boundary Rules
        </span>
        <span className="text-[10px] text-slate-500 font-mono">{t('config.semiCustomProtocol')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            {t('config.defaultBoundaryLabel')}
          </label>
          <select
            value={protocol.defaultBoundary}
            onChange={(e) =>
              onChange({ ...protocol, defaultBoundary: e.target.value as FrameBoundary })
            }
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="AUTO_DETECT">AUTO_DETECT (Dual Support 20.013 & 20.014)</option>
            <option value="20013_STANDARD">20013_STANDARD (Strict ETX 0x03)</option>
            <option value="20014_EXTENDED">20014_EXTENDED (ETX + LF 0x0A or Null 0x00)</option>
            <option value="VARIABLE_LENGTH">VARIABLE_LENGTH (Variable Sized Frames)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            {t('config.defaultChecksumLabel')}
          </label>
          <select
            value={protocol.checksumAlgorithm}
            onChange={(e) =>
              onChange({ ...protocol, checksumAlgorithm: e.target.value as ChecksumAlgorithm })
            }
            className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="LRC_MOD256">LRC Modulo-256 (Default)</option>
            <option value="XOR_HEX">XOR 8-Bit</option>
            <option value="CRC16_CCITT">CRC16-CCITT (16-Bit Polynomial)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
            {t('config.delimitersLabel')}
          </label>
          <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs flex justify-between">
            <span>STX: 0x02</span>
            <span>ETX: 0x03</span>
          </div>
        </div>
      </div>
    </div>
  );
};

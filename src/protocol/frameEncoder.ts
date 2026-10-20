/**
 * MC Server Industrial Frame Encoder
 * Builds specification-compliant binary/ASCII frames with checksum and boundary handling.
 */

import { ChecksumAlgorithm, FrameBoundary } from '../types';
import { calculateChecksum, toHexDump } from './checksum';
import { STX, ETX, LF, NULL_BYTE } from './frameParser';

export interface EncodeOptions {
  equipmentId: string;
  messageCode: string;
  txId: string;
  payload: Record<string, any> | string;
  checksumAlg?: ChecksumAlgorithm;
  boundary?: FrameBoundary;
}

export interface EncodedFrameResult {
  bytes: Uint8Array;
  asciiString: string;
  hexDump: string;
  lengthHeader: number;
  checksum: string;
}

/**
 * Builds standard industrial MC Server Frame
 */
export function encodeFrame(options: EncodeOptions): EncodedFrameResult {
  const {
    equipmentId,
    messageCode,
    txId,
    payload,
    checksumAlg = 'LRC_MOD256',
    boundary = '20013_STANDARD',
  } = options;

  // 1. Format payload as JSON string or raw text
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const payloadBytes = new TextEncoder().encode(payloadStr);

  // 2. Format header fields
  // Equip ID: 10 chars (right-padded with spaces)
  const normalizedEqId = equipmentId.padEnd(10, ' ').slice(0, 10);
  // Msg Code: 4 chars
  const normalizedMsgCode = messageCode.padEnd(4, ' ').slice(0, 4);
  // Tx ID: 8 chars
  const normalizedTxId = txId.padEnd(8, ' ').slice(0, 8);

  // Content length = EquipId(10) + MsgCode(4) + TxId(8) + PayloadLength
  const contentLength = 10 + 4 + 8 + payloadBytes.length;
  // Length header: 4 digits zero-padded
  const lengthHeaderStr = contentLength.toString(10).padStart(4, '0');

  // 3. Assemble bytes for checksum calculation (from LENGTH to end of PAYLOAD)
  const dataBeforeChecksum = `${lengthHeaderStr}${normalizedEqId}${normalizedMsgCode}${normalizedTxId}${payloadStr}`;
  const dataBytes = new TextEncoder().encode(dataBeforeChecksum);

  // 4. Calculate checksum
  const checksum = calculateChecksum(dataBytes, checksumAlg);
  const checksumBytes = new TextEncoder().encode(checksum);

  // 5. Build full frame: [STX] [dataBytes] [checksumBytes] [ETX] [optional LF/NULL]
  const extraTailLength = boundary === '20014_EXTENDED' ? 1 : 0;
  const totalLength = 1 + dataBytes.length + checksumBytes.length + 1 + extraTailLength;

  const frameBytes = new Uint8Array(totalLength);
  frameBytes[0] = STX;
  frameBytes.set(dataBytes, 1);
  frameBytes.set(checksumBytes, 1 + dataBytes.length);
  frameBytes[1 + dataBytes.length + checksumBytes.length] = ETX;

  if (boundary === '20014_EXTENDED') {
    frameBytes[totalLength - 1] = LF;
  }

  const asciiString = new TextDecoder('utf-8', { fatal: false }).decode(frameBytes);
  const hexDump = toHexDump(frameBytes);

  return {
    bytes: frameBytes,
    asciiString,
    hexDump,
    lengthHeader: contentLength,
    checksum,
  };
}

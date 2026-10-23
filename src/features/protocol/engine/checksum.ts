/**
 * MC Server Industrial Checksum Engine
 * Implements LRC (Modulo 256), XOR Checksum, and CRC16-CCITT for industrial protocols.
 */

import { ChecksumAlgorithm } from '@/core/types';

/**
 * Calculates Longitudinal Redundancy Check (LRC Modulo 256)
 * Sum of all byte values modulo 256, formatted as a 2-character uppercase Hex string.
 */
export function calculateLrcChecksum(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let sum = 0;
  for (let i = 0; i < bytes.length; i++) {
    sum = (sum + bytes[i]) & 0xff;
  }
  return sum.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Calculates XOR Checksum
 * Bitwise XOR across all bytes, formatted as 2-character uppercase Hex.
 */
export function calculateXorChecksum(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let xor = 0;
  for (let i = 0; i < bytes.length; i++) {
    xor ^= bytes[i];
  }
  return (xor & 0xff).toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Calculates CRC16-CCITT (Polynomial 0x1021, Init 0xFFFF)
 */
export function calculateCrc16Checksum(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let crc = 0xffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Unified Checksum calculation
 */
export function calculateChecksum(data: string | Uint8Array, algorithm: ChecksumAlgorithm): string {
  switch (algorithm) {
    case 'XOR_HEX':
      return calculateXorChecksum(data);
    case 'CRC16_CCITT':
      return calculateCrc16Checksum(data);
    case 'LRC_MOD256':
    default:
      return calculateLrcChecksum(data);
  }
}

/**
 * Verifies if the frame checksum matches
 */
export function verifyChecksum(
  dataSlice: string | Uint8Array,
  receivedChecksum: string,
  algorithm: ChecksumAlgorithm = 'LRC_MOD256'
): { isValid: boolean; expected: string; received: string } {
  const expected = calculateChecksum(dataSlice, algorithm);
  const normalizedReceived = receivedChecksum.trim().toUpperCase();
  const isValid = expected === normalizedReceived;
  return { isValid, expected, received: normalizedReceived };
}

/**
 * Convert binary array or string to standard space-separated Hex representation
 */
export function toHexDump(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hexParts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    hexParts.push(bytes[i].toString(16).toUpperCase().padStart(2, '0'));
  }
  return hexParts.join(' ');
}

/**
 * Parse Hex dump back to Uint8Array
 */
export function fromHexDump(hexString: string): Uint8Array {
  const clean = hexString.replace(/[^0-9A-Fa-f]/g, '');
  const bytes = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

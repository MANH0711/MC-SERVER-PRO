/**
 * MC Server Industrial Frame Parser
 * Handles framing, TCP stream buffering, fragmentation, coalescing, and boundary resolution (20.013 vs 20.014 bytes).
 */

import { ParsedFrame, ChecksumAlgorithm, FrameBoundary } from '@/core/types';
import { calculateChecksum, toHexDump } from './checksum';

export const STX = 0x02; // Start of Text
export const ETX = 0x03; // End of Text
export const LF = 0x0a;  // Line Feed (in 20.014 extended boundary)
export const NULL_BYTE = 0x00;

export interface SliceResult {
  frames: ParsedFrame[];
  remainingBuffer: Uint8Array;
}

export class IndustrialFrameParser {
  private buffer: Uint8Array = new Uint8Array(0);
  private maxBufferSize: number;

  constructor(maxBufferSize: number = 1024 * 1024) {
    this.maxBufferSize = maxBufferSize;
  }

  /**
   * Appends incoming raw TCP chunk and extracts all complete frames.
   */
  public pushChunk(chunk: Uint8Array | string, checksumAlg: ChecksumAlgorithm = 'LRC_MOD256'): ParsedFrame[] {
    const newBytes = typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk;

    // Check buffer overflow protection
    if (this.buffer.length + newBytes.length > this.maxBufferSize) {
      // Emergency drain oldest data to avoid memory exhaustion
      this.buffer = new Uint8Array(0);
      throw new Error(`Buffer overflow exceeded ${this.maxBufferSize} bytes. Buffer cleared.`);
    }

    // Combine existing buffer with new bytes
    const combined = new Uint8Array(this.buffer.length + newBytes.length);
    combined.set(this.buffer);
    combined.set(newBytes, this.buffer.length);
    this.buffer = combined;

    const parsedFrames: ParsedFrame[] = [];
    let searchIndex = 0;

    while (searchIndex < this.buffer.length) {
      // Find STX
      const stxIndex = this.buffer.indexOf(STX, searchIndex);
      if (stxIndex === -1) {
        // No STX found in remaining buffer, discard noise
        this.buffer = new Uint8Array(0);
        break;
      }

      // We need at least STX + 4 (Length) + 10 (EqId) + 4 (MsgCode) + 8 (TxId) + 2 (Checksum) + 1 (ETX) = 30 bytes
      if (this.buffer.length < stxIndex + 30) {
        // Frame incomplete, wait for more chunks
        this.buffer = this.buffer.slice(stxIndex);
        break;
      }

      // Read Length header (4 ASCII bytes immediately after STX)
      const lengthBytes = this.buffer.slice(stxIndex + 1, stxIndex + 5);
      const lengthStr = new TextDecoder().decode(lengthBytes);
      const payloadAndHeaderLen = parseInt(lengthStr, 10);

      // If length is NaN or invalid, advance search index past current STX
      if (isNaN(payloadAndHeaderLen) || payloadAndHeaderLen < 22) {
        searchIndex = stxIndex + 1;
        continue;
      }

      // Expected ETX position: stxIndex + 1 (STX) + 4 (LENGTH) + payloadAndHeaderLen + 2 (CHECKSUM)
      const expectedEtxPos = stxIndex + 1 + 4 + payloadAndHeaderLen + 2;

      if (this.buffer.length <= expectedEtxPos) {
        // Waiting for more data to arrive (TCP Fragmentation)
        this.buffer = this.buffer.slice(stxIndex);
        break;
      }

      // Check if ETX is present at expected position
      if (this.buffer[expectedEtxPos] !== ETX) {
        // ETX not at expected position, search for ETX nearby or treat as frame error
        const alternativeEtx = this.buffer.indexOf(ETX, stxIndex + 1);
        if (alternativeEtx !== -1 && alternativeEtx < expectedEtxPos + 10) {
          // Adjust frame
          const frameBytes = this.buffer.slice(stxIndex, alternativeEtx + 1);
          const parsed = this.parseSingleFrameBytes(frameBytes, checksumAlg);
          parsedFrames.push(parsed);

          let advance = alternativeEtx + 1;
          // Check for 20.014 byte boundary (trailing LF or NULL)
          if (advance < this.buffer.length && (this.buffer[advance] === LF || this.buffer[advance] === NULL_BYTE)) {
            advance++;
          }
          searchIndex = advance;
          continue;
        } else {
          // Bad framing, skip this STX
          searchIndex = stxIndex + 1;
          continue;
        }
      }

      // Complete frame found!
      let frameEnd = expectedEtxPos + 1; // inclusive of ETX
      let detectedBoundary: FrameBoundary = '20013_STANDARD';

      // Check for 20.014 byte boundary: next byte is LF (0x0A) or 0x00
      if (frameEnd < this.buffer.length && (this.buffer[frameEnd] === LF || this.buffer[frameEnd] === NULL_BYTE)) {
        frameEnd++;
        detectedBoundary = '20014_EXTENDED';
      }

      const frameBytes = this.buffer.slice(stxIndex, frameEnd);
      const parsed = this.parseSingleFrameBytes(frameBytes, checksumAlg, detectedBoundary);
      parsedFrames.push(parsed);

      searchIndex = frameEnd;
    }

    // Retain only unparsed remainder
    if (searchIndex > 0) {
      this.buffer = this.buffer.slice(searchIndex);
    }

    return parsedFrames;
  }

  /**
   * Parse a single guaranteed slice of bytes starting with STX and ending with ETX
   */
  public parseSingleFrameBytes(
    bytes: Uint8Array,
    checksumAlg: ChecksumAlgorithm = 'LRC_MOD256',
    boundaryHint: FrameBoundary = 'AUTO_DETECT'
  ): ParsedFrame {
    const rawAscii = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    const rawHex = toHexDump(bytes);

    if (bytes[0] !== STX) {
      return this.createErrorFrame(rawAscii, rawHex, 'Missing STX (0x02) at start of frame');
    }

    // Find ETX
    let etxIndex = -1;
    for (let i = bytes.length - 1; i >= 0; i--) {
      if (bytes[i] === ETX) {
        etxIndex = i;
        break;
      }
    }

    if (etxIndex === -1) {
      return this.createErrorFrame(rawAscii, rawHex, 'Missing ETX (0x03) delimiter');
    }

    const detectedBoundary: FrameBoundary =
      bytes.length === 20014 || (etxIndex === bytes.length - 2 && (bytes[bytes.length - 1] === LF || bytes[bytes.length - 1] === 0x00))
        ? '20014_EXTENDED'
        : '20013_STANDARD';

    try {
      // Structure: [STX(1)] [LENGTH(4)] [EQUIP_ID(10)] [MSG_CODE(4)] [TX_ID(8)] [PAYLOAD(N)] [CHECKSUM(2)] [ETX(1)]
      const lengthStr = new TextDecoder().decode(bytes.slice(1, 5)).trim();
      const lengthVal = parseInt(lengthStr, 10);

      const equipmentId = new TextDecoder().decode(bytes.slice(5, 15)).trim();
      const messageCode = new TextDecoder().decode(bytes.slice(15, 19)).trim();
      const txId = new TextDecoder().decode(bytes.slice(19, 27)).trim();

      const checksumStart = etxIndex - 2;
      const receivedChecksum = new TextDecoder().decode(bytes.slice(checksumStart, etxIndex)).trim().toUpperCase();

      // Data subject to checksum: bytes between STX and Checksum
      const checksumData = bytes.slice(1, checksumStart);
      const expectedChecksum = calculateChecksum(checksumData, checksumAlg);
      const isChecksumValid = receivedChecksum === expectedChecksum;

      // Extract Payload (from index 27 to checksumStart)
      const payloadBytes = bytes.slice(27, checksumStart);
      const payloadRaw = new TextDecoder('utf-8', { fatal: false }).decode(payloadBytes);

      let payloadJson: Record<string, any> = {};
      try {
        if (payloadRaw.trim().startsWith('{') || payloadRaw.trim().startsWith('[')) {
          payloadJson = JSON.parse(payloadRaw);
        } else {
          payloadJson = { rawText: payloadRaw };
        }
      } catch {
        payloadJson = { rawText: payloadRaw, parseNote: 'Non-JSON text payload' };
      }

      return {
        isValid: isChecksumValid,
        error: isChecksumValid ? undefined : `Checksum mismatch (Expected ${expectedChecksum}, got ${receivedChecksum})`,
        equipmentId,
        messageCode,
        txId,
        payloadLength: payloadBytes.length,
        payloadRaw,
        payloadJson,
        checksum: receivedChecksum,
        expectedChecksum,
        checksumStatus: isChecksumValid ? 'VALID' : 'INVALID',
        detectedBoundary: boundaryHint !== 'AUTO_DETECT' ? boundaryHint : detectedBoundary,
        frameLength: bytes.length,
        rawAscii,
        rawHex,
      };
    } catch (err: any) {
      return this.createErrorFrame(rawAscii, rawHex, `Parse exception: ${err.message}`);
    }
  }

  private createErrorFrame(rawAscii: string, rawHex: string, error: string): ParsedFrame {
    return {
      isValid: false,
      error,
      equipmentId: 'UNKNOWN',
      messageCode: 'ERR0',
      txId: 'UNKNOWN',
      payloadLength: 0,
      payloadRaw: '',
      payloadJson: {},
      checksum: '??',
      expectedChecksum: '??',
      checksumStatus: 'INVALID',
      detectedBoundary: '20013_STANDARD',
      frameLength: rawAscii.length,
      rawAscii,
      rawHex,
    };
  }

  public getBufferedByteCount(): number {
    return this.buffer.length;
  }

  public clearBuffer(): void {
    this.buffer = new Uint8Array(0);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ProtocolFrame, PROTOCOL_CONSTANTS } from './frame.types';
import { ChecksumUtils } from './checksum.utils';

@Injectable()
export class FrameCodec {
  private readonly logger = new Logger(FrameCodec.name);

  /**
   * Đóng gói bản tin nhị phân chuẩn công nghiệp (STX -> Header -> Data -> CRC -> ETX)
   */
  encode(
    deviceId: number | string,
    serverNo: number,
    commandCode: string,
    subCode = 0,
    payload: Buffer = Buffer.alloc(0)
  ): Buffer {
    const numDeviceId = typeof deviceId === 'string' ? parseInt(deviceId, 10) || 0 : (deviceId ?? 0);
    const totalLength = PROTOCOL_CONSTANTS.HEADER_SIZE + payload.length + PROTOCOL_CONSTANTS.TRAILER_SIZE;
    const buffer = Buffer.alloc(totalLength);

    let offset = 0;
    // STX (1 byte)
    buffer.writeUInt8(PROTOCOL_CONSTANTS.STX, offset);
    offset += 1;

    // Length (2 bytes, big-endian)
    buffer.writeUInt16BE(totalLength, offset);
    offset += 2;

    // Device ID (1 byte)
    buffer.writeUInt8(numDeviceId & 0xff, offset);
    offset += 1;

    // Server No (1 byte)
    buffer.writeUInt8(serverNo & 0xff, offset);
    offset += 1;

    // Command Code (4 bytes ASCII, ví dụ "M001", "B101", "J201")
    const codePadded = commandCode.padEnd(4, ' ').substring(0, 4);
    buffer.write(codePadded, offset, 4, 'ascii');
    offset += 4;

    // Sub-command Code (1 byte)
    buffer.writeUInt8(subCode & 0xff, offset);
    offset += 1;

    // Payload (N bytes)
    if (payload.length > 0) {
      payload.copy(buffer, offset);
      offset += payload.length;
    }

    // CRC16 Checksum (2 bytes) tính từ STX đến hết Payload
    const dataToCheck = buffer.subarray(0, offset);
    const crc = ChecksumUtils.crc16(dataToCheck);
    buffer.writeUInt16BE(crc, offset);
    offset += 2;

    // ETX (1 byte)
    buffer.writeUInt8(PROTOCOL_CONSTANTS.ETX, offset);

    return buffer;
  }

  /**
   * Giải mã Buffer nhị phân nhận được từ Socket thiết bị
   */
  decode(buffer: Buffer): ProtocolFrame | null {
    if (buffer.length < PROTOCOL_CONSTANTS.HEADER_SIZE + PROTOCOL_CONSTANTS.TRAILER_SIZE) {
      this.logger.debug(`Kích thước gói tin quá ngắn (${buffer.length} bytes)`);
      return null;
    }

    const stx = buffer.readUInt8(0);
    if (stx !== PROTOCOL_CONSTANTS.STX) {
      this.logger.warn(`STX không hợp lệ: 0x${stx.toString(16)}`);
      return null;
    }

    const length = buffer.readUInt16BE(1);
    if (buffer.length < length) {
      this.logger.debug(`Gói tin chưa nhận đủ: hiện có ${buffer.length}/${length} bytes`);
      return null;
    }

    const etx = buffer.readUInt8(length - 1);
    if (etx !== PROTOCOL_CONSTANTS.ETX) {
      this.logger.warn(`ETX không hợp lệ tại vị trí ${length - 1}: 0x${etx.toString(16)}`);
      return null;
    }

    const receivedCrc = buffer.readUInt16BE(length - 3);
    const dataToCheck = buffer.subarray(0, length - 3);
    const calculatedCrc = ChecksumUtils.crc16(dataToCheck);

    if (receivedCrc !== calculatedCrc) {
      this.logger.warn(`Lỗi Checksum CRC16: Nhận 0x${receivedCrc.toString(16)} != Tính 0x${calculatedCrc.toString(16)}`);
      // Vẫn tiếp tục xử lý nhưng cảnh báo
    }

    const deviceId = buffer.readUInt8(3);
    const serverNo = buffer.readUInt8(4);
    const commandCode = buffer.toString('ascii', 5, 9).trim();
    const subCode = buffer.readUInt8(9);

    const payloadLength = length - (PROTOCOL_CONSTANTS.HEADER_SIZE + PROTOCOL_CONSTANTS.TRAILER_SIZE);
    const payload = payloadLength > 0 ? buffer.subarray(10, 10 + payloadLength) : Buffer.alloc(0);

    return {
      stx,
      length,
      deviceId,
      serverNo,
      commandCode,
      subCode,
      payload,
      checksum: receivedCrc,
      etx,
      rawBuffer: buffer.subarray(0, length),
      rawHex: ChecksumUtils.bufferToHexString(buffer.subarray(0, length)),
    };
  }
}

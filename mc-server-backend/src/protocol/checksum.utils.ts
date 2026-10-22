export class ChecksumUtils {
  /**
   * Tính toán CRC16-CCITT (Polynom 0x1021, Initial 0xFFFF)
   */
  static crc16(buffer: Buffer): number {
    let crc = 0xffff;
    for (let i = 0; i < buffer.length; i++) {
      crc ^= buffer[i] << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return crc;
  }

  /**
   * Tính toán LRC (Longitudinal Redundancy Check)
   */
  static lrc(buffer: Buffer): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum = (sum + buffer[i]) & 0xff;
    }
    return ((sum ^ 0xff) + 1) & 0xff;
  }

  /**
   * Chuyển Buffer thành Hex String phân cách bởi dấu cách (dùng cho Log hiển thị giao diện FE)
   */
  static bufferToHexString(buffer: Buffer): string {
    return Array.from(buffer)
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');
  }

  /**
   * Chuyển Hex String thành Buffer
   */
  static hexStringToBuffer(hex: string): Buffer {
    const cleanHex = hex.replace(/[^0-9A-Fa-f]/g, '');
    return Buffer.from(cleanHex, 'hex');
  }
}

export const PROTOCOL_CONSTANTS = {
  STX: 0x02,
  ETX: 0x03,
  ACK: 0x06,
  NAK: 0x15,
  HEADER_SIZE: 10,
  TRAILER_SIZE: 3, // Checksum (2 bytes) + ETX (1 byte)
};

export interface ProtocolFrame {
  stx: number;
  length: number;
  deviceId: number;
  serverNo: number;
  commandCode: string;
  subCode: number;
  payload: Buffer;
  checksum: number;
  etx: number;
  rawBuffer?: Buffer;
  rawHex?: string;
}

export interface ParsedCommandPayload {
  equipmentId: string;
  commandCode: string;
  data: Record<string, any>;
  rawHex: string;
}

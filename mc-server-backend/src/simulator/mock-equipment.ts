import * as net from 'net';
import { FrameCodec } from '../protocol/frame.codec';
import { ChecksumUtils } from '../protocol/checksum.utils';

const codec = new FrameCodec();

function createMockDevice(name: string, port: number, model: string) {
  const server = net.createServer((socket) => {
    console.log(`\x1b[32m[${name}] (${model})\x1b[0m 🔌 Server MC đã kết nối tới máy ảo tại port ${port}!`);

    socket.on('data', (data: Buffer) => {
      const frame = codec.decode(data);
      if (!frame) return;

      console.log(`\x1b[36m[${name}] 📥 Nhận lệnh từ MC Server: [${frame.commandCode}]\x1b[0m (Hex: ${ChecksumUtils.bufferToHexString(data)})`);

      // Phản hồi tự động theo loại lệnh
      let responsePayload = Buffer.from([0x06]); // ACK

      if (frame.commandCode === 'M001') {
        // Nhịp tim
        responsePayload = Buffer.alloc(8);
        responsePayload.writeBigInt64BE(BigInt(Date.now()), 0);
      } else if (frame.commandCode === 'B103') {
        // Nhiệt độ 4 zones lò nung
        responsePayload = Buffer.alloc(8);
        responsePayload.writeUInt16BE(Math.round((180 + Math.random() * 5) * 10), 0);
        responsePayload.writeUInt16BE(Math.round((220 + Math.random() * 3) * 10), 2);
        responsePayload.writeUInt16BE(Math.round((250 + Math.random() * 2) * 10), 4);
        responsePayload.writeUInt16BE(Math.round((150 + Math.random() * 4) * 10), 6);
      } else if (frame.commandCode === 'J203') {
        // Lực uốn kN
        responsePayload = Buffer.alloc(2);
        responsePayload.writeUInt16BE(Math.round((45.0 + Math.random() * 2) * 10), 0);
      }

      const respPacket = codec.encode(frame.deviceId, frame.serverNo, frame.commandCode, 0, responsePayload);
      socket.write(respPacket);
      console.log(`\x1b[32m[${name}] 📤 Phản hồi về MC Server: [${frame.commandCode} ACK]\x1b[0m`);
    });

    socket.on('close', () => {
      console.log(`\x1b[33m[${name}] ⚠️ MC Server ngắt kết nối\x1b[0m`);
    });

    socket.on('error', (err) => {
      console.log(`\x1b[31m[${name}] Socket error: ${err.message}\x1b[0m`);
    });
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`\x1b[34m[Giả Lập Thiết Bị]\x1b[0m Máy ảo \x1b[33m${name}\x1b[0m (${model}) đang lắng nghe tại \x1b[32m127.0.0.1:${port}\x1b[0m`);
  });
}

console.log(`
══════════════════════════════════════════════════════════════
 🤖 KHỞI ĐỘNG GIẢ LẬP PLC / MÁY SẢN XUẤT ẢO (MOCK EQUIPMENT)
══════════════════════════════════════════════════════════════
`);

createMockDevice('BAKE01', 5010, 'IBS_BAKE');
createMockDevice('BENDINGJ1', 5011, 'IBS_BENDINGJS');

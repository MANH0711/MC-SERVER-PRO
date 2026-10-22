import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as net from 'net';
import { EquipmentRepository } from '../database/equipment.repository';
import { CommunicationService } from './communication.service';
import { FrameCodec } from '../protocol/frame.codec';
import { DeviceService } from '../devices/device.service';

@Injectable()
export class TcpClientManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TcpClientManagerService.name);
  private sockets: Map<string, net.Socket> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private manuallyStoppedDevices: Set<string> = new Set();
  private heartbeatInterval?: NodeJS.Timeout;

  private lastActivityTimes: Map<string, number> = new Map();

  constructor(
    private readonly equipmentRepo: EquipmentRepository,
    private readonly commService: CommunicationService,
    private readonly frameCodec: FrameCodec,
    private readonly deviceService: DeviceService
  ) {}

  async onModuleInit() {
    this.logger.log('Khởi chạy TCP Client Manager tối ưu hóa tải 1.000 máy sản xuất...');
    await this.connectAllEnabledDevices();
    this.startHeartbeatLoop();
  }

  onModuleDestroy() {
    this.cleanup();
  }

  private async connectAllEnabledDevices() {
    const devices = await this.equipmentRepo.findAll();
    let index = 0;
    for (const d of devices) {
      if (d.ENABLE === 'YES' && d.HOST_ADDRESS && d.HOST_PORT) {
        if (!this.manuallyStoppedDevices.has(d.EQUIPMENT_ID)) {
          // Phân phối kết nối lệch pha (staggered delay) tránh dồn 1000 SYN packets vào cùng 1 thời điểm
          const delay = Math.min(index * 15, 5000);
          setTimeout(() => {
            if (!this.manuallyStoppedDevices.has(d.EQUIPMENT_ID)) {
              this.connectToDevice(d.EQUIPMENT_ID, d.HOST_ADDRESS, d.HOST_PORT);
            }
          }, delay);
          index++;
        }
      }
    }
  }

  public connectToDevice(equipmentId: string, host: string, port: number) {
    if (this.manuallyStoppedDevices.has(equipmentId)) {
      this.logger.debug(`[TCP] Bỏ qua kết nối [${equipmentId}] do thiết bị đang ở trạng thái Dừng (Stop)`);
      return;
    }

    // Đảm bảo không bao giờ mở 2 socket cùng lúc cho 1 thiết bị
    const existing = this.sockets.get(equipmentId);
    if (existing && !existing.destroyed) {
      return;
    }
    if (existing) {
      existing.removeAllListeners();
      this.sockets.delete(equipmentId);
    }

    this.deviceService.updateStatus(equipmentId, 'CONNECTING');

    const socket = new net.Socket();
    socket.setNoDelay(true); // Tắt thuật toán Nagle để gửi gói tin công nghiệp tức thời
    socket.setKeepAlive(true, 10000); // Kích hoạt TCP Keep-Alive chuẩn OS

    // Lưu socket vào map ngay lập tức để chặn các yêu cầu kết nối trùng lặp
    this.sockets.set(equipmentId, socket);

    socket.connect(port, host, () => {
      this.logger.log(`🟢 [TCP] Đã kết nối thành công thiết bị [${equipmentId}] tại ${host}:${port}`);
      this.lastActivityTimes.set(equipmentId, Date.now());
      this.deviceService.updateStatus(equipmentId, 'ONLINE');
      if (this.reconnectTimers.has(equipmentId)) {
        clearTimeout(this.reconnectTimers.get(equipmentId)!);
        this.reconnectTimers.delete(equipmentId);
      }
    });

    socket.on('data', async (chunk: Buffer) => {
      this.lastActivityTimes.set(equipmentId, Date.now());
      try {
        const responseBuffer = await this.commService.handleIncomingRawBuffer(equipmentId, chunk);
        if (responseBuffer && socket.writable && !socket.destroyed) {
          socket.write(responseBuffer);
          this.lastActivityTimes.set(equipmentId, Date.now());
        }
      } catch (err: any) {
        this.logger.error(`Lỗi xử lý dữ liệu từ ${equipmentId}: ${err.message}`);
      }
    });

    socket.on('error', (err: any) => {
      // Thiết bị offline hoặc chưa bật nguồn cổng TCP
      this.deviceService.updateStatus(equipmentId, 'OFFLINE');
      this.logger.debug(`[TCP Socket Error] ${equipmentId} (${host}:${port}): ${err.message}`);
    });

    socket.on('close', () => {
      socket.removeAllListeners();
      if (this.sockets.get(equipmentId) === socket) {
        this.sockets.delete(equipmentId);
      }
      this.deviceService.updateStatus(equipmentId, 'OFFLINE');
      if (!this.manuallyStoppedDevices.has(equipmentId)) {
        this.scheduleReconnect(equipmentId, host, port);
      } else {
        this.logger.debug(`[TCP] Thiết bị [${equipmentId}] đã Stop, hủy tự động kết nối lại.`);
      }
    });
  }

  private scheduleReconnect(equipmentId: string, host: string, port: number) {
    if (this.manuallyStoppedDevices.has(equipmentId)) {
      return;
    }
    if (this.reconnectTimers.has(equipmentId)) return;

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(equipmentId);
      if (!this.manuallyStoppedDevices.has(equipmentId)) {
        this.connectToDevice(equipmentId, host, port);
      }
    }, 15000);

    this.reconnectTimers.set(equipmentId, timer);
  }

  /**
   * Dừng kết nối thiết bị và hủy hoàn toàn chu trình tự động kết nối lại (Auto-Reconnect)
   */
  public stopDevice(equipmentId: string): boolean {
    this.manuallyStoppedDevices.add(equipmentId);

    // Hủy timer tự động kết nối lại nếu đang chạy
    if (this.reconnectTimers.has(equipmentId)) {
      clearTimeout(this.reconnectTimers.get(equipmentId)!);
      this.reconnectTimers.delete(equipmentId);
    }

    // Đóng Socket kết nối nếu đang mở
    const socket = this.sockets.get(equipmentId);
    if (socket) {
      socket.destroy();
      this.sockets.delete(equipmentId);
    }

    this.deviceService.updateStatus(equipmentId, 'OFFLINE');
    this.logger.log(`🛑 [TCP Stop] Đã dừng thiết bị [${equipmentId}], hủy Socket và tắt tự động kết nối lại.`);
    return true;
  }

  /**
   * Dừng toàn bộ thiết bị và hủy toàn bộ chu trình tự động kết nối lại
   */
  public stopAll(): number {
    let count = 0;
    for (const [eqId, timer] of this.reconnectTimers.entries()) {
      clearTimeout(timer);
      this.manuallyStoppedDevices.add(eqId);
      this.deviceService.updateStatus(eqId, 'OFFLINE');
      count++;
    }
    this.reconnectTimers.clear();

    for (const [eqId, socket] of this.sockets.entries()) {
      this.manuallyStoppedDevices.add(eqId);
      socket.destroy();
      this.deviceService.updateStatus(eqId, 'OFFLINE');
      count++;
    }
    this.sockets.clear();

    this.logger.log(`🛑 [TCP Stop All] Đã dừng và ngắt kết nối toàn bộ thiết bị.`);
    return count;
  }

  /**
   * Khởi động lại toàn bộ thiết bị, xóa cờ Stop và cho phép tự động kết nối lại
   */
  public async startAll(): Promise<number> {
    this.manuallyStoppedDevices.clear();
    await this.connectAllEnabledDevices();
    this.logger.log(`🟢 [TCP Start All] Đã kích hoạt lại toàn bộ thiết bị và bật kết nối lại.`);
    return this.getConnectedCount();
  }

  private startHeartbeatLoop() {
    this.heartbeatInterval = setInterval(async () => {
      const now = Date.now();
      // Chỉ ping Heartbeat cho các thiết bị không có dữ liệu giao dịch trong 30 giây qua
      for (const [eqId, socket] of this.sockets.entries()) {
        const lastAct = this.lastActivityTimes.get(eqId) || 0;
        if (socket.writable && now - lastAct >= 30000) {
          try {
            const pingBuffer = this.frameCodec.encode(0, 15, 'M001', 0);
            socket.write(pingBuffer);
            this.lastActivityTimes.set(eqId, now);
          } catch {
            // Socket lỗi sẽ được bắt qua error listener
          }
        }
      }
    }, 15000); // Quét định kỳ mỗi 15s để bắt kịp các socket idle
  }

  public async reconnect(equipmentId: string): Promise<boolean> {
    // Xóa cờ Stop thủ công khi người dùng yêu cầu kết nối lại
    this.manuallyStoppedDevices.delete(equipmentId);

    if (this.reconnectTimers.has(equipmentId)) {
      clearTimeout(this.reconnectTimers.get(equipmentId)!);
      this.reconnectTimers.delete(equipmentId);
    }
    const current = this.sockets.get(equipmentId);
    if (current) {
      current.removeAllListeners();
      current.destroy();
      this.sockets.delete(equipmentId);
    }

    const device = await this.equipmentRepo.findById(equipmentId);
    if (!device || !device.HOST_ADDRESS || !device.HOST_PORT) {
      this.logger.warn(`Không tìm thấy cấu hình IP/Port cho thiết bị [${equipmentId}]`);
      return false;
    }

    this.connectToDevice(equipmentId, device.HOST_ADDRESS, device.HOST_PORT);
    return true;
  }

  public writeBuffer(equipmentId: string, buffer: Buffer): boolean {
    const socket = this.sockets.get(equipmentId);
    if (socket && !socket.destroyed && socket.writable) {
      socket.write(buffer);
      return true;
    }
    return false;
  }

  public getConnectedCount(): number {
    let count = 0;
    for (const socket of this.sockets.values()) {
      if (socket && !socket.destroyed && socket.writable) count++;
    }
    return count;
  }

  public getSocketDetails(): { equipmentId: string; connected: boolean; pendingReconnect: boolean }[] {
    const details: { equipmentId: string; connected: boolean; pendingReconnect: boolean }[] = [];
    for (const [eqId, socket] of this.sockets.entries()) {
      details.push({
        equipmentId: eqId,
        connected: socket && !socket.destroyed && socket.writable,
        pendingReconnect: this.reconnectTimers.has(eqId),
      });
    }
    return details;
  }

  private cleanup() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    for (const timer of this.reconnectTimers.values()) clearTimeout(timer);
    for (const socket of this.sockets.values()) socket.destroy();
    this.sockets.clear();
  }
}

import { Controller, Get, Post, Param, Body, Query, Logger, Sse, MessageEvent } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommunicationService, ManualCommandDto } from './communication.service';
import { TcpClientManagerService } from './tcp-client-manager.service';

@Controller('api/communication')
export class CommunicationRestController {
  private readonly logger = new Logger(CommunicationRestController.name);

  constructor(
    private readonly commService: CommunicationService,
    private readonly tcpClientManager: TcpClientManagerService
  ) {}

  /**
   * Luồng dữ liệu Server-Sent Events (SSE) đẩy giao dịch tức thì (<50ms) tới Frontend
   */
  @SkipThrottle()
  @Sse('stream')
  streamTransactions(): Observable<MessageEvent> {
    return this.commService.getTransactionStream().pipe(
      map((tx) => ({
        data: tx,
      } as MessageEvent))
    );
  }

  /**
   * Lấy danh sách trạng thái kết nối TCP Socket (MC Server = Client, Thiết bị = Server)
   */
  @Get('sockets')
  getSocketStatus() {
    return {
      role: 'MC_SERVER_IS_TCP_CLIENT',
      totalActiveSockets: this.tcpClientManager.getConnectedCount(),
      sockets: this.tcpClientManager.getSocketDetails(),
    };
  }

  /**
   * Yêu cầu MC Server chủ động kết nối lại cổng TCP Server của một thiết bị cụ thể
   */
  @Post('reconnect/:equipmentId')
  async reconnectDevice(@Param('equipmentId') equipmentId: string) {
    this.logger.log(`Yêu cầu kết nối lại TCP Client -> Server của thiết bị [${equipmentId}]`);
    const success = await this.tcpClientManager.reconnect(equipmentId);
    return {
      equipmentId,
      connected: success,
      message: success
        ? `Đã kết nối thành công tới cổng TCP Server của máy ${equipmentId}`
        : `Không thể kết nối tới máy ${equipmentId} (Thiết bị chưa bật nguồn hoặc chưa mở port)`,
    };
  }

  /**
   * Yêu cầu dừng (Stop) thiết bị và hủy tự động kết nối lại (Auto-Reconnect)
   */
  @Post('stop/:equipmentId')
  stopDevice(@Param('equipmentId') equipmentId: string) {
    this.logger.log(`Yêu cầu Dừng (Stop) kết nối thiết bị [${equipmentId}]`);
    const success = this.tcpClientManager.stopDevice(equipmentId);
    return {
      equipmentId,
      stopped: success,
      message: `Đã dừng kết nối và tắt tự động kết nối lại cho máy ${equipmentId}`,
    };
  }

  /**
   * Dừng toàn bộ thiết bị và hủy toàn bộ chu trình tự động kết nối lại
   */
  @Post('stop-all')
  stopAllDevices() {
    this.logger.log(`Yêu cầu Dừng (Stop) toàn bộ kết nối thiết bị`);
    const count = this.tcpClientManager.stopAll();
    return {
      success: true,
      stoppedCount: count,
      message: `Đã dừng và ngắt kết nối toàn bộ thiết bị`,
    };
  }

  /**
   * Khởi động lại toàn bộ thiết bị và kích hoạt lại kết nối
   */
  @Post('start-all')
  async startAllDevices() {
    this.logger.log(`Yêu cầu Khởi động (Start) kết nối toàn bộ thiết bị`);
    const count = await this.tcpClientManager.startAll();
    return {
      success: true,
      connectedCount: count,
      message: `Đã khởi động lại kết nối toàn bộ thiết bị`,
    };
  }

  /**
   * Lấy danh sách các giao dịch thực tế gần nhất
   */
  @Get('transactions')
  async getTransactions(
    @Query('equipmentId') equipmentId?: string,
    @Query('commandCode') commandCode?: string,
    @Query('limit') limit = '50'
  ) {
    return await this.commService.getRecentTransactions(equipmentId, commandCode, parseInt(limit, 10));
  }

  /**
   * Gửi lệnh thủ công từ MC Server Client xuống TCP Server của thiết bị
   */
  @Post('manual-command')
  async sendManualCommand(@Body() body: ManualCommandDto) {
    return await this.commService.executeManualCommand(body);
  }
}

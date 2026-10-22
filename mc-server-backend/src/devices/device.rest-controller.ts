import { Controller, Get, Post, Delete, Param, Body, Logger } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceInfoDto } from './device.model';

@Controller('api/devices')
export class DeviceRestController {
  private readonly logger = new Logger(DeviceRestController.name);

  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  async getAllDevices(): Promise<DeviceInfoDto[]> {
    this.logger.debug('REST: Lấy danh sách thiết bị thật từ MIGHTY.GATEWAY_DEVICES');
    return await this.deviceService.getAllDevices();
  }

  @Get(':id')
  async getDeviceById(@Param('id') id: string): Promise<DeviceInfoDto | null> {
    return await this.deviceService.getDeviceById(id);
  }

  @Post('batch')
  async batchUpsertDevices(@Body() devices: DeviceInfoDto[]): Promise<DeviceInfoDto[]> {
    this.logger.log(`REST: Lưu hàng loạt ${devices.length} thiết bị vào MIGHTY.GATEWAY_DEVICES`);
    return await this.deviceService.batchUpsert(devices);
  }

  @Post()
  async upsertDevice(@Body() device: DeviceInfoDto): Promise<DeviceInfoDto> {
    this.logger.log(`REST: Lưu cấu hình thiết bị ${device.equipmentId} vào MIGHTY.GATEWAY_DEVICES`);
    return await this.deviceService.upsertDevice(device);
  }

  @Delete(':id')
  async deleteDevice(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`REST: Xóa thiết bị ${id} khỏi MIGHTY.GATEWAY_DEVICES`);
    const success = await this.deviceService.deleteDevice(id);
    return {
      success,
      message: success ? `Đã xóa thiết bị ${id}` : `Không thể xóa thiết bị ${id}`,
    };
  }
}

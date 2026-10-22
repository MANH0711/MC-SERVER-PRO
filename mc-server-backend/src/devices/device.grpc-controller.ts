import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { DeviceService } from './device.service';
import { DeviceInfoDto, DeviceStatusUpdateDto } from './device.model';

@Controller()
export class DeviceGrpcController {
  private readonly logger = new Logger(DeviceGrpcController.name);

  constructor(private readonly deviceService: DeviceService) {}

  @GrpcMethod('DeviceService', 'GetAllDevices')
  async getAllDevices(data: any): Promise<{ devices: DeviceInfoDto[]; totalCount: number }> {
    this.logger.debug('gRPC GetAllDevices called');
    const devices = await this.deviceService.getAllDevices();
    return {
      devices,
      totalCount: devices.length,
    };
  }

  @GrpcMethod('DeviceService', 'GetDeviceById')
  async getDeviceById(data: { equipmentId: string }): Promise<DeviceInfoDto> {
    const device = await this.deviceService.getDeviceById(data.equipmentId);
    if (!device) {
      throw new Error(`Device not found: ${data.equipmentId}`);
    }
    return device;
  }

  @GrpcMethod('DeviceService', 'UpsertDevice')
  async upsertDevice(data: DeviceInfoDto): Promise<DeviceInfoDto> {
    this.logger.log(`gRPC UpsertDevice: ${data.equipmentId} (${data.equipmentModel})`);
    return await this.deviceService.upsertDevice(data);
  }

  @GrpcMethod('DeviceService', 'DeleteDevice')
  async deleteDevice(data: { equipmentId: string }): Promise<{ success: boolean; message: string }> {
    const success = await this.deviceService.deleteDevice(data.equipmentId);
    return {
      success,
      message: success ? `Deleted ${data.equipmentId}` : 'Failed to delete device',
    };
  }

  @GrpcStreamMethod('DeviceService', 'StreamDeviceStatus')
  streamDeviceStatus(): Observable<DeviceStatusUpdateDto> {
    this.logger.log('Client connected to gRPC StreamDeviceStatus');
    return this.deviceService.getStatusStream();
  }
}

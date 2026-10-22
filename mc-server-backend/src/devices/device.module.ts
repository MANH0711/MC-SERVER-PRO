import { Module, Global } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceGrpcController } from './device.grpc-controller';
import { DeviceRestController } from './device.rest-controller';

@Global()
@Module({
  controllers: [DeviceGrpcController, DeviceRestController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DeviceModule {}

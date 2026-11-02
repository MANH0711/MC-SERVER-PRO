import { Module, Global } from '@nestjs/common';
import { DeviceFileLoggerService } from './device-file-logger.service';
import { DeviceLogsController } from './device-logs.controller';

@Global()
@Module({
  controllers: [DeviceLogsController],
  providers: [DeviceFileLoggerService],
  exports: [DeviceFileLoggerService],
})
export class DeviceLogsModule {}

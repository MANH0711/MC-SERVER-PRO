import { Module, Global } from '@nestjs/common';
import { AlarmService } from './alarm.service';
import { AlarmGrpcController } from './alarm.grpc-controller';

@Global()
@Module({
  controllers: [AlarmGrpcController],
  providers: [AlarmService],
  exports: [AlarmService],
})
export class AlarmModule {}

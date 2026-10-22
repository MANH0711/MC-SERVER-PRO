import { Module, Global } from '@nestjs/common';
import { SystemService } from './system.service';
import { SystemGrpcController } from './system.grpc-controller';
import { SystemRestController } from './system.rest-controller';

@Global()
@Module({
  controllers: [SystemGrpcController, SystemRestController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}

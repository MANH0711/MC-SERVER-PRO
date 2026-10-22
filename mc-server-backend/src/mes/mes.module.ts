import { Module, Global } from '@nestjs/common';
import { MesService } from './mes.service';
import { MesGrpcController } from './mes.grpc-controller';

@Global()
@Module({
  controllers: [MesGrpcController],
  providers: [MesService],
  exports: [MesService],
})
export class MesModule {}

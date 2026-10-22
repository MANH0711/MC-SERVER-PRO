import { Module, Global } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { TcpClientManagerService } from './tcp-client-manager.service';
import { CommunicationGrpcController } from './communication.grpc-controller';
import { CommunicationRestController } from './communication.rest-controller';
import { AuthorityModule } from '../authority/authority.module';

@Global()
@Module({
  imports: [AuthorityModule],
  controllers: [CommunicationGrpcController, CommunicationRestController],
  providers: [CommunicationService, TcpClientManagerService],
  exports: [CommunicationService, TcpClientManagerService],
})
export class CommunicationModule {}

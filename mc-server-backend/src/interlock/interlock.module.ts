import { Module, Global } from '@nestjs/common';
import { DieAttachService } from './die-attach.service';
import { DeviceChangeService } from './device-change.service';
import { ReflowService } from './reflow.service';
import { InterlockController } from './interlock.controller';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [InterlockController],
  providers: [DieAttachService, DeviceChangeService, ReflowService],
  exports: [DieAttachService, DeviceChangeService, ReflowService],
})
export class InterlockModule {}

import { Module, Global } from '@nestjs/common';
import { DieAttachService } from './die-attach.service';
import { InterlockController } from './interlock.controller';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [InterlockController],
  providers: [DieAttachService],
  exports: [DieAttachService],
})
export class InterlockModule {}

import { Module, Global } from '@nestjs/common';
import { DieAttachService } from './die-attach.service';
import { InterlockController } from './interlock.controller';
import { IlruleHistoryController } from './ilrule-history.controller';
import { IlruleHistoryService } from './ilrule-history.service';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [InterlockController, IlruleHistoryController],
  providers: [DieAttachService, IlruleHistoryService],
  exports: [DieAttachService, IlruleHistoryService],
})
export class InterlockModule {}

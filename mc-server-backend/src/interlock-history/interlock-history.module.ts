import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InterlockHistoryController } from './interlock-history.controller';
import { InterlockHistoryService } from './interlock-history.service';

@Module({
  imports: [DatabaseModule],
  controllers: [InterlockHistoryController],
  providers: [InterlockHistoryService],
  exports: [InterlockHistoryService],
})
export class InterlockHistoryModule {}

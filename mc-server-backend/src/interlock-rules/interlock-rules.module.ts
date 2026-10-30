import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InterlockRulesController } from './interlock-rules.controller';
import { InterlockRulesService } from './interlock-rules.service';

@Module({
  imports: [DatabaseModule],
  controllers: [InterlockRulesController],
  providers: [InterlockRulesService],
  exports: [InterlockRulesService],
})
export class InterlockRulesModule {}

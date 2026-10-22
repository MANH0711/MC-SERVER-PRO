import { Module, Global } from '@nestjs/common';
import { CommonCommandsModule } from './common/common-commands.module';
import { BakeCommandsModule } from './bake/bake-commands.module';
import { BendingCommandsModule } from './bending/bending-commands.module';
import { CommandDispatcher } from './router/command.dispatcher';

@Global()
@Module({
  imports: [
    CommonCommandsModule,
    BakeCommandsModule,
    BendingCommandsModule,
  ],
  providers: [CommandDispatcher],
  exports: [
    CommandDispatcher,
    CommonCommandsModule,
    BakeCommandsModule,
    BendingCommandsModule,
  ],
})
export class CommandsModule {}

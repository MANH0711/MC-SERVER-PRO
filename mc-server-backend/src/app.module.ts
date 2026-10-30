import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { ProtocolModule } from './protocol/protocol.module';
import { CommandsModule } from './commands/commands.module';
import { DeviceModule } from './devices/device.module';
import { CommunicationModule } from './communication/communication.module';
import { AlarmModule } from './alarms/alarm.module';
import { MesModule } from './mes/mes.module';
import { SystemModule } from './system/system.module';
import { AuthorityModule } from './authority/authority.module';
import { InterlockModule } from './interlock/interlock.module';
import { InterlockHistoryModule } from './interlock-history/interlock-history.module';
import { InterlockRulesModule } from './interlock-rules/interlock-rules.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // Bảo vệ hệ thống khỏi brute-force và spam request (Tối đa 150 request / 60 giây mỗi IP)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 150,
      },
    ]),
    DatabaseModule,
    ProtocolModule,
    CommandsModule,
    DeviceModule,
    CommunicationModule,
    AlarmModule,
    MesModule,
    SystemModule,
    AuthorityModule,
    InterlockModule,
    InterlockHistoryModule,
    InterlockRulesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

import { Module, Global } from '@nestjs/common';
import { OracleService } from './oracle.service';
import { EquipmentRepository } from './equipment.repository';
import { TransactionRepository } from './transaction.repository';
import { AlarmRepository } from './alarm.repository';

@Global()
@Module({
  providers: [
    OracleService,
    EquipmentRepository,
    TransactionRepository,
    AlarmRepository,
  ],
  exports: [
    OracleService,
    EquipmentRepository,
    TransactionRepository,
    AlarmRepository,
  ],
})
export class DatabaseModule {}

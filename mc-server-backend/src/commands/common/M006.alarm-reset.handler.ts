import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';
import { AlarmRepository } from '../../database/alarm.repository';

@Injectable()
export class M006AlarmResetHandler extends BaseCommandHandler {
  private readonly logger = new Logger(M006AlarmResetHandler.name);

  readonly commandCode = 'M006';
  readonly commandName = 'Alarm Reset & Clear';

  constructor(private readonly alarmRepo: AlarmRepository) {
    super();
  }

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    const alarmId = frame.payload.toString('utf-8').trim();
    this.logger.log(`[M006] Reset/giải tỏa cảnh báo cho máy: ${equipment.EQUIPMENT_ID} (AlarmId: ${alarmId || 'ALL'})`);

    if (alarmId) {
      await this.alarmRepo.clearAlarm(alarmId);
    }

    const responsePayload = Buffer.alloc(1);
    responsePayload.writeUInt8(0x06, 0); // ACK

    return {
      success: true,
      responsePayload,
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        alarmId: alarmId || 'ALL_CLEARED',
        resetAt: new Date().toISOString(),
      },
    };
  }
}

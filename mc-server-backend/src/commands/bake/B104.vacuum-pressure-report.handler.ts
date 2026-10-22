import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class B104VacuumPressureReportHandler extends BaseCommandHandler {
  private readonly logger = new Logger(B104VacuumPressureReportHandler.name);

  readonly commandCode = 'B104';
  readonly commandName = 'Bake Chamber Vacuum Pressure Report';
  readonly equipmentModel = 'IBS_BAKE';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    const pressurePa = frame.payload.length >= 4 ? frame.payload.readUInt32BE(0) : 101325;
    this.logger.debug(`[B104] [${equipment.EQUIPMENT_ID}] Áp suất buồng sấy: ${pressurePa} Pa`);

    return {
      success: true,
      responsePayload: Buffer.from([0x06]),
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        pressurePa,
        unit: 'Pascal',
        measuredAt: new Date().toISOString(),
      },
    };
  }
}

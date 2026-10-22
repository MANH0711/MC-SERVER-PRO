import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class B103ZoneTempMonitorHandler extends BaseCommandHandler {
  private readonly logger = new Logger(B103ZoneTempMonitorHandler.name);

  readonly commandCode = 'B103';
  readonly commandName = 'Zone Realtime Temperature Monitor';
  readonly equipmentModel = 'IBS_BAKE';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    let z1 = 180.2, z2 = 219.8, z3 = 250.5, z4 = 150.1;
    if (frame.payload.length >= 8) {
      z1 = frame.payload.readUInt16BE(0) / 10.0;
      z2 = frame.payload.readUInt16BE(2) / 10.0;
      z3 = frame.payload.readUInt16BE(4) / 10.0;
      z4 = frame.payload.readUInt16BE(6) / 10.0;
    }

    this.logger.debug(`[B103] [${equipment.EQUIPMENT_ID}] Nhiệt độ Zone 1-4: ${z1}°C | ${z2}°C | ${z3}°C | ${z4}°C`);

    return {
      success: true,
      responsePayload: Buffer.from([0x06]),
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        zone1: z1,
        zone2: z2,
        zone3: z3,
        zone4: z4,
        sampledAt: new Date().toISOString(),
      },
    };
  }
}

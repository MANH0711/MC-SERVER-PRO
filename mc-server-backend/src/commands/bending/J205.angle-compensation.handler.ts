import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class J205AngleCompensationHandler extends BaseCommandHandler {
  private readonly logger = new Logger(J205AngleCompensationHandler.name);

  readonly commandCode = 'J205';
  readonly commandName = 'Bending Springback Angle Compensation';
  readonly equipmentModel = 'IBS_BENDINGJS';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    const offsetDeg = frame.payload.length >= 2 ? frame.payload.readInt16BE(0) / 100.0 : 0.35;
    this.logger.log(`[J205] [${equipment.EQUIPMENT_ID}] Bù trừ góc đàn hồi (Springback): ${offsetDeg > 0 ? '+' : ''}${offsetDeg}°`);

    const responsePayload = Buffer.alloc(2);
    responsePayload.writeInt16BE(Math.round(offsetDeg * 100), 0);

    return {
      success: true,
      responsePayload,
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        offsetDeg,
        applied: true,
      },
    };
  }
}

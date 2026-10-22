import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class J204ToolingLifeCounterHandler extends BaseCommandHandler {
  private readonly logger = new Logger(J204ToolingLifeCounterHandler.name);

  readonly commandCode = 'J204';
  readonly commandName = 'Bending Tooling Life Counter';
  readonly equipmentModel = 'IBS_BENDINGJS';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    const currentHits = frame.payload.length >= 4 ? frame.payload.readUInt32BE(0) : 18540;
    const maxHits = 50000;
    const remainingHits = Math.max(0, maxHits - currentHits);

    this.logger.log(`[J204] [${equipment.EQUIPMENT_ID}] Tuổi thọ dao gá: ${currentHits}/${maxHits} (Còn lại ${remainingHits})`);

    return {
      success: true,
      responsePayload: Buffer.from([0x06]),
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        currentHits,
        maxHits,
        remainingHits,
        percentUsed: ((currentHits / maxHits) * 100).toFixed(1) + '%',
      },
    };
  }
}

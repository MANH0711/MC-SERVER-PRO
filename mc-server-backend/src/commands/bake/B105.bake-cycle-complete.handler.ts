import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class B105BakeCycleCompleteHandler extends BaseCommandHandler {
  private readonly logger = new Logger(B105BakeCycleCompleteHandler.name);

  readonly commandCode = 'B105';
  readonly commandName = 'Bake Heating Cycle Complete';
  readonly equipmentModel = 'IBS_BAKE';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    this.logger.log(`[B105] [${equipment.EQUIPMENT_ID}] 🎉 Hoàn thành chu kỳ nung sấy sản phẩm.`);

    return {
      success: true,
      responsePayload: Buffer.from([0x06]),
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        cycleStatus: 'COMPLETED',
        completedAt: new Date().toISOString(),
      },
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class B101TempProfileUploadHandler extends BaseCommandHandler {
  private readonly logger = new Logger(B101TempProfileUploadHandler.name);

  readonly commandCode = 'B101';
  readonly commandName = 'Bake Temperature Profile Upload';
  readonly equipmentModel = 'IBS_BAKE';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    this.logger.log(`[B101] [IBS_BAKE] Tải biểu đồ nhiệt từ máy nung: ${equipment.EQUIPMENT_ID}`);

    return {
      success: true,
      responsePayload: Buffer.from([0x06]),
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        equipmentModel: this.equipmentModel,
        zones: [
          { zone: 1, targetTemp: 180, rampRate: 5 },
          { zone: 2, targetTemp: 220, rampRate: 3 },
          { zone: 3, targetTemp: 250, rampRate: 2 },
          { zone: 4, targetTemp: 150, rampRate: -4 },
        ],
        uploadedAt: new Date().toISOString(),
      },
    };
  }
}

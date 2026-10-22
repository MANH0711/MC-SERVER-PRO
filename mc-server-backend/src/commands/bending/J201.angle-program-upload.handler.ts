import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class J201AngleProgramUploadHandler extends BaseCommandHandler {
  private readonly logger = new Logger(J201AngleProgramUploadHandler.name);

  readonly commandCode = 'J201';
  readonly commandName = 'Bending Angle Program Upload';
  readonly equipmentModel = 'IBS_BENDINGJS';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    this.logger.log(`[J201] [IBS_BENDINGJS] Máy uốn [${equipment.EQUIPMENT_ID}] tải lên chương trình góc uốn.`);

    return {
      success: true,
      responsePayload: Buffer.from([0x06]),
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        equipmentModel: this.equipmentModel,
        steps: [
          { step: 1, angleDeg: 90.0, speedMmS: 50 },
          { step: 2, angleDeg: 45.0, speedMmS: 30 },
          { step: 3, angleDeg: 120.0, speedMmS: 40 },
        ],
        uploadedAt: new Date().toISOString(),
      },
    };
  }
}

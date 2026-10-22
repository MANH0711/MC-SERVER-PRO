import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class B102TempProfileDownloadHandler extends BaseCommandHandler {
  private readonly logger = new Logger(B102TempProfileDownloadHandler.name);

  readonly commandCode = 'B102';
  readonly commandName = 'Bake Temperature Profile Download';
  readonly equipmentModel = 'IBS_BAKE';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    this.logger.log(`[B102] [IBS_BAKE] Nạp biểu đồ nhiệt chuẩn xuống lò nung: ${equipment.EQUIPMENT_ID}`);

    const configBuffer = Buffer.alloc(8);
    configBuffer.writeUInt16BE(180, 0); // Zone 1: 180°C
    configBuffer.writeUInt16BE(220, 2); // Zone 2: 220°C
    configBuffer.writeUInt16BE(250, 4); // Zone 3: 250°C
    configBuffer.writeUInt16BE(150, 6); // Zone 4: 150°C

    return {
      success: true,
      responsePayload: configBuffer,
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        equipmentModel: this.equipmentModel,
        status: 'PROFILE_LOADED',
        downloadedAt: new Date().toISOString(),
      },
    };
  }
}

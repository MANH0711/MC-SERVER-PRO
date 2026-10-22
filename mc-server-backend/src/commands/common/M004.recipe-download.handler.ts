import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class M004RecipeDownloadHandler extends BaseCommandHandler {
  private readonly logger = new Logger(M004RecipeDownloadHandler.name);

  readonly commandCode = 'M004';
  readonly commandName = 'Recipe Download (Server -> Machine)';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    const requestedRecipe = frame.payload.toString('utf-8').trim() || equipment.INTERLOCK_RECIPE;
    this.logger.log(`[M004] Nạp công thức [${requestedRecipe}] xuống máy [${equipment.EQUIPMENT_ID}]`);

    // Payload gửi xuống máy gồm: [Tên Recipe chuẩn] + [Checksum tham số]
    const recipeBuffer = Buffer.from(requestedRecipe, 'utf-8');
    const responsePayload = Buffer.alloc(recipeBuffer.length + 2);
    recipeBuffer.copy(responsePayload, 0);
    responsePayload.writeUInt16BE(0x1234, recipeBuffer.length); // Dummy Parameter checksum

    return {
      success: true,
      responsePayload,
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        recipeDownloaded: requestedRecipe,
        appliedInterlock: equipment.INTERLOCK_RECIPE,
        downloadedAt: new Date().toISOString(),
      },
    };
  }
}

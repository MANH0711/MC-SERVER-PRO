import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class M003RecipeUploadHandler extends BaseCommandHandler {
  private readonly logger = new Logger(M003RecipeUploadHandler.name);

  readonly commandCode = 'M003';
  readonly commandName = 'Recipe Upload (Machine -> Server)';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    // Đọc mã Recipe name từ payload (chuỗi UTF-8 hoặc ASCII)
    const recipeName = frame.payload.toString('utf-8').trim();
    this.logger.log(`[M003] Thiết bị [${equipment.EQUIPMENT_ID}] tải lên Recipe: "${recipeName}"`);

    // Phản hồi xác nhận lưu trữ Recipe thành công
    const responsePayload = Buffer.alloc(1);
    responsePayload.writeUInt8(0x06, 0); // ACK

    return {
      success: true,
      responsePayload,
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        recipeName,
        uploadedAt: new Date().toISOString(),
      },
    };
  }
}

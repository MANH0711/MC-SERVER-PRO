import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class M009TimeSyncHandler extends BaseCommandHandler {
  private readonly logger = new Logger(M009TimeSyncHandler.name);

  readonly commandCode = 'M009';
  readonly commandName = 'Time Synchronization (Server -> Machine)';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    const now = new Date();
    // Đóng gói ngày giờ chuẩn BCD hoặc 6 bytes (Năm-2000, Tháng, Ngày, Giờ, Phút, Giây)
    const timePayload = Buffer.alloc(6);
    timePayload.writeUInt8(now.getFullYear() - 2000, 0);
    timePayload.writeUInt8(now.getMonth() + 1, 1);
    timePayload.writeUInt8(now.getDate(), 2);
    timePayload.writeUInt8(now.getHours(), 3);
    timePayload.writeUInt8(now.getMinutes(), 4);
    timePayload.writeUInt8(now.getSeconds(), 5);

    this.logger.debug(`[M009] Đồng bộ thời gian cho máy [${equipment.EQUIPMENT_ID}]: ${now.toISOString()}`);

    return {
      success: true,
      responsePayload: timePayload,
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        syncedTime: now.toISOString(),
      },
    };
  }
}

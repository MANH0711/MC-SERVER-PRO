import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class M007LotTrackInHandler extends BaseCommandHandler {
  private readonly logger = new Logger(M007LotTrackInHandler.name);

  readonly commandCode = 'M007';
  readonly commandName = 'MES Lot Track-In (Start Lot)';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    const lotId = frame.payload.toString('utf-8').trim() || `LOT-${Date.now()}`;
    this.logger.log(`[M007] Lot Track-In: Máy [${equipment.EQUIPMENT_ID}] bắt đầu Lot: ${lotId}`);

    // Kiểm tra INTERLOCK_TRACE xem có bắt buộc kiểm tra Lot hợp lệ không
    let isApproved = true;
    let reason = 'APPROVED';

    if (equipment.INTERLOCK_TRACE === 'LOT_TRACE_EN' && !lotId.startsWith('LOT')) {
      isApproved = false;
      reason = 'INVALID_LOT_FORMAT';
    }

    const responsePayload = Buffer.alloc(4);
    responsePayload.writeUInt8(isApproved ? 0x06 : 0x15, 0); // 0x06 = ACK, 0x15 = NAK
    responsePayload.write(reason.substring(0, 3), 1, 3, 'ascii');

    return {
      success: isApproved,
      responsePayload,
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        lotId,
        isApproved,
        reason,
        trackInTime: new Date().toISOString(),
      },
    };
  }
}

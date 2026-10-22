import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class M001HeartbeatHandler extends BaseCommandHandler {
  private readonly logger = new Logger(M001HeartbeatHandler.name);

  readonly commandCode = 'M001';
  readonly commandName = 'Heartbeat Keep-Alive';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    this.logger.debug(`[M001] Nhận tín hiệu nhịp tim từ thiết bị: ${equipment.EQUIPMENT_ID}`);

    // Phản hồi Pong kèm timestamp hiện tại
    const responsePayload = Buffer.alloc(8);
    responsePayload.writeBigInt64BE(BigInt(Date.now()), 0);

    return {
      success: true,
      responsePayload,
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        pingReceivedAt: new Date().toISOString(),
        status: 'ALIVE',
      },
    };
  }
}

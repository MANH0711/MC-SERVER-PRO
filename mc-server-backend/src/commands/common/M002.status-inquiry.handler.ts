import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

export enum EquipmentStatus {
  STOP = 0,
  RUN = 1,
  IDLE = 2,
  ALARM = 3,
  MAINTENANCE = 4,
}

@Injectable()
export class M002StatusInquiryHandler extends BaseCommandHandler {
  private readonly logger = new Logger(M002StatusInquiryHandler.name);

  readonly commandCode = 'M002';
  readonly commandName = 'Status Inquiry & Report';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    let statusCode = EquipmentStatus.IDLE;
    if (frame.payload.length >= 1) {
      statusCode = frame.payload.readUInt8(0);
    }

    const statusName = EquipmentStatus[statusCode] || 'UNKNOWN';
    this.logger.log(`[M002] Thiết bị [${equipment.EQUIPMENT_ID}] báo cáo trạng thái: ${statusName} (${statusCode})`);

    // Phản hồi ACK mã trạng thái
    const responsePayload = Buffer.alloc(2);
    responsePayload.writeUInt8(0x06, 0); // ACK
    responsePayload.writeUInt8(statusCode, 1);

    return {
      success: true,
      responsePayload,
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        statusCode,
        statusName,
        reportedAt: new Date().toISOString(),
      },
    };
  }
}

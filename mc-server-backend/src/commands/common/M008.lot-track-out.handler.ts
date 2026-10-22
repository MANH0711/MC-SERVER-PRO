import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class M008LotTrackOutHandler extends BaseCommandHandler {
  private readonly logger = new Logger(M008LotTrackOutHandler.name);

  readonly commandCode = 'M008';
  readonly commandName = 'MES Lot Track-Out (Complete Lot)';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    let goodQty = 100;
    let defectQty = 0;

    if (frame.payload.length >= 4) {
      goodQty = frame.payload.readUInt16BE(0);
      defectQty = frame.payload.readUInt16BE(2);
    }

    const total = goodQty + defectQty;
    const yieldRate = total > 0 ? ((goodQty / total) * 100).toFixed(2) : '100.00';

    this.logger.log(`[M008] Lot Track-Out: Máy [${equipment.EQUIPMENT_ID}] Hoàn thành Lot. Good: ${goodQty}, Defect: ${defectQty}, Yield: ${yieldRate}%`);

    const responsePayload = Buffer.alloc(1);
    responsePayload.writeUInt8(0x06, 0); // ACK

    return {
      success: true,
      responsePayload,
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        goodQty,
        defectQty,
        yieldRate: `${yieldRate}%`,
        trackOutTime: new Date().toISOString(),
      },
    };
  }
}

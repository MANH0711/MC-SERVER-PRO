import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class J203BendingForceReportHandler extends BaseCommandHandler {
  private readonly logger = new Logger(J203BendingForceReportHandler.name);

  readonly commandCode = 'J203';
  readonly commandName = 'Bending Hydraulic Force Report';
  readonly equipmentModel = 'IBS_BENDINGJS';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    const forceKn = frame.payload.length >= 2 ? frame.payload.readUInt16BE(0) / 10.0 : 45.5;
    this.logger.debug(`[J203] [${equipment.EQUIPMENT_ID}] Lực ép uốn thực tế: ${forceKn} kN`);

    return {
      success: true,
      responsePayload: Buffer.from([0x06]),
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        forceKn,
        unit: 'KiloNewton',
        sampledAt: new Date().toISOString(),
      },
    };
  }
}

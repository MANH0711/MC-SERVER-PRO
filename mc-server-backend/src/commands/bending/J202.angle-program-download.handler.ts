import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class J202AngleProgramDownloadHandler extends BaseCommandHandler {
  private readonly logger = new Logger(J202AngleProgramDownloadHandler.name);

  readonly commandCode = 'J202';
  readonly commandName = 'Bending Angle Program Download';
  readonly equipmentModel = 'IBS_BENDINGJS';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    this.logger.log(`[J202] [IBS_BENDINGJS] Nạp chương trình uốn Jig chuẩn xuống máy: ${equipment.EQUIPMENT_ID}`);

    const programBuffer = Buffer.alloc(6);
    programBuffer.writeUInt16BE(900, 0); // 90.0 độ (* 10)
    programBuffer.writeUInt16BE(450, 2); // 45.0 độ
    programBuffer.writeUInt16BE(1200, 4); // 120.0 độ

    return {
      success: true,
      responsePayload: programBuffer,
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        equipmentModel: this.equipmentModel,
        status: 'BENDING_PROGRAM_DOWNLOADED',
        downloadedAt: new Date().toISOString(),
      },
    };
  }
}

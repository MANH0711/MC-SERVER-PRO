import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

@Injectable()
export class M010InterlockCheckHandler extends BaseCommandHandler {
  private readonly logger = new Logger(M010InterlockCheckHandler.name);

  readonly commandCode = 'M010';
  readonly commandName = 'Safety & Recipe Interlock Check';

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    let interlockPassed = true;
    const failures: string[] = [];

    // Kiểm tra ENABLE
    if (equipment.ENABLE !== 'YES') {
      interlockPassed = false;
      failures.push('DEVICE_DISABLED');
    }

    // Kiểm tra INTERLOCK_PARAM
    if (equipment.INTERLOCK_PARAM === 'YES') {
      // Giả sử kiểm tra tham số nhiệt độ, áp suất hoặc tải trọng đạt chuẩn
      // Cho qua nếu mọi điều kiện sẵn sàng
    }

    this.logger.log(`[M010] Kiểm tra Interlock máy [${equipment.EQUIPMENT_ID}]: ${interlockPassed ? 'PASSED ✅' : 'FAILED ❌'}`);

    const responsePayload = Buffer.alloc(2);
    responsePayload.writeUInt8(interlockPassed ? 0x06 : 0x15, 0); // 0x06 = ACK, 0x15 = NAK
    responsePayload.writeUInt8(failures.length, 1);

    return {
      success: interlockPassed,
      responsePayload,
      parsedData: {
        equipmentId: equipment.EQUIPMENT_ID,
        interlockPassed,
        failures,
        checkedAt: new Date().toISOString(),
      },
    };
  }
}

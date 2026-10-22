import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';
import { AlarmRepository } from '../../database/alarm.repository';

@Injectable()
export class M005AlarmReportHandler extends BaseCommandHandler {
  private readonly logger = new Logger(M005AlarmReportHandler.name);

  readonly commandCode = 'M005';
  readonly commandName = 'Alarm Report (Machine -> Server)';

  constructor(private readonly alarmRepo: AlarmRepository) {
    super();
  }

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    // Đọc Alarm Code từ payload (2 byte UInt16 hoặc chuỗi)
    let alarmCode = 'ERR_0001';
    let alarmLevel: 'WARNING' | 'ERROR' | 'CRITICAL' = 'ERROR';

    if (frame.payload.length >= 2) {
      const codeNum = frame.payload.readUInt16BE(0);
      alarmCode = `ALM_${codeNum.toString().padStart(4, '0')}`;
    }
    if (frame.payload.length >= 3) {
      const levelByte = frame.payload.readUInt8(2);
      if (levelByte === 1) alarmLevel = 'WARNING';
      else if (levelByte === 2) alarmLevel = 'ERROR';
      else if (levelByte === 3) alarmLevel = 'CRITICAL';
    }

    const alarmId = `ALM-${Date.now()}-${equipment.EQUIPMENT_ID}`;
    const alarmName = `Sự cố phát sinh trên máy ${equipment.EQUIPMENT_ID} (${alarmCode})`;

    this.logger.error(`[M005] 🚨 PHÁT HIỆN CẢNH BÁO: [${equipment.EQUIPMENT_ID}] Code: ${alarmCode} Level: ${alarmLevel}`);

    await this.alarmRepo.reportAlarm({
      alarmId,
      equipmentId: equipment.EQUIPMENT_ID,
      alarmCode,
      alarmName,
      alarmLevel,
      occurredAt: new Date().toISOString(),
      acknowledged: false,
    });

    // Phản hồi ACK xác nhận Server đã nhận diện sự cố
    const responsePayload = Buffer.alloc(1);
    responsePayload.writeUInt8(0x06, 0);

    return {
      success: true,
      responsePayload,
      parsedData: {
        alarmId,
        equipmentId: equipment.EQUIPMENT_ID,
        alarmCode,
        alarmLevel,
        alarmName,
      },
    };
  }
}

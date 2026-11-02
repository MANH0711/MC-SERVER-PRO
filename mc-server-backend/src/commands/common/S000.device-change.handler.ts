import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandHandler, CommandExecutionResult } from '../router/command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';
import { DeviceChangeService } from '../../interlock/device-change.service';

@Injectable()
export class S000DeviceChangeHandler extends BaseCommandHandler {
  private readonly logger = new Logger(S000DeviceChangeHandler.name);

  readonly commandCode = 'S000';
  readonly commandName = 'Device Change Config Inquiry (EIF-IR010)';
  // Không gán equipmentModel để áp dụng cho TẤT CẢ các model thiết bị (Universal Command)

  constructor(private readonly deviceChangeService: DeviceChangeService) {
    super();
  }

  async execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    const rawPayloadStr = frame.payload ? frame.payload.toString('ascii').trim() : '';

    // Bóc tách tên device: định dạng "SP4743D-N-A-BW^SEMI" hoặc ";SP4743D-N-A-BW^SEMI;"
    let cleanPayload = rawPayloadStr;
    if (cleanPayload.startsWith(';')) cleanPayload = cleanPayload.substring(1);
    if (cleanPayload.endsWith(';')) cleanPayload = cleanPayload.slice(0, -1);

    const tokens = cleanPayload.split('^');
    const deviceName = tokens[0]?.trim() || 'SP4743D-N-A-BW';
    const deviceType = tokens[1]?.trim() || 'SEMI';

    this.logger.log(
      `[S000] Yêu cầu kiểm tra Device Change cho máy [${equipment.EQUIPMENT_ID}] (Model: ${equipment.EQUIPMENT_MODEL || 'N/A'}), Device: "${deviceName}"`
    );

    const checkResult = await this.deviceChangeService.checkRuleIR010({
      plant: equipment.PLANT || 'ITMVIET',
      equipmentId: equipment.EQUIPMENT_ID,
      deviceName,
      deviceType,
    });

    const responseCode = checkResult.isValid ? 'EDVC001S' : 'EDVC001E';
    const responseText = checkResult.isValid
      ? 'OK^[EDVC001S] Device Change successfully completed.'
      : `NG^[EDVC001E] ${checkResult.errorMessage || 'Device Change check failed.'}`;

    const responsePayload = Buffer.from(responseText, 'ascii');

    return {
      success: checkResult.isValid,
      responsePayload,
      parsedData: {
        command: 'S000',
        responseCode,
        equipmentId: equipment.EQUIPMENT_ID,
        equipmentModel: equipment.EQUIPMENT_MODEL,
        deviceName,
        deviceType,
        ruleId: 'EIF-IR010',
        ruleKey: checkResult.ruleKey,
        activeFlag: checkResult.activeFlag,
        isValid: checkResult.isValid,
        errorMessage: checkResult.errorMessage,
        responseMessage: responseText,
        checkedAt: new Date().toISOString(),
      },
      errorMessage: checkResult.isValid ? undefined : checkResult.errorMessage,
    };
  }
}

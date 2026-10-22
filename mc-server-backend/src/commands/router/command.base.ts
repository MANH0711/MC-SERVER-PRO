import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';

export interface CommandExecutionResult {
  success: boolean;
  responsePayload?: Buffer;
  parsedData?: Record<string, any>;
  errorMessage?: string;
}

export abstract class BaseCommandHandler {
  abstract readonly commandCode: string;
  abstract readonly commandName: string;
  readonly equipmentModel?: string; // Optional: specified only for model-specific handlers

  abstract execute(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult>;
}

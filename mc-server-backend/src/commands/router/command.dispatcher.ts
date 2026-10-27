import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { BaseCommandHandler, CommandExecutionResult } from './command.base';
import { ProtocolFrame } from '../../protocol/frame.types';
import { EquipmentRecord } from '../../database/equipment.repository';
import { COMMON_COMMAND_HANDLERS } from '../common/common-commands.module';
import { BAKE_COMMAND_HANDLERS } from '../bake/bake-commands.module';
import { BENDING_COMMAND_HANDLERS } from '../bending/bending-commands.module';

@Injectable()
export class CommandDispatcher implements OnModuleInit {
  private readonly logger = new Logger(CommandDispatcher.name);
  private readonly handlersMap = new Map<string, BaseCommandHandler>();

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    const allHandlerClasses = [
      ...COMMON_COMMAND_HANDLERS,
      ...BAKE_COMMAND_HANDLERS,
      ...BENDING_COMMAND_HANDLERS,
    ];

    for (const handlerClass of allHandlerClasses) {
      try {
        const handlerInstance = this.moduleRef.get<BaseCommandHandler>(handlerClass, { strict: false });
        if (handlerInstance && handlerInstance.commandCode) {
          this.handlersMap.set(handlerInstance.commandCode, handlerInstance);
          this.logger.log(`📌 Đã đăng ký lệnh [${handlerInstance.commandCode}] - "${handlerInstance.commandName}" ${handlerInstance.equipmentModel ? `(Model: ${handlerInstance.equipmentModel})` : '(Chung)'}`);
        }
      } catch (err: any) {
        this.logger.error(`Không thể nạp handler ${handlerClass.name}: ${err.message}`);
      }
    }

    this.logger.log(`🚀 Tổng số mã lệnh đã sẵn sàng phục vụ: ${this.handlersMap.size}`);
  }

  async dispatch(
    frame: ProtocolFrame,
    equipment: EquipmentRecord
  ): Promise<CommandExecutionResult> {
    const handler = this.handlersMap.get(frame.commandCode);

    if (!handler) {
      this.logger.warn(`⚠️ Không tìm thấy handler xử lý cho mã lệnh: [${frame.commandCode}]`);
      return {
        success: false,
        errorMessage: `Mã lệnh này không tồn tại trong model thiết bị nào hãy kiểm tra lại thông tin`,
      };
    }

    // Kiểm tra tính tương thích thiết bị nếu lệnh là lệnh riêng
    if (handler.equipmentModel && handler.equipmentModel !== equipment.EQUIPMENT_MODEL) {
      this.logger.warn(`❌ Lệnh [${frame.commandCode}] chỉ dành cho model [${handler.equipmentModel}], máy hiện tại là [${equipment.EQUIPMENT_MODEL}]`);
      return {
        success: false,
        errorMessage: `Mã lệnh [${frame.commandCode}] không thuộc model [${equipment.EQUIPMENT_MODEL}] (Lệnh này thuộc model [${handler.equipmentModel}]). Mã lệnh này không tồn tại trong model thiết bị nào hãy kiểm tra lại thông tin`,
      };
    }

    try {
      return await handler.execute(frame, equipment);
    } catch (err: any) {
      this.logger.error(`Lỗi thực thi lệnh [${frame.commandCode}]: ${err.message}`, err.stack);
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }

  getRegisteredCommands(): { code: string; name: string; model?: string }[] {
    return Array.from(this.handlersMap.values()).map(h => ({
      code: h.commandCode,
      name: h.commandName,
      model: h.equipmentModel,
    }));
  }
}

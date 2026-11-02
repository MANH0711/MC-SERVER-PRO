import { Controller, Post, Body, Sse, MessageEvent } from '@nestjs/common';
import { DieAttachService, WorkInCheckResult } from './die-attach.service';
import { DeviceChangeService, DeviceChangeProcessResult } from './device-change.service';
import { Observable, map } from 'rxjs';

import { SimulateDeviceChangeDto, SimulateWorkInDto } from './dto';

@Controller('api/v1/interlock')
export class InterlockController {
  constructor(
    private readonly dieAttachService: DieAttachService,
    private readonly deviceChangeService: DeviceChangeService
  ) {}

  /**
   * Endpoint nhận và xử lý bản tin Device Change (S000 - Rule EIF-IR010)
   */
  @Post('device-change')
  async processDeviceChange(
    @Body() body: SimulateDeviceChangeDto
  ): Promise<DeviceChangeProcessResult | { error: string }> {
    let rawStr = body.rawMessage;

    if (!rawStr) {
      const eqp = (body.equipmentId || 'XNGM003').padEnd(10, ' ');
      const device = body.deviceName || 'SP4743D-N-A-BW';
      const type = body.deviceType || 'SEMI';
      const div = 'CONFIG        ';
      rawStr = `${eqp}S000${div};${device}^${type};${div}`;
    }

    const result = await this.deviceChangeService.processDeviceChangeMessage(
      rawStr,
      body.equipmentId,
      body.plant
    );
    if (!result) {
      return { error: 'Không thể phân tích hoặc xử lý bản tin Device Change (S000)' };
    }
    return result;
  }

  /**
   * Endpoint nhận và xử lý bản tin Work-In từ thiết bị Die Attach
   */
  @Post('work-in')
  async processWorkIn(@Body() body: SimulateWorkInDto): Promise<WorkInCheckResult | { error: string }> {
    let rawStr = body.rawMessage;

    if (!rawStr) {
      const eqp = body.equipmentId || 'CLEAN001';
      const lot = body.lotNumber || 'BC6430E';
      const oper = body.operation;
      const config = body.config || 'SSDB08R-B';
      const recipe = body.recipe || 'ITMRecipe';
      const pcb = body.pcbId || 'A3526169031004800260828';
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const time =
        body.transTime ||
        `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      const div = 'WORKIN        ';
      const jsonPayload = JSON.stringify({
        DATA: [
          {
            PCB_ID: pcb,
            AUTHORITY: 'No AUTHORITY',
            ID: 'No ID',
            LOT_NUMBER: lot,
            ...(oper ? { OPERATION: oper } : {}),
            EQUIPMENT: eqp,
            CONFIG: config,
            RECIPE: recipe,
            TRANS_TIME: time,
          },
        ],
      });

      rawStr = `${eqp} S050${div};${jsonPayload};${div}`;
    }

    const result = await this.dieAttachService.processWorkInMessage(rawStr, body.equipmentId, body.plant);
    if (!result) {
      return { error: 'Không thể phân tích hoặc xử lý bản tin Work-In' };
    }
    return result;
  }

  /**
   * SSE Stream cho các sự kiện kiểm tra Die Attach Work-In thời gian thực
   */
  @Sse('stream')
  streamEvents(): Observable<MessageEvent> {
    return this.dieAttachService.getWorkInStream().pipe(
      map((result) => ({
        data: result,
      }))
    );
  }
}

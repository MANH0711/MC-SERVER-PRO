import { Controller, Post, Body, Get, Sse, MessageEvent } from '@nestjs/common';
import { DieAttachService, WorkInCheckResult } from './die-attach.service';
import { Observable, map } from 'rxjs';

export interface SimulateWorkInDto {
  equipmentId?: string;
  lotNumber?: string;
  config?: string;
  recipe?: string;
  pcbId?: string;
  transTime?: string;
  rawMessage?: string;
}

@Controller('api/v1/interlock')
export class InterlockController {
  constructor(private readonly dieAttachService: DieAttachService) {}

  /**
   * Endpoint nhận và xử lý bản tin Work-In từ thiết bị Die Attach
   */
  @Post('work-in')
  async processWorkIn(@Body() body: SimulateWorkInDto): Promise<WorkInCheckResult | { error: string }> {
    let rawStr = body.rawMessage;

    if (!rawStr) {
      const eqp = body.equipmentId || 'CLEAN001';
      const lot = body.lotNumber || 'BC6430E';
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
            EQUIPMENT: eqp,
            CONFIG: config,
            RECIPE: recipe,
            TRANS_TIME: time,
          },
        ],
      });

      rawStr = `${eqp} S050${div};${jsonPayload};${div}`;
    }

    const result = await this.dieAttachService.processWorkInMessage(rawStr, body.equipmentId);
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

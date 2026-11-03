import { Controller, Post, Body, Sse, MessageEvent } from '@nestjs/common';
import { DieAttachService, WorkInCheckResult } from './die-attach.service';
import { DeviceChangeService, DeviceChangeProcessResult } from './device-change.service';
import { ReflowService, ReflowCheckResult } from './reflow.service';
import { Observable, map } from 'rxjs';

import { SimulateDeviceChangeDto, SimulateWorkInDto } from './dto';

@Controller('api/v1/interlock')
export class InterlockController {
  constructor(
    private readonly dieAttachService: DieAttachService,
    private readonly deviceChangeService: DeviceChangeService,
    private readonly reflowService: ReflowService
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
   * Endpoint nhận và xử lý bản tin Work-In từ thiết bị Die Attach (S050)
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
   * Endpoint nhận và xử lý bản tin Work-In từ thiết bị REFLOW (S090)
   */
  @Post('reflow-work-in')
  async processReflowWorkIn(
    @Body() body: any
  ): Promise<ReflowCheckResult | { error: string }> {
    let rawStr = body.rawMessage;

    if (!rawStr) {
      const eqp = body.equipmentId || 'REFLOW12A';
      const lot = body.lotNumber || '6412V';
      const oper = body.operation || '200';
      const config = body.config || 'SP4743C-N-A-BW';
      const recipe = body.recipe || 'ON3-ON4-LANE1-R01';
      const pcb = body.pcbId || 'B3626202040042400182325';
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const time =
        body.transTime ||
        `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      const div = 'WORKIN        ';
      const jsonPayload = JSON.stringify({
        DATA: [
          {
            REFLOW_START: time,
            P_CONVEYOR_SP: body.conveyorSpeed || '120.00',
            P_N2_PPM: body.n2Ppm || '1000',
            P_TEMP_TOP_Z1: body.tempTopZ1 || '150',
            P_TEMP_BOTTOM_Z1: body.tempBottomZ1 || '150',
            P_TEMP_TOP_Z2: body.tempTopZ2 || '160',
            P_TEMP_BOTTOM_Z2: body.tempBottomZ2 || '160',
            P_TEMP_TOP_Z3: body.tempTopZ3 || '170',
            P_TEMP_BOTTOM_Z3: body.tempBottomZ3 || '170',
            P_TEMP_TOP_Z4: body.tempTopZ4 || '180',
            P_TEMP_BOTTOM_Z4: body.tempBottomZ4 || '180',
            P_TEMP_TOP_Z5: body.tempTopZ5 || '190',
            P_TEMP_BOTTOM_Z5: body.tempBottomZ5 || '190',
            P_TEMP_TOP_Z6: body.tempTopZ6 || '200',
            P_TEMP_BOTTOM_Z6: body.tempBottomZ6 || '200',
            P_TEMP_TOP_Z7: body.tempTopZ7 || '210',
            P_TEMP_BOTTOM_Z7: body.tempBottomZ7 || '210',
            P_TEMP_TOP_Z8: body.tempTopZ8 || '210',
            P_TEMP_BOTTOM_Z8: body.tempBottomZ8 || '210',
            P_TEMP_TOP_Z9: body.tempTopZ9 || '220',
            P_TEMP_BOTTOM_Z9: body.tempBottomZ9 || '220',
            P_TEMP_TOP_Z10: body.tempTopZ10 || '245',
            P_TEMP_BOTTOM_Z10: body.tempBottomZ10 || '245',
            P_TEMP_TOP_Z11: body.tempTopZ11 || '295',
            P_TEMP_BOTTOM_Z11: body.tempBottomZ11 || '295',
            P_TEMP_TOP_Z12: body.tempTopZ12 || '295',
            P_TEMP_BOTTOM_Z12: body.tempBottomZ12 || '295',
            P_TEMP_TOP_Z13: body.tempTopZ13 || '240',
            P_TEMP_BOTTOM_Z13: body.tempBottomZ13 || '240',
            P_TEMP_TOP_C1: body.tempTopC1 || '130',
            P_TEMP_BOTTOM_C1: body.tempBottomC1 || '0',
            AUTHORITY: body.authority || 'OP',
            ID: body.userId || 'VM3193023',
            LOT_NUMBER: lot,
            EQUIPMENT: eqp,
            CONFIG: config,
            TRANS_TIME: time,
            PCB_ID: pcb,
            RECIPE: recipe,
            ...(oper ? { OPERATION: oper } : {}),
          },
        ],
      });

      rawStr = `${eqp}S090${div};${jsonPayload};${div}`;
    }

    const result = await this.reflowService.processReflowMessage(rawStr, body.equipmentId, body.plant);
    if (!result) {
      return { error: 'Không thể phân tích hoặc xử lý bản tin REFLOW (S090)' };
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

  /**
   * SSE Stream cho các sự kiện kiểm tra REFLOW Work-In thời gian thực
   */
  @Sse('reflow-stream')
  streamReflowEvents(): Observable<MessageEvent> {
    return this.reflowService.getReflowStream().pipe(
      map((result) => ({
        data: result,
      }))
    );
  }
}

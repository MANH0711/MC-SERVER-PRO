import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { AlarmService } from './alarm.service';
import { AlarmEntity } from '../database/alarm.repository';

@Controller()
export class AlarmGrpcController {
  private readonly logger = new Logger(AlarmGrpcController.name);

  constructor(private readonly alarmService: AlarmService) {}

  @GrpcMethod('AlarmService', 'GetActiveAlarms')
  getActiveAlarms(): { alarms: AlarmEntity[]; totalCount: number } {
    const alarms = this.alarmService.getActiveAlarms();
    return {
      alarms,
      totalCount: alarms.length,
    };
  }

  @GrpcMethod('AlarmService', 'AcknowledgeAlarm')
  async acknowledgeAlarm(data: {
    alarmId: string;
    operatorId: string;
  }): Promise<{ success: boolean; message: string }> {
    const success = await this.alarmService.acknowledgeAlarm(data.alarmId, data.operatorId);
    return {
      success,
      message: success ? `Alarm ${data.alarmId} acknowledged` : 'Alarm not found',
    };
  }

  @GrpcStreamMethod('AlarmService', 'StreamAlarms')
  streamAlarms(): Observable<AlarmEntity> {
    this.logger.log('Client kết nối gRPC StreamAlarms');
    return this.alarmService.getAlarmStream();
  }
}

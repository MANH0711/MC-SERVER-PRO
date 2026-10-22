import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { AlarmRepository, AlarmEntity } from '../database/alarm.repository';

@Injectable()
export class AlarmService {
  private readonly logger = new Logger(AlarmService.name);
  private readonly alarmStream$ = new Subject<AlarmEntity>();

  constructor(private readonly alarmRepo: AlarmRepository) {}

  getActiveAlarms(): AlarmEntity[] {
    return this.alarmRepo.getActiveAlarms();
  }

  getAlarmHistory(limit = 100): AlarmEntity[] {
    return this.alarmRepo.getAlarmHistory(limit);
  }

  async acknowledgeAlarm(alarmId: string, operatorId: string): Promise<boolean> {
    this.logger.log(`Acknowledge cảnh báo [${alarmId}] bởi [${operatorId}]`);
    return await this.alarmRepo.acknowledge(alarmId, operatorId);
  }

  getAlarmStream(): Observable<AlarmEntity> {
    return this.alarmStream$.asObservable();
  }

  notifyNewAlarm(alarm: AlarmEntity) {
    this.alarmStream$.next(alarm);
  }
}

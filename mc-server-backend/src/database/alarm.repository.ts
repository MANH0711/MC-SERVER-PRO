import { Injectable, Logger } from '@nestjs/common';
import { OracleService } from './oracle.service';

export interface AlarmEntity {
  alarmId: string;
  equipmentId: string;
  alarmCode: string;
  alarmName: string;
  alarmLevel: 'WARNING' | 'ERROR' | 'CRITICAL';
  occurredAt: string;
  clearedAt?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

@Injectable()
export class AlarmRepository {
  private readonly logger = new Logger(AlarmRepository.name);
  private activeAlarms: Map<string, AlarmEntity> = new Map();
  private alarmHistory: AlarmEntity[] = [];

  constructor(private readonly oracleService: OracleService) {}

  async reportAlarm(alarm: AlarmEntity): Promise<void> {
    this.activeAlarms.set(alarm.alarmId, alarm);
    this.alarmHistory.unshift(alarm);

    if (!this.oracleService.isUsingFallback()) {
      try {
        const sql = `
          INSERT INTO MC_ALARM_HISTORY (
            ALARM_ID, EQUIPMENT_ID, ALARM_CODE, ALARM_NAME, 
            ALARM_LEVEL, OCCURRED_AT, ACKNOWLEDGED
          ) VALUES (
            :alarmId, :equipmentId, :alarmCode, :alarmName, 
            :alarmLevel, TO_TIMESTAMP(:occurredAt, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'), 0
          )
        `;
        await this.oracleService.executeDml(sql, alarm);
      } catch (err: any) {
        this.logger.debug(`Không thể lưu alarm vào Oracle: ${err.message}`);
      }
    }
  }

  async acknowledge(alarmId: string, operatorId: string): Promise<boolean> {
    const alarm = this.activeAlarms.get(alarmId);
    if (alarm) {
      alarm.acknowledged = true;
      alarm.acknowledgedBy = operatorId;
      return true;
    }
    return false;
  }

  async clearAlarm(alarmId: string): Promise<boolean> {
    const alarm = this.activeAlarms.get(alarmId);
    if (alarm) {
      alarm.clearedAt = new Date().toISOString();
      this.activeAlarms.delete(alarmId);
      return true;
    }
    return false;
  }

  getActiveAlarms(): AlarmEntity[] {
    return Array.from(this.activeAlarms.values());
  }

  getAlarmHistory(limit = 100): AlarmEntity[] {
    return this.alarmHistory.slice(0, limit);
  }
}

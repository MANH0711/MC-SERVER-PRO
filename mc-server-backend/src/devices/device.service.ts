import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { EquipmentRepository, EquipmentRecord } from '../database/equipment.repository';
import { DeviceInfoDto, DeviceStatusUpdateDto } from './device.model';

@Injectable()
export class DeviceService implements OnModuleInit {
  private readonly logger = new Logger(DeviceService.name);
  private readonly statusSubject = new Subject<DeviceStatusUpdateDto>();
  private readonly deviceStatusMap = new Map<string, { status: string; lastActive: string }>();

  constructor(private readonly equipmentRepo: EquipmentRepository) {}

  async onModuleInit() {
    const list = await this.equipmentRepo.findAll();
    for (const eq of list) {
      this.deviceStatusMap.set(eq.EQUIPMENT_ID, {
        status: 'OFFLINE',
        lastActive: new Date().toISOString(),
      });
    }
  }

  async getAllDevices(): Promise<DeviceInfoDto[]> {
    const records = await this.equipmentRepo.findAll();
    return records.map(r => this.mapRecordToDto(r));
  }

  async getDeviceById(equipmentId: string): Promise<DeviceInfoDto | null> {
    const record = await this.equipmentRepo.findById(equipmentId);
    return record ? this.mapRecordToDto(record) : null;
  }

  async upsertDevice(dto: DeviceInfoDto): Promise<DeviceInfoDto> {
    const record = this.mapDtoToRecord(dto);
    const saved = await this.equipmentRepo.upsert(record);
    this.updateStatus(saved.EQUIPMENT_ID, saved.ENABLE === 'YES' ? 'ONLINE' : 'OFFLINE');
    return this.mapRecordToDto(saved);
  }

  async deleteDevice(equipmentId: string): Promise<boolean> {
    const res = await this.equipmentRepo.delete(equipmentId);
    this.deviceStatusMap.delete(equipmentId);
    return res;
  }

  updateStatus(equipmentId: string, status: string) {
    const lastActive = new Date().toISOString();
    this.deviceStatusMap.set(equipmentId, { status, lastActive });

    this.statusSubject.next({
      equipmentId,
      status,
      lastActiveTime: lastActive,
      cpuUsagePercent: Math.floor(Math.random() * 25) + 10,
      memoryUsagePercent: Math.floor(Math.random() * 20) + 35,
    });
  }

  getStatusStream(): Observable<DeviceStatusUpdateDto> {
    return this.statusSubject.asObservable();
  }

  async batchUpsert(dtos: any[]): Promise<DeviceInfoDto[]> {
    const results: DeviceInfoDto[] = [];
    for (const dto of dtos) {
      const saved = await this.upsertDevice(dto);
      results.push(saved);
    }
    return results;
  }

  private mapRecordToDto(r: EquipmentRecord): DeviceInfoDto {
    const runtime = this.deviceStatusMap.get(r.EQUIPMENT_ID);
    return {
      plant: r.PLANT,
      hostAddress: r.HOST_ADDRESS,
      hostPort: r.HOST_PORT,
      deviceId: r.DEVICE_ID,
      serverNo: r.SERVER_NO,
      equipmentId: r.EQUIPMENT_ID,
      groupName: r.GROUP_NAME,
      equipmentOrder: r.EQUIPMENT_ORDER,
      equipmentMain: r.EQUIPMENT_MAIN || '',
      description: r.DESCRIPTION || '',
      enable: r.ENABLE,
      field01: r.FIELD_01 || '',
      field02: r.FIELD_02 || '',
      field03: r.FIELD_03 || '',
      interlockRecipe: r.INTERLOCK_RECIPE || '',
      equipmentModel: r.EQUIPMENT_MODEL,
      interlockParam: r.INTERLOCK_PARAM || '',
      interlockTrace: r.INTERLOCK_TRACE || '',
      status: runtime?.status || 'OFFLINE',
      lastActiveTime: runtime?.lastActive || new Date().toISOString(),
    };
  }

  private mapDtoToRecord(d: any): EquipmentRecord {
    return {
      PLANT: d.PLANT || d.plant || 'ITMVPSG',
      HOST_ADDRESS: d.HOST_ADDRESS || d.hostAddress || '127.0.0.1',
      HOST_PORT: Number(d.HOST_PORT || d.hostPort) || 5010,
      DEVICE_ID: String(d.DEVICE_ID !== undefined ? d.DEVICE_ID : d.deviceId !== undefined ? d.deviceId : '0'),
      SERVER_NO: Number(d.SERVER_NO || d.serverNo) || 15,
      EQUIPMENT_ID: d.EQUIPMENT_ID || d.equipmentId || '',
      GROUP_NAME: d.GROUP_NAME || d.groupName || 'NET',
      EQUIPMENT_ORDER: Number(d.EQUIPMENT_ORDER !== undefined ? d.EQUIPMENT_ORDER : d.equipmentOrder) || 20110,
      EQUIPMENT_MAIN: d.EQUIPMENT_MAIN || d.equipmentMain || '',
      DESCRIPTION: d.DESCRIPTION || d.description || '',
      ENABLE: d.ENABLE || d.enable || 'YES',
      FIELD_01: d.FIELD_01 || d.field01 || '',
      FIELD_02: d.FIELD_02 || d.field02 || '',
      FIELD_03: d.FIELD_03 || d.field03 || '',
      INTERLOCK_RECIPE: d.INTERLOCK_RECIPE || d.interlockRecipe || 'ITMVIET',
      EQUIPMENT_MODEL: d.EQUIPMENT_MODEL || d.equipmentModel || '',
      INTERLOCK_PARAM: d.INTERLOCK_PARAM || d.interlockParam || 'YES',
      INTERLOCK_TRACE: d.INTERLOCK_TRACE || d.interlockTrace || '',
    };
  }
}

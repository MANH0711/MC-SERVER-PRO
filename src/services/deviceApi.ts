/**
 * Device REST API Client
 * Connects directly to mc-server-backend NestJS REST API
 * Syncs real device master data with Oracle table MIGHTY.GATEWAY_DEVICES
 */

import { DeviceModel, DeviceInfoRecord } from '../types';
import { recordToDevice, deviceToRecord } from '../utils/deviceFormat';

const BACKEND_BASE_URL = 'http://localhost:3005';

export interface DeviceDto {
  plant: string;
  hostAddress: string;
  hostPort: number;
  deviceId: string | number;
  serverNo: number;
  equipmentId: string;
  groupName: string;
  equipmentOrder: number;
  equipmentMain: string;
  description: string;
  enable: string;
  field01: string;
  field02: string;
  field03: string;
  interlockRecipe: string;
  equipmentModel: string;
  interlockParam: string;
  interlockTrace: string;
  status?: string;
  lastActiveTime?: string;
}

/**
 * Converts backend DTO / Oracle Record to Frontend DeviceModel
 */
export function dtoToDevice(dto: any): DeviceModel {
  const rec: Partial<DeviceInfoRecord> = {
    PLANT: dto.PLANT || dto.plant || 'ITMVPSG',
    HOST_ADDRESS: dto.HOST_ADDRESS || dto.hostAddress || '127.0.0.1',
    HOST_PORT: Number(dto.HOST_PORT || dto.hostPort) || 5010,
    DEVICE_ID: dto.DEVICE_ID !== undefined ? dto.DEVICE_ID : dto.deviceId !== undefined ? dto.deviceId : '0',
    SERVER_NO: dto.SERVER_NO !== undefined ? dto.SERVER_NO : dto.serverNo !== undefined ? dto.serverNo : '15',
    EQUIPMENT_ID: dto.EQUIPMENT_ID || dto.equipmentId || '',
    GROUP_NAME: dto.GROUP_NAME || dto.groupName || 'NET',
    EQUIPMENT_ORDER: dto.EQUIPMENT_ORDER !== undefined ? dto.EQUIPMENT_ORDER : dto.equipmentOrder !== undefined ? dto.equipmentOrder : 20110,
    EQUIPMENT_MAIN: dto.EQUIPMENT_MAIN || dto.equipmentMain || '',
    DESCRIPTION: dto.DESCRIPTION || dto.description || '',
    ENABLE: dto.ENABLE || dto.enable || 'YES',
    FIELD_01: dto.FIELD_01 || dto.field01 || '',
    FIELD_02: dto.FIELD_02 || dto.field02 || '',
    FIELD_03: dto.FIELD_03 || dto.field03 || '',
    INTERLOCK_RECIPE: dto.INTERLOCK_RECIPE || dto.interlockRecipe || 'ITMVIET',
    EQUIPMENT_MODEL: dto.EQUIPMENT_MODEL || dto.equipmentModel || '',
    INTERLOCK_PARAM: dto.INTERLOCK_PARAM || dto.interlockParam || 'YES',
    INTERLOCK_TRACE: dto.INTERLOCK_TRACE || dto.interlockTrace || '',
  };

  const dev = recordToDevice(rec);
  if (dto.status) {
    if (dto.status === 'ONLINE') {
      dev.status = 'Ready';
    } else if (dto.status === 'CONNECTING') {
      dev.status = 'Connecting';
    } else {
      dev.status = 'Disconnected';
    }
  } else {
    dev.status = 'Disconnected';
  }
  return dev;
}

/**
 * Converts frontend DeviceModel to backend DTO / Oracle MIGHTY.GATEWAY_DEVICES payload
 */
export function deviceToDto(dev: DeviceModel): DeviceDto {
  const rec = deviceToRecord(dev);
  return {
    plant: rec.PLANT,
    hostAddress: rec.HOST_ADDRESS,
    hostPort: Number(rec.HOST_PORT) || 5010,
    deviceId: rec.DEVICE_ID,
    serverNo: Number(rec.SERVER_NO) || 15,
    equipmentId: rec.EQUIPMENT_ID,
    groupName: rec.GROUP_NAME,
    equipmentOrder: Number(rec.EQUIPMENT_ORDER) || 20110,
    equipmentMain: rec.EQUIPMENT_MAIN || '',
    description: rec.DESCRIPTION || '',
    enable: rec.ENABLE,
    field01: rec.FIELD_01 || '',
    field02: rec.FIELD_02 || '',
    field03: rec.FIELD_03 || '',
    interlockRecipe: rec.INTERLOCK_RECIPE || 'ITMVIET',
    equipmentModel: rec.EQUIPMENT_MODEL || '',
    interlockParam: rec.INTERLOCK_PARAM || 'YES',
    interlockTrace: rec.INTERLOCK_TRACE || '',
  };
}

export const deviceApi = {
  /**
   * Fetch real device master records from MIGHTY.GATEWAY_DEVICES via NestJS REST API
   */
  async fetchDevices(): Promise<DeviceModel[]> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/devices`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map(dtoToDevice);
    } catch (err: any) {
      console.warn(`[deviceApi] fetchDevices failed: ${err.message}`);
      return [];
    }
  },

  /**
   * Upsert a device to MIGHTY.GATEWAY_DEVICES
   */
  async saveDevice(dev: DeviceModel): Promise<DeviceModel | null> {
    try {
      const payload = deviceToDto(dev);
      const res = await fetch(`${BACKEND_BASE_URL}/api/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const saved = await res.json();
      return dtoToDevice(saved);
    } catch (err: any) {
      console.error(`[deviceApi] saveDevice failed: ${err.message}`);
      return null;
    }
  },

  /**
   * Batch upsert devices to MIGHTY.GATEWAY_DEVICES
   */
  async batchSaveDevices(devices: DeviceModel[]): Promise<DeviceModel[]> {
    try {
      const payload = devices.map(deviceToDto);
      const res = await fetch(`${BACKEND_BASE_URL}/api/devices/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const saved = await res.json();
      return Array.isArray(saved) ? saved.map(dtoToDevice) : [];
    } catch (err: any) {
      console.error(`[deviceApi] batchSaveDevices failed: ${err.message}`);
      return [];
    }
  },

  /**
   * Delete device from MIGHTY.GATEWAY_DEVICES
   */
  async deleteDevice(equipmentId: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/devices/${encodeURIComponent(equipmentId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const data = await res.json();
      return data.success === true;
    } catch (err: any) {
      console.error(`[deviceApi] deleteDevice failed: ${err.message}`);
      return false;
    }
  },
};

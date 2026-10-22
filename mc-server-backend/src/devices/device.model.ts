export interface DeviceInfoDto {
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

export interface DeviceStatusUpdateDto {
  equipmentId: string;
  status: string;
  lastActiveTime: string;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
}

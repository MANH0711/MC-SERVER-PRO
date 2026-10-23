import { DeviceModel, DeviceInfoRecord } from '@/core/types';

export const DEVICE_INFO_COLUMNS = [
  'PLANT',
  'HOST_ADDRESS',
  'HOST_PORT',
  'DEVICE_ID',
  'SERVER_NO',
  'EQUIPMENT_ID',
  'GROUP_NAME',
  'EQUIPMENT_ORDER',
  'EQUIPMENT_MAIN',
  'DESCRIPTION',
  'ENABLE',
  'FIELD_01',
  'FIELD_02',
  'FIELD_03',
  'INTERLOCK_RECIPE',
  'EQUIPMENT_MODEL',
  'INTERLOCK_PARAM',
  'INTERLOCK_TRACE',
] as const;

export type DeviceInfoColumnName = (typeof DEVICE_INFO_COLUMNS)[number];

/**
 * Converts a DeviceModel into a standard 18-column DeviceInfoRecord
 */
export function deviceToRecord(dev: DeviceModel): DeviceInfoRecord {
  return {
    PLANT: dev.plant || dev.factory || 'ITMVPSG',
    HOST_ADDRESS: dev.hostAddress || dev.ipAddress || '127.0.0.1',
    HOST_PORT: dev.hostPort || dev.port || 5010,
    DEVICE_ID: dev.deviceId !== undefined ? dev.deviceId : '0',
    SERVER_NO: dev.serverNo !== undefined ? dev.serverNo : '15',
    EQUIPMENT_ID: dev.equipmentId || dev.id,
    GROUP_NAME: dev.groupName || dev.groupId || 'NET',
    EQUIPMENT_ORDER: dev.equipmentOrder !== undefined ? dev.equipmentOrder : 20110,
    EQUIPMENT_MAIN: dev.equipmentMain || '',
    DESCRIPTION: dev.description || dev.name || '',
    ENABLE: dev.enable || (dev.enabled ? 'YES' : 'NO'),
    FIELD_01: dev.field01 || '',
    FIELD_02: dev.field02 || '',
    FIELD_03: dev.field03 || '',
    INTERLOCK_RECIPE: dev.interlockRecipe || 'YES',
    EQUIPMENT_MODEL: dev.equipmentModel || dev.model || '',
    INTERLOCK_PARAM: dev.interlockParam || '',
    INTERLOCK_TRACE: dev.interlockTrace || '',
  };
}

/**
 * Creates or updates a DeviceModel from a partial DeviceInfoRecord
 */
export function recordToDevice(
  rec: Partial<DeviceInfoRecord>,
  existing?: Partial<DeviceModel>
): DeviceModel {
  const equipId = (rec.EQUIPMENT_ID || existing?.id || `EQP_${Date.now()}`).trim();
  const hostAddr = (rec.HOST_ADDRESS || existing?.ipAddress || '127.0.0.1').trim();
  const hostPort = Number(rec.HOST_PORT || existing?.port || 5010);
  const group = (rec.GROUP_NAME || existing?.groupId || 'NET').trim();
  const plant = (rec.PLANT || existing?.factory || 'ITMVPSG').trim();
  const model = (rec.EQUIPMENT_MODEL || existing?.model || equipId).trim();
  const isEnabled = (rec.ENABLE || (existing?.enabled ? 'YES' : 'NO')).trim().toUpperCase() === 'YES';

  return {
    id: equipId,
    name: rec.DESCRIPTION?.trim() || existing?.name || `${equipId} - ${model}`,
    factory: plant,
    line: group,
    station: equipId,
    groupId: group,
    model: model,
    ipAddress: hostAddr,
    port: hostPort,
    role: existing?.role || 'CLIENT',
    protocolVersion: existing?.protocolVersion || 'v2.0-Extended20014',
    frameBoundary: existing?.frameBoundary || '20014_EXTENDED',
    checksumAlgorithm: existing?.checksumAlgorithm || 'LRC_MOD256',
    status: existing?.status || 'Disconnected',

    // 18-column Master Schema
    plant: plant,
    hostAddress: hostAddr,
    hostPort: hostPort,
    deviceId: rec.DEVICE_ID !== undefined ? rec.DEVICE_ID : existing?.deviceId !== undefined ? existing.deviceId : '0',
    serverNo: rec.SERVER_NO !== undefined ? rec.SERVER_NO : existing?.serverNo !== undefined ? existing.serverNo : '15',
    equipmentId: equipId,
    groupName: group,
    equipmentOrder: rec.EQUIPMENT_ORDER !== undefined ? rec.EQUIPMENT_ORDER : existing?.equipmentOrder !== undefined ? existing.equipmentOrder : 20110,
    equipmentMain: rec.EQUIPMENT_MAIN || existing?.equipmentMain || '',
    description: rec.DESCRIPTION || existing?.description || '',
    enable: isEnabled ? 'YES' : 'NO',
    field01: rec.FIELD_01 || existing?.field01 || '',
    field02: rec.FIELD_02 || existing?.field02 || '',
    field03: rec.FIELD_03 || existing?.field03 || '',
    interlockRecipe: rec.INTERLOCK_RECIPE || existing?.interlockRecipe || 'YES',
    equipmentModel: model,
    interlockParam: rec.INTERLOCK_PARAM || existing?.interlockParam || '',
    interlockTrace: rec.INTERLOCK_TRACE || existing?.interlockTrace || '',

    lastConnectedAt: existing?.lastConnectedAt || new Date().toISOString(),
    lastDataReceivedAt: existing?.lastDataReceivedAt || new Date().toISOString(),
    totalRequests: existing?.totalRequests || 0,
    totalResponses: existing?.totalResponses || 0,
    errorCount: existing?.errorCount || 0,
    reconnectCount: existing?.reconnectCount || 0,
    avgResponseTimeMs: existing?.avgResponseTimeMs || 12.0,
    uptimeSeconds: existing?.uptimeSeconds || 3600,
    currentRecipe: existing?.currentRecipe || 'DEFAULT',
    consecutiveTimeouts: 0,
    enabled: isEnabled,
  };
}

/**
 * Exports a list of devices to Tab-Separated Values (TSV)
 */
export function exportDevicesToTsv(devices: DeviceModel[]): string {
  const headers = [...DEVICE_INFO_COLUMNS].join('\t');
  const rows = devices.map((d) => {
    const r = deviceToRecord(d);
    return DEVICE_INFO_COLUMNS.map((col) => {
      const val = r[col];
      return val !== undefined && val !== null ? String(val) : '';
    }).join('\t');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Exports a list of devices to Comma-Separated Values (CSV)
 */
export function exportDevicesToCsv(devices: DeviceModel[]): string {
  const headers = [...DEVICE_INFO_COLUMNS].join(',');
  const rows = devices.map((d) => {
    const r = deviceToRecord(d);
    return DEVICE_INFO_COLUMNS.map((col) => {
      const val = r[col];
      const str = val !== undefined && val !== null ? String(val) : '';
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Parses raw TSV or CSV string (e.g. pasted by user from Excel / MES table)
 */
export function parseDevicesFromTsvOrCsv(rawInput: string): DeviceModel[] {
  const lines = rawInput
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Determine separator (tab or comma)
  const firstLine = lines[0];
  const isTab = firstLine.includes('\t');
  const separator = isTab ? '\t' : ',';

  // Check if first line is a header row
  const rawHeaders = firstLine.split(separator).map((h) => h.replace(/^["']|["']$/g, '').trim().toUpperCase());
  const hasHeader = rawHeaders.some((h) =>
    ['PLANT', 'HOST_ADDRESS', 'HOST_PORT', 'EQUIPMENT_ID', 'GROUP_NAME'].includes(h)
  );

  let headerMap: Record<string, number> = {};
  let dataLines = lines;

  if (hasHeader) {
    rawHeaders.forEach((colName, idx) => {
      headerMap[colName] = idx;
    });
    dataLines = lines.slice(1);
  } else {
    // Default column order mapping
    DEVICE_INFO_COLUMNS.forEach((colName, idx) => {
      headerMap[colName] = idx;
    });
  }

  const results: DeviceModel[] = [];

  for (const line of dataLines) {
    let cells: string[] = [];
    if (isTab) {
      cells = line.split('\t').map((c) => c.trim());
    } else {
      // Basic CSV split respecting quotes
      const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
      let match;
      while ((match = regex.exec(line)) !== null) {
        let cell = match[1];
        if (cell.startsWith('"') && cell.endsWith('"')) {
          cell = cell.slice(1, -1).replace(/""/g, '"');
        }
        cells.push(cell.trim());
        if (regex.lastIndex >= line.length) break;
      }
    }

    if (cells.length < 3) continue; // Skip blank or invalid rows

    const getVal = (col: DeviceInfoColumnName): string => {
      const idx = headerMap[col];
      if (idx !== undefined && idx < cells.length) {
        return cells[idx] || '';
      }
      return '';
    };

    const rec: Partial<DeviceInfoRecord> = {
      PLANT: getVal('PLANT'),
      HOST_ADDRESS: getVal('HOST_ADDRESS'),
      HOST_PORT: getVal('HOST_PORT'),
      DEVICE_ID: getVal('DEVICE_ID'),
      SERVER_NO: getVal('SERVER_NO'),
      EQUIPMENT_ID: getVal('EQUIPMENT_ID'),
      GROUP_NAME: getVal('GROUP_NAME'),
      EQUIPMENT_ORDER: getVal('EQUIPMENT_ORDER'),
      EQUIPMENT_MAIN: getVal('EQUIPMENT_MAIN'),
      DESCRIPTION: getVal('DESCRIPTION'),
      ENABLE: getVal('ENABLE'),
      FIELD_01: getVal('FIELD_01'),
      FIELD_02: getVal('FIELD_02'),
      FIELD_03: getVal('FIELD_03'),
      INTERLOCK_RECIPE: getVal('INTERLOCK_RECIPE'),
      EQUIPMENT_MODEL: getVal('EQUIPMENT_MODEL'),
      INTERLOCK_PARAM: getVal('INTERLOCK_PARAM'),
      INTERLOCK_TRACE: getVal('INTERLOCK_TRACE'),
    };

    // If EQUIPMENT_ID is empty, try to salvage from cell 5 or cell 0
    if (!rec.EQUIPMENT_ID) {
      if (cells[5]) rec.EQUIPMENT_ID = cells[5];
      else if (cells[0]) rec.EQUIPMENT_ID = cells[0];
    }

    if (rec.EQUIPMENT_ID) {
      results.push(recordToDevice(rec));
    }
  }

  return results;
}

/**
 * MC Server Storage & Persistence Engine
 * Manages Device Master, Communication Transactions, Alarms, Logs and Configuration.
 */

import {
  DeviceModel,
  DeviceGroup,
  CommunicationTransaction,
  AlarmItem,
  LogEntry,
  ServerConfig,
  UserSession,
  SystemUser,
} from '../types';

export const INITIAL_DEVICE_GROUPS: DeviceGroup[] = [
  {
    id: 'NET',
    name: 'NET',
    description: 'ITM Network Line - Baking & Bending Systems',
    color: 'cyan',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'GRP_SMT_A',
    name: 'SMT-A',
    description: 'Chíp mounter & lò hàn đối lưu bo chính',
    color: 'blue',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'GRP_SMT_B',
    name: 'SMT-B',
    description: 'Khắc laser & linh kiện phụ sub-board',
    color: 'emerald',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'GRP_QC_TEST',
    name: 'QC-Test',
    description: 'Kiểm định quang học AOI/SPI & ICT test',
    color: 'purple',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'GRP_PACKAGING',
    name: 'Packaging',
    description: 'Đóng gói magazine & dán nhãn pallet',
    color: 'amber',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_DEVICES: DeviceModel[] = [];


export const INITIAL_CONFIG: ServerConfig = {
  server: {
    instanceName: 'MC-SRV-ENT-LINE01',
    listenPort: 5000,
    maxConcurrentClients: 128,
    bufferSizeLimitBytes: 1048576,
    keepAliveIntervalMs: 5000,
    watchdogTimeoutMs: 15000,
    autoReconnect: true,
    reconnectMaxAttempts: 5,
    backoffBaseDelayMs: 1000,
  },
  protocol: {
    defaultBoundary: 'AUTO_DETECT',
    checksumAlgorithm: 'LRC_MOD256',
    stxByte: 0x02,
    etxByte: 0x03,
  },
  mes: {
    endpointUrl: 'https://mes-api.smartfactory.internal:8443/v2/production',
    timeoutMs: 3000,
    circuitBreakerFailureThreshold: 3,
    circuitBreakerCooldownMs: 10000,
    retryMaxCount: 3,
  },
  logging: {
    level: 'INFO',
    retentionDays: 30,
    maskSensitivePayloads: true,
  },
  security: {
    sessionTimeoutMinutes: 60,
    requireAuditNoteForEquipmentChanges: true,
  },
};

export const INITIAL_USER_SESSION: UserSession = {
  id: 'USR_ENG_084',
  username: 'engineer.ruan',
  displayName: 'Ruan Y. J. (Chief Systems Engineer)',
  role: 'ENGINEER',
  factory: 'Smart Plant #01',
  department: 'Shopfloor Automation & Industrial IT',
  loginTime: new Date().toISOString(),
};

export const INITIAL_USERS: SystemUser[] = [
  {
    id: 'USR_001',
    username: 'admin',
    displayName: 'System Administrator',
    role: 'ADMIN',
    factory: 'Smart Plant #01',
    department: 'Ban Điều Hành & Quản Trị Hệ Thống',
    shift: 'Hành chính',
    rfidBadge: 'RFID-ADM-001',
    status: 'ACTIVE',
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
    createdAt: '2024-01-01T08:00:00Z',
    email: 'admin.scada@smartfactory.internal',
  },
  {
    id: 'USR_002',
    username: 'engineer.ruan',
    displayName: 'Ruan Y. J.',
    role: 'ENGINEER',
    factory: 'Smart Plant #01',
    department: 'Shopfloor Automation & Industrial IT',
    shift: 'Ca 1 (06:00 - 14:00)',
    rfidBadge: 'RFID-ENG-082',
    status: 'ACTIVE',
    lastLogin: new Date(Date.now() - 15000).toISOString(),
    createdAt: '2024-02-15T08:00:00Z',
    email: 'ruan.yj@smartfactory.internal',
  },
  {
    id: 'USR_003',
    username: 'supervisor.lee',
    displayName: 'Lee S. M.',
    role: 'SUPERVISOR',
    factory: 'Smart Plant #01',
    department: 'Giám Sát Vận Hành Dây Chuyền SMT',
    shift: 'Ca 1 (06:00 - 14:00)',
    rfidBadge: 'RFID-SUP-014',
    status: 'ACTIVE',
    lastLogin: new Date(Date.now() - 7200000).toISOString(),
    createdAt: '2024-03-01T08:00:00Z',
    email: 'lee.sm@smartfactory.internal',
  },
  {
    id: 'USR_004',
    username: 'operator.nguyen',
    displayName: 'Nguyen V. A.',
    role: 'OPERATOR',
    factory: 'Smart Plant #01',
    department: 'Tổ Vận Hành Trạm Mounter ST01',
    shift: 'Ca 1 (06:00 - 14:00)',
    rfidBadge: 'RFID-OP-105',
    status: 'ACTIVE',
    lastLogin: new Date(Date.now() - 14400000).toISOString(),
    createdAt: '2024-04-10T08:00:00Z',
    email: 'nguyen.va@smartfactory.internal',
  },
  {
    id: 'USR_005',
    username: 'qc.tran',
    displayName: 'Tran T. M.',
    role: 'OPERATOR',
    factory: 'Smart Plant #01',
    department: 'Kiểm Tra Chất Lượng SPI / AOI',
    shift: 'Ca 2 (14:00 - 22:00)',
    rfidBadge: 'RFID-QC-022',
    status: 'ACTIVE',
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    createdAt: '2024-05-20T08:00:00Z',
    email: 'tran.tm@smartfactory.internal',
  },
  {
    id: 'USR_006',
    username: 'maint.park',
    displayName: 'Park J. H.',
    role: 'ENGINEER',
    factory: 'Smart Plant #01',
    department: 'Bảo Trì Thiết Bị Cơ Điện Tử',
    shift: 'Hành chính',
    rfidBadge: 'RFID-MNT-037',
    status: 'LOCKED',
    lastLogin: new Date(Date.now() - 259200000).toISOString(),
    createdAt: '2024-05-01T08:00:00Z',
    email: 'park.jh@smartfactory.internal',
  },
];

export const INITIAL_ALARMS: AlarmItem[] = [];

export const INITIAL_LOGS: LogEntry[] = [];


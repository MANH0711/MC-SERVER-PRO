/**
 * MC Server Industrial Enterprise Edition - Type Definitions
 */

export type Language = 'vi-VN' | 'en-US' | 'ko-KR' | 'zh-CN';

export type UserRole = 'OPERATOR' | 'SUPERVISOR' | 'ENGINEER' | 'ADMIN';

export interface UserSession {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  factory: string;
  department: string;
  loginTime: string;
}

export interface SystemUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  factory: string;
  department: string;
  shift: string;
  rfidBadge?: string;
  status: 'ACTIVE' | 'LOCKED';
  lastLogin: string;
  createdAt: string;
  email?: string;
}

export type DeviceStatus =
  | 'Disconnected'
  | 'Connecting'
  | 'Connected'
  | 'Initializing'
  | 'Ready'
  | 'Busy'
  | 'Warning'
  | 'Error'
  | 'Reconnecting';

export type TcpRole = 'SERVER' | 'CLIENT';
export type ProtocolVersion = 'v1.2-Standard' | 'v2.0-Extended20014' | 'v1.0-Legacy';
export type ChecksumAlgorithm = 'LRC_MOD256' | 'XOR_HEX' | 'CRC16_CCITT';
export type FrameBoundary = '20013_STANDARD' | '20014_EXTENDED' | 'VARIABLE_LENGTH' | 'AUTO_DETECT';

export interface DeviceGroup {
  id: string; // e.g. 'GRP_SMT_A'
  name: string; // e.g. 'Dây chuyền SMT-A'
  description?: string;
  color?: string; // e.g. 'blue' | 'emerald' | 'purple' | 'amber'
  createdAt?: string;
}

export interface DeviceInfoRecord {
  PLANT: string;
  HOST_ADDRESS: string;
  HOST_PORT: number | string;
  DEVICE_ID: string | number;
  SERVER_NO: string | number;
  EQUIPMENT_ID: string;
  GROUP_NAME: string;
  EQUIPMENT_ORDER: string | number;
  EQUIPMENT_MAIN?: string;
  DESCRIPTION?: string;
  ENABLE: 'YES' | 'NO' | string;
  FIELD_01?: string;
  FIELD_02?: string;
  FIELD_03?: string;
  INTERLOCK_RECIPE?: 'YES' | 'NO' | string;
  EQUIPMENT_MODEL?: string;
  INTERLOCK_PARAM?: string;
  INTERLOCK_TRACE?: string;
}

export interface DeviceModel {
  id: string; // e.g. EQP_SMT_01 or BAKE01 (EQUIPMENT_ID)
  name: string;
  factory: string; // PLANT e.g. ITMVIET
  line: string;
  station: string;
  groupId?: string; // Group reference, e.g. GRP_SMT_A or NET
  model: string; // EQUIPMENT_MODEL e.g. IBS_BAKE
  ipAddress: string; // HOST_ADDRESS e.g. 127.0.0.1
  port: number; // HOST_PORT e.g. 5010
  role: TcpRole;
  protocolVersion: ProtocolVersion;
  frameBoundary: FrameBoundary;
  checksumAlgorithm: ChecksumAlgorithm;
  status: DeviceStatus;

  // 18-Column Industrial Device Master Schema
  plant?: string;             // PLANT (e.g. 'ITMVIET')
  hostAddress?: string;       // HOST_ADDRESS (e.g. '127.0.0.1')
  hostPort?: number;          // HOST_PORT (e.g. 5010)
  deviceId?: string | number; // DEVICE_ID (e.g. '0')
  serverNo?: string | number; // SERVER_NO (e.g. '15')
  equipmentId?: string;       // EQUIPMENT_ID (e.g. 'BAKE01')
  groupName?: string;         // GROUP_NAME (e.g. 'NET')
  equipmentOrder?: string | number; // EQUIPMENT_ORDER (e.g. '20110')
  equipmentMain?: string;    // EQUIPMENT_MAIN
  description?: string;      // DESCRIPTION
  enable?: 'YES' | 'NO' | string; // ENABLE ('YES' | 'NO')
  field01?: string;          // FIELD_01
  field02?: string;          // FIELD_02
  field03?: string;          // FIELD_03 (e.g. 'ITMVIET')
  interlockRecipe?: 'YES' | 'NO' | string; // INTERLOCK_RECIPE (e.g. 'YES')
  equipmentModel?: string;   // EQUIPMENT_MODEL (e.g. 'IBS_BAKE')
  interlockParam?: string;   // INTERLOCK_PARAM
  interlockTrace?: string;   // INTERLOCK_TRACE

  lastConnectedAt?: string;
  lastDataReceivedAt?: string;
  totalRequests: number;
  totalResponses: number;
  errorCount: number;
  reconnectCount: number;
  avgResponseTimeMs: number;
  uptimeSeconds: number;
  currentRecipe?: string;
  currentCarrierId?: string;
  consecutiveTimeouts: number;
  enabled: boolean;
}

export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type ChecksumStatus = 'VALID' | 'INVALID' | 'SKIPPED';
export type TransactionStatus = 'SUCCESS' | 'ERROR' | 'TIMEOUT' | 'INTERLOCK_DENIED' | 'PENDING';

export interface CommunicationTransaction {
  id: string;
  correlationId: string;
  equipmentId: string;
  equipmentModel?: string;
  messageCode: string;
  direction: MessageDirection;
  rawHex: string;
  rawAscii: string;
  payloadLength: number;
  payloadJson: Record<string, any>;
  checksum: string;
  checksumStatus: ChecksumStatus;
  responseTimeMs: number;
  status: TransactionStatus;
  timestamp: string;
  errorDetail?: string;
}

export type AlarmSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface AlarmItem {
  id: string;
  equipmentId: string;
  equipmentName?: string;
  alarmCode: string;
  severity: AlarmSeverity;
  description: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolutionNote?: string;
  createdAt: string;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
export type LogCategory = 'SYSTEM' | 'COMMUNICATION' | 'BUSINESS' | 'AUDIT';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  equipmentId?: string;
  correlationId?: string;
  message: string;
  details?: Record<string, any>;
  operator?: string;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface MesStatus {
  endpoint: string;
  connected: boolean;
  circuitBreakerState: CircuitBreakerState;
  consecutiveFailures: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  lastHeartbeat: string;
  pendingQueueSize: number;
}

export interface ServerConfig {
  server: {
    instanceName: string;
    listenPort: number;
    maxConcurrentClients: number;
    bufferSizeLimitBytes: number;
    keepAliveIntervalMs: number;
    watchdogTimeoutMs: number;
    autoReconnect: boolean;
    reconnectMaxAttempts: number;
    backoffBaseDelayMs: number;
  };
  protocol: {
    defaultBoundary: FrameBoundary;
    checksumAlgorithm: ChecksumAlgorithm;
    stxByte: number; // 0x02
    etxByte: number; // 0x03
  };
  mes: {
    endpointUrl: string;
    timeoutMs: number;
    circuitBreakerFailureThreshold: number;
    circuitBreakerCooldownMs: number;
    retryMaxCount: number;
  };
  logging: {
    level: LogLevel;
    retentionDays: number;
    maskSensitivePayloads: boolean;
    flushIntervalMs?: number;
  };
  security: {
    sessionTimeoutMinutes: number;
    requireAuditNoteForEquipmentChanges: boolean;
    maxFailedLoginAttempts?: number;
    lockoutDurationMinutes?: number;
  };
}

export interface ParsedFrame {
  isValid: boolean;
  error?: string;
  equipmentId: string;
  messageCode: string;
  txId: string;
  payloadLength: number;
  payloadRaw: string;
  payloadJson: Record<string, any>;
  checksum: string;
  expectedChecksum: string;
  checksumStatus: ChecksumStatus;
  detectedBoundary: FrameBoundary;
  frameLength: number;
  rawAscii: string;
  rawHex: string;
}

export interface MessageCodeDefinition {
  code: string;
  name: string;
  category: 'SYSTEM' | 'MATERIAL' | 'RECIPE' | 'MOVE_IN' | 'MOVE_OUT' | 'ALARM';
  description: string;
  direction: 'EQ_TO_SRV' | 'SRV_TO_EQ';
  responseCode?: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  samplePayload: Record<string, any>;
}

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

export interface DeviceModel {
  id: string; // e.g. EQP_SMT_01
  name: string;
  factory: string;
  line: string;
  station: string;
  groupId?: string; // Group reference, e.g. GRP_SMT_A
  model: string;
  ipAddress: string;
  port: number;
  role: TcpRole;
  protocolVersion: ProtocolVersion;
  frameBoundary: FrameBoundary;
  checksumAlgorithm: ChecksumAlgorithm;
  status: DeviceStatus;
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
  };
  security: {
    sessionTimeoutMinutes: number;
    requireAuditNoteForEquipmentChanges: boolean;
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

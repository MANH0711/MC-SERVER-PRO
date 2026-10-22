import { ORACLE_TNS_CONFIGS } from './oracle.config';

export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  grpc: {
    host: process.env.GRPC_HOST || '0.0.0.0',
    port: parseInt(process.env.GRPC_PORT || '50051', 10),
  },
  tcp: {
    serverPort: parseInt(process.env.TCP_SERVER_PORT || '5000', 10),
    clientTimeoutMs: parseInt(process.env.TCP_CLIENT_TIMEOUT_MS || '5000', 10),
    heartbeatIntervalMs: parseInt(process.env.HEARTBEAT_INTERVAL_MS || '10000', 10),
    maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '5', 10),
    reconnectIntervalMs: parseInt(process.env.RECONNECT_INTERVAL_MS || '3000', 10),
  },
  oracle: {
    defaultTns: process.env.ORACLE_DEFAULT_TNS || 'ITMDEV',
    tnsConfigs: ORACLE_TNS_CONFIGS,
  },
  mes: {
    circuitBreakerThreshold: parseInt(process.env.MES_CIRCUIT_BREAKER_FAILURES || '5', 10),
    circuitBreakerResetMs: parseInt(process.env.MES_CIRCUIT_BREAKER_RESET_MS || '30000', 10),
  },
});

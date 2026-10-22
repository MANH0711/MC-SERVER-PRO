import * as dotenv from 'dotenv';
dotenv.config();

export interface OracleTnsConfig {
  tnsName: string;
  host: string;
  port: number;
  serviceName: string;
  user: string;
  password?: string;
  poolMin: number;
  poolMax: number;
  poolIncrement: number;
  poolTimeout: number;
  failoverHosts?: string[];
}

export const ORACLE_TNS_CONFIGS: Record<string, OracleTnsConfig> = {
  ITMDEV: {
    tnsName: 'ITMDEV',
    host: process.env.ORACLE_ITMDEV_HOST || '112.160.65.212',
    port: parseInt(process.env.ORACLE_ITMDEV_PORT || '1521', 10),
    serviceName: process.env.ORACLE_ITMDEV_SERVICE || 'MIGHTY',
    user: process.env.ORACLE_ITMDEV_USER || 'MESDEV',
    password: process.env.ORACLE_ITMDEV_PASSWORD || 'MESDEV123!',
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
    poolTimeout: 60,
  },
  ITMMES: {
    tnsName: 'ITMMES',
    host: process.env.ORACLE_ITMMES_HOST || '192.168.80.20',
    port: parseInt(process.env.ORACLE_ITMMES_PORT || '1521', 10),
    serviceName: process.env.ORACLE_ITMMES_SERVICE || 'ITMMES',
    user: process.env.ORACLE_ITMMES_USER || 'MESPROD',
    password: process.env.ORACLE_ITMMES_PASSWORD || '',
    poolMin: 2,
    poolMax: 20,
    poolIncrement: 2,
    poolTimeout: 60,
  },
  ITMVMES: {
    tnsName: 'ITMVMES',
    host: process.env.ORACLE_ITMVMES_HOST || '192.168.35.202',
    port: parseInt(process.env.ORACLE_ITMVMES_PORT || '1521', 10),
    serviceName: process.env.ORACLE_ITMVMES_SERVICE || 'ITMVMES',
    user: process.env.ORACLE_ITMVMES_USER || 'mighty',
    password: process.env.ORACLE_ITMVMES_PASSWORD || 'mighty',
    poolMin: 10,
    poolMax: 100,
    poolIncrement: 5,
    poolTimeout: 30,
    failoverHosts: ['192.168.35.203', '192.168.35.204'],
  },
  ITMSEMIMES: {
    tnsName: 'ITMSEMIMES',
    host: process.env.ORACLE_ITMSEMIMES_HOST || '192.168.35.202',
    port: parseInt(process.env.ORACLE_ITMSEMIMES_PORT || '1521', 10),
    serviceName: process.env.ORACLE_ITMSEMIMES_SERVICE || 'ITMSEMIMES',
    user: process.env.ORACLE_ITMSEMIMES_USER || 'MESSEMI',
    password: process.env.ORACLE_ITMSEMIMES_PASSWORD || '',
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
    poolTimeout: 60,
  },
  ITMPMES: {
    tnsName: 'ITMPMES',
    host: process.env.ORACLE_ITMPMES_HOST || '192.168.1.18',
    port: parseInt(process.env.ORACLE_ITMPMES_PORT || '1521', 10),
    serviceName: process.env.ORACLE_ITMPMES_SERVICE || 'ITMPMES',
    user: process.env.ORACLE_ITMPMES_USER || 'MESPMES',
    password: process.env.ORACLE_ITMPMES_PASSWORD || '',
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
    poolTimeout: 60,
  },
};

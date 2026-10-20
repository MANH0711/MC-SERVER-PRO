/**
 * MC Server Application Context
 * Central state orchestrator for all views, services, real-time feeds, and user RBAC.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  DeviceModel,
  DeviceGroup,
  CommunicationTransaction,
  AlarmItem,
  LogEntry,
  ServerConfig,
  UserSession,
  UserRole,
  MesStatus,
} from '../types';
import {
  INITIAL_DEVICES,
  INITIAL_DEVICE_GROUPS,
  INITIAL_CONFIG,
  INITIAL_USER_SESSION,
  INITIAL_ALARMS,
  INITIAL_LOGS,
} from '../storage/database';
import { SessionManager } from '../communication/sessionManager';
import { MesAdapter } from '../mes/mesAdapter';

export type NavView =
  | 'dashboard'
  | 'equipment'
  | 'communication'
  | 'protocol'
  | 'mesMonitor'
  | 'alarmCenter'
  | 'logs'
  | 'configuration'
  | 'users'
  | 'systemHealth';

interface AppContextType {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  devices: DeviceModel[];
  deviceGroups: DeviceGroup[];
  transactions: CommunicationTransaction[];
  alarms: AlarmItem[];
  logs: LogEntry[];
  config: ServerConfig;
  userSession: UserSession;
  mesStatus: MesStatus;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  serverOnline: boolean;
  setServerOnline: (online: boolean) => void;
  isSimulating: boolean;
  toggleSimulation: () => void;
  // Actions
  addDevice: (device: DeviceModel) => void;
  updateDevice: (id: string, updates: Partial<DeviceModel>) => void;
  deleteDevice: (id: string) => void;
  addDeviceGroup: (group: DeviceGroup) => void;
  updateDeviceGroup: (id: string, updates: Partial<DeviceGroup>) => void;
  deleteDeviceGroup: (id: string) => void;
  reconnectDevice: (id: string) => Promise<boolean>;
  acknowledgeAlarm: (id: string, note?: string) => void;
  clearTransactions: () => void;
  clearLogs: () => void;
  updateConfig: (newConfig: ServerConfig) => void;
  switchUserRole: (role: UserRole) => void;
  injectRawFrame: (equipmentId: string, rawData: string | Uint8Array) => void;
  pingMes: () => Promise<{ success: boolean; latencyMs: number; message: string }>;
  resetCircuitBreaker: () => void;
  forceTripCircuitBreaker: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [userSession, setUserSession] = useState<UserSession>(INITIAL_USER_SESSION);
  const [config, setConfigState] = useState<ServerConfig>(INITIAL_CONFIG);

  const [devices, setDevices] = useState<DeviceModel[]>(INITIAL_DEVICES);
  const [deviceGroups, setDeviceGroups] = useState<DeviceGroup[]>(INITIAL_DEVICE_GROUPS);
  const [transactions, setTransactions] = useState<CommunicationTransaction[]>([]);
  const [alarms, setAlarms] = useState<AlarmItem[]>(INITIAL_ALARMS);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Initialize Core Services
  const mesAdapter = useMemo(() => new MesAdapter(INITIAL_CONFIG.mes.endpointUrl), []);
  const [mesStatus, setMesStatus] = useState<MesStatus>(mesAdapter.getStatus());

  const sessionManager = useMemo(
    () => new SessionManager(INITIAL_DEVICES, INITIAL_CONFIG, mesAdapter),
    [mesAdapter]
  );

  useEffect(() => {
    // Sync initial devices from session manager
    setDevices(sessionManager.getDevices());

    // Subscribe to transactions
    const unsubTx = sessionManager.onTransaction((tx) => {
      setTransactions((prev) => [tx, ...prev.slice(0, 499)]); // keep latest 500
      setMesStatus(mesAdapter.getStatus());
    });

    // Subscribe to device updates
    const unsubDev = sessionManager.onDeviceUpdate((updatedDev) => {
      setDevices((prev) => prev.map((d) => (d.id === updatedDev.id ? updatedDev : d)));
    });

    // Subscribe to alarms
    const unsubAlarm = sessionManager.onAlarm((newAlarm) => {
      setAlarms((prev) => [newAlarm, ...prev]);
    });

    // Subscribe to logs
    const unsubLog = sessionManager.onLog((newLog) => {
      setLogs((prev) => [newLog, ...prev.slice(0, 999)]);
    });

    // Refresh MES status periodically
    const mesInterval = setInterval(() => {
      setMesStatus(mesAdapter.getStatus());
    }, 3000);

    return () => {
      unsubTx();
      unsubDev();
      unsubAlarm();
      unsubLog();
      clearInterval(mesInterval);
      sessionManager.destroy();
    };
  }, [sessionManager, mesAdapter]);

  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleSimulation = () => {
    const nextState = sessionManager.toggleSimulation();
    setIsSimulating(nextState);
  };

  const addDevice = (device: DeviceModel) => {
    sessionManager.addDevice(device);
    setDevices(sessionManager.getDevices());
  };

  const updateDevice = (id: string, updates: Partial<DeviceModel>) => {
    sessionManager.updateDevice(id, updates);
    setDevices(sessionManager.getDevices());
  };

  const deleteDevice = (id: string) => {
    sessionManager.deleteDevice(id);
    setDevices(sessionManager.getDevices());
  };

  const addDeviceGroup = (group: DeviceGroup) => {
    setDeviceGroups((prev) => [...prev, group]);
    const log: LogEntry = {
      id: `LOG_GRP_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'AUDIT',
      message: `Device Group registered: ${group.name} [${group.id}] by ${userSession.username}`,
      operator: userSession.username,
    };
    setLogs((prev) => [log, ...prev]);
  };

  const updateDeviceGroup = (id: string, updates: Partial<DeviceGroup>) => {
    setDeviceGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
  };

  const deleteDeviceGroup = (id: string) => {
    setDeviceGroups((prev) => prev.filter((g) => g.id !== id));
    setDevices((prev) =>
      prev.map((d) => (d.groupId === id ? { ...d, groupId: undefined } : d))
    );
    const log: LogEntry = {
      id: `LOG_GRP_DEL_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'WARN',
      category: 'AUDIT',
      message: `Device Group deleted: [${id}] by ${userSession.username}`,
      operator: userSession.username,
    };
    setLogs((prev) => [log, ...prev]);
  };

  const reconnectDevice = async (id: string) => {
    const success = await sessionManager.reconnectDevice(id);
    setDevices(sessionManager.getDevices());
    return success;
  };

  const acknowledgeAlarm = (id: string, note?: string) => {
    setAlarms((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              acknowledged: true,
              acknowledgedBy: userSession.username,
              acknowledgedAt: new Date().toISOString(),
              resolutionNote: note,
            }
          : a
      )
    );

    // Write audit log
    const log: LogEntry = {
      id: `LOG_ACK_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'AUDIT',
      message: `Alarm ${id} acknowledged by ${userSession.username}: ${note || 'No notes added'}`,
      operator: userSession.username,
    };
    setLogs((prev) => [log, ...prev]);
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const updateConfig = (newConfig: ServerConfig) => {
    setConfigState(newConfig);
    const log: LogEntry = {
      id: `LOG_CFG_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'AUDIT',
      message: `System configuration updated by ${userSession.username}. ListenPort: ${newConfig.server.listenPort}, KeepAlive: ${newConfig.server.keepAliveIntervalMs}ms`,
      operator: userSession.username,
    };
    setLogs((prev) => [log, ...prev]);
  };

  const switchUserRole = (role: UserRole) => {
    setUserSession((prev) => ({
      ...prev,
      role,
      displayName:
        role === 'ADMIN'
          ? 'System Administrator'
          : role === 'ENGINEER'
          ? 'Ruan Y. J. (Chief Systems Engineer)'
          : role === 'SUPERVISOR'
          ? 'Lee S. M. (Line Supervisor)'
          : 'Nguyen V. A. (Shopfloor Operator)',
    }));
  };

  const injectRawFrame = (equipmentId: string, rawData: string | Uint8Array) => {
    sessionManager.injectRawFrame(equipmentId, rawData);
  };

  const pingMes = async () => {
    const res = await mesAdapter.pingEndpoint();
    setMesStatus(mesAdapter.getStatus());
    return res;
  };

  const resetCircuitBreaker = () => {
    mesAdapter.resetCircuitBreaker();
    setMesStatus(mesAdapter.getStatus());
  };

  const forceTripCircuitBreaker = () => {
    mesAdapter.forceTripCircuitBreaker();
    setMesStatus(mesAdapter.getStatus());
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        devices,
        deviceGroups,
        transactions,
        alarms,
        logs,
        config,
        userSession,
        mesStatus,
        theme,
        setTheme,
        serverOnline,
        setServerOnline,
        isSimulating,
        toggleSimulation,
        addDevice,
        updateDevice,
        deleteDevice,
        addDeviceGroup,
        updateDeviceGroup,
        deleteDeviceGroup,
        reconnectDevice,
        acknowledgeAlarm,
        clearTransactions,
        clearLogs,
        updateConfig,
        switchUserRole,
        injectRawFrame,
        pingMes,
        resetCircuitBreaker,
        forceTripCircuitBreaker,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

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
  SystemUser,
} from '../types';
import {
  INITIAL_DEVICES,
  INITIAL_DEVICE_GROUPS,
  INITIAL_CONFIG,
  INITIAL_USER_SESSION,
  INITIAL_USERS,
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
  users: SystemUser[];
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
  addUser: (user: SystemUser) => void;
  updateUser: (id: string, updates: Partial<SystemUser>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  switchActiveUser: (user: SystemUser) => void;
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
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
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

  const addUser = (newUser: SystemUser) => {
    setUsers((prev) => [newUser, ...prev]);
    const log: LogEntry = {
      id: `LOG_USR_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'AUDIT',
      message: `Tạo tài khoản người dùng mới: [${newUser.username}] (${newUser.displayName}), Vai trò: ${newUser.role}, Phòng ban: ${newUser.department}`,
      operator: userSession.username,
      details: {
        userId: newUser.id,
        username: newUser.username,
        role: newUser.role,
        department: newUser.department,
        shift: newUser.shift,
      },
    };
    setLogs((prev) => [log, ...prev]);
  };

  const updateUser = (id: string, updates: Partial<SystemUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    const log: LogEntry = {
      id: `LOG_USR_UPD_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'AUDIT',
      message: `Cập nhật thông tin người dùng: ID [${id}] bởi ${userSession.username}`,
      operator: userSession.username,
      details: updates,
    };
    setLogs((prev) => [log, ...prev]);
  };

  const deleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    const log: LogEntry = {
      id: `LOG_USR_DEL_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'WARN',
      category: 'AUDIT',
      message: `Xóa tài khoản người dùng: [${target?.username || id}] (${target?.displayName || ''}) bởi ${userSession.username}`,
      operator: userSession.username,
      details: { targetId: id, username: target?.username },
    };
    setLogs((prev) => [log, ...prev]);
  };

  const toggleUserStatus = (id: string) => {
    let nextStatus: 'ACTIVE' | 'LOCKED' = 'ACTIVE';
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          nextStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
    const target = users.find((u) => u.id === id);
    const log: LogEntry = {
      id: `LOG_USR_ST_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'WARN',
      category: 'AUDIT',
      message: `Thay đổi trạng thái tài khoản [${target?.username || id}] thành: ${nextStatus} bởi ${userSession.username}`,
      operator: userSession.username,
      details: { targetId: id, newStatus: nextStatus },
    };
    setLogs((prev) => [log, ...prev]);
  };

  const switchActiveUser = (user: SystemUser) => {
    setUserSession({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      factory: user.factory,
      department: user.department,
      loginTime: new Date().toISOString(),
    });
    const log: LogEntry = {
      id: `LOG_AUTH_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'AUDIT',
      message: `Chuyển phiên làm việc sang tài khoản: [${user.username}] (${user.displayName}), Vai trò: ${user.role}`,
      operator: user.username,
      details: {
        userId: user.id,
        role: user.role,
        department: user.department,
      },
    };
    setLogs((prev) => [log, ...prev]);
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
        users,
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
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        switchActiveUser,
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

/**
 * MC Server Industrial Enterprise Edition
 * Views Master Index Router & Form Orchestrator (File Cha)
 * Re-exports from @/features for backward compatibility
 */

import FeaturesManager, {
  Dashboard,
  DeviceManagement,
  CommunicationMonitor,
  ProtocolExplorer,
  MesMonitor,
  AlarmCenter,
  LogCenter,
  ConfigurationCenter,
  UserManagement,
  SystemHealth,
} from '@/features';

export const DashboardView = Dashboard;
export const DeviceManagementView = DeviceManagement;
export const CommunicationMonitorView = CommunicationMonitor;
export const ProtocolExplorerView = ProtocolExplorer;
export const MesMonitorView = MesMonitor;
export const AlarmCenterView = AlarmCenter;
export const LogCenterView = LogCenter;
export const ConfigurationCenterView = ConfigurationCenter;
export const UserManagementView = UserManagement;
export const SystemHealthView = SystemHealth;

export const ViewsManager = FeaturesManager;
export default FeaturesManager;

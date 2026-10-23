/**
 * MC Server Industrial Enterprise Edition
 * Views Master Index Router & Form Orchestrator (File Cha)
 * 
 * Quản lý tập trung toàn bộ các màn hình / form nghiệp vụ:
 * - Dashboard: Bảng điều khiển thời gian thực & biểu đồ lưu lượng
 * - DeviceManagement: Quản lý kết nối & danh mục thiết bị công nghiệp
 * - CommunicationMonitor: Giám sát luồng truyền tin SECS-I / TCP & Raw Frame
 * - ProtocolExplorer: Trình phân tích & thử nghiệm mã lệnh SECS/GEM
 * - MesMonitor: Giám sát kết nối & trao đổi dữ liệu với hệ thống MES
 * - AlarmCenter: Trung tâm cảnh báo sự cố & quản lý ngưỡng an toàn
 * - LogCenter: Quản lý & tra cứu nhật ký hệ thống đa cấp độ
 * - ConfigurationCenter: Cấu hình tham số máy chủ & cơ sở dữ liệu
 * - UserManagement: Phân quyền & quản trị tài khoản người dùng
 * - SystemHealth: Giám sát tải CPU, RAM & trạng thái microservices
 */

import React, { Suspense } from 'react';
import { useApp } from '../context/AppContext';

// Import các Form / Màn hình từ cấu trúc thư mục module hóa chuyên nghiệp
import { DashboardView } from './dashboard';
import { DeviceManagementView } from './device-management';
import { CommunicationMonitorView } from './communication-monitor';
import { ProtocolExplorerView } from './protocol-explorer';
import { MesMonitorView } from './mes-monitor';
import { AlarmCenterView } from './alarm-center';
import { LogCenterView } from './log-center';
import { ConfigurationCenterView } from './configuration-center';
import { UserManagementView } from './user-management';
import { SystemHealthView } from './system-health';

// Export từng Form độc lập để tái sử dụng ở bất kỳ nơi nào
export {
  DashboardView,
  DeviceManagementView,
  CommunicationMonitorView,
  ProtocolExplorerView,
  MesMonitorView,
  AlarmCenterView,
  LogCenterView,
  ConfigurationCenterView,
  UserManagementView,
  SystemHealthView,
};

// Định nghĩa giao diện cho bộ quản lý Forms cha
interface ViewsManagerProps {
  currentView?: string;
}

/**
 * Component Cha (Master Router): Điều hướng & Render các Form nghiệp vụ
 */
export const ViewsManager: React.FC<ViewsManagerProps> = ({ currentView }) => {
  const { activeView: contextActiveView } = useApp();
  const activeView = currentView || contextActiveView;

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'equipment':
        return <DeviceManagementView />;
      case 'communication':
        return <CommunicationMonitorView />;
      case 'protocol':
        return <ProtocolExplorerView />;
      case 'mesMonitor':
        return <MesMonitorView />;
      case 'alarmCenter':
        return <AlarmCenterView />;
      case 'logs':
        return <LogCenterView />;
      case 'configuration':
        return <ConfigurationCenterView />;
      case 'users':
        return <UserManagementView />;
      case 'systemHealth':
        return <SystemHealthView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-slate-950 text-cyan-400 font-mono text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Đang tải màn hình giao dịch công nghiệp...</span>
          </div>
        </div>
      }
    >
      <div className="flex-1 flex flex-col min-h-0 w-full h-full overflow-hidden animate-in fade-in duration-150">
        {renderActiveView()}
      </div>
    </Suspense>
  );
};

// Export mặc định là File Cha điều hướng (ViewsManager)
export default ViewsManager;

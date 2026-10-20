/**
 * MC Server Industrial Enterprise Edition
 * Main Application Entry Component with Layout & View Routing
 */

import React from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { StatusBar } from './components/StatusBar';

// Views
import { DashboardView } from './components/views/DashboardView';
import { DeviceManagementView } from './components/views/DeviceManagementView';
import { CommunicationMonitorView } from './components/views/CommunicationMonitorView';
import { ProtocolExplorerView } from './components/views/ProtocolExplorerView';
import { MesMonitorView } from './components/views/MesMonitorView';
import { AlarmCenterView } from './components/views/AlarmCenterView';
import { LogCenterView } from './components/views/LogCenterView';
import { ConfigurationCenterView } from './components/views/ConfigurationCenterView';
import { UserManagementView } from './components/views/UserManagementView';
import { SystemHealthView } from './components/views/SystemHealthView';

const MainLayout: React.FC = () => {
  const { activeView } = useApp();

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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Left Collapsible Industrial Sidebar */}
      <Sidebar />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Header */}
        <TopBar />

        {/* Dynamic Viewport */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {renderActiveView()}
        </main>

        {/* Bottom Industrial Status Bar */}
        <StatusBar />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </LanguageProvider>
  );
}

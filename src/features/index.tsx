/**
 * MC Server Industrial Enterprise Edition
 * Features Master Orchestrator & Public API
 */

import React, { Suspense } from 'react';
import { useApp } from '@/core/context';

// Import all modularized Feature components
import { CommunicationMonitor } from './communication';
import { DeviceManagement } from './devices';
import { Dashboard } from './dashboard';
import { ProtocolExplorer } from './protocol';
import { ConfigurationCenter } from './configuration';
import { UserManagement } from './users';
import { MesMonitor } from './mes';
import { AlarmCenter } from './alarms';
import { LogCenter } from './logs';
import { SystemHealth } from './system-health';

// Re-export all features and their public APIs
export * from './communication';
export * from './devices';
export * from './dashboard';
export * from './protocol';
export * from './configuration';
export * from './users';
export * from './mes';
export * from './alarms';
export * from './logs';
export * from './system-health';

interface FeaturesManagerProps {
  currentView?: string;
}

/**
 * FeaturesManager: Central Orchestrator & View Switcher
 */
export const FeaturesManager: React.FC<FeaturesManagerProps> = ({ currentView }) => {
  const { activeView: contextActiveView } = useApp();
  const activeView = currentView || contextActiveView;

  const renderActiveFeature = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'equipment':
        return <DeviceManagement />;
      case 'communication':
        return <CommunicationMonitor />;
      case 'protocol':
        return <ProtocolExplorer />;
      case 'mesMonitor':
        return <MesMonitor />;
      case 'alarmCenter':
        return <AlarmCenter />;
      case 'logs':
        return <LogCenter />;
      case 'configuration':
        return <ConfigurationCenter />;
      case 'users':
        return <UserManagement />;
      case 'systemHealth':
        return <SystemHealth />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-slate-950 text-cyan-400 font-mono text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Đang tải mô-đun công nghiệp...</span>
          </div>
        </div>
      }
    >
      <div className="flex-1 flex flex-col min-h-0 w-full h-full overflow-hidden animate-in fade-in duration-150">
        {renderActiveFeature()}
      </div>
    </Suspense>
  );
};

export default FeaturesManager;

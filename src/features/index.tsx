/**
 * MC Server Industrial Enterprise Edition
 * Features Master Orchestrator & Public API
 */

import React, { Suspense } from 'react';
import { useApp } from '@/core/context';

// Core real-time views (Loaded immediately)
import { CommunicationMonitor } from './communication';
import { DeviceManagement } from './devices';
import { Dashboard } from './dashboard';

// Dynamic lazy-loaded views (Code-split into separate on-demand bundles)
const ProtocolExplorer = React.lazy(() => import('./protocol').then((m) => ({ default: m.ProtocolExplorer })));
const ConfigurationCenter = React.lazy(() => import('./configuration').then((m) => ({ default: m.ConfigurationCenter })));
const UserManagement = React.lazy(() => import('./users').then((m) => ({ default: m.UserManagement })));
const MesMonitor = React.lazy(() => import('./mes').then((m) => ({ default: m.MesMonitor })));
const IlruleHistoryReport = React.lazy(() => import('./interlock-history').then((m) => ({ default: m.IlruleHistoryReport })));
const InterlockRuleAuditView = React.lazy(() => import('./interlock-rules-audit').then((m) => ({ default: m.InterlockRuleAuditView })));
const AlarmCenter = React.lazy(() => import('./alarms').then((m) => ({ default: m.AlarmCenter })));
const LogCenter = React.lazy(() => import('./logs').then((m) => ({ default: m.LogCenter })));
const SystemHealth = React.lazy(() => import('./system-health').then((m) => ({ default: m.SystemHealth })));

// Re-export core features for external usage
export * from './communication';
export * from './devices';
export * from './dashboard';

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
      case 'ilruleHistory':
        return <IlruleHistoryReport />;
      case 'interlockRulesAudit':
        return <InterlockRuleAuditView />;
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

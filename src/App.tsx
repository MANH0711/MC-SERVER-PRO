/**
 * MC Server Industrial Enterprise Edition
 * Main Application Entry Component with Layout & Master Feature Orchestrator
 */

import React from 'react';
import { LanguageProvider } from '@/core/i18n';
import { AppProvider } from '@/core/context';
import { Sidebar, TopBar, StatusBar } from '@/components/layout';
import FeaturesManager from '@/features';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Left Collapsible Industrial Sidebar */}
      <Sidebar />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Header */}
        <TopBar />

        {/* Dynamic Viewport: Rendered by FeaturesManager wrapped in ErrorBoundary */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <ErrorBoundary fallbackTitle="Không thể tải phân hệ chức năng">
            <FeaturesManager />
          </ErrorBoundary>
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

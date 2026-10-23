/**
 * MC Server Industrial Enterprise Edition
 * Main Application Entry Component with Layout & Master View Orchestrator
 */

import React from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { StatusBar } from './components/StatusBar';

// File cha quản lý & điều hướng tập trung toàn bộ các Form nghiệp vụ
import ViewsManager from './views';

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Left Collapsible Industrial Sidebar */}
      <Sidebar />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Header */}
        <TopBar />

        {/* Dynamic Viewport: Rendered by ViewsManager (File Cha index.tsx) */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <ViewsManager />
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

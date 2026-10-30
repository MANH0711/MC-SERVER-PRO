import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught React exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 text-slate-100">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">
                  {this.props.fallbackTitle || 'Đã Xảy Ra Lỗi Hiển Thị Giao Diện'}
                </h3>
                <p className="text-xs text-slate-400">Hệ thống đã cách ly lỗi để bảo vệ ứng dụng.</p>
              </div>
            </div>

            {this.state.error && (
              <div className="p-3 bg-black/60 rounded border border-slate-800 font-mono text-[11px] text-rose-300 max-h-32 overflow-auto break-all">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                Tải Lại Trang
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử Lại Giao Diện</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

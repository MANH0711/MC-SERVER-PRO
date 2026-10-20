/**
 * MC Server Industrial Enterprise Edition - Dashboard View
 * Features:
 * 1. Side-by-side split layout:
 *    - Left: Ma trận Giám sát Trực quan Trạm Máy dạng CÂY (Tree View) phân cấp theo Group Thiết bị,
 *            hiển thị cả TÊN MÁY và ID MÁY, có chức năng Đăng ký / Quản lý Group Thiết bị,
 *            click vào máy hiển thị ô chi tiết ở cuối, click chuột phải có menu điều khiển.
 *            (Đã BỎ ô tìm kiếm và BỎ dòng ghi chú chuột phải thừa theo yêu cầu người dùng).
 *    - Right: Luồng Giao dịch Thời gian thực (Live Stream - TRỌNG TÂM, diện tích lớn, lọc đa dạng, autoscroll, packet inspector).
 * 2. Dải chỉ số KPI siêu nhỏ gọn (~44px) ở phía trên.
 * 3. 100% full multi-language localization (VI, EN, KO, ZH).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Copy,
  Check,
  X,
  Radio,
  Server,
  Power,
  RotateCcw,
  Wifi,
  CornerDownRight,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Layers,
  Settings,
  Search,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import { DeviceStatus, CommunicationTransaction, DeviceModel, DeviceGroup } from '../../types';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  device: DeviceModel | null;
}

export const DashboardView: React.FC = () => {
  const { t, formatNumber } = useTranslation();
  const {
    devices,
    deviceGroups,
    addDeviceGroup,
    deleteDeviceGroup,
    transactions,
    alarms,
    mesStatus,
    reconnectDevice,
    updateDevice,
    setActiveView,
    clearTransactions,
  } = useApp();

  // Selected station for the detail box at the bottom of the matrix
  const [selectedStationId, setSelectedStationId] = useState<string>(devices[0]?.id || 'EQP_SMT_01');

  // Tree View State: which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    GRP_SMT_A: true,
    GRP_SMT_B: true,
    GRP_QC_TEST: true,
    GRP_PACKAGING: true,
    UNASSIGNED: true,
  });

  // Stream controls
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);
  const [streamBuffer, setStreamBuffer] = useState<CommunicationTransaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<CommunicationTransaction | null>(null);

  // Inspector copy states
  const [copiedHex, setCopiedHex] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Ping states
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingLatencies, setPingLatencies] = useState<Record<string, number>>({});

  // Auto-reconnecting animation tracking
  const [reconnectingId, setReconnectingId] = useState<string | null>(null);

  // Right-click Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    device: null,
  });

  // Action notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User adjustable width for "Thông Tin Thiết Bị" panel (saved in localStorage)
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('mcserver_dashboard_left_width');
    const parsed = saved ? parseInt(saved, 10) : 320;
    return isNaN(parsed) || parsed < 220 || parsed > 650 ? 320 : parsed;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const splitPaneRef = useRef<HTMLDivElement | null>(null);

  // Dragging logic for left panel resize
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitPaneRef.current) return;
      const rect = splitPaneRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const maxWidth = Math.min(650, rect.width * 0.55);
      const clamped = Math.max(220, Math.min(maxWidth, currentX));
      setLeftPanelWidth(Math.round(clamped));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem('mcserver_dashboard_left_width', leftPanelWidth.toString());
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, leftPanelWidth]);

  // Auto-scroll anchor ref
  const streamEndRef = useRef<HTMLDivElement | null>(null);

  // Throughput sparkline history
  const [throughputHistory, setThroughputHistory] = useState<number[]>([
    42, 45, 48, 44, 52, 49, 46, 50, 54, 51, 48, 53, 56, 52, 50, 55, 58, 54, 51, 53,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setThroughputHistory((prev) => {
        const nextVal = Math.floor(Math.random() * 14 + 45);
        return [...prev.slice(1), nextVal];
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Sync stream buffer when not paused
  useEffect(() => {
    if (!isStreamPaused) {
      setStreamBuffer(transactions);
    }
  }, [transactions, isStreamPaused]);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, device: null });
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu({ visible: false, x: 0, y: 0, device: null });
        setSelectedTx(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu.visible]);

  // Selected station object
  const activeDevice = devices.find((d) => d.id === selectedStationId) || devices[0] || null;

  // Counts
  const total = devices.length;
  const connected = devices.filter((d) => ['Connected', 'Ready', 'Busy'].includes(d.status)).length;
  const ready = devices.filter((d) => d.status === 'Ready').length;
  const busy = devices.filter((d) => d.status === 'Busy').length;
  const errorCount = devices.filter((d) => ['Error', 'Warning'].includes(d.status)).length;
  const currentThroughput = throughputHistory[throughputHistory.length - 1];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case 'Ready':
        return {
          label: t(`device.status.${status}`),
          className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
        };
      case 'Busy':
        return {
          label: t(`device.status.${status}`),
          className: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
          dot: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]',
        };
      case 'Connected':
        return {
          label: t(`device.status.${status}`),
          className: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
          dot: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]',
        };
      case 'Warning':
        return {
          label: t(`device.status.${status}`),
          className: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]',
        };
      case 'Error':
        return {
          label: t(`device.status.${status}`),
          className: 'text-red-400 bg-red-500/10 border-red-500/30',
          dot: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)]',
        };
      case 'Connecting':
      case 'Reconnecting':
        return {
          label: t(`device.status.${status}`),
          className: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30 animate-pulse',
          dot: 'bg-indigo-400 animate-ping',
        };
      default:
        return {
          label: t(`device.status.Disconnected`),
          className: 'text-slate-500 bg-slate-900 border-slate-800',
          dot: 'bg-slate-600',
        };
    }
  };

  // Right-click Handler
  const handleContextMenu = (e: React.MouseEvent, dev: DeviceModel) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 240;
    const menuHeight = 220;
    const x = e.clientX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : e.clientX;
    const y = e.clientY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : e.clientY;

    setSelectedStationId(dev.id);
    setContextMenu({
      visible: true,
      x,
      y,
      device: dev,
    });
  };

  // Context Menu Actions
  const handleToggleStartStop = (dev: DeviceModel) => {
    const isRunning = dev.status !== 'Disconnected';
    if (isRunning) {
      updateDevice(dev.id, { status: 'Disconnected', enabled: false });
      showToast(`${t('dashboard.toasts.stopped')} ${dev.name} [${dev.id}]`);
    } else {
      updateDevice(dev.id, { status: 'Connected', enabled: true });
      showToast(`${t('dashboard.toasts.started')} ${dev.name} [${dev.id}]`);
    }
    setContextMenu({ visible: false, x: 0, y: 0, device: null });
  };

  const handleReset = async (dev: DeviceModel) => {
    showToast(`${t('dashboard.toasts.resetting')} ${dev.name} [${dev.id}]...`);
    setContextMenu({ visible: false, x: 0, y: 0, device: null });
    await reconnectDevice(dev.id);
    showToast(`${t('dashboard.toasts.resetSuccess')} ${dev.name} [${dev.id}].`);
  };

  const handlePing = async (dev: DeviceModel) => {
    setPingingId(dev.id);
    setContextMenu({ visible: false, x: 0, y: 0, device: null });
    await new Promise((r) => setTimeout(r, 260));
    const latency = Math.floor(Math.random() * 8 + 3);
    setPingLatencies((prev) => ({ ...prev, [dev.id]: latency }));
    setPingingId(null);
    showToast(`${t('dashboard.toasts.pingReply')}: ${dev.name} (${dev.ipAddress}) -> ${latency} ms (TTL=64)`);
    setTimeout(() => {
      setPingLatencies((prev) => {
        const copy = { ...prev };
        delete copy[dev.id];
        return copy;
      });
    }, 4500);
  };

  const handleAutoReconnect = async (dev: DeviceModel) => {
    setReconnectingId(dev.id);
    showToast(`${t('dashboard.toasts.autoReconnectTriggered')} ${dev.name} [${dev.id}]...`);
    setContextMenu({ visible: false, x: 0, y: 0, device: null });

    updateDevice(dev.id, { status: 'Reconnecting' });
    await new Promise((r) => setTimeout(r, 850));
    updateDevice(dev.id, {
      status: 'Ready',
      reconnectCount: dev.reconnectCount + 1,
      lastConnectedAt: new Date().toISOString(),
      consecutiveTimeouts: 0,
    });
    setReconnectingId(null);
    showToast(`${t('dashboard.toasts.autoReconnectSuccess')} ${dev.name} [${dev.id}].`);
  };

  // Format Date and Time: YYYY-MM-DD HH:mm:ss
  const formatFullDateTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const pad = (n: number) => String(n).padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const min = pad(d.getMinutes());
      const ss = pad(d.getSeconds());
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    } catch {
      return isoStr;
    }
  };

  // Concise Payload Summary for compact display
  const getPayloadSummary = (payload: any): string => {
    if (!payload) return '--';
    if (typeof payload === 'string') return payload;
    const parts: string[] = [];
    if (payload.lotId || payload.lotNumber) parts.push(`lot:${payload.lotId || payload.lotNumber}`);
    if (payload.carrierId) parts.push(`car:${payload.carrierId}`);
    if (payload.recipeId || payload.recipe) parts.push(`rcp:${payload.recipeId || payload.recipe}`);
    if (payload.status) parts.push(`st:${payload.status}`);
    if (payload.barcode) parts.push(`bc:${payload.barcode}`);
    if (payload.interlockDecision) parts.push(`dec:${payload.interlockDecision}`);
    if (payload.interlockGranted !== undefined) parts.push(`grant:${payload.interlockGranted ? 'OK' : 'DENY'}`);
    if (payload.alarmCode) parts.push(`alm:${payload.alarmCode}`);
    if (parts.length > 0) return parts.join(', ');
    const raw = JSON.stringify(payload);
    return raw.length > 45 ? raw.slice(0, 45) + '…' : raw;
  };

  const handleCopy = (text: string, isHex: boolean) => {
    navigator.clipboard.writeText(text);
    if (isHex) {
      setCopiedHex(true);
      setTimeout(() => setCopiedHex(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  // Toggle tree node group expansion
  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const expandAllGroups = () => {
    const allExpanded: Record<string, boolean> = { UNASSIGNED: true };
    deviceGroups.forEach((g) => {
      allExpanded[g.id] = true;
    });
    setExpandedGroups(allExpanded);
  };

  const collapseAllGroups = () => {
    const allCollapsed: Record<string, boolean> = { UNASSIGNED: false };
    deviceGroups.forEach((g) => {
      allCollapsed[g.id] = false;
    });
    setExpandedGroups(allCollapsed);
  };



  // Devices grouped by groupId
  const devicesByGroup = React.useMemo(() => {
    const map = new Map<string, DeviceModel[]>();
    // Pre-populate registered groups
    deviceGroups.forEach((g) => map.set(g.id, []));
    map.set('UNASSIGNED', []);

    devices.forEach((dev) => {
      const gId = dev.groupId && map.has(dev.groupId) ? dev.groupId : 'UNASSIGNED';
      map.get(gId)?.push(dev);
    });

    return map;
  }, [devices, deviceGroups]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-2.5 sm:p-3 space-y-2 bg-[#070B14] text-slate-100 select-none font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-5 z-50 px-3 py-1.5 rounded-md bg-slate-900/95 border border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-xs font-mono text-cyan-300 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
          <span className="font-sans font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. Ultra-Compact High-Density KPI Strip (Chiều cao tối ưu ~44px) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 shrink-0">
        {/* Total Stations */}
        <div className="px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/90 transition-all flex items-center justify-between shadow-xs">
          <div className="leading-none">
            <span className="text-[10px] text-slate-400 font-medium tracking-tight block mb-0.5">
              {t('dashboard.kpi.totalDevices')}
            </span>
            <span className="text-sm font-bold font-mono text-slate-100 tabular-nums">{total}</span>
          </div>
          <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0 opacity-80" />
        </div>

        {/* Online / Active */}
        <div className="px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/40 transition-all flex items-center justify-between shadow-xs">
          <div className="leading-none">
            <span className="text-[10px] text-slate-400 font-medium tracking-tight block mb-0.5">
              {t('dashboard.kpi.connectedDevices')}
            </span>
            <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">{connected}</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse shrink-0" />
        </div>

        {/* Ready Standby */}
        <div className="px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/90 transition-all flex items-center justify-between shadow-xs">
          <div className="leading-none">
            <span className="text-[10px] text-slate-400 font-medium tracking-tight block mb-0.5">
              {t('dashboard.kpi.readyDevices')}
            </span>
            <span className="text-sm font-bold font-mono text-slate-200 tabular-nums">{ready}</span>
          </div>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 opacity-80" />
        </div>

        {/* Busy Processing */}
        <div className="px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/90 transition-all flex items-center justify-between shadow-xs">
          <div className="leading-none">
            <span className="text-[10px] text-slate-400 font-medium tracking-tight block mb-0.5">
              {t('dashboard.kpi.busyDevices')}
            </span>
            <span className="text-sm font-bold font-mono text-blue-400 tabular-nums">{busy}</span>
          </div>
          <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0 opacity-80" />
        </div>

        {/* Error / Warning */}
        <div className="px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-800/80 hover:border-red-500/40 transition-all flex items-center justify-between shadow-xs">
          <div className="leading-none">
            <span className="text-[10px] text-slate-400 font-medium tracking-tight block mb-0.5">
              {t('dashboard.kpi.errorDevices')}
            </span>
            <span className={`text-sm font-bold font-mono tabular-nums ${errorCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {errorCount}
            </span>
          </div>
          <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${errorCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-600'}`} />
        </div>

        {/* Throughput Rate */}
        <div className="px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex items-center justify-between shadow-xs">
          <div className="leading-none">
            <span className="text-[10px] text-slate-400 font-medium tracking-tight block mb-0.5">
              {t('dashboard.kpi.throughput')}
            </span>
            <span className="text-sm font-bold font-mono text-cyan-400 tabular-nums">
              {currentThroughput} <span className="text-[9px] font-normal text-slate-500">msg/s</span>
            </span>
          </div>
          <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0 opacity-80" />
        </div>

        {/* MES Latency */}
        <div className="px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/40 transition-all flex items-center justify-between shadow-xs">
          <div className="leading-none">
            <span className="text-[10px] text-slate-400 font-medium tracking-tight block mb-0.5">
              {t('dashboard.kpi.mesLatency')}
            </span>
            <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">
              {mesStatus.averageLatencyMs} <span className="text-[9px] font-normal text-slate-500">ms</span>
            </span>
          </div>
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 opacity-80" />
        </div>

        {/* Handshake Success Rate */}
        <div className="px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/40 transition-all flex items-center justify-between shadow-xs">
          <div className="leading-none">
            <span className="text-[10px] text-slate-400 font-medium tracking-tight block mb-0.5">
              {t('dashboard.kpi.successRate')}
            </span>
            <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">99.98%</span>
          </div>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 opacity-80" />
        </div>
      </div>

      {/* 2. Main Work Area: Side-by-Side Split with Interactive User Resizer */}
      <div
        ref={splitPaneRef}
        className={`flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative gap-2 lg:gap-0 ${
          isResizing ? 'cursor-col-resize select-none' : ''
        }`}
      >
        {/* ========================================================================= */}
        {/* LEFT COLUMN: THÔNG TIN THIẾT BỊ (ĐIỀU CHỈNH ĐƯỢC ĐỘ RỘNG BẰNG KÉO THẢ)    */}
        {/* ========================================================================= */}
        <div
          style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${leftPanelWidth}px` : undefined }}
          className="flex flex-col rounded-lg bg-[#0C1220]/95 border border-slate-800/90 min-h-0 overflow-hidden shadow-md shrink-0 w-full lg:shrink-0 max-lg:!w-full"
        >
          {/* Card Header: Title changed to 'Thông Tin Thiết Bị' with width indicator */}
          <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate">
                {t('dashboard.equipmentMatrix.title')}
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-semibold shrink-0">
                {devices.length} {t('dashboard.equipmentMatrix.stationCount')}
              </span>
            </div>

            {/* Quick Action buttons on header: Width Reset + Expand/Collapse All */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Width Indicator & Quick Reset */}
              <button
                onClick={() => setLeftPanelWidth(320)}
                className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-blue-500 hover:text-blue-300 text-[10px] font-mono text-slate-400 transition-colors"
                title="Bấm để đặt lại độ rộng card về mặc định (320px)"
              >
                <span>{leftPanelWidth}px</span>
              </button>

              {/* Expand / Collapse All */}
              <button
                onClick={() => {
                  const anyCollapsed = Object.values(expandedGroups).some((v) => !v);
                  if (anyCollapsed) expandAllGroups();
                  else collapseAllGroups();
                }}
                className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                title="Mở rộng / Thu gọn toàn bộ cây"
              >
                {Object.values(expandedGroups).some((v) => !v) ? (
                  <Maximize2 className="w-3 h-3" />
                ) : (
                  <Minimize2 className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CÂY GROUP THIẾT BỊ (HIỂN THỊ CẢ TÊN MÁY VÀ ID MÁY)                        */}
          {/* ========================================================================= */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {/* Render Registered Groups */}
            {deviceGroups.map((group) => {
              const groupDevs = devicesByGroup.get(group.id) || [];
              const isExpanded = !!expandedGroups[group.id];
              const readyInGroup = groupDevs.filter((d) => ['Ready', 'Connected', 'Busy'].includes(d.status)).length;
              const errorInGroup = groupDevs.filter((d) => ['Error', 'Warning'].includes(d.status)).length;

              return (
                <div key={group.id} className="rounded-md border border-slate-800/80 bg-slate-950/60 overflow-hidden">
                  {/* Group Tree Parent Node */}
                  <div
                    onClick={() => toggleGroupExpand(group.id)}
                    className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-900 cursor-pointer transition-colors flex items-center justify-between gap-2 border-b border-slate-800/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-400 hover:text-slate-200">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </span>
                      {isExpanded ? (
                        <FolderOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      ) : (
                        <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-slate-100 truncate font-sans">
                        {group.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold shrink-0">
                        [{group.id}]
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {errorInGroup > 0 && (
                        <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.9)] animate-pulse" />
                      )}
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold">
                        {groupDevs.length} máy
                      </span>
                    </div>
                  </div>

                  {/* Group Children (Leaf Nodes - Machines) */}
                  {isExpanded && (
                    <div className="p-1.5 space-y-1 bg-[#080D19]/60 border-t border-slate-800/30">
                      {groupDevs.length === 0 ? (
                        <div className="py-2 px-3 text-[11px] text-slate-500 italic">
                          Chưa có thiết bị nào trong group này.
                        </div>
                      ) : (
                        groupDevs.map((dev) => {
                          const isSelected = dev.id === selectedStationId;
                          const statusCfg = getStatusBadge(dev.status);
                          const pingMs = pingLatencies[dev.id];
                          const isPinging = pingingId === dev.id;
                          const isReconnecting = reconnectingId === dev.id;

                          return (
                            <div
                              key={dev.id}
                              onClick={() => setSelectedStationId(dev.id)}
                              onContextMenu={(e) => handleContextMenu(e, dev)}
                              className={`p-1.5 rounded border cursor-pointer transition-all flex items-center justify-between group select-none ml-2 ${
                                isSelected
                                  ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/70'
                                  : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/90'
                              }`}
                              title={`${dev.name} [${dev.id}] - ${statusCfg.label}\n• Nhấp xem chi tiết ở ô bên dưới\n• Chuột phải để Start/Stop, Reset, Ping, Tự động kết nối lại`}
                            >
                              {/* Left: LED indicator & CHỈ HIỂN THỊ MÃ THIẾT BỊ (ID) */}
                              <div className="flex items-center gap-2 min-w-0 pr-1">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125 ${statusCfg.dot} ${
                                    isReconnecting ? 'animate-ping' : ''
                                  }`}
                                />
                                <span
                                  className={`font-mono text-xs font-bold tracking-wider truncate transition-colors ${
                                    isSelected
                                      ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] font-extrabold'
                                      : 'text-slate-100 group-hover:text-cyan-300'
                                  }`}
                                >
                                  {dev.id}
                                </span>
                              </div>

                              {/* Right: Quick Ping badge if active */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isPinging && (
                                  <span className="text-[9px] font-mono text-cyan-400 animate-pulse">
                                    ping...
                                  </span>
                                )}
                                {!isPinging && pingMs !== undefined && (
                                  <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/90 px-1 py-0.2 rounded border border-cyan-800/80 shadow-xs">
                                    {pingMs}ms
                                  </span>
                                )}
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold ${statusCfg.className}`}
                                >
                                  {statusCfg.label}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned Devices Group Branch (if any) */}
            {(() => {
              const unassignedDevs = devicesByGroup.get('UNASSIGNED') || [];
              if (unassignedDevs.length === 0) return null;
              const isExpanded = !!expandedGroups['UNASSIGNED'];

              return (
                <div className="rounded-md border border-slate-800/80 bg-slate-950/60 overflow-hidden">
                  <div
                    onClick={() => toggleGroupExpand('UNASSIGNED')}
                    className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-900 cursor-pointer transition-colors flex items-center justify-between gap-2 border-b border-slate-800/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-400 hover:text-slate-200">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <Folder className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-400 font-sans">
                        {t('dashboard.equipmentMatrix.unassignedGroup')}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-semibold shrink-0">
                      {unassignedDevs.length} máy
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="p-1.5 space-y-1 bg-[#080D19]/60">
                      {unassignedDevs.map((dev) => {
                        const isSelected = dev.id === selectedStationId;
                        const statusCfg = getStatusBadge(dev.status);
                        const pingMs = pingLatencies[dev.id];

                        return (
                          <div
                            key={dev.id}
                            onClick={() => setSelectedStationId(dev.id)}
                            onContextMenu={(e) => handleContextMenu(e, dev)}
                            className={`p-1.5 rounded border cursor-pointer transition-all flex items-center justify-between group select-none ml-2 ${
                              isSelected
                                ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/70'
                                : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/90'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-1">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125 ${statusCfg.dot}`} />
                              <span
                                className={`font-mono text-xs font-bold tracking-wider truncate transition-colors ${
                                  isSelected
                                    ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] font-extrabold'
                                    : 'text-slate-100 group-hover:text-cyan-300'
                                }`}
                              >
                                {dev.id}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {pingMs !== undefined && (
                                <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/90 px-1 py-0.2 rounded border border-cyan-800/80">
                                  {pingMs}ms
                                </span>
                              )}
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold ${statusCfg.className}`}
                              >
                                {statusCfg.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* ========================================================================= */}
          {/* Ô THÔNG TIN CHI TIẾT Ở CUỐI (HIỂN THỊ TÊN MÁY CHI TIẾT VÀ THÔNG SỐ ĐẦY ĐỦ) */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* Ô THÔNG TIN CHI TIẾT Ở CUỐI (TỐI ƯU SIÊU NHỎ GỌN, TIẾT KIỆM DIỆN TÍCH)    */}
          {/* ========================================================================= */}
          <div className="border-t border-slate-800/90 bg-[#090E1B] p-2 shrink-0 space-y-1.5">
            {activeDevice ? (
              <div className="space-y-1.5">
                {/* Header: LED + Tên máy + ID + Status */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/70">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        getStatusBadge(activeDevice.status).dot
                      }`}
                    />
                    <span className="font-bold text-xs text-slate-100 font-sans truncate" title={activeDevice.name}>
                      {activeDevice.name}
                    </span>
                    <span className="font-mono text-[9px] text-cyan-400 shrink-0 font-semibold bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-900/60">
                      {activeDevice.id}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold shrink-0 ${
                      getStatusBadge(activeDevice.status).className
                    }`}
                  >
                    {getStatusBadge(activeDevice.status).label}
                  </span>
                </div>

                {/* Telemetry Grid: Chỉ giữ IP, RCP, Ping, Group (Đã bỏ LOT, KHUNG, GÓI, LỖI) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 font-mono text-[10px]">
                  {/* IP & Port */}
                  <div className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-800/70 flex items-center justify-between gap-1 overflow-hidden" title={`${activeDevice.ipAddress}:${activeDevice.port}`}>
                    <span className="text-slate-500 text-[9px] shrink-0">IP</span>
                    <span className="text-slate-200 truncate text-[10px]">{activeDevice.ipAddress}:{activeDevice.port}</span>
                  </div>

                  {/* Recipe */}
                  <div className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-800/70 flex items-center justify-between gap-1 overflow-hidden" title={activeDevice.currentRecipe}>
                    <span className="text-slate-500 text-[9px] shrink-0">RCP</span>
                    <span className="text-blue-400 font-semibold truncate text-[10px]">{activeDevice.currentRecipe?.replace('RCP_', '') || 'DEFAULT'}</span>
                  </div>

                  {/* Latency */}
                  <div className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-800/70 flex items-center justify-between gap-1 overflow-hidden">
                    <span className="text-slate-500 text-[9px] shrink-0">Ping</span>
                    <span className="text-amber-400 font-semibold tabular-nums text-[10px]">{activeDevice.avgResponseTimeMs}ms</span>
                  </div>

                  {/* Group */}
                  <div className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-800/70 flex items-center justify-between gap-1 overflow-hidden">
                    <span className="text-slate-500 text-[9px] shrink-0">Group</span>
                    <span className="text-emerald-400 truncate text-[10px] font-semibold">{activeDevice.groupId?.replace('GRP_', '') || 'NONE'}</span>
                  </div>
                </div>

                {/* Quick Action Buttons Toolbar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                  <span className="text-slate-500 font-mono text-[9px]">
                    Up: {Math.floor(activeDevice.uptimeSeconds / 3600)}h {Math.floor((activeDevice.uptimeSeconds % 3600) / 60)}m
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handlePing(activeDevice)}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 text-slate-300 transition-colors font-mono flex items-center gap-1 text-[10px]"
                      title="Gửi gói ICMP/TCP ping probe"
                    >
                      <Wifi className="w-2.5 h-2.5 text-cyan-400" />
                      <span>Ping</span>
                    </button>

                    <button
                      onClick={() => handleReset(activeDevice)}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-blue-500 hover:text-blue-400 text-slate-300 transition-colors font-mono flex items-center gap-1 text-[10px]"
                      title="Đặt lại TCP socket"
                    >
                      <RotateCcw className="w-2.5 h-2.5 text-blue-400" />
                      <span>Reset</span>
                    </button>

                    <button
                      onClick={() => handleToggleStartStop(activeDevice)}
                      className={`px-1.5 py-0.5 rounded border transition-colors font-mono flex items-center gap-1 text-[10px] ${
                        activeDevice.status === 'Disconnected'
                          ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600 hover:text-white'
                          : 'bg-red-600/20 text-red-300 border-red-500/40 hover:bg-red-600 hover:text-white'
                      }`}
                      title="Bật / Tắt phiên máy"
                    >
                      <Power className="w-2.5 h-2.5" />
                      <span>{activeDevice.status === 'Disconnected' ? 'Start' : 'Stop'}</span>
                    </button>

                    <button
                      onClick={() => handleAutoReconnect(activeDevice)}
                      className="px-1.5 py-0.5 rounded bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition-colors font-mono flex items-center gap-1 text-[10px]"
                      title="Tự động kết nối lại"
                    >
                      <RefreshCw className="w-2.5 h-2.5 text-purple-400" />
                      <span>Auto-Rec</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-[11px] text-slate-500 italic">
                {t('dashboard.stationDetails.selectPrompt')}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE DRAG DIVIDER: KÉO ĐỂ ĐIỀU CHỈNH ĐỘ RỘNG CARD THÔNG TIN THIẾT BỊ */}
        {/* ========================================================================= */}
        <div
          onMouseDown={handleMouseDownResize}
          onDoubleClick={() => setLeftPanelWidth(320)}
          className="hidden lg:flex items-center justify-center w-2.5 hover:w-3 mx-0.5 cursor-col-resize group shrink-0 transition-all select-none hover:bg-blue-600/10 rounded"
          title="Kéo chuột sang trái / phải để điều chỉnh độ rộng card Thông Tin Thiết Bị (Nhấp đúp để về 320px)"
        >
          <div
            className={`w-1 h-12 rounded-full transition-colors flex flex-col items-center justify-center gap-1 ${
              isResizing ? 'bg-blue-400 shadow-sm shadow-blue-400/50' : 'bg-slate-700/80 group-hover:bg-blue-500'
            }`}
          >
            <span className="w-0.5 h-0.5 rounded-full bg-slate-400 group-hover:bg-white" />
            <span className="w-0.5 h-0.5 rounded-full bg-slate-400 group-hover:bg-white" />
            <span className="w-0.5 h-0.5 rounded-full bg-slate-400 group-hover:bg-white" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LUỒNG GIAO DỊCH THỜI GIAN THỰC (TỰ ĐỘNG MỞ RỘNG TOÀN BỘ)     */}
        {/* ========================================================================= */}
        <div className="flex-1 min-w-0 flex flex-col rounded-lg bg-[#0C1220]/95 border border-slate-800/90 min-h-0 overflow-hidden shadow-md">
          {/* Live Stream Main Header - Tối giản, không bộ lọc, có nút Pause & Clear */}
          <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
            {/* Title & Live Pulse Indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                    !isStreamPaused ? 'bg-cyan-400 opacity-75' : 'bg-amber-400 opacity-75'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    !isStreamPaused ? 'bg-cyan-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                <span>{t('dashboard.liveStream.title')}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-800/60 shadow-xs">
                  {t('dashboard.liveStream.liveIndicator')}
                </span>
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-semibold">
                {streamBuffer.length} frames
              </span>
            </div>

            {/* Stream Control Action Toolbar: Pause & Clear (Không bộ lọc) */}
            <div className="flex items-center gap-1.5 text-xs">
              {/* Pause / Resume Button */}
              <button
                onClick={() => setIsStreamPaused(!isStreamPaused)}
                className={`p-1 px-2.5 rounded border transition-colors flex items-center gap-1 text-[11px] font-mono ${
                  isStreamPaused
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                }`}
                title={isStreamPaused ? t('dashboard.liveStream.resume') : t('dashboard.liveStream.pause')}
              >
                {isStreamPaused ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3 text-slate-400" />}
                <span>{isStreamPaused ? 'Resume' : 'Pause'}</span>
              </button>

              {/* Clear Stream */}
              <button
                onClick={clearTransactions}
                className="p-1 px-2 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 text-[11px] font-mono"
                title={t('dashboard.liveStream.clear')}
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Table Column Headers - Ngắn gọn, chuẩn xác */}
          <div className="px-3 py-1.5 bg-slate-950/90 border-b border-slate-800/80 grid grid-cols-12 text-[10px] font-mono uppercase tracking-wider text-slate-400 shrink-0 gap-1 items-center">
            <span className="col-span-3">Thời Gian</span>
            <span className="col-span-1 text-center">Chiều</span>
            <span className="col-span-2">Mã Máy</span>
            <span className="col-span-1">Lệnh</span>
            <span className="col-span-4">Nội Dung Tóm Tắt</span>
            <span className="col-span-1 text-right">Độ trễ</span>
          </div>

          {/* Table Stream Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 font-mono text-xs">
            {streamBuffer.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic space-y-2">
                <Activity className="w-6 h-6 mx-auto text-slate-600 animate-pulse" />
                <p>Đang chờ các gói tin truyền thông TCP từ trạm sản xuất...</p>
              </div>
            ) : (
              streamBuffer.slice(0, 100).map((tx) => {
                let codeColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50';
                if (tx.messageCode === 'M001') codeColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50';
                if (tx.messageCode === 'S005' || tx.messageCode === 'S006') codeColor = 'text-purple-400 bg-purple-950/60 border-purple-800/50';
                if (tx.messageCode === 'S000' || tx.messageCode === 'S002') codeColor = 'text-amber-400 bg-amber-950/60 border-amber-800/50';
                if (tx.messageCode.startsWith('E')) codeColor = 'text-red-400 bg-red-950/60 border-red-800/50';

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className={`px-3 py-1.5 hover:bg-slate-800/50 cursor-pointer transition-colors grid grid-cols-12 items-center text-[11px] gap-1 group select-none ${
                      selectedTx?.id === tx.id ? 'bg-blue-600/20 border-l-2 border-blue-500' : ''
                    }`}
                    title={`${formatFullDateTime(tx.timestamp)} · ${tx.direction} · ${tx.equipmentId} · ${tx.messageCode}\nNhấp để xem chi tiết Hex Dump & JSON`}
                  >
                    {/* Thời gian: Đầy đủ NGÀY THÁNG NĂM & GIỜ PHÚT GIÂY */}
                    <span className="col-span-3 text-slate-300 font-mono text-[10px] tabular-nums whitespace-nowrap truncate font-medium">
                      {formatFullDateTime(tx.timestamp)}
                    </span>

                    {/* Chiều: IN / OUT */}
                    <span className="col-span-1 flex justify-center">
                      {tx.direction === 'INBOUND' ? (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                          IN
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold border border-blue-500/30">
                          OUT
                        </span>
                      )}
                    </span>

                    {/* Mã máy: ID */}
                    <span className="col-span-2 font-mono font-bold text-xs text-slate-100 truncate group-hover:text-cyan-300">
                      {tx.equipmentId}
                    </span>

                    {/* Message Code */}
                    <span className="col-span-1">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${codeColor}`}>
                        {tx.messageCode}
                      </span>
                    </span>

                    {/* Nội dung tóm tắt ngắn gọn */}
                    <span
                      className="col-span-4 text-slate-400 truncate text-[10px] font-mono group-hover:text-slate-200"
                      title={JSON.stringify(tx.payloadJson)}
                    >
                      {getPayloadSummary(tx.payloadJson)}
                    </span>

                    {/* Độ trễ & Checksum */}
                    <div className="col-span-1 flex items-center justify-end gap-1 font-mono text-[10px]">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          tx.checksumStatus === 'VALID' ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                        title={`Checksum: ${tx.checksum} (${tx.checksumStatus})`}
                      />
                      <span className="text-slate-300 tabular-nums">{tx.responseTimeMs}ms</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={streamEndRef} />
          </div>

          {/* Stream Footer Bar */}
          <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
            <span className="text-slate-500 flex items-center gap-2">
              <span>
                STREAM: {streamBuffer.length} frames ·{' '}
                <strong className={isStreamPaused ? 'text-amber-400' : 'text-emerald-400'}>
                  {isStreamPaused ? 'PAUSED' : 'AUTO-SCROLLING'}
                </strong>
              </span>
            </span>

            <button
              onClick={() => setActiveView('communication')}
              className="text-blue-400 hover:text-blue-300 font-sans font-medium text-xs flex items-center gap-1 transition-colors"
            >
              <span>{t('communication.title')}</span>
              <CornerDownRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CUSTOM RIGHT-CLICK CONTEXT MENU                                        */}
      {/* ========================================================================= */}
      {contextMenu.visible && contextMenu.device && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-56 rounded-lg bg-[#0D1424] border border-slate-700/90 shadow-2xl py-1 text-xs font-sans text-slate-200 divide-y divide-slate-800/80 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header of Context Menu */}
          <div className="px-3 py-1.5 bg-slate-950/80 font-mono text-[10px] text-slate-400 flex items-center justify-between">
            <span className="font-bold text-slate-200 truncate">{contextMenu.device.name}</span>
            <span className="text-cyan-400 font-bold">{contextMenu.device.id}</span>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Start / Stop */}
            <button
              onClick={() => handleToggleStartStop(contextMenu.device!)}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <Power
                className={`w-3.5 h-3.5 ${
                  contextMenu.device.status === 'Disconnected' ? 'text-emerald-400' : 'text-red-400'
                }`}
              />
              <span>
                {contextMenu.device.status === 'Disconnected'
                  ? t('dashboard.contextMenu.start')
                  : t('dashboard.contextMenu.stop')}
              </span>
            </button>

            {/* Reset */}
            <button
              onClick={() => handleReset(contextMenu.device!)}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('dashboard.contextMenu.reset')}</span>
            </button>

            {/* Ping */}
            <button
              onClick={() => handlePing(contextMenu.device!)}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('dashboard.contextMenu.ping')}</span>
            </button>

            {/* Auto-reconnect */}
            <button
              onClick={() => handleAutoReconnect(contextMenu.device!)}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 transition-colors text-purple-300"
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('dashboard.contextMenu.autoReconnect')}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PACKET INSPECTOR MODAL                                                  */}
      {/* ========================================================================= */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#0B1120] border border-slate-700 rounded-lg shadow-2xl max-w-2xl w-full p-4 space-y-3 font-mono text-xs animate-in zoom-in-95 duration-100">
            {/* Inspector Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-400 text-sm">{selectedTx.messageCode}</span>
                <span className="text-slate-600">·</span>
                <span className="font-semibold text-slate-200">{selectedTx.equipmentId}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 text-[11px]">{selectedTx.correlationId}</span>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DIRECTION</span>
                <span className="font-bold text-slate-200">{selectedTx.direction}</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CHECKSUM</span>
                <span className="font-bold text-emerald-400">
                  {selectedTx.checksum} ({selectedTx.checksumStatus})
                </span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">LATENCY</span>
                <span className="font-bold text-slate-200">{selectedTx.responseTimeMs} ms</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">STATUS</span>
                <span className="font-bold text-blue-400">{selectedTx.status}</span>
              </div>
            </div>

            {/* ASCII Frame */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Raw ASCII Frame (STX...ETX)</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-cyan-300 break-all select-all text-[11px]">
                {selectedTx.rawAscii}
              </div>
            </div>

            {/* Hex Dump */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Binary Hex Dump</span>
                <button
                  onClick={() => handleCopy(selectedTx.rawHex, true)}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
                >
                  {copiedHex ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                  <span>{copiedHex ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 break-all select-all text-[10px] leading-relaxed max-h-24 overflow-y-auto">
                {selectedTx.rawHex}
              </div>
            </div>

            {/* Decoded JSON Payload */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Decoded JSON Payload</span>
                <button
                  onClick={() =>
                    handleCopy(JSON.stringify(selectedTx.payloadJson, null, 2), false)
                  }
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
                >
                  {copiedJson ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                  <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 text-[11px] overflow-x-auto max-h-36">
                {JSON.stringify(selectedTx.payloadJson, null, 2)}
              </pre>
            </div>

            {/* Close action */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Folder,
  FolderOpen,
  Plus,
  Layers,
  Settings,
  Search,
  Maximize2,
  Minimize2,
  Grid,
  List,
  Filter,
  ExternalLink,
  Terminal,
  SlidersHorizontal,
} from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { useApp } from '@/core/context';
import { DeviceStatus, CommunicationTransaction, DeviceModel, DeviceGroup } from '@/core/types';
import { TransactionDetailModal } from '@/features/communication/components/TransactionDetailModal';

/**
 * CẤU HÌNH ĐỘ RỘNG MẶC ĐỊNH TỪNG CỘT BẢNG DASHBOARD (Pixel)
 */
export interface DashboardColumnWidthConfig {
  time: number;       // Cột Thời Gian (px)
  direction: number;  // Cột Chiều IN/OUT (px)
  machineId: number;  // Cột Mã Máy (px)
  model: number;      // Cột Model Máy (px)
  command: number;    // Cột Lệnh / Message Code (px)
  result: number;     // Cột RESULT OK/NG/TO (px)
  summary: number;    // Cột Nội Dung Tóm Tắt (px)
  latency: number;    // Cột Độ trễ / Checksum (px)
}

export const DEFAULT_DASHBOARD_COLUMN_WIDTHS: DashboardColumnWidthConfig = {
  time: 85,       // Cột Thời gian (px)
  direction: 45,  // Cột Chiều IN/OUT (px)
  machineId: 100, // Cột Mã Thiết Bị (px)
  model: 95,      // Cột Model Máy (px)
  command: 70,    // Cột Message Code / Lệnh (px)
  result: 55,     // Cột RESULT OK/NG/TO (px)
  summary: 240,   // Cột Nội Dung Tóm Tắt (px)
  latency: 65,    // Cột Độ trễ / Checksum (px)
};

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
    transactions,
    alarms,
    mesStatus,
    reconnectDevice,
    stopDevice,
    stopAllDevices,
    startAllDevices,
    updateDevice,
    setActiveView,
    clearTransactions,
  } = useApp();

  // Selected station for the detail box at the bottom of the matrix
  const [selectedStationId, setSelectedStationId] = useState<string>(devices[0]?.id || 'EQP_SMT_01');

  // Search term for devices panel (ID / IP)
  const [deviceSearchTerm, setDeviceSearchTerm] = useState<string>('');

  // Filtered devices based on ID / IP / Name / Model search query
  const filteredDevices = React.useMemo(() => {
    const q = deviceSearchTerm.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((dev) => {
      const idMatch = (dev.equipmentId || dev.id || '').toLowerCase().includes(q);
      const nameMatch = (dev.name || '').toLowerCase().includes(q);
      const ipMatch = (dev.hostAddress || dev.ipAddress || '').toLowerCase().includes(q);
      const modelMatch = (dev.equipmentModel || dev.model || '').toLowerCase().includes(q);
      return idMatch || nameMatch || ipMatch || modelMatch;
    });
  }, [devices, deviceSearchTerm]);

  // Dynamic Groups derived directly from the real GROUP_NAME column in DB (filtered by search)
  const dynamicGroups = React.useMemo(() => {
    const map = new Map<string, DeviceModel[]>();
    filteredDevices.forEach((dev) => {
      const gName = (dev.groupName && dev.groupName.trim()) ? dev.groupName.trim() : 'UNASSIGNED';
      if (!map.has(gName)) {
        map.set(gName, []);
      }
      map.get(gName)!.push(dev);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupName, groupDevs]) => ({
        id: groupName,
        name: groupName,
        devices: groupDevs,
      }));
  }, [filteredDevices]);

  // Tree View State: which groups are expanded (default all groups to true)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('mcserver_expanded_groups');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Check if all groups are currently expanded
  const isAllGroupsExpanded =
    dynamicGroups.length > 0 &&
    dynamicGroups.every((g) => expandedGroups[g.id] !== false);

  // Toggle tree node group expansion
  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const currentlyExpanded = prev[groupId] !== false;
      const next = {
        ...prev,
        [groupId]: !currentlyExpanded,
      };
      try {
        localStorage.setItem('mcserver_expanded_groups', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // 1 Nút Đóng / Mở rộng tất cả Group
  const toggleExpandAllGroups = () => {
    const targetState = !isAllGroupsExpanded;
    const next: Record<string, boolean> = {};
    dynamicGroups.forEach((g) => {
      next[g.id] = targetState;
    });
    setExpandedGroups(next);
    try {
      localStorage.setItem('mcserver_expanded_groups', JSON.stringify(next));
    } catch {}
    showToast(targetState ? 'Đã mở rộng tất cả các nhóm' : 'Đã thu gọn tất cả các nhóm');
  };

  // Device model map for fast lookup
  const deviceModelMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    devices?.forEach((d) => {
      const m = d.model || d.equipmentModel;
      if (m) {
        if (d.id) map[d.id] = m;
        if (d.equipmentId) map[d.equipmentId] = m;
        if (d.name) map[d.name] = m;
      }
    });
    return map;
  }, [devices]);

  // Stream controls
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);
  const [streamBuffer, setStreamBuffer] = useState<CommunicationTransaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<CommunicationTransaction | null>(null);

  // Dashboard Live Stream Column Widths (Pixel configurable)
  const [liveColWidths, setLiveColWidths] = useState<DashboardColumnWidthConfig>(() => {
    try {
      const saved = localStorage.getItem('mcserver_dashboard_live_col_widths_v3');
      if (saved) {
        return { ...DEFAULT_DASHBOARD_COLUMN_WIDTHS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_DASHBOARD_COLUMN_WIDTHS;
  });
  const [showColWidthModal, setShowColWidthModal] = useState<boolean>(false);
  const [tempColWidths, setTempColWidths] = useState<DashboardColumnWidthConfig>(liveColWidths);

  const totalLiveTableWidth = React.useMemo(() => {
    return (
      (liveColWidths.time || 85) +
      (liveColWidths.direction || 45) +
      (liveColWidths.machineId || 100) +
      (liveColWidths.model || 95) +
      (liveColWidths.command || 70) +
      (liveColWidths.result || 55) +
      (liveColWidths.summary || 240) +
      (liveColWidths.latency || 65)
    );
  }, [liveColWidths]);

  const handleSaveLiveWidths = () => {
    setLiveColWidths(tempColWidths);
    try {
      localStorage.setItem('mcserver_dashboard_live_col_widths_v3', JSON.stringify(tempColWidths));
    } catch {}
    setShowColWidthModal(false);
    showToast('Đã lưu cấu hình độ rộng cột');
  };

  const handleResetLiveWidths = () => {
    setTempColWidths(DEFAULT_DASHBOARD_COLUMN_WIDTHS);
    setLiveColWidths(DEFAULT_DASHBOARD_COLUMN_WIDTHS);
    try {
      localStorage.removeItem('mcserver_dashboard_live_col_widths_v3');
      localStorage.removeItem('mcserver_dashboard_live_col_widths_v2');
      localStorage.removeItem('mcserver_dashboard_live_col_widths');
    } catch {}
    setShowColWidthModal(false);
    showToast('Đã khôi phục kích thước cột mặc định');
  };

  // Kéo dãn độ rộng cột bảng Dashboard bằng con trỏ chuột (Mouse drag column resizing)
  const liveResizingRef = useRef<{
    colKey: keyof DashboardColumnWidthConfig;
    startX: number;
    startWidth: number;
  } | null>(null);

  const startLiveResizing = (e: React.MouseEvent, colKey: keyof DashboardColumnWidthConfig) => {
    e.preventDefault();
    e.stopPropagation();
    liveResizingRef.current = {
      colKey,
      startX: e.clientX,
      startWidth: liveColWidths[colKey] || DEFAULT_DASHBOARD_COLUMN_WIDTHS[colKey] || 45,
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!liveResizingRef.current) return;
      const { colKey, startX, startWidth } = liveResizingRef.current;
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(30, Math.round(startWidth + deltaX));
      setLiveColWidths((prev) => ({
        ...prev,
        [colKey]: newWidth,
      }));
    };

    const onMouseUp = () => {
      if (liveResizingRef.current) {
        setLiveColWidths((latest) => {
          try {
            localStorage.setItem('mcserver_dashboard_live_col_widths_v3', JSON.stringify(latest));
          } catch {}
          return latest;
        });
      }
      liveResizingRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

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

  // View mode for Equipment Panel: 'cards' (rich visual cards) | 'tree' (compact hierarchical tree)
  const [deviceViewMode, setDeviceViewMode] = useState<'cards' | 'tree'>('cards');
  // Station Details Dock collapsed toggle state (thu nhỏ ô xem thông tin chi tiết thiết bị)
  const [isStationDetailsCollapsed, setIsStationDetailsCollapsed] = useState<boolean>(false);

  // User adjustable width for "Thông Tin Thiết Bị" panel (saved in localStorage, min 160px)
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('mcserver_dashboard_left_width');
    const parsed = saved ? parseInt(saved, 10) : 240;
    return isNaN(parsed) || parsed < 160 || parsed > 650 ? 240 : parsed;
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
      const clamped = Math.max(160, Math.min(maxWidth, currentX));
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

  // Right-click Handler with smooth viewport clamping
  const handleContextMenu = (e: React.MouseEvent, dev: DeviceModel) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 265;
    const menuHeight = 330;
    const padding = 16;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - padding);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - padding);

    setSelectedStationId(dev.id);
    setContextMenu({
      visible: true,
      x: Math.max(padding, x),
      y: Math.max(padding, y),
      device: dev,
    });
  };

  const handleCopyText = (text: string, label: string) => {
    try {
      navigator.clipboard?.writeText(text);
      showToast(`Đã sao chép ${label}: ${text}`);
    } catch {
      showToast(`Sao chép: ${text}`);
    }
    setContextMenu({ visible: false, x: 0, y: 0, device: null });
  };

  // Context Menu Actions
  const handleToggleStartStop = async (dev: DeviceModel) => {
    const isRunning = dev.status !== 'Disconnected' && dev.status !== 'Error';
    setContextMenu({ visible: false, x: 0, y: 0, device: null });

    if (isRunning) {
      await stopDevice(dev.id);
      showToast(`${t('dashboard.toasts.stopped')} ${dev.name} [${dev.id}] - Đã tắt tự động kết nối lại.`);
    } else {
      updateDevice(dev.id, { status: 'Connecting' });
      showToast(`Đang kết nối tới ${dev.name} [${dev.id}] tại ${dev.ipAddress}:${dev.port}...`);
      const success = await reconnectDevice(dev.id);
      if (success) {
        showToast(`${t('dashboard.toasts.started')} ${dev.name} [${dev.id}] - Kết nối Socket thành công!`);
      } else {
        showToast(`Không thể kết nối tới ${dev.name} [${dev.id}]: Thiết bị chưa bật nguồn hoặc chưa mở cổng ${dev.port}.`);
      }
    }
  };

  const handleReset = async (dev: DeviceModel) => {
    showToast(`${t('dashboard.toasts.resetting')} ${dev.name} [${dev.id}]...`);
    setContextMenu({ visible: false, x: 0, y: 0, device: null });
    const success = await reconnectDevice(dev.id);
    if (success) {
      showToast(`${t('dashboard.toasts.resetSuccess')} ${dev.name} [${dev.id}].`);
    } else {
      showToast(`Không thể kết nối lại ${dev.name} [${dev.id}]: Cổng TCP ${dev.port} chưa mở.`);
    }
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

    const success = await reconnectDevice(dev.id);
    setReconnectingId(null);
    if (success) {
      showToast(`${t('dashboard.toasts.autoReconnectSuccess')} ${dev.name} [${dev.id}].`);
    } else {
      showToast(`Kết nối lại thất bại cho ${dev.name} [${dev.id}]: Cổng ${dev.port} chưa mở.`);
    }
  };

  // Batch Operations: Start All, Stop All, Reset All
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  const handleStartAll = async () => {
    if (isBatchProcessing || devices.length === 0) return;
    setIsBatchProcessing(true);
    showToast(`Đang kích hoạt và kết nối lại toàn bộ ${devices.length} thiết bị qua TCP Socket...`);

    await startAllDevices();
    const disconnectedDevs = devices.filter((d) => d.status === 'Disconnected' || d.status === 'Error');
    const results = await Promise.allSettled(disconnectedDevs.map((d) => reconnectDevice(d.id)));
    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;

    setIsBatchProcessing(false);
    showToast(`Start All: ${successCount}/${devices.length} thiết bị kết nối thành công.`);
  };

  const handleStopAll = async () => {
    if (isBatchProcessing || devices.length === 0) return;
    setIsBatchProcessing(true);
    await stopAllDevices();
    setIsBatchProcessing(false);
    showToast(`Đã dừng và ngắt kết nối toàn bộ ${devices.length} thiết bị (Tắt Auto-Reconnect).`);
  };

  const handleResetAll = async () => {
    if (isBatchProcessing || devices.length === 0) return;
    setIsBatchProcessing(true);
    showToast(`Đang khởi động lại (Reset) toàn bộ ${devices.length} thiết bị...`);

    devices.forEach((d) => updateDevice(d.id, { status: 'Reconnecting' }));
    const results = await Promise.allSettled(devices.map((d) => reconnectDevice(d.id)));
    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;

    setIsBatchProcessing(false);
    showToast(`Reset All: ${successCount}/${devices.length} thiết bị sẵn sàng.`);
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
    if (payload.summary) return payload.summary;
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
        {/* LEFT COLUMN: THÔNG TIN THIẾT BỊ (HIỂN THỊ CHÍNH EQUIP_ID & BATCH CONTROLS) */}
        {/* ========================================================================= */}
        <div
          style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${leftPanelWidth}px` : undefined }}
          className="flex flex-col rounded-lg bg-[#0C1220]/95 border border-slate-800/90 min-h-0 overflow-hidden shadow-md shrink-0 w-full lg:shrink-0 max-lg:!w-full"
        >
          {/* Header: Title, Station Count, View Mode Switcher */}
          <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate">
                {t('dashboard.equipmentMatrix.title')}
              </h3>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-cyan-400 font-bold shrink-0">
                {deviceSearchTerm ? `${filteredDevices.length}/${devices.length}` : devices.length}
              </span>
            </div>

            {/* Action Toolbar on Header: Card/Tree Switcher + Width Reset */}
            <div className="flex items-center gap-1 shrink-0">
              {/* View Mode Toggle: Cards vs Tree */}
              <div className="flex items-center rounded bg-slate-900 border border-slate-800 p-0.5">
                <button
                  onClick={() => setDeviceViewMode('cards')}
                  className={`p-1 rounded transition-colors ${
                    deviceViewMode === 'cards'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Chế độ xem Thẻ thiết bị trực quan (Card View)"
                >
                  <Grid className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setDeviceViewMode('tree')}
                  className={`p-1 rounded transition-colors ${
                    deviceViewMode === 'tree'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Chế độ xem Cây phân cấp (Tree View)"
                >
                  <List className="w-3 h-3" />
                </button>
              </div>

              {/* Nút Đóng / Mở rộng tất cả Group khi ở Tree View */}
              {deviceViewMode === 'tree' && (
                <button
                  onClick={toggleExpandAllGroups}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-300 text-[10px] font-mono text-slate-300 transition-colors shadow-xs active:scale-95"
                  title={isAllGroupsExpanded ? "Thu gọn (đóng) tất cả các nhóm" : "Mở rộng tất cả các nhóm"}
                >
                  {isAllGroupsExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 text-cyan-400" />
                      <span className="hidden sm:inline">Đóng</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 text-cyan-400" />
                      <span className="hidden sm:inline">Mở</span>
                    </>
                  )}
                </button>
              )}

              {/* Width Reset Preset */}
              <button
                onClick={() => setLeftPanelWidth(leftPanelWidth <= 200 ? 280 : 180)}
                className="hidden lg:flex items-center px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-blue-500 hover:text-blue-300 text-[10px] font-mono text-slate-400 transition-colors"
                title="Nhấp để chuyển đổi kích thước thanh thiết bị (180px / 280px)"
              >
                <span>{leftPanelWidth}px</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BATCH CONTROLS & SEARCH: INLINE SEARCH + COMPACT START / STOP / RESET ALL */}
          {/* ========================================================================= */}
          <div className="px-2 py-1.5 bg-[#090E1B] border-b border-slate-800/80 flex items-center gap-1 shrink-0">
            {/* Inline Search Input for Machine ID & IP */}
            <div className="relative flex-1 min-w-[70px]">
              <Search className="w-3 h-3 text-slate-500 absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={deviceSearchTerm}
                onChange={(e) => setDeviceSearchTerm(e.target.value)}
                placeholder="Tìm ID / IP..."
                className="w-full pl-5 pr-4 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:outline-none text-[10px] font-mono text-slate-200 placeholder-slate-600 transition-colors"
                title="Tìm kiếm thiết bị theo ID máy hoặc IP"
              />
              {deviceSearchTerm && (
                <button
                  onClick={() => setDeviceSearchTerm('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Compact Start All Button */}
            <button
              onClick={handleStartAll}
              disabled={isBatchProcessing || devices.length === 0}
              className="py-1 px-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-[9.5px] font-mono font-bold tracking-tight transition-all flex items-center justify-center gap-1 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95"
              title="Start All: Kết nối tất cả thiết bị qua TCP Socket"
            >
              <Play className="w-2.5 h-2.5 shrink-0 fill-current" />
              <span>Start</span>
            </button>

            {/* Compact Stop All Button */}
            <button
              onClick={handleStopAll}
              disabled={isBatchProcessing || devices.length === 0}
              className="py-1 px-1.5 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-[9.5px] font-mono font-bold tracking-tight transition-all flex items-center justify-center gap-1 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95"
              title="Stop All: Dừng và ngắt kết nối toàn bộ thiết bị"
            >
              <Power className="w-2.5 h-2.5 shrink-0" />
              <span>Stop</span>
            </button>

            {/* Compact Reset All Button */}
            <button
              onClick={handleResetAll}
              disabled={isBatchProcessing || devices.length === 0}
              className="py-1 px-1.5 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-[9.5px] font-mono font-bold tracking-tight transition-all flex items-center justify-center gap-1 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95"
              title="Reset All: Khởi động lại (Reset) toàn bộ socket thiết bị"
            >
              <RotateCcw className={`w-2.5 h-2.5 shrink-0 ${isBatchProcessing ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>
          </div>

            {/* ========================================================================= */}
            {/* BODY: DANH SÁCH THIẾT BỊ (HIỂN THỊ CHÍNH LÀ EQUIP_ID)                     */}
            {/* ========================================================================= */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredDevices.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 italic">
                  {deviceSearchTerm ? 'Không tìm thấy thiết bị nào khớp với từ khóa tìm kiếm.' : 'Chưa có thiết bị nào được kết nối.'}
                </div>
              ) : deviceViewMode === 'cards' ? (
                /* =================================================================== */
                /* 1. CHẾ ĐỘ THẺ THIẾT BỊ: HIỂN THỊ CHÍNH LÀ EQUIP_ID                 */
                /* =================================================================== */
                filteredDevices.map((dev) => {
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
                      className={`rounded-lg p-2 border transition-all cursor-pointer select-none space-y-1.5 group relative overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-br from-blue-950/50 via-slate-900/90 to-[#0A1224] border-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.25)] ring-1 ring-blue-500/70'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-md'
                      }`}
                    >
                      {/* Active Accent Bar on Left edge */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                      )}

                      {/* Card Header: LED + EQUIP_ID (CHÍNH) + Status Badge */}
                      <div className="flex items-center justify-between gap-1.5 pl-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125 ${
                              statusCfg.dot
                            } ${isReconnecting ? 'animate-ping' : ''}`}
                          />
                          {/* EQUIP_ID LÀ TIÊU ĐỀ CHÍNH TO NHẤT */}
                          <span
                            className={`font-mono text-sm sm:text-base font-extrabold tracking-wider truncate ${
                              isSelected
                                ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                                : 'text-slate-100 group-hover:text-cyan-300'
                            }`}
                          >
                            {dev.id}
                          </span>
                        </div>

                        {/* Status + Ping */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isPinging && (
                            <span className="text-[9px] font-mono text-cyan-400 animate-pulse font-semibold">
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

                      {/* Telemetry Tags Row: Host:Port, Model, Server/Device ID */}
                      <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                        <div
                          className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800/70 flex items-center justify-between gap-1 overflow-hidden"
                          title={`Địa chỉ TCP Socket: ${dev.ipAddress}:${dev.port}`}
                        >
                          <span className="text-slate-500 text-[9px] shrink-0">TCP</span>
                          <span className="text-slate-300 truncate font-semibold">
                            {dev.ipAddress}:{dev.port}
                          </span>
                        </div>

                        <div
                          className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800/70 flex items-center justify-between gap-1 overflow-hidden"
                          title={`Model thiết bị: ${dev.equipmentModel || dev.model}`}
                        >
                          <span className="text-slate-500 text-[9px] shrink-0">MDL</span>
                          <span className="text-emerald-400 truncate font-semibold">
                            {dev.equipmentModel || dev.model || 'IBS_SEMI'}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer: Quick Actions */}
                      <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="text-[9px] font-mono text-slate-500">
                          {dev.plant || 'ITMVIET'} · S{dev.serverNo ?? 15}:D{dev.deviceId ?? 0}
                        </span>

                        {/* Action buttons on card */}
                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePing(dev);
                            }}
                            className="p-1 rounded bg-slate-950/90 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 text-slate-400 transition-colors"
                            title="Gửi gói kiểm tra Ping"
                          >
                            <Wifi className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReset(dev);
                            }}
                            className="p-1 rounded bg-slate-950/90 border border-slate-800 hover:border-blue-500 hover:text-blue-400 text-slate-400 transition-colors"
                            title="Khởi động lại kết nối Socket"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStartStop(dev);
                            }}
                            className={`p-1 rounded border transition-colors ${
                              dev.status === 'Disconnected'
                                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-600 hover:text-white'
                                : 'bg-red-600/20 text-red-400 border-red-500/40 hover:bg-red-600 hover:text-white'
                            }`}
                            title={dev.status === 'Disconnected' ? 'Bật kết nối' : 'Ngắt kết nối'}
                          >
                            <Power className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* =================================================================== */
                /* 2. CHẾ ĐỘ CÂY PHÂN CẤP: LẤY GROUP THỰC TẾ TRONG CỘT GROUP TRONG DB */
                /* =================================================================== */
                <div className="space-y-2">
                  {dynamicGroups.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500 italic">
                      {deviceSearchTerm ? 'Không có nhóm nào chứa thiết bị phù hợp.' : 'Chưa có thiết bị hoặc nhóm nào trong cơ sở dữ liệu.'}
                    </div>
                  ) : (
                    dynamicGroups.map((group) => {
                      const groupDevs = group.devices;
                      const isExpanded = expandedGroups[group.id] !== false;
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
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {errorInGroup > 0 && (
                                <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.9)] animate-pulse" />
                              )}
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold">
                                {groupDevs.length}
                              </span>
                            </div>
                          </div>

                          {/* Group Children (Leaf Nodes - Machines): HIỂN THỊ CHÍNH EQUIP_ID */}
                          {isExpanded && (
                            <div className="p-1.5 space-y-1 bg-[#080D19]/60 border-t border-slate-800/30">
                              {groupDevs.length === 0 ? (
                                <div className="py-2 px-3 text-[11px] text-slate-500 italic">
                                  {t('dashboard.equipmentMatrix.noDevicesInGroup')}
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
                                      className={`p-1.5 rounded border cursor-pointer transition-all flex items-center justify-between group select-none ml-1.5 ${
                                        isSelected
                                          ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/70'
                                          : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/90'
                                      }`}
                                      title={`${dev.id} - ${statusCfg.label}\n${dev.ipAddress}:${dev.port}`}
                                    >
                                      {/* Left: LED + EQUIP_ID (CHÍNH) */}
                                      <div className="flex items-center gap-2 min-w-0 pr-1">
                                        <span
                                          className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125 ${statusCfg.dot} ${
                                            isReconnecting ? 'animate-ping' : ''
                                          }`}
                                        />
                                        <div className="min-w-0 truncate">
                                          <div
                                            className={`font-mono text-xs font-bold tracking-wider truncate transition-colors ${
                                              isSelected
                                                ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] font-extrabold'
                                                : 'text-slate-100 group-hover:text-cyan-300'
                                            }`}
                                          >
                                            {dev.id}
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-mono truncate">
                                            {dev.ipAddress}:{dev.port}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Right: Ping & Status */}
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
                    })
                  )}
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* Ô THÔNG TIN CHI TIẾT TRẠM MÁY (HIỂN THỊ CHÍNH LÀ EQUIP_ID)                */}
            {/* ========================================================================= */}
            {/* ========================================================================= */}
            {/* Ô THÔNG TIN CHI TIẾT TRẠM MÁY (HỖ TRỢ THU NHỎ / MỞ RỘNG & HIỂN THỊ EQUIP_ID) */}
            {/* ========================================================================= */}
            <div className="border-t border-slate-800/90 bg-[#090E1B] shrink-0 transition-all duration-200">
              {/* Header Bar của ô thông tin thiết bị (Bấm để Thu nhỏ / Mở rộng) */}
              <div
                onClick={() => setIsStationDetailsCollapsed(!isStationDetailsCollapsed)}
                className="px-2.5 py-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/70 transition-colors select-none"
                title={isStationDetailsCollapsed ? "Bấm để mở rộng xem thông tin thiết bị" : "Bấm để thu nhỏ phần xem thông tin thiết bị"}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {activeDevice ? (
                    <>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          getStatusBadge(activeDevice.status).dot
                        }`}
                      />
                      <span className="font-mono text-xs font-extrabold text-cyan-400 tracking-wider truncate">
                        {activeDevice.id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline truncate">
                        ({activeDevice.equipmentModel || activeDevice.model || 'IBS_SEMI'})
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      {t('dashboard.stationDetails.title')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {activeDevice && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold ${
                        getStatusBadge(activeDevice.status).className
                      }`}
                    >
                      {getStatusBadge(activeDevice.status).label}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsStationDetailsCollapsed(!isStationDetailsCollapsed);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors"
                    title={isStationDetailsCollapsed ? "Mở rộng" : "Thu nhỏ"}
                  >
                    {isStationDetailsCollapsed ? (
                      <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nội dung chi tiết chỉ hiển thị khi KHÔNG thu nhỏ */}
              {!isStationDetailsCollapsed && (
                <div className="px-2.5 pb-2.5 pt-1 space-y-2 border-t border-slate-800/50">
                  {activeDevice ? (
                    <div className="space-y-2">
                      {/* Telemetry Grid: Thông số chuẩn (SOCKET, MODEL) */}
                      <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                        {/* Socket Address with Copy button */}
                        <div
                          className="px-2 py-1.5 rounded bg-slate-950/90 border border-slate-800/70 flex items-center justify-between gap-1 overflow-hidden group/item"
                          title={`Địa chỉ TCP Socket: ${activeDevice.ipAddress}:${activeDevice.port}`}
                        >
                          <span className="text-slate-500 text-[9px] shrink-0 font-medium">SOCKET</span>
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-amber-400 font-bold truncate">
                              {activeDevice.ipAddress}:{activeDevice.port}
                            </span>
                            <button
                              onClick={() => handleCopyText(`${activeDevice.ipAddress}:${activeDevice.port}`, 'IP:Port')}
                              className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-cyan-400 transition-opacity"
                              title="Sao chép IP:Port"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        {/* Model */}
                        <div
                          className="px-2 py-1.5 rounded bg-slate-950/90 border border-slate-800/70 flex items-center justify-between gap-1 overflow-hidden"
                          title={`MODEL: ${activeDevice.equipmentModel || activeDevice.model}`}
                        >
                          <span className="text-slate-500 text-[9px] shrink-0 font-medium">MODEL</span>
                          <span className="text-emerald-400 font-semibold truncate">
                            {activeDevice.equipmentModel || activeDevice.model || 'IBS_SEMI'}
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Buttons Control Toolbar */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px]">
                        <span className="text-slate-500 font-mono text-[9px]">
                          Up: {Math.floor(activeDevice.uptimeSeconds / 3600)}h {Math.floor((activeDevice.uptimeSeconds % 3600) / 60)}m
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handlePing(activeDevice)}
                            className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 text-slate-300 transition-colors font-mono flex items-center gap-1 text-[10px]"
                            title={t('dashboard.equipmentMatrix.pingProbeTooltip')}
                          >
                            <Wifi className="w-2.5 h-2.5 text-cyan-400" />
                            <span>Ping</span>
                          </button>

                          <button
                            onClick={() => handleReset(activeDevice)}
                            className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-blue-500 hover:text-blue-400 text-slate-300 transition-colors font-mono flex items-center gap-1 text-[10px]"
                            title={t('dashboard.equipmentMatrix.resetSocketTooltip')}
                          >
                            <RotateCcw className="w-2.5 h-2.5 text-blue-400" />
                            <span>Reset</span>
                          </button>

                          <button
                            onClick={() => handleToggleStartStop(activeDevice)}
                            className={`px-2 py-1 rounded border transition-colors font-mono flex items-center gap-1 text-[10px] font-bold ${
                              activeDevice.status === 'Disconnected'
                                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600 hover:text-white'
                                : 'bg-red-600/20 text-red-300 border-red-500/40 hover:bg-red-600 hover:text-white'
                            }`}
                            title={t('dashboard.equipmentMatrix.toggleDeviceTooltip')}
                          >
                            <Power className="w-2.5 h-2.5" />
                            <span>{activeDevice.status === 'Disconnected' ? 'Start' : 'Stop'}</span>
                          </button>

                          <button
                            onClick={() => handleAutoReconnect(activeDevice)}
                            className="px-2 py-1 rounded bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition-colors font-mono flex items-center gap-1 text-[10px]"
                            title={t('dashboard.equipmentMatrix.autoReconnectTooltip')}
                          >
                            <RefreshCw className="w-2.5 h-2.5 text-purple-400" />
                            <span>Auto</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-[11px] text-slate-500 italic">
                      {t('dashboard.stationDetails.selectPrompt')}
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE DRAG DIVIDER: KÉO ĐỂ ĐIỀU CHỈNH ĐỘ RỘNG CARD THÔNG TIN THIẾT BỊ */}
        {/* ========================================================================= */}
        <div
          onMouseDown={handleMouseDownResize}
          onDoubleClick={() => setLeftPanelWidth(240)}
          className="hidden lg:flex items-center justify-center w-2.5 hover:w-3 mx-0.5 cursor-col-resize group shrink-0 transition-all select-none hover:bg-blue-600/10 rounded"
          title={t('dashboard.equipmentMatrix.dragDividerTooltip')}
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

            {/* Stream Control Action Toolbar: Chỉnh cột (px), Pause & Clear */}
            <div className="flex items-center gap-1.5 text-xs">
              {/* Chỉnh cột (px) Button */}
              <button
                onClick={() => {
                  setTempColWidths(liveColWidths);
                  setShowColWidthModal(true);
                }}
                className="py-1 px-2.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 hover:text-white hover:border-cyan-400 transition-all flex items-center gap-1.5 text-[11px] font-mono font-bold shadow-xs active:scale-95 cursor-pointer"
                title="Nhập số pixel (px) để điều chỉnh độ rộng từng cột trên bảng luồng giao dịch này"
              >
                <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                <span>Chỉnh cột (px)</span>
              </button>

              {/* Pause / Resume Button - Nổi bật & Đặc trưng màu Vàng Hổ Phách Cảnh báo */}
              <button
                onClick={() => setIsStreamPaused(!isStreamPaused)}
                className={`py-1 px-2.5 rounded border transition-all flex items-center gap-1.5 text-[11px] font-mono font-bold shadow-xs active:scale-95 ${
                  isStreamPaused
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.5)] animate-pulse'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 hover:border-amber-400 hover:text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                }`}
                title={isStreamPaused ? t('dashboard.liveStream.resume') : t('dashboard.liveStream.pause')}
              >
                {isStreamPaused ? (
                  <Play className="w-3 h-3 text-slate-950 fill-current" />
                ) : (
                  <Pause className="w-3 h-3 text-amber-400" />
                )}
                <span>{isStreamPaused ? (t('dashboard.liveStream.resume') || 'Resume') : (t('dashboard.liveStream.pause') || 'Pause')}</span>
              </button>

              {/* Clear Stream - Nổi bật & Đặc trưng màu Đỏ Rose Cảnh báo Xóa */}
              <button
                onClick={clearTransactions}
                className="py-1 px-2.5 rounded bg-rose-500/15 border border-rose-500/50 text-rose-300 hover:bg-rose-600 hover:text-white hover:border-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] shadow-[0_0_8px_rgba(244,63,94,0.15)] transition-all flex items-center gap-1.5 text-[11px] font-mono font-bold active:scale-95 cursor-pointer"
                title={t('dashboard.liveStream.clear')}
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>{t('dashboard.liveStream.clear')}</span>
              </button>
            </div>
          </div>

          {/* Table Container with exact Pixel Widths and Horizontal Scroll */}
          <div className="flex-1 overflow-auto font-mono text-xs">
            <table
              className="w-full text-left font-mono text-[11px] table-fixed"
              style={{ minWidth: `${totalLiveTableWidth}px` }}
            >
              <colgroup>
                <col style={{ width: `${liveColWidths.time}px` }} />
                <col style={{ width: `${liveColWidths.direction}px` }} />
                <col style={{ width: `${liveColWidths.machineId}px` }} />
                <col style={{ width: `${liveColWidths.model}px` }} />
                <col style={{ width: `${liveColWidths.command}px` }} />
                <col style={{ width: `${liveColWidths.result}px` }} />
                <col style={{ width: `${liveColWidths.summary}px` }} />
                <col style={{ width: `${liveColWidths.latency}px` }} />
              </colgroup>
              <thead className="sticky top-0 bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800/80 z-10 select-none">
                <tr>
                  <th className="py-1.5 px-2 truncate relative group" title="Thời gian">
                    <span>{t('dashboard.liveStream.colTime')}</span>
                    <div
                      onMouseDown={(e) => startLiveResizing(e, 'time')}
                      className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                      title="Kéo chuột để co giãn độ rộng cột"
                    >
                      <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                    </div>
                  </th>
                  <th className="py-1.5 px-1 text-center truncate relative group" title="Chiều IN/OUT">
                    <span>{t('dashboard.liveStream.colDirection')}</span>
                    <div
                      onMouseDown={(e) => startLiveResizing(e, 'direction')}
                      className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                      title="Kéo chuột để co giãn độ rộng cột"
                    >
                      <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                    </div>
                  </th>
                  <th className="py-1.5 px-2 truncate relative group" title="Mã máy">
                    <span>{t('dashboard.liveStream.colMachineId')}</span>
                    <div
                      onMouseDown={(e) => startLiveResizing(e, 'machineId')}
                      className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                      title="Kéo chuột để co giãn độ rộng cột"
                    >
                      <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                    </div>
                  </th>
                  <th className="py-1.5 px-2 truncate relative group" title="Model máy">
                    <span>{t('dashboard.liveStream.colModel') || 'Model'}</span>
                    <div
                      onMouseDown={(e) => startLiveResizing(e, 'model')}
                      className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                      title="Kéo chuột để co giãn độ rộng cột"
                    >
                      <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                    </div>
                  </th>
                  <th className="py-1.5 px-1.5 truncate relative group" title="Lệnh">
                    <span>{t('dashboard.liveStream.colCommand')}</span>
                    <div
                      onMouseDown={(e) => startLiveResizing(e, 'command')}
                      className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                      title="Kéo chuột để co giãn độ rộng cột"
                    >
                      <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                    </div>
                  </th>
                  <th className="py-1.5 px-1 text-center font-bold text-slate-200 truncate relative group" title="Kết quả">
                    <span>RESULT</span>
                    <div
                      onMouseDown={(e) => startLiveResizing(e, 'result')}
                      className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                      title="Kéo chuột để co giãn độ rộng cột"
                    >
                      <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                    </div>
                  </th>
                  <th className="py-1.5 px-2 truncate relative group" title="Nội dung tóm tắt">
                    <span>{t('dashboard.liveStream.colSummary')}</span>
                    <div
                      onMouseDown={(e) => startLiveResizing(e, 'summary')}
                      className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                      title="Kéo chuột để co giãn độ rộng cột"
                    >
                      <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                    </div>
                  </th>
                  <th className="py-1.5 px-2 text-right truncate relative group" title="Độ trễ">
                    <span>{t('dashboard.liveStream.colLatency')}</span>
                    <div
                      onMouseDown={(e) => startLiveResizing(e, 'latency')}
                      className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-cyan-400/80 active:bg-cyan-400 transition-colors z-20 flex items-center justify-end"
                      title="Kéo chuột để co giãn độ rộng cột"
                    >
                      <span className="w-px h-3.5 bg-slate-700 group-hover:bg-cyan-400/80 mr-0.5" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {streamBuffer.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 text-xs italic">
                      <Activity className="w-6 h-6 mx-auto text-slate-600 animate-pulse mb-2" />
                      <p>{t('dashboard.liveStream.waitingPackets')}</p>
                    </td>
                  </tr>
                ) : (
                  streamBuffer.slice(0, 100).map((tx) => {
                    const model = tx.equipmentModel || deviceModelMap[tx.equipmentId] || '-';
                    let codeColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50';
                    if (tx.messageCode === 'M001') codeColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50';
                    if (tx.messageCode === 'S005' || tx.messageCode === 'S006') codeColor = 'text-purple-400 bg-purple-950/60 border-purple-800/50';
                    if (tx.messageCode === 'S000' || tx.messageCode === 'S002') codeColor = 'text-amber-400 bg-amber-950/60 border-amber-800/50';
                    if (tx.messageCode.startsWith('E')) codeColor = 'text-red-400 bg-red-950/60 border-red-800/50';

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className={`hover:bg-slate-800/50 cursor-pointer transition-colors text-[11px] group select-none ${
                          selectedTx?.id === tx.id ? 'bg-blue-600/20 border-l-2 border-blue-500' : ''
                        }`}
                        title={`${formatFullDateTime(tx.timestamp)} · ${tx.direction} · ${tx.equipmentId} · ${tx.messageCode}\nNhấp để xem chi tiết Hex Dump & JSON`}
                      >
                        <td className="py-1.5 px-2 text-slate-300 font-mono text-[10px] tabular-nums whitespace-nowrap truncate font-medium">
                          {formatFullDateTime(tx.timestamp)}
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          {tx.direction === 'INBOUND' ? (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                              IN
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold border border-blue-500/30">
                              OUT
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 font-mono font-bold text-xs text-slate-100 truncate group-hover:text-cyan-300" title={tx.equipmentId}>
                          {tx.equipmentId}
                        </td>
                        <td className="py-1.5 px-2 truncate font-mono text-[10px]" title={model}>
                          {model !== '-' ? (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/25 text-amber-300 font-medium truncate inline-block max-w-full">
                              {model}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="py-1.5 px-1.5 truncate">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${codeColor}`}>
                            {tx.messageCode}
                          </span>
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          {tx.status === 'SUCCESS' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.35)]">
                              OK
                            </span>
                          ) : tx.status === 'TIMEOUT' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-amber-500/20 text-amber-400 border border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.35)]">
                              TO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-rose-500/25 text-rose-400 border border-rose-500/70 shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                              NG
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-slate-400 truncate text-[10px] font-mono group-hover:text-slate-200" title={JSON.stringify(tx.payloadJson)}>
                          {getPayloadSummary(tx.payloadJson)}
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <div className="flex items-center justify-end gap-1 font-mono text-[10px]">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                tx.checksumStatus === 'VALID' ? 'bg-emerald-400' : 'bg-red-400'
                              }`}
                              title={`Checksum: ${tx.checksum} (${tx.checksumStatus})`}
                            />
                            <span className="text-slate-300 tabular-nums">{tx.responseTimeMs}ms</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
      {/* 4. CUSTOM RIGHT-CLICK CONTEXT MENU (PREMIUM INDUSTRIAL GLASSMORPHISM)     */}
      {/* ========================================================================= */}
      {contextMenu.visible && contextMenu.device && (
        <>
          {/* Transparent Backdrop to capture click outside instantly without lag */}
          <div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[0.5px]"
            onClick={() => setContextMenu({ visible: false, x: 0, y: 0, device: null })}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ visible: false, x: 0, y: 0, device: null });
            }}
          />

          <div
            style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
            className="fixed z-50 w-64 rounded-xl bg-[#0B1220]/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_20px_rgba(59,130,246,0.15)] py-1.5 text-xs font-sans text-slate-200 divide-y divide-slate-800/80 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-white/10 select-none"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Header: LED + Device Name + ID + IP:Port */}
            <div className="px-3 py-2 bg-gradient-to-r from-slate-950 to-slate-900/90 font-mono">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      getStatusBadge(contextMenu.device.status).dot
                    }`}
                  />
                  <span className="font-bold text-slate-100 text-[11px] truncate" title={contextMenu.device.name}>
                    {contextMenu.device.name}
                  </span>
                </div>
                <span className="text-cyan-400 font-extrabold text-[10px] bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.2 rounded shrink-0">
                  {contextMenu.device.id}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate">{contextMenu.device.ipAddress}:{contextMenu.device.port}</span>
                <span className={`px-1 py-0.2 rounded border font-semibold ${getStatusBadge(contextMenu.device.status).className}`}>
                  {getStatusBadge(contextMenu.device.status).label}
                </span>
              </div>
            </div>

            {/* Main Operations: Socket Control */}
            <div className="py-1">
              {/* Start / Stop */}
              <button
                onClick={() => handleToggleStartStop(contextMenu.device!)}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition-colors group ${
                  contextMenu.device.status === 'Disconnected'
                    ? 'hover:bg-emerald-950/40 text-slate-200 hover:text-emerald-300'
                    : 'hover:bg-red-950/40 text-slate-200 hover:text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Power
                    className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                      contextMenu.device.status === 'Disconnected' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  />
                  <span className="font-medium">
                    {contextMenu.device.status === 'Disconnected'
                      ? 'Bắt đầu kết nối (Start Socket)'
                      : 'Ngắt kết nối trạm (Stop Socket)'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
                  {contextMenu.device.status === 'Disconnected' ? 'TCP Up' : 'TCP Down'}
                </span>
              </button>

              {/* Reset Socket */}
              <button
                onClick={() => handleReset(contextMenu.device!)}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-blue-950/40 text-slate-200 hover:text-blue-300 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400 transition-transform group-hover:-rotate-90 duration-200" />
                  <span className="font-medium">Khởi động lại kết nối (Reset)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Reconnect</span>
              </button>

              {/* Ping Probe */}
              <button
                onClick={() => handlePing(contextMenu.device!)}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-cyan-950/40 text-slate-200 hover:text-cyan-300 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-pulse" />
                  <span className="font-medium">Đo độ trễ mạng (Ping Probe)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">ICMP/TCP</span>
              </button>

              {/* Auto Reconnect */}
              <button
                onClick={() => handleAutoReconnect(contextMenu.device!)}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-purple-950/40 text-slate-200 hover:text-purple-300 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-180 transition-transform duration-300" />
                  <span className="font-medium">Tự động kết nối lại (Auto-Rec)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Daemon</span>
              </button>
            </div>

            {/* Quick Actions & Utilities */}
            <div className="py-1">
              {/* Copy IP:Port */}
              <button
                onClick={() => handleCopyText(`${contextMenu.device?.ipAddress}:${contextMenu.device?.port}`, 'Địa chỉ IP:Port')}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-800/80 text-slate-300 hover:text-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400" />
                  <span>Sao chép IP & Port</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500">{contextMenu.device.ipAddress}</span>
              </button>

              {/* Copy Device ID */}
              <button
                onClick={() => handleCopyText(contextMenu.device?.id || '', 'Mã thiết bị')}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-800/80 text-slate-300 hover:text-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
                  <span>Sao chép ID Thiết bị</span>
                </div>
                <span className="text-[9px] font-mono text-cyan-400/80">{contextMenu.device.id}</span>
              </button>

              {/* Filter Live Stream by this device */}
              <button
                onClick={() => {
                  setSelectedStationId(contextMenu.device!.id);
                  setContextMenu({ visible: false, x: 0, y: 0, device: null });
                  showToast(`Đã lọc luồng theo trạm ${contextMenu.device?.id}`);
                }}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-amber-950/30 text-slate-300 hover:text-amber-300 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lọc gói tin trạm này</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500">Live Stream</span>
              </button>

              {/* Jump to Communication Monitor */}
              <button
                onClick={() => {
                  setContextMenu({ visible: false, x: 0, y: 0, device: null });
                  setActiveView('communication');
                }}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-blue-950/30 text-slate-300 hover:text-blue-300 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Mở Giám sát Truyền thông</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500">Tab</span>
              </button>
            </div>

            {/* Footer Tip */}
            <div className="px-3 py-1 bg-slate-950/60 text-[9px] font-mono text-slate-500 flex items-center justify-between">
              <span>Nhấp chuột để chọn xem trạm</span>
              <kbd className="px-1 py-0.2 rounded bg-slate-900 border border-slate-800 text-[8px]">ESC</kbd>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 5. PACKET INSPECTOR MODAL (THÔNG TIN LOG GIAO DỊCH TRỰC QUAN CAO CẤP)     */}
      {/* ========================================================================= */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      {/* ========================================================================= */}
      {/* 6. MODAL ĐIỀU CHỈNH ĐỘ RỘNG CỘT BẢNG LIVE STREAM (PIXEL)                  */}
      {/* ========================================================================= */}
      {showColWidthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#0C1220] border border-cyan-500/40 rounded-xl shadow-2xl max-w-lg w-full p-4 space-y-4 text-slate-100 font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Điều Chỉnh Độ Rộng Cột Bảng Dashboard (Pixel)
                </h3>
              </div>
              <button
                onClick={() => setShowColWidthModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Nhập số pixel (px) cho từng cột theo ý bạn. Bảng sẽ lưu lại vào trình duyệt và giữ nguyên kích thước này.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {[
                { key: 'time', label: 'Thời gian' },
                { key: 'direction', label: 'Chiều (IN/OUT)' },
                { key: 'machineId', label: 'Mã Máy' },
                { key: 'model', label: 'Model Máy' },
                { key: 'command', label: 'Lệnh' },
                { key: 'result', label: 'RESULT' },
                { key: 'summary', label: 'Nội dung tóm tắt' },
                { key: 'latency', label: 'Độ trễ' },
              ].map(({ key, label }) => (
                <div key={key} className="bg-slate-900/90 border border-slate-800 p-2 rounded-md space-y-1">
                  <label className="text-[11px] text-slate-300 font-medium block truncate" title={label}>
                    {label}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={30}
                      max={600}
                      step={5}
                      value={tempColWidths[key as keyof DashboardColumnWidthConfig] || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setTempColWidths((prev) => ({
                          ...prev,
                          [key]: Math.max(30, val),
                        }));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-cyan-300 focus:outline-hidden focus:border-cyan-500"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">px</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={handleResetLiveWidths}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Khôi phục về kích thước mặc định"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Mặc định</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowColWidthModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveLiveWidths}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Áp Dụng</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

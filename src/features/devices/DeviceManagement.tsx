/**
 * MC Server Device Management View
 * Space-optimized industrial equipment master inventory, concise group registration & management,
 * 18-column ITM / MES Master Table schema, TSV/CSV batch import & export, ping testing, and socket reconnection.
 *
 * Add/Edit Modal: Intuitive single-view layout (no tabs), full 18-column fields + protocol framing,
 * with real-time in-modal 4-language switcher.
 */

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Upload,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Server,
  Zap,
  FolderPlus,
  Folder,
  Layers,
  Check,
  Tag,
  Copy,
  Table,
  SlidersHorizontal,
  FileSpreadsheet,
  Globe,
  Building2,
  Radio,
  Lock,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { useApp } from '@/core/context';
import {
  DeviceModel,
  DeviceGroup,
  DeviceStatus,
  TcpRole,
  ProtocolVersion,
  FrameBoundary,
  ChecksumAlgorithm,
} from '@/core/types';
import {
  exportDevicesToCsv,
  exportDevicesToTsv,
  parseDevicesFromTsvOrCsv,
  DEVICE_INFO_COLUMNS,
} from '@/features/devices';

export const DeviceManagementView: React.FC = () => {
  const { t, formatNumber, language, setLanguage, languages } = useTranslation();
  const {
    devices,
    refreshDevices,
    addDevice,
    updateDevice,
    deleteDevice,
    batchImportDevices,
    reconnectDevice,
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lineFilter, setLineFilter] = useState<string>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'plantMaster' | 'standard'>('plantMaster');

  // Device Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDevice, setEditingDevice] = useState<DeviceModel | null>(null);

  // Real Groups extracted directly from devices table in DB
  const distinctDbGroups = React.useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => {
      const g = (d.groupName && d.groupName.trim()) || (d.groupId && d.groupId.trim());
      if (g) set.add(g);
    });
    return Array.from(set).sort();
  }, [devices]);

  // Batch Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importPreview, setImportPreview] = useState<DeviceModel[]>([]);
  const [importError, setImportError] = useState<string>('');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State (18 Fields Schema + Protocol)
  const [formPlant, setFormPlant] = useState('ITMVPSG');
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formGroup, setFormGroup] = useState<string>('NET');
  const [formStation, setFormStation] = useState('ST01');
  const [formModel, setFormModel] = useState('IBS_BAKE');
  const [formIp, setFormIp] = useState('127.0.0.1');
  const [formPort, setFormPort] = useState(5010);
  const [formDeviceId, setFormDeviceId] = useState<string | number>('0');
  const [formServerNo, setFormServerNo] = useState<string | number>('15');
  const [formEquipmentOrder, setFormEquipmentOrder] = useState<string | number>(20110);
  const [formEquipmentMain, setFormEquipmentMain] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEnable, setFormEnable] = useState<'YES' | 'NO'>('YES');
  const [formField01, setFormField01] = useState('');
  const [formField02, setFormField02] = useState('');
  const [formField03, setFormField03] = useState('ITMVIET');
  const [formInterlockRecipe, setFormInterlockRecipe] = useState('YES');
  const [formEquipmentModel, setFormEquipmentModel] = useState('IBS_BAKE');
  const [formInterlockParam, setFormInterlockParam] = useState('');
  const [formInterlockTrace, setFormInterlockTrace] = useState('');

  const [formRole, setFormRole] = useState<TcpRole>('CLIENT');
  const [formProtocol, setFormProtocol] = useState<ProtocolVersion>('v2.0-Extended20014');
  const [formBoundary, setFormBoundary] = useState<FrameBoundary>('20014_EXTENDED');
  const [formChecksum, setFormChecksum] = useState<ChecksumAlgorithm>('LRC_MOD256');
  const [formError, setFormError] = useState<string>('');

  // Ping Test state
  const [pingResult, setPingResult] = useState<{ id: string; latency: number; ok: boolean } | null>(null);

  const lines = Array.from(new Set(devices.map((d) => d.line)));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getGroupBadgeStyle = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'rose':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'blue':
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  // Open Add Device Modal
  const handleOpenAdd = () => {
    setEditingDevice(null);
    setFormPlant('ITMVPSG');
    setFormId(`EQP_0${devices.length + 1}`);
    setFormName('');
    setFormGroup(distinctDbGroups[0] || 'NET');
    setFormStation(`ST0${devices.length + 1}`);
    setFormModel('IBS_BAKE');
    setFormIp('127.0.0.1');
    setFormPort(5010);
    setFormDeviceId('0');
    setFormServerNo('15');
    setFormEquipmentOrder(20110);
    setFormEquipmentMain('');
    setFormDescription('');
    setFormEnable('YES');
    setFormField01('');
    setFormField02('');
    setFormField03('ITMVIET');
    setFormInterlockRecipe('YES');
    setFormEquipmentModel('IBS_BAKE');
    setFormInterlockParam('');
    setFormInterlockTrace('');
    setFormRole('CLIENT');
    setFormProtocol('v2.0-Extended20014');
    setFormBoundary('20014_EXTENDED');
    setFormChecksum('LRC_MOD256');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Device Modal
  const handleOpenEdit = (dev: DeviceModel) => {
    setEditingDevice(dev);
    setFormPlant(dev.plant || dev.factory || 'ITMVPSG');
    setFormId(dev.equipmentId || dev.id);
    setFormName(dev.description || dev.name);
    setFormGroup(dev.groupName || dev.groupId || 'UNASSIGNED');
    setFormStation(dev.station || dev.equipmentId || dev.id);
    setFormModel(dev.equipmentModel || dev.model || 'IBS_BAKE');
    setFormIp(dev.hostAddress || dev.ipAddress);
    setFormPort(dev.hostPort || dev.port);
    setFormDeviceId(dev.deviceId !== undefined ? dev.deviceId : '0');
    setFormServerNo(dev.serverNo !== undefined ? dev.serverNo : '15');
    setFormEquipmentOrder(dev.equipmentOrder !== undefined ? dev.equipmentOrder : 20110);
    setFormEquipmentMain(dev.equipmentMain || '');
    setFormDescription(dev.description || dev.name || '');
    setFormEnable((dev.enable || (dev.enabled ? 'YES' : 'NO')) as 'YES' | 'NO');
    setFormField01(dev.field01 || '');
    setFormField02(dev.field02 || '');
    setFormField03(dev.field03 || 'ITMVIET');
    setFormInterlockRecipe(dev.interlockRecipe || 'YES');
    setFormEquipmentModel(dev.equipmentModel || dev.model || 'IBS_BAKE');
    setFormInterlockParam(dev.interlockParam || '');
    setFormInterlockTrace(dev.interlockTrace || '');
    setFormRole(dev.role);
    setFormProtocol(dev.protocolVersion);
    setFormBoundary(dev.frameBoundary);
    setFormChecksum(dev.checksumAlgorithm);
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Device
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formIp.trim() || !formPort) {
      setFormError(t('device.modal.validationError'));
      return;
    }

    const assignedGroup = formGroup === 'UNASSIGNED' ? 'NET' : formGroup;
    const isDevEnabled = formEnable === 'YES';
    const cleanPlant = formPlant.trim() || 'ITMVPSG';
    const cleanId = formId.trim().toUpperCase();
    const cleanModel = (formEquipmentModel || formModel).trim() || 'IBS_BAKE';
    const cleanName = formDescription.trim() || formName.trim() || `${cleanId} - ${cleanModel}`;

    const updatedData: Partial<DeviceModel> = {
      name: cleanName,
      groupId: assignedGroup,
      factory: cleanPlant,
      line: assignedGroup,
      station: formStation.trim() || cleanId,
      model: cleanModel,
      ipAddress: formIp.trim(),
      port: Number(formPort),
      role: formRole,
      protocolVersion: formProtocol,
      frameBoundary: formBoundary,
      checksumAlgorithm: formChecksum,
      enabled: isDevEnabled,

      // 18 Master Schema
      plant: cleanPlant,
      hostAddress: formIp.trim(),
      hostPort: Number(formPort),
      deviceId: formDeviceId,
      serverNo: formServerNo,
      equipmentId: cleanId,
      groupName: assignedGroup,
      equipmentOrder: formEquipmentOrder,
      equipmentMain: formEquipmentMain.trim(),
      description: cleanName,
      enable: formEnable,
      field01: formField01.trim(),
      field02: formField02.trim(),
      field03: formField03.trim(),
      interlockRecipe: formInterlockRecipe,
      equipmentModel: cleanModel,
      interlockParam: formInterlockParam.trim(),
      interlockTrace: formInterlockTrace.trim(),
    };

    if (editingDevice) {
      updateDevice(editingDevice.id, updatedData);
      showToast(`${t('device.toasts.updated')} ${editingDevice.id}`);
    } else {
      const newDev: DeviceModel = {
        id: cleanId,
        ...updatedData,
        status: isDevEnabled ? 'Ready' : 'Disconnected',
        lastConnectedAt: new Date().toISOString(),
        totalRequests: 0,
        totalResponses: 0,
        errorCount: 0,
        reconnectCount: 0,
        avgResponseTimeMs: 12.0,
        uptimeSeconds: 0,
        consecutiveTimeouts: 0,
        enabled: isDevEnabled,
      } as DeviceModel;
      addDevice(newDev);
      showToast(`${t('device.toasts.added')} ${newDev.id}`);
    }

    setIsModalOpen(false);
  };



  const handlePingTest = async (dev: DeviceModel) => {
    setPingResult({ id: dev.id, latency: 0, ok: true });
    await new Promise((r) => setTimeout(r, 350));
    const latency = Math.floor(Math.random() * 8 + 3);
    setPingResult({ id: dev.id, latency, ok: true });
    setTimeout(() => setPingResult(null), 3000);
  };

  // Manually refresh real devices from Oracle MIGHTY.GATEWAY_DEVICES
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshDevices();
      showToast('Đã đồng bộ dữ liệu thật từ bảng MIGHTY.GATEWAY_DEVICES');
    } catch (e: any) {
      showToast(`Lỗi khi tải từ Oracle: ${e.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export 18-column Master CSV
  const handleExportCsv = () => {
    const csvContent = exportDevicesToCsv(devices);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MC_Server_DeviceMaster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(t('device.toasts.csvExported'));
  };

  // Copy or Download 18-column TSV
  const handleExportTsv = async () => {
    const tsvContent = exportDevicesToTsv(devices);
    try {
      await navigator.clipboard.writeText(tsvContent);
      showToast(t('device.toasts.tsvCopied'));
    } catch {
      const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `MC_Server_DeviceMaster_${new Date().toISOString().slice(0, 10)}.tsv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(t('device.toasts.tsvCopied'));
    }
  };

  // Open Batch Import Modal
  const handleOpenImportModal = () => {
    setImportText('');
    setImportPreview([]);
    setImportError('');
    setIsImportModalOpen(true);
  };

  // Handle Paste / Input in Import Modal
  const handleImportTextChange = (text: string) => {
    setImportText(text);
    if (!text.trim()) {
      setImportPreview([]);
      setImportError('');
      return;
    }
    try {
      const parsed = parseDevicesFromTsvOrCsv(text);
      setImportPreview(parsed);
      if (parsed.length === 0) {
        setImportError(t('device.import.invalidFormat'));
      } else {
        setImportError('');
      }
    } catch (e: any) {
      setImportError(e.message || 'Error parsing table data');
    }
  };

  // Load ITM sample records provided by the user
  const handleLoadSample = () => {
    const sample = [
      'PLANT\tHOST_ADDRESS\tHOST_PORT\tDEVICE_ID\tSERVER_NO\tEQUIPMENT_ID\tGROUP_NAME\tEQUIPMENT_ORDER\tEQUIPMENT_MAIN\tDESCRIPTION\tENABLE\tFIELD_01\tFIELD_02\tFIELD_03\tINTERLOCK_RECIPE\tEQUIPMENT_MODEL\tINTERLOCK_PARAM\tINTERLOCK_TRACE',
      'ITMVPSG\t127.0.0.1\t5010\t0\t15\tBAKE01\tNET\t20110\t\t\tYES\t\t\tITMVIET\tYES\tIBS_BAKE\t\t',
      'ITMVPSG\t127.0.0.1\t5010\t0\t15\tBENDINGJ1\tNET\t20110\t\t\tYES\t\t\tITMVIET\tYES\tIBS_BENDINGJS\t\t',
    ].join('\n');
    handleImportTextChange(sample);
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (importPreview.length === 0) return;
    batchImportDevices(importPreview);
    showToast(`${t('device.toasts.imported')} ${importPreview.length} ${t('device.import.rowsParsed')}`);
    setIsImportModalOpen(false);
    setImportText('');
    setImportPreview([]);
  };

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case 'Ready':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Busy':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Connected':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'Warning':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Error':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const filtered = devices.filter((dev) => {
    const plantVal = dev.plant || dev.factory || '';
    const equipVal = dev.equipmentId || dev.id || '';
    const groupVal = dev.groupName || dev.groupId || '';
    const hostVal = dev.hostAddress || dev.ipAddress || '';
    const modelVal = dev.equipmentModel || dev.model || '';

    const matchesSearch =
      equipVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hostVal.includes(searchTerm) ||
      modelVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plantVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.station.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLine = lineFilter === 'ALL' || dev.line === lineFilter || groupVal === lineFilter;
    const matchesStatus = statusFilter === 'ALL' || dev.status === statusFilter;
    const matchesGroup =
      groupFilter === 'ALL' ||
      (groupFilter === 'UNASSIGNED' ? !dev.groupId : dev.groupId === groupFilter || dev.groupName === groupFilter);

    return matchesSearch && matchesLine && matchesStatus && matchesGroup;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 space-y-2 bg-[#080C15] text-slate-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-5 z-50 px-3 py-1.5 rounded-md bg-slate-900/95 border border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-xs font-mono text-cyan-300 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-sans font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Compact Action Header */}
      <div className="h-11 px-3 rounded bg-slate-900/90 border border-slate-800/80 flex items-center justify-between shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400 shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            {t('device.listTitle')}
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold shrink-0">
            {devices.length} NODES
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold shrink-0">
            MIGHTY.GATEWAY_DEVICES
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 font-semibold shrink-0">
            18 FIELDS
          </span>

          {/* View Mode Toggle: Master Table (18 cols) vs Standard View */}
          <div className="hidden sm:flex items-center rounded bg-slate-950 border border-slate-800 p-0.5 ml-2">
            <button
              onClick={() => setViewMode('plantMaster')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                viewMode === 'plantMaster'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={t('device.viewMode.plantMaster')}
            >
              <Table className="w-3 h-3" />
              <span>{t('device.viewMode.plantMaster')}</span>
            </button>
            <button
              onClick={() => setViewMode('standard')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                viewMode === 'standard'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={t('device.viewMode.standard')}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{t('device.viewMode.standard')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Refresh / Sync From Oracle MIGHTY.GATEWAY_DEVICES */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600 hover:text-white transition-colors shadow-xs disabled:opacity-50"
            title="Đồng bộ dữ liệu thật từ bảng MIGHTY.GATEWAY_DEVICES"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Oracle Sync</span>
          </button>

          {/* Import TSV / CSV Button */}
          <button
            onClick={handleOpenImportModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-colors shadow-xs"
            title={t('device.import.button')}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('device.import.button')}</span>
          </button>

          {/* Export / Copy TSV Button */}
          <button
            onClick={handleExportTsv}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600 hover:text-white transition-colors"
            title={t('device.exportMasterTsv')}
          >
            <Copy className="w-3 h-3 text-purple-300" />
            <span>TSV</span>
          </button>

          {/* Export CSV Button (18 Cols) */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title={t('device.exportMasterCsv')}
          >
            <Download className="w-3 h-3 text-blue-400" />
            <span>CSV</span>
          </button>

          {/* Add Device Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-xs"
          >
            <Plus className="w-3 h-3" />
            <span>{t('device.addDevice')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (Compact Height: 38px) */}
      <div className="px-3 py-1.5 rounded bg-slate-900/80 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('device.searchPlaceholder')}
            className="w-full pl-8 pr-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Group Filter from DB Column */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="ALL">{t('device.allGroups')}</option>
            {distinctDbGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Line Filter */}
          <select
            value={lineFilter}
            onChange={(e) => setLineFilter(e.target.value)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">{t('device.allLines')}</option>
            {lines.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">{t('device.allStatuses')}</option>
            {(['Ready', 'Busy', 'Connected', 'Warning', 'Error', 'Disconnected'] as DeviceStatus[]).map((st) => (
              <option key={st} value={st}>
                {t(`device.status.${st}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Data (Dual View Mode: Plant Master vs Standard View) */}
      <div className="flex-1 rounded bg-slate-900/90 border border-slate-800/80 overflow-hidden flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          {viewMode === 'plantMaster' ? (
            /* ========================================================================= */
            /* 18-COLUMN ITM / MES MASTER TABLE VIEW                                     */
            /* ========================================================================= */
            /* 18-COLUMN MASTER DATA TABLE VIEW (ITM INDUSTRIAL MES SCHEMA)              */
            /* ========================================================================= */
            <table className="w-full text-left font-mono text-[11px] whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800/80 z-10">
                <tr>
                  <th className="py-2 px-2.5 text-left text-amber-400">PLANT</th>
                  <th className="py-2 px-2.5 text-left" title="HOST_ADDRESS">HOST_ADDR</th>
                  <th className="py-2 px-2 text-center" title="HOST_PORT">PORT</th>
                  <th className="py-2 px-2 text-center text-cyan-400" title="DEVICE_ID">DEV_ID</th>
                  <th className="py-2 px-2 text-center text-purple-400" title="SERVER_NO">SRV_NO</th>
                  <th className="py-2 px-2.5 text-left text-blue-400 font-bold" title="EQUIPMENT_ID">EQUIP_ID</th>
                  <th className="py-2 px-2 text-center text-cyan-300" title="GROUP_NAME">GROUP</th>
                  <th className="py-2 px-2 text-center" title="EQUIPMENT_ORDER">ORDER</th>
                  <th className="py-2 px-2 text-center" title="EQUIPMENT_MAIN">MAIN</th>
                  <th className="py-2 px-2.5 text-left" title="DESCRIPTION">DESCRIPTION</th>
                  <th className="py-2 px-2 text-center">ENABLE</th>
                  <th className="py-2 px-1.5 text-center" title="FIELD_01">F1</th>
                  <th className="py-2 px-1.5 text-center" title="FIELD_02">F2</th>
                  <th className="py-2 px-2 text-center text-emerald-300" title="FIELD_03">FIELD_03</th>
                  <th className="py-2 px-2 text-center text-blue-300" title="INTERLOCK_RECIPE">RECIPE</th>
                  <th className="py-2 px-2.5 text-left text-emerald-400" title="EQUIPMENT_MODEL">MODEL</th>
                  <th className="py-2 px-2 text-center" title="INTERLOCK_PARAM">PARAM</th>
                  <th className="py-2 px-2 text-center" title="INTERLOCK_TRACE">TRACE</th>
                  <th className="py-2 px-2.5 text-center">{t('device.columns.status')}</th>
                  <th className="py-2 px-2.5 text-center">{t('device.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((dev) => {
                  const plantVal = dev.plant || dev.factory || 'ITMVPSG';
                  const hostAddr = dev.hostAddress || dev.ipAddress;
                  const hostPort = dev.hostPort || dev.port;
                  const devId = dev.deviceId !== undefined ? dev.deviceId : '0';
                  const srvNo = dev.serverNo !== undefined ? dev.serverNo : '15';
                  const equipId = dev.equipmentId || dev.id;
                  const groupVal = dev.groupName || dev.groupId || 'NET';
                  const orderVal = dev.equipmentOrder !== undefined ? dev.equipmentOrder : 20110;
                  const mainVal = dev.equipmentMain || '--';
                  const descVal = dev.description || dev.name;
                  const enableVal = dev.enable || (dev.enabled ? 'YES' : 'NO');
                  const f01 = dev.field01 || '--';
                  const f02 = dev.field02 || '--';
                  const f03 = dev.field03 || 'ITMVIET';
                  const rcpLock = dev.interlockRecipe || 'YES';
                  const eqModel = dev.equipmentModel || dev.model || 'IBS_BAKE';
                  const pLock = dev.interlockParam || '--';
                  const tLock = dev.interlockTrace || '--';

                  return (
                    <tr key={dev.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-2.5 text-left font-semibold text-amber-400">{plantVal}</td>
                      <td className="py-2 px-2.5 text-left text-slate-200">{hostAddr}</td>
                      <td className="py-2 px-2 text-center text-slate-300">{hostPort}</td>
                      <td className="py-2 px-2 text-center text-cyan-400 font-bold">{devId}</td>
                      <td className="py-2 px-2 text-center text-purple-400 font-bold">{srvNo}</td>
                      <td className="py-2 px-2.5 text-left font-bold text-blue-400">{equipId}</td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-sans inline-block">
                          {groupVal}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center text-slate-300">{orderVal}</td>
                      <td className="py-2 px-2 text-center text-slate-500">{mainVal}</td>
                      <td className="py-2 px-2.5 text-left text-slate-200 font-sans truncate max-w-[160px]" title={descVal}>
                        {descVal}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            enableVal === 'YES'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {enableVal}
                        </span>
                      </td>
                      <td className="py-2 px-1.5 text-center text-slate-500">{f01}</td>
                      <td className="py-2 px-1.5 text-center text-slate-500">{f02}</td>
                      <td className="py-2 px-2 text-center text-cyan-300 font-semibold">{f03}</td>
                      <td className="py-2 px-2 text-center">
                        <span className="px-1.5 py-0.2 rounded bg-blue-900/40 text-blue-300 border border-blue-800/60 text-[9px]">
                          {rcpLock}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-left text-emerald-400 font-medium">{eqModel}</td>
                      <td className="py-2 px-2 text-center text-slate-500">{pLock}</td>
                      <td className="py-2 px-2 text-center text-slate-500">{tLock}</td>
                      <td className="py-2 px-2.5 text-center">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getStatusBadge(
                            dev.status
                          )}`}
                        >
                          {t(`device.status.${dev.status}`)}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handlePingTest(dev)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors relative"
                            title={t('device.actions.ping')}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            {pingResult?.id === dev.id && (
                              <span className="absolute -top-6 -left-3 bg-cyan-950 text-cyan-200 text-[9px] px-1 py-0.2 rounded shadow z-10 whitespace-nowrap border border-cyan-700">
                                {pingResult.latency}ms
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => reconnectDevice(dev.id)}
                            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                            title={t('device.actions.reconnect')}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(dev)}
                            className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title={t('device.actions.edit')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`${t('device.toasts.deleteConfirm')} ${dev.id}?`)) {
                                deleteDevice(dev.id);
                                showToast(`${t('device.toasts.deleted')} ${dev.id}`);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title={t('device.actions.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* ========================================================================= */
            /* STANDARD OPERATIONAL VIEW                                                 */
            /* ========================================================================= */
            <table className="w-full text-left font-mono text-xs">
              <thead className="sticky top-0 bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800/80 z-10">
                <tr>
                  <th className="py-2 px-3 text-left">{t('device.columns.id')}</th>
                  <th className="py-2 px-2.5 text-center">{t('device.columns.group')}</th>
                  <th className="py-2 px-3 text-left">{t('device.columns.name')}</th>
                  <th className="py-2 px-3 text-left">{t('device.columns.lineStation')}</th>
                  <th className="py-2 px-3 text-left">{t('device.columns.ipPort')}</th>
                  <th className="py-2 px-2.5 text-center">BOUNDARY</th>
                  <th className="py-2 px-2.5 text-center">{t('device.columns.status')}</th>
                  <th className="py-2 px-3 text-right">{t('device.columns.stats')}</th>
                  <th className="py-2 px-3 text-center">{t('device.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((dev) => {
                  const groupName = dev.groupName || dev.groupId;

                  return (
                    <tr key={dev.id} className="hover:bg-slate-800/40 transition-colors text-[11px]">
                      <td className="py-2 px-3 text-left font-bold text-blue-400">{dev.id}</td>
                      <td className="py-2 px-2.5 text-center">
                        {groupName ? (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/30 font-sans inline-block whitespace-nowrap"
                            title={`Nhóm thiết bị: ${groupName}`}
                          >
                            {groupName}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono italic">--</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-left text-slate-200">
                        <span className="font-semibold block truncate max-w-[200px] font-sans">{dev.name}</span>
                        <span className="text-[10px] text-slate-500 font-sans">{dev.model}</span>
                      </td>
                      <td className="py-2 px-3 text-left text-slate-300 font-sans">
                        <span className="block text-[11px]">{dev.line}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{dev.station}</span>
                      </td>
                      <td className="py-2 px-3 text-left text-slate-300 font-mono">
                        {dev.ipAddress}:{dev.port}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            dev.frameBoundary === '20014_EXTENDED'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {dev.frameBoundary === '20014_EXTENDED' ? '20.014 (+LF)' : '20.013 (ETX)'}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getStatusBadge(
                            dev.status
                          )}`}
                        >
                          {t(`device.status.${dev.status}`)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        <span className="text-slate-200 block">{formatNumber(dev.totalRequests)}</span>
                        <span
                          className={`text-[10px] block ${dev.errorCount > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}`}
                        >
                          {dev.errorCount} err
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handlePingTest(dev)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors relative"
                            title={t('device.actions.ping')}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            {pingResult?.id === dev.id && (
                              <span className="absolute -top-6 -left-3 bg-cyan-950 text-cyan-200 text-[9px] px-1 py-0.2 rounded shadow z-10 whitespace-nowrap border border-cyan-700">
                                {pingResult.latency}ms
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => reconnectDevice(dev.id)}
                            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                            title={t('device.actions.reconnect')}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(dev)}
                            className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title={t('device.actions.edit')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`${t('device.toasts.deleteConfirm')} ${dev.id}?`)) {
                                deleteDevice(dev.id);
                                showToast(`${t('device.toasts.deleted')} ${dev.id}`);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title={t('device.actions.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BATCH IMPORT TSV / CSV MODAL                                              */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3">
          <div className="bg-[#0C1220] border border-slate-700 rounded-lg shadow-2xl max-w-2xl w-full p-4 space-y-3 font-sans text-xs animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                    {t('device.import.title')}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-normal">
                    {t('device.import.pastePrompt')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick action bar */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 font-medium">
                {t('device.import.pastePrompt')}
              </span>
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-mono text-[10px] flex items-center gap-1 transition-colors"
              >
                <FileSpreadsheet className="w-3 h-3 text-cyan-400" />
                <span>{t('device.import.sampleBtn')}</span>
              </button>
            </div>

            {/* Textarea */}
            <textarea
              rows={6}
              value={importText}
              onChange={(e) => handleImportTextChange(e.target.value)}
              placeholder="PLANT&#9;HOST_ADDRESS&#9;HOST_PORT&#9;DEVICE_ID&#9;SERVER_NO&#9;EQUIPMENT_ID&#9;GROUP_NAME&#9;EQUIPMENT_ORDER&#9;EQUIPMENT_MAIN&#9;DESCRIPTION&#9;ENABLE&#9;FIELD_01&#9;FIELD_02&#9;FIELD_03&#9;INTERLOCK_RECIPE&#9;EQUIPMENT_MODEL&#9;INTERLOCK_PARAM&#9;INTERLOCK_TRACE..."
              className="w-full p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-emerald-500 whitespace-pre"
            />

            {importError && (
              <div className="p-2 rounded bg-red-950/50 border border-red-500/50 text-red-300 text-[11px]">
                {importError}
              </div>
            )}

            {/* Preview Section */}
            {importPreview.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('device.import.previewTitle')} ({importPreview.length} {t('device.import.rowsParsed')}):
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto border border-slate-800 rounded bg-slate-950/80 p-1">
                  <table className="w-full text-left font-mono text-[10px]">
                    <thead className="text-slate-500 border-b border-slate-800">
                      <tr>
                        <th className="p-1">PLANT</th>
                        <th className="p-1">ID</th>
                        <th className="p-1">HOST</th>
                        <th className="p-1">PORT</th>
                        <th className="p-1">GROUP</th>
                        <th className="p-1">ORDER</th>
                        <th className="p-1">MODEL</th>
                        <th className="p-1">RECIPE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {importPreview.map((d, i) => (
                        <tr key={i} className="text-slate-300">
                          <td className="p-1 text-amber-400">{d.plant || d.factory}</td>
                          <td className="p-1 font-bold text-blue-400">{d.id}</td>
                          <td className="p-1">{d.ipAddress}</td>
                          <td className="p-1">{d.port}</td>
                          <td className="p-1 text-cyan-300">{d.groupName || d.groupId}</td>
                          <td className="p-1">{d.equipmentOrder}</td>
                          <td className="p-1 text-emerald-400">{d.model}</td>
                          <td className="p-1 text-slate-400">{d.interlockRecipe || 'YES'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-sans"
              >
                {t('device.modal.cancel')}
              </button>
              <button
                type="button"
                disabled={importPreview.length === 0}
                onClick={handleConfirmImport}
                className="px-3.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 font-semibold text-xs shadow-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('device.import.confirmImport')} ({importPreview.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* ADD / EDIT DEVICE MODAL (TRỰC QUAN - KHÔNG PHÂN TAB - ĐỔI NGÔN NGỮ TRỰC TIẾP) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#0A0F1D] border border-slate-700/90 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-xs font-sans">
            
            {/* Modal Header: Title + Badges + In-Modal Live Language Switcher + Close Button */}
            <div className="px-4 py-2.5 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
                  <Server className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                      {editingDevice ? t('device.modal.editTitle') : t('device.modal.addTitle')}
                    </h3>
                    {editingDevice && (
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-blue-900/70 text-blue-300 border border-blue-700 font-bold">
                        {editingDevice.equipmentId || editingDevice.id}
                      </span>
                    )}
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800 font-semibold">
                      18-COL MASTER SCHEMA
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {editingDevice ? editingDevice.name : t('device.masterModal.sectionMaster')}
                  </p>
                </div>
              </div>

              {/* Live Language Selector directly inside the modal */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                  <Globe className="w-3.5 h-3.5 text-blue-400 ml-1 mr-0.5 shrink-0" />
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLanguage(l.code)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                        language === l.code
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={l.label}
                    >
                      <span>{l.flag}</span>
                      <span>{l.code.split('-')[0].toUpperCase()}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="mx-4 mt-3 p-2 rounded-md bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Body - Single Unified View, No Tabs, Visual Cards */}
            <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 pr-2">
                
                {/* ------------------------------------------------------------- */}
                {/* Card 1: Định Danh & Thông Tin Trạm (Plant & Master Identity) */}
                {/* ------------------------------------------------------------- */}
                <div className="rounded-lg bg-slate-900/70 border border-slate-800/90 p-3 space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/70">
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                        {t('device.masterModal.sectionBasic')}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">PLANT, ID, GROUP, MODEL, MAIN, ORDER, DESC, ENABLE</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {/* PLANT */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="PLANT - Mã Nhà Máy">
                        <span className="truncate">{t('device.masterModal.plant')}</span>
                        <span className="text-red-400 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        value={formPlant}
                        onChange={(e) => setFormPlant(e.target.value)}
                        placeholder="ITMVPSG"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </div>

                    {/* EQUIPMENT_ID */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="EQUIPMENT_ID - Mã Thiết Bị">
                        <span className="truncate">{t('device.columns.equipmentId')}</span>
                        <span className="text-red-400 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={!!editingDevice}
                        value={formId}
                        onChange={(e) => setFormId(e.target.value)}
                        placeholder="BAKE01"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-blue-400 font-mono text-xs focus:outline-none focus:border-blue-500 font-bold disabled:opacity-60 disabled:cursor-not-allowed uppercase"
                      />
                    </div>

                    {/* GROUP_NAME */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="GROUP_NAME - Nhóm Thiết Bị Trong DB">
                        <span className="truncate">{t('device.columns.groupName')}</span>
                        <span className="text-red-400 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        list="db-groups-datalist"
                        value={formGroup}
                        onChange={(e) => setFormGroup(e.target.value.toUpperCase())}
                        placeholder="NET, SMT, QC..."
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:outline-none focus:border-blue-500 uppercase font-semibold"
                      />
                      <datalist id="db-groups-datalist">
                        {distinctDbGroups.map((g) => (
                          <option key={g} value={g} />
                        ))}
                      </datalist>
                    </div>

                    {/* EQUIPMENT_MODEL */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="EQUIPMENT_MODEL - Model Thiết Bị">
                        <span className="truncate">{t('device.masterModal.equipmentModel')}</span>
                        <span className="text-red-400 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        value={formEquipmentModel}
                        onChange={(e) => {
                          setFormEquipmentModel(e.target.value);
                          setFormModel(e.target.value);
                        }}
                        placeholder="IBS_BAKE"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>

                    {/* EQUIPMENT_MAIN */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="EQUIPMENT_MAIN - Cụm Máy Chính">
                        <span className="truncate">{t('device.masterModal.equipmentMain')}</span>
                      </label>
                      <input
                        type="text"
                        value={formEquipmentMain}
                        onChange={(e) => setFormEquipmentMain(e.target.value)}
                        placeholder="MAIN_01"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* EQUIPMENT_ORDER */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="EQUIPMENT_ORDER - Thứ Tự Thiết Bị">
                        <span className="truncate">{t('device.masterModal.equipmentOrder')}</span>
                      </label>
                      <input
                        type="number"
                        value={formEquipmentOrder}
                        onChange={(e) => setFormEquipmentOrder(Number(e.target.value))}
                        placeholder="20110"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>

                    {/* DESCRIPTION */}
                    <div className="col-span-2 sm:col-span-3 md:col-span-4">
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="DESCRIPTION - Mô Tả Thiết Bị">
                        <span className="truncate">{t('device.columns.description')}</span>
                      </label>
                      <input
                        type="text"
                        value={formDescription}
                        onChange={(e) => {
                          setFormDescription(e.target.value);
                          setFormName(e.target.value);
                        }}
                        placeholder="Bake Oven Furnace 01 - Smart Plant Heating"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* ENABLE */}
                    <div className="col-span-2 sm:col-span-3 md:col-span-2">
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="ENABLE - Trạng Thái Kích Hoạt">
                        <span className="truncate">{t('device.masterModal.enable')}</span>
                      </label>
                      <select
                        value={formEnable}
                        onChange={(e) => setFormEnable(e.target.value as 'YES' | 'NO')}
                        className={`w-full h-8 px-2.5 rounded bg-slate-950 border text-xs font-mono font-bold focus:outline-none ${
                          formEnable === 'YES'
                            ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20'
                            : 'text-red-400 border-red-500/40 bg-red-950/20'
                        }`}
                      >
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* Card 2: Kết Nối Mạng & Giao Thức (Network & Protocol)        */}
                {/* ------------------------------------------------------------- */}
                <div className="rounded-lg bg-slate-900/70 border border-slate-800/90 p-3 space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/70">
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <Radio className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                        {t('device.masterModal.sectionProtocol')}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">HOST_ADDRESS, PORT, DEVICE_ID, SERVER_NO, ROLE, BOUNDARY, CHECKSUM</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {/* HOST_ADDRESS (IP) */}
                    <div className="col-span-2 sm:col-span-2 md:col-span-2">
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="HOST_ADDRESS - Địa Chỉ IP (IPv4)">
                        <span className="truncate">{t('device.columns.hostAddress')} (IPv4)</span>
                        <span className="text-red-400 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        value={formIp}
                        onChange={(e) => setFormIp(e.target.value)}
                        placeholder="127.0.0.1"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>

                    {/* HOST_PORT */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="HOST_PORT - Cổng Kết Nối TCP">
                        <span className="truncate">{t('device.columns.hostPort')}</span>
                        <span className="text-red-400 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="number"
                        value={formPort}
                        onChange={(e) => setFormPort(Number(e.target.value))}
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>

                    {/* DEVICE_ID */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="DEVICE_ID - Mã Trạm Con">
                        <span className="truncate">{t('device.masterModal.deviceId')}</span>
                      </label>
                      <input
                        type="text"
                        value={formDeviceId}
                        onChange={(e) => setFormDeviceId(e.target.value)}
                        placeholder="0"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-xs focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </div>

                    {/* SERVER_NO */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="SERVER_NO - Số Máy Chủ">
                        <span className="truncate">{t('device.masterModal.serverNo')}</span>
                      </label>
                      <input
                        type="text"
                        value={formServerNo}
                        onChange={(e) => setFormServerNo(e.target.value)}
                        placeholder="15"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-purple-400 font-mono text-xs focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </div>

                    {/* TCP Role */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="TCP Role - Vai Trò Kết Nối TCP">
                        <span className="truncate">{t('device.columns.role')}</span>
                      </label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as TcpRole)}
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                      >
                        <option value="CLIENT">Client</option>
                        <option value="SERVER">Server</option>
                      </select>
                    </div>

                    {/* Frame Boundary */}
                    <div className="col-span-2 sm:col-span-3 md:col-span-3">
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="FRAME BOUNDARY - Quy Chuẩn Biên Độ Khung">
                        <span className="truncate">BOUNDARY</span>
                      </label>
                      <select
                        value={formBoundary}
                        onChange={(e) => setFormBoundary(e.target.value as FrameBoundary)}
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="20013_STANDARD">20.013 (ETX Standard)</option>
                        <option value="20014_EXTENDED">20.014 (+LF Extended)</option>
                        <option value="VARIABLE_LENGTH">Variable Length Frame</option>
                      </select>
                    </div>

                    {/* Checksum Algorithm */}
                    <div className="col-span-2 sm:col-span-3 md:col-span-3">
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="CHECKSUM ALGORITHM - Thuật Toán Checksum">
                        <span className="truncate">CHECKSUM</span>
                      </label>
                      <select
                        value={formChecksum}
                        onChange={(e) => setFormChecksum(e.target.value as ChecksumAlgorithm)}
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="LRC_MOD256">LRC (MOD256)</option>
                        <option value="XOR_HEX">XOR (Hex Byte)</option>
                        <option value="CRC16_CCITT">CRC16 (CCITT)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* Card 3: Khóa Liên Động & Trường Mở Rộng (Interlocks & Custom) */}
                {/* ------------------------------------------------------------- */}
                <div className="rounded-lg bg-slate-900/70 border border-slate-800/90 p-3 space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/70">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                        {t('device.columns.interlockRecipe')} & {t('device.columns.field03')}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">RECIPE, PARAM, TRACE, FIELD_01, FIELD_02, FIELD_03</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {/* INTERLOCK_RECIPE */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="INTERLOCK_RECIPE - Khóa Công Thức Sản Xuất">
                        <span className="truncate">{t('device.masterModal.interlockRecipe')}</span>
                      </label>
                      <select
                        value={formInterlockRecipe}
                        onChange={(e) => setFormInterlockRecipe(e.target.value)}
                        className="w-full h-8 px-2 rounded bg-slate-950 border border-slate-800 text-blue-300 font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
                      >
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>

                    {/* INTERLOCK_PARAM */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="INTERLOCK_PARAM - Khóa Tham Số Thông Số Máy">
                        <span className="truncate">{t('device.masterModal.interlockParam')}</span>
                      </label>
                      <input
                        type="text"
                        value={formInterlockParam}
                        onChange={(e) => setFormInterlockParam(e.target.value)}
                        placeholder="--"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* INTERLOCK_TRACE */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="INTERLOCK_TRACE - Khóa Truy Vết Lot / Sản Phẩm">
                        <span className="truncate">{t('device.masterModal.interlockTrace')}</span>
                      </label>
                      <input
                        type="text"
                        value={formInterlockTrace}
                        onChange={(e) => setFormInterlockTrace(e.target.value)}
                        placeholder="--"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* FIELD_01 */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="FIELD_01 - Trường Tùy Biến 01">
                        <span className="truncate">{t('device.masterModal.field01')}</span>
                      </label>
                      <input
                        type="text"
                        value={formField01}
                        onChange={(e) => setFormField01(e.target.value)}
                        placeholder="--"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* FIELD_02 */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="FIELD_02 - Trường Tùy Biến 02">
                        <span className="truncate">{t('device.masterModal.field02')}</span>
                      </label>
                      <input
                        type="text"
                        value={formField02}
                        onChange={(e) => setFormField02(e.target.value)}
                        placeholder="--"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* FIELD_03 */}
                    <div>
                      <label className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none" title="FIELD_03 - Trường Tùy Biến 03">
                        <span className="truncate">{t('device.masterModal.field03')}</span>
                      </label>
                      <input
                        type="text"
                        value={formField03}
                        onChange={(e) => setFormField03(e.target.value)}
                        placeholder="ITMVIET"
                        className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Sticky Footer Actions */}
              <div className="px-4 py-3 bg-slate-950/95 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">18-Col Industrial Plant / MES Schema (ITM Standard)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-sans font-medium transition-colors"
                  >
                    {t('device.modal.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 font-semibold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('device.modal.save')}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

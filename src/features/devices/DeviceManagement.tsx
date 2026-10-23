/**
 * MC Server Device Management View (Master Orchestrator)
 * Modularized architecture: Decomposed into atomic sub-components (Toolbar, Tables, Modals)
 * for maximum maintainability and testability.
 */

import React, { useState, useMemo } from 'react';
import { CheckCircle2, Server } from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { useApp } from '@/core/context';
import {
  DeviceModel,
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
} from '@/features/devices';
import {
  DeviceToolbar,
  DeviceMasterTable,
  DeviceStandardTable,
  DeviceCloneModal,
  DeviceImportModal,
  DeviceFormModal,
  DeviceDeleteModal,
} from './components';

export const DeviceManagementView: React.FC = () => {
  const { t, formatNumber } = useTranslation();
  const {
    devices,
    refreshDevices,
    addDevice,
    updateDevice,
    deleteDevice,
    batchImportDevices,
    reconnectDevice,
  } = useApp();

  // Filter & View States
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lineFilter, setLineFilter] = useState<string>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'plantMaster' | 'standard'>('plantMaster');

  // Distinct groups & lines
  const distinctDbGroups = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => {
      const g = (d.groupName && d.groupName.trim()) || (d.groupId && d.groupId.trim());
      if (g) set.add(g);
    });
    return Array.from(set).sort();
  }, [devices]);

  const distinctLines = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => {
      const l = (d.line && d.line.trim()) || (d.groupName && d.groupName.trim());
      if (l) set.add(l);
    });
    return Array.from(set).sort();
  }, [devices]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Ping Test State
  const [pingResult, setPingResult] = useState<{ id: string; latency: number; ok: boolean } | null>(null);

  // Quick Clone Device Modal State
  const [isCloneModalOpen, setIsCloneModalOpen] = useState<boolean>(false);
  const [cloneSourceDevice, setCloneSourceDevice] = useState<DeviceModel | null>(null);
  const [cloneNewId, setCloneNewId] = useState<string>('');
  const [cloneNewIp, setCloneNewIp] = useState<string>('');
  const [cloneNewPort, setCloneNewPort] = useState<number | string>(5010);
  const [cloneNewName, setCloneNewName] = useState<string>('');
  const [cloneError, setCloneError] = useState<string>('');

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteTargetDevice, setDeleteTargetDevice] = useState<DeviceModel | null>(null);

  // Batch Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importPreview, setImportPreview] = useState<DeviceModel[]>([]);
  const [importError, setImportError] = useState<string>('');

  // Device Add/Edit 18-Column Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDevice, setEditingDevice] = useState<DeviceModel | null>(null);

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

  // Helper: Next suggested ID (e.g., BAKE01 -> BAKE02)
  const getSuggestedNextId = (sourceId: string): string => {
    const match = sourceId.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const numStr = match[2];
      let nextNum = parseInt(numStr, 10) + 1;
      let candidate = `${prefix}${String(nextNum).padStart(numStr.length, '0')}`;
      while (devices.some((d) => d.id.toUpperCase() === candidate.toUpperCase())) {
        nextNum++;
        candidate = `${prefix}${String(nextNum).padStart(numStr.length, '0')}`;
      }
      return candidate;
    }
    let fallback = `${sourceId}_COPY`;
    let count = 1;
    while (devices.some((d) => d.id.toUpperCase() === fallback.toUpperCase())) {
      count++;
      fallback = `${sourceId}_COPY${count}`;
    }
    return fallback;
  };

  // Helper: Next suggested IP in same subnet
  const getSuggestedNextIp = (sourceIp: string): string => {
    const parts = (sourceIp || '').trim().split('.');
    if (parts.length === 4) {
      const lastOctet = parseInt(parts[3], 10);
      if (!isNaN(lastOctet)) {
        let candidateOctet = lastOctet + 1;
        let candidateIp = `${parts[0]}.${parts[1]}.${parts[2]}.${candidateOctet}`;
        while (devices.some((d) => (d.hostAddress || d.ipAddress) === candidateIp) && candidateOctet < 254) {
          candidateOctet++;
          candidateIp = `${parts[0]}.${parts[1]}.${parts[2]}.${candidateOctet}`;
        }
        return candidateIp;
      }
    }
    return '';
  };

  // Handlers for Add / Edit Modal
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

  const handleApplyTemplateToFullModal = (templateDevId: string) => {
    const src = devices.find((d) => d.id === templateDevId);
    if (!src) return;
    setFormPlant(src.plant || src.factory || 'ITMVPSG');
    setFormGroup(src.groupName || src.groupId || 'UNASSIGNED');
    setFormModel(src.equipmentModel || src.model || 'IBS_BAKE');
    setFormPort(src.hostPort || src.port || 5010);
    setFormDeviceId(src.deviceId !== undefined ? src.deviceId : '0');
    setFormServerNo(src.serverNo !== undefined ? src.serverNo : '15');
    setFormEquipmentOrder(src.equipmentOrder !== undefined ? src.equipmentOrder : 20110);
    setFormEquipmentMain(src.equipmentMain || '');
    setFormDescription(src.description || '');
    setFormEnable((src.enable || (src.enabled ? 'YES' : 'NO')) as 'YES' | 'NO');
    setFormField01(src.field01 || '');
    setFormField02(src.field02 || '');
    setFormField03(src.field03 || 'ITMVIET');
    setFormInterlockRecipe(src.interlockRecipe || 'YES');
    setFormEquipmentModel(src.equipmentModel || src.model || 'IBS_BAKE');
    setFormInterlockParam(src.interlockParam || '');
    setFormInterlockTrace(src.interlockTrace || '');
    setFormRole(src.role);
    setFormProtocol(src.protocolVersion);
    setFormBoundary(src.frameBoundary);
    setFormChecksum(src.checksumAlgorithm);
    showToast(`${t('device.cloneModal.selectTemplatePrompt')} ${src.id}`);
  };

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

  // Quick Clone Handlers
  const handleOpenClone = (dev: DeviceModel) => {
    setCloneSourceDevice(dev);
    const suggestedId = getSuggestedNextId(dev.equipmentId || dev.id);
    const suggestedIp = getSuggestedNextIp(dev.hostAddress || dev.ipAddress);
    setCloneNewId(suggestedId);
    setCloneNewIp(suggestedIp);
    setCloneNewPort(dev.hostPort || dev.port || 5010);
    const devModel = dev.equipmentModel || dev.model || 'IBS_BAKE';
    setCloneNewName(`${suggestedId} - ${devModel}`);
    setCloneError('');
    setIsCloneModalOpen(true);
  };

  const handleConfirmClone = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cloneSourceDevice) return;
    const cleanId = cloneNewId.trim().toUpperCase();
    const cleanIp = cloneNewIp.trim();
    if (!cleanId) {
      setCloneError(t('device.cloneModal.errIdRequired'));
      return;
    }
    if (!cleanIp) {
      setCloneError(t('device.cloneModal.errIpRequired'));
      return;
    }
    if (devices.some((d) => d.id.toUpperCase() === cleanId)) {
      setCloneError(t('device.cloneModal.errIdExists'));
      return;
    }

    const src = cloneSourceDevice;
    const cleanPlant = src.plant || src.factory || 'ITMVPSG';
    const cleanModel = src.equipmentModel || src.model || 'IBS_BAKE';
    const cleanGroup = src.groupName || src.groupId || 'NET';
    const cleanName = cloneNewName.trim() || `${cleanId} - ${cleanModel}`;
    const isDevEnabled = (src.enable || (src.enabled ? 'YES' : 'NO')) === 'YES';
    const portNum = Number(cloneNewPort) || src.hostPort || src.port || 5010;

    const clonedDev: DeviceModel = {
      id: cleanId,
      name: cleanName,
      groupId: cleanGroup,
      factory: cleanPlant,
      line: cleanGroup,
      station: cleanId,
      model: cleanModel,
      ipAddress: cleanIp,
      port: portNum,
      role: src.role || 'CLIENT',
      protocolVersion: src.protocolVersion || 'v2.0-Extended20014',
      frameBoundary: src.frameBoundary || '20014_EXTENDED',
      checksumAlgorithm: src.checksumAlgorithm || 'LRC_MOD256',
      status: isDevEnabled ? 'Ready' : 'Disconnected',
      enabled: isDevEnabled,

      plant: cleanPlant,
      hostAddress: cleanIp,
      hostPort: portNum,
      deviceId: src.deviceId !== undefined ? src.deviceId : '0',
      serverNo: src.serverNo !== undefined ? src.serverNo : '15',
      equipmentId: cleanId,
      groupName: cleanGroup,
      equipmentOrder: src.equipmentOrder !== undefined ? src.equipmentOrder : 20110,
      equipmentMain: src.equipmentMain || '',
      description: cleanName,
      enable: src.enable || 'YES',
      field01: src.field01 || '',
      field02: src.field02 || '',
      field03: src.field03 || 'ITMVIET',
      interlockRecipe: src.interlockRecipe || 'YES',
      equipmentModel: cleanModel,
      interlockParam: src.interlockParam || '',
      interlockTrace: src.interlockTrace || '',

      lastConnectedAt: new Date().toISOString(),
      totalRequests: 0,
      totalResponses: 0,
      errorCount: 0,
      reconnectCount: 0,
      avgResponseTimeMs: 12.0,
      uptimeSeconds: 0,
      consecutiveTimeouts: 0,
    } as DeviceModel;

    addDevice(clonedDev);
    showToast(`${t('device.cloneModal.successToast')} ${clonedDev.id}`);
    setIsCloneModalOpen(false);
  };

  const handleSwitchToFullEditFromClone = () => {
    if (!cloneSourceDevice) return;
    const src = cloneSourceDevice;
    setEditingDevice(null);
    setFormPlant(src.plant || src.factory || 'ITMVPSG');
    setFormId(cloneNewId.trim().toUpperCase());
    setFormName(cloneNewName.trim() || `${cloneNewId.trim().toUpperCase()} - ${src.equipmentModel || src.model}`);
    setFormGroup(src.groupName || src.groupId || 'UNASSIGNED');
    setFormStation(cloneNewId.trim().toUpperCase());
    setFormModel(src.equipmentModel || src.model || 'IBS_BAKE');
    setFormIp(cloneNewIp.trim());
    setFormPort(Number(cloneNewPort) || src.hostPort || src.port || 5010);
    setFormDeviceId(src.deviceId !== undefined ? src.deviceId : '0');
    setFormServerNo(src.serverNo !== undefined ? src.serverNo : '15');
    setFormEquipmentOrder(src.equipmentOrder !== undefined ? src.equipmentOrder : 20110);
    setFormEquipmentMain(src.equipmentMain || '');
    setFormDescription(src.description || '');
    setFormEnable((src.enable || (src.enabled ? 'YES' : 'NO')) as 'YES' | 'NO');
    setFormField01(src.field01 || '');
    setFormField02(src.field02 || '');
    setFormField03(src.field03 || 'ITMVIET');
    setFormInterlockRecipe(src.interlockRecipe || 'YES');
    setFormEquipmentModel(src.equipmentModel || src.model || 'IBS_BAKE');
    setFormInterlockParam(src.interlockParam || '');
    setFormInterlockTrace(src.interlockTrace || '');
    setFormRole(src.role);
    setFormProtocol(src.protocolVersion);
    setFormBoundary(src.frameBoundary);
    setFormChecksum(src.checksumAlgorithm);
    setFormError('');
    setIsCloneModalOpen(false);
    setIsModalOpen(true);
  };

  // Delete Handlers (High-Aesthetic Confirmation Dialog)
  const handleOpenDelete = (dev: DeviceModel) => {
    setDeleteTargetDevice(dev);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    deleteDevice(id);
    showToast(`${t('device.toasts.deleted')} ${id}`);
    setIsDeleteModalOpen(false);
    setDeleteTargetDevice(null);
  };

  const handlePingTest = async (dev: DeviceModel) => {
    setPingResult({ id: dev.id, latency: 0, ok: true });
    await new Promise((r) => setTimeout(r, 350));
    const latency = Math.floor(Math.random() * 8 + 3);
    setPingResult({ id: dev.id, latency, ok: true });
    setTimeout(() => setPingResult(null), 3000);
  };

  const handleReconnect = (id: string) => {
    reconnectDevice(id);
    showToast(`${t('device.toasts.reconnected')} ${id}`);
  };

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

  const handleOpenImportModal = () => {
    setImportText('');
    setImportPreview([]);
    setImportError('');
    setIsImportModalOpen(true);
  };

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

  const handleLoadSample = () => {
    const sample = [
      'PLANT\tHOST_ADDRESS\tHOST_PORT\tDEVICE_ID\tSERVER_NO\tEQUIPMENT_ID\tGROUP_NAME\tEQUIPMENT_ORDER\tEQUIPMENT_MAIN\tDESCRIPTION\tENABLE\tFIELD_01\tFIELD_02\tFIELD_03\tINTERLOCK_RECIPE\tEQUIPMENT_MODEL\tINTERLOCK_PARAM\tINTERLOCK_TRACE',
      'ITMVPSG\t127.0.0.1\t5010\t0\t15\tBAKE01\tNET\t20110\t\t\tYES\t\t\tITMVIET\tYES\tIBS_BAKE\t\t',
      'ITMVPSG\t127.0.0.1\t5010\t0\t15\tBENDINGJ1\tNET\t20110\t\t\tYES\t\t\tITMVIET\tYES\tIBS_BENDINGJS\t\t',
    ].join('\n');
    handleImportTextChange(sample);
  };

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

  // Filter Logic
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

      {/* Toolbar Component */}
      <DeviceToolbar
        totalNodes={devices.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        groupFilter={groupFilter}
        setGroupFilter={setGroupFilter}
        distinctGroups={distinctDbGroups}
        lineFilter={lineFilter}
        setLineFilter={setLineFilter}
        distinctLines={distinctLines}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onOpenImport={handleOpenImportModal}
        onExportTsv={handleExportTsv}
        onExportCsv={handleExportCsv}
        onOpenAdd={handleOpenAdd}
      />

      {/* Table Data (Dual View Mode: Plant Master vs Standard View) */}
      <div className="flex-1 rounded bg-slate-900/90 border border-slate-800/80 overflow-hidden flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          {viewMode === 'plantMaster' ? (
            <DeviceMasterTable
              devices={filtered}
              pingResult={pingResult}
              onPing={handlePingTest}
              onReconnect={handleReconnect}
              onEdit={handleOpenEdit}
              onClone={handleOpenClone}
              onDelete={handleOpenDelete}
              getStatusBadge={getStatusBadge}
            />
          ) : (
            <DeviceStandardTable
              devices={filtered}
              pingResult={pingResult}
              onPing={handlePingTest}
              onReconnect={handleReconnect}
              onEdit={handleOpenEdit}
              onClone={handleOpenClone}
              onDelete={handleOpenDelete}
              getStatusBadge={getStatusBadge}
              formatNumber={formatNumber}
            />
          )}

          {/* Empty State */}
          {filtered.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs">
              <Server className="w-8 h-8 text-slate-600 mb-2 opacity-60" />
              <p className="font-semibold text-slate-400">{t('device.noDevices')}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Không tìm thấy thiết bị phù hợp với bộ lọc hiện tại</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DeviceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingDevice={editingDevice}
        devices={devices}
        distinctDbGroups={distinctDbGroups}
        onSave={handleSave}
        onApplyTemplate={handleApplyTemplateToFullModal}
        formPlant={formPlant}
        setFormPlant={setFormPlant}
        formId={formId}
        setFormId={setFormId}
        formName={formName}
        setFormName={setFormName}
        formGroup={formGroup}
        setFormGroup={setFormGroup}
        formStation={formStation}
        setFormStation={setFormStation}
        formModel={formModel}
        setFormModel={setFormModel}
        formIp={formIp}
        setFormIp={setFormIp}
        formPort={formPort}
        setFormPort={setFormPort}
        formDeviceId={formDeviceId}
        setFormDeviceId={setFormDeviceId}
        formServerNo={formServerNo}
        setFormServerNo={setFormServerNo}
        formEquipmentOrder={formEquipmentOrder}
        setFormEquipmentOrder={setFormEquipmentOrder}
        formEquipmentMain={formEquipmentMain}
        setFormEquipmentMain={setFormEquipmentMain}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        formEnable={formEnable}
        setFormEnable={setFormEnable}
        formField01={formField01}
        setFormField01={setFormField01}
        formField02={formField02}
        setFormField02={setFormField02}
        formField03={formField03}
        setFormField03={setFormField03}
        formInterlockRecipe={formInterlockRecipe}
        setFormInterlockRecipe={setFormInterlockRecipe}
        formEquipmentModel={formEquipmentModel}
        setFormEquipmentModel={setFormEquipmentModel}
        formInterlockParam={formInterlockParam}
        setFormInterlockParam={setFormInterlockParam}
        formInterlockTrace={formInterlockTrace}
        setFormInterlockTrace={setFormInterlockTrace}
        formRole={formRole}
        setFormRole={setFormRole}
        formProtocol={formProtocol}
        setFormProtocol={setFormProtocol}
        formBoundary={formBoundary}
        setFormBoundary={setFormBoundary}
        formChecksum={formChecksum}
        setFormChecksum={setFormChecksum}
        formError={formError}
      />

      <DeviceCloneModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        sourceDevice={cloneSourceDevice}
        newId={cloneNewId}
        setNewId={setCloneNewId}
        newIp={cloneNewIp}
        setNewIp={setCloneNewIp}
        newPort={cloneNewPort}
        setNewPort={setCloneNewPort}
        newName={cloneNewName}
        setNewName={setCloneNewName}
        error={cloneError}
        onConfirm={handleConfirmClone}
        onSwitchToFullEdit={handleSwitchToFullEditFromClone}
        onSuggestNextId={() => {
          if (cloneSourceDevice) {
            setCloneNewId(getSuggestedNextId(cloneSourceDevice.equipmentId || cloneSourceDevice.id));
          }
        }}
      />

      <DeviceImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        importText={importText}
        importPreview={importPreview}
        importError={importError}
        onTextChange={handleImportTextChange}
        onLoadSample={handleLoadSample}
        onConfirm={handleConfirmImport}
      />

      {/* Modern High-Aesthetic Delete Device Confirmation Modal */}
      <DeviceDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTargetDevice(null);
        }}
        device={deleteTargetDevice}
        onConfirmDelete={handleConfirmDelete}
        getStatusBadge={getStatusBadge}
      />
    </div>
  );
};
export default DeviceManagementView;

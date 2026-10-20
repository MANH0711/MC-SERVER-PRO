/**
 * MC Server Device Management View
 * Space-optimized industrial equipment master inventory, concise group registration & management,
 * compact modal CRUD, ping testing, socket reconnection, and CSV export.
 */

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
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
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  DeviceModel,
  DeviceGroup,
  DeviceStatus,
  TcpRole,
  ProtocolVersion,
  FrameBoundary,
  ChecksumAlgorithm,
} from '../../types';

export const DeviceManagementView: React.FC = () => {
  const { t, formatNumber } = useTranslation();
  const {
    devices,
    deviceGroups,
    addDevice,
    updateDevice,
    deleteDevice,
    addDeviceGroup,
    deleteDeviceGroup,
    reconnectDevice,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lineFilter, setLineFilter] = useState<string>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Device Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDevice, setEditingDevice] = useState<DeviceModel | null>(null);

  // Group Management Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [newGroupId, setNewGroupId] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');
  const [newGroupColor, setNewGroupColor] = useState<string>('blue');
  const [groupModalError, setGroupModalError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formGroup, setFormGroup] = useState<string>('GRP_SMT_A');
  const [formFactory, setFormFactory] = useState('Factory 01');
  const [formLine, setFormLine] = useState('Line SMT-A');
  const [formStation, setFormStation] = useState('ST01_CHIP_MOUNTER');
  const [formModel, setFormModel] = useState('');
  const [formIp, setFormIp] = useState('192.168.10.');
  const [formPort, setFormPort] = useState(5000);
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
    setFormId(`EQP_SMT_0${devices.length + 1}`);
    setFormName('');
    setFormGroup(deviceGroups[0]?.id || 'UNASSIGNED');
    setFormFactory('Factory 01');
    setFormLine('Line SMT-A');
    setFormStation('ST01_CHIP_MOUNTER');
    setFormModel('Panasonic NPM-D3');
    setFormIp(`192.168.10.${110 + devices.length}`);
    setFormPort(5010 + devices.length);
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
    setFormId(dev.id);
    setFormName(dev.name);
    setFormGroup(dev.groupId || 'UNASSIGNED');
    setFormFactory(dev.factory);
    setFormLine(dev.line);
    setFormStation(dev.station);
    setFormModel(dev.model);
    setFormIp(dev.ipAddress);
    setFormPort(dev.port);
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
    if (!formId.trim() || !formName.trim() || !formIp.trim() || !formPort) {
      setFormError(t('device.modal.validationError'));
      return;
    }

    const assignedGroup = formGroup === 'UNASSIGNED' ? undefined : formGroup;

    if (editingDevice) {
      updateDevice(editingDevice.id, {
        name: formName.trim(),
        groupId: assignedGroup,
        factory: formFactory,
        line: formLine,
        station: formStation,
        model: formModel,
        ipAddress: formIp.trim(),
        port: formPort,
        role: formRole,
        protocolVersion: formProtocol,
        frameBoundary: formBoundary,
        checksumAlgorithm: formChecksum,
      });
      showToast(`Đã cập nhật cấu hình: ${editingDevice.id}`);
    } else {
      const newDev: DeviceModel = {
        id: formId.trim().toUpperCase(),
        name: formName.trim(),
        groupId: assignedGroup,
        factory: formFactory,
        line: formLine,
        station: formStation,
        model: formModel,
        ipAddress: formIp.trim(),
        port: Number(formPort),
        role: formRole,
        protocolVersion: formProtocol,
        frameBoundary: formBoundary,
        checksumAlgorithm: formChecksum,
        status: 'Connected',
        lastConnectedAt: new Date().toISOString(),
        totalRequests: 0,
        totalResponses: 0,
        errorCount: 0,
        reconnectCount: 0,
        avgResponseTimeMs: 12.0,
        uptimeSeconds: 0,
        consecutiveTimeouts: 0,
        enabled: true,
      };
      addDevice(newDev);
      showToast(`Đã thêm thiết bị mới: ${newDev.id}`);
    }

    setIsModalOpen(false);
  };

  // Open Group Management Modal
  const handleOpenGroupModal = () => {
    const nextNum = deviceGroups.length + 1;
    setNewGroupId(`GRP_LINE_0${nextNum}`);
    setNewGroupName(`SMT-Line 0${nextNum}`);
    setNewGroupDesc('');
    setNewGroupColor(['blue', 'emerald', 'purple', 'amber', 'cyan', 'rose'][nextNum % 6]);
    setGroupModalError('');
    setIsGroupModalOpen(true);
  };

  // Register New Device Group
  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupId.trim() || !newGroupName.trim()) {
      setGroupModalError('Vui lòng nhập đầy đủ Mã Group và Tên Group!');
      return;
    }
    const cleanId = newGroupId.trim().toUpperCase();
    if (deviceGroups.some((g) => g.id === cleanId)) {
      setGroupModalError('Mã Group này đã tồn tại, vui lòng chọn mã khác!');
      return;
    }

    const newGrp: DeviceGroup = {
      id: cleanId,
      name: newGroupName.trim(),
      description: newGroupDesc.trim(),
      color: newGroupColor,
      createdAt: new Date().toISOString(),
    };
    addDeviceGroup(newGrp);
    setNewGroupId(`GRP_LINE_0${deviceGroups.length + 2}`);
    setNewGroupName('');
    setNewGroupDesc('');
    setGroupModalError('');
    showToast(`Đã đăng ký thành công Group: ${newGrp.name}`);
  };

  // Delete Group
  const handleDeleteGroup = (gId: string, gName: string) => {
    const count = devices.filter((d) => d.groupId === gId).length;
    if (
      confirm(
        `Xác nhận xóa group "${gName}" [${gId}]?\n${
          count > 0 ? `Có ${count} thiết bị trong nhóm này sẽ chuyển thành Chưa phân nhóm.` : ''
        }`
      )
    ) {
      deleteDeviceGroup(gId);
      showToast(`Đã xóa Group: ${gName}`);
    }
  };

  const handlePingTest = async (dev: DeviceModel) => {
    setPingResult({ id: dev.id, latency: 0, ok: true });
    await new Promise((r) => setTimeout(r, 350));
    const latency = Math.floor(Math.random() * 8 + 3);
    setPingResult({ id: dev.id, latency, ok: true });
    setTimeout(() => setPingResult(null), 3000);
  };

  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Name',
      'Group',
      'Factory',
      'Line',
      'Station',
      'Model',
      'IP',
      'Port',
      'Role',
      'Boundary',
      'Checksum',
      'Status',
      'Requests',
      'Errors',
      'Uptime(s)',
    ];

    const rows = devices.map((d) => [
      d.id,
      `"${d.name}"`,
      `"${deviceGroups.find((g) => g.id === d.groupId)?.name || 'UNASSIGNED'}"`,
      `"${d.factory}"`,
      `"${d.line}"`,
      `"${d.station}"`,
      `"${d.model}"`,
      d.ipAddress,
      d.port,
      d.role,
      d.frameBoundary,
      d.checksumAlgorithm,
      d.status,
      d.totalRequests,
      d.errorCount,
      d.uptimeSeconds,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MC_Server_Equipment_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công');
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
    const matchesSearch =
      dev.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.ipAddress.includes(searchTerm) ||
      dev.station.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLine = lineFilter === 'ALL' || dev.line === lineFilter;
    const matchesStatus = statusFilter === 'ALL' || dev.status === statusFilter;
    const matchesGroup =
      groupFilter === 'ALL' ||
      (groupFilter === 'UNASSIGNED' ? !dev.groupId : dev.groupId === groupFilter);
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
      <div className="h-11 px-3 rounded bg-slate-900/90 border border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            {t('device.listTitle')}
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold">
            {devices.length} NODES
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-semibold">
            {deviceGroups.length} GROUPS
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Group Registration & Management Button */}
          <button
            onClick={handleOpenGroupModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600 hover:text-white transition-colors shadow-xs"
            title="Đăng ký và Quản lý Group Thiết Bị"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{t('device.groupManagement')}</span>
            <span className="px-1 py-0.2 rounded bg-blue-900/70 text-[9px] font-mono font-bold">
              {deviceGroups.length}
            </span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Download className="w-3 h-3 text-blue-400" />
            <span>CSV</span>
          </button>

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
        <div className="relative flex-1 min-w-[180px]">
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
          {/* Group Filter */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">{t('device.allGroups')}</option>
            {deviceGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} [{g.id}]
              </option>
            ))}
            <option value="UNASSIGNED">Chưa phân nhóm</option>
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

      {/* Table Data (High Space Density) */}
      <div className="flex-1 rounded bg-slate-900/90 border border-slate-800/80 overflow-hidden flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800/80 z-10">
              <tr>
                <th className="py-2 px-3">{t('device.columns.id')}</th>
                <th className="py-2 px-2.5">{t('device.columns.group')}</th>
                <th className="py-2 px-3">{t('device.columns.name')}</th>
                <th className="py-2 px-3">{t('device.columns.lineStation')}</th>
                <th className="py-2 px-3">{t('device.columns.ipPort')}</th>
                <th className="py-2 px-2.5">Boundary</th>
                <th className="py-2 px-2.5">{t('device.columns.status')}</th>
                <th className="py-2 px-3 text-right">{t('device.columns.stats')}</th>
                <th className="py-2 px-3 text-center">{t('device.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((dev) => {
                const groupObj = deviceGroups.find((g) => g.id === dev.groupId);

                return (
                  <tr key={dev.id} className="hover:bg-slate-800/40 transition-colors text-[11px]">
                    {/* Machine ID */}
                    <td className="py-2 px-3 font-bold text-blue-400">{dev.id}</td>

                    {/* Group Badge (Concise & Distinct) */}
                    <td className="py-2 px-2.5">
                      {groupObj ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getGroupBadgeStyle(
                            groupObj.color
                          )} font-sans inline-block whitespace-nowrap`}
                          title={`${groupObj.name} [${groupObj.id}]\n${groupObj.description || ''}`}
                        >
                          {groupObj.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono italic">--</span>
                      )}
                    </td>

                    {/* Machine Name & Model */}
                    <td className="py-2 px-3 text-slate-200">
                      <span className="font-semibold block truncate max-w-[200px] font-sans">{dev.name}</span>
                      <span className="text-[10px] text-slate-500 font-sans">{dev.model}</span>
                    </td>

                    {/* Line & Station */}
                    <td className="py-2 px-3 text-slate-300 font-sans">
                      <span className="block text-[11px]">{dev.line}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{dev.station}</span>
                    </td>

                    {/* IP & Port */}
                    <td className="py-2 px-3 text-slate-300 font-mono">
                      {dev.ipAddress}:{dev.port}
                    </td>

                    {/* Frame Boundary */}
                    <td className="py-2 px-2.5">
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

                    {/* Status Badge */}
                    <td className="py-2 px-2.5">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getStatusBadge(
                          dev.status
                        )}`}
                      >
                        {t(`device.status.${dev.status}`)}
                      </span>
                    </td>

                    {/* Requests & Errors */}
                    <td className="py-2 px-3 text-right font-mono">
                      <span className="text-slate-200 block">{formatNumber(dev.totalRequests)}</span>
                      <span
                        className={`text-[10px] block ${dev.errorCount > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}`}
                      >
                        {dev.errorCount} err
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Ping button */}
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

                        {/* Reconnect button */}
                        <button
                          onClick={() => reconnectDevice(dev.id)}
                          className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                          title={t('device.actions.reconnect')}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit button */}
                        <button
                          onClick={() => handleOpenEdit(dev)}
                          className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                          title={t('device.actions.edit')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => {
                            if (confirm(`Xác nhận xóa thiết bị ${dev.id}?`)) {
                              deleteDevice(dev.id);
                              showToast(`Đã xóa thiết bị: ${dev.id}`);
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
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GROUP REGISTRATION & MANAGEMENT MODAL (ĐĂNG KÝ GROUP TẠI ĐÂY)              */}
      {/* ========================================================================= */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3">
          <div className="bg-[#0C1220] border border-slate-700 rounded-lg shadow-2xl max-w-lg w-full p-4 space-y-3 font-sans text-xs animate-in zoom-in-95 duration-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-blue-400" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                    {t('device.groupModal.title')}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-normal">
                    {t('device.groupModal.subtitle')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message if any */}
            {groupModalError && (
              <div className="p-2 rounded bg-red-950/60 border border-red-500/50 text-red-300 text-[11px]">
                {groupModalError}
              </div>
            )}

            {/* Form to Register New Group */}
            <form onSubmit={handleSaveGroup} className="p-3 rounded bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                {t('device.groupModal.addBtn')}
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                    {t('device.groupModal.id')} *
                  </label>
                  <input
                    type="text"
                    value={newGroupId}
                    onChange={(e) => setNewGroupId(e.target.value)}
                    placeholder="GRP_SMT_C"
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                    {t('device.groupModal.name')} *
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="SMT-C, AOI-Line, Pack..."
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Color Swatch Picker */}
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  {t('device.groupModal.color')}
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'blue', label: 'Blue', colorClass: 'bg-blue-500' },
                    { id: 'emerald', label: 'Green', colorClass: 'bg-emerald-500' },
                    { id: 'purple', label: 'Purple', colorClass: 'bg-purple-500' },
                    { id: 'amber', label: 'Amber', colorClass: 'bg-amber-500' },
                    { id: 'cyan', label: 'Cyan', colorClass: 'bg-cyan-500' },
                    { id: 'rose', label: 'Rose', colorClass: 'bg-rose-500' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewGroupColor(c.id)}
                      className={`w-6 h-6 rounded-full ${c.colorClass} flex items-center justify-center transition-transform ${
                        newGroupColor === c.id ? 'ring-2 ring-white scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    >
                      {newGroupColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  {t('device.groupModal.desc')}
                </label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Gắn chip siêu nhỏ, lò hàn đối lưu bo phụ..."
                  className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-blue-600 font-semibold text-white hover:bg-blue-500 text-xs shadow-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{t('device.groupModal.addBtn')}</span>
                </button>
              </div>
            </form>

            {/* List of Registered Groups */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {t('device.groupModal.existingTitle')} ({deviceGroups.length}):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {deviceGroups.map((g) => {
                  const assignedCount = devices.filter((d) => d.groupId === g.id).length;

                  return (
                    <div
                      key={g.id}
                      className="p-2 rounded bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded border ${getGroupBadgeStyle(
                            g.color
                          )} font-sans shrink-0`}
                        >
                          {g.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 font-semibold shrink-0">
                          [{g.id}]
                        </span>
                        {g.description && (
                          <span className="text-[11px] text-slate-400 truncate">
                            {g.description}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
                          {assignedCount} {t('device.groupModal.deviceCount')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(g.id, g.name)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors"
                          title="Xóa group"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Close */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="px-3.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-sans"
              >
                {t('device.modal.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT DEVICE MODAL (COMPACT & SPACE-OPTIMIZED)                       */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-xs">
          <div className="bg-[#0D1424] border border-slate-700 rounded-lg shadow-2xl max-w-lg w-full p-4 space-y-3 animate-in zoom-in-95 duration-100 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                {editingDevice ? t('device.modal.editTitle') : t('device.modal.addTitle')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2 rounded bg-red-950/50 border border-red-500/50 text-red-300 text-[11px]">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-2.5">
              {/* Row 1: Equipment ID & Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('device.modal.id')} *
                  </label>
                  <input
                    type="text"
                    disabled={!!editingDevice}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    placeholder="EQP_SMT_03"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('device.modal.name')} *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="Fuji High-Speed Mounter NXT-III"
                  />
                </div>
              </div>

              {/* Group Selection with Concise Group Names */}
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                  Group Thiết Bị (Nhóm)
                </label>
                <select
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500 font-sans"
                >
                  {deviceGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} [{g.id}] {g.description ? `— ${g.description}` : ''}
                    </option>
                  ))}
                  <option value="UNASSIGNED">Chưa phân nhóm (Unassigned)</option>
                </select>
              </div>

              {/* Row 2: Factory, Line, Station */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('device.modal.factory')}
                  </label>
                  <input
                    type="text"
                    value={formFactory}
                    onChange={(e) => setFormFactory(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('device.modal.line')}
                  </label>
                  <input
                    type="text"
                    value={formLine}
                    onChange={(e) => setFormLine(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('device.modal.station')}
                  </label>
                  <input
                    type="text"
                    value={formStation}
                    onChange={(e) => setFormStation(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Row 3: Machine Model, IP, Port */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('device.modal.model')}
                  </label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="NPM-D3"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('device.modal.ipAddress')} *
                  </label>
                  <input
                    type="text"
                    value={formIp}
                    onChange={(e) => setFormIp(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                    placeholder="192.168.10.108"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    {t('device.modal.port')} *
                  </label>
                  <input
                    type="number"
                    value={formPort}
                    onChange={(e) => setFormPort(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Row 4: Boundary, Checksum, Role */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    Boundary Mode
                  </label>
                  <select
                    value={formBoundary}
                    onChange={(e) => setFormBoundary(e.target.value as FrameBoundary)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                  >
                    <option value="20013_STANDARD">20.013 (ETX)</option>
                    <option value="20014_EXTENDED">20.014 (+LF)</option>
                    <option value="VARIABLE_LENGTH">Variable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    Checksum
                  </label>
                  <select
                    value={formChecksum}
                    onChange={(e) => setFormChecksum(e.target.value as ChecksumAlgorithm)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                  >
                    <option value="LRC_MOD256">LRC Modulo-256</option>
                    <option value="XOR_HEX">XOR 8-Bit</option>
                    <option value="CRC16_CCITT">CRC16-CCITT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">
                    TCP Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as TcpRole)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                  >
                    <option value="CLIENT">Client</option>
                    <option value="SERVER">Server</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-xs"
                >
                  {t('device.modal.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded bg-blue-600 font-semibold text-white hover:bg-blue-500 transition-colors shadow-xs text-xs"
                >
                  {t('device.modal.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

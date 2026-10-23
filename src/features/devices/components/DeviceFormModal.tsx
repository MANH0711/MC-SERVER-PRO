import React from 'react';
import {
  Server,
  X,
  Globe,
  Copy,
  Building2,
  Radio,
  Lock,
  Check,
} from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import {
  DeviceModel,
  TcpRole,
  ProtocolVersion,
  FrameBoundary,
  ChecksumAlgorithm,
} from '@/core/types';

export interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDevice: DeviceModel | null;
  devices: DeviceModel[];
  distinctDbGroups: string[];
  onSave: (e: React.FormEvent) => void;
  onApplyTemplate: (templateId: string) => void;

  // Form states and setters
  formPlant: string;
  setFormPlant: (val: string) => void;
  formId: string;
  setFormId: (val: string) => void;
  formName: string;
  setFormName: (val: string) => void;
  formGroup: string;
  setFormGroup: (val: string) => void;
  formStation: string;
  setFormStation: (val: string) => void;
  formModel: string;
  setFormModel: (val: string) => void;
  formIp: string;
  setFormIp: (val: string) => void;
  formPort: number;
  setFormPort: (val: number) => void;
  formDeviceId: string | number;
  setFormDeviceId: (val: string | number) => void;
  formServerNo: string | number;
  setFormServerNo: (val: string | number) => void;
  formEquipmentOrder: string | number;
  setFormEquipmentOrder: (val: string | number) => void;
  formEquipmentMain: string;
  setFormEquipmentMain: (val: string) => void;
  formDescription: string;
  setFormDescription: (val: string) => void;
  formEnable: 'YES' | 'NO';
  setFormEnable: (val: 'YES' | 'NO') => void;
  formField01: string;
  setFormField01: (val: string) => void;
  formField02: string;
  setFormField02: (val: string) => void;
  formField03: string;
  setFormField03: (val: string) => void;
  formInterlockRecipe: string;
  setFormInterlockRecipe: (val: string) => void;
  formEquipmentModel: string;
  setFormEquipmentModel: (val: string) => void;
  formInterlockParam: string;
  setFormInterlockParam: (val: string) => void;
  formInterlockTrace: string;
  setFormInterlockTrace: (val: string) => void;
  formRole: TcpRole;
  setFormRole: (val: TcpRole) => void;
  formProtocol: ProtocolVersion;
  setFormProtocol: (val: ProtocolVersion) => void;
  formBoundary: FrameBoundary;
  setFormBoundary: (val: FrameBoundary) => void;
  formChecksum: ChecksumAlgorithm;
  setFormChecksum: (val: ChecksumAlgorithm) => void;
  formError: string;
}

export const DeviceFormModal: React.FC<DeviceFormModalProps> = ({
  isOpen,
  onClose,
  editingDevice,
  devices,
  distinctDbGroups,
  onSave,
  onApplyTemplate,
  formPlant,
  setFormPlant,
  formId,
  setFormId,
  formName,
  setFormName,
  formGroup,
  setFormGroup,
  formStation,
  setFormStation,
  formModel,
  setFormModel,
  formIp,
  setFormIp,
  formPort,
  setFormPort,
  formDeviceId,
  setFormDeviceId,
  formServerNo,
  setFormServerNo,
  formEquipmentOrder,
  setFormEquipmentOrder,
  formEquipmentMain,
  setFormEquipmentMain,
  formDescription,
  setFormDescription,
  formEnable,
  setFormEnable,
  formField01,
  setFormField01,
  formField02,
  setFormField02,
  formField03,
  setFormField03,
  formInterlockRecipe,
  setFormInterlockRecipe,
  formEquipmentModel,
  setFormEquipmentModel,
  formInterlockParam,
  setFormInterlockParam,
  formInterlockTrace,
  setFormInterlockTrace,
  formRole,
  setFormRole,
  formProtocol,
  setFormProtocol,
  formBoundary,
  setFormBoundary,
  formChecksum,
  setFormChecksum,
  formError,
}) => {
  const { t, language, setLanguage, languages } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
              onClick={onClose}
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
        <form onSubmit={onSave} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pr-2">
            {/* Sao chép cấu hình từ máy mẫu có sẵn */}
            {!editingDevice && devices.length > 0 && (
              <div className="rounded-lg bg-cyan-950/40 border border-cyan-500/40 p-2.5 flex items-center justify-between gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <Copy className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{t('device.cloneModal.selectTemplatePrompt')}</span>
                </div>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onApplyTemplate(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-slate-950 border border-cyan-600/60 rounded px-2.5 py-1 text-xs text-cyan-200 font-mono focus:border-cyan-400 cursor-pointer"
                >
                  <option value="" disabled>-- Chọn máy mẫu để sao chép 18 thông số --</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} ({d.model || 'IBS_BAKE'} - {d.groupName || d.groupId || 'NET'})
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                <span className="text-[9px] font-mono text-slate-500">
                  PLANT, ID, GROUP, MODEL, MAIN, ORDER, DESC, ENABLE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {/* PLANT */}
                <div>
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="PLANT - Mã Nhà Máy"
                  >
                    <span className="truncate">{t('device.masterModal.plant')}</span>
                    <span className="text-red-400 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={formPlant}
                    onChange={(e) => setFormPlant(e.target.value)}
                    placeholder="ITMVIET"
                    className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>

                {/* EQUIPMENT_ID */}
                <div>
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="EQUIPMENT_ID - Mã Thiết Bị"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="GROUP_NAME - Nhóm Thiết Bị Trong DB"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="EQUIPMENT_MODEL - Model Thiết Bị"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="EQUIPMENT_MAIN - Cụm Máy Chính"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="EQUIPMENT_ORDER - Thứ Tự Thiết Bị"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="DESCRIPTION - Mô Tả Thiết Bị"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="ENABLE - Trạng Thái Kích Hoạt"
                  >
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
                <span className="text-[9px] font-mono text-slate-500">
                  HOST_ADDRESS, PORT, DEVICE_ID, SERVER_NO, ROLE, BOUNDARY, CHECKSUM
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {/* HOST_ADDRESS (IP) */}
                <div className="col-span-2 sm:col-span-2 md:col-span-2">
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="HOST_ADDRESS - Địa Chỉ IP (IPv4)"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="HOST_PORT - Cổng Kết Nối TCP">
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="DEVICE_ID - Mã Trạm Con"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="SERVER_NO - Số Máy Chủ"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="TCP Role - Vai Trò Kết Nối TCP"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="FRAME BOUNDARY - Quy Chuẩn Biên Độ Khung"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="CHECKSUM ALGORITHM - Thuật Toán Checksum"
                  >
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
                <span className="text-[9px] font-mono text-slate-500">
                  RECIPE, PARAM, TRACE, FIELD_01, FIELD_02, FIELD_03
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {/* INTERLOCK_RECIPE */}
                <div>
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="INTERLOCK_RECIPE - Khóa Công Thức Sản Xuất"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="INTERLOCK_PARAM - Khóa Tham Số Thông Số Máy"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="INTERLOCK_TRACE - Khóa Truy Vết Lot / Sản Phẩm"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="FIELD_01 - Trường Tùy Biến 01"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="FIELD_02 - Trường Tùy Biến 02"
                  >
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
                  <label
                    className="h-5 flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 truncate whitespace-nowrap overflow-hidden select-none"
                    title="FIELD_03 - Trường Tùy Biến 03"
                  >
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
                onClick={onClose}
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
  );
};

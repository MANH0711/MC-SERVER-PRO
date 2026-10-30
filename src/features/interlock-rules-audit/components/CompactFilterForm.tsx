import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Activity,
  Sliders,
  Cpu,
  Sparkles,
  Search,
  Check,
  RotateCcw,
} from 'lucide-react';
import { InterlockRuleAuditFilter, AuditOptionsResponse } from '../types';
import { interlockRuleApi } from '../api';
import { SearchableCombobox, ComboboxOption } from './SearchableCombobox';

interface CompactFilterFormProps {
  filter: InterlockRuleAuditFilter;
  onChangeField: (field: keyof InterlockRuleAuditFilter, value: string) => void;
  onSubmit: () => void;
  onApplyPreset: (preset: 'DA013VN' | 'DA014VN' | 'WB161VN') => void;
  onClearFilter: () => void;
  loading: boolean;
}

export const CompactFilterForm: React.FC<CompactFilterFormProps> = ({
  filter,
  onChangeField,
  onSubmit,
  onApplyPreset,
  onClearFilter,
  loading,
}) => {
  const [options, setOptions] = useState<AuditOptionsResponse>({
    plant: 'ITMVIET',
    models: ['DIEATTACH', 'WIREBOND', 'SMT', 'DISPENSER', 'ALL'],
    operations: ['EPBV', 'EPBC', 'WBE', 'ALL'],
    eqpGroups: ['D/A', 'W/B', 'SMT-BAKE', 'ALL'],
    equipments: [
      { equipmentId: 'DA013VN', description: 'DIE ATTACH #13', displayName: 'DA013VN : DIE ATTACH #13' },
      { equipmentId: 'DA014VN', description: 'DIE ATTACH #14', displayName: 'DA014VN : DIE ATTACH #14' },
      { equipmentId: 'WB161VN', description: 'WIRE BOND #161', displayName: 'WB161VN : WIRE BOND #161' },
    ],
  });

  // Tải danh mục options từ Oracle MES API
  useEffect(() => {
    let isMounted = true;
    interlockRuleApi
      .getAuditOptions()
      .then((res) => {
        if (isMounted) {
          setOptions(res);
        }
      })
      .catch((err) => {
        console.warn('Không thể tải options tự động, dùng fallback:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Chuyển đổi Models sang ComboboxOption
  const modelOptions: ComboboxOption[] = useMemo(() => {
    const list: ComboboxOption[] = [{ value: 'ALL', label: 'ALL (Tất Cả Model)', description: 'Chung toàn nhà máy' }];
    options.models.forEach((m) => {
      const val = (m || '').trim();
      if (val && val !== 'ALL') {
        list.push({ value: val, label: val, description: `Model thiết bị ${val}` });
      }
    });
    return list;
  }, [options.models]);

  // 2. Chuyển đổi Operations sang ComboboxOption
  const operationOptions: ComboboxOption[] = useMemo(() => {
    const list: ComboboxOption[] = [{ value: 'ALL', label: 'ALL (Tất Cả Công Đoạn)', description: 'Chung toàn công đoạn' }];
    options.operations.forEach((op) => {
      const val = (op || '').trim();
      if (val && val !== 'ALL') {
        list.push({ value: val, label: val, description: `Mã công đoạn ${val}` });
      }
    });
    return list;
  }, [options.operations]);

  // 3. Chuyển đổi EqpGroups sang ComboboxOption
  const eqpGroupOptions: ComboboxOption[] = useMemo(() => {
    const list: ComboboxOption[] = [{ value: 'ALL', label: 'ALL (Tất Cả Nhóm)', description: 'Chung toàn nhóm thiết bị' }];
    options.eqpGroups.forEach((grp) => {
      const val = (grp || '').trim();
      if (val && val !== 'ALL') {
        list.push({ value: val, label: val, description: `Nhóm thiết bị ${val}` });
      }
    });
    return list;
  }, [options.eqpGroups]);

  // 4. Chuyển đổi Equipments sang ComboboxOption (chỉ lưu value = equipmentId)
  const equipmentOptions: ComboboxOption[] = useMemo(() => {
    const list: ComboboxOption[] = [{ value: 'ALL', label: 'ALL', description: 'Tất cả thiết bị' }];
    options.equipments.forEach((eq) => {
      const cleanId = (eq.equipmentId || '').trim();
      if (cleanId && cleanId !== 'ALL') {
        list.push({
          value: cleanId,
          label: `${cleanId} : ${(eq.description || '').trim()}`,
          description: (eq.description || '').trim() || `Mã thiết bị ${cleanId}`,
        });
      }
    });
    return list;
  }, [options.equipments]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5 shrink-0 shadow-sm"
    >
      {/* ── 5 CỘT THẲNG HÀNG: 4 Ô COMBOBOX TÌM KIẾM ĐỒNG BỘ DARK THEME + 1 NÚT TRA CỨU ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
        {/* ── Ô 1: MODEL THIẾT BỊ ── */}
        <SearchableCombobox
          label="1. MODEL THIẾT BỊ"
          subLabel="DEVICE_STYPE"
          icon={<Layers className="w-3.5 h-3.5 text-cyan-400" />}
          value={filter.model}
          onChange={(val) => onChangeField('model', val)}
          options={modelOptions}
          placeholder="Chọn hoặc gõ tìm Model..."
          textColorClass="text-cyan-300"
          borderColorFocusClass="focus:border-cyan-500"
          minDropdownWidth="min-w-[280px]"
        />

        {/* ── Ô 2: MÃ CÔNG ĐOẠN ── */}
        <SearchableCombobox
          label="2. MÃ CÔNG ĐOẠN"
          subLabel="OPERATION"
          icon={<Activity className="w-3.5 h-3.5 text-amber-400" />}
          value={filter.operation}
          onChange={(val) => onChangeField('operation', val)}
          options={operationOptions}
          placeholder="Chọn hoặc gõ tìm Oper..."
          textColorClass="text-amber-300"
          borderColorFocusClass="focus:border-amber-500"
          minDropdownWidth="min-w-[260px]"
        />

        {/* ── Ô 3: NHÓM THIẾT BỊ ── */}
        <SearchableCombobox
          label="3. NHÓM THIẾT BỊ"
          subLabel="EIF_EQP_GROUP"
          icon={<Sliders className="w-3.5 h-3.5 text-emerald-400" />}
          value={filter.eifEqpGroup}
          onChange={(val) => onChangeField('eifEqpGroup', val)}
          options={eqpGroupOptions}
          placeholder="Chọn hoặc gõ tìm Nhóm..."
          textColorClass="text-emerald-300"
          borderColorFocusClass="focus:border-emerald-500"
          minDropdownWidth="min-w-[260px]"
        />

        {/* ── Ô 4: MÃ THIẾT BỊ ── */}
        <SearchableCombobox
          label="4. MÃ THIẾT BỊ"
          subLabel="EQUIPMENT"
          icon={<Cpu className="w-3.5 h-3.5 text-indigo-400" />}
          value={filter.equipmentId}
          onChange={(val) => onChangeField('equipmentId', val)}
          options={equipmentOptions}
          placeholder="Chọn hoặc gõ tìm Máy..."
          textColorClass="text-indigo-300"
          borderColorFocusClass="focus:border-indigo-500"
          minDropdownWidth="min-w-[340px]"
        />

        {/* ── CỘT 5: NÚT TRA CỨU QUY TẮC (THẲNG HÀNG VỚI 4 Ô INPUT) ── */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[34px] rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            <Search className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>TRA CỨU QUY TẮC</span>
          </button>
        </div>
      </div>

      {/* ── DÒNG PHỤ: NÚT ĐIỀN NHANH & NÚT XÓA BỘ LỌC ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
          <span className="flex items-center gap-1 text-slate-500">
            <Sparkles className="w-3 h-3 text-amber-400" /> Mẫu nhanh:
          </span>
          <button
            type="button"
            onClick={() => onApplyPreset('DA013VN')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all flex items-center gap-1 ${
              filter.equipmentId === 'DA013VN'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-indigo-500/30'
            }`}
          >
            {filter.equipmentId === 'DA013VN' && <Check className="w-3 h-3" />}
            <span>DA013VN (D/A • EPBV)</span>
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset('DA014VN')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all flex items-center gap-1 ${
              filter.equipmentId === 'DA014VN'
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/30'
            }`}
          >
            {filter.equipmentId === 'DA014VN' && <Check className="w-3 h-3" />}
            <span>DA014VN (D/A • EPBC)</span>
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset('WB161VN')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all flex items-center gap-1 ${
              filter.equipmentId === 'WB161VN'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {filter.equipmentId === 'WB161VN' && <Check className="w-3 h-3" />}
            <span>WB161VN (W/B • WBE)</span>
          </button>
        </div>

        {/* Nút Xóa bộ lọc (reset về rỗng) */}
        {(filter.model || filter.operation || filter.eifEqpGroup || filter.equipmentId) && (
          <button
            type="button"
            onClick={onClearFilter}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa bộ lọc (Chọn lại từ đầu)</span>
          </button>
        )}
      </div>
    </form>
  );
};

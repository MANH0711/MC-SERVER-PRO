/**
 * VIEW: InterlockRuleAuditView
 * Màn hình chính tra cứu quy tắc BIZ_ILRULE_INFO (Compact High-Density Edition)
 * - Thứ tự 4 ô: 1. Model -> 2. Operation -> 3. EIF_EQP_GROUP -> 4. Equipment ID
 * - Cả 4 ô đều vừa gõ tìm kiếm vừa kéo chọn từ database Oracle
 * - Nút Tra Cứu nằm thẳng hàng cùng với 4 ô input (5 cột ngang)
 * - Không gán sẵn thông tin mặc định ở ô nhóm thiết bị và mã thiết bị
 */

import React, { useState, useEffect } from 'react';
import { InterlockRuleAuditFilter, BizIlruleItem, AuditApiResponse } from '../types/interlockRuleAudit.types';
import { interlockRuleApi } from '../api';
import {
  CompactAuditHeader,
  CompactFilterForm,
  DieAttachRibbon,
  RulesTable,
  RuleSqlModal,
} from '../components';

export const InterlockRuleAuditView: React.FC = () => {
  // Trạng thái bộ lọc: Để trống ban đầu (không áp đặt mặc định)
  const [filter, setFilter] = useState<InterlockRuleAuditFilter>({
    model: '',
    operation: '',
    eifEqpGroup: '',
    equipmentId: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AuditApiResponse | null>(null);
  const [selectedRule, setSelectedRule] = useState<BizIlruleItem | null>(null);

  // Thực hiện tra cứu qua API
  const handleSearch = async (customFilter?: InterlockRuleAuditFilter) => {
    const targetFilter = customFilter || filter;
    setLoading(true);
    setError(null);
    try {
      const res = await interlockRuleApi.auditRules(targetFilter);
      setData(res);
      // Giữ nguyên filter người dùng đang nhập, không tự ý gán đè
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tra cứu BIZ_ILRULE_INFO');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  // Áp dụng nhanh cấu hình mẫu (chỉ khi người dùng chủ động nhấn)
  const applyPreset = (preset: 'DA013VN' | 'DA014VN' | 'WB161VN') => {
    let target: InterlockRuleAuditFilter;
    if (preset === 'DA013VN') {
      target = { model: 'DIEATTACH', operation: 'EPBV', eifEqpGroup: 'D/A', equipmentId: 'DA013VN' };
    } else if (preset === 'DA014VN') {
      target = { model: 'DIEATTACH', operation: 'EPBC', eifEqpGroup: 'D/A', equipmentId: 'DA014VN' };
    } else {
      target = { model: 'WIREBOND', operation: 'WBE', eifEqpGroup: 'W/B', equipmentId: 'WB161VN' };
    }
    setFilter(target);
    handleSearch(target);
  };

  // Xóa bộ lọc về trống
  const handleClearFilter = () => {
    const emptyFilter: InterlockRuleAuditFilter = {
      model: '',
      operation: '',
      eifEqpGroup: '',
      equipmentId: '',
    };
    setFilter(emptyFilter);
    handleSearch(emptyFilter);
  };

  const isDA = filter.model === 'DIEATTACH' || data?.isDieAttachModel;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B101D] text-slate-200 p-2.5 sm:p-3 overflow-y-auto space-y-2 font-sans">
      {/* 1. Header nhỏ gọn */}
      <CompactAuditHeader
        loading={loading}
        data={data}
        equipmentId={filter.equipmentId}
        onRefresh={() => handleSearch()}
      />

      {/* 2. Form tìm kiếm 5 cột thẳng hàng (4 ô input + nút Tra cứu) */}
      <CompactFilterForm
        filter={filter}
        onChangeField={(field, val) => setFilter({ ...filter, [field]: val })}
        onSubmit={() => handleSearch()}
        onApplyPreset={applyPreset}
        onClearFilter={handleClearFilter}
        loading={loading}
      />

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* 3. Banner Nghiệp vụ Die Attach Dạng Ribbon (chỉ hiện khi người dùng chọn DIEATTACH) */}
      <DieAttachRibbon
        isDA={Boolean(isDA)}
        validation={data?.daValidation}
        operGroup={data?.operGroup}
        equipGroup={data?.equipGroup}
      />

      {/* 4. Bảng Quy Tắc BIZ_ILRULE_INFO */}
      <RulesTable
        data={data}
        loading={loading}
        onSelectRuleForSql={(rule) => setSelectedRule(rule)}
        filter={filter}
      />

      {/* 5. Modal Popup Xem Chi Tiết SQL */}
      <RuleSqlModal
        rule={selectedRule}
        onClose={() => setSelectedRule(null)}
      />
    </div>
  );
};

export default InterlockRuleAuditView;

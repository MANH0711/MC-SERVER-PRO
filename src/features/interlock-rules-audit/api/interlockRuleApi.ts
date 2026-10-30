/**
 * API: Interlock Rule Audit
 * Gọi API backend NestJS và hỗ trợ xuất CSV / JSON
 */

import {
  InterlockRuleAuditFilter,
  AuditApiResponse,
  BizIlruleItem,
  AuditOptionsResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

export const interlockRuleApi = {
  /**
   * Lấy danh sách options kéo chọn cho 4 ô (Model, Operation, EqpGroup, Equipment)
   */
  async getAuditOptions(): Promise<AuditOptionsResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/interlock/audit-options`);
    if (!res.ok) {
      throw new Error(`Không thể lấy danh mục options (${res.status})`);
    }
    return await res.json();
  },

  /**
   * Truy vấn danh sách quy tắc BIZ_ILRULE_INFO
   */
  async auditRules(filter: InterlockRuleAuditFilter): Promise<AuditApiResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/interlock/audit-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipmentId: filter.equipmentId?.trim() || '',
        model: filter.model?.trim() || '',
        operation: filter.operation?.trim() || '',
        eifEqpGroup: filter.eifEqpGroup?.trim() || '',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Máy chủ MES báo lỗi (${res.status}): ${errText || res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Xuất danh sách quy tắc ra file CSV
   */
  exportToCsv(rules: BizIlruleItem[], equipId: string): void {
    if (!rules || rules.length === 0) return;

    const headers = [
      'RULE_ID',
      'MODEL_GRP1',
      'OPER_GRP2',
      'EQP_GRP3',
      'EQP_ID_GRP4',
      'CHECK_TYPE',
      'ERROR_MSG',
      'TYPE',
    ];

    const rows = rules.map((r) => [
      `"${r.ruleId}"`,
      `"${r.ruleKeyGroup1}"`,
      `"${r.ruleKeyGroup2}"`,
      `"${r.ruleKeyGroup3}"`,
      `"${r.ruleKeyGroup4}"`,
      `"${r.checkType || ''}"`,
      `"${(r.errorMsg || '').replace(/"/g, '""')}"`,
      `"${r.isSpecific ? 'SPECIFIC' : 'FALLBACK_ALL'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BIZ_ILRULE_${equipId || 'ALL'}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Xuất toàn bộ gói audit dạng JSON
   */
  exportToJson(data: AuditApiResponse): void {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BIZ_ILRULE_${data.equipmentId || 'ALL'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

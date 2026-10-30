import React, { useState, useMemo } from 'react';
import {
  Search,
  Code,
  Database,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BizIlruleItem, AuditApiResponse, InterlockRuleAuditFilter } from '../types/interlockRuleAudit.types';

/**
 * Hàm sinh câu truy vấn Oracle SQL chi tiết theo thời gian thực (Reactive)
 * Tự động điền tham số ngay khi người dùng gõ/chọn ở bất kỳ ô input nào
 */
export function generateAuditSql(
  filter?: InterlockRuleAuditFilter,
  plant: string = 'ITMVIET'
): string {
  const targetPlant = (plant || 'ITMVIET').trim();
  const resolvedModel = (filter?.model || '').trim().toUpperCase() || 'ALL';
  const resolvedOper = (filter?.operation || '').trim().toUpperCase() || 'ALL';
  const resolvedGroup = (filter?.eifEqpGroup || '').trim().toUpperCase() || 'ALL';
  const resolvedEquip = (filter?.equipmentId || '').trim().toUpperCase() || 'ALL';

  return `WITH MATCHED_CANDIDATES AS (
  SELECT a.RULE_ID,
         a.RULE_KEY,
         a.RULE_KEY_GROUP1,
         a.RULE_KEY_GROUP2,
         a.RULE_KEY_GROUP3,
         a.RULE_KEY_GROUP4,
         a.CHECK_TYPE,
         NVL(a.BIND_ITEM, 'NONE') AS BIND_ITEM,
         a.CHECK_SQL_1,
         a.ERROR_MSG_E,
         a.ACTIVE_FLAG,
         CASE WHEN a.RULE_KEY_GROUP1 <> 'ALL' AND a.RULE_KEY_GROUP1 = '${resolvedModel}' THEN 0 ELSE 1 END AS P_GRP1,
         CASE WHEN a.RULE_KEY_GROUP2 <> 'ALL' AND a.RULE_KEY_GROUP2 = '${resolvedOper}'  THEN 0 ELSE 1 END AS P_GRP2,
         CASE WHEN a.RULE_KEY_GROUP3 <> 'ALL' AND a.RULE_KEY_GROUP3 = '${resolvedGroup}' THEN 0 ELSE 1 END AS P_GRP3,
         CASE WHEN a.RULE_KEY_GROUP4 <> 'ALL' AND a.RULE_KEY_GROUP4 = '${resolvedEquip}' THEN 0 ELSE 1 END AS P_GRP4
    FROM BIZ_ILRULE_INFO a
   WHERE a.PLANT = '${targetPlant}'
     AND a.TRANS_CODE = 'EPBV'
     AND a.RULE_TYPE = 'EIF'
     AND a.RULE_KEY_GROUP1 IN ('${resolvedModel}', 'ALL')
     AND a.RULE_KEY_GROUP2 IN ('${resolvedOper}', 'ALL')
     AND a.RULE_KEY_GROUP3 IN ('${resolvedGroup}', 'ALL')
     AND a.RULE_KEY_GROUP4 IN ('${resolvedEquip}', 'ALL')
),
RANKED_RULES AS (
  SELECT m.*,
         ROW_NUMBER() OVER (
           PARTITION BY m.RULE_ID 
           ORDER BY m.P_GRP1 ASC, m.P_GRP2 ASC, m.P_GRP3 ASC, m.P_GRP4 ASC, m.RULE_KEY DESC
         ) AS RN
    FROM MATCHED_CANDIDATES m
)
SELECT RULE_ID,
       RULE_KEY,
       RULE_KEY_GROUP1,
       RULE_KEY_GROUP2,
       RULE_KEY_GROUP3,
       RULE_KEY_GROUP4,
       CHECK_TYPE,
       BIND_ITEM,
       ERROR_MSG_E,
       CHECK_SQL_1,
       ACTIVE_FLAG,
       (P_GRP1 + P_GRP2 + P_GRP3 + P_GRP4) AS SPECIFICITY_SCORE
  FROM RANKED_RULES
 WHERE RN = 1
 ORDER BY SPECIFICITY_SCORE ASC, RULE_ID ASC;`;
}

interface RulesTableProps {
  data: AuditApiResponse | null;
  loading: boolean;
  onSelectRuleForSql: (rule: BizIlruleItem) => void;
  filter?: InterlockRuleAuditFilter;
}

export const RulesTable: React.FC<RulesTableProps> = ({
  data,
  loading,
  onSelectRuleForSql,
  filter,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'SPECIFIC' | 'FALLBACK'>('ALL');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [isSqlCollapsed, setIsSqlCollapsed] = useState<boolean>(false);

  // Sinh câu SQL thời gian thực: ngay khi người dùng gõ bất kỳ ô input nào thì câu SQL cập nhật tức thì
  const currentSql = useMemo(() => {
    return generateAuditSql(filter, data?.plant || 'ITMVIET');
  }, [filter, data?.plant]);

  // Tham số thực tế hiện tại
  const currentParams = useMemo(() => {
    const p = data?.plant || 'ITMVIET';
    const m = (filter?.model || '').trim().toUpperCase() || 'ALL';
    const o = (filter?.operation || '').trim().toUpperCase() || 'ALL';
    const g = (filter?.eifEqpGroup || '').trim().toUpperCase() || 'ALL';
    const e = (filter?.equipmentId || '').trim().toUpperCase() || 'ALL';
    return { p, m, o, g, e };
  }, [filter, data?.plant]);

  const activeCount = useMemo(() => {
    if (!data?.matchedRules) return 0;
    return data.matchedRules.filter((r) => r.activeFlag !== 'N' && r.isActive !== false).length;
  }, [data?.matchedRules]);

  const inactiveCount = useMemo(() => {
    if (!data?.matchedRules) return 0;
    return data.matchedRules.filter((r) => r.activeFlag === 'N' || r.isActive === false).length;
  }, [data?.matchedRules]);

  const filteredRules = useMemo(() => {
    if (!data?.matchedRules) return [];
    return data.matchedRules.filter((r) => {
      if (filterType === 'ACTIVE' && (r.activeFlag === 'N' || r.isActive === false)) return false;
      if (filterType === 'INACTIVE' && (r.activeFlag !== 'N' && r.isActive !== false)) return false;
      if (filterType === 'SPECIFIC' && !r.isSpecific) return false;
      if (filterType === 'FALLBACK' && r.isSpecific) return false;
      if (!searchTerm) return true;
      const t = searchTerm.toLowerCase();
      return (
        r.ruleId.toLowerCase().includes(t) ||
        (r.errorMsg || '').toLowerCase().includes(t) ||
        r.ruleKeyGroup1.toLowerCase().includes(t) ||
        r.ruleKeyGroup2.toLowerCase().includes(t)
      );
    });
  }, [data, searchTerm, filterType]);

  const handleCopyAuditSql = () => {
    if (currentSql) {
      navigator.clipboard.writeText(currentSql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  return (
    <div className="space-y-2 flex-1 flex flex-col min-h-0">
      {/* Thanh Chỉ Số KPI & Bộ Lọc Nhanh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs pt-0.5 shrink-0">
        {/* KPI Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="px-2 py-0.5 rounded-md bg-indigo-950/40 border border-indigo-500/30 font-mono text-indigo-300 text-xs flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-sans">Tổng Rules:</span>
            <strong>{data?.totalRules || 0}</strong>
          </div>
          <div className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/30 font-mono text-emerald-300 text-xs flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-sans">Active:</span>
            <strong>{activeCount}</strong>
          </div>
          {inactiveCount > 0 && (
            <div className="px-2 py-0.5 rounded-md bg-rose-950/40 border border-rose-500/30 font-mono text-rose-300 text-xs flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-sans">Inactive:</span>
              <strong>{inactiveCount}</strong>
            </div>
          )}
          <div className="px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-500/30 font-mono text-cyan-300 text-xs flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-sans">Cụ thể:</span>
            <strong>{data?.specificRulesCount || 0}</strong>
          </div>
          <div className="px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-500/30 font-mono text-amber-300 text-xs flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-sans">Chung ALL:</span>
            <strong>{data?.fallbackRulesCount || 0}</strong>
          </div>
        </div>

        {/* Search & Filter Trong Danh Sách */}
        <div className="flex items-center gap-1.5">
          <div className="relative w-40 sm:w-52">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Lọc Rule ID, lỗi..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-7 pr-2 py-0.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                filterType === 'ALL'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('ACTIVE')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                filterType === 'ACTIVE'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterType('INACTIVE')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                filterType === 'INACTIVE'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Inactive ({inactiveCount})
            </button>
            <button
              onClick={() => setFilterType('SPECIFIC')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                filterType === 'SPECIFIC'
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Cụ thể
            </button>
            <button
              onClick={() => setFilterType('FALLBACK')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                filterType === 'FALLBACK'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              ALL
            </button>
          </div>
        </div>
      </div>

      {/* Bảng Dữ Liệu BIZ_ILRULE_INFO */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70 shadow-inner max-h-56 xl:max-h-100 shrink-0">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase font-semibold tracking-wider border-b border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="py-2 px-3 w-12 text-slate-500">#</th>
              <th className="py-2 px-3">Mã Rule (RULE_ID)</th>
              <th className="py-2 px-3">Khóa Phân Cấp (MODEL / OPER / EQP_GRP / EQP_ID)</th>
              <th className="py-2 px-3 text-center w-28">Active Interlock</th>
              <th className="py-2 px-3">Mã & Nội Dung Cảnh Báo Lỗi (ERROR_MSG_E)</th>
              <th className="py-2 px-3 text-center">Kiểu Check</th>
              <th className="py-2 px-3 text-right">Cú Pháp SQL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                  {loading
                    ? 'Đang truy vấn quy tắc BIZ_ILRULE_INFO...'
                    : 'Không tìm thấy quy tắc nào khớp với bộ lọc.'}
                </td>
              </tr>
            ) : (
              filteredRules.map((rule, idx) => (
                <tr key={`${rule.ruleId}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-indigo-300 text-xs">{rule.ruleId}</span>
                      {rule.isSpecific ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-sans">
                          Cụ thể
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-950/60 text-amber-300 border border-amber-500/30 font-sans">
                          ALL
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                        {rule.ruleKeyGroup1}
                      </span>
                      <span className="text-slate-600">/</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
                        {rule.ruleKeyGroup2}
                      </span>
                      <span className="text-slate-600">/</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300">
                        {rule.ruleKeyGroup3}
                      </span>
                      <span className="text-slate-600">/</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-purple-300">
                        {rule.ruleKeyGroup4}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center">
                    {rule.activeFlag === 'N' || rule.isActive === false ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        INACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 max-w-md">
                    <span className="font-sans text-xs text-slate-300 line-clamp-1">
                      {rule.errorMsg || 'N/A'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {rule.checkType || 'SQL'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => onSelectRuleForSql(rule)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-indigo-950 text-indigo-300 hover:text-indigo-200 border border-slate-700 text-[11px] font-sans transition-colors"
                    >
                      <Code className="w-3 h-3" />
                      <span>Xem SQL</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Ô VIEW CÂU TRUY VẤN ORACLE SQL CHI TIẾT ── */}
      {currentSql && (
        <div className="rounded-xl border border-indigo-500/30 bg-slate-900/95 shadow-xl overflow-hidden shrink-0 mt-1">
          {/* Header ô SQL */}
          <div className="px-3.5 py-2 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-bold text-slate-100 font-mono tracking-wide">
                    CÂU TRUY VẤN ORACLE SQL CHI TIẾT
                  </h3>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span className="text-slate-500">Tham số:</span>
                  <span className="text-cyan-300 font-mono font-bold bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/30">
                    MODEL: {currentParams.m}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-300 font-mono font-bold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                    OPER: {currentParams.o}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-300 font-mono font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                    GROUP: {currentParams.g}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-indigo-300 font-mono font-bold bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-500/30">
                    EQUIP: {currentParams.e}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    PLANT: {currentParams.p}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAuditSql}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-all ${
                  copiedSql
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white border-indigo-500 shadow-md shadow-indigo-600/25'
                }`}
                title="Sao chép toàn bộ câu lệnh SQL để dán vào DB"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>ĐÃ SAO CHÉP SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>SAO CHÉP SQL</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsSqlCollapsed(!isSqlCollapsed)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title={isSqlCollapsed ? 'Mở rộng câu SQL' : 'Thu gọn câu SQL'}
              >
                {isSqlCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nội dung câu SQL đã điền tham số thực tế */}
          {!isSqlCollapsed && (
            <div className="p-2.5 bg-slate-950">
              <pre className="p-2.5 rounded-lg bg-black/80 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-slate-800/80 whitespace-pre leading-relaxed max-h-43 shadow-inner select-all">
                {currentSql}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

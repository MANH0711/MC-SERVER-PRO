/**
 * TYPES: Interlock Rule Audit
 * Quản lý kiểu dữ liệu tra cứu quy tắc BIZ_ILRULE_INFO
 */

export interface InterlockRuleAuditFilter {
  equipmentId: string;
  model: string;
  operation: string;
  eifEqpGroup: string;
}

export interface BizIlruleItem {
  ruleId: string;
  ruleKey: string;
  ruleKeyGroup1: string; // Model
  ruleKeyGroup2: string; // Operation
  ruleKeyGroup3: string; // EQP Group (D/A, W/B...)
  ruleKeyGroup4: string; // EquipmentId
  checkType: string;
  bindItem: string;
  errorMsg: string;
  sql: string;
  activeFlag?: string;
  isActive?: boolean;
  specificityScore: number;
  isSpecific: boolean;
}

export interface DieAttachValidation {
  isValid: boolean;
  message: string;
  isDaOper: boolean;
  isDaEquip: boolean;
}

export interface AuditApiResponse {
  plant: string;
  equipmentModel: string;
  operation: string;
  equipmentId: string;
  equipGroup: string;
  operGroup: string;
  isDieAttachModel: boolean;
  daValidation: DieAttachValidation;
  matchedRules: BizIlruleItem[];
  totalRules: number;
  specificRulesCount: number;
  fallbackRulesCount: number;
  auditSql?: string;
}

export interface AuditEquipmentOption {
  equipmentId: string;
  description: string;
  displayName: string;
}

export interface AuditOptionsResponse {
  plant: string;
  models: string[];
  operations: string[];
  eqpGroups: string[];
  equipments: AuditEquipmentOption[];
}

export interface RuleCheckHistoryItem {
  EQUIPMENT_ID: string;
  OPERATION: string;
  LOT_ID?: string;
  PASS_FLAG: string;
  ERR_CODE?: string;
  ERR_MSG?: string;
  CREATE_TIME: string;
  CREATE_USER?: string;
}

import { Injectable, Logger } from '@nestjs/common';
import { OracleService } from '../database/oracle.service';
import { DieAttachService } from '../interlock/die-attach.service';

export interface AuditRulesParams {
  plant?: string;
  equipmentModel?: string;
  operation?: string;
  equipmentId?: string;
  equipGroup?: string;
  model?: string;
  eifEqpGroup?: string;
}

export interface EquipmentOptionItem {
  equipmentId: string;
  description: string;
  displayName: string;
}

export interface AuditFilterOptionsResult {
  plant: string;
  models: string[];
  operations: string[];
  eqpGroups: string[];
  equipments: EquipmentOptionItem[];
}

export interface BizIlruleItem {
  ruleId: string;
  ruleKey: string;
  ruleKeyGroup1: string;
  ruleKeyGroup2: string;
  ruleKeyGroup3: string;
  ruleKeyGroup4: string;
  checkType: string;
  bindItem: string;
  errorMsg: string;
  sql?: string;
  activeFlag?: string;
  isActive?: boolean;
  specificityScore: number;
  isSpecific: boolean;
}

export interface DaValidationResult {
  isValid: boolean;
  message: string;
  isDaOper: boolean;
  isDaEquip: boolean;
}

export interface AuditRulesResult {
  plant: string;
  equipmentModel: string;
  operation: string;
  equipmentId: string;
  equipGroup: string;
  operGroup: string;
  isDieAttachModel: boolean;
  daValidation: DaValidationResult;
  matchedRules: BizIlruleItem[];
  totalRules: number;
  specificRulesCount: number;
  fallbackRulesCount: number;
  auditSql: string;
}

@Injectable()
export class InterlockRulesService {
  private readonly logger = new Logger(InterlockRulesService.name);

  constructor(private readonly oracleService: OracleService) {}

  /**
   * Lấy danh sách options cho các ô kéo chọn tra cứu (Model, Operation, EqpGroup, EquipmentId)
   * Nguồn: Oracle DB (SYS_SYSTEM_CODE_DATA, ADM_GROUP_CATEGORY_DATA, ADM_USER_CODE_DATA, ADM_EQUIPMENT)
   */
  async getAuditFilterOptions(plant?: string): Promise<AuditFilterOptionsResult> {
    const targetPlant = (plant || DieAttachService.getGlobalPlant() || 'ITMVIET').trim();

    let models: string[] = [];
    let operations: string[] = [];
    let eqpGroups: string[] = [];
    let equipments: EquipmentOptionItem[] = [];

    if (!this.oracleService.isUsingFallback()) {
      try {
        // 1. Models từ SYS_SYSTEM_CODE_DATA (DEVICE_STYPE)
        const sqlModels = `
          SELECT CODE_NAME AS MODEL 
          FROM SYS_SYSTEM_CODE_DATA 
          WHERE PLANT = :plant 
            AND TABLE_NAME = 'DEVICE_STYPE' 
          ORDER BY CODE_SEQ
        `;
        const modelRows = await this.oracleService.executeQuery<{ MODEL: string }>(
          sqlModels,
          { plant: targetPlant },
          'ITMVMES'
        );
        if (modelRows) {
          models = modelRows.map((r) => r.MODEL).filter(Boolean);
        }

        // 2. Operations từ ADM_GROUP_CATEGORY_DATA (EIF_OPER_GROUP)
        const sqlOpers = `
          SELECT GROUP_OBJECT AS OPERATION 
          FROM ADM_GROUP_CATEGORY_DATA 
          WHERE PLANT = :plant 
            AND GROUP_TARGET = 'OPERATION' 
            AND GROUP_CATEGORY = 'EIF_OPER_GROUP' 
          ORDER BY GROUP_OBJECT
        `;
        const operRows = await this.oracleService.executeQuery<{ OPERATION: string }>(
          sqlOpers,
          { plant: targetPlant },
          'ITMVMES'
        );
        if (operRows) {
          operations = operRows.map((r) => r.OPERATION).filter(Boolean);
        }

        // 3. EQP Groups từ ADM_USER_CODE_DATA (EIF_TYPE_TABLE)
        const sqlEqpGroups = `
          SELECT CODE_NAME AS EQP_TYPE 
          FROM ADM_USER_CODE_DATA 
          WHERE PLANT = :plant 
            AND TABLE_NAME = 'EIF_TYPE_TABLE' 
          ORDER BY CODE_SEQ
        `;
        const grpRows = await this.oracleService.executeQuery<{ EQP_TYPE: string }>(
          sqlEqpGroups,
          { plant: targetPlant },
          'ITMVMES'
        );
        if (grpRows) {
          eqpGroups = grpRows.map((r) => r.EQP_TYPE).filter(Boolean);
        }

        // 4. Equipments từ ADM_EQUIPMENT
        const sqlEquips = `
          SELECT EQUIPMENT_ID, DESCRIPTION, EQUIPMENT_ID || ' : ' || DESCRIPTION AS DISPLAY_NAME 
          FROM ADM_EQUIPMENT 
          WHERE PLANT = :plant 
          ORDER BY EQUIPMENT_ID
        `;
        const equipRows = await this.oracleService.executeQuery<{
          EQUIPMENT_ID: string;
          DESCRIPTION: string;
          DISPLAY_NAME: string;
        }>(sqlEquips, { plant: targetPlant }, 'ITMVMES');
        if (equipRows) {
          equipments = equipRows.map((r) => ({
            equipmentId: r.EQUIPMENT_ID,
            description: r.DESCRIPTION || '',
            displayName: r.DISPLAY_NAME || `${r.EQUIPMENT_ID} : ${r.DESCRIPTION || ''}`,
          }));
        }
      } catch (err: any) {
        this.logger.error(`Lỗi khi lấy danh sách audit options: ${err.message}`);
      }
    }

    // Dữ liệu dự phòng chuẩn nếu Oracle offline
    if (models.length === 0) {
      models = ['DIEATTACH', 'WIREBOND', 'SMT', 'DISPENSER', 'ALL'];
    }
    if (operations.length === 0) {
      operations = ['EPBV', 'EPBC', 'WBE', 'ALL'];
    }
    if (eqpGroups.length === 0) {
      eqpGroups = ['D/A', 'W/B', 'SMT-BAKE', 'ALL'];
    }
    if (equipments.length === 0) {
      equipments = [
        { equipmentId: 'DA013VN', description: 'Die Attach Machine 13', displayName: 'DA013VN : Die Attach Machine 13' },
        { equipmentId: 'DA014VN', description: 'Die Attach Machine 14', displayName: 'DA014VN : Die Attach Machine 14' },
        { equipmentId: 'WB161VN', description: 'Wire Bond Machine 161', displayName: 'WB161VN : Wire Bond Machine 161' },
      ];
    }

    return {
      plant: targetPlant,
      models,
      operations,
      eqpGroups,
      equipments,
    };
  }

  /**
   * Tra cứu thông tin thiết bị từ ADM_EQUIPMENT
   */
  async resolveEquipmentRecord(equipId: string, plant?: string): Promise<{
    plant?: string;
    model?: string;
    description?: string;
  } | null> {
    if (!equipId || this.oracleService.isUsingFallback()) return null;
    try {
      const sql = `
        SELECT PLANT, EQUIPMENT_ID, DESCRIPTION, MODEL
        FROM ADM_EQUIPMENT
        WHERE UPPER(EQUIPMENT_ID) = UPPER(:equip)
          ${plant ? 'AND PLANT = :plant' : ''}
      `;
      const binds: any = { equip: equipId.trim() };
      if (plant) binds.plant = plant.trim();

      const rows = await this.oracleService.executeQuery<any>(sql, binds, 'ITMVMES');
      if (rows && rows.length > 0) {
        return {
          plant: rows[0].PLANT?.trim(),
          model: rows[0].MODEL?.trim(),
          description: rows[0].DESCRIPTION?.trim(),
        };
      }
    } catch (e: any) {
      this.logger.debug(`Không thể dò thông tin thiết bị ${equipId}: ${e.message}`);
    }
    return null;
  }

  /**
   * Báo cáo tra cứu các quy tắc Interlock trong BIZ_ILRULE_INFO được áp dụng
   * khi biết Model thiết bị, Mã công đoạn, Tên ID thiết bị và Nhóm thiết bị (EIF_EQP_GROUP).
   */
  async auditInterlockRules(params: AuditRulesParams): Promise<AuditRulesResult> {
    let targetPlant = (params.plant || DieAttachService.getGlobalPlant() || 'ITMVIET').trim();
    let equipId = (params.equipmentId || '').trim();
    let oper = (params.operation || '').trim();
    let equipModel = (params.equipmentModel || params.model || '').trim();
    let equipGroup = (params.equipGroup || params.eifEqpGroup || '').trim();
    let operGroup = '';

    // 1. Tự động truy vấn nếu người dùng chỉ nhập Equipment ID
    if (equipId) {
      const equipRecord = await this.resolveEquipmentRecord(equipId, targetPlant);
      if (equipRecord) {
        if (!equipModel && equipRecord.model) {
          equipModel = equipRecord.model;
        }
        if (!targetPlant && equipRecord.plant) {
          targetPlant = equipRecord.plant;
        }
      }

      // Tra cứu EIF_EQP_GROUP từ ADM_GROUP_CATEGORY_DATA nếu chưa có
      if (!equipGroup && !this.oracleService.isUsingFallback()) {
        try {
          const sqlEquip = `
            SELECT GROUP_VALUE  
            FROM ADM_GROUP_CATEGORY_DATA 
            WHERE PLANT = :plant 
              AND GROUP_TARGET = 'EQUIPMENT' 
              AND GROUP_OBJECT = :equip 
              AND GROUP_INDEX = '13'
              AND GROUP_CATEGORY = 'EIF_EQP_GROUP'
          `;
          const rows = await this.oracleService.executeQuery<{ GROUP_VALUE: string }>(
            sqlEquip,
            { plant: targetPlant, equip: equipId },
            'ITMVMES'
          );
          if (rows && rows.length > 0 && rows[0].GROUP_VALUE) {
            equipGroup = rows[0].GROUP_VALUE.trim();
          }
        } catch (err: any) {
          this.logger.debug(`Không thể tra cứu EIF_EQP_GROUP: ${err.message}`);
        }
      }
    }

    // 2. Tra cứu EIF_OPER_GROUP từ ADM_GROUP_CATEGORY_DATA nếu có Operation
    if (oper && !this.oracleService.isUsingFallback()) {
      try {
        const sqlOper = `
          SELECT GROUP_VALUE  
          FROM ADM_GROUP_CATEGORY_DATA 
          WHERE PLANT = :plant 
            AND GROUP_TARGET = 'OPERATION' 
            AND GROUP_OBJECT = :oper 
            AND GROUP_INDEX = '22' 
            AND GROUP_CATEGORY = 'EIF_OPER_GROUP'
        `;
        const operRows = await this.oracleService.executeQuery<{ GROUP_VALUE: string }>(
          sqlOper,
          { plant: targetPlant, oper },
          'ITMVMES'
        );
        if (operRows && operRows.length > 0 && operRows[0].GROUP_VALUE) {
          operGroup = operRows[0].GROUP_VALUE.trim();
        }
      } catch (err: any) {
        this.logger.debug(`Không thể tra cứu EIF_OPER_GROUP: ${err.message}`);
      }
    }

    // Thiết lập mặc định nếu vẫn để trống
    const resolvedModel = equipModel || 'ALL';
    const resolvedOper = oper || 'ALL';
    const resolvedEquip = equipId || 'ALL';
    const resolvedGroup = equipGroup || 'ALL';

    // 3. Đánh giá tính hợp lệ nghiệp vụ Die Attach
    const isDieAttachModel =
      (equipModel || '').toUpperCase().includes('DIEATTACH') ||
      (equipModel || '').toUpperCase().includes('DA') ||
      (resolvedModel || '').toUpperCase().includes('DIEATTACH');

    const isDaOper = operGroup
      ? operGroup.toUpperCase() === 'D/A' || operGroup.toUpperCase() === 'DA'
      : true;
    const isDaEquip = equipGroup
      ? equipGroup.toUpperCase() === 'D/A' || equipGroup.toUpperCase() === 'DA'
      : true;

    let daValidationMessage = 'Đạt chuẩn kiểm tra nhóm liên khóa';
    let isDaValid = true;

    if (isDieAttachModel) {
      if (oper && !isDaOper) {
        isDaValid = false;
        daValidationMessage = `Cảnh báo: Model thiết bị DIEATTACH yêu cầu công đoạn thuộc nhóm 'D/A', nhưng công đoạn '${oper}' thuộc nhóm '${operGroup || 'Không xác định'}'.`;
      } else if (equipId && !isDaEquip) {
        isDaValid = false;
        daValidationMessage = `Cảnh báo: Model thiết bị DIEATTACH yêu cầu thiết bị thuộc nhóm 'D/A', nhưng thiết bị '${equipId}' thuộc nhóm '${equipGroup || 'Không xác định'}'.`;
      } else {
        daValidationMessage = `Model DIEATTACH: Hợp lệ với nhóm 'D/A' và mã lệnh chuẩn S050.`;
      }
    }

    // 4. Truy vấn danh sách rule khớp trong BIZ_ILRULE_INFO
    let matchedRules: BizIlruleItem[] = [];
    if (!this.oracleService.isUsingFallback()) {
      try {
        const sql = `
          WITH MATCHED_CANDIDATES AS (
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
                   CASE WHEN a.RULE_KEY_GROUP1 <> 'ALL' AND a.RULE_KEY_GROUP1 = :model THEN 0 ELSE 1 END AS P_GRP1,
                   CASE WHEN a.RULE_KEY_GROUP2 <> 'ALL' AND a.RULE_KEY_GROUP2 = :oper  THEN 0 ELSE 1 END AS P_GRP2,
                   CASE WHEN a.RULE_KEY_GROUP3 <> 'ALL' AND a.RULE_KEY_GROUP3 = :grp   THEN 0 ELSE 1 END AS P_GRP3,
                   CASE WHEN a.RULE_KEY_GROUP4 <> 'ALL' AND a.RULE_KEY_GROUP4 = :equip THEN 0 ELSE 1 END AS P_GRP4
              FROM BIZ_ILRULE_INFO a
             WHERE a.PLANT = :plant
               AND a.TRANS_CODE = 'EPBV'
               AND a.RULE_TYPE = 'EIF'
               AND a.RULE_KEY_GROUP1 IN (:model, 'ALL')
               AND a.RULE_KEY_GROUP2 IN (:oper, 'ALL')
               AND a.RULE_KEY_GROUP3 IN (:grp, 'ALL')
               AND a.RULE_KEY_GROUP4 IN (:equip, 'ALL')
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
           ORDER BY SPECIFICITY_SCORE ASC, RULE_ID ASC
        `;

        const rows = await this.oracleService.executeQuery<any>(
          sql,
          {
            plant: targetPlant,
            model: resolvedModel,
            oper: resolvedOper,
            grp: resolvedGroup,
            equip: resolvedEquip,
          },
          'ITMVMES'
        );

        if (rows && rows.length > 0) {
          matchedRules = rows.map((r) => {
            const isSpecific =
              r.RULE_KEY_GROUP1 !== 'ALL' ||
              r.RULE_KEY_GROUP2 !== 'ALL' ||
              r.RULE_KEY_GROUP3 !== 'ALL' ||
              r.RULE_KEY_GROUP4 !== 'ALL';
            const flag = (r.ACTIVE_FLAG || 'Y').trim().toUpperCase();
            return {
              ruleId: r.RULE_ID,
              ruleKey: r.RULE_KEY,
              ruleKeyGroup1: r.RULE_KEY_GROUP1,
              ruleKeyGroup2: r.RULE_KEY_GROUP2,
              ruleKeyGroup3: r.RULE_KEY_GROUP3,
              ruleKeyGroup4: r.RULE_KEY_GROUP4,
              checkType: r.CHECK_TYPE,
              bindItem: r.BIND_ITEM,
              errorMsg: r.ERROR_MSG_E,
              sql: r.CHECK_SQL_1,
              activeFlag: flag,
              isActive: flag === 'Y',
              specificityScore: r.SPECIFICITY_SCORE ?? 4,
              isSpecific,
            };
          });
        }
      } catch (err: any) {
        this.logger.error(`Lỗi khi audit BIZ_ILRULE_INFO: ${err.message}`);
      }
    }

    // Câu lệnh SQL chi tiết thực tế có thể copy dán vào DB chạy ngay lập tức
    const executableSql = `WITH MATCHED_CANDIDATES AS (
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

    return {
      plant: targetPlant,
      equipmentModel: equipModel || 'ALL',
      operation: oper || 'ALL',
      equipmentId: equipId || 'ALL',
      equipGroup: equipGroup || 'ALL',
      operGroup: operGroup || 'Không xác định',
      isDieAttachModel,
      daValidation: {
        isValid: isDaValid,
        message: daValidationMessage,
        isDaOper,
        isDaEquip,
      },
      matchedRules,
      totalRules: matchedRules.length,
      specificRulesCount: matchedRules.filter((r) => r.isSpecific).length,
      fallbackRulesCount: matchedRules.filter((r) => !r.isSpecific).length,
      auditSql: executableSql,
    };
  }
}

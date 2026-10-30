import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { InterlockRulesService, AuditRulesParams } from './interlock-rules.service';

@Controller('api/v1/interlock')
export class InterlockRulesController {
  constructor(private readonly interlockRulesService: InterlockRulesService) {}

  /**
   * Báo cáo tra cứu các quy tắc Interlock trong BIZ_ILRULE_INFO
   * theo Model, Mã công đoạn, Tên ID thiết bị và Nhóm thiết bị (EIF_EQP_GROUP)
   */
  @Post('audit-rules')
  async auditRules(@Body() body: AuditRulesParams) {
    return this.interlockRulesService.auditInterlockRules(body);
  }

  /**
   * Lấy danh sách options cho các ô kéo chọn (Model, Operation, EqpGroup, EquipmentId)
   */
  @Get('audit-options')
  async getAuditOptions(@Query('plant') plant?: string) {
    return this.interlockRulesService.getAuditFilterOptions(plant);
  }
}

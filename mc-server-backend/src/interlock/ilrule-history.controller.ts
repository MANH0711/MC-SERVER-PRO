import { Controller, Get, Query, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { IlruleHistoryService, IlruleHistoryQueryParams } from './ilrule-history.service';

@Controller('api/v1/interlock/history')
export class IlruleHistoryController {
  constructor(private readonly ilruleHistoryService: IlruleHistoryService) {}

  /**
   * Truy vấn danh sách lịch sử kiểm tra Interlock Rule (có phân trang & bộ lọc)
   */
  @Get()
  async getHistory(@Query() query: IlruleHistoryQueryParams) {
    return this.ilruleHistoryService.getHistory(query);
  }

  /**
   * Lấy số liệu thống kê KPI, Top Rules, Top Equipments, Daily Trends
   */
  @Get('stats')
  async getStats(@Query() query: IlruleHistoryQueryParams) {
    return this.ilruleHistoryService.getStats(query);
  }

  /**
   * Xuất báo cáo lịch sử sang định dạng CSV
   */
  @Get('export')
  async exportCsv(@Query() query: IlruleHistoryQueryParams, @Res() res: Response) {
    const csvContent = await this.ilruleHistoryService.exportCsv(query);
    const filename = `BIZ_ILRULE_CHECK_HISTORY_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  }
}

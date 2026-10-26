import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { InterlockHistoryService, IlruleHistoryQueryParams } from './interlock-history.service';

@Controller('api/v1/interlock/history')
export class InterlockHistoryController {
  constructor(private readonly interlockHistoryService: InterlockHistoryService) {}

  /**
   * Truy vấn danh sách lịch sử kiểm tra Interlock Rule (có phân trang & bộ lọc)
   */
  @Get()
  async getHistory(@Query() query: IlruleHistoryQueryParams) {
    return this.interlockHistoryService.getHistory(query);
  }

  /**
   * Lấy số liệu thống kê KPI, Top Rules, Top Equipments, Daily Trends
   */
  @Get('stats')
  async getStats(@Query() query: IlruleHistoryQueryParams) {
    return this.interlockHistoryService.getStats(query);
  }

  /**
   * Xuất báo cáo lịch sử sang định dạng CSV
   */
  @Get('export')
  async exportCsv(@Query() query: IlruleHistoryQueryParams, @Res() res: Response) {
    const csvContent = await this.interlockHistoryService.exportCsv(query);
    const filename = `BIZ_ILRULE_CHECK_HISTORY_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  }
}

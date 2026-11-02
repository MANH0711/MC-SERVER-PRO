import { Controller, Get, Param, Query, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { DeviceFileLoggerService, DeviceLogFileEntry } from './device-file-logger.service';
import * as fs from 'fs';

@Controller('api/v1/device-logs')
export class DeviceLogsController {
  constructor(private readonly deviceFileLogger: DeviceFileLoggerService) {}

  /**
   * Lấy danh sách các ID thiết bị đã có log lưu tại D:\log
   */
  @Get('equipments')
  async getLoggedEquipments(): Promise<string[]> {
    return await this.deviceFileLogger.getLoggedEquipments();
  }

  /**
   * Lấy danh sách các ngày có file log của một thiết bị (yyyy-mm-dd)
   */
  @Get(':equipmentId/dates')
  async getLogDates(@Param('equipmentId') equipmentId: string): Promise<string[]> {
    return await this.deviceFileLogger.getLogDatesForEquipment(equipmentId);
  }

  /**
   * Đọc nội dung file log của thiết bị theo ngày
   */
  @Get(':equipmentId/:date')
  async getLogContent(
    @Param('equipmentId') equipmentId: string,
    @Param('date') date: string,
    @Query('tail') tail?: string
  ): Promise<DeviceLogFileEntry> {
    const tailLines = tail ? parseInt(tail, 10) : 1000;
    return await this.deviceFileLogger.readLogContent(equipmentId, date, tailLines);
  }

  /**
   * Tải về file log .log vật lý từ D:\log\<equipmentId>\<date>.log
   */
  @Get(':equipmentId/:date/download')
  async downloadLogFile(
    @Param('equipmentId') equipmentId: string,
    @Param('date') date: string,
    @Res() res: Response
  ): Promise<void> {
    const filePath = this.deviceFileLogger.getEquipmentLogPath(equipmentId, date);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File log không tồn tại: ${filePath}`);
    }

    const fileName = `${equipmentId}_${date}.log`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}

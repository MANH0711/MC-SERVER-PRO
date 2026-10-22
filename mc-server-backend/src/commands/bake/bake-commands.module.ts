import { Module } from '@nestjs/common';
import { B101TempProfileUploadHandler } from './B101.temp-profile-upload.handler';
import { B102TempProfileDownloadHandler } from './B102.temp-profile-download.handler';
import { B103ZoneTempMonitorHandler } from './B103.zone-temp-monitor.handler';
import { B104VacuumPressureReportHandler } from './B104.vacuum-pressure-report.handler';
import { B105BakeCycleCompleteHandler } from './B105.bake-cycle-complete.handler';

export const BAKE_COMMAND_HANDLERS = [
  B101TempProfileUploadHandler,
  B102TempProfileDownloadHandler,
  B103ZoneTempMonitorHandler,
  B104VacuumPressureReportHandler,
  B105BakeCycleCompleteHandler,
];

@Module({
  providers: [...BAKE_COMMAND_HANDLERS],
  exports: [...BAKE_COMMAND_HANDLERS],
})
export class BakeCommandsModule {}

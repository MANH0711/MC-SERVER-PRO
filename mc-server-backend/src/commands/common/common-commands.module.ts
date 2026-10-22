import { Module } from '@nestjs/common';
import { M001HeartbeatHandler } from './M001.heartbeat.handler';
import { M002StatusInquiryHandler } from './M002.status-inquiry.handler';
import { M003RecipeUploadHandler } from './M003.recipe-upload.handler';
import { M004RecipeDownloadHandler } from './M004.recipe-download.handler';
import { M005AlarmReportHandler } from './M005.alarm-report.handler';
import { M006AlarmResetHandler } from './M006.alarm-reset.handler';
import { M007LotTrackInHandler } from './M007.lot-track-in.handler';
import { M008LotTrackOutHandler } from './M008.lot-track-out.handler';
import { M009TimeSyncHandler } from './M009.time-sync.handler';
import { M010InterlockCheckHandler } from './M010.interlock-check.handler';

export const COMMON_COMMAND_HANDLERS = [
  M001HeartbeatHandler,
  M002StatusInquiryHandler,
  M003RecipeUploadHandler,
  M004RecipeDownloadHandler,
  M005AlarmReportHandler,
  M006AlarmResetHandler,
  M007LotTrackInHandler,
  M008LotTrackOutHandler,
  M009TimeSyncHandler,
  M010InterlockCheckHandler,
];

@Module({
  providers: [...COMMON_COMMAND_HANDLERS],
  exports: [...COMMON_COMMAND_HANDLERS],
})
export class CommonCommandsModule {}

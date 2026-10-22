import { Module } from '@nestjs/common';
import { J201AngleProgramUploadHandler } from './J201.angle-program-upload.handler';
import { J202AngleProgramDownloadHandler } from './J202.angle-program-download.handler';
import { J203BendingForceReportHandler } from './J203.bending-force-report.handler';
import { J204ToolingLifeCounterHandler } from './J204.tooling-life-counter.handler';
import { J205AngleCompensationHandler } from './J205.angle-compensation.handler';

export const BENDING_COMMAND_HANDLERS = [
  J201AngleProgramUploadHandler,
  J202AngleProgramDownloadHandler,
  J203BendingForceReportHandler,
  J204ToolingLifeCounterHandler,
  J205AngleCompensationHandler,
];

@Module({
  providers: [...BENDING_COMMAND_HANDLERS],
  exports: [...BENDING_COMMAND_HANDLERS],
})
export class BendingCommandsModule {}

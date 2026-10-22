import { Module, Global } from '@nestjs/common';
import { FrameCodec } from './frame.codec';

@Global()
@Module({
  providers: [FrameCodec],
  exports: [FrameCodec],
})
export class ProtocolModule {}

import { Module } from '@nestjs/common';
import { UploadsImageGlobalController } from './controllers/uploads-image-global.controller';
import { UploadsImageGlobalService } from './services/uploads-image-global.service';
import { LoggingModule } from 'src/logging/logging.module';
import { UploadsModule } from 'src/uploads/uploads.module';
import { ImageModule } from 'src/image/image.module';
import { UploadGlobalImageCommandHandler } from './services/cqrs/command/UploadGlobalImageCommandHandler';
import { FindGlobalImagesQueryHandler } from './services/cqrs/query/FindGlobalImagesQueryHandler';

@Module({
  controllers: [UploadsImageGlobalController],
  providers: [UploadsImageGlobalService, UploadGlobalImageCommandHandler, FindGlobalImagesQueryHandler],
  imports: [LoggingModule, UploadsModule, ImageModule]
})
export class UploadsImageGlobalModule {}

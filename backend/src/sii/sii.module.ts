import { Module } from '@nestjs/common';
import { SIIService } from './sii.service';
import { SIIController } from './sii.controller';
import { XmlBuilderService } from './xml-builder.service';
import { XmlSignerService } from './xml-signer.service';
import { SIIClientService } from './sii-client.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [SIIController],
  providers: [SIIService, XmlBuilderService, XmlSignerService, SIIClientService],
  exports: [SIIService],
})
export class SIIModule {}

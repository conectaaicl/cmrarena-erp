import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { ClientNotesController } from './client-notes.controller';

@Module({
  controllers: [ClientsController, ClientNotesController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}

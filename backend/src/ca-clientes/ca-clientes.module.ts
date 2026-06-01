import { Module } from '@nestjs/common';
import { CaClientesController } from './ca-clientes.controller';
import { CaClientesService } from './ca-clientes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CaClientesController],
  providers: [CaClientesService],
  exports: [CaClientesService],
})
export class CaClientesModule {}

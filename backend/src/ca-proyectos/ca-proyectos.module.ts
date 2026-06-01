import { Module } from '@nestjs/common';
import { CaProyectosController } from './ca-proyectos.controller';
import { CaProyectosService } from './ca-proyectos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CaProyectosController],
  providers: [CaProyectosService],
  exports: [CaProyectosService],
})
export class CaProyectosModule {}

import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Req, Query } from '@nestjs/common';
import { CaProyectosService } from './ca-proyectos.service';
import { CreateCaProyectoDto, UpdateCaProyectoDto } from './dto/ca-proyecto.dto';

@Controller('ca-proyectos')
export class CaProyectosController {
  constructor(private readonly service: CaProyectosService) {}

  @Get()
  findAll(@Req() req: any, @Query('estado') estado?: string, @Query('tipo') tipo?: string) {
    return this.service.findAll(req.user.tenantId, estado, tipo);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.tenantId, id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateCaProyectoDto) {
    return this.service.create(req.user.tenantId, dto);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCaProyectoDto) {
    return this.service.update(req.user.tenantId, id, dto);
  }

  @Patch(':id/estado')
  cambiarEstado(@Req() req: any, @Param('id') id: string, @Body('estado') estado: string) {
    return this.service.cambiarEstado(req.user.tenantId, id, estado);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.tenantId, id);
  }
}

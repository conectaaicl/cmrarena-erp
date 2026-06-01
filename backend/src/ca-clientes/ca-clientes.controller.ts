import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query } from '@nestjs/common';
import { CaClientesService } from './ca-clientes.service';
import { CreateCaClienteDto, UpdateCaClienteDto } from './dto/ca-cliente.dto';

@Controller('ca-clientes')
export class CaClientesController {
  constructor(private readonly service: CaClientesService) {}

  @Get()
  findAll(@Req() req: any, @Query('estado') estado?: string) {
    return this.service.findAll(req.user.tenantId, estado);
  }

  @Get('stats')
  stats(@Req() req: any) {
    return this.service.stats(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.tenantId, id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateCaClienteDto) {
    return this.service.create(req.user.tenantId, dto);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCaClienteDto) {
    return this.service.update(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.tenantId, id);
  }
}

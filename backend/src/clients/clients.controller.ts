import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/create-client.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query('search') search?: string) {
    return this.clientsService.findAll(tenantId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente con historial' })
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.clientsService.findOne(tenantId, id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Timeline de actividad del cliente' })
  getTimeline(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.clientsService.getTimeline(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear cliente' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateClientDto) {
    return this.clientsService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cliente (soft delete)' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.clientsService.remove(tenantId, id);
  }
}

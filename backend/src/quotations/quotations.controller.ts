import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Quotations')
@ApiBearerAuth()
@Controller('quotations')
export class QuotationsController {
  constructor(private quotationsService: QuotationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cotizaciones' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query('search') search?: string) {
    return this.quotationsService.findAll(tenantId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cotización' })
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.quotationsService.findOne(tenantId, id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Descargar PDF de cotización' })
  async getPdf(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.quotationsService.generatePdf(tenantId, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cotizacion-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post()
  @ApiOperation({ summary: 'Crear cotización' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateQuotationDto,
  ) {
    return this.quotationsService.create(tenantId, userId, dto);
  }

  @Post(':id/send-email')
  @ApiOperation({ summary: 'Enviar cotización por email al cliente' })
  sendByEmail(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.quotationsService.sendByEmail(tenantId, id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprobar cotización' })
  approve(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.quotationsService.approve(tenantId, id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar cotización' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateQuotationDto,
  ) {
    return this.quotationsService.update(tenantId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar estado de cotización' })
  updateStatus(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.quotationsService.updateStatus(tenantId, id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cotización' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.quotationsService.remove(tenantId, id);
  }
}

import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Exports')
@ApiBearerAuth()
@Controller('exports')
export class ExportsController {
  constructor(private exportsService: ExportsService) {}

  @Get('sales/excel')
  @ApiOperation({ summary: 'Exportar ventas a Excel' })
  async exportSales(
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.exportsService.exportSales(tenantId, from, to);
    const filename = `ventas-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${filename}"` });
    res.end(buffer);
  }

  @Get('clients/excel')
  @ApiOperation({ summary: 'Exportar clientes a Excel' })
  async exportClients(@CurrentUser('tenantId') tenantId: string, @Res() res?: Response) {
    const buffer = await this.exportsService.exportClients(tenantId);
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="clientes.xlsx"' });
    res.end(buffer);
  }

  @Get('inventory/excel')
  @ApiOperation({ summary: 'Exportar inventario a Excel' })
  async exportInventory(@CurrentUser('tenantId') tenantId: string, @Res() res?: Response) {
    const buffer = await this.exportsService.exportInventory(tenantId);
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="inventario.xlsx"' });
    res.end(buffer);
  }

  @Get('quotations/excel')
  @ApiOperation({ summary: 'Exportar cotizaciones a Excel' })
  async exportQuotations(@CurrentUser('tenantId') tenantId: string, @Res() res?: Response) {
    const buffer = await this.exportsService.exportQuotations(tenantId);
    const filename = `cotizaciones-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${filename}"` });
    res.end(buffer);
  }

  @Get('sales/pdf')
  @ApiOperation({ summary: 'Exportar ventas a PDF' })
  async exportSalesPDF(
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.exportsService.exportSalesPDF(tenantId, from, to);
    const filename = `ventas-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` });
    res.end(buffer);
  }

  @Get('clients/pdf')
  @ApiOperation({ summary: 'Exportar clientes a PDF' })
  async exportClientsPDF(@CurrentUser('tenantId') tenantId: string, @Res() res?: Response) {
    const buffer = await this.exportsService.exportClientsPDF(tenantId);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="clientes.pdf"' });
    res.end(buffer);
  }

  @Get('inventory/pdf')
  @ApiOperation({ summary: 'Exportar inventario a PDF' })
  async exportInventoryPDF(@CurrentUser('tenantId') tenantId: string, @Res() res?: Response) {
    const buffer = await this.exportsService.exportInventoryPDF(tenantId);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="inventario.pdf"' });
    res.end(buffer);
  }

  @Get('quotations/pdf')
  @ApiOperation({ summary: 'Exportar cotizaciones a PDF' })
  async exportQuotationsPDF(@CurrentUser('tenantId') tenantId: string, @Res() res?: Response) {
    const buffer = await this.exportsService.exportQuotationsPDF(tenantId);
    const filename = `cotizaciones-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` });
    res.end(buffer);
  }
}

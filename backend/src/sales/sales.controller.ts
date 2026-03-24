import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ventas' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query('search') search?: string) {
    return this.salesService.findAll(tenantId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener venta' })
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.salesService.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar venta' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSaleDto,
  ) {
    return this.salesService.create(tenantId, userId, dto);
  }

  @Patch(':id/payment-status')
  @ApiOperation({ summary: 'Actualizar estado de pago' })
  updatePaymentStatus(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: string,
  ) {
    return this.salesService.updatePaymentStatus(tenantId, id, paymentStatus);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Anular venta' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.salesService.remove(tenantId, id);
  }
}

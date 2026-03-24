import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, AdjustStockDto } from './dto/create-product.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.productsService.findAll(tenantId, search, category);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Obtener categorías disponibles' })
  getCategories(@CurrentUser('tenantId') tenantId: string) {
    return this.productsService.getCategories(tenantId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Productos con stock crítico' })
  getLowStock(@CurrentUser('tenantId') tenantId: string) {
    return this.productsService.findLowStock(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto con movimientos de stock' })
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.productsService.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear producto' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(tenantId, id, dto);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Ajustar stock manualmente' })
  adjustStock(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.productsService.adjustStock(tenantId, id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar producto (soft delete)' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.productsService.remove(tenantId, id);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs del dashboard' })
  getKPIs(
    @CurrentUser('tenantId') tenantId: string,
    @Query('period') period: 'month' | 'quarter' | 'year' = 'month',
  ) {
    return this.analyticsService.getKPIs(tenantId, period);
  }

  @Get('sales-chart')
  @ApiOperation({ summary: 'Datos para gráfica de ventas por mes' })
  getSalesChart(
    @CurrentUser('tenantId') tenantId: string,
    @Query('months') months: number = 6,
  ) {
    return this.analyticsService.getSalesChart(tenantId, months);
  }

  @Get('top-clients')
  @ApiOperation({ summary: 'Top clientes por facturación' })
  getTopClients(@CurrentUser('tenantId') tenantId: string) {
    return this.analyticsService.getTopClients(tenantId);
  }
}

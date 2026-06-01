import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Accounting')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingController {
  constructor(private accountingService: AccountingService) {}

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicializar plan de cuentas IFRS Chile' })
  seed(@CurrentUser('tenantId') tenantId: string) {
    return this.accountingService.seedChartOfAccounts(tenantId);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Obtener plan de cuentas' })
  getAccounts(@CurrentUser('tenantId') tenantId: string) {
    return this.accountingService.getAccounts(tenantId);
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Libro Diario (General Ledger)' })
  getLedger(
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.accountingService.getGeneralLedger(tenantId, from, to);
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Balance General' })
  getBalanceSheet(@CurrentUser('tenantId') tenantId: string) {
    return this.accountingService.getBalanceSheet(tenantId);
  }

  @Get('income-statement')
  @ApiOperation({ summary: 'Estado de Resultados (P&L)' })
  getIncomeStatement(
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.accountingService.getIncomeStatement(tenantId, from, to);
  }

  @Get('ar-aging')
  @ApiOperation({ summary: 'Cartera vencida — AR Aging Report' })
  getARAgingReport(@CurrentUser('tenantId') tenantId: string) {
    return this.accountingService.getARAgingReport(tenantId);
  }

  @Post('journal-entries')
  @ApiOperation({ summary: 'Crear asiento contable manual' })
  createEntry(@CurrentUser('tenantId') tenantId: string, @Body() dto: any) {
    return this.accountingService.createManualEntry(tenantId, dto);
  }
}

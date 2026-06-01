import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('next-action/:clientId')
  @ApiOperation({ summary: 'Siguiente mejor acción para un deal' })
  getNextAction(
    @CurrentUser('tenantId') tenantId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.aiService.getNextBestAction(tenantId, clientId);
  }

  @Get('credit-risk/:clientId')
  @ApiOperation({ summary: 'Score de riesgo crediticio del cliente' })
  getCreditRisk(
    @CurrentUser('tenantId') tenantId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.aiService.getCreditRiskScore(tenantId, clientId);
  }

  @Post('report/narrative')
  @ApiOperation({ summary: 'Generar reporte narrativo con IA' })
  getNarrative(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { type?: string; period?: string },
  ) {
    return this.aiService.generateNarrativeReport(tenantId, body.type ?? 'sales', body.period ?? 'month');
  }
}

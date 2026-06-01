import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('CRM')
@ApiBearerAuth()
@Controller('crm')
export class CrmController {
  constructor(private crmService: CrmService) {}

  @Get('pipeline')
  @ApiOperation({ summary: 'Vista kanban de pipeline con forecast' })
  getPipeline(@CurrentUser('tenantId') tenantId: string) {
    return this.crmService.getPipelineView(tenantId);
  }

  @Get('scores')
  @ApiOperation({ summary: 'Clientes con deal scores' })
  getScores(@CurrentUser('tenantId') tenantId: string) {
    return this.crmService.getClientsByScore(tenantId);
  }

  @Post('scores/recalculate')
  @ApiOperation({ summary: 'Recalcular todos los deal scores' })
  recalculate(@CurrentUser('tenantId') tenantId: string) {
    return this.crmService.updateAllScores(tenantId);
  }

  @Patch('clients/:id/status')
  @ApiOperation({ summary: 'Mover cliente a nueva etapa del pipeline' })
  updateStatus(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') clientId: string,
    @Body('status') status: string,
  ) {
    return this.crmService.updateClientStatus(tenantId, clientId, status);
  }
}

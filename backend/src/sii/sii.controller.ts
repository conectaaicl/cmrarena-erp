import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { SIIService } from './sii.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('SII Chile')
@ApiBearerAuth()
@Controller('sii')
export class SIIController {
  constructor(private siiService: SIIService) {}

  @Get('config')
  @ApiOperation({ summary: 'Obtener configuración SII del tenant' })
  getConfig(@CurrentUser('tenantId') tenantId: string) {
    return this.siiService.getConfig(tenantId);
  }

  @Patch('config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar configuración SII' })
  updateConfig(@CurrentUser('tenantId') tenantId: string, @Body() body: any) {
    return this.siiService.updateConfig(tenantId, body);
  }

  @Post('certificate')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('certificate'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cargar certificado digital PFX' })
  uploadCertificate(
    @CurrentUser('tenantId') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('password') password: string,
  ) {
    return this.siiService.uploadCertificate(tenantId, file.buffer, password);
  }

  @Get('dtes')
  @ApiOperation({ summary: 'Listar DTEs' })
  getDTEs(@CurrentUser('tenantId') tenantId: string, @Query('search') search?: string) {
    return this.siiService.getDTEs(tenantId, search);
  }

  @Post('dtes/emit')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Emitir DTE (Boleta o Factura)' })
  emitDTE(
    @CurrentUser('tenantId') tenantId: string,
    @Body('saleId') saleId: string,
    @Body('type') type: 'BOLETA_ELECTRONICA' | 'FACTURA_ELECTRONICA',
  ) {
    return this.siiService.emitDTE(tenantId, saleId, type);
  }

  @Post('dtes/:id/retry')
  @ApiOperation({ summary: 'Reintentar DTE rechazado' })
  retryDTE(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.siiService.retryDTE(tenantId, id);
  }
}

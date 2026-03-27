import {
  Controller, Get, Post, Delete, Body, Query, Res, Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { SeoService } from './seo.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('SEO')
@ApiBearerAuth()
@Controller('seo')
export class SeoController {
  constructor(private seoService: SeoService) {}

  @Get('config')
  @ApiOperation({ summary: 'Obtener configuración SEO del tenant' })
  getConfig(@CurrentUser('tenantId') tenantId: string) {
    return this.seoService.getConfig(tenantId);
  }

  @Post('config/site')
  @ApiOperation({ summary: 'Configurar URL del sitio' })
  setSiteUrl(
    @CurrentUser('tenantId') tenantId: string,
    @Body('siteUrl') siteUrl: string,
  ) {
    return this.seoService.setSiteUrl(tenantId, siteUrl);
  }

  @Get('auth-url')
  @ApiOperation({ summary: 'Obtener URL de autorización Google OAuth' })
  getAuthUrl(@CurrentUser('tenantId') tenantId: string) {
    const url = this.seoService.getAuthUrl(tenantId);
    return { url };
  }

  @Get('callback')
  @Public()
  @ApiOperation({ summary: 'Callback OAuth Google (redirige al frontend)' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      await this.seoService.handleCallback(code, state);
      return res.redirect('https://suite.conectaai.cl/seo?connected=1');
    } catch {
      return res.redirect('https://suite.conectaai.cl/seo?error=1');
    }
  }

  @Delete('disconnect')
  @ApiOperation({ summary: 'Desconectar Google Search Console' })
  disconnect(@CurrentUser('tenantId') tenantId: string) {
    return this.seoService.disconnect(tenantId);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sincronizar datos desde Google Search Console' })
  sync(@CurrentUser('tenantId') tenantId: string) {
    return this.seoService.sync(tenantId);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Resumen general SEO (clicks, impresiones, posición)' })
  getOverview(@CurrentUser('tenantId') tenantId: string) {
    return this.seoService.getOverview(tenantId);
  }

  @Get('keywords')
  @ApiOperation({ summary: 'Listado de keywords con métricas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getKeywords(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.seoService.getKeywords(tenantId, +page, +limit);
  }

  @Get('quick-wins')
  @ApiOperation({ summary: 'Keywords en posición 11-20 con alto potencial (Quick Wins)' })
  getQuickWins(@CurrentUser('tenantId') tenantId: string) {
    return this.seoService.getQuickWins(tenantId);
  }

  @Get('value')
  @ApiOperation({ summary: 'Calculadora de valor del tráfico orgánico vs Google Ads' })
  getValueCalculator(@CurrentUser('tenantId') tenantId: string) {
    return this.seoService.getValueCalculator(tenantId);
  }
}

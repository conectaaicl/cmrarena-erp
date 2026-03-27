import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface GoogleToken {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
}

@Injectable()
export class SeoService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.clientId = this.config.get('GOOGLE_CLIENT_ID', '');
    this.clientSecret = this.config.get('GOOGLE_CLIENT_SECRET', '');
    this.redirectUri = this.config.get(
      'GOOGLE_REDIRECT_URI',
      'https://suite.conectaai.cl/api/v1/seo/callback',
    );
  }

  // ── CONFIG ──────────────────────────────────────────────────────

  async getConfig(tenantId: string) {
    const site = await this.prisma.seoSite.findUnique({ where: { tenantId } });
    return {
      connected: !!site?.googleToken,
      siteUrl: site?.siteUrl ?? null,
      lastSync: site?.lastSync ?? null,
      googleConfigured: !!(this.clientId && this.clientSecret),
    };
  }

  async setSiteUrl(tenantId: string, siteUrl: string) {
    return this.prisma.seoSite.upsert({
      where: { tenantId },
      create: { tenantId, siteUrl },
      update: { siteUrl },
    });
  }

  // ── GOOGLE OAUTH ────────────────────────────────────────────────

  getAuthUrl(tenantId: string): string {
    if (!this.clientId) throw new BadRequestException('Google Client ID no configurado');
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      access_type: 'offline',
      prompt: 'consent',
      state: tenantId,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(code: string, state: string) {
    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException('Google credentials no configuradas');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new BadRequestException(`Error de OAuth: ${err}`);
    }

    const tokenData = await tokenRes.json() as any;
    const token: GoogleToken = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: Date.now() + tokenData.expires_in * 1000,
      token_type: tokenData.token_type,
    };

    await this.prisma.seoSite.upsert({
      where: { tenantId: state },
      create: { tenantId: state, siteUrl: '', googleToken: token as any },
      update: { googleToken: token as any },
    });

    return { success: true };
  }

  async disconnect(tenantId: string) {
    await this.prisma.seoSite.update({
      where: { tenantId },
      data: { googleToken: null },
    });
    return { success: true };
  }

  // ── TOKEN REFRESH ────────────────────────────────────────────────

  private async getValidToken(tenantId: string): Promise<string> {
    const site = await this.prisma.seoSite.findUnique({ where: { tenantId } });
    if (!site?.googleToken) throw new BadRequestException('Search Console no conectado');

    const token = site.googleToken as unknown as GoogleToken;

    // Refresh if expiring within 5 min
    if (token.expiry_date - Date.now() < 300_000) {
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: token.refresh_token,
          grant_type: 'refresh_token',
        }).toString(),
      });

      if (!refreshRes.ok) throw new BadRequestException('Error al refrescar token Google');

      const newToken = await refreshRes.json() as any;
      const updated: GoogleToken = {
        ...token,
        access_token: newToken.access_token,
        expiry_date: Date.now() + newToken.expires_in * 1000,
      };

      await this.prisma.seoSite.update({
        where: { tenantId },
        data: { googleToken: updated as any },
      });

      return updated.access_token;
    }

    return token.access_token;
  }

  // ── SYNC FROM GOOGLE ─────────────────────────────────────────────

  async sync(tenantId: string) {
    const site = await this.prisma.seoSite.findUnique({ where: { tenantId } });
    if (!site) throw new NotFoundException('Sitio SEO no configurado');
    if (!site.googleToken) throw new BadRequestException('Search Console no conectado');
    if (!site.siteUrl) throw new BadRequestException('URL del sitio no configurada');

    const accessToken = await this.getValidToken(tenantId);

    // Last 28 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);
    const dateRange = `${startDate.toISOString().slice(0, 10)}_${endDate.toISOString().slice(0, 10)}`;

    const body = {
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      dimensions: ['query'],
      rowLimit: 500,
      startRow: 0,
    };

    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`Error Search Console API: ${err}`);
    }

    const data = await res.json() as any;
    const rows: any[] = data.rows ?? [];

    // Upsert all keywords
    for (const row of rows) {
      await this.prisma.seoKeyword.upsert({
        where: { siteId_query_dateRange: { siteId: site.id, query: row.keys[0], dateRange } },
        create: {
          siteId: site.id,
          query: row.keys[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
          dateRange,
        },
        update: {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        },
      });
    }

    await this.prisma.seoSite.update({
      where: { tenantId },
      data: { lastSync: new Date() },
    });

    return { synced: rows.length, dateRange };
  }

  // ── ANALYTICS ENDPOINTS ──────────────────────────────────────────

  async getOverview(tenantId: string) {
    const site = await this.prisma.seoSite.findUnique({ where: { tenantId } });
    if (!site) return null;

    const latest = await this.getLatestDateRange(site.id);
    if (!latest) return { clicks: 0, impressions: 0, ctr: 0, position: 0, keywords: 0 };

    const agg = await this.prisma.seoKeyword.aggregate({
      where: { siteId: site.id, dateRange: latest },
      _sum: { clicks: true, impressions: true },
      _avg: { ctr: true, position: true },
      _count: { id: true },
    });

    return {
      clicks: agg._sum.clicks ?? 0,
      impressions: agg._sum.impressions ?? 0,
      ctr: Number((agg._avg.ctr ?? 0).toFixed(4)),
      position: Number((agg._avg.position ?? 0).toFixed(1)),
      keywords: agg._count.id,
      dateRange: latest,
      lastSync: site.lastSync,
    };
  }

  async getKeywords(tenantId: string, page = 1, limit = 50) {
    const site = await this.prisma.seoSite.findUnique({ where: { tenantId } });
    if (!site) return { data: [], total: 0 };

    const latest = await this.getLatestDateRange(site.id);
    if (!latest) return { data: [], total: 0 };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.seoKeyword.findMany({
        where: { siteId: site.id, dateRange: latest },
        orderBy: { clicks: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.seoKeyword.count({ where: { siteId: site.id, dateRange: latest } }),
    ]);

    return { data, total, page, limit };
  }

  async getQuickWins(tenantId: string) {
    const site = await this.prisma.seoSite.findUnique({ where: { tenantId } });
    if (!site) return [];

    const latest = await this.getLatestDateRange(site.id);
    if (!latest) return [];

    // Keywords in position 11-20 with >100 impressions = Quick Wins
    return this.prisma.seoKeyword.findMany({
      where: {
        siteId: site.id,
        dateRange: latest,
        position: { gte: 11, lte: 20 },
        impressions: { gte: 100 },
      },
      orderBy: { impressions: 'desc' },
      take: 20,
    });
  }

  async getValueCalculator(tenantId: string) {
    const overview = await this.getOverview(tenantId);
    if (!overview) return null;

    // Average CPC for blind/curtain industry in Chile: ~$300 CLP
    // Formula: clicks × avg_cpc = saved monthly spend on ads
    const avgCpcClp = 300;
    const savedMonthly = (overview.clicks ?? 0) * avgCpcClp;
    const savedYearly = savedMonthly * 12;

    return {
      clicks: overview.clicks,
      ctr: overview.ctr,
      estimatedCpcClp: avgCpcClp,
      savedMonthlyClp: savedMonthly,
      savedYearlyClp: savedYearly,
      message:
        savedMonthly > 0
          ? `Tu tráfico orgánico equivale a ~$${savedMonthly.toLocaleString('es-CL')} CLP/mes en Google Ads`
          : 'Conecta Search Console para calcular el valor de tu tráfico orgánico',
    };
  }

  private async getLatestDateRange(siteId: string): Promise<string | null> {
    const row = await this.prisma.seoKeyword.findFirst({
      where: { siteId },
      orderBy: { createdAt: 'desc' },
      select: { dateRange: true },
    });
    return row?.dateRange ?? null;
  }
}

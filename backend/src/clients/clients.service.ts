import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/create-client.dto';
import { cleanRut, formatRut, validateRut } from '../common/utils/rut.util';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateClientDto) {
    if (!validateRut(dto.rut)) {
      throw new BadRequestException('RUT inválido');
    }
    const rutClean = cleanRut(dto.rut);
    const rut = formatRut(dto.rut);

    return this.prisma.client.create({
      data: { ...dto, tenantId, rut, rutClean },
    });
  }

  async findAll(tenantId: string, search?: string) {
    return this.prisma.client.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { rut: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        _count: { select: { quotations: true, sales: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        quotations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: { include: { product: true } } },
        },
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        dtes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(tenantId, id);
    const data: any = { ...dto };
    if (dto.rut) {
      if (!validateRut(dto.rut)) throw new BadRequestException('RUT inválido');
      data.rut = formatRut(dto.rut);
      data.rutClean = cleanRut(dto.rut);
    }
    return this.prisma.client.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getTimeline(tenantId: string, clientId: string) {
    await this.findOne(tenantId, clientId);
    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId, entityId: clientId },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return logs;
  }

  async checkSeo(tenantId: string, id: string) {
    const client = await this.findOne(tenantId, id);

    if (!client.website) {
      return {
        hasWebsite: false,
        message: 'El cliente no tiene sitio web registrado',
      };
    }

    let url = client.website.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const result: any = {
      hasWebsite: true,
      url,
      checkedAt: new Date().toISOString(),
      reachable: false,
      httpStatus: null,
      indexable: false,
      robotsTxt: { found: false, allowsGooglebot: true, raw: null },
      metaRobots: { found: false, noindex: false, raw: null },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'CmrArena-SEO-Checker/1.0 (compatible; Googlebot/2.1)' },
      });
      clearTimeout(timeout);

      result.reachable = true;
      result.httpStatus = res.status;

      const html = await res.text();

      // Parse meta robots
      const metaMatch =
        html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']robots["'][^>]*>/i);

      if (metaMatch) {
        result.metaRobots.found = true;
        result.metaRobots.raw = metaMatch[1];
        result.metaRobots.noindex = /noindex/i.test(metaMatch[1]);
      }

      const xRobotsTag = res.headers.get('x-robots-tag');
      if (xRobotsTag) {
        result.xRobotsTag = xRobotsTag;
        if (/noindex/i.test(xRobotsTag)) result.metaRobots.noindex = true;
      }
    } catch (err: any) {
      clearTimeout(timeout);
      result.reachable = false;
      result.error = err.name === 'AbortError' ? 'Timeout (10s)' : err.message;
    }

    // Check robots.txt
    try {
      const domain = new URL(url).origin;
      const rbController = new AbortController();
      const rbTimeout = setTimeout(() => rbController.abort(), 5000);

      const robotsRes = await fetch(`${domain}/robots.txt`, {
        signal: rbController.signal,
        headers: { 'User-Agent': 'CmrArena-SEO-Checker/1.0' },
      });
      clearTimeout(rbTimeout);

      if (robotsRes.ok) {
        const robotsTxtContent = await robotsRes.text();
        result.robotsTxt.found = true;
        result.robotsTxt.raw = robotsTxtContent.substring(0, 500);

        const lines = robotsTxtContent.split('\n').map((l) => l.trim());
        let currentAgent = '';
        let googlebotBlocked = false;
        let allBlocked = false;

        for (const line of lines) {
          if (line.toLowerCase().startsWith('user-agent:')) {
            currentAgent = line.split(':')[1].trim().toLowerCase();
          } else if (line.toLowerCase().startsWith('disallow:')) {
            const path = line.split(':').slice(1).join(':').trim();
            if (path === '/') {
              if (currentAgent === 'googlebot') googlebotBlocked = true;
              if (currentAgent === '*') allBlocked = true;
            }
          }
        }

        result.robotsTxt.allowsGooglebot = !googlebotBlocked && !allBlocked;
      }
    } catch {
      // robots.txt no disponible — asumir permitido
    }

    result.indexable =
      result.reachable &&
      result.httpStatus === 200 &&
      !result.metaRobots.noindex &&
      result.robotsTxt.allowsGooglebot;

    return result;
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { XmlBuilderService } from './xml-builder.service';
import { XmlSignerService } from './xml-signer.service';
import { SIIClientService } from './sii-client.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

@Injectable()
export class SIIService {
  constructor(
    private prisma: PrismaService,
    private xmlBuilder: XmlBuilderService,
    private xmlSigner: XmlSignerService,
    private siiClient: SIIClientService,
    private notifications: NotificationsService,
  ) {}

  async getConfig(tenantId: string) {
    let config = await this.prisma.sIIConfig.findUnique({
      where: { tenantId },
      include: { cafs: { orderBy: { createdAt: 'desc' } } },
    });
    if (!config) throw new NotFoundException('Configuración SII no encontrada');
    // Don't expose encrypted cert password
    const { certPasswordEnc, ...safe } = config as any;
    return safe;
  }

  async updateConfig(tenantId: string, data: any) {
    return this.prisma.sIIConfig.upsert({
      where: { tenantId },
      create: { tenantId, ...data },
      update: data,
    });
  }

  async uploadCertificate(tenantId: string, pfxBuffer: Buffer, password: string) {
    const certInfo = this.xmlSigner.getCertInfo(pfxBuffer, password);
    const encryptedPassword = this.encrypt(password);

    // Store cert file info (in production, store to MinIO)
    await this.prisma.sIIConfig.update({
      where: { tenantId },
      data: {
        certPasswordEnc: encryptedPassword,
        certExpiresAt: certInfo.expiresAt,
        isConfigured: true,
      },
    });

    return {
      subject: certInfo.subject,
      expiresAt: certInfo.expiresAt,
      message: 'Certificado cargado correctamente',
    };
  }

  async emitDTE(tenantId: string, saleId: string, dteType: 'BOLETA_ELECTRONICA' | 'FACTURA_ELECTRONICA') {
    const siiConfig = await this.prisma.sIIConfig.findUnique({ where: { tenantId } });
    if (!siiConfig) throw new NotFoundException('Configure el SII primero');

    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: { client: true, items: { include: { product: true } } },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    // Assign folio atomically
    const folio = await this.prisma.$transaction(async (tx) => {
      const config = await tx.sIIConfig.findUnique({ where: { tenantId } });
      const newFolio = dteType === 'BOLETA_ELECTRONICA'
        ? config.lastBoletaFolio + 1
        : config.lastFacturaFolio + 1;

      await tx.sIIConfig.update({
        where: { tenantId },
        data: dteType === 'BOLETA_ELECTRONICA'
          ? { lastBoletaFolio: newFolio }
          : { lastFacturaFolio: newFolio },
      });

      return newFolio;
    });

    const tipoSII = dteType === 'BOLETA_ELECTRONICA' ? 39 : 33;
    const montoNeto = Number(sale.subtotal);
    const montoIVA = Number(sale.taxAmount);
    const montoTotal = Number(sale.total);

    // Build XML
    const xmlContent = this.xmlBuilder.buildDTE({
      tipo: tipoSII,
      folio,
      fechaEmision: new Date(),
      emisor: {
        rut: siiConfig.rutEmpresa,
        razonSocial: siiConfig.razonSocial || tenant.name,
        giro: siiConfig.giroComercial || 'COMERCIO',
        direccion: siiConfig.direccion || 'Santiago',
        comuna: siiConfig.comuna || 'Santiago',
      },
      receptor: {
        rut: sale.client.rut,
        razonSocial: sale.client.name,
        direccion: sale.client.address,
        comuna: sale.client.commune,
        email: sale.client.email,
      },
      items: sale.items.map((item, i) => ({
        nroLinDet: i + 1,
        nombre: item.description || item.product.name,
        cantidad: Number(item.quantity),
        unidad: item.product.unit || 'un.',
        precioUnitario: Number(item.unitPrice),
        montoItem: Number(item.subtotal),
      })),
      montoNeto,
      montoIVA,
      montoTotal,
      tasaIVA: Number(sale.taxRate),
      resolucionNumero: siiConfig.resolutionNumber,
    });

    // Generate XML (sign when cert is ready — envío al SII pendiente de trámite)
    let signedXml = xmlContent;
    // NOTE: Firma y envío al SII deshabilitados — pendiente tramitar folios CAF y certificado en producción
    // Cuando esté listo: signedXml = await this.xmlSigner.signXml(xmlContent, certBuffer, password);
    //                    siiClient.uploadDTE(signedXml, ...)

    // Save DTE record as PENDIENTE (no envío aún)
    const dte = await this.prisma.dTE.create({
      data: {
        tenantId,
        saleId,
        clientId: sale.clientId,
        type: dteType,
        folio,
        amount: montoTotal,
        taxAmount: montoIVA,
        netAmount: montoNeto,
        status: 'PENDIENTE',
        trackId: null,
        xmlContent: signedXml,
      },
    });

    return dte;
  }

  async getPendingSales(tenantId: string) {
    // Sales that don't have any non-cancelled DTE yet
    const salesWithDTE = await this.prisma.dTE.findMany({
      where: { tenantId, deletedAt: null, status: { not: 'ANULADO' } },
      select: { saleId: true },
    });
    const salesWithDTEIds = [...new Set(salesWithDTE.map(d => d.saleId))];

    return this.prisma.sale.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(salesWithDTEIds.length > 0 && { id: { notIn: salesWithDTEIds } }),
      },
      include: { client: { select: { name: true, rut: true } } },
      orderBy: { date: 'desc' },
      take: 50,
    });
  }

  async uploadCAF(tenantId: string, xmlContent: string) {
    // Parse CAF XML to extract folio range and type
    const tipoMatch = xmlContent.match(/<TD>(\d+)<\/TD>/);
    const desdeMatch = xmlContent.match(/<RNG>\s*<D>(\d+)<\/D>/);
    const hastaMatch = xmlContent.match(/<RNG>.*?<H>(\d+)<\/H>/s);
    const fechaMatch = xmlContent.match(/<FA>([\d-]+)<\/FA>/);

    if (!tipoMatch || !desdeMatch || !hastaMatch) {
      throw new BadRequestException('Archivo CAF inválido: no se pudo parsear el rango de folios');
    }

    const tipoSII = parseInt(tipoMatch[1]);
    const fromFolio = parseInt(desdeMatch[1]);
    const toFolio = parseInt(hastaMatch[1]);
    const issuedAt = fechaMatch ? new Date(fechaMatch[1]) : new Date();

    // Map SII tipo to DTEType enum
    const dteTypeMap: Record<number, string> = {
      33: 'FACTURA_ELECTRONICA',
      39: 'BOLETA_ELECTRONICA',
      61: 'NOTA_DE_CREDITO',
      56: 'NOTA_DE_DEBITO',
    };
    const dteType = dteTypeMap[tipoSII];
    if (!dteType) throw new BadRequestException(`Tipo de DTE ${tipoSII} no soportado`);

    const siiConfig = await this.prisma.sIIConfig.findUnique({ where: { tenantId } });
    if (!siiConfig) throw new NotFoundException('Configure el SII primero');

    const caf = await this.prisma.cAF.create({
      data: {
        siiConfigId: siiConfig.id,
        dteType: dteType as any,
        fromFolio,
        toFolio,
        currentFolio: fromFolio,
        xmlContent,
        issuedAt,
      },
    });

    return { ...caf, foliosDisponibles: toFolio - fromFolio + 1 };
  }

  async getCAFs(tenantId: string) {
    const siiConfig = await this.prisma.sIIConfig.findUnique({
      where: { tenantId },
      include: { cafs: { orderBy: { createdAt: 'desc' } } },
    });
    if (!siiConfig) return [];
    return siiConfig.cafs.map(c => ({
      ...c,
      foliosDisponibles: c.toFolio - c.currentFolio + 1,
      foliosTotal: c.toFolio - c.fromFolio + 1,
      porcentajeUsado: Math.round(((c.currentFolio - c.fromFolio) / (c.toFolio - c.fromFolio + 1)) * 100),
    }));
  }

  async getDTEs(tenantId: string, search?: string) {
    return this.prisma.dTE.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(search && {
          OR: [
            { client: { name: { contains: search, mode: 'insensitive' } } },
            { trackId: { contains: search } },
          ],
        }),
      },
      include: {
        client: { select: { name: true, rut: true } },
        sale: { select: { number: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async retryDTE(tenantId: string, dteId: string) {
    const dte = await this.prisma.dTE.findFirst({ where: { id: dteId, tenantId } });
    if (!dte) throw new NotFoundException('DTE no encontrado');
    if (dte.status !== 'RECHAZADO_SII') {
      throw new BadRequestException('Solo se pueden reintentar DTEs rechazados');
    }

    const siiConfig = await this.prisma.sIIConfig.findUnique({ where: { tenantId } });
    const { trackId, status } = await this.siiClient.uploadDTE(
      dte.xmlContent,
      siiConfig.rutEmpresa,
      siiConfig.environment,
    );

    return this.prisma.dTE.update({
      where: { id: dteId },
      data: {
        trackId,
        status: status as any,
        retryCount: { increment: 1 },
      },
    });
  }

  // Cron: poll pending DTEs every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async pollPendingDTEs() {
    const pending = await this.prisma.dTE.findMany({
      where: { status: 'ENVIADO_SII', retryCount: { lt: 10 } },
      include: { tenant: { include: { siiConfig: true } } },
    });

    for (const dte of pending) {
      if (!dte.tenant.siiConfig) continue;
      try {
        const newStatus = await this.siiClient.queryStatus(
          dte.trackId,
          dte.tenant.siiConfig.rutEmpresa,
          dte.tenant.siiConfig.environment,
        );

        if (newStatus !== dte.status) {
          await this.prisma.dTE.update({
            where: { id: dte.id },
            data: { status: newStatus as any },
          });

          if (newStatus === 'RECHAZADO_SII') {
            await this.notifications.create(dte.tenantId, {
              type: 'DTE_RECHAZADO',
              title: 'DTE Rechazado por SII',
              body: `DTE Folio ${dte.folio} fue rechazado. Verifique y reintente.`,
              link: '/sii',
              payload: { dteId: dte.id },
            });
          }
        }
      } catch {}
    }
  }

  private encrypt(text: string): string {
    const key = process.env.SII_CERT_ENCRYPTION_KEY?.substring(0, 32) || '00000000000000000000000000000000';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(text: string): string {
    const key = process.env.SII_CERT_ENCRYPTION_KEY?.substring(0, 32) || '00000000000000000000000000000000';
    const [ivHex, encHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}

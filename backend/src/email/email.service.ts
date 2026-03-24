import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('MAIL_HOST', 'mail.conectaai.cl'),
      port: parseInt(config.get('MAIL_PORT', '587')),
      secure: config.get('MAIL_SECURE', 'false') === 'true',
      auth: {
        user: config.get('MAIL_USER'),
        pass: config.get('MAIL_PASS'),
      },
      tls: { rejectUnauthorized: false },
    });
  }

  private get from() {
    const name = this.config.get('MAIL_FROM_NAME', 'CmrArena ERP');
    const addr = this.config.get('MAIL_FROM', 'noreply@conectaai.cl');
    return `"${name}" <${addr}>`;
  }

  async sendQuotationEmail(params: {
    to: string;
    clientName: string;
    quotationNumber: number;
    total: number;
    companyName: string;
    validUntil?: Date;
  }) {
    const subject = `Cotización N°${String(params.quotationNumber).padStart(4, '0')} - ${params.companyName}`;
    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
.header { background: #0f172a; color: white; padding: 20px; text-align: center; }
.content { padding: 20px; }
.total { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
.total-amount { font-size: 28px; font-weight: bold; color: #0f172a; }
.btn { display: inline-block; background: #0f172a; color: white; padding: 12px 24px;
       text-decoration: none; border-radius: 6px; margin-top: 10px; }
.footer { font-size: 12px; color: #666; text-align: center; padding: 20px; }
</style></head>
<body>
<div class="header"><h2>${params.companyName}</h2></div>
<div class="content">
  <p>Estimado/a <strong>${params.clientName}</strong>,</p>
  <p>Le enviamos su cotización <strong>N°${String(params.quotationNumber).padStart(4, '0')}</strong>.</p>
  <div class="total">
    <div>Monto Total</div>
    <div class="total-amount">$${Math.round(params.total).toLocaleString('es-CL')}</div>
    ${params.validUntil ? `<div style="font-size:12px;margin-top:5px;">Válida hasta: ${new Date(params.validUntil).toLocaleDateString('es-CL')}</div>` : ''}
  </div>
  <p>Para aprobar esta cotización o solicitar modificaciones, por favor contáctenos.</p>
</div>
<div class="footer">Este email fue enviado por ${params.companyName} a través de CmrArena ERP</div>
</body></html>`;

    await this.send({ to: params.to, subject, html });
  }

  async sendWelcomeEmail(params: { to: string; firstName: string; tenantName: string; tempPassword: string }) {
    const subject = `Bienvenido a ${params.tenantName} - CmrArena ERP`;
    const html = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
.header { background: #0f172a; color: white; padding: 20px; text-align: center; }
.content { padding: 20px; }
.credentials { background: #f1f5f9; padding: 15px; border-radius: 8px; font-family: monospace; }
</style></head><body>
<div class="header"><h2>CmrArena ERP</h2></div>
<div class="content">
  <p>Hola <strong>${params.firstName}</strong>, ¡bienvenido/a a <strong>${params.tenantName}</strong>!</p>
  <p>Tu cuenta ha sido creada. Tus credenciales de acceso son:</p>
  <div class="credentials">
    <p>Usuario: <strong>${params.to}</strong></p>
    <p>Contraseña temporal: <strong>${params.tempPassword}</strong></p>
  </div>
  <p style="color:#dc2626"><strong>Importante:</strong> Cambia tu contraseña en el primer inicio de sesión.</p>
</div></body></html>`;

    await this.send({ to: params.to, subject, html });
  }

  async sendLowStockAlert(params: { to: string; products: Array<{ name: string; stock: number; minStock: number }> }) {
    const subject = `Alerta: Productos con stock crítico`;
    const rows = params.products.map(
      (p) => `<tr><td>${p.name}</td><td style="color:red">${p.stock}</td><td>${p.minStock}</td></tr>`,
    ).join('');
    const html = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif">
<h2 style="color:#dc2626">Alerta de Stock Crítico</h2>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%">
  <tr style="background:#f1f5f9"><th>Producto</th><th>Stock Actual</th><th>Stock Mínimo</th></tr>
  ${rows}
</table>
<p>Ingresa al sistema para realizar ajustes de inventario.</p>
</body></html>`;

    await this.send({ to: params.to, subject, html });
  }

  private async send(options: { to: string; subject: string; html: string; attachments?: any[] }) {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        ...options,
      });
      this.logger.log(`Email enviado: ${info.messageId} → ${options.to}`);
      return info;
    } catch (err) {
      this.logger.error(`Error enviando email a ${options.to}: ${err.message}`);
      throw err;
    }
  }
}

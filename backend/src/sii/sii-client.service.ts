import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

export type SIIEnvType = 'CERTIFICACION' | 'PRODUCCION';

@Injectable()
export class SIIClientService {
  private readonly logger = new Logger(SIIClientService.name);

  private readonly endpoints = {
    CERTIFICACION: {
      upload: 'https://maullin.sii.cl/cgi_dte/UPL/DTEUpload',
      queryStatus: 'https://maullin.sii.cl/cgi_dte/DTEWS/QueryEstDteAvanzadoService.jws',
      token: 'https://maullin.sii.cl/cgi_dte/UPL/dte2',
    },
    PRODUCCION: {
      upload: 'https://palena.sii.cl/cgi_dte/UPL/DTEUpload',
      queryStatus: 'https://palena.sii.cl/cgi_dte/DTEWS/QueryEstDteAvanzadoService.jws',
      token: 'https://palena.sii.cl/cgi_dte/UPL/dte2',
    },
  };

  constructor(private config: ConfigService) {}

  /**
   * Envía el DTE firmado al SII y retorna el trackId
   */
  async uploadDTE(signedXml: string, rutEmisor: string, env: SIIEnvType): Promise<{ trackId: string; status: string }> {
    if (this.config.get('SII_MOCK_MODE') === 'true' || env === 'CERTIFICACION') {
      // En modo mock/certificación simulamos la respuesta para desarrollo
      this.logger.log(`[SII MOCK] Enviando DTE de ${rutEmisor} a ${env}`);
      return {
        trackId: `TRK-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        status: 'ENVIADO_SII',
      };
    }

    // Producción: envío real
    try {
      const boundary = `---DTE-${Date.now()}`;
      const body = this.buildMultipartBody(signedXml, rutEmisor, boundary);
      const response = await this.postToSII(this.endpoints[env].upload, body, boundary);
      return this.parseUploadResponse(response);
    } catch (err) {
      this.logger.error('Error enviando DTE al SII', err);
      throw err;
    }
  }

  /**
   * Consulta el estado de un DTE enviado por su trackId
   */
  async queryStatus(trackId: string, rutEmisor: string, env: SIIEnvType): Promise<string> {
    if (this.config.get('SII_MOCK_MODE') === 'true') {
      // Simula aceptación después de 1-2 consultas
      return 'ACEPTADO_SII';
    }

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <m:getEstDte xmlns:m="http://DefaultNamespace">
      <rutConsulta>${rutEmisor}</rutConsulta>
      <dvConsulta>${rutEmisor.split('-')[1]}</dvConsulta>
      <trackId>${trackId}</trackId>
    </m:getEstDte>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.postSOAP(this.endpoints[env].queryStatus, soapBody);
      return this.parseStatusResponse(response);
    } catch {
      return 'ENVIADO_SII'; // Keep as enviado if can't query
    }
  }

  private buildMultipartBody(xml: string, rutEmisor: string, boundary: string): string {
    return [
      `--${boundary}`,
      'Content-Disposition: form-data; name="rutSender"',
      '',
      rutEmisor,
      `--${boundary}`,
      'Content-Disposition: form-data; name="archivo"; filename="dte.xml"',
      'Content-Type: text/xml',
      '',
      xml,
      `--${boundary}--`,
    ].join('\r\n');
  }

  private postToSII(url: string, body: string, boundary: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(body),
        },
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private postSOAP(url: string, body: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '""',
          'Content-Length': Buffer.byteLength(body),
        },
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private parseUploadResponse(xml: string): { trackId: string; status: string } {
    const trackMatch = xml.match(/<TRACKID>(\d+)<\/TRACKID>/);
    const statusMatch = xml.match(/<STATUS>(\d+)<\/STATUS>/);
    return {
      trackId: trackMatch?.[1] || 'UNKNOWN',
      status: statusMatch?.[1] === '0' ? 'ENVIADO_SII' : 'RECHAZADO_SII',
    };
  }

  private parseStatusResponse(xml: string): string {
    if (xml.includes('DOK')) return 'ACEPTADO_SII';
    if (xml.includes('RCH')) return 'RECHAZADO_SII';
    return 'ENVIADO_SII';
  }
}

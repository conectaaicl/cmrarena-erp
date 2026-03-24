import { Injectable } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import { format } from 'date-fns';

@Injectable()
export class XmlBuilderService {
  /**
   * Construye el XML del DTE según esquema SII Chile
   * Soporta Tipo 33 (Factura) y Tipo 39 (Boleta)
   */
  buildDTE(params: {
    tipo: number; // 33=Factura, 39=Boleta, 61=NCred, 56=NDebito
    folio: number;
    fechaEmision: Date;
    emisor: {
      rut: string;
      razonSocial: string;
      giro: string;
      direccion: string;
      comuna: string;
    };
    receptor: {
      rut: string;
      razonSocial: string;
      giro?: string;
      direccion?: string;
      comuna?: string;
      email?: string;
    };
    items: Array<{
      nroLinDet: number;
      nombre: string;
      cantidad: number;
      unidad: string;
      precioUnitario: number;
      montoItem: number;
    }>;
    montoNeto: number;
    montoIVA: number;
    montoTotal: number;
    tasaIVA: number;
    resolucionNumero?: string;
    resolucionFecha?: string;
  }): string {
    const fechaStr = format(params.fechaEmision, 'yyyy-MM-dd');
    const isBoleta = params.tipo === 39;

    const doc = create({ version: '1.0', encoding: 'ISO-8859-1' })
      .ele('DTE', { xmlns: 'http://www.sii.cl/SiiDte', version: '1.0' })
        .ele('Documento', { ID: `DTE-${params.tipo}-${params.folio}` })
          .ele('Encabezado')
            .ele('IdDoc')
              .ele('TipoDTE').txt(String(params.tipo)).up()
              .ele('Folio').txt(String(params.folio)).up()
              .ele('FchEmis').txt(fechaStr).up()
              .ele('IndServicio').txt('3').up() // 3=Boleta servicios
              .ele('MntBruto').txt('1').up()
              .ele('FmaPago').txt('1').up()
            .up()
            .ele('Emisor')
              .ele('RUTEmisor').txt(params.emisor.rut).up()
              .ele('RznSoc').txt(params.emisor.razonSocial).up()
              .ele('GiroEmis').txt(params.emisor.giro).up()
              .ele('DirOrigen').txt(params.emisor.direccion).up()
              .ele('CmnaOrigen').txt(params.emisor.comuna).up()
              .ele('Acteco').txt('620000').up() // Código actividad económica
            .up()
            .ele('Receptor')
              .ele('RUTRecep').txt(params.receptor.rut).up()
              .ele('RznSocRecep').txt(params.receptor.razonSocial).up()
              .ele('GiroRecep').txt(params.receptor.giro || 'PARTICULAR').up()
              .ele('DirRecep').txt(params.receptor.direccion || '').up()
              .ele('CmnaRecep').txt(params.receptor.comuna || '').up()
            .up()
            .ele('Totales')
              .ele('MntNeto').txt(String(params.montoNeto)).up()
              .ele('TasaIVA').txt(String(params.tasaIVA)).up()
              .ele('IVA').txt(String(params.montoIVA)).up()
              .ele('MntTotal').txt(String(params.montoTotal)).up()
            .up()
          .up();

    // Detalles (items)
    const documentoNode = doc.root().first().first();
    const detalle = documentoNode.ele('Detalle');
    for (const item of params.items) {
      detalle
        .ele('NroLinDet').txt(String(item.nroLinDet)).up()
        .ele('NmbItem').txt(item.nombre).up()
        .ele('QtyItem').txt(String(item.cantidad)).up()
        .ele('UnmdItem').txt(item.unidad).up()
        .ele('PrcItem').txt(String(item.precioUnitario)).up()
        .ele('MontoItem').txt(String(item.montoItem)).up();
    }

    return doc.end({ prettyPrint: false });
  }
}

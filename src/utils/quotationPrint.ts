export interface QuotationPrintData {
  number: number;
  date: string;
  client: {
    name: string; rut?: string; email?: string;
    phone?: string; address?: string; city?: string;
  };
  items: Array<{
    name: string; sku?: string; quantity: number;
    unitPrice: number; subtotal: number;
    width?: number; height?: number;
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  notes?: string;
  installationCost?: number;
  companyName?: string;
  companyTagline?: string;
  logoUrl?: string;
  whatsapp?: string;
  companyEmail?: string;
  bankHolder?: string;
  bankName?: string;
  bankAccountType?: string;
  bankRut?: string;
  bankAccount?: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString('es-CL');
const p2 = (n: number) => String(n).padStart(2, '0');

export function printQuotation(data: QuotationPrintData) {
  const d = new Date(data.date);
  const cotNum = String(data.number).padStart(4, '0');
  const cn = data.companyName || 'TERRABLINDS SPA';
  const ct = data.companyTagline || 'Fabricación de Cortinas Roller a Medida, Toldos, Persianas Interiores y Exteriores<br>Cierres de Terraza, Domótica y Control de Acceso';
  const wa = data.whatsapp || '+56 9 4115 0949';
  const em = data.companyEmail || 'terrablinds@gmail.com';
  const inst = data.installationCost ?? 0;
  const totalF = data.total + inst;

  // Datos bancarios por defecto TerraBlinds
  const bHolder = data.bankHolder ?? 'HECTOR DURAN CASTELLANOS';
  const bType   = data.bankAccountType ?? 'CORRIENTE';
  const bBank   = data.bankName ?? 'FALLABELLA';
  const bRut    = data.bankRut ?? '25.881.340-5';
  const bAcct   = data.bankAccount ?? '019840874200';

  const rows = [...data.items];
  while (rows.length < 10) rows.push(null as any);
  const rowsHtml = rows.map(it => !it
    ? '<tr><td></td><td></td><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>'
    : `<tr><td class="c">${it.quantity}</td><td class="c">${it.sku||''}</td><td><b>${it.name}</b></td><td class="c">${it.width??''}</td><td class="c">${it.height??''}</td><td class="r">${it.unitPrice>0?fmt(it.unitPrice):''}</td><td class="r b">${fmt(it.subtotal)}</td></tr>`
  ).join('');

  const logoSrc = data.logoUrl
    ? (data.logoUrl.startsWith('http') ? data.logoUrl : `${window.location.origin}${data.logoUrl}`)
    : '';
  const logo = logoSrc
    ? `<img src="${logoSrc}" style="max-height:50px;max-width:130px;object-fit:contain">`
    : `<span style="font-size:17px;font-weight:900;color:#1d4ed8">${cn}</span>`;

  const bank = `
    <tr><td colspan="2" class="sh">DATOS PARA REALIZAR LA TRANSFERENCIA</td></tr>
    <tr><td colspan="2" style="padding:8px 12px;font-size:10.5px;line-height:1.8;font-style:italic">
      NOMBRE: <b>${bHolder}</b><br>
      TIPO DE CUENTA: ${bType}<br>
      BANCO: ${bBank}<br>
      RUT: ${bRut}<br>
      NÚMERO DE CUENTA: ${bAcct}<br>
      CORREO: <b>${em}</b>
    </td></tr>`;

  const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#000}.page{width:210mm;margin:0 auto;padding:8mm 10mm}.hdr{display:grid;grid-template-columns:148px 1fr 148px;border:1.5px solid #000}.hl{padding:8px;display:flex;align-items:center;justify-content:center;border-right:1px solid #ccc;min-height:58px}.hc{padding:8px 12px;text-align:center}.cn{font-size:13px;font-weight:900}.ct{font-size:9.5px;color:#444;margin-top:3px}.ttl{background:#e0e0e0;text-align:center;font-size:13px;font-weight:900;padding:5px;border:1.5px solid #000;border-top:none;letter-spacing:1px}.cs{display:grid;grid-template-columns:1fr 153px;border:1.5px solid #000;border-top:none}.cr{display:flex;border-bottom:1px solid #eee;min-height:18px}.cr:last-child{border-bottom:none}.lbl{font-weight:900;font-style:italic;font-size:10px;min-width:68px;padding:3px 6px;border-right:1px solid #eee;display:flex;align-items:center}.val{padding:3px 8px;font-size:10px;display:flex;align-items:center;flex:1}.ds{display:flex;flex-direction:column;border-left:1px solid #ccc}.dh-row{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid #ccc}.dh{text-align:center;font-size:9px;font-weight:900;font-style:italic;padding:2px;border-right:1px solid #ccc}.dh:last-child{border-right:none}.dv{text-align:center;font-size:11px;padding:3px 2px;border-right:1px solid #ccc}.dv:last-child{border-right:none}.vl{font-weight:900;font-style:italic;font-size:10px;text-align:center;padding:4px}table.it{width:100%;border-collapse:collapse;border:1.5px solid #000;border-top:none;font-size:10px}table.it th{background:#e0e0e0;border:1px solid #ccc;padding:4px 5px;text-align:center;font-size:9px;font-weight:900}table.it td{border:1px solid #ebebeb;padding:3px 5px;vertical-align:middle;height:17px}.c{text-align:center}.r{text-align:right}.b{font-weight:700}table.ft{width:100%;border-collapse:collapse;border:1.5px solid #000;border-top:none;font-size:10px}table.ft td{border:1px solid #ccc;padding:4px 6px;vertical-align:top}.sh{background:#c8e6c9;font-weight:900;font-size:11px;text-align:center;padding:5px;letter-spacing:.5px}.sho{background:#ffe0b2;font-weight:900;font-size:11px;text-align:center;padding:5px}.tot{background:#f5f5f5;font-weight:600;font-size:11px}.totf{background:#1d4ed8;color:#fff;font-weight:900;font-size:13px}.pb{display:inline-block;border-radius:3px;padding:2px 8px;font-size:9.5px;font-weight:700;margin:2px}@media print{body{background:#fff}.page{padding:5mm 7mm}@page{size:A4 portrait;margin:5mm}button{display:none!important}}`;

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Cotización N°${cotNum}</title><style>${css}</style></head><body>
<div class="page">
<div style="text-align:right;margin-bottom:6px"><button onclick="window.print()" style="background:#1d4ed8;color:#fff;border:none;border-radius:5px;padding:6px 18px;font-size:12px;cursor:pointer;font-weight:600">⬇ Descargar / Imprimir PDF</button></div>
<div class="hdr">
  <div class="hl">${logo}</div>
  <div class="hc"><div class="cn">${cn}</div><div class="ct">${ct}</div></div>
  <div class="hl" style="border-left:1px solid #ccc;border-right:none">${logo}</div>
</div>
<div class="ttl">COTIZACIÓN N° ${cotNum}</div>
<div class="cs">
  <div>
    <div class="cr"><div class="lbl">NOMBRE:</div><div class="val">${data.client.name}</div></div>
    <div class="cr"><div class="lbl">DIRECCIÓN:</div><div class="val">${data.client.address||''}</div></div>
    <div class="cr"><div class="lbl">CORREO:</div><div class="val">${data.client.email||''}</div></div>
    <div class="cr"><div class="lbl">TELÉFONO:</div><div class="val">${data.client.phone||''}</div></div>
    <div class="cr"><div class="lbl">COMUNA:</div><div class="val">${data.client.city||''}</div></div>
    ${data.client.rut?`<div class="cr"><div class="lbl">RUT:</div><div class="val">${data.client.rut}</div></div>`:''}
  </div>
  <div class="ds">
    <div class="dh-row" style="background:#e0e0e0;font-weight:900;font-style:italic;font-size:10px;text-align:right;padding:3px 6px;border-bottom:1px solid #ccc;grid-template-columns:1fr">
      <div style="text-align:right;padding:3px 6px">FECHA COTIZACIÓN</div>
    </div>
    <div class="dh-row"><div class="dh">DÍA</div><div class="dh">MES</div><div class="dh">AÑO</div></div>
    <div class="dh-row"><div class="dv">${p2(d.getDate())}</div><div class="dv">${p2(d.getMonth()+1)}</div><div class="dv">${d.getFullYear()}</div></div>
    <div class="vl">VÁLIDO POR 7 DÍAS</div>
  </div>
</div>
<table class="it">
  <thead><tr>
    <th style="width:40px">CANTIDAD</th><th style="width:56px">COD</th><th>PRODUCTO</th>
    <th style="width:40px">(ANCHO)</th><th style="width:40px">MEDIDAS<br>(ALTO)</th>
    <th style="width:86px">VALOR UNITARIO<br>(M2)</th><th style="width:76px">TOTAL</th>
  </tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>
<table class="ft">
  <tr>
    <td style="width:55%">
      <div style="font-weight:700;text-align:center;margin-bottom:4px">Métodos de Pago</div>
      <div style="text-align:center">
        <span class="pb" style="background:#f5f5f5;border:1px solid #bbb;color:#333">Efectivo</span>
        <span class="pb" style="background:#e3f2fd;border:1px solid #90caf9;color:#1565c0">Transferencia</span>
        <span class="pb" style="background:#e8f5e9;border:1px solid #a5d6a7;color:#2e7d32">Tarjeta Débito</span>
        <span class="pb" style="background:#e8f5e9;border:1px solid #a5d6a7;color:#2e7d32">Tarjeta Crédito</span>
      </div>
    </td>
    <td style="width:45%;padding:0">
      <table style="width:100%;border-collapse:collapse">
        <tr><td class="tot" style="padding:4px 10px">SUB-TOTAL</td><td class="tot r" style="padding:4px 10px">${fmt(data.subtotal)}</td></tr>
        ${data.taxRate>0?`<tr><td class="tot" style="padding:4px 10px">IVA (${data.taxRate}%)</td><td class="tot r" style="padding:4px 10px">${fmt(data.tax)}</td></tr>`:''}
        ${inst>0?`<tr><td class="tot" style="padding:4px 10px">Instalación</td><td class="tot r" style="padding:4px 10px">${fmt(inst)}</td></tr>`:''}
        <tr><td class="totf" style="padding:6px 10px">TOTAL</td><td class="totf r" style="padding:6px 10px">${fmt(totalF)}</td></tr>
      </table>
    </td>
  </tr>
  <tr><td colspan="2" class="sh">TÉRMINOS Y CONDICIONES GENERALES</td></tr>
  <tr><td colspan="2" style="padding:8px 12px;font-size:10px;line-height:1.8">
    1.- Garantía de 3 años en Mecanismos y Cadenas.<br>
    2.- Los valores de esta cotización pueden variar una vez rectificadas las medidas en terreno.<br>
    3.- Contamos con todo método de pago: efectivo, transferencia, tarjeta de débito y crédito.<br>
    4.- Los productos son fabricados a medida; una vez confeccionados no se realiza devolución del dinero.<br>
    5.- La instalación es gratis en la Región Metropolitana. Otras regiones consultar costo de traslado.
    ${data.notes?`<br><br><b>Observaciones:</b> ${data.notes}`:''}
  </td></tr>
  <tr><td colspan="2" class="sho">CONDICIONES DE PAGO</td></tr>
  <tr><td colspan="2" style="padding:8px 12px;font-size:10px;line-height:1.8">50% de adelanto para iniciar la confeccion de las cortinas.<br>50% el dia de la instalacion.</td></tr>
  ${bank}
  <tr><td colspan="2" style="text-align:center;padding:10px;background:#f9f9f9">
    <div style="font-weight:900;font-size:11px;margin-bottom:3px">¿Quedaste con dudas?</div>
    <div style="font-size:10px;font-style:italic">Escribenos a nuestros WhatsApp indicandonos tu nombre y apellido y te brindaremos asistencia.</div>
    <div style="font-size:15px;font-weight:900;margin-top:3px">${wa}</div>
    <div style="font-size:10px;color:#555;margin-top:2px">CORREO: ${em}</div>
  </td></tr>
</table>
</div></body></html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Activa ventanas emergentes para generar el PDF.'); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.focus(), 200);
}

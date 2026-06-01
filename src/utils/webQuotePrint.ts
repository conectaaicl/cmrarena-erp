export interface WebQuotePrintData {
  number: number;
  date: string;
  currency: 'USD' | 'CLP';
  client: {
    name: string;
    email?: string;
    phone?: string;
    city?: string;
    rut?: string;
  };
  items: Array<{
    code: string;
    name: string;
    desc?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  validUntil?: string;
  logoUrl?: string;
  companyName?: string;
  companyTagline?: string;
  companyEmail?: string;
  companyWebsite?: string;
  whatsapp?: string;
}

const p2 = (n: number) => String(n).padStart(2, '0');

export function printWebQuotation(data: WebQuotePrintData) {
  const d = new Date(data.date);
  const cotNum = String(data.number).padStart(4, '0');
  const cn = data.companyName || 'ConectaAI';
  const ct = data.companyTagline || 'Diseño Web · Hosting & VPS · Dominios · Automatización & Chatbots';
  const wa = data.whatsapp || '';
  const em = data.companyEmail || 'admin@conectaai.cl';
  const web = data.companyWebsite || 'conectaai.cl';
  const sym = data.currency === 'USD' ? 'USD $' : 'CLP $';

  const fmt = (n: number) =>
    data.currency === 'USD'
      ? n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : Math.round(n).toLocaleString('es-CL');

  const logoSrc = data.logoUrl
    ? (data.logoUrl.startsWith('http') ? data.logoUrl : `${window.location.origin}${data.logoUrl}`)
    : '';

  const logo = logoSrc
    ? `<img src="${logoSrc}" style="max-height:54px;max-width:140px;object-fit:contain" onerror="this.style.display='none'">`
    : `<span style="font-size:18px;font-weight:900;color:#1d4ed8">${cn}</span>`;

  const rows = [...data.items];
  while (rows.length < 8) rows.push(null as any);

  const rowsHtml = rows.map(it => !it
    ? `<tr><td></td><td>&nbsp;<br><span style="font-size:9px;color:#ccc">&nbsp;</span></td><td class="c"></td><td class="r"></td><td class="r"></td></tr>`
    : `<tr>
        <td class="c" style="font-size:9px;color:#666">${it.code}</td>
        <td><b>${it.name}</b>${it.desc ? `<br><span style="font-size:9px;color:#888">${it.desc}</span>` : ''}</td>
        <td class="c">${it.quantity}</td>
        <td class="r">${sym} ${fmt(it.unitPrice)}</td>
        <td class="r b">${sym} ${fmt(it.subtotal)}</td>
      </tr>`
  ).join('');

  const validStr = data.validUntil
    ? 'VÁLIDO HASTA ' + new Date(data.validUntil).toLocaleDateString('es-CL')
    : 'VÁLIDO POR 15 DÍAS';

  const css = `
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:11px;color:#000;background:#e5e7eb}
    .page{width:794px;margin:20px auto;padding:30px 38px;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.15)}
    .hdr{display:grid;grid-template-columns:160px 1fr 160px;border:1.5px solid #000}
    .hl{padding:10px;display:flex;align-items:center;justify-content:center;border-right:1px solid #ccc;min-height:64px}
    .hc{padding:8px 12px;text-align:center}
    .cn{font-size:15px;font-weight:900;color:#1d4ed8;letter-spacing:.5px}
    .ct{font-size:9.5px;color:#555;margin-top:4px;line-height:1.5}
    .ttl{background:#1d4ed8;color:#fff;text-align:center;font-size:14px;font-weight:900;padding:6px;border:1.5px solid #000;border-top:none;letter-spacing:1.5px}
    .cs{display:grid;grid-template-columns:1fr 165px;border:1.5px solid #000;border-top:none}
    .cr{display:flex;border-bottom:1px solid #eee;min-height:19px}.cr:last-child{border-bottom:none}
    .lbl{font-weight:900;font-style:italic;font-size:10px;min-width:72px;padding:3px 6px;border-right:1px solid #eee;display:flex;align-items:center;background:#f9f9f9}
    .val{padding:3px 8px;font-size:10px;display:flex;align-items:center;flex:1}
    .ds{display:flex;flex-direction:column;border-left:1px solid #ccc}
    .dh-row{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid #ccc}
    .dh{text-align:center;font-size:9px;font-weight:900;font-style:italic;padding:2px;border-right:1px solid #ccc}.dh:last-child{border-right:none}
    .dv{text-align:center;font-size:12px;padding:3px 2px;border-right:1px solid #ccc}.dv:last-child{border-right:none}
    .vl{font-weight:900;font-style:italic;font-size:10px;text-align:center;padding:4px;color:#1d4ed8}
    table.it{width:100%;border-collapse:collapse;border:1.5px solid #000;border-top:none;font-size:10px}
    table.it th{background:#e8edf8;border:1px solid #ccc;padding:5px 6px;text-align:center;font-size:9px;font-weight:900;color:#1d4ed8}
    table.it td{border:1px solid #ebebeb;padding:4px 6px;vertical-align:middle;height:22px}
    .c{text-align:center}.r{text-align:right}.b{font-weight:700}
    table.ft{width:100%;border-collapse:collapse;border:1.5px solid #000;border-top:none;font-size:10px}
    table.ft td{border:1px solid #ccc;padding:4px 6px;vertical-align:top}
    .sh{background:#dbeafe;color:#1d4ed8;font-weight:900;font-size:11px;text-align:center;padding:5px;letter-spacing:.5px}
    .sho{background:#fef9c3;font-weight:900;font-size:11px;text-align:center;padding:5px}
    .tot{background:#f5f7ff;font-weight:600;font-size:11px}
    .totf{background:#1d4ed8;color:#fff;font-weight:900;font-size:13px}
    .pb{display:inline-block;border-radius:3px;padding:2px 8px;font-size:9.5px;font-weight:700;margin:2px}
    .badge{display:inline-block;background:#dbeafe;color:#1d4ed8;font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;margin-bottom:6px;letter-spacing:.5px}
    @media print{body{background:#fff}.page{box-shadow:none;margin:0;padding:10mm 12mm}@page{size:A4 portrait;margin:5mm}button{display:none!important}}
  `;

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Cotización ConectaAI N°${cotNum}</title><style>${css}</style></head><body>
<div class="page">
<div style="text-align:right;margin-bottom:8px">
  <button onclick="window.print()" style="background:#1d4ed8;color:#fff;border:none;border-radius:5px;padding:7px 20px;font-size:12px;cursor:pointer;font-weight:700">⬇ Descargar / Imprimir PDF</button>
</div>

<div class="hdr">
  <div class="hl">${logo}</div>
  <div class="hc">
    <div class="badge">SERVICIOS DIGITALES</div>
    <div class="cn">${cn.toUpperCase()}</div>
    <div class="ct">${ct}</div>
    <div style="margin-top:4px;font-size:9px;color:#888">${web} · ${em}</div>
  </div>
  <div class="hl" style="border-left:1px solid #ccc;border-right:none">${logo}</div>
</div>

<div class="ttl">COTIZACIÓN N° ${cotNum}</div>

<div class="cs">
  <div>
    <div class="cr"><div class="lbl">NOMBRE:</div><div class="val"><b>${data.client.name}</b></div></div>
    <div class="cr"><div class="lbl">CORREO:</div><div class="val">${data.client.email || ''}</div></div>
    <div class="cr"><div class="lbl">TELÉFONO:</div><div class="val">${data.client.phone || ''}</div></div>
    <div class="cr"><div class="lbl">CIUDAD:</div><div class="val">${data.client.city || ''}</div></div>
    ${data.client.rut ? `<div class="cr"><div class="lbl">RUT/RUC:</div><div class="val">${data.client.rut}</div></div>` : ''}
  </div>
  <div class="ds">
    <div style="background:#e8edf8;font-weight:900;font-style:italic;font-size:10px;text-align:center;padding:3px 6px;border-bottom:1px solid #ccc;color:#1d4ed8">FECHA COTIZACIÓN</div>
    <div class="dh-row"><div class="dh">DÍA</div><div class="dh">MES</div><div class="dh">AÑO</div></div>
    <div class="dh-row"><div class="dv">${p2(d.getDate())}</div><div class="dv">${p2(d.getMonth()+1)}</div><div class="dv">${d.getFullYear()}</div></div>
    <div class="vl">${validStr}</div>
  </div>
</div>

<table class="it">
  <thead><tr>
    <th style="width:56px">CÓDIGO</th>
    <th>SERVICIO / DESCRIPCIÓN</th>
    <th style="width:44px">CANT.</th>
    <th style="width:110px">PRECIO UNITARIO</th>
    <th style="width:110px">TOTAL</th>
  </tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>

<table class="ft">
  <tr>
    <td style="width:55%">
      <div style="font-weight:700;text-align:center;margin-bottom:6px">Métodos de Pago</div>
      <div style="text-align:center">
        <span class="pb" style="background:#e3f2fd;border:1px solid #90caf9;color:#1565c0">Transferencia Bancaria</span>
        <span class="pb" style="background:#e8f5e9;border:1px solid #a5d6a7;color:#2e7d32">PayPal</span>
        <span class="pb" style="background:#f3e8ff;border:1px solid #c084fc;color:#7e22ce">Tarjeta (Stripe)</span>
        <span class="pb" style="background:#f5f5f5;border:1px solid #bbb;color:#333">Efectivo</span>
      </div>
      ${data.notes ? `<div style="margin-top:10px;padding:8px;background:#f9f9f9;border-radius:4px;font-size:10px;color:#555"><b>Observaciones:</b> ${data.notes}</div>` : ''}
    </td>
    <td style="width:45%;padding:0">
      <table style="width:100%;border-collapse:collapse">
        <tr><td class="tot" style="padding:5px 12px">SUBTOTAL (${sym})</td><td class="tot r" style="padding:5px 12px">${fmt(data.subtotal)}</td></tr>
        ${data.taxRate > 0 ? `<tr><td class="tot" style="padding:5px 12px">IVA/Imp. (${data.taxRate}%)</td><td class="tot r" style="padding:5px 12px">${fmt(data.taxAmount)}</td></tr>` : ''}
        <tr><td class="totf" style="padding:8px 12px">TOTAL (${sym})</td><td class="totf r" style="padding:8px 12px;font-size:15px">${fmt(data.total)}</td></tr>
      </table>
    </td>
  </tr>
  <tr><td colspan="2" class="sh">TÉRMINOS Y CONDICIONES</td></tr>
  <tr><td colspan="2" style="padding:8px 12px;font-size:10px;line-height:1.8">
    1.- Esta cotización tiene validez por el período indicado; pasada dicha fecha los precios pueden variar.<br>
    2.- El servicio de diseño web incluye hasta 2 rondas de revisiones. Cambios adicionales se cotizan por separado.<br>
    3.- El hosting/VPS requiere pago anticipado para activación. La renovación anual se notifica con 30 días de anticipación.<br>
    4.- El dominio queda registrado a nombre del cliente y es de su propiedad.<br>
    5.- Los proyectos inician dentro de los 5 días hábiles de recibido el anticipo.
  </td></tr>
  <tr><td colspan="2" class="sho">CONDICIONES DE PAGO</td></tr>
  <tr><td colspan="2" style="padding:8px 12px;font-size:10px;line-height:1.8">
    50% de anticipo para iniciar el proyecto.<br>
    50% restante contra entrega y aprobación del cliente.
  </td></tr>
  <tr><td colspan="2" style="text-align:center;padding:12px;background:#f0f7ff">
    <div style="font-weight:900;font-size:12px;color:#1d4ed8;margin-bottom:4px">¿Tienes preguntas sobre esta propuesta?</div>
    <div style="font-size:10px;color:#555;font-style:italic">Escríbenos por WhatsApp o correo y con gusto te asesoramos.</div>
    ${wa ? `<div style="font-size:16px;font-weight:900;margin-top:4px;color:#1d4ed8">${wa}</div>` : ''}
    <div style="font-size:10px;color:#888;margin-top:2px">${em} · ${web}</div>
  </td></tr>
</table>
</div></body></html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

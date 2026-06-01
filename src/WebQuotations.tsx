import { useState } from 'react';
import { Plus, Printer, Trash2, Globe, X } from 'lucide-react';
import { printWebQuotation } from './utils/webQuotePrint';

const LOGO_URL = '/logo-conectaai.png';
const COMPANY_NAME = 'ConectaAI';
const COMPANY_TAGLINE = 'Diseño Web · Hosting & VPS · Dominios · Automatización & Chatbots';
const COMPANY_EMAIL = 'admin@conectaai.cl';
const COMPANY_WEBSITE = 'conectaai.cl';
const COMPANY_WHATSAPP = '+56 9 XXXX XXXX';

const PRESETS = [
  { code: 'WEB-BAS', name: 'Diseño Web Básico', desc: '5 páginas, diseño responsive, formulario contacto, dominio y hosting no incluidos', price: 250 },
  { code: 'WEB-PRO', name: 'Diseño Web Profesional', desc: 'Hasta 10 páginas, diseño responsive, SEO básico, formulario, integración WhatsApp', price: 450 },
  { code: 'WEB-ECO', name: 'Tienda E-commerce', desc: 'Catálogo de productos, carrito de compras, pagos en línea, gestión de pedidos', price: 850 },
  { code: 'VPS-1Y',  name: 'Hosting VPS (1 año)', desc: 'Servidor privado virtual, SSL incluido, backups diarios, soporte técnico', price: 120 },
  { code: 'VPS-2Y',  name: 'Hosting VPS (2 años)', desc: 'Servidor privado virtual, SSL incluido, backups diarios, soporte técnico', price: 200 },
  { code: 'DOM-COM', name: 'Dominio .com (1 año)', desc: 'Registro de dominio .com por 1 año, renovable', price: 15 },
  { code: 'DOM-CL',  name: 'Dominio .cl (1 año)', desc: 'Registro de dominio .cl por 1 año, renovable', price: 20 },
  { code: 'AUT-BAS', name: 'Automatización Básica', desc: 'Flujos n8n, integración WhatsApp, notificaciones automáticas (hasta 3 flujos)', price: 200 },
  { code: 'BOT-WA',  name: 'Chatbot WhatsApp', desc: 'Bot conversacional con IA, respuestas automáticas, catálogo, derivación a humano', price: 350 },
  { code: 'MNT-MES', name: 'Mantenimiento Mensual', desc: 'Actualizaciones, copias de seguridad, soporte técnico, cambios menores', price: 80 },
];

type Item = {
  id: number;
  code: string;
  name: string;
  desc: string;
  qty: number;
  price: number;
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#cdd9e5', outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#6e7681', marginBottom: 4 };
const cardStyle: React.CSSProperties = { background: '#161b22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 };

export default function WebQuotations() {
  const [items, setItems] = useState<Item[]>([]);
  const [nextId, setNextId] = useState(1);
  const [currency, setCurrency] = useState<'USD' | 'CLP'>('USD');
  const [showPresets, setShowPresets] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [quoteNum, setQuoteNum] = useState(1);
  const [tax, setTax] = useState(0);

  // Client data
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientRut, setClientRut] = useState('');
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState(15);

  // Custom item form
  const [cusCode, setCusCode] = useState('');
  const [cusName, setCusName] = useState('');
  const [cusDesc, setCusDesc] = useState('');
  const [cusQty, setCusQty] = useState(1);
  const [cusPrice, setCusPrice] = useState('');

  const fmt = (n: number) =>
    currency === 'USD'
      ? '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : '$' + Math.round(n).toLocaleString('es-CL');

  const addPreset = (p: typeof PRESETS[0]) => {
    setItems(prev => [...prev, { id: nextId, code: p.code, name: p.name, desc: p.desc, qty: 1, price: p.price }]);
    setNextId(n => n + 1);
  };

  const addCustom = () => {
    if (!cusName || !cusPrice) return;
    setItems(prev => [...prev, { id: nextId, code: cusCode || 'SVC', name: cusName, desc: cusDesc, qty: cusQty, price: parseFloat(cusPrice) }]);
    setNextId(n => n + 1);
    setCusCode(''); setCusName(''); setCusDesc(''); setCusQty(1); setCusPrice('');
    setShowCustom(false);
  };

  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));
  const updateQty = (id: number, qty: number) => setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  const updatePrice = (id: number, price: number) => setItems(prev => prev.map(i => i.id === id ? { ...i, price } : i));

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const taxAmt = Math.round(subtotal * tax / 100);
  const total = subtotal + taxAmt;

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);

  const handlePrint = () => {
    if (!clientName) { alert('Ingresa el nombre del cliente'); return; }
    if (items.length === 0) { alert('Agrega al menos un servicio'); return; }
    printWebQuotation({
      number: quoteNum,
      date: new Date().toISOString(),
      currency,
      client: { name: clientName, email: clientEmail, phone: clientPhone, city: clientCity, rut: clientRut },
      items: items.map(i => ({ code: i.code, name: i.name, desc: i.desc, quantity: i.qty, unitPrice: i.price, subtotal: i.qty * i.price })),
      subtotal,
      taxRate: tax,
      taxAmount: taxAmt,
      total,
      notes,
      validUntil: validUntil.toISOString(),
      logoUrl: LOGO_URL,
      companyName: COMPANY_NAME,
      companyTagline: COMPANY_TAGLINE,
      companyEmail: COMPANY_EMAIL,
      companyWebsite: COMPANY_WEBSITE,
      whatsapp: COMPANY_WHATSAPP,
    });
    setQuoteNum(n => n + 1);
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(29,78,216,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Globe size={20} color="#60a5fa" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#cdd9e5' }}>Cotizador Web — ConectaAI</h1>
          <p style={{ fontSize: 13, color: '#6e7681' }}>Genera cotizaciones de servicios web, hosting y automatización</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6e7681' }}>Cotización N°</span>
          <input
            type="number" value={quoteNum} onChange={e => setQuoteNum(Number(e.target.value))}
            style={{ ...inputStyle, width: 70, textAlign: 'center' }}
          />
          <select value={currency} onChange={e => setCurrency(e.target.value as 'USD' | 'CLP')}
            style={{ ...inputStyle, width: 80 }}>
            <option value="USD">USD $</option>
            <option value="CLP">CLP $</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Left: Services + Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Service items table */}
          <div style={cardStyle}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#cdd9e5' }}>Servicios cotizados</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowPresets(true); setShowCustom(false); }}
                  style={{ background: 'rgba(29,78,216,0.15)', border: '1px solid rgba(29,78,216,0.3)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#60a5fa', cursor: 'pointer', fontWeight: 600 }}>
                  + Desde catálogo
                </button>
                <button onClick={() => { setShowCustom(true); setShowPresets(false); }}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#8b949e', cursor: 'pointer', fontWeight: 600 }}>
                  + Personalizado
                </button>
              </div>
            </div>

            {/* Preset picker */}
            {showPresets && (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5' }}>Selecciona servicios</span>
                  <button onClick={() => setShowPresets(false)} style={{ background: 'none', border: 'none', color: '#6e7681', cursor: 'pointer' }}><X size={16} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {PRESETS.map(p => (
                    <button key={p.code} onClick={() => addPreset(p)}
                      style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px', textAlign: 'left', cursor: 'pointer', transition: '.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(29,78,216,0.5)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#cdd9e5' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#6e7681', marginTop: 2 }}>{currency === 'USD' ? '$' + p.price : '$' + Math.round(p.price * 950).toLocaleString('es-CL')}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom item form */}
            {showCustom && (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5' }}>Servicio personalizado</span>
                  <button onClick={() => setShowCustom(false)} style={{ background: 'none', border: 'none', color: '#6e7681', cursor: 'pointer' }}><X size={16} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px 100px', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={labelStyle}>Código</label>
                    <input style={inputStyle} value={cusCode} onChange={e => setCusCode(e.target.value)} placeholder="SVC-01" />
                  </div>
                  <div>
                    <label style={labelStyle}>Servicio *</label>
                    <input style={inputStyle} value={cusName} onChange={e => setCusName(e.target.value)} placeholder="Nombre del servicio" />
                  </div>
                  <div>
                    <label style={labelStyle}>Cant.</label>
                    <input style={inputStyle} type="number" min={1} value={cusQty} onChange={e => setCusQty(Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Precio ({currency})</label>
                    <input style={inputStyle} type="number" step="0.01" value={cusPrice} onChange={e => setCusPrice(e.target.value)} placeholder="0.00" />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Descripción</label>
                  <input style={inputStyle} value={cusDesc} onChange={e => setCusDesc(e.target.value)} placeholder="Detalle del servicio..." />
                </div>
                <button onClick={addCustom}
                  style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Agregar
                </button>
              </div>
            )}

            {/* Items list */}
            {items.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#484f58' }}>
                <Globe size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                <div style={{ fontSize: 13 }}>Agrega servicios desde el catálogo o crea uno personalizado</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Código', 'Servicio', 'Cant.', 'Precio Unit.', 'Total', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '.5px', background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: h === 'Total' || h === 'Precio Unit.' ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#484f58', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{item.code}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#cdd9e5', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        {item.desc && <div style={{ fontSize: 11, color: '#484f58', marginTop: 2 }}>{item.desc}</div>}
                      </td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', width: 70 }}>
                        <input type="number" min={1} value={item.qty} onChange={e => updateQty(item.id, Number(e.target.value))}
                          style={{ ...inputStyle, width: 60, textAlign: 'center', padding: '4px 8px' }} />
                      </td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', width: 120, textAlign: 'right' }}>
                        <input type="number" step="0.01" value={item.price} onChange={e => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                          style={{ ...inputStyle, width: 100, textAlign: 'right', padding: '4px 8px' }} />
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#cdd9e5', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {fmt(item.qty * item.price)}
                      </td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', width: 40 }}>
                        <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', padding: 4 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                          onMouseLeave={e => e.currentTarget.style.color = '#484f58'}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Notes */}
          <div style={cardStyle}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#cdd9e5' }}>Observaciones</span>
            </div>
            <div style={{ padding: 20 }}>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Notas adicionales para el cliente..."
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
            </div>
          </div>
        </div>

        {/* Right: Client + Totals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Client info */}
          <div style={cardStyle}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#cdd9e5' }}>Datos del cliente</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Nombre / Empresa *</label>
                <input style={inputStyle} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ej: Anyana Abreu" />
              </div>
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input style={inputStyle} type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="cliente@email.com" />
              </div>
              <div>
                <label style={labelStyle}>Teléfono / WhatsApp</label>
                <input style={inputStyle} value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+593 9 XXXX XXXX" />
              </div>
              <div>
                <label style={labelStyle}>Ciudad / País</label>
                <input style={inputStyle} value={clientCity} onChange={e => setClientCity(e.target.value)} placeholder="Guayaquil, Ecuador" />
              </div>
              <div>
                <label style={labelStyle}>RUT / RUC / DNI</label>
                <input style={inputStyle} value={clientRut} onChange={e => setClientRut(e.target.value)} placeholder="Opcional" />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div style={cardStyle}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#cdd9e5' }}>Resumen</span>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#6e7681' }}>Subtotal</span>
                <span style={{ fontSize: 13, color: '#cdd9e5', fontWeight: 600 }}>{fmt(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#6e7681', flex: 1 }}>IVA / Impuesto (%)</span>
                <input type="number" min={0} max={50} value={tax} onChange={e => setTax(Number(e.target.value))}
                  style={{ ...inputStyle, width: 70, textAlign: 'center', padding: '4px 8px' }} />
              </div>
              {tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: '#6e7681' }}>Impuesto ({tax}%)</span>
                  <span style={{ fontSize: 13, color: '#cdd9e5' }}>{fmt(taxAmt)}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: '#6e7681', flex: 1 }}>Válido por (días)</span>
                <input type="number" min={1} value={validDays} onChange={e => setValidDays(Number(e.target.value))}
                  style={{ ...inputStyle, width: 70, textAlign: 'center', padding: '4px 8px' }} />
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#cdd9e5' }}>TOTAL</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#60a5fa' }}>{fmt(total)}</span>
              </div>
              <button onClick={handlePrint}
                style={{ width: '100%', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Printer size={18} />
                Generar / Imprimir PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

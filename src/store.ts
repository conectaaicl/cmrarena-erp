import { create } from 'zustand';

export interface TenantSettings {
  name: string;
  domain: string;
  taxRate: number;
  primaryColor: string;
  resendApiKey: string;
  logo: string | null;
}

export interface Client {
  id: string;
  name: string;
  rut: string;
  email: string;
  phone: string;
  status: 'Nuevo' | 'Cotización enviada' | 'Seguimiento' | 'Aprobado' | 'Venta cerrada' | 'Perdido';
  notes: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
}

export interface QuoteItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Quotation {
  id: string;
  clientId: string;
  date: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'Borrador' | 'Enviada' | 'Aprobada' | 'Rechazada';
}

export interface Sale {
  id: string;
  quotationId?: string;
  clientId: string;
  date: string;
  items: QuoteItem[];
  total: number;
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Débito' | 'Crédito';
  status: 'Pagado' | 'Parcial' | 'Pendiente';
}

export interface DTE {
  id: string;
  saleId: string;
  type: 'Boleta Electrónica' | 'Factura Electrónica' | 'Nota de Crédito';
  folio: number;
  date: string;
  amount: number;
  status: 'Aceptado SII' | 'Rechazado SII' | 'Pendiente' | 'Anulado';
  trackId: string;
}

export interface SIISettings {
  certificateUploaded: boolean;
  environment: 'Certificación' | 'Producción';
  resolutionDate: string;
  resolutionNumber: string;
  lastBoletaFolio: number;
  lastFacturaFolio: number;
  rutEmpresa: string;
}

interface AppState {
  settings: TenantSettings;
  siiConfig: SIISettings;
  clients: Client[];
  products: Product[];
  quotations: Quotation[];
  sales: Sale[];
  dtes: DTE[];
  updateSettings: (settings: Partial<TenantSettings>) => void;
  addClient: (client: Client) => void;
  updateClientStatus: (id: string, status: Client['status']) => void;
  addProduct: (product: Product) => void;
  addQuotation: (quotation: Quotation) => void;
  updateQuotationStatus: (id: string, status: Quotation['status']) => void;
  addSale: (sale: Sale) => void;
  updateSIIConfig: (config: Partial<SIISettings>) => void;
  emitDTE: (saleId: string, type: 'Boleta Electrónica' | 'Factura Electrónica') => void;
}

export const useStore = create<AppState>((set) => ({
  settings: {
    name: 'Terrablinds SaaS',
    domain: 'terrablinds.mi-erp.cl',
    taxRate: 19,
    primaryColor: '#0f172a',
    resendApiKey: '',
    logo: null,
  },
  siiConfig: {
    certificateUploaded: false,
    environment: 'Certificación',
    resolutionDate: '2023-01-10',
    resolutionNumber: '1234',
    lastBoletaFolio: 1540,
    lastFacturaFolio: 80,
    rutEmpresa: '76.123.456-7'
  },
  dtes: [],
  clients: [
    { id: 'c1', name: 'Constructora Alfa', rut: '76.543.210-K', email: 'contacto@alfa.cl', phone: '+56912345678', status: 'Nuevo', notes: 'Cliente interesado en persianas corporativas' },
    { id: 'c2', name: 'Inmobiliaria Sur', rut: '77.123.456-7', email: 'ventas@sur.cl', phone: '+56987654321', status: 'Aprobado', notes: 'Requieren instalación rápida' }
  ],
  products: [
    { id: 'p1', sku: 'RL-100', name: 'Roller Blackout 100x150', category: 'Roller', cost: 15000, price: 35000, stock: 45, minStock: 10 },
    { id: 'p2', sku: 'ZB-200', name: 'Zebra Premium 120x200', category: 'Zebra', cost: 22000, price: 55000, stock: 5, minStock: 8 }
  ],
  quotations: [
    { id: 'q1', clientId: 'c1', date: '2023-10-25', items: [{ productId: 'p1', quantity: 5, unitPrice: 35000 }], subtotal: 175000, tax: 33250, total: 208250, status: 'Enviada' }
  ],
  sales: [
    { id: 's1', clientId: 'c2', date: '2023-10-20', items: [{ productId: 'p2', quantity: 2, unitPrice: 55000 }], total: 130900, paymentMethod: 'Transferencia', status: 'Pagado' }
  ],
  updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
  addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
  updateClientStatus: (id, status) => set((state) => ({
    clients: state.clients.map(c => c.id === id ? { ...c, status } : c)
  })),
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
  addQuotation: (quotation) => set((state) => ({ quotations: [...state.quotations, quotation] })),
  updateQuotationStatus: (id, status) => set((state) => ({
    quotations: state.quotations.map(q => q.id === id ? { ...q, status } : q)
  })),
  addSale: (sale) => set((state) => {
    // Cuando se crea una venta, se descuenta automáticamente el stock del inventario
    const updatedProducts = state.products.map(product => {
      const soldItem = sale.items.find(item => item.productId === product.id);
      if (soldItem) {
        return { ...product, stock: product.stock - soldItem.quantity };
      }
      return product;
    });

    return {
      sales: [...state.sales, sale],
      products: updatedProducts
    };
  }),
  updateSIIConfig: (newConfig) => set((state) => ({ siiConfig: { ...state.siiConfig, ...newConfig } })),
  emitDTE: (saleId, type) => set((state) => {
    const sale = state.sales.find(s => s.id === saleId);
    if (!sale) return state;

    const isBoleta = type === 'Boleta Electrónica';
    const folio = isBoleta ? state.siiConfig.lastBoletaFolio + 1 : state.siiConfig.lastFacturaFolio + 1;

    const newDTE: DTE = {
      id: `dte-${Date.now()}`,
      saleId: sale.id,
      type,
      folio,
      date: new Date().toISOString().split('T')[0],
      amount: sale.total,
      status: 'Aceptado SII',
      trackId: `TRK-${Math.floor(Math.random() * 1000000)}`
    };

    return {
      dtes: [...state.dtes, newDTE],
      siiConfig: {
        ...state.siiConfig,
        lastBoletaFolio: isBoleta ? folio : state.siiConfig.lastBoletaFolio,
        lastFacturaFolio: !isBoleta ? folio : state.siiConfig.lastFacturaFolio,
      }
    };
  })
}));

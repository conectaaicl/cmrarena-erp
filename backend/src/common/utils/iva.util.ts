/**
 * Cálculos IVA Chile
 */

export function calcularIVA(neto: number, tasaIVA: number = 19): number {
  return Math.round(neto * (tasaIVA / 100));
}

export function calcularNetoDesdeTotal(total: number, tasaIVA: number = 19): number {
  return Math.round(total / (1 + tasaIVA / 100));
}

export function calcularTotal(neto: number, tasaIVA: number = 19): number {
  return neto + calcularIVA(neto, tasaIVA);
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

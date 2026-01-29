/**
 * Converte string YYYY-MM-DD (ou ISO com timezone) em Date no fuso local (evita 01/01 virar 31/12 por UTC).
 * Aceita "2026-02-01" ou "2026-02-01T00:00:00.000Z" (usa só os primeiros 10 caracteres).
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const dateOnly = typeof dateStr === 'string' && dateStr.length >= 10 ? dateStr.slice(0, 10) : dateStr;
  const parts = dateOnly.split('-').map(Number);
  if (parts.length !== 3) return new Date(dateStr);
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

/** Retorna YYYY-MM-DD da string (aceita ISO); útil para comparação sem fuso. */
export function toDateOnlyString(dateStr: string): string {
  if (!dateStr) return '';
  return typeof dateStr === 'string' && dateStr.length >= 10 ? dateStr.slice(0, 10) : dateStr;
}

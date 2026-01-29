/**
 * Converte string YYYY-MM-DD em Date no fuso local (evita 01/01 virar 31/12 por UTC).
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return new Date(dateStr);
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

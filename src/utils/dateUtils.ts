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

/**
 * Retorna YYYY-MM-DD para comparação (data de calendário, sem mudar com fuso no F5).
 * - String "YYYY-MM-DD" → devolve igual.
 * - String ISO com "T" → usa data UTC (o que foi gravado no servidor).
 * - Date → usa UTC (evita 01/02 00:00 UTC virar 31/01 no Brasil e quebrar "ativo em janeiro").
 */
export function toDateOnlyString(value: string | Date | null | undefined): string {
  if (value == null) return '';
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  if (s.length < 10) return s;
  if (s.indexOf('T') !== -1) {
    const date = new Date(s);
    if (Number.isNaN(date.getTime())) return s.slice(0, 10);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return s.slice(0, 10);
}

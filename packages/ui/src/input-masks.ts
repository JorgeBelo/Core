// Formatting only: invalid/ambiguous money is retained for domain validation,
// never rounded, truncated or silently interpreted as a different amount.
export function moneyInput(value: string, previous = ''): string {
  let text = value.replace(/^\s*R\$\s*/, '').trim();
  // Some mobile decimal keyboards send a period even in Portuguese.
  if (text === previous + '.' && !previous.includes(',')) text = previous + ',';
  if (!text) return '';
  if (!/^[\d.,]+$/.test(text)) return value;
  const parts = text.split(',');
  if (parts.length > 2 || (parts[1]?.length ?? 0) > 2) return value;
  let whole = parts[0];
  const singleEdit =
    (previous.length === value.length + 1 &&
      [...previous].some((_, i) => previous.slice(0, i) + previous.slice(i + 1) === value)) ||
    (value.length === previous.length + 1 &&
      [...value].some((_, i) => value.slice(0, i) + value.slice(i + 1) === previous));
  const editingGroupedValue = /^\d{1,3}(?:\.\d{3})+(?:,\d{0,2})?$/.test(previous) && singleEdit;
  if (whole.includes('.') && !/^\d{1,3}(?:\.\d{3})+$/.test(whole) && !editingGroupedValue)
    return value;
  whole = whole.replace(/\./g, '').replace(/^0+(?=\d)/, '') || '0';
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return grouped + (parts.length === 2 ? ',' + parts[1] : '');
}
export function finishMoneyInput(value: string): string {
  const formatted = moneyInput(value);
  if (!formatted || !/^\d{1,3}(?:\.\d{3})*(?:,\d{0,2})?$/.test(formatted)) return formatted;
  const [whole, cents = ''] = formatted.split(',');
  return whole + ',' + cents.padEnd(2, '0');
}
export function phoneInput(value: string): string {
  value = value.trim();
  if (!value) return '';
  if (!/^[+()\d\s-]*$/.test(value) || /\+/.test(value.slice(1))) return value;
  let digits = value.replace(/\D/g, '');
  let prefix = '';
  if (value.startsWith('+') && !digits.startsWith('55')) return '+' + digits;
  if ((value.startsWith('+55') || digits.length > 11) && digits.startsWith('55')) {
    prefix = '+55 ';
    digits = digits.slice(2);
  }
  if (digits.length > 11) return value;
  if (!digits) return prefix.trim();
  if (digits.length <= 2) return prefix + '(' + digits;
  const body = digits.slice(2),
    cut = body.length > 8 ? 5 : 4;
  return (
    prefix +
    '(' +
    digits.slice(0, 2) +
    ') ' +
    body.slice(0, cut) +
    (body.length > cut ? '-' + body.slice(cut) : '')
  );
}

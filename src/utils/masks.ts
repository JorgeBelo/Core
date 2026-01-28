// Máscara de WhatsApp: (99) 9 9999-9999
export const maskWhatsApp = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara
  if (numbers.length <= 2) {
    return numbers ? `(${numbers}` : '';
  } else if (numbers.length <= 3) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
};

// Remove a máscara para salvar no banco
export const unmaskWhatsApp = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Máscara de moeda BRL: transforma dígitos em formato 1.234,56
export const maskCurrencyBRL = (value: string): string => {
  if (!value) return '';

  // Mantém apenas números
  const numbers = value.replace(/\D/g, '');

  if (!numbers) return '';

  const integer = parseInt(numbers, 10);
  const cents = (integer / 100).toFixed(2); // "1234.56"

  const [intPart, decimalPart] = cents.split('.');

  // Adiciona pontos de milhar
  const intWithSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${intWithSeparators},${decimalPart}`;
};

// Converte "1.234,56" em número 1234.56
export const unmaskCurrencyBRLToNumber = (value: string): number => {
  if (!value) return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
};

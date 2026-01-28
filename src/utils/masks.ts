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

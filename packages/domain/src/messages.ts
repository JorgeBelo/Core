import { z } from 'zod';
export const defaultMessageTemplates = {
  due: 'Olá, {nome}! Lembrete: o pagamento de {valor} vence hoje ({vencimento}). Se já pagou, envie o comprovante para conferência. {personal}',
  birthday_female:
    'Parabéns, {nome}! Que você se sinta muito querida neste dia. Desejo alegria, saúde e boas conquistas. Feliz aniversário! {personal}',
  birthday_male:
    'Parabéns, {nome}! Que você se sinta muito querido neste dia. Desejo alegria, saúde e boas conquistas. Feliz aniversário! {personal}',
  birthday_neutral:
    'Parabéns, {nome}! Que seu dia seja repleto de carinho. Desejo alegria, saúde e boas conquistas. Feliz aniversário! {personal}',
};
const template = z
  .string()
  .trim()
  .min(10)
  .max(2000)
  .refine(
    (v) => !/\{(?!nome\}|valor\}|vencimento\}|personal\})[^}]*\}/.test(v),
    'Use somente {nome}, {valor}, {vencimento} e {personal}.',
  );
export const messageTemplatesSchema = z.object({
  due: template,
  birthday_female: template,
  birthday_male: template,
  birthday_neutral: template,
});
export type MessageTemplates = z.infer<typeof messageTemplatesSchema>;
export const professionalProfileSchema = z.object({
  display_name: z.string().trim().min(3, 'Informe pelo menos 3 caracteres.').max(120),
  cref: z.string().trim().max(40, 'Use até 40 caracteres.').default(''),
});
export function renderMessage(
  template: string,
  values: { nome: string; personal: string; valor?: string; vencimento?: string },
) {
  return template.replace(
    /\{(nome|personal|valor|vencimento)\}/g,
    (_, key: keyof typeof values) => values[key] ?? '',
  );
}
export function birthdayTemplateKey(
  gender: string,
): 'birthday_female' | 'birthday_male' | 'birthday_neutral' {
  return gender === 'female'
    ? 'birthday_female'
    : gender === 'male'
      ? 'birthday_male'
      : 'birthday_neutral';
}
export function whatsAppLink(phone: string, message: string): string | null {
  let number = phone.replace(/\D/g, '');
  if (!phone.trim().startsWith('+') && (number.length === 10 || number.length === 11))
    number = '55' + number;
  if (!/^[1-9]\d{7,14}$/.test(number)) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
export function businessDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

import { describe, it, expect } from 'vitest';
import { moneyInput, finishMoneyInput, phoneInput } from '../packages/ui/src/input-masks';
import { parseBRL } from '../packages/domain/src/finance';
describe('Brazilian input masks', () => {
  it('formats mobile, landline, country code and an empty phone', () => {
    expect(phoneInput('11999990000')).toBe('(11) 99999-0000');
    expect(phoneInput('1133334444')).toBe('(11) 3333-4444');
    expect(phoneInput('+5511999990000')).toBe('+55 (11) 99999-0000');
    expect(phoneInput(' +5511999990000 ')).toBe('+55 (11) 99999-0000');
    expect(phoneInput('+351912345678')).toBe('+351912345678');
    expect(phoneInput('')).toBe('');
    expect(phoneInput('(11')).toBe('(11');
  });
  it('groups reais while typing and finishes cents without changing the amount', () => {
    let value = '';
    for (const digit of '123456') value = moneyInput(value + digit, value);
    expect(value).toBe('123.456');
    expect(finishMoneyInput(value)).toBe('123.456,00');
    expect(finishMoneyInput(moneyInput('R$ 1.250,5'))).toBe('1.250,50');
    expect(moneyInput('1.250.', '1.250')).toBe('1.250,');
    expect(parseBRL(finishMoneyInput(value))).toBe(12345600);
  });
  it('allows clearing and backspacing through a grouped amount', () => {
    let value = '12.345';
    for (let i = 0; i < 5; i++) value = moneyInput(value.slice(0, -1), value);
    expect(value).toBe('');
    expect(finishMoneyInput('')).toBe('');
    expect(finishMoneyInput(',5')).toBe('0,50');
  });
  it('retains invalid or ambiguous amounts for validation rather than changing their meaning', () => {
    for (const text of ['12.50', '-1,00', '12,345', '1,2,3', '2e3']) {
      expect(moneyInput(text)).toBe(text);
      expect(() => parseBRL(finishMoneyInput(text))).toThrow();
    }
  });
});

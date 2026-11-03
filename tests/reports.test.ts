import { describe, it, expect } from 'vitest';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { createStudentReport, type StudentReportRow } from '../packages/reports/src/index';
const fonts = async () => ({
  regularFont: new Uint8Array(
    await readFile(new URL('../apps/mobile/assets/fonts/NotoSans-Regular.ttf', import.meta.url)),
  ),
  boldFont: new Uint8Array(
    await readFile(new URL('../apps/mobile/assets/fonts/NotoSans-Bold.ttf', import.meta.url)),
  ),
});
describe('Complete student PDF reports', () => {
  it('creates a valid empty report without requiring CREF', async () => {
    const bytes = await createStudentReport({
      professional: { display_name: 'Personal de teste', cref: '' },
      students: [],
      ...(await fonts()),
      generatedAt: new Date('2026-11-03T15:00:00Z'),
    });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    await mkdir('work/pdf-qa', { recursive: true });
    await writeFile('work/pdf-qa/empty.pdf', bytes);
  });
  it('paginates a full portfolio, including long contacts and Portuguese characters', async () => {
    const students: StudentReportRow[] = Array.from({ length: 205 }, (_, i) => ({
      id: String(i),
      full_name: `Aluno ${String(i + 1).padStart(3, '0')} - João da Conceição e Família`,
      phone: '(11) 99999-0000',
      email:
        i === 0
          ? 'contato-muito-longo-' + 'a'.repeat(140) + '@example.test'
          : `aluno${i + 1}@example.test`,
      weekly_frequency: (i % 7) + 1,
      status: i % 2 ? 'active' : 'inactive',
    }));
    const bytes = await createStudentReport({
      professional: { display_name: 'Profissional de teste - José Gonçalves', cref: '123456-G/SP' },
      students,
      ...(await fonts()),
      generatedAt: new Date('2026-11-03T15:00:00Z'),
    });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(1);
    expect(doc.getAuthor()).toBe('Profissional de teste - José Gonçalves');
    await mkdir('work/pdf-qa', { recursive: true });
    await writeFile('work/pdf-qa/portfolio-205.pdf', bytes);
  });
});

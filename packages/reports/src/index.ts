import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
export type StudentReportRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  weekly_frequency: number | null;
  status: 'active' | 'inactive';
};
export async function createStudentReport(input: {
  professional: { display_name: string; cref: string };
  students: StudentReportRow[];
  regularFont: Uint8Array;
  boldFont: Uint8Array;
  generatedAt?: Date;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const normal = await doc.embedFont(input.regularFont, { subset: true }),
    bold = await doc.embedFont(input.boldFont, { subset: true });
  const characters = new Set(normal.getCharacterSet());
  const clean = (value: string) =>
    [
      ...value
        .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    ]
      .map((c) => (characters.has(c.codePointAt(0)!) ? c : '?'))
      .join('');
  const wrap = (value: string, width: number, font: PDFFont, size: number) => {
    const lines: string[] = [];
    let line = '';
    for (const char of clean(value || '-')) {
      if (line && font.widthOfTextAtSize(line + char, size) > width) {
        lines.push(line.trimEnd());
        line = char.trimStart();
      } else line += char;
    }
    lines.push(line || '-');
    return lines;
  };
  const date = input.generatedAt ?? new Date();
  doc.setTitle('Core - Relatório de alunos');
  doc.setAuthor(clean(input.professional.display_name));
  doc.setCreationDate(date);
  doc.setModificationDate(date);
  const timestamp = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
  const students = [...input.students].sort(
    (a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR') || a.id.localeCompare(b.id),
  );
  const width = 841.89,
    height = 595.28,
    margin = 36,
    widths = [210, 130, 230, 95, 104.89],
    ink = rgb(0.12, 0.12, 0.16),
    muted = rgb(0.4, 0.4, 0.45),
    red = rgb(0.64, 0.01, 0);
  const columns = ['Aluno', 'Telefone', 'E-mail', 'Frequência', 'Situação'];
  let page: PDFPage, y: number;
  function addPage() {
    page = doc.addPage([width, height]);
    page.drawText('Core', { x: margin, y: height - 52, font: bold, size: 27, color: ink });
    page.drawText('.', {
      x: margin + bold.widthOfTextAtSize('Core', 27) + 1,
      y: height - 52,
      font: bold,
      size: 27,
      color: red,
    });
    const time = clean(`Gerado em ${timestamp}`);
    page.drawText(time, {
      x: width - margin - normal.widthOfTextAtSize(time, 9),
      y: height - 38,
      font: normal,
      size: 9,
      color: muted,
    });
    page.drawText('Relatório de alunos', {
      x: margin,
      y: height - 87,
      font: bold,
      size: 19,
      color: ink,
    });
    const owner = clean(
      input.professional.display_name +
        (input.professional.cref ? ` | CREF: ${input.professional.cref}` : ''),
    );
    for (const [i, line] of wrap(owner, width - margin * 2, normal, 10).entries())
      page.drawText(line, {
        x: margin,
        y: height - 106 - i * 12,
        font: normal,
        size: 10,
        color: muted,
      });
    page.drawText(
      `${students.length} aluno(s) | ${students.filter((s) => s.status === 'active').length} ativo(s) | ${students.filter((s) => s.status === 'inactive').length} inativo(s)`,
      { x: margin, y: height - 139, font: normal, size: 9, color: muted },
    );
    y = height - 157;
    page.drawRectangle({
      x: margin,
      y: y - 25,
      width: width - margin * 2,
      height: 25,
      color: rgb(0.95, 0.95, 0.96),
    });
    let x = margin;
    columns.forEach((label, i) => {
      page.drawText(label, { x: x + 9, y: y - 16, font: bold, size: 9, color: ink });
      x += widths[i];
    });
    y -= 25;
  }
  addPage();
  if (!students.length) {
    page!.drawText('Nenhum aluno cadastrado.', {
      x: margin + 9,
      y: y! - 30,
      font: normal,
      size: 10,
      color: muted,
    });
  }
  students.forEach((s, index) => {
    const values = [
      s.full_name,
      s.phone || '-',
      s.email || '-',
      s.weekly_frequency ? `${s.weekly_frequency}x/semana` : 'A definir',
      s.status === 'active' ? 'Ativo' : 'Inativo',
    ];
    const cells = values.map((v, i) => wrap(v, widths[i] - 18, normal, 8.5));
    const rowHeight = Math.max(34, Math.max(...cells.map((c) => c.length)) * 12 + 16);
    if (y - rowHeight < 53) addPage();
    if (index % 2 === 1)
      page.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width: width - margin * 2,
        height: rowHeight,
        color: rgb(0.982, 0.982, 0.986),
      });
    let x = margin;
    cells.forEach((lines, i) => {
      lines.forEach((line, j) =>
        page.drawText(line, {
          x: x + 9,
          y: y - 20 - j * 12,
          font: normal,
          size: 8.5,
          color: i === 0 ? ink : muted,
        }),
      );
      x += widths[i];
    });
    page.drawLine({
      start: { x: margin, y: y - rowHeight },
      end: { x: width - margin, y: y - rowHeight },
      color: rgb(0.88, 0.88, 0.9),
      thickness: 0.5,
    });
    y -= rowHeight;
  });
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText('Uso profissional - dados de contato e frequência combinada', {
      x: margin,
      y: 28,
      font: normal,
      size: 8,
      color: muted,
    });
    const count = `${i + 1} / ${pages.length}`;
    p.drawText(count, {
      x: width - margin - normal.widthOfTextAtSize(count, 8),
      y: 28,
      font: normal,
      size: 8,
      color: muted,
    });
  });
  return doc.save();
}

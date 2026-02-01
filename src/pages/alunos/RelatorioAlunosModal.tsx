import { useRef } from 'react';
import { X, Printer, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { User } from '../../types';
import type { Aluno } from '../../types';
import { maskWhatsApp } from '../../utils/masks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type RelatorioAlunosModalProps = {
  open: boolean;
  onClose: () => void;
  userProfile: User | null;
  alunos: Aluno[];
};

export const RelatorioAlunosModal = ({
  open,
  onClose,
  userProfile,
  alunos,
}: RelatorioAlunosModalProps) => {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const dataHoraGeracao = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const dataGeracaoArquivo = format(new Date(), "dd-MM-yyyy_HH-mm", { locale: ptBR });
  const nomePersonal = userProfile?.name || 'Personal';
  const emailPersonal = userProfile?.email || '-';
  const telefonePersonal = userProfile?.phone ? maskWhatsApp(userProfile.phone) : '-';
  const crefPreenchido = userProfile?.cref?.trim();
  const alunosAtivos = alunos.filter((a) => a.active !== false);
  const diaVencimento = (dia: number | undefined) =>
    dia != null && dia >= 1 && dia <= 31 ? String(dia).padStart(2, '0') : '-';

  const handleImprimir = () => {
    const conteudo = reportRef.current;
    if (!conteudo) return;
    const janela = window.open('', '_blank');
    if (!janela) return;
    janela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório de Alunos</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 16px; background: #f5f5f5; color: #1a1a1a; }
            .doc-paper { background: #ffffff; color: #1a1a1a; padding: 20px; border-radius: 8px; width: 210mm; margin: 0 auto; box-sizing: border-box; }
            .titulo-documento { background: #a20100; color: #ffffff !important; margin: -20px -20px 0 -20px; padding: 18px 20px 14px; font-size: 20px; font-weight: 700; text-align: center; border-radius: 8px 8px 0 0; }
            .cabecalho { margin-top: 18px; margin-bottom: 18px; padding: 12px 0 14px; border-bottom: 1px solid #ddd; }
            .cabecalho h2 { margin: 0 0 10px 0; font-size: 15px; color: #333; font-weight: 600; }
            .cabecalho p { margin: 4px 0; color: #1a1a1a; line-height: 1.35; }
            .secao-tabela { color: #1a1a1a; font-weight: 700; font-size: 14px; margin-bottom: 12px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #404040; padding: 10px 12px; text-align: left; color: #1a1a1a; }
            th { background: #a20100; color: #ffffff !important; font-weight: 600; }
            tbody tr:nth-child(even) { background: #f8f8f8; }
            .rodape { margin-top: 24px; padding-top: 16px; border-top: 2px solid #404040; font-size: 11px; color: #404040; text-align: center; }
          </style>
        </head>
        <body>
          ${conteudo.innerHTML}
        </body>
      </html>
    `);
    janela.document.close();
    janela.focus();
    setTimeout(() => {
      janela.print();
      janela.close();
    }, 300);
  };

  const handleBaixarPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 18; // margens A4 confortáveis
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Cor primária Core: #a20100 -> RGB 162, 1, 0
    const primaryR = 162;
    const primaryG = 1;
    const primaryB = 0;

    // Faixa do título – tamanho visível em A4
    doc.setFillColor(primaryR, primaryG, primaryB);
    doc.rect(0, 0, pageWidth, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Alunos', pageWidth / 2, 16, { align: 'center' });
    doc.setTextColor(26, 26, 26);
    doc.setFont('helvetica', 'normal');
    let y = 36;

    // "Dados do Personal"
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Dados do Personal', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 26, 26);
    y += 9;

    doc.setFontSize(12);
    doc.text(`Nome: ${nomePersonal}`, margin, y);
    y += 7;
    doc.text(`E-mail: ${emailPersonal}`, margin, y);
    y += 7;
    doc.text(`Telefone: ${telefonePersonal}`, margin, y);
    y += 7;
    if (crefPreenchido) {
      doc.text(`CREF: ${crefPreenchido}`, margin, y);
      y += 7;
    }
    y += 6;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Listagem de alunos ativos', margin, y);
    doc.setFont('helvetica', 'normal');
    y += 9;

    const tableData = alunosAtivos.map((a) => {
      const nome = a.nome || a.name || '-';
      const tel = a.whatsapp ? maskWhatsApp(a.whatsapp) : '-';
      const freq = a.frequency_per_week ? `${a.frequency_per_week}x/semana` : '-';
      const venc = diaVencimento(a.payment_day);
      return [nome, tel, freq, venc];
    });

    autoTable(doc, {
      startY: y,
      head: [['Nome', 'Telefone', 'Vezes por semana', 'Dia venc.']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [primaryR, primaryG, primaryB],
        textColor: [255, 255, 255],
        fontSize: 12,
        fontStyle: 'bold',
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 11,
        textColor: [26, 26, 26],
        cellPadding: 3.5,
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: margin, right: margin, bottom: 18 },
      tableLineColor: [64, 64, 64],
      showHead: 'everyPage', // repete cabeçalho da tabela em cada página
      didDrawPage: (data) => {
        // Rodapé em todas as páginas, fixo no fim da folha A4
        const footerY = pageHeight - 12;
        doc.setFontSize(10);
        doc.setTextColor(64, 64, 64);
        doc.text(
          `Core - Gestão para Personal Trainers | Documento gerado em ${dataHoraGeracao}`,
          pageWidth / 2,
          footerY,
          { align: 'center' }
        );
        doc.text(`Página ${data.pageNumber}`, pageWidth - margin, footerY, { align: 'right' });
      },
    });

    doc.save(`relatorio-alunos-${dataGeracaoArquivo}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-dark-soft border border-gray-dark rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-dark">
          <h2 className="text-lg font-semibold text-white">Relatório de Alunos</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-light hover:text-white p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex items-center gap-2 p-4 border-b border-gray-dark flex-wrap">
          <button
            type="button"
            onClick={handleImprimir}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors min-h-[44px]"
          >
            <Printer size={18} />
            Imprimir
          </button>
          <button
            type="button"
            onClick={handleBaixarPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark border border-gray-dark text-white hover:bg-dark transition-colors min-h-[44px]"
          >
            <FileDown size={18} />
            Baixar PDF
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-[#f5f5f5]">
          <div
            ref={reportRef}
            className="doc-paper bg-white rounded-lg overflow-hidden shadow-md max-w-[210mm] mx-auto"
          >
            <h1 className="titulo-documento bg-primary text-white text-xl font-bold text-center pt-5 pb-4 px-6">
              Relatório de Alunos
            </h1>
            <div className="cabecalho px-6 mt-5 pt-4 pb-4 mb-4 border-b border-gray-300">
              <h2 className="text-[#333] font-semibold mb-2.5 text-[15px]">Dados do Personal</h2>
              <p className="text-[#1a1a1a] leading-snug"><strong>Nome:</strong> {nomePersonal}</p>
              <p className="text-[#1a1a1a] leading-snug"><strong>E-mail:</strong> {emailPersonal}</p>
              <p className="text-[#1a1a1a] leading-snug"><strong>Telefone:</strong> {telefonePersonal}</p>
              {crefPreenchido ? <p className="text-[#1a1a1a] leading-snug"><strong>CREF:</strong> {crefPreenchido}</p> : null}
            </div>

            <div className="px-6">
              <h2 className="secao-tabela text-[#333] font-bold mb-3 text-sm">Listagem de alunos ativos</h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-primary text-white border border-gray-dark p-2.5 text-left font-semibold">Nome</th>
                    <th className="bg-primary text-white border border-gray-dark p-2.5 text-left font-semibold">Telefone</th>
                    <th className="bg-primary text-white border border-gray-dark p-2.5 text-left font-semibold">Vezes por semana</th>
                    <th className="bg-primary text-white border border-gray-dark p-2.5 text-left font-semibold">Dia venc.</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosAtivos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="border border-gray-dark p-2.5 text-center text-gray-dark bg-gray-100">
                        Nenhum aluno ativo na lista
                      </td>
                    </tr>
                  ) : (
                    alunosAtivos.map((a, idx) => (
                      <tr key={a.id} className={idx % 2 === 1 ? 'bg-[#f8f8f8]' : ''}>
                        <td className="border border-gray-dark p-2.5 text-[#1a1a1a]">{a.nome || a.name || '-'}</td>
                        <td className="border border-gray-dark p-2.5 text-[#1a1a1a]">
                          {a.whatsapp ? maskWhatsApp(a.whatsapp) : '-'}
                        </td>
                        <td className="border border-gray-dark p-2.5 text-[#1a1a1a]">
                          {a.frequency_per_week ? `${a.frequency_per_week}x/semana` : '-'}
                        </td>
                        <td className="border border-gray-dark p-2.5 text-[#1a1a1a] tabular-nums">{diaVencimento(a.payment_day)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="rodape mt-6 pt-4 border-t-2 border-gray-dark text-gray-dark text-xs text-center">
                Core - Gestão para Personal Trainers | Documento gerado em {dataHoraGeracao}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

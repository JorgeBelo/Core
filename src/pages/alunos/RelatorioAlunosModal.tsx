import { useRef } from 'react';
import { X, Printer, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { User } from '../../types';
import type { Aluno } from '../../types';
import { maskWhatsApp } from '../../utils/masks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

  const dataGeracao = format(new Date(), "dd-MM-yyyy", { locale: ptBR });
  const nomePersonal = userProfile?.name || 'Personal';
  const emailPersonal = userProfile?.email || '-';
  const telefonePersonal = userProfile?.phone ? maskWhatsApp(userProfile.phone) : '-';
  const crefPersonal = userProfile?.cref || '-';
  const diasAtendimento =
    userProfile?.agenda_working_days?.length &&
    userProfile.agenda_working_days.length < 7
      ? (userProfile.agenda_working_days as number[])
          .map((d) => DIAS_SEMANA[d])
          .join(', ')
      : 'Todos os dias';
  const horarioAgenda =
    userProfile?.agenda_hora_inicio && userProfile?.agenda_hora_fim
      ? `${userProfile.agenda_hora_inicio} às ${userProfile.agenda_hora_fim}`
      : '-';

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
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; color: #1a1a1a; }
            .cabecalho { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #ddd; }
            .cabecalho h1 { margin: 0 0 12px 0; font-size: 18px; }
            .cabecalho p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #333; padding: 8px 12px; text-align: left; }
            th { background: #f0f0f0; font-weight: 600; }
            .rodape { margin-top: 24px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #666; }
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
    const margin = 14;
    let y = margin;

    doc.setFontSize(16);
    doc.text('Dados do Personal', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Nome: ${nomePersonal}`, margin, y);
    y += 6;
    doc.text(`E-mail: ${emailPersonal}`, margin, y);
    y += 6;
    doc.text(`Telefone: ${telefonePersonal}`, margin, y);
    y += 6;
    doc.text(`CREF: ${crefPersonal}`, margin, y);
    y += 6;
    doc.text(`Dias de atendimento: ${diasAtendimento}`, margin, y);
    y += 6;
    doc.text(`Horário da agenda: ${horarioAgenda}`, margin, y);
    y += 12;

    doc.setFontSize(14);
    doc.text('Relatório de Alunos', margin, y);
    y += 10;

    const tableData = alunos.map((a) => {
      const nome = a.nome || a.name || '-';
      const tel = a.whatsapp ? maskWhatsApp(a.whatsapp) : '-';
      const freq = a.frequency_per_week ? `${a.frequency_per_week}x/semana` : '-';
      return [nome, tel, freq];
    });

    autoTable(doc, {
      startY: y,
      head: [['Nome', 'Telefone', 'Vezes por semana']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [80, 80, 80], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: margin, right: margin },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? y;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Gerado por Core - gestão para personal. Data: ${dataGeracao}`,
      margin,
      finalY + 14
    );

    doc.save(`relatorio-alunos-${dataGeracao.replace(/\//g, '-')}.pdf`);
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

        <div className="flex-1 overflow-auto p-6">
          <div
            ref={reportRef}
            className="bg-white text-gray-900 rounded-lg p-6 print:shadow-none"
          >
            <div className="cabecalho border-b border-gray-300 pb-4 mb-4">
              <h1 className="text-lg font-bold mb-3">Dados do Personal</h1>
              <p><strong>Nome:</strong> {nomePersonal}</p>
              <p><strong>E-mail:</strong> {emailPersonal}</p>
              <p><strong>Telefone:</strong> {telefonePersonal}</p>
              <p><strong>CREF:</strong> {crefPersonal}</p>
              <p><strong>Dias de atendimento:</strong> {diasAtendimento}</p>
              <p><strong>Horário da agenda:</strong> {horarioAgenda}</p>
            </div>

            <h2 className="text-base font-bold mb-3">Relatório de Alunos</h2>
            <table className="w-full border-collapse border border-gray-700 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-700 p-2 text-left">Nome</th>
                  <th className="border border-gray-700 p-2 text-left">Telefone</th>
                  <th className="border border-gray-700 p-2 text-left">Vezes por semana</th>
                </tr>
              </thead>
              <tbody>
                {alunos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="border border-gray-700 p-2 text-center text-gray-600">
                      Nenhum aluno na lista
                    </td>
                  </tr>
                ) : (
                  alunos.map((a) => (
                    <tr key={a.id}>
                      <td className="border border-gray-700 p-2">{a.nome || a.name || '-'}</td>
                      <td className="border border-gray-700 p-2">
                        {a.whatsapp ? maskWhatsApp(a.whatsapp) : '-'}
                      </td>
                      <td className="border border-gray-700 p-2">
                        {a.frequency_per_week ? `${a.frequency_per_week}x/semana` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="rodape mt-6 pt-4 border-t border-gray-300 text-gray-500 text-xs">
              Gerado por Core - gestão para personal. Data: {dataGeracao}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { AvaliacaoFisica } from '../types/avaliacao';

interface PersonalData {
  nome: string;
  email: string;
  telefone?: string;
  cref?: string;
}

export async function gerarRelatorioPDF(
  avaliacao: AvaliacaoFisica,
  alunoNome: string,
  personalData: PersonalData
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  
  // Cores da identidade visual
  const primaryRed = [162, 1, 0] as [number, number, number];
  const darkGray = [64, 64, 64] as [number, number, number];
  const lightGray = [180, 180, 180] as [number, number, number];
  
  const protocoloLabel = {
    '3dobras': '3 Dobras Cutâneas (Jackson & Pollock)',
    '7dobras': '7 Dobras Cutâneas (Jackson & Pollock)',
    'bioimpedancia': 'Bioimpedância',
    'perimetros': 'Perímetros Corporais'
  }[avaliacao.protocolo];
  
  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // ============================================
  // PÁGINA 1: OVERVIEW + AVATAR 3D
  // ============================================
  
  // Header com logo e título
  doc.setFillColor(...primaryRed);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('CORE', margin, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gestão para Personal Trainers', margin, 22);
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE AVALIAÇÃO FÍSICA', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(formatData(avaliacao.data_avaliacao), pageWidth / 2, 22, { align: 'center' });
  
  // Dados do Personal e Aluno
  let yPos = 45;
  
  doc.setFillColor(248, 248, 248);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F');
  
  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PERSONAL TRAINER', margin + 5, yPos + 7);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${personalData.nome}`, margin + 5, yPos + 12);
  doc.text(`${personalData.email}`, margin + 5, yPos + 17);
  if (personalData.telefone) {
    doc.text(`${personalData.telefone}`, margin + 5, yPos + 22);
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('ALUNO AVALIADO', pageWidth / 2 + 5, yPos + 7);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`${alunoNome}`, pageWidth / 2 + 5, yPos + 12);
  doc.text(`Idade: ${avaliacao.idade || 'N/A'} anos`, pageWidth / 2 + 5, yPos + 17);
  doc.text(`Sexo: ${avaliacao.sexo === 'M' ? 'Masculino' : 'Feminino'}`, pageWidth / 2 + 5, yPos + 22);
  
  yPos += 35;
  
  // Protocolo utilizado
  doc.setFillColor(...primaryRed);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PROTOCOLO UTILIZADO', pageWidth / 2, yPos + 5.5, { align: 'center' });
  
  yPos += 10;
  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(protocoloLabel, pageWidth / 2, yPos + 3, { align: 'center' });
  
  yPos += 12;
  
  // Métricas Principais em Cards Grandes
  doc.setFillColor(...primaryRed);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('MÉTRICAS PRINCIPAIS', pageWidth / 2, yPos + 5.5, { align: 'center' });
  
  yPos += 12;
  
  const cardWidth = (pageWidth - 2 * margin - 10) / 3;
  const cardHeight = 25;
  
  // Card 1: Peso e Altura
  doc.setFillColor(248, 248, 248);
  doc.rect(margin, yPos, cardWidth, cardHeight, 'F');
  doc.setDrawColor(...lightGray);
  doc.rect(margin, yPos, cardWidth, cardHeight);
  
  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('⚖️ Peso', margin + cardWidth / 2, yPos + 6, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${avaliacao.peso} kg`, margin + cardWidth / 2, yPos + 14, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`📏 Altura: ${avaliacao.altura} cm`, margin + cardWidth / 2, yPos + 20, { align: 'center' });
  
  // Card 2: IMC
  doc.setFillColor(248, 248, 248);
  doc.rect(margin + cardWidth + 5, yPos, cardWidth, cardHeight, 'F');
  doc.rect(margin + cardWidth + 5, yPos, cardWidth, cardHeight);
  
  doc.setFontSize(9);
  doc.text('📊 IMC', margin + cardWidth + 5 + cardWidth / 2, yPos + 6, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${avaliacao.imc}`, margin + cardWidth + 5 + cardWidth / 2, yPos + 14, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${avaliacao.classificacao_imc}`, margin + cardWidth + 5 + cardWidth / 2, yPos + 20, { align: 'center' });
  
  // Card 3: % Gordura
  doc.setFillColor(248, 248, 248);
  doc.rect(margin + 2 * cardWidth + 10, yPos, cardWidth, cardHeight, 'F');
  doc.rect(margin + 2 * cardWidth + 10, yPos, cardWidth, cardHeight);
  
  doc.setFontSize(9);
  doc.text('🔥 % Gordura', margin + 2 * cardWidth + 10 + cardWidth / 2, yPos + 6, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${avaliacao.percentual_gordura}%`, margin + 2 * cardWidth + 10 + cardWidth / 2, yPos + 14, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${avaliacao.classificacao_gordura}`, margin + 2 * cardWidth + 10 + cardWidth / 2, yPos + 20, { align: 'center' });
  
  yPos += cardHeight + 8;
  
  // Composição Corporal
  doc.setFillColor(...primaryRed);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPOSIÇÃO CORPORAL', pageWidth / 2, yPos + 5.5, { align: 'center' });
  
  yPos += 12;
  
  const composicaoData = [
    ['Massa Gorda', `${avaliacao.massa_gorda_kg} kg`, `${avaliacao.percentual_gordura}%`],
    ['Massa Magra', `${avaliacao.massa_magra_kg} kg`, `${(100 - avaliacao.percentual_gordura).toFixed(1)}%`],
  ];
  
  if (avaliacao.peso_ideal_kg) {
    composicaoData.push(['Peso Ideal', `${avaliacao.peso_ideal_kg} kg`, '-']);
  }
  
  if (avaliacao.rcq) {
    composicaoData.push(['RCQ (Cintura/Quadril)', `${avaliacao.rcq}`, '-']);
  }
  
  (doc as any).autoTable({
    startY: yPos,
    head: [['Métrica', 'Valor Absoluto', 'Percentual']],
    body: composicaoData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryRed,
      textColor: [255, 255, 255] as [number, number, number],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      textColor: darkGray,
      fontSize: 10,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248] as [number, number, number]
    },
    margin: { left: margin, right: margin }
  });
  
  // Rodapé Página 1
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(...lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Core - Gestão para Personal Trainers | Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  doc.text('Página 1 de 2', pageWidth - margin, footerY, { align: 'right' });
  
  // ============================================
  // PÁGINA 2: DADOS TÉCNICOS
  // ============================================
  
  doc.addPage();
  
  // Header Página 2
  doc.setFillColor(...primaryRed);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS TÉCNICOS DA AVALIAÇÃO', pageWidth / 2, 12, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${alunoNome} - ${formatData(avaliacao.data_avaliacao)}`, pageWidth / 2, 19, { align: 'center' });
  
  yPos = 35;
  
  // Dobras Cutâneas (se aplicável)
  if (avaliacao.protocolo === '3dobras' || avaliacao.protocolo === '7dobras') {
    doc.setFillColor(...primaryRed);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DOBRAS CUTÂNEAS (mm)', pageWidth / 2, yPos + 5.5, { align: 'center' });
    
    yPos += 12;
    
    const dobrasData: any[] = [];
    
    if (avaliacao.dobra_peitoral) dobrasData.push(['Peitoral', `${avaliacao.dobra_peitoral} mm`]);
    if (avaliacao.dobra_abdominal) dobrasData.push(['Abdominal', `${avaliacao.dobra_abdominal} mm`]);
    if (avaliacao.dobra_coxa) dobrasData.push(['Coxa', `${avaliacao.dobra_coxa} mm`]);
    if (avaliacao.dobra_axilar_media) dobrasData.push(['Axilar Média', `${avaliacao.dobra_axilar_media} mm`]);
    if (avaliacao.dobra_triceps) dobrasData.push(['Tríceps', `${avaliacao.dobra_triceps} mm`]);
    if (avaliacao.dobra_subescapular) dobrasData.push(['Subescapular', `${avaliacao.dobra_subescapular} mm`]);
    if (avaliacao.dobra_suprailiaca) dobrasData.push(['Supra-ilíaca', `${avaliacao.dobra_suprailiaca} mm`]);
    
    if (dobrasData.length > 0) {
      const somaDobras = [
        avaliacao.dobra_peitoral,
        avaliacao.dobra_abdominal,
        avaliacao.dobra_coxa,
        avaliacao.dobra_axilar_media,
        avaliacao.dobra_triceps,
        avaliacao.dobra_subescapular,
        avaliacao.dobra_suprailiaca
      ].filter(Boolean).reduce((a, b) => (a || 0) + (b || 0), 0);
      
      dobrasData.push(['SOMA TOTAL', `${somaDobras?.toFixed(1)} mm`]);
      
      (doc as any).autoTable({
        startY: yPos,
        body: dobrasData,
        theme: 'grid',
        bodyStyles: {
          textColor: darkGray,
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248] as [number, number, number]
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { halign: 'right', cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  }
  
  // Fórmulas Utilizadas
  doc.setFillColor(...primaryRed);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FÓRMULAS CIENTÍFICAS UTILIZADAS', pageWidth / 2, yPos + 5.5, { align: 'center' });
  
  yPos += 12;
  
  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const formulas = [
    '• IMC = Peso (kg) / Altura² (m)',
    '• Densidade Corporal: Fórmula de Jackson & Pollock',
    '• % Gordura: Fórmula de Siri [(4.95 / DC) - 4.50] × 100',
    '• Peso Ideal: Fórmula de Devine',
    '• Massa Gorda = Peso × (% Gordura / 100)',
    '• Massa Magra = Peso - Massa Gorda'
  ];
  
  formulas.forEach((formula, index) => {
    doc.text(formula, margin + 5, yPos + (index * 6));
  });
  
  yPos += formulas.length * 6 + 8;
  
  // Observações
  if (avaliacao.observacoes) {
    doc.setFillColor(...primaryRed);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES', pageWidth / 2, yPos + 5.5, { align: 'center' });
    
    yPos += 12;
    
    doc.setTextColor(...darkGray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const splitObservacoes = doc.splitTextToSize(avaliacao.observacoes, pageWidth - 2 * margin - 10);
    doc.text(splitObservacoes, margin + 5, yPos);
    
    yPos += splitObservacoes.length * 5 + 10;
  }
  
  // Recomendações
  doc.setFillColor(...primaryRed);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMENDAÇÕES', pageWidth / 2, yPos + 5.5, { align: 'center' });
  
  yPos += 12;
  
  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const recomendacoes = [
    '✓ Manter acompanhamento regular com avaliações a cada 30-60 dias',
    '✓ Seguir orientações nutricionais personalizadas',
    '✓ Manter frequência de treino conforme planejamento',
    '✓ Hidratação adequada (mínimo 35ml/kg/dia)',
    '✓ Sono de qualidade (7-9 horas por noite)'
  ];
  
  recomendacoes.forEach((rec, index) => {
    doc.text(rec, margin + 5, yPos + (index * 6));
  });
  
  // Rodapé Página 2
  doc.setFontSize(8);
  doc.setTextColor(...lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Core - Gestão para Personal Trainers | Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );
  
  if (personalData.cref) {
    doc.text(
      `Assinatura Digital: ${personalData.nome} - CREF ${personalData.cref}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  doc.text('Página 2 de 2', pageWidth - margin, pageHeight - 15, { align: 'right' });
  
  // Salvar PDF
  const nomeArquivo = `Avaliacao_${alunoNome.replace(/\s+/g, '_')}_${new Date(avaliacao.data_avaliacao).toISOString().split('T')[0]}.pdf`;
  doc.save(nomeArquivo);
}

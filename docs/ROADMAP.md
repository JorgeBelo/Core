# Roadmap

## Fase 1 — Fundação (conectada ao Supabase hospedado)

Monorepo, design system, Auth, perfis, banco, RLS, cadastro essencial de alunos e dashboard. Login real confirmado pelo proprietário; testes transacionais executados no banco hospedado. Permanecem recuperação por e-mail, testes Android/iOS físicos, backup/restauração e complementos de cadastro.

## Fase 2 — Treinos

Núcleo implementado: biblioteca, editor, duplicação, versões imutáveis aprovadas, área do aluno, execução e histórico recente. Testes de domínio/banco, interface desktop/mobile e transação no Supabase passaram. Pendências detalhadas em TRAINING.md: upload/player, coleções, progressões, vigências, gráficos, paginação histórica e testes físicos.

Biblioteca própria/licenciada, editor, versões de prescrições, publicação, interface do aluno, registros de execução e histórico. Gate: personal cadastra aluno, prescreve e publica; aluno registra séries; edição da ficha mantém execução histórica intacta. Uploads e licença dos materiais precisam ser definidos.

## Fase 3 — Financeiro

Planos, contratos, parcelas, recebimentos parciais, despesas, fluxo de caixa, relatórios e comprovantes privados. Gate: vencimento não gera baixa, dois pagamentos parciais totalizam obrigação, caixa só inclui recebimentos/despesas confirmados. Valores em centavos e transações auditáveis.

## Fase 4 — Avaliações e agenda

Anamnese, protocolos, medidas, comparativos, fotos privadas, consentimentos, calendário e regras de reposição configuráveis. Gate: acesso a dados sensíveis restrito; bloqueio de conflito concorrente; testes de prazo/limite de reposição e fusos.

## Fase 5 — Consultoria online

Mensagens, feedbacks, push, preferências, renovação e fluxos remotos. Gate: mensagens visíveis apenas aos participantes e notificações respeitando preferências.

## Fase 6 — Core AI

Contrato de provedor já previsto. Integração desabilitada. Avaliar execução local, hardware, licença e disponibilidade real de provedores antes da escolha. Modelos locais não têm custo por chamada de API, mas exigem recursos computacionais e operação; não prometemos desempenho ou gratuidade de hospedagem. Nenhum dado de saúde enviado a terceiros nesta entrega. Gate: proposta estruturada, identificação de contexto faltante e bloqueio de disponibilização sem aprovação.

## Antes de janeiro de 2027

Priorizar operação estável e fases essenciais a uso real. O escopo completo depende de entregas e homologação; não há promessa de concluir todas as fases até janeiro. Backups, recuperação testada, política de privacidade, exportação, retenção e distribuição devem preceder a entrada de dados reais de saúde.

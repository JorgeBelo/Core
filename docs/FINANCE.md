# Financeiro

## Implementado

Contas a receber e a pagar paginadas, busca por descrição, filtros por situação, edição com controle de concorrência e histórico. Valores individuais usam centavos inteiros; totais agregados trafegam como strings e são formatados sem arredondamento de ponto flutuante.

Recebimentos e despesas são confirmados manualmente, inclusive em parcelas de pagamento. Vencimento, contrato e recorrência nunca confirmam baixa. RPCs bloqueiam a conta durante a operação, rejeitam pagamentos acima do saldo e repetição de chave com conteúdo diferente. Retentativas com a mesma chave e dados retornam o registro original.

Estorno integral de cada pagamento cria um lançamento negativo vinculado ao original e exige motivo. Descontos, juros e multas são ajustes imutáveis com justificativa. Cancelamento exige saldo líquido de pagamentos igual a zero. Contestações bloqueiam novos pagamentos até resolução. O histórico preserva os registros anteriores.

Planos configuram preço, modalidade, duração, frequência e condições de cancelamento/reposição. Contratos preservam um snapshot e geram parcelas previstas somente após revisão explícita. Alterar o plano não altera o contrato existente. Cancelar o contrato pode cancelar parcelas sem pagamentos líquidos; parcelas pagas ou parcialmente pagas permanecem.

Recorrências geram obrigações por ação explícita, com horizonte máximo de dois anos e até 60 contas por operação. O contador e o bloqueio transacional impedem duplicação; datas mensais permanecem ancoradas na data inicial. Pausar impede novas gerações e mantém as contas existentes.

Visão geral e relatórios distinguem caixa confirmado por data efetiva, competência por data da obrigação e saldos atuais de todos os períodos. Incluem séries mensais, categorias e recebimentos por aluno. Resultado por competência é gerencial. O fuso operacional atual é America/Sao_Paulo.

## Segurança e validação

Migração `20261103173924_core_finance.sql`, aplicada no Supabase hospedado. RLS e grants por coluna; nenhuma escrita direta do cliente em pagamentos, ajustes, contratos ou eventos. Funções privilegiadas ficam no schema privado e derivam o profissional do Auth. A view de saldos usa security_invoker. O relatório restringe explicitamente o profissional atual além da RLS.

Alunos ativos podem ler somente contratos e cobranças próprias, pagamentos e ajustes relacionados. Não podem confirmar ou alterar operações. A tela secundária Meu financeiro apresenta cobranças paginadas, valores, vencimentos, confirmações, estornos e ajustes; mantém as quatro abas principais do aluno. A apresentação das condições contratuais ao aluno ainda está pendente. Despesas e eventos internos não ficam disponíveis ao aluno.

Testes automatizados cobrem regras monetárias, restrições, isolamento, permissões, idempotência, snapshots, recorrência e diferença entre previsão/caixa. Playwright exercita recebimento parcial, quitação, estorno, despesa, contrato e recorrência nos tamanhos desktop/mobile com backend de teste. O script `tests/live-finance-rollback.sql` verifica o PostgreSQL hospedado com rollback obrigatório e identidades Auth existentes.

## Complementos pendentes

- Anexos/comprovantes privados, recibos exportáveis e assinatura eletrônica.
- Importação do histórico financeiro antigo após reconciliação dos dados.
- Categorias administráveis, centro de custos, orçamento e exportação de relatórios.
- Gráficos interativos e seleção de aluno/período na listagem de contas.
- Rateio de um único recebimento entre várias contas e estorno parcial de um pagamento.
- Renovação automática, lembretes e integrações bancárias/de cobrança.
- Configuração de fuso por profissional e validação em aparelhos físicos.

Não há processamento bancário, débito automático, emissão fiscal nem interpretação do indicador antigo de pagamento como comprovante.

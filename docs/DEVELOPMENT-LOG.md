# Registro de desenvolvimento

## 03/11/2026 — Uso mais simples, cadastro, PDF e mensagens

Dashboard reduzido a atalhos visuais e dois indicadores, com grade de ações no celular. Editor de treino refeito em Aluno → Exercícios → Revisão: seleção múltipla, favoritos, cadastro rápido sem sair da montagem, abas por treino, cartões recolhíveis, campos avançados sob demanda e confirmação de publicação. Referência pública de interação MFIT consultada sem copiar conteúdo ou identidade.

Cadastro de aluno ganhou mensalidade combinada, frequência semanal, tratamento feminino/masculino/não informado e autorização de WhatsApp. Perfil profissional permite nome e CREF opcional, sem alterar identidade. Migrações aditivas aplicadas e testes transacionais hospedados com rollback passaram. Valores cadastrados não criam cobranças ou pagamentos.

Exportação PDF inclui a carteira inteira, contatos e frequência, com CREF quando preenchido. Consulta por cursor, fontes locais Noto Sans/OFL e geração no dispositivo. PDF de 205 alunos validado por extração de texto e revisão visual da primeira/última página. Integração web corrigida com override específico da dependência tslib de pdf-lib; não há configuração global de Metro desabilitando exports.

Modelos editáveis de vencimento e aniversário usam primeiro nome e tratamento escolhido. As mensagens podem ser abertas manualmente no WhatsApp após autorização e conferência do telefone. O proprietário usa somente o aplicativo no celular: não há conexão oficial, fila, dispatcher, agendamento ou envio automático ativo. A ativação depende da Plataforma WhatsApp Business, conforme MESSAGES.md. Nenhuma mensagem real foi enviada em testes.

Validação: 81 testes de domínio/PostgreSQL/PDF e 44 cenários de interface desktop/mobile; verificações de tipos, SDK e exportações universais. Testes usam somente fixtures e arquivos ignorados em work/. Homologação em aparelhos físicos permanece pendente.

## 03/11/2026 — Financeiro gerencial

Implementadas contas a receber/pagar, confirmações manuais parciais, estornos, descontos, juros/multas, contestações, cancelamentos e histórico. Planos e contratos preservam condições em snapshot e geram parcelas previstas. Recorrências só geram contas por ação explícita. Relatórios distinguem caixa confirmado, competência e saldos atuais, com detalhamento mensal, por categoria e aluno.

Migração aplicada ao Supabase hospedado sem importar ou alterar o histórico antigo. Teste transacional hospedado validou contrato, parcelas, recebimento parcial, quitação, estorno, despesa, relatório, restrições do aluno e cancelamento; rollback obrigatório removeu todos os registros de teste. Nova migração de índices e políticas cobre as FKs indicadas pelo advisor e consolida políticas financeiras equivalentes sem ampliar o acesso.

Validação local: 69 testes de domínio/PostgreSQL e 30 cenários Playwright desktop/mobile aprovados; TypeScript e matriz local do SDK Expo aprovados. A tela secundária Meu financeiro permite consulta do aluno às próprias cobranças e movimentações, sem operações de escrita e preservando as quatro abas principais. Capturas usam fixtures, fora do Git. Complementos financeiros pendentes em FINANCE.md; demais fases em ROADMAP.md. Chaves públicas locais permanecem fora do repositório. Dependências Supabase fixadas em versão exata.

## 03/11/2026 — Conexão hospedada e núcleo de treinos

O proprietário reafirmou que o briefing novo prevalece sobre a arquitetura antiga e autorizou a instalação das ferramentas necessárias. GitHub conectado: repositório Core identificado. Supabase conectado pela integração oficial e confirmado ACTIVE_HEALTHY.

As tabelas antigas e seus registros foram preservados. A fundação nova foi aplicada de forma aditiva; o usuário Auth existente do proprietário foi vinculado a professionals, e o proprietário confirmou login real na aplicação. Não foram redefinidas senhas. URL e chave publicável estão somente na configuração local ignorada pelo Git.

As funções administrativas antigas deixaram de ser executáveis por anon/authenticated; search_path foi fixado e grants anônimos das tabelas antigas revogados. Nenhuma rotina de limpeza foi executada. Advisor residual documentado em LEGACY-INTEGRATION.md.

Implementado núcleo de treinamento: biblioteca própria, favoritos/filtros/paginação, editor de programas, divisões, ordenação, parâmetros opcionais progressivos, duplicação de rascunho, aprovação explícita, snapshots imutáveis, área do aluno com quatro destinos, registro de séries/cargas/repetições/esforço/feedback e histórico recente.

Verificação: 35 testes de domínio/PostgreSQL e 20 cenários de interface desktop/mobile. Cenário transacional completo aprovado no PostgreSQL hospedado e revertido integralmente. Login real confirmado pelo proprietário. Imagens de QA usam somente fixtures e ficam em work/, fora do Git. Limitações de fase 2 documentadas em TRAINING.md.

Instalador Docker oficial baixado, hash e assinatura verificados; execução por usuário falhou na checagem VirtualMachinePlatform. WSL não instalado; firmware reporta virtualização desativada. Sem reinicialização ou mudanças de BIOS. O desenvolvimento prossegue no Supabase hospedado.

Workflow de qualidade preparado com actions fixadas em SHA. Nova arquitetura salva na branch codex/core-personal-universal e no PR em rascunho https://github.com/JorgeBelo/Core/pull/1, sem merge ou deploy automático. O primeiro CI passou por instalação, formatação, tipos e 35 testes; parou na recomendação remota de novos patches do Expo. A verificação de compatibilidade foi ajustada para conferir os módulos instalados diretamente contra bundledNativeModules.json do SDK fixado, usando semver da própria CLI, sem depender de recomendações remotas variáveis ou do modo offline com validação reduzida. Testes e exportações permanecem obrigatórios. Financeiro, avaliações, agenda, comunicação, complementos de treinamento e IA continuam pendentes conforme ROADMAP.md.

## 03/11/2026 — Fundação inicial

### Avaliação

Briefing integral lido e preservado. Workspace inicial sem aplicação existente. Encontrados Node 24.12.0, pnpm 11.25.0 e Git 2.52.0. npm não disponível no PATH. Pesquisa realizada em documentação oficial Expo/React Native/Supabase e nas referências públicas MFIT/Next Fit; links em ARCHITECTURE.md e RESEARCH.md.

O proprietário informou que ainda não possui projeto Supabase e solicitou preparação local. Supabase CLI 3.0.0 executou `--version`; `status` confirmou ausência de Docker/Podman no PATH. Não houve criação de contas, alteração de instalações do sistema, publicação ou contratação.

### Implementado

Monorepo pnpm em `outputs/core-personal`, aplicativo Expo universal e pacotes domain, ui e api-client. Versões alinhadas pelo template oficial e por `expo install --fix`. Router, design system, lateral recolhível, navegação mobile, login e recuperação, sessão por plataforma e perfis. Cadastro essencial de alunos com criação, edição, busca, paginação, inativação e detecção de edição concorrente. Dashboard calcula métricas dos dados persistidos quando conectado.

Migração cria profissionais, alunos/vínculos, notas privadas e auditoria; RLS e grants de coluna impedem mudança de tenant/identidade pelo cliente. Recursos de fases futuras são rotulados como planejados. Core AI tem somente contrato de provedor, sem chamadas.

Documentação técnica e de operação criada; configuração de ambiente local e perfis EAS preparados. Git inicializado sem commit e sem alterar identidade/configuração global do usuário. Formatação Prettier padroniza os arquivos.

### Verificação realizada

- TypeScript: sem erros.
- 21 testes de domínio/banco aprovados, executando migração real em PostgreSQL PGlite com uma camada Auth substituta.
- 16 testes Playwright aprovados: oito cenários desktop/mobile Chromium, com Auth/REST simulados somente no teste. Incluem cadastro, edição/inativação, bloqueios de interface, recuperação com sucesso/falha e encerramento de sessão de recuperação.
- `expo install --check`: dependências compatíveis. `pnpm peers check`: sem incompatibilidades após alinhamento e reinstalação pelo lockfile.
- Exportações de bundles JavaScript/Hermes Android, iOS e web aprovadas. Não são binários APK/IPA nem testes em aparelhos.
- Inspeção visual da tela pública em 1440×900 e 390×844: sem erros JavaScript ou overflow horizontal. Layout mobile de acesso foi reduzido após inspeção para priorizar o formulário.

### Limitações e continuidade

Homologação real de Supabase Auth, PostgREST, recuperação por e-mail, persistência entre sessões e acesso cruzado pelo serviço permanece pendente por falta do stack Docker local. Nenhuma alegação de produção pronta ou de fase 1 operacionalmente homologada.

Roteiro de homologação em OPERATIONS.md. Próximo passo operacional: instalar/iniciar Docker, subir Supabase, configurar `.env` e provisionar o profissional. Depois validar a fundação no backend real e em Android/iOS antes da fase 2.

Fotos, plano/contrato do aluno, observações privadas na interface, anamnese, treinos, execução, financeiro, agenda, mensagens, IA, offline, exportação/exclusão automatizada e backup automatizado permanecem para etapas posteriores. Sessão web é deliberadamente apenas em memória. Navegar fora do formulário por rotas globais pode descartar edição não salva; confirmação de descarte cobre os botões locais, sem bloqueio global de navegação nesta entrega.

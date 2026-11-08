# Core Personal offline

## Direção atual

Reconstrução da ideia inicial do proprietário: aplicativo para o personal administrar alunos, mensalidades, vencimentos, financeiro e lembretes, com dados no próprio celular e uso sem login ou internet. As imagens do app Swift e a descrição de 7 de novembro de 2026 são a referência de produto. A plataforma universal posterior continua preservada em `apps/mobile` e na branch `codex/core-personal-universal`, commit `a73f82da07cce9be8b4207e74e5712be61ee736b`.

A implementação nova fica em `apps/offline`. Não conecta ao backend anterior, não importa seus registros automaticamente e não altera suas tabelas. A ideia completa anterior permanece na documentação e no briefing local.

## Referência Swift recuperada

Conversa: **Erro de compatibilidade MacOS**. A consulta disponibilizou cinco interações recentes, incluindo código SwiftUI: `CadastroAlunoView`, `DetalhesAlunoView`, `AlunosViewModel` e `RelatoriosView`. Foram preservadas separadamente a resposta JSON, a transcrição e quatro arquivos Swift extraídos. Eles são referências históricas: não constituem um projeto Xcode completo, não foram compilados e contêm versões em correção. Não assumir que representam a última versão instalada pelo proprietário.

## Limites de produto e expansão

O CORE é gestão administrativa para personal trainers. Não inclui prescrição de treinos, fichas de exercícios ou execução de treinos. Frequência semanal representa atendimento contratado. Os três pilares são alunos, agenda e financeiro.

A primeira versão prioriza app instalado para celular e tablet, com componentes React Native, áreas seguras, teclado e layout adaptável. A versão web é prévia de desenvolvimento. Responsividade e experiência nativa precisam de teste em aparelhos físicos, incluindo teclado, fonte ampliada, telas pequenas, tablet e compartilhamento.

Ideias recuperadas de conversas com o Gemini, preservadas como possibilidades futuras sem presumir implementação: receitas e despesas completas, régua automática WhatsApp D-3/D0/D+2, comandos de voz/IA, contratos e assinatura digital, boletos e notas fiscais. Backup automático no Google Drive também fica para integração posterior. As integrações que usam serviços externos dependem de conexão. Nenhuma dessas ideias amplia automaticamente o escopo da base offline inicial.

## Marca

- Vermelho original: `#a20100`.
- Cinza original: `#b4b4b4`.
- Fundo escuro e cartões de navegação simples.
- Fonte da marca informada: AC Soft Icecream. O arquivo da fonte não foi fornecido; a logo e o ícone originais estão preservados sem redesenho. A interface usa a fonte do sistema.
- Medidas históricas informadas: Core 300 px; subtítulo 42 px; C 600 px. São referências do desenho original, não dimensões fixas de interface.

## Funcionalidades desta base

- Cadastro e edição de alunos com telefone, mensalidade, vencimento, frequência, nascimento e observações.
- Máscaras brasileiras de telefone, data e moeda.
- Arquivamento mantendo o histórico e os débitos.
- Mensalidades por mês, com valor e vencimento preservados após geração.
- Agenda diária e navegação semanal, com bloqueio de sobreposição, conclusão e cancelamento preservado no histórico. Sem recorrência automática nesta base.
- Registro integral e reversão manual de pagamento, com data.
- Previsto, recebido, em aberto e em atraso por mês de referência.
- Abertura manual do WhatsApp com mensagem pronta. O envio é confirmado pelo personal dentro do WhatsApp e requer conexão.
- Lembretes dentro do app e aniversariantes do dia. Notificações do sistema não estão implementadas.
- Relatórios de mensalidades em PDF e indicadores de frequência contratada.
- Backup JSON exportável, validação de restauração e preservação local do estado anterior à última restauração.

## Persistência e regras

No Android e iOS, `expo-sqlite` mantém um snapshot JSON versionado em uma linha de SQLite. Cada gravação é atômica; a restauração grava o estado anterior e o novo na mesma transação exclusiva. A interface publica o estado novo apenas após a gravação concluir. Falha na leitura não reinicializa silenciosamente a base. Na prévia web, usa localStorage separado por navegador/origem; limpar os dados do site remove esse armazenamento. Não existe sincronização entre plataformas.

Ao abrir o app, os meses transcorridos desde o cadastro são gerados sem duplicar os já existentes. Antes de editar condições, os meses pendentes são materializados com o valor anterior. A alteração vale para mensalidades ainda não geradas. O mês do arquivamento é mantido; meses posteriores não são gerados. Não há proporcionalidade automática nem reativação nesta entrega. Vencimentos 29–31 usam o último dia em meses menores.

Recebido significa mensalidades daquela referência marcadas como pagas. Não representa extrato bancário nem caixa por data de recebimento. Pagamentos parciais, Pix integrado e cobranças por API estão fora desta base.

Backups contêm dados pessoais em JSON sem criptografia adicional. Devem ser guardados pelo profissional em local privado. Backup automático no Google Drive, criptografia de backup e bloqueio por biometria permanecem etapas futuras. Login Google sozinho não realiza backup. O app instalado funciona sem depender dessas integrações.

## Executar

Na raiz do monorepo:

```powershell
pnpm install --frozen-lockfile
pnpm offline
```

Para prévia no navegador: `pnpm offline:web`. Para compilar a prévia: `pnpm offline:build`. O aplicativo anterior continua sendo aberto pelos comandos anteriores; `Abrir Core Offline.cmd` abre a nova prévia local na porta 4176.

## Verificação

```powershell
pnpm offline:typecheck
pnpm exec vitest run tests/offline.test.ts
pnpm offline:build
pnpm exec playwright test --config playwright.offline.config.ts
pnpm --filter @core/offline exec expo export --platform android --platform ios --output-dir dist-native
```

Testes web não substituem teste físico: assinatura, instaladores Android/iOS, restauração nativa, compartilhamento e WhatsApp em aparelhos reais ainda precisam de homologação. Exportar bundles não produz um app assinado nem publica em lojas.

## Validação desta entrega

TypeScript e exportação web passaram. Oito testes de domínio e quatro fluxos de interface passaram no Chrome, em tela de computador e em tamanho de iPhone: cadastro, pagamento, reabertura, edição sem rede, agenda com conflito, backup, restauração e rejeição de arquivo inválido. Bundles Hermes de Android e iOS foram gerados. Não foram gerados instaladores assinados nem executados testes físicos.

## Pacote para teste no iPhone

Compilação nativa Release concluída em macOS/Xcode 27.1, execução https://github.com/JorgeBelo/Core/actions/runs/42437061858. IPA gerado para iPhoneOS arm64, iOS mínimo 16.4, identificador `br.com.corepersonal.offline`, versão 0.1.0, build 1. Código Hermes embarcado; não depende do Metro para abrir após instalação.

O IPA foi baixado e teve os hashes externo e interno, CRCs, Info.plist, arquitetura Mach-O e presença do bundle verificados. O pacote precisa de assinatura pessoal antes de instalar. Com Apple ID gratuito, o proprietário pode usar um instalador como Sideloadly no computador; baixar do Drive não efetua a instalação. A assinatura gratuita exige renovação em sete dias. Não houve login Apple, provisionamento nem teste em aparelho físico nesta sessão.

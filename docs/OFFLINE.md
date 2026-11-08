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

- Cadastro rápido com nome, telefone, mensalidade, vencimento e frequência. Nascimento e observações ficam recolhidos como dados opcionais. Vencimento e frequência usam botões de mais/menos.
- Entrada com logo original em fade e perfil local do personal com nome, CREF opcional e foto.
- Cabeçalhos fixos de edição e perfil, com áreas seguras próprias nas janelas nativas.
- Máscaras brasileiras de telefone, data e moeda.
- Arquivamento mantendo o histórico e os débitos.
- Mensalidades por mês, com valor e vencimento preservados após geração.
- Dias e horários fixos configurados separadamente no perfil de cada aluno, depois do cadastro. As aulas se repetem semanalmente a partir da configuração.
- Expediente do personal em Ajustes: dias de trabalho e múltiplos turnos por dia.
- Agenda diária com abas Aulas e Horários livres. As vagas descontam aulas fixas e avulsas, respeitando os intervalos do expediente. Bloqueio de sobreposição e de novos horários fora do expediente configurado.
- Cancelar uma aula fixa libera somente aquela data; encerrar o horário fixo preserva as ocorrências anteriores. A frequência contratada não é automaticamente alterada pela agenda.
- Registro integral e reversão manual de pagamento, com data.
- Previsto, recebido, em aberto e em atraso por mês de referência.
- Abertura manual do WhatsApp com mensagem pronta. O envio é confirmado pelo personal dentro do WhatsApp e requer conexão.
- Lembretes dentro do app e aniversariantes do dia. Notificações do sistema não estão implementadas.
- Relatório para academia: todos os alunos ativos e frequência semanal contratada, identificação do personal e CREF. Não inclui telefones ou valores. PDF financeiro preservado como exportação separada em Financeiro.
- Backup JSON exportável, validação de restauração e preservação local do estado anterior à última restauração.

## Persistência e regras

No Android e iOS, `expo-sqlite` mantém um snapshot JSON versionado em uma linha de SQLite. Cada gravação é atômica; a restauração grava o estado anterior e o novo na mesma transação exclusiva. A interface publica o estado novo apenas após a gravação concluir. Falha na leitura não reinicializa silenciosamente a base. Na prévia web, usa localStorage separado por navegador/origem; limpar os dados do site remove esse armazenamento. Não existe sincronização entre plataformas.

Ao abrir o app, os meses transcorridos desde o cadastro são gerados sem duplicar os já existentes. Antes de editar condições, os meses pendentes são materializados com o valor anterior. A alteração vale para mensalidades ainda não geradas. O mês do arquivamento é mantido; meses posteriores não são gerados. Não há proporcionalidade automática nem reativação nesta entrega. Vencimentos 29–31 usam o último dia em meses menores.

Recebido significa mensalidades daquela referência marcadas como pagas. Não representa extrato bancário nem caixa por data de recebimento. Pagamentos parciais, Pix integrado e cobranças por API estão fora desta base.

A versão 0.2.0 mantém o mesmo identificador e arquivo SQLite da 0.1.0. Campos novos têm valores padrão na leitura dos dados antigos. Horários fixos e exceções por data são armazenados no mesmo snapshot; o backup inclui expediente e foto de perfil.

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

## Validação da versão 0.2.0

TypeScript e exportação web passaram. São 14 testes de domínio (mensalidades, compatibilidade com dados antigos, recorrência, exceções por data, vagas, conflitos e privacidade do relatório) e 15 fluxos de interface no Chrome, em tamanhos de computador, iPhone e tablet. O cabeçalho fixo também foi verificado em 320 × 568. O HTML do PDF foi impresso e renderizado para revisão visual com 45 alunos, em três páginas, incluindo nome extenso e caracteres especiais.

Esses testes não reproduzem o recorte físico do iPhone. A área segura nativa, seleção de foto e compartilhamento de PDF da nova versão ainda precisam ser conferidos no aparelho do proprietário.

## Pacote para teste no iPhone

A versão 0.1.0/build 1 foi compilada em macOS/Xcode e instalada pelo proprietário com Sideloadly, Apple ID gratuito e cabo de dados. O proprietário confirmou que o CORE abriu após autorizar o perfil e habilitar o Modo Desenvolvedor.

Atualização 0.2.0/build 2: compilação nativa na execução https://github.com/JorgeBelo/Core/actions/runs/42491554243, fonte `3837146727c57ccbea63b926b3f3958ee3c2163b`. Compilação concluída com sucesso; IPA baixado e verificado (SHA256 externo/interno, CRCs, Info.plist, arm64 e código embarcado).

Identificador mantido: `br.com.corepersonal.offline`. O pacote Release contém o JavaScript/Hermes e funciona sem Metro após a instalação. O IPA precisa ser assinado com o mesmo Apple ID utilizado anteriormente e instalado por cima do CORE existente. Não desinstalar para atualizar; exportar backup antes da atualização caso já existam dados importantes. A assinatura gratuita continua exigindo renovação em sete dias.

## Correção da abertura — 0.2.1/build 3

O proprietário testou a 0.2.0 no iPhone e relatou a logo ampliada/cortada. A abertura agora define largura e altura explícitas tanto na imagem quanto no contêiner animado, com limite de 320 pontos e margem nas duas dimensões da tela. Isso evita usar a altura intrínseca do PNG nativo com apenas largura/aspectRatio definidos. A imagem original permanece intacta, centralizada com contain sobre preto.

A tela de lançamento nativa fica preta até a imagem carregar e a primeira disposição da abertura terminar. Depois a logo ganha opacidade durante 550 ms, permanece visível por 650 ms e abre o app. Sem zoom ou fade out. A versão em Ajustes vem do app.json para acompanhar o pacote.

Os 15 fluxos existentes passaram novamente. Três verificações adicionais de abertura (computador, celular e tablet) passaram, conferindo enquadramento completo, centro, proporção, fundo preto e transição até o app. O workflow iOS também compila a variante de simulador Release e captura a sequência real de lançamento para inspeção visual. A confirmação final desta correção no aparelho do proprietário continua pendente.

Compilação 0.2.1: https://github.com/JorgeBelo/Core/actions/runs/42494962549, fonte `d2ef78ae111f86a70f1d6e41133082a1c923bf38`. IPA arm64/build 3 baixado e verificado (hash externo/interno, CRCs, Info.plist e código embarcado). As verificações gerais do repositório passaram.

O app abriu no simulador iOS Release, mas as 14 capturas começaram depois da intro e mostram o perfil inicial. Elas NÃO confirmam visualmente a animação nativa. Proporção/centro/fundo foram verificados na prévia web; a confirmação final no iPhone está pendente. O script foi ajustado para gravar vídeo antes de executar simctl launch nas próximas compilações; essa gravação nova ainda não foi executada.

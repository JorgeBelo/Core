# Retomada do Core em 7 de novembro de 2026

## Produto e direção escolhida

O CORE volta à ideia inicial: gestão administrativa de alunos, agenda e financeiro para personal trainers, com foco em aplicativo instalado no celular e tablet, uso offline e simplicidade. Não inclui prescrição de treinos ou fichas de exercícios. O proprietário quer aparência e comportamento de app nativo.

A base nova está em `apps/offline`, com TypeScript, React Native, Expo SDK 58 e SQLite no aparelho. O aplicativo universal anterior, o briefing completo e as referências Swift foram preservados. A branch anterior `codex/core-personal-universal` permanece no commit `a73f82da07cce9be8b4207e74e5712be61ee736b`. As imagens recuperadas e a transcrição parcial de Swift estão no backup local, não no repositório público.

## O que está feito

- Alunos, mensalidades mensais com histórico, registro e reversão de pagamento, totais financeiros, lembretes dentro do app, relatórios e backup com restauração.
- Agenda diária com navegação semanal e bloqueio de conflito de horários.
- Cobrança manual: abre o WhatsApp com mensagem preenchida; o profissional revisa e envia.
- TypeScript, oito testes de domínio e quatro fluxos de interface passaram. A interface foi inspecionada em tamanho de celular.
- Compilação nativa Release do iPhone concluída com sucesso em Xcode 27.1. Execução: https://github.com/JorgeBelo/Core/actions/runs/42437061858.
- IPA verificado: arm64, iPhoneOS, iOS mínimo 16.4, versão 0.1.0, build 1, identificador `br.com.corepersonal.offline`. O código está embarcado, sem depender de Metro após a instalação.

O IPA ainda precisa ser assinado para o aparelho. Nenhum teste físico foi realizado. Não confundir exportação de bundles, compilação nativa e homologação em iPhone real.

## Situação da instalação

O proprietário tem somente Apple ID gratuito e não tem acesso a Mac. O Windows não reconhece seu iPhone; o cabo é paralelo, mas não foi confirmado se suporta dados. Não houve diagnóstico dos drivers ou da conexão USB.

Foi explicado que Modo Desenvolvedor sozinho não dispensa assinatura. Com Apple ID gratuito, Sideloadly pode assinar e instalar, e a assinatura precisa ser renovada após sete dias, sem cobrança por renovação. O primeiro pareamento para uso posterior por Wi-Fi requer USB.

Expo Go via Wi-Fi, serviço de assinatura pago e PWA offline foram discutidos como alternativas. O proprietário não autorizou migração para PWA nem contratou serviços. Manter o app nativo como direção vigente. Não presumir que Sideloadly já esteja instalado ou que algum perfil tenha sido configurado no iPhone.

## Próximo passo

Resolver o reconhecimento USB para instalar o IPA gratuitamente: conferir cabo de dados, porta, aparelho desbloqueado, confiança no computador e componentes Apple do Windows. Não remover instalações Apple existentes indiscriminadamente. Se necessário, testar outro cabo compatível com dados. O proprietário deve inserir credenciais e confirmar ações no próprio aparelho ou no fluxo oficial; não solicitar senha ou código no chat.

Após instalar, testar cadastro, reabertura, modo offline, pagamento, conflito de agenda e exportação de backup. Configurar pareamento por Wi-Fi quando disponível. Preservar identificador e dados nas atualizações e exportar backup antes de apagar o app.

## Arquivos de entrega locais

Pasta: `C:/Users/Jorge-PC/Documents/Codex/2026-11-07/co/outputs`.

- `Core-iPhone-teste.ipa` — pacote para assinatura pessoal.
- `Core-iPhone-teste-SHA256.txt` e `Core-iPhone-teste-verificacao.json` — integridade e metadados.
- `INSTALAR-CORE-NO-IPHONE.txt` — instruções de instalação.
- `core-personal-offline-source.zip` — fontes atuais.
- `core-preservado/` — projeto anterior, histórico Git, 21 imagens e trechos Swift recuperados.

SHA256 do IPA: `7af01e765d38b6997a620608f359498203d7019846340262dd0708698aeac053`.

O artefato da compilação no GitHub tem retenção limitada; a cópia IPA local foi preservada separadamente. Não iniciar nova compilação apenas para retomar esta instalação.

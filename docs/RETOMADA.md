# Retomada do Core em 8 de novembro de 2026

## Direção e preservação

Aplicativo nativo offline para celular/tablet, com gestão administrativa de alunos, agenda e mensalidades. Sem prescrição de treinos. TypeScript, React Native/Expo 58 e SQLite local em `apps/offline`. Não migrar para PWA ou depender de computador no uso diário.

O projeto universal posterior permanece preservado em `apps/mobile` e na branch `codex/core-personal-universal`, commit `a73f82da07cce9be8b4207e74e5712be61ee736b`. As 21 imagens, o briefing completo e a recuperação parcial da conversa Swift estão no backup local `outputs/core-preservado`.

## Instalação física já resolvida

O cabo Motorola permitiu conectar e confiar no computador. Sideloadly e componentes oficiais Apple estão instalados. O usuário assinou com seu Apple ID gratuito, viu Done, autorizou o perfil pessoal e ativou o Modo Desenvolvedor no iPhone. Confirmou que o CORE 0.1.0 abriu. Não repetir a investigação de cabo, instalar componentes novamente ou tratar a primeira instalação como pendente.

Manter a mesma conta, identificador e dados para atualizar. Não pedir senha/código Apple no chat nem automatizar autenticação. Renovação gratuita a cada sete dias pelo Sideloadly.

## Ajustes solicitados e implementados na 0.2.0

- Logo original central com fade de aproximadamente um segundo.
- Perfil local do personal com nome, CREF e foto opcional.
- Início com recebido/falta receber e atalhos.
- Cadastro básico curto; nascimento e observações opcionais recolhidos; vencimento e frequência com +/−.
- Dias e horários semanais em **Alunos → perfil do aluno → Organizar dias e horários**, separados do cadastro.
- Expediente em **Ajustes → Meus horários de trabalho**, com dias e vários períodos, como 06–11 e 15–20.
- Agenda com Aulas/Horários livres: desconta aulas fixas e avulsas do expediente e bloqueia sobreposição. Cancelar ocorrência libera só a data; encerrar recorrência mantém o passado.
- Relatório para academia com todos os ativos e frequência semanal; sem dados de cobrança/telefone. Exportação financeira permanece em Financeiro.
- Cabeçalho fixo de voltar/cancelar/salvar e provedor de área segura próprio na janela nativa. Uma janela para alternar perfil e edição evita apresentações nativas simultâneas.
- Leitura compatível com snapshot e backup antigos. SQLite e identificador mantidos.

## Verificação

14 testes de domínio e 15 fluxos de interface passaram em computador, tamanho de iPhone e tablet. Incluem backup, pagamentos, reabertura sem rede, horário fixo, turnos, vagas, conflito e cabeçalho fixo em 320 × 568. PDF de 45 alunos em três páginas renderizado e inspecionado. Não equivalem à homologação da versão nova em aparelho físico.

Fonte da atualização: `3837146727c57ccbea63b926b3f3958ee3c2163b`. Compilação iOS 0.2.0/build 2: https://github.com/JorgeBelo/Core/actions/runs/42491554243. Compilação concluída com sucesso; pacote baixado e verificado. As verificações gerais do repositório também passaram.

## Entrega e próximo passo

Pasta local: `C:/Users/Jorge-PC/Documents/Codex/2026-11-07/co/outputs`.

`Core-iPhone-v0.2.0.ipa` é a atualização para assinatura pessoal. `Core-iPhone-teste.ipa` preserva a versão 0.1.0 anterior. As fontes atuais e o histórico Git continuam nos arquivos ZIP/bundle. O estado da entrega e os hashes estão nos JSONs dessa pasta.

Instalar a 0.2.0 pelo Sideloadly por cima da versão atual, usando a mesma conta. Conferir no aparelho: topo fora do recorte das câmeras, teclado, foto, fade, PDF/compartilhamento, fluxo de dias/horários e dados preservados. Manter os dados no aparelho e exportar backup; nuvem automática ainda não implementada.

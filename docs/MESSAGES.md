# Mensagens e relatórios

## Disponível

- Mensalidade combinada e frequência semanal no cadastro, na listagem e no resumo do aluno.
- Perfil do personal com nome e CREF opcional; deixar o CREF vazio não impede cadastro, uso ou PDF.
- Tratamento feminino/masculino/não informado para personalizar os parabéns. A opção não informada usa texto neutro.
- Modelos editáveis de vencimento, aniversário feminino, masculino e neutro. Campos disponíveis: `{nome}`, `{personal}`, `{valor}` e `{vencimento}`. O nome usa o primeiro nome do cadastro.
- Mensagens de cobrança para contas com vencimento hoje, saldo positivo, sem contestação ou cancelamento. Pagamentos parciais usam o saldo atual. Mensalidade cadastrada sozinha não gera cobrança.
- Aniversariantes ativos do dia conforme America/Sao_Paulo. A comparação usa dia e mês da data cadastrada; 29/02 aparece em anos bissextos, sem antecipação automática.
- Preparação local do texto e botão Abrir no WhatsApp, condicionado a telefone válido e autorização cadastrada. O usuário revisa e confirma no WhatsApp. Abrir a conversa não é tratado como envio, entrega ou leitura.
- Datas atualizam durante o uso e os dados são recarregados ao retornar à tela conforme o cache de consulta.

## Envio automático pendente

O proprietário informou possuir somente o aplicativo no celular. Não há conta da Plataforma WhatsApp Business/Cloud API conectada, credenciais de servidor ou modelos aprovados. Portanto **nenhuma mensagem é enviada automaticamente e não há agendamento ou dispatcher ativo**.

Para ativar posteriormente: habilitar um número na plataforma oficial ou provedor autorizado, aprovar os modelos necessários, guardar credenciais apenas no servidor, implementar fila por profissional/aluno/evento/data com idempotência, agendamento em fuso configurável, retentativas limitadas e validação de webhooks. O dispatcher deve revalidar saldo, situação da cobrança, telefone, autorização e aniversários antes de enviar. Interromper envios quando a autorização for retirada. Custos e condições do serviço devem ser avaliados antes de contratação; nada foi contratado nesta etapa.

Referência oficial: https://whatsappbusiness.com/products/business-platform/. Não colocar tokens de WhatsApp em variáveis EXPO_PUBLIC nem automatizar sessões pessoais por ferramentas não oficiais.

## PDF de todos os alunos

O botão Exportar todos em PDF, na tela Alunos, consulta a carteira completa do profissional com paginação por cursor, independentemente da busca e da página visíveis. Inclui ativos e inativos; colunas: nome, telefone, e-mail, frequência combinada e situação. O cabeçalho inclui profissional, CREF quando preenchido e data/hora. Não inclui anamnese, notas privadas, mensagens, dados financeiros nem outros campos de saúde.

Geração ocorre no dispositivo, com pdf-lib e fontes Noto Sans Regular/Bold sob SIL OFL incluídas no projeto. Não envia dados para um serviço externo de criação de documentos. No navegador, baixa um PDF; no Android/iOS, cria um arquivo no cache privado e abre o compartilhamento do sistema. O compartilhamento físico ainda requer homologação em aparelhos.

Textos longos quebram dentro da célula e cabeçalhos/rodapés se repetem em todas as páginas. Caracteres fora da cobertura da fonte são substituídos por `?`; português e acentos são preservados. A exportação é uma fotografia gerencial do momento da consulta, não uma transação de snapshot entre todas as páginas se houver alterações simultâneas.

Validação: PDF com 205 alunos, extração conferindo todos os nomes e acentos e revisão visual da primeira/última página. Testes de navegador baixam a carteira completa mesmo com busca restrita. O override específico `pdf-lib>tslib: 2.8.1` resolve a incompatibilidade ESM da dependência antiga no Metro; lockfile e testes de download cobrem essa integração.

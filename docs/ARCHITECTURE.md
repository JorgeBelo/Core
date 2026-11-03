# Arquitetura — Core Personal

Decisão em 03/11/2026: aplicativo universal Expo, TypeScript, React Native, React Native Web e Expo Router. Supabase fornece Auth e PostgreSQL. Não há aplicativo Windows, serviço C# ou projeto web redundante.

## Estrutura implementada

- `apps/mobile`: rotas universais, composição de telas, sessão e adaptação de layout.
- `packages/ui`: tokens e componentes React Native reutilizáveis.
- `packages/domain`: entidades, validações Zod e contrato de provedor de IA.
- `packages/api-client`: operações Supabase, paginação, agregações e erros.
- `packages/reports`: geração local de PDF com fontes Noto Sans licenciadas sob OFL, sem envio da carteira a serviços de documentos.
- `supabase/migrations`: fonte versionada do esquema e das permissões.
- `tests`: validações, migração executada em PostgreSQL embarcado e testes de interface isolados.

Um pacote separado de config ou validation não agrega valor nesta entrega. Validações ficam no domínio, tokens no UI e configurações no app. Podem ser extraídos quando houver consumidores que justifiquem isso.

## Versões verificadas

Registry consultado e template oficial baixado: Expo 58.0.22, React 19.3.0, React Native 0.88.1, TypeScript 6.0.3. O template e `expo install --fix` definem a compatibilidade, em vez de atualizar React Native isoladamente. Versões exatas transitivas constam em `pnpm-lock.yaml`. As páginas de calendário podem apresentar informação defasada; o registry e a matriz da documentação foram cruzados.

## Fluxo de acesso

Auth autentica → sessão carrega profissional pelo `auth.uid()` → conta profissional obtém área de gestão; conta de aluno obtém somente próprio cadastro ativo; conta sem vínculo recebe estado de acesso pendente. Não existe seleção de perfil no cliente nem elevação por metadados editáveis. Provisionamento de perfis ocorre em ambiente administrativo confiável.

As rotas e o layout orientam a navegação, mas o PostgreSQL é a autoridade de acesso. Trocar parâmetros ou chamar REST diretamente não concede acesso entre profissionais. RLS usa função em schema privado para obter o profissional, sem recursão de políticas.

## Estado e persistência

TanStack Query mantém cache em memória, segregado por identidade e limpo na mudança de usuário. Cadastros só são confirmados depois da resposta do servidor. Não há banco paralelo local, modo demo ou dados sem persistência. Listagem é paginada em 20 registros. Formulário usa validação compartilhada; banco revalida constraints essenciais. Edição condiciona `updated_at` para detectar gravações concorrentes.

Web mantém tokens apenas em memória (recarregar exige login). Mobile usa Expo SecureStore; auto-refresh acompanha o estado do aplicativo. Não persistimos dados pessoais em cache de disco. Offline e sincronização ficam para fase posterior.

Exceção intencional: o PDF solicitado pelo profissional é baixado no navegador ou criado no cache privado do aplicativo para compartilhamento pelo sistema no Android/iOS. O arquivo contém dados pessoais de contato; a cópia compartilhada fica sob controle do destino escolhido. Não é sincronizado como cache offline de cadastros.

O perfil profissional pode ser atualizado localmente com a resposta autenticada do servidor, sem desmontar a navegação. Identidade e permissões continuam impostas pelo Auth e pela RLS. Mensagens WhatsApp são preparadas em memória e só abrem o aplicativo após ação e autorização cadastrada; não existe dispatcher ou agendamento ativo nesta etapa.

## Limites da entrega

Fundação, núcleo de treinamento e financeiro gerencial estão migrados; os demais domínios estão planejados em DATABASE.md. Apenas o contrato de IA existe; nenhum provedor é chamado. Fotos e dados clínicos não têm fluxos de coleta nesta etapa. A base é evolutiva: arquitetura definitiva não significa esquema congelado.

O Supabase existente foi conectado e as novas tabelas coexistem com o legado. Ver LEGACY-INTEGRATION.md. Publicações de treino são snapshots imutáveis produzidos por operação explícita no servidor; execução é uma entidade separada e idempotente. Ver TRAINING.md.

Financeiro separa obrigação prevista de movimentação confirmada. Pagamentos, estornos e ajustes são imutáveis; RPCs derivam identidade do Auth, bloqueiam a conta e conferem o saldo. Contratos guardam snapshots; geração de recorrências não confirma recebimento. Ver FINANCE.md.

## Fontes oficiais consultadas

- https://docs.expo.dev/versions/latest/ — matriz de compatibilidade.
- https://expo.dev/changelog/sdk-58 — versão do SDK.
- https://reactnative.dev/releases/ — releases do React Native.
- https://docs.expo.dev/router/advanced/authentication/ — autenticação e armazenamento.
- https://supabase.com/docs/guides/auth/quickstarts/react-native — cliente Auth.
- https://supabase.com/docs/guides/database/postgres/row-level-security — políticas e grants.

Os links e a análise refletem consulta de 03/11/2026; verificar novamente antes de atualizações ou distribuição.

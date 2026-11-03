# Core Personal

Plataforma universal para acompanhamento de alunos por personal trainers. Fundação em React Native + Expo + TypeScript + Supabase, com a identidade Core em preto, vermelho e branco.

**Entrega atual:** fundação conectada ao Supabase hospedado, núcleo de treinos e financeiro gerencial implementados. O proprietário confirmou login real. Os fluxos transacionais de treino e financeiro passaram no PostgreSQL hospedado com rollback dos testes. Não há dados de demonstração no aplicativo. Avaliações, agenda, comunicação, IA e os complementos documentados permanecem em desenvolvimento.

## O que já existe

- Aplicativo universal Android, iOS e web com Expo Router.
- Design system compartilhado, layout web com lateral recolhível e navegação inferior mobile.
- Login, recuperação por código de e-mail, saída e perfis profissional/aluno.
- Cadastro essencial persistido de alunos: criação, busca paginada, edição e inativação.
- Dashboard com dados da carteira: ativos, inativos, novas entradas e últimos cadastros.
- PostgreSQL com migração, RLS, restrições de coluna, isolamento por profissional e auditoria de gravações.
- Validações compartilhadas, tratamento de erro e proteção contra sobrescrita de edição concorrente.
- Biblioteca própria de exercícios com filtros, favoritos, edição, arquivamento e links de vídeo licenciados.
- Editor de programas, divisões, ordenação, parâmetros opcionais, duplicação e aprovação explícita.
- Versões publicadas imutáveis e área do aluno com registro de séries, cargas, repetições, esforço e histórico.
- Contas a receber/pagar, pagamentos parciais manuais, estornos, ajustes, contestações e histórico.
- Planos, contratos com snapshot, parcelas previstas e recorrências sob confirmação explícita.
- Relatórios de caixa confirmado, competência, saldos em aberto, séries mensais, categorias e alunos. Escopo e limites em [FINANCE.md](docs/FINANCE.md).
- Consulta do aluno às próprias cobranças e movimentações, em tela secundária sem operações de escrita.

## Ambiente hospedado configurado

O projeto Supabase existente foi reutilizado com tabelas novas. Os registros das tabelas antigas foram preservados; não houve importação automática para o modelo novo. O `.env` local contém apenas URL e chave publicável e é ignorado pelo Git. Seu usuário Auth existente foi vinculado ao perfil profissional da nova aplicação.

Para iniciar neste checkout:

```powershell
pnpm web
```

Para a prévia já compilada: `node scripts/serve-web.mjs --port 4174`, abrindo `http://127.0.0.1:4174/home`. Use as credenciais existentes do Core. As migrações versionadas da fundação, segurança, treinos e financeiro já foram aplicadas no projeto hospedado. Não reaplicá-las manualmente.

Leia [a integração com o legado](docs/LEGACY-INTEGRATION.md) antes de migrar dados ou alterar ambientes. O briefing novo é a especificação vigente; o modelo antigo não limita o produto novo.

## Ambiente inspecionado

Windows / PowerShell; Node 24.12.0; Git 2.52.0; pnpm 11.25.0. npm não estava no PATH, por isso os comandos usam pnpm. A instalação oficial do Docker foi tentada e parou porque VirtualMachinePlatform não está habilitado. O WSL está ausente e o firmware informa virtualização desativada. O ambiente hospedado já permite desenvolver sem esses pré-requisitos locais. Dependências e lockfile estão incluídos.

## Abrir o projeto

No PowerShell, a partir desta pasta:

```powershell
pnpm install --frozen-lockfile
pnpm web
```

Em uma cópia nova, configure `.env` para o backend desejado. Se não houver configuração, o app exibe o estado de preparação sem permitir cadastros locais simulados.

## Preparar Supabase local

1. Instalar Docker Desktop com suporte a containers Linux/WSL2 e iniciar o engine. Essa instalação não foi realizada automaticamente, pois altera o sistema e pode exigir reinicialização.
2. Nesta raiz, iniciar a configuração versionada:

```powershell
pnpm dlx supabase@3.0.0 start
pnpm dlx supabase@3.0.0 status
```

O primeiro comando deve aplicar as migrações na inicialização de uma base nova. Em uma base local já existente, aplicar apenas migrações pendentes:

```powershell
pnpm dlx supabase@3.0.0 migration up --local
```

Não use `db reset` em banco com dados úteis. Não é necessário executar `supabase init`: `supabase/config.toml` já existe.

3. Copiar o arquivo de exemplo:

```powershell
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

4. Preencher `.env` com a URL da API e a chave **publicável ou anon** exibidas no ambiente local:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=CHAVE_PUBLICA_LOCAL
```

Nunca colocar `service_role`, chave secreta ou senha de banco no app. O arquivo `.env` está ignorado pelo Git.

5. Acessar o Studio informado por `supabase status` (porta local configurada: 54323), criar usuário em Authentication e vinculá-lo a `professionals`. SQL e instruções de recuperação em [OPERATIONS.md](docs/OPERATIONS.md).
6. Reiniciar `pnpm web`; entrar com a conta provisionada; cadastrar um aluno e conferir o dashboard.

Em celular físico, `127.0.0.1` aponta para o próprio aparelho. Configure a URL pelo IP local do computador, com rede/firewall permitindo o acesso, ou use um backend de desenvolvimento acessível com HTTPS. Emulador Android pode usar o endereço específico do host do emulador. Não publicar chaves/serviços locais na internet.

## Android e iOS

```powershell
pnpm dev
```

Use Expo Go compatível com SDK 58 ou um development build. O código é universal; builds instaláveis, assinatura, push e testes físicos ainda não foram realizados. `eas.json` prepara perfis sem criar projeto remoto ou contratar serviço. Identificadores de aplicativo são provisórios.

## Verificação

```powershell
pnpm typecheck
pnpm test
pnpm sdk:check
pnpm build:web
pnpm exec playwright install chromium
pnpm test:ui
```

- 69 testes de domínio/banco, incluindo aprovação, imutabilidade, idempotência, isolamento e regras financeiras.
- 30 testes de interface em viewport desktop e mobile Chromium. Auth/REST são fixtures exclusivas do teste, separadas do aplicativo.
- `tests/live-training-rollback.sql`: cenário executado no Supabase hospedado com identidades Auth existentes, troca de roles e rollback integral dos dados de teste.
- `tests/live-finance-rollback.sql`: contrato, parcelas, pagamentos, estorno, despesa, relatório, RLS e cancelamento validados no Supabase hospedado com rollback integral.
- Login real confirmado pelo proprietário. Recuperação por e-mail no ambiente hospedado e dispositivos físicos ainda precisam de homologação.

O GitHub Actions executa formatação, TypeScript, banco, interface e exportação universal, sem credenciais do banco hospedado. A configuração Vercel desta branch desabilita deploy automático; não houve publicação do app.

`sdk:check` compara as versões instaladas com a matriz do SDK Expo fixado. A consulta online `expo install --check` também pode ser usada ao planejar atualizações, mas suas recomendações de patches podem mudar sem alteração do lockfile.

O build de UI para testes é separado em `work/e2e-web`; a chave e a URL falsas de testes nunca são usadas no build normal. Para visualizar o build público normal:

```powershell
pnpm build:web
pnpm preview
```

Abrir `http://127.0.0.1:4173`. O servidor de preview é apenas local. Hospedagem web precisa servir `index.html` como fallback para rotas do Expo Router e usar HTTPS.

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Requisitos](docs/REQUIREMENTS.md). O briefing integral está preservado apenas no checkout local, fora do Git.
- [Banco e entidades futuras](docs/DATABASE.md)
- [Design system](docs/DESIGN-SYSTEM.md)
- [Roadmap](docs/ROADMAP.md)
- [Referências públicas](docs/RESEARCH.md)
- [Operação, provisionamento e segurança](docs/OPERATIONS.md)
- [Registro de desenvolvimento](docs/DEVELOPMENT-LOG.md)

Nenhuma publicação, contratação, cobrança, envio automático a alunos ou integração de IA foi executada. Antes de uso real, concluir configuração, homologação e procedimentos de privacidade, backup e recuperação.

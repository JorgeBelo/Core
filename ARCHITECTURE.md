# Core - Gestão para Personal Trainers
## Arquitetura do Sistema

---

## 📋 VISÃO GERAL

Sistema SaaS de gestão administrativa para personal trainers, desenvolvido com React + TypeScript no front-end e arquitetura moderna de back-end.

---

## 🏗️ ARQUITETURA GERAL

### Front-End (React + TypeScript + Vite)
- **Framework**: React 19.2.0 com TypeScript
- **Build Tool**: Vite 7.2.4
- **Roteamento**: React Router DOM
- **Gerenciamento de Estado**: Context API + React Hooks (futuro: Zustand/Redux)
- **Estilização**: Tailwind CSS + CSS Modules
- **Tema**: Dark mode obrigatório com cores oficiais da marca

### Back-End (Sugestão)
- **Runtime**: Node.js com Express ou NestJS
- **Banco de Dados**: PostgreSQL (recomendado) ou MySQL
- **Autenticação**: JWT (JSON Web Tokens)
- **ORM**: Prisma ou TypeORM
- **Validação**: Zod ou Joi
- **API**: RESTful ou GraphQL

---

## 📁 ESTRUTURA DE PASTAS DO PROJETO

```
core-frontend/
├── public/
│   └── fonts/              # Fontes customizadas (AC Soft Icecream)
├── src/
│   ├── assets/            # Imagens, ícones, logos
│   ├── components/         # Componentes reutilizáveis
│   │   ├── common/        # Botões, inputs, cards, modais
│   │   ├── layout/        # Header, Sidebar, Footer, Layout
│   │   └── charts/        # Componentes de gráficos
│   ├── contexts/          # Context API (Auth, Theme, Notifications)
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Páginas/rotas do sistema
│   │   ├── auth/         # Login, Cadastro
│   │   ├── dashboard/    # Dashboard principal
│   │   ├── alunos/       # Lista, Cadastro, Detalhes
│   │   ├── aulas/        # Gestão de aulas
│   │   ├── financeiro/   # Mensalidades, Relatórios
│   │   ├── agenda/       # Calendário e agenda
│   │   └── perfil/       # Perfil do personal
│   ├── services/         # API calls, serviços externos
│   ├── types/            # TypeScript types/interfaces
│   ├── utils/            # Funções utilitárias
│   ├── styles/           # Estilos globais, tema
│   ├── App.tsx           # Componente raiz
│   └── main.tsx          # Entry point
├── docs/                 # Documentação adicional
└── ARCHITECTURE.md       # Este arquivo
```

---

## 🗄️ MODELO DE BANCO DE DADOS

### Tabelas Principais

#### 1. `users` (Personal Trainers)
```sql
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- phone (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. `alunos` (Alunos)
```sql
- id (UUID, PK)
- personal_id (UUID, FK -> users.id)
- name (VARCHAR)
- birth_date (DATE)
- phone (VARCHAR)
- whatsapp (VARCHAR)
- frequency_per_week (INTEGER)
- monthly_fee (DECIMAL)
- start_date (DATE)
- observations (TEXT)
- active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. `aulas` (Aulas Realizadas)
```sql
- id (UUID, PK)
- aluno_id (UUID, FK -> alunos.id)
- personal_id (UUID, FK -> users.id)
- date (DATE)
- time (TIME)
- status (ENUM: 'realizada', 'falta', 'reposicao')
- is_reposition (BOOLEAN)
- notes (TEXT)
- created_at (TIMESTAMP)
```

#### 4. `mensalidades` (Mensalidades)
```sql
- id (UUID, PK)
- aluno_id (UUID, FK -> alunos.id)
- personal_id (UUID, FK -> users.id)
- due_date (DATE)
- amount (DECIMAL)
- status (ENUM: 'pago', 'pendente', 'atrasado')
- paid_date (DATE, NULLABLE)
- payment_method (VARCHAR, NULLABLE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 5. `notifications` (Notificações)
```sql
- id (UUID, PK)
- personal_id (UUID, FK -> users.id)
- type (ENUM: 'aniversario', 'vencimento', 'atraso', 'aula')
- title (VARCHAR)
- message (TEXT)
- related_id (UUID, NULLABLE) -- ID do aluno, mensalidade, etc
- read (BOOLEAN)
- created_at (TIMESTAMP)
```

#### 6. `agenda` (Agenda/Horários)
```sql
- id (UUID, PK)
- personal_id (UUID, FK -> users.id)
- aluno_id (UUID, FK -> alunos.id, NULLABLE)
- date (DATE)
- time (TIME)
- duration (INTEGER) -- minutos
- status (ENUM: 'agendado', 'livre', 'cancelado')
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Relacionamentos
- Um Personal Trainer tem muitos Alunos (1:N)
- Um Aluno tem muitas Aulas (1:N)
- Um Aluno tem muitas Mensalidades (1:N)
- Um Personal Trainer tem muitas Notificações (1:N)
- Um Personal Trainer tem muitos Horários na Agenda (1:N)

---

## 🎨 IDENTIDADE VISUAL

### Cores Oficiais
- **Vermelho Principal**: `#a20100` - Botões, links, destaques
- **Cinza Claro**: `#b4b4b4` - Textos secundários, bordas
- **Preto Fundo**: `#000000` ou `#1a1a1a` - Fundo principal
- **Branco**: `#ffffff` - Textos principais em contraste

### Tipografia
- **Logo/Títulos**: AC Soft Icecream (fonte customizada)
- **Sistema**: Inter ou Poppins (sans-serif moderna)

### Tema Dark Mode
- Fundo escuro como padrão
- Alto contraste vermelho/preto
- Visual premium e profissional

---

## 📱 TELAS DO SISTEMA

### Autenticação
1. **Login** - Email e senha
2. **Cadastro** - Dados do personal trainer
3. **Recuperação de Senha** - Reset via email

### Dashboard
4. **Dashboard Principal** - Visão geral com métricas e resumo

### Alunos
5. **Lista de Alunos** - Tabela com filtros e busca
6. **Cadastro de Aluno** - Formulário completo
7. **Detalhes do Aluno** - Perfil completo, histórico, mensalidades

### Aulas
8. **Histórico de Aulas** - Lista de todas as aulas
9. **Registro de Aula** - Formulário para nova aula
10. **Controle de Reposições** - Gerenciamento de reposições

### Financeiro
11. **Mensalidades** - Lista com filtros por status
12. **Relatório Financeiro** - Gráficos e totais mensais
13. **Registro de Pagamento** - Marcar mensalidade como paga

### Agenda
14. **Calendário Semanal** - Visualização semanal
15. **Calendário Mensal** - Visualização mensal
16. **Agendamento** - Criar/editar horários

### Perfil
17. **Perfil do Personal** - Dados pessoais e profissionais
18. **Configurações** - Preferências do sistema

### Notificações
19. **Central de Notificações** - Lista de notificações

---

## 🔄 FLUXO DE NAVEGAÇÃO

```
Login → Dashboard
  ├── Alunos
  │   ├── Lista
  │   ├── Cadastro
  │   └── Detalhes
  ├── Aulas
  │   ├── Histórico
  │   └── Registrar
  ├── Financeiro
  │   ├── Mensalidades
  │   └── Relatórios
  ├── Agenda
  │   ├── Semanal
  │   └── Mensal
  ├── Notificações
  └── Perfil
```

---

## 📦 BIBLIOTECAS RECOMENDADAS

### Essenciais
- `react-router-dom` - Roteamento
- `axios` - Requisições HTTP
- `date-fns` - Manipulação de datas
- `react-hook-form` - Formulários
- `zod` - Validação de schemas

### UI/UX
- `tailwindcss` - Estilização utilitária
- `lucide-react` - Ícones modernos
- `recharts` ou `chart.js` - Gráficos
- `react-calendar` ou `react-big-calendar` - Calendário
- `react-hot-toast` - Notificações toast

### Utilitários
- `clsx` - Classes condicionais
- `react-query` ou `swr` - Gerenciamento de estado servidor
- `jwt-decode` - Decodificar JWT

---

## 🔒 SEGURANÇA

### Front-End
- Validação de formulários no cliente
- Proteção de rotas com autenticação
- Armazenamento seguro de tokens (httpOnly cookies ou localStorage)
- Sanitização de inputs

### Back-End (Sugestão)
- Autenticação JWT com refresh tokens
- Validação de dados com Zod/Joi
- Rate limiting
- CORS configurado
- Hash de senhas com bcrypt
- Isolamento de dados por personal_id

---

## 🚀 BOAS PRÁTICAS

### Código
- Componentes funcionais com hooks
- TypeScript estrito
- Componentes pequenos e reutilizáveis
- Separação de responsabilidades
- Custom hooks para lógica compartilhada

### Performance
- Code splitting por rotas
- Lazy loading de componentes
- Memoização quando necessário
- Otimização de imagens

### Escalabilidade
- Estrutura modular
- Fácil adição de novas features
- Preparado para multi-tenancy (SaaS)
- API versionada

---

## 📈 ROADMAP FUTURO (SaaS)

- Multi-tenancy completo
- Planos de assinatura
- Pagamentos integrados (Stripe/PagSeguro)
- App mobile (React Native)
- Relatórios avançados
- Exportação de dados
- Integração com WhatsApp Business API
- Sistema de backup automático

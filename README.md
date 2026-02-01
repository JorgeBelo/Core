# CORE - Gestão para Personal Trainers

Sistema simples e moderno para Personal Trainers gerenciarem seus alunos e agenda.

## 📋 Funcionalidades

- **Home** - Página inicial com visão geral do sistema
- **Alunos** - Cadastro e gestão de alunos
- **Agenda Semanal** - Organização de horários de treino
- **Perfil** - Configurações do personal trainer

## 🚀 Tecnologias

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- React Router DOM
- Lucide Icons
- jsPDF (relatórios)

### Backend
- Supabase (BaaS)
  - Autenticação
  - Banco de dados PostgreSQL
  - Storage (avatares)

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── common/          # Button, Card, Logo, ProfileDropdown
│   └── layout/          # Layout, Sidebar, Header, Navigation
├── contexts/            # Contextos React (Auth, Theme)
├── hooks/               # Hooks customizados
├── lib/                 # Configuração do Supabase
├── pages/               # Páginas do sistema
│   ├── home/            # Página inicial
│   ├── alunos/          # Gestão de alunos
│   ├── agenda/          # Agenda semanal
│   ├── auth/            # Login
│   └── perfil/          # Perfil do usuário
├── types/               # Tipos TypeScript
└── utils/               # Funções utilitárias
```

## 🔧 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais do Supabase

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🗄️ Banco de Dados

Execute o script `DATABASE_SCHEMA.sql` no Supabase para criar as tabelas necessárias.

## 📱 Responsivo

O sistema é totalmente responsivo, funcionando em:
- Desktop (sidebar fixa)
- Tablet (menu hamburguer)
- Mobile (bottom navigation)

## 📄 Licença

Projeto privado - Core © 2026

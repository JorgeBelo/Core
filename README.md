# Core - Gestão para Personal Trainers

Sistema de gestão administrativa para personal trainers, desenvolvido com React + TypeScript + Vite.

## 🚀 Como Executar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Executar em Modo Desenvolvimento

```bash
npm run dev
```

O sistema estará disponível em: `http://localhost:5173`

### 3. Build para Produção

```bash
npm run build
```

### 4. Preview da Build

```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/      # Componentes reutilizáveis
├── contexts/       # Context API (Auth, Theme)
├── pages/          # Páginas/rotas do sistema
├── services/       # Chamadas à API
├── types/          # TypeScript types
├── utils/          # Funções utilitárias
└── assets/         # Imagens, fontes, etc.
```

## 🎨 Identidade Visual

- **Cor Principal**: `#a20100` (Vermelho)
- **Cor Secundária**: `#b4b4b4` (Cinza claro)
- **Fundo**: `#000000` ou `#1a1a1a` (Preto)
- **Fonte Brand**: AC Soft Icecream
- **Fonte Sistema**: Inter/Poppins

## 📚 Documentação

Consulte `ARCHITECTURE.md` para detalhes completos da arquitetura do sistema.

## 🔐 Autenticação

Por enquanto, o sistema está com autenticação mockada. Para desenvolvimento:
- Email: qualquer email
- Senha: qualquer senha

**IMPORTANTE**: Implementar autenticação real com backend antes de produção.

## 📝 Próximos Passos

1. Implementar integração com API backend
2. Adicionar todas as páginas (Alunos, Aulas, Financeiro, Agenda)
3. Implementar sistema de notificações
4. Adicionar gráficos e relatórios
5. Implementar testes

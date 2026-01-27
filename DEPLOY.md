# 🚀 Guia de Deploy na Vercel

## Pré-requisitos

1. Conta na Vercel (gratuita): https://vercel.com
2. Projeto no GitHub/GitLab/Bitbucket (recomendado)

## Configuração

### 1. Arquivos Criados

✅ **vercel.json** - Configurado para SPA (Single Page Application)
✅ **vite.config.ts** - Otimizado para produção
✅ **.vercelignore** - Arquivos ignorados no deploy

### 2. Build Local (Teste)

Antes de fazer deploy, teste o build localmente:

```bash
npm run build
```

Isso vai:
- Verificar erros de TypeScript
- Gerar os arquivos otimizados na pasta `dist/`

### 3. Deploy na Vercel

#### Opção A: Via Dashboard (Recomendado)

1. Acesse https://vercel.com
2. Clique em "Add New Project"
3. Conecte seu repositório Git
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Clique em "Deploy"

#### Opção B: Via CLI

```bash
# Instalar Vercel CLI globalmente
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Para produção
vercel --prod
```

## Configurações Importantes

### vercel.json

O arquivo `vercel.json` está configurado para:
- ✅ Redirecionar todas as rotas para `index.html` (SPA)
- ✅ Cache otimizado para assets estáticos
- ✅ Suporte completo ao React Router

### Build Otimizado

O `vite.config.ts` está configurado com:
- ✅ Code splitting por vendor
- ✅ Minificação com esbuild
- ✅ Otimização de chunks

## Variáveis de Ambiente

Se precisar de variáveis de ambiente:

1. No dashboard da Vercel: Settings → Environment Variables
2. Adicione suas variáveis
3. Elas estarão disponíveis em `import.meta.env.VITE_*`

## Domínio Customizado

1. No dashboard: Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções

## Troubleshooting

### Erro: "Module not found"
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` antes do build

### Rotas não funcionam
- Verifique se o `vercel.json` está na raiz do projeto
- Confirme que o rewrite está configurado corretamente

### Build falha
- Verifique os logs na Vercel
- Teste o build localmente primeiro: `npm run build`

## Comandos Úteis

```bash
# Build local
npm run build

# Preview do build
npm run preview

# Verificar TypeScript
npm run build -- --mode development

# Verificar lint
npm run lint
```

## Próximos Passos

Após o deploy:
1. ✅ Teste todas as rotas
2. ✅ Verifique se as notificações funcionam
3. ✅ Teste em diferentes dispositivos
4. ✅ Configure analytics (opcional)
5. ✅ Configure monitoramento de erros (opcional)

---

**Status**: ✅ Pronto para deploy!

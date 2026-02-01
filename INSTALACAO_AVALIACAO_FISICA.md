# 🚀 GUIA RÁPIDO DE INSTALAÇÃO - AVALIAÇÃO FÍSICA

## ⚡ INSTALAÇÃO EM 5 MINUTOS

### PASSO 1: Executar SQL no Supabase

1. Acesse seu projeto no [Supabase](https://supabase.com)
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **"New Query"**
4. Copie todo o conteúdo do arquivo: `supabase_avaliacoes_fisicas.sql`
5. Cole no editor e clique em **"Run"**

✅ Isso criará:
- Tabela `avaliacoes_fisicas`
- Índices para performance
- Políticas RLS (segurança)
- Triggers automáticos

### PASSO 2: Adicionar campo `sexo` na tabela `alunos`

No mesmo SQL Editor, execute:

```sql
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS sexo VARCHAR(1);
```

✅ Isso permitirá:
- Cálculos específicos por sexo
- Classificações corretas de % gordura
- Avatar 3D personalizado

### PASSO 3: Deploy do Frontend

O código já está pronto! Basta fazer deploy:

```bash
# Se estiver usando Vercel
npm run build
# O build está em /dist

# Ou se já tem CI/CD configurado, apenas push:
git push origin main
```

✅ O sistema já está integrado:
- Menu lateral atualizado
- Rotas configuradas
- Componentes prontos

---

## 🎯 PRIMEIRO USO

### 1. Cadastrar Sexo dos Alunos

Antes de criar avaliações, cadastre o sexo dos alunos:

1. Vá em **"Alunos"**
2. Edite cada aluno
3. Adicione o campo **"Sexo"** (M ou F)
4. Salve

> ⚠️ **IMPORTANTE:** O sexo é necessário para cálculos corretos de % gordura

### 2. Criar Primeira Avaliação

1. Vá em **"Avaliação Física"**
2. Clique em **"+ Nova Avaliação"**
3. Siga o wizard:
   - **Passo 1:** Selecione o aluno
   - **Passo 2:** Escolha o protocolo (recomendado: 3 Dobras para começar)
   - **Passo 3:** Preencha peso, altura e dobras
4. Clique em **"Salvar e Gerar Relatório"**

### 3. Visualizar e Baixar PDF

1. Na lista, clique em **"Ver"** na avaliação criada
2. Veja o avatar 3D e todas as métricas
3. Clique em **"Baixar PDF"** para gerar o relatório

### 4. Comparar Avaliações

Após criar pelo menos 2 avaliações do mesmo aluno:

1. Clique em **"Comparar"** na lista
2. Selecione as avaliações (anterior e atual)
3. Veja a evolução lado a lado

---

## 🔧 CONFIGURAÇÕES OPCIONAIS

### Adicionar CREF no Perfil

Para que o CREF apareça no PDF:

1. Vá em **"Perfil"**
2. Preencha o campo **"CREF"**
3. Salve

O CREF aparecerá automaticamente na assinatura digital do PDF.

### Personalizar Observações

No Passo 3 do wizard, use o campo **"Observações"** para:
- Anotar condições do aluno no dia
- Registrar informações importantes
- Adicionar contexto à avaliação

---

## 📊 PROTOCOLOS RECOMENDADOS

### Para Iniciantes:
**3 Dobras** - Rápido e fácil (5 min)

### Para Precisão:
**7 Dobras** - Mais completo (10 min)

### Com Equipamento:
**Bioimpedância** - Mais rápido (2 min)

### Para Acompanhamento:
**Perímetros** - Ótimo para evolução (15 min)

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Antes de usar em produção, verifique:

- [ ] SQL executado no Supabase
- [ ] Campo `sexo` adicionado em `alunos`
- [ ] Build sem erros (`npm run build`)
- [ ] Deploy realizado
- [ ] Sexo cadastrado para pelo menos 1 aluno
- [ ] Primeira avaliação criada com sucesso
- [ ] PDF gerado corretamente
- [ ] Avatar 3D aparecendo
- [ ] Comparação funcionando

---

## 🆘 PROBLEMAS COMUNS

### "Erro ao criar avaliação"
**Solução:** Verifique se o SQL foi executado corretamente no Supabase.

### "Avatar não aparece"
**Solução:** Certifique-se de que o aluno tem o campo `sexo` preenchido.

### "PDF não gera"
**Solução:** Verifique se há dados do personal no perfil (nome, email).

### "Cálculos estranhos"
**Solução:** Confirme que peso está em kg e altura em cm.

---

## 📞 SUPORTE

Para mais informações, consulte:

- **Documentação Completa:** `AVALIACAO_FISICA_COMPLETO.md`
- **Proposta Original:** `PROPOSTA_AVALIACAO_FISICA.md`
- **Script SQL:** `supabase_avaliacoes_fisicas.sql`

---

## 🎉 PRONTO!

Seu sistema de Avaliação Física está instalado e pronto para uso!

**Próximos passos:**
1. Cadastre o sexo de todos os alunos
2. Crie avaliações regularmente (recomendado: a cada 30-60 dias)
3. Compare resultados para mostrar evolução
4. Gere PDFs profissionais para seus alunos

**Bom trabalho! 💪**

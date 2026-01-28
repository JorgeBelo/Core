# 🔧 Configuração do Supabase

## ✅ Configuração Completa

O projeto está configurado para usar o Supabase como banco de dados.

### Arquivos Criados

1. **src/lib/supabase.ts** - Cliente Supabase configurado
2. **src/utils/masks.ts** - Funções de máscara para WhatsApp

### Configuração

- **URL**: https://icnkhgkhqfbzldenhrjw.supabase.co
- **Key**: Configurada no arquivo `src/lib/supabase.ts`

## 📋 Estrutura da Tabela `alunos`

Certifique-se de que a tabela `alunos` no Supabase tenha os seguintes campos:

```sql
CREATE TABLE alunos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personal_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  whatsapp VARCHAR(20),
  frequency_per_week INTEGER NOT NULL DEFAULT 1,
  monthly_fee DECIMAL(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  observations TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Políticas RLS (Row Level Security)

Configure as políticas no Supabase para que cada personal só veja seus próprios alunos:

```sql
-- Habilitar RLS
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
CREATE POLICY "Users can view their own alunos"
  ON alunos FOR SELECT
  USING (auth.uid() = personal_id);

-- Política para INSERT
CREATE POLICY "Users can insert their own alunos"
  ON alunos FOR INSERT
  WITH CHECK (auth.uid() = personal_id);

-- Política para UPDATE
CREATE POLICY "Users can update their own alunos"
  ON alunos FOR UPDATE
  USING (auth.uid() = personal_id);

-- Política para DELETE
CREATE POLICY "Users can delete their own alunos"
  ON alunos FOR DELETE
  USING (auth.uid() = personal_id);
```

## 🚀 Funcionalidades Implementadas

### ✅ Menu de Perfil
- Avatar circular com foto
- Nome "Personal Name" e email
- Dropdown com:
  - Meu Perfil
  - Configurações
  - Sair

### ✅ Cadastro de Alunos
- Campo WhatsApp com máscara: `(99) 9 9999-9999`
- Removido campo "Telefone"
- Integração com Supabase
- Lista de alunos carregada do banco

### ✅ Máscara de WhatsApp
- Formato: `(11) 9 9999-9999`
- Aplicada automaticamente durante a digitação
- Removida antes de salvar no banco

## 📝 Próximos Passos

1. **Instalar dependência**:
   ```bash
   npm install
   ```

2. **Configurar tabela no Supabase**:
   - Criar a tabela `alunos` conforme estrutura acima
   - Configurar RLS policies

3. **Testar**:
   - Cadastrar um novo aluno
   - Verificar se aparece na lista
   - Testar a máscara de WhatsApp

## 🔒 Segurança

- As políticas RLS garantem que cada personal só acesse seus próprios dados
- O `personal_id` é automaticamente definido com o ID do usuário autenticado

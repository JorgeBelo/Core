# 📅 Configuração da Agenda Semanal - Horários Fixos

## ✅ Funcionalidades Implementadas

### Cadastro de Horários Fixos Semanais
- ✅ Visualização por dia da semana (Segunda a Domingo)
- ✅ Múltiplos horários por dia
- ✅ Horários flexíveis (hora início e fim independentes)
- ✅ Ativar/desativar horários
- ✅ Salvar todos os horários de uma vez

## 📋 Estrutura da Tabela `horarios_semanais`

Crie a tabela no Supabase com a seguinte estrutura:

```sql
CREATE TABLE horarios_semanais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personal_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  -- 0 = Segunda-feira, 1 = Terça-feira, ..., 6 = Domingo
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_horarios_semanais_personal_id ON horarios_semanais(personal_id);
CREATE INDEX idx_horarios_semanais_dia_semana ON horarios_semanais(dia_semana);
```

### Políticas RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE horarios_semanais ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
CREATE POLICY "Users can view their own horarios"
  ON horarios_semanais FOR SELECT
  USING (auth.uid() = personal_id);

-- Política para INSERT
CREATE POLICY "Users can insert their own horarios"
  ON horarios_semanais FOR INSERT
  WITH CHECK (auth.uid() = personal_id);

-- Política para UPDATE
CREATE POLICY "Users can update their own horarios"
  ON horarios_semanais FOR UPDATE
  USING (auth.uid() = personal_id);

-- Política para DELETE
CREATE POLICY "Users can delete their own horarios"
  ON horarios_semanais FOR DELETE
  USING (auth.uid() = personal_id);
```

## 🎯 Como Usar

1. **Visualizar Horários**: A página mostra todos os dias da semana
2. **Adicionar Horário**: Clique em "Adicionar Horário" no dia desejado
3. **Editar Horários**: Altere diretamente os campos de hora início/fim
4. **Desativar Horário**: Desmarque a checkbox "Ativo"
5. **Remover Horário**: Clique no ícone X ao lado do horário
6. **Salvar**: Clique em "Salvar Horários" para persistir todas as alterações

## 📝 Campos

- **Dia da Semana**: Automático (Segunda a Domingo)
- **Hora Início**: Campo de tempo (padrão: 08:00)
- **Hora Fim**: Campo de tempo (padrão: 12:00)
- **Ativo**: Checkbox para ativar/desativar o horário

## 💡 Exemplo de Uso

**Segunda-feira:**
- 08:00 - 12:00 (Ativo)
- 14:00 - 18:00 (Ativo)

**Terça-feira:**
- 09:00 - 13:00 (Ativo)

**Quarta-feira:**
- 08:00 - 12:00 (Ativo)
- 14:00 - 18:00 (Ativo)

**Domingo:**
- (Nenhum horário cadastrado)

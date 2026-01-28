# 📅 Agenda Semanal Fixa - Configuração

## ✅ Funcionalidades Implementadas

### Grade Semanal Fixa (Sem Datas)
- ✅ Grade estilo planilha com colunas (dias da semana) e linhas (horários)
- ✅ **Apenas dias da semana**: Segunda-feira a Domingo
- ✅ **Sem navegação de datas**: Não mostra números de dias, mês ou ano
- ✅ Horários de 6h às 23h com intervalos de 30 minutos
- ✅ Horários flexíveis/quebrados (ex: 16:30 às 17:30)
- ✅ Cores diferenciadas: ocupado (vermelho) e livre (cinza)
- ✅ Clique em slot livre para agendar aluno
- ✅ Clique em slot ocupado para remover agendamento

### Integração com Supabase
- ✅ Usa tabela `agenda_personal` com campo `dia_semana`
- ✅ Carrega todos os agendamentos
- ✅ Salva novos agendamentos
- ✅ Remove agendamentos existentes

## 📋 Estrutura da Tabela `agenda_personal`

A tabela deve usar `dia_semana` (0-6) ao invés de `data`:

```sql
CREATE TABLE agenda_personal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personal_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES alunos(id) ON DELETE SET NULL,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  -- 0 = Segunda-feira, 1 = Terça-feira, ..., 6 = Domingo
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_agenda_personal_personal_id ON agenda_personal(personal_id);
CREATE INDEX idx_agenda_personal_dia_semana ON agenda_personal(dia_semana);
CREATE INDEX idx_agenda_personal_aluno_id ON agenda_personal(aluno_id);
```

### Políticas RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE agenda_personal ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
CREATE POLICY "Users can view their own agenda"
  ON agenda_personal FOR SELECT
  USING (auth.uid() = personal_id);

-- Política para INSERT
CREATE POLICY "Users can insert their own agenda"
  ON agenda_personal FOR INSERT
  WITH CHECK (auth.uid() = personal_id);

-- Política para UPDATE
CREATE POLICY "Users can update their own agenda"
  ON agenda_personal FOR UPDATE
  USING (auth.uid() = personal_id);

-- Política para DELETE
CREATE POLICY "Users can delete their own agenda"
  ON agenda_personal FOR DELETE
  USING (auth.uid() = personal_id);
```

## 🎯 Como Usar

1. **Visualizar Agenda**: A grade mostra sempre Segunda a Domingo (sem datas)
2. **Agendar Horário**: 
   - Clique em um slot livre (cinza)
   - Selecione um aluno da lista
   - Defina hora início e fim (horários flexíveis)
   - Clique em "Salvar"
3. **Remover Agendamento**: 
   - Clique em um slot ocupado (vermelho)
   - Confirme a remoção

## 📝 Campos do Formulário

- **Dia**: Automático (baseado no slot clicado - apenas nome do dia)
- **Hora Início**: Campo de tempo (padrão: horário do slot)
- **Hora Fim**: Campo de tempo (padrão: 1 hora depois)
- **Aluno**: Dropdown com lista de alunos ativos

## 🎨 Visual

- **Cabeçalho**: Apenas nomes dos dias (Segunda-feira, Terça-feira, etc.)
- **Slots Livres**: Fundo cinza escuro, texto "Livre"
- **Slots Ocupados**: Fundo vermelho translúcido, mostra nome do aluno e horário
- **Altura Dinâmica**: Slots ocupados ajustam altura baseado na duração do agendamento

## 💡 Diferenças da Versão Anterior

- ❌ **Removido**: Navegação entre semanas
- ❌ **Removido**: Exibição de datas (dia/mês/ano)
- ❌ **Removido**: Botões "Semana Anterior" e "Próxima Semana"
- ✅ **Mantido**: Grade semanal fixa sempre visível
- ✅ **Mantido**: Funcionalidade de agendar/remover alunos

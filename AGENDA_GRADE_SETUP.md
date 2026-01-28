# 📅 Configuração da Agenda - Grade Semanal Fixa

## ✅ Funcionalidades Implementadas

### Grade Semanal Fixa (Segunda a Domingo)
- ✅ Visualização estilo planilha com colunas (dias) e linhas (horários)
- ✅ Horários de 6h às 23h com intervalos de 30 minutos
- ✅ Horários flexíveis/quebrados (ex: 16:30 às 17:30)
- ✅ Cores diferenciadas: ocupado (vermelho) e livre (cinza)
- ✅ Clique em slot livre para agendar aluno
- ✅ Clique em slot ocupado para remover agendamento

### Integração com Supabase
- ✅ Usa tabela `agenda_personal`
- ✅ Carrega agendamentos da semana atual
- ✅ Salva novos agendamentos
- ✅ Remove agendamentos existentes

## 📋 Estrutura da Tabela `agenda_personal`

Crie a tabela no Supabase com a seguinte estrutura:

```sql
CREATE TABLE agenda_personal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personal_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES alunos(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_agenda_personal_personal_id ON agenda_personal(personal_id);
CREATE INDEX idx_agenda_personal_data ON agenda_personal(data);
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

1. **Visualizar Agenda**: A grade mostra a semana atual (Segunda a Domingo)
2. **Navegar Semanas**: Use os botões "Semana Anterior" e "Próxima Semana"
3. **Agendar Horário**: 
   - Clique em um slot livre (cinza)
   - Selecione um aluno da lista
   - Defina hora início e fim (horários flexíveis)
   - Clique em "Salvar"
4. **Remover Agendamento**: 
   - Clique em um slot ocupado (vermelho)
   - Confirme a remoção

## 📝 Campos do Formulário

- **Dia**: Automático (baseado no slot clicado)
- **Hora Início**: Campo de tempo (padrão: horário do slot)
- **Hora Fim**: Campo de tempo (padrão: 1 hora depois)
- **Aluno**: Dropdown com lista de alunos ativos

## 🎨 Visual

- **Slots Livres**: Fundo cinza escuro, texto "Livre"
- **Slots Ocupados**: Fundo vermelho translúcido, mostra nome do aluno e horário
- **Altura Dinâmica**: Slots ocupados ajustam altura baseado na duração do agendamento

## 💡 Exemplo de Uso

**Segunda-feira, 16:30:**
- Clique no slot
- Selecione "João Silva"
- Hora início: 16:30
- Hora fim: 17:30
- Salvar

O slot ficará vermelho mostrando "João Silva" e "16:30 - 17:30".

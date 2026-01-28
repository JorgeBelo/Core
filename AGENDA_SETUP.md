# 📅 Configuração da Agenda - Grade Semanal

## ✅ Funcionalidades Implementadas

### Grade Semanal Fixa
- ✅ Visualização de Segunda a Domingo
- ✅ Horários de 6h às 23h com intervalos de 30 minutos
- ✅ Estilo de planilha com tabela organizada
- ✅ Cores diferenciadas (ocupado = vermelho, livre = cinza)

### Horários Flexíveis
- ✅ Permite horários quebrados (ex: 16:30 às 17:30)
- ✅ Seleção de hora início e hora fim independentes
- ✅ Cálculo automático de altura do slot baseado na duração

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
3. **Agendar Horário**: Clique em um slot livre para abrir o modal de seleção
4. **Selecionar Aluno**: Escolha um aluno da lista e defina hora início/fim
5. **Remover Agendamento**: Clique em um slot ocupado e confirme a remoção

## 🔧 Campos do Formulário

- **Dia**: Automático (baseado no slot clicado)
- **Hora Início**: Campo de tempo (padrão: horário do slot)
- **Hora Fim**: Campo de tempo (padrão: 1 hora depois)
- **Aluno**: Dropdown com lista de alunos ativos

## 📝 Notas

- Os horários são salvos no formato `HH:mm` (ex: "16:30")
- A altura do slot é calculada automaticamente baseada na duração
- Slots intermediários são ocultos quando há um agendamento longo
- A grade é atualizada automaticamente após salvar/remover

# 💰 Contas Financeiras - Atualização

## ✅ Novas Funcionalidades

### 1. Parcelamento até 420x
- ✅ Limite aumentado de 36 para **420 parcelas**
- ✅ Ideal para financiamentos de imóveis, veículos, etc.
- ✅ Cada parcela é criada automaticamente com vencimento mensal

### 2. Conta Fixa (Recorrente Mensal)
- ✅ Nova opção: **"Conta Fixa (Recorrente Mensal)"**
- ✅ Gera automaticamente contas para os próximos **12 meses**
- ✅ Ideal para:
  - Aluguéis mensais
  - Assinaturas (Netflix, Spotify, etc.)
  - Mensalidades recorrentes
  - Qualquer conta que se repete mensalmente

## 📋 Estrutura da Tabela `contas_financeiras`

Atualize a tabela no Supabase adicionando o campo `conta_fixa`:

```sql
-- Adicionar coluna conta_fixa se não existir
ALTER TABLE contas_financeiras 
ADD COLUMN IF NOT EXISTS conta_fixa BOOLEAN DEFAULT false;

-- Estrutura completa da tabela
CREATE TABLE IF NOT EXISTS contas_financeiras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personal_id UUID NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data_vencimento DATE NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('pagar', 'receber')),
  parcelada BOOLEAN DEFAULT false,
  numero_parcelas INTEGER,
  parcela_atual INTEGER,
  conta_original_id UUID,
  conta_fixa BOOLEAN DEFAULT false, -- NOVO CAMPO
  pago BOOLEAN DEFAULT false,
  data_pagamento DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 Como Usar

### Conta Parcelada (até 420x)
1. Preencha os dados da conta
2. Marque "É parcelada?"
3. Defina o número de parcelas (2 a 420)
4. O sistema criará automaticamente todas as parcelas mensais

**Exemplo**: Financiamento de R$ 420.000 em 420x
- Valor total: R$ 420.000
- Parcelas: 420
- Valor por parcela: R$ 1.000
- Cada parcela será criada com vencimento mensal

### Conta Fixa (Recorrente)
1. Preencha os dados da conta
2. Marque "Conta Fixa (Recorrente Mensal)"
3. O sistema criará automaticamente 12 contas (uma para cada mês)

**Exemplo**: Aluguel de R$ 1.500
- Valor: R$ 1.500
- Data vencimento: 05/02/2024
- O sistema criará:
  - 05/02/2024 - R$ 1.500
  - 05/03/2024 - R$ 1.500
  - 05/04/2024 - R$ 1.500
  - ... até 05/01/2025

## 📝 Regras de Negócio

1. **Conta Fixa e Parcelada são mutuamente exclusivas**
   - Se marcar "Conta Fixa", a opção "Parcelada" é desmarcada automaticamente
   - Se marcar "Parcelada", a opção "Conta Fixa" é desmarcada automaticamente

2. **Conta Fixa**
   - Sempre gera 12 meses
   - Valor é o mesmo para todos os meses
   - Data de vencimento é sempre o mesmo dia do mês

3. **Conta Parcelada**
   - Permite de 2 a 420 parcelas
   - Valor total é dividido igualmente entre as parcelas
   - Cada parcela tem vencimento mensal a partir da data inicial

## 🎨 Visual

Na lista de contas, contas fixas aparecem com a marcação **[Fixa]** ao lado da descrição.

## 💡 Exemplos de Uso

### Exemplo 1: Aluguel (Conta Fixa)
- Descrição: "Aluguel Apartamento"
- Valor: R$ 1.500
- Data: 05/02/2024
- Conta Fixa: ✅
- Resultado: 12 contas de R$ 1.500 (uma por mês)

### Exemplo 2: Financiamento (Parcelado)
- Descrição: "Financiamento Imóvel"
- Valor: R$ 420.000
- Data: 01/02/2024
- Parcelas: 420
- Resultado: 420 parcelas de R$ 1.000 (uma por mês)

### Exemplo 3: Assinatura (Conta Fixa)
- Descrição: "Netflix"
- Valor: R$ 45,90
- Data: 15/02/2024
- Conta Fixa: ✅
- Resultado: 12 contas de R$ 45,90 (uma por mês)

# Core — Proposta do Módulo Financeiro  
## Modelo ERP de classe mundial, escopo Personal Trainer

---

## 1. Visão e propósito do sistema

**O que é**  
O Core é um sistema de gestão voltado ao **personal trainer**: um único usuário (o personal) que precisa controlar **alunos**, **agenda** e **finanças** do próprio negócio.

**Para quê**  
- Ter **clareza** sobre quem treina, quando e quanto entra/sai de dinheiro.  
- **Histórico confiável**: o que foi registrado permanece, mesmo que um aluno saia do cadastro.  
- **Simplicidade**: sem regras automáticas escondidas; o usuário decide o que lançar e o sistema só guarda e soma.

**Para quem**  
Personal trainers que querem um app **enxuto**, **previsível** e **fácil de auditar** — no espírito dos ERPs usados por grandes empresas, mas adaptado à realidade de um negócio de uma pessoa.

---

## 2. Referência: o que os melhores ERPs do mundo fazem

Sistemas como **SAP S/4HANA**, **Oracle Cloud ERP**, **Microsoft Dynamics 365**, **Odoo** e **SAP Business One** (usados por milhares de empresas globais) seguem princípios que reduzimos aqui ao que faz sentido para um personal:

| Princípio | No mundo enterprise | No Core (personal) |
|-----------|---------------------|---------------------|
| **Single source of truth** | Um único livro contábil; todas as telas leem dele. | Uma única base de lançamentos (receitas/despesas). Nada é “gerado” por data ou lista; tudo é **lançado** pelo usuário. |
| **Imutabilidade / audit trail** | Lançamentos não são alterados no conteúdo; correções viram novos lançamentos ou estornos. | Cada lançamento guarda **descrição e valor fixos** (texto + número). Excluir um aluno não apaga receitas passadas; o histórico permanece legível. |
| **Separação entre cadastro e movimento** | Clientes/produtos são cadastro; vendas e pagamentos são movimento. | Alunos são **cadastro**. Financeiro é **movimento**: lançamentos com descrição (ex.: “Mensalidade – João – Jan/2026”), valor e data. |
| **Relatórios como visões** | Dashboard, DRE e extrato são **consultas** sobre os mesmos dados; não criam dados. | Resumo do mês e extrato são **somas e filtros** sobre os lançamentos. Zero lógica extra; só leitura. |
| **Módulos claros e nomeados** | Contabilidade, Fiscal, RH etc. com fronteiras bem definidas. | Um módulo **Financeiro** com três funções: **Lançar**, **Resumo do mês**, **Extrato**. Nomes estáveis e óbvios. |

O objetivo é trazer **confiabilidade e previsibilidade** de um ERP moderno, mantendo o escopo **100% focado no personal**: um dono, um negócio, sem multi-empresa nem multi-moeda.

---

## 3. Arquitetura do módulo Financeiro (estilo ERP)

O Financeiro é **um módulo** com uma única tela principal organizada em **áreas funcionais** (abas ou seções), no padrão de ERPs atuais:

```
┌─────────────────────────────────────────────────────────────────┐
│  FINANCEIRO                                                      │
├─────────────────────────────────────────────────────────────────┤
│  [ Lançar ]  [ Resumo do mês ]  [ Extrato ]  [ Contas a pagar ]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Conteúdo da aba/seção selecionada                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1 Lançar (entrada de dados)

- **Função:** único ponto de entrada de movimentação financeira.  
- **Campos:** Tipo (Receita / Despesa), Descrição (texto livre), Valor, Data.  
- **Regra:** grava em **uma única tabela** de lançamentos. Descrição e valor são **estáticos** (não dependem de vínculo com aluno).  
- **Uso típico (personal):** Receita = “Mensalidade – [Nome do aluno] – [Mês/Ano]”; Despesa = “Aluguel academia”, “Suplemento” etc.  
- **Opcional (fase 2):** dropdown “Aluno” que **só preenche a descrição**; o banco continua armazenando texto + valor + data.

### 3.2 Resumo do mês (visão gerencial)

- **Função:** visão de resultado do período, no estilo “painel do mês” de ERPs.  
- **Controle:** seletor **Mês/Ano**.  
- **Cálculos:**  
  - Total recebido = soma dos lançamentos tipo Receita com data no mês.  
  - Total pago = soma dos lançamentos tipo Despesa com data no mês (considerando status Pago quando houver).  
  - Saldo do mês = Total recebido − Total pago (e, se quiser, − Pendente a pagar).  
- **Apresentação:** cards ou blocos bem legíveis (ex.: KPIs no topo da tela). Sem gráficos na primeira versão; só números e, se desejar, “Próximos vencimentos” (despesas pendentes com data no futuro).

### 3.3 Extrato (auditoria e histórico)

- **Função:** lista cronológica de lançamentos — equivalente ao extrato bancário ou ao relatório de movimentação contábil.  
- **Ordenação:** data decrescente (mais recente primeiro).  
- **Colunas sugeridas:** Data, Tipo, Descrição, Valor, Status (para despesas).  
- **Filtros opcionais:** por mês, por tipo (Receita/Despesa).  
- **Regra:** somente **leitura**; nenhum cálculo que altere ou “invente” dados.

### 3.4 Contas a pagar (opcional)

- **Função:** despesas com vencimento futuro e status Pendente/Pago.  
- **Regra:** mesmo modelo de lançamento (tipo Despesa, com data de vencimento e status).  
- **Resumo do mês:** pode considerar “Pago” no mês para o total pago; “Próximos vencimentos” lista pendentes por data.

---

## 4. Modelo de dados (single source of truth)

Uma **única tabela** de movimentação (ex.: reaproveitar `contas_financeiras`):

| Campo         | Uso                                                                 |
|---------------|---------------------------------------------------------------------|
| `personal_id` | Dono do lançamento (sempre o personal logado).                      |
| `tipo`        | Receita ou Despesa.                                                 |
| `descricao`   | Texto fixo (ex.: “Mensalidade – João – Jan/2026”). Imutável.        |
| `valor`       | Valor numérico. Imutável.                                           |
| `data`        | Data do lançamento ou vencimento (única data para filtros de mês).  |
| `status`      | Opcional: Pendente / Pago (relevante para despesas).                |
| `categoria`   | Opcional: “Mensalidade”, “Renda extra”, “Aluguel” etc.              |

**Não usar** no fluxo principal: tabela “mensalidades” com geração automática por mês ou por aluno. Toda entrada de valor vem do **Lançar**.

---

## 5. Fluxo operacional (o dia a dia do personal)

| Ação do usuário              | Onde           | O que o sistema faz                                      |
|-----------------------------|----------------|----------------------------------------------------------|
| Registrar recebimento       | Financeiro → Lançar | Cria 1 lançamento Tipo = Receita, Descrição + Valor + Data. |
| Ver resultado do mês        | Financeiro → Resumo do mês | Filtra por Mês/Ano e soma Receitas e Despesas (pagos).   |
| Consultar histórico         | Financeiro → Extrato | Lista lançamentos (e filtros por mês/tipo).             |
| Registrar conta a pagar     | Financeiro → Lançar (ou Contas a pagar) | Despesa, status Pendente, data = vencimento.             |
| Marcar conta como paga      | Financeiro → Contas a pagar / Extrato | Atualiza status para Pago (e opcionalmente data de pagamento). |

**Frase que resume o modelo:**  
*Você lança → o sistema grava → Resumo e Extrato só leem e somam.*

---

## 6. Escopo “personal”: o que fica de fora (de propósito)

Para manter o sistema **enxuto e 100% utilizável** para um personal:

- **Sem** geração automática de mensalidades por aluno ou por mês.  
- **Sem** “Dashboard” com regras de negócio próprias; no máximo um **Home** com totais do mês (lidos do mesmo livro de lançamentos) e atalhos.  
- **Sem** múltiplas empresas, múltiplos usuários financeiros ou multi-moeda.  
- **Alunos:** cadastro e filtro Ativo/Inativo; **não** é no cadastro de alunos que se “marca” pagamento — isso é feito no **Financeiro → Lançar**.

Assim, o Core continua **claramente** um sistema “para quê”: **gestão simples e confiável do negócio do personal trainer**, com padrão de ERP moderno e foco em single source of truth, imutabilidade e relatórios como visões.

---

## 7. Próximos passos recomendados

1. **Validar** com o usuário: uma tela Financeiro com abas/seções (Lançar, Resumo do mês, Extrato, opcional Contas a pagar) e, se fizer sentido, um Home mínimo.  
2. **Implementar** o módulo Financeiro reutilizando a tabela `contas_financeiras` (ou equivalente), sem criar nova tabela de “mensalidades” no fluxo.  
3. **Definir** textos e labels finais (ex.: “Lançar receita” / “Lançar despesa”) e ordem das abas conforme preferência de uso do personal.

---

*Documento alinhado a práticas de ERPs modernos (SAP, Oracle, Microsoft, Odoo), com escopo e linguagem adaptados ao negócio do personal trainer e à ideia inicial do Core: **o quê** (gestão de alunos, agenda e finanças) e **para quê** (clareza, histórico confiável e simplicidade operacional).*

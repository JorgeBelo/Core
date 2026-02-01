# Proposta: Módulo Financeiro inspirado em ERPs modernos

## O que foi removido

- **Dashboard** (removido)
- **Histórico de Entrada** (removido)
- **Financeiro** (removido)

O app hoje tem apenas: **Alunos**, **Agenda Semanal**, **Notificações**, **Perfil**.  
Login redireciona para **Alunos**.

---

## Princípios de ERPs que funcionam no mercado

Sistemas como **Odoo**, **SAP Business One**, **Conta Azul**, **Notion** e **Bling** seguem padrões que reduzem erro e mantêm consistência:

1. **Um único “livro” de lançamentos**  
   Tudo que é receita ou despesa vira **um registro** (como um lançamento contábil). Sem duplicar lógica em “mensalidades” e “contas” ao mesmo tempo.

2. **Dados imutáveis e com descrição fixa**  
   Cada lançamento guarda **texto** (ex.: “Mensalidade – João – Jan/2026”) e **valor**. Não depende de ID de aluno ou de status que pode mudar. Excluir aluno não apaga o passado.

3. **Fluxo: usuário lança → sistema grava → relatórios só leem**  
   Nada é “gerado” automaticamente por data ou por lista de alunos. Quem decide o que entrou/saiu é o usuário, via botão “Lançar”.

4. **Relatórios = filtros e somas sobre esse livro**  
   Dashboard, extrato e “histórico” são **visões** (por mês, por tipo, por período) sobre os mesmos lançamentos. Sem regras de negócio escondidas nos relatórios.

5. **Módulos enxutos e bem nomeados**  
   Um lugar para **lançar**, um para **ver por período** (resumo), um para **ver lista completa** (extrato). Nomes claros evitam confusão.

---

## Proposta de estrutura para o Core (personal)

### 1. **Financeiro** (uma tela só, tipo “painel”)

- **Abas ou seções:**
  - **Lançar**  
    Um formulário: tipo (Receita / Despesa), descrição (texto livre ou “Mensalidade – [nome aluno] – Mês/Ano”), valor, data.  
    Grava em **uma única tabela** (ex.: `contas_financeiras` ou `lancamentos`) com campos estáticos (descrição, valor, data, tipo). Sem vínculo obrigatório com aluno (só texto na descrição).
  - **Resumo do mês**  
    Seletor Mês/Ano. Soma **receitas** e **despesas** daquele mês (filtro por data).  
    Cards: Total recebido, Total pago, Saldo do mês. Sem lógica extra; só soma do que está salvo.
  - **Extrato**  
    Lista de todos os lançamentos (ou só receitas, com filtro), ordenada por data (mais recente primeiro).  
    Opcional: filtro por mês. Cada linha: descrição (fixa), valor, data.

- **Contas a pagar (opcional)**  
  Se quiser manter “contas a pagar” no mesmo lugar: são lançamentos tipo Despesa com status “Pendente” ou “Pago”. O “Resumo do mês” considera só lançamentos com data naquele mês; pendentes podem ter data futura e aparecer em “Próximos vencimentos”.

### 2. **Sem “Dashboard” separado (ou um bem mínimo)**

- **Opção A:** Não ter tela “Dashboard”. Quem entra vai direto para **Alunos** ou **Financeiro** (definido por você).
- **Opção B:** Um “Home” com apenas:
  - Total recebido no mês atual (soma dos lançamentos de receita do mês).
  - Total pago no mês atual (soma dos lançamentos de despesa do mês).
  - Link rápido: “Lançar receita”, “Lançar despesa”, “Ver extrato”, “Alunos”.

Nada de gráficos ou regras automáticas no início; tudo derivado dos lançamentos.

### 3. **Alunos**

- Continua como hoje: cadastro, ativo/inativo, exclusão.  
- **Sem** botão “Lançar pagamento” na lista (evita duplicar fluxo).  
- Quem quiser lançar receita de mensalidade usa **Financeiro → Lançar** e escreve na descrição “Mensalidade – Nome do aluno – Mês/Ano”.  
- Opcional depois: no **Lançar**, um dropdown “Aluno” que só preenche a descrição automaticamente; o que vai pro banco continua sendo texto + valor + data.

### 4. **Banco de dados**

- **Uma tabela de lançamentos** (ex.: `lancamentos` ou uso de `contas_financeiras`):
  - `personal_id`, `tipo` (receita/despesa), `descricao` (texto), `valor`, `data` (data do lançamento/vencimento), `status` (pago/pendente, para despesas), opcional `categoria`.
- Sem tabela “mensalidades” no fluxo; sem geração automática por mês ou por aluno.

---

## Resumo do fluxo proposto

| Ação | Onde | O que acontece |
|------|------|----------------|
| Registrar que recebeu de um aluno | Financeiro → Lançar | Cria 1 lançamento tipo Receita, descrição “Mensalidade – João – Jan/2026”, valor X, data de hoje (ou da data que você escolher). |
| Ver quanto entrou num mês | Financeiro → Resumo do mês | Seletor Mês/Ano; soma todos os lançamentos de receita daquele mês. |
| Ver lista do que entrou | Financeiro → Extrato | Lista lançamentos (com filtro opcional por tipo/mês). |
| Contas a pagar | Financeiro → mesma tabela | Lançamentos tipo Despesa, status Pendente/Pago; “Resumo” e “Próximos vencimentos” filtram por data. |

- **Você lança** → **O sistema salva** → **Resumo e extrato só leem e somam.**  
- Histórico preservado: descrição e valor fixos; independe de aluno ativo ou excluído.

---

## Próximos passos sugeridos

1. **Decidir** se quer:
   - só **Financeiro** (Lançar + Resumo do mês + Extrato) e sem tela “Dashboard”, ou  
   - um **Home** mínimo (totais do mês + links) além do Financeiro.

2. **Implementar** uma única tela **Financeiro** com:
   - Formulário “Lançar” (tipo, descrição, valor, data).
   - Seletor de mês para “Resumo do mês” (somas).
   - Lista “Extrato” (todos os lançamentos, com filtro opcional por mês/tipo).

3. **Reaproveitar** a tabela `contas_financeiras` já existente (com tipo receber/pagar, descrição, valor, data, status) em vez de criar outra, para não quebrar o que já existe no banco.

Se quiser, na próxima etapa podemos desenhar juntos os campos exatos da tela e os nomes dos botões/abas em cima dessa proposta.

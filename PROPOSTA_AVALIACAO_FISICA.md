# Proposta: Módulo de Avaliação Física - ULTRA MODERNO

## Visão Geral
Sistema de avaliação física de **última geração**, inspirado nos apps mais modernos do mercado (Spren, Bodymapp, InBody, Styku). Interface clean, visualização 3D do corpo, comparações lado a lado, relatórios profissionais em PDF e dashboard visual interativo.

### 🎯 Referências de Mercado
- **Spren**: Câmera do celular + AI, relatórios multipágina, coaching personalizado
- **Bodymapp**: Avatar 3D interativo, 20+ medidas, comparação visual
- **InBody**: Padrão profissional, análise segmentar, dashboard de evolução
- **Styku**: Scan 3D, visualização antes/depois com zoom/rotação
- **Body Snapshot**: AI em 30s, precisão ±2% vs DEXA

---

## 1. Fluxo de Avaliação

### 1.1 Iniciar Nova Avaliação
1. Personal clica em "Nova Avaliação"
2. **Seleção do Aluno** (dropdown com busca)
   - Lista todos os alunos ativos
   - Mostra histórico: "Última avaliação: 15/12/2025"
3. **Seleção do Protocolo** (cards visuais)
   - Protocolo de 3 Dobras (Jackson & Pollock)
   - Protocolo de 7 Dobras (Jackson & Pollock)
   - Bioimpedância
   - Protocolo de Perímetros
   - Avaliação Postural (futuro)

### 1.2 Preenchimento dos Dados

#### Dados Básicos (sempre)
- Data da avaliação
- Peso (kg)
- Altura (cm)
- Idade (calculada automaticamente do cadastro)
- Sexo (do cadastro)

#### Por Protocolo

**3 Dobras (homens: peitoral, abdominal, coxa / mulheres: tríceps, supra-ilíaca, coxa)**
- Campos para cada dobra cutânea (mm)
- Cálculo automático: Densidade Corporal → % Gordura → Massa Gorda → Massa Magra

**7 Dobras (peitoral, axilar média, tríceps, subescapular, abdominal, supra-ilíaca, coxa)**
- Campos para cada dobra cutânea (mm)
- Cálculo automático: Densidade Corporal → % Gordura → Massa Gorda → Massa Magra

**Bioimpedância**
- % Gordura (direto do aparelho)
- % Massa Magra
- % Água Corporal
- Taxa Metabólica Basal

**Perímetros**
- Pescoço, Tórax, Cintura, Abdômen, Quadril, Braço Direito, Braço Esquerdo, Antebraço D/E, Coxa D/E, Panturrilha D/E
- Relação Cintura/Quadril (RCQ)

---

## 2. Cálculos Automáticos

### Fórmulas Implementadas

**IMC (Índice de Massa Corporal)**
```
IMC = Peso (kg) / (Altura (m))²
Classificação: Abaixo do peso | Normal | Sobrepeso | Obesidade I, II, III
```

**Protocolo de 3 Dobras (Jackson & Pollock)**
```
Homens:
DC = 1.10938 - 0.0008267(X) + 0.0000016(X²) - 0.0002574(idade)
X = soma das 3 dobras

Mulheres:
DC = 1.0994921 - 0.0009929(X) + 0.0000023(X²) - 0.0001392(idade)
X = soma das 3 dobras

% Gordura = ((4.95 / DC) - 4.50) × 100
```

**Protocolo de 7 Dobras (Jackson & Pollock)**
```
Homens:
DC = 1.112 - 0.00043499(X) + 0.00000055(X²) - 0.00028826(idade)

Mulheres:
DC = 1.097 - 0.00046971(X) + 0.00000056(X²) - 0.00012828(idade)

X = soma das 7 dobras
% Gordura = ((4.95 / DC) - 4.50) × 100
```

**Composição Corporal**
```
Massa Gorda (kg) = (Peso × % Gordura) / 100
Massa Magra (kg) = Peso - Massa Gorda
```

**Peso Ideal (Fórmula de Devine)**
```
Homens: 50kg + 2.3kg × (altura em polegadas - 60)
Mulheres: 45.5kg + 2.3kg × (altura em polegadas - 60)
```

---

## 3. Relatório Visual ULTRA MODERNO 🚀

### 3.1 Estrutura do Relatório (Inspirado em Spren + Styku)

**Página 1: Overview + Avatar 3D**

**Cabeçalho Profissional**
- Logo Core + Dados do Personal (nome, CREF, contato)
- Card do Aluno: Foto (opcional), Nome, Idade, Data da avaliação

**Hero Section: Avatar 3D Interativo** ⭐⭐⭐
- **Silhueta 3D do corpo humano** (frente + costas lado a lado)
- **Mapa de calor corporal** (heatmap):
  - 🟢 Verde: % gordura baixo (excelente)
  - 🟡 Amarelo: % gordura moderado (bom)
  - 🟠 Laranja: % gordura elevado (atenção)
  - 🔴 Vermelho: % gordura alto (crítico)
- **Marcadores nas regiões avaliadas** (dobras/perímetros)
- **Rotação 360°** (na versão web interativa)
- **Comparação lado a lado** (se houver avaliação anterior):
  - Avatar ANTES | Avatar DEPOIS
  - Setas indicando áreas de melhora/piora

**Dashboard de Métricas** (Cards grandes e visuais)
```
┌─────────────────┬─────────────────┬─────────────────┐
│  💪 PESO        │  📏 IMC         │  🔥 % GORDURA   │
│  85.0 kg        │  27.8           │  16.2%          │
│  ↓ -2.5kg       │  Sobrepeso      │  Fitness        │
└─────────────────┴─────────────────┴─────────────────┘

┌─────────────────┬─────────────────┬─────────────────┐
│  🥩 MASSA GORDA │  💪 MASSA MAGRA │  🎯 PESO IDEAL  │
│  13.8 kg        │  71.2 kg        │  72.0 kg        │
│  ↓ -1.8kg       │  ↑ +0.5kg       │  -13.0 kg       │
└─────────────────┴─────────────────┴─────────────────┘
```

**Gráfico de Composição Corporal** (Donut Chart moderno)
- Centro: % Gordura em destaque
- Anel: Gordura (vermelho) vs Massa Magra (verde)
- Legenda com valores absolutos

---

**Página 2: Análise Detalhada**

**Seção 1: Evolução Temporal** (se houver histórico)
- **Gráfico de linha duplo** (estilo InBody):
  - Linha 1: Peso (kg) × Tempo
  - Linha 2: % Gordura × Tempo
  - Área sombreada mostrando zona ideal
- **Tabela comparativa**:
  ```
  ┌──────────────┬──────────┬──────────┬──────────┬──────────┐
  │              │ PRIMEIRA │ ANTERIOR │  ATUAL   │ VARIAÇÃO │
  ├──────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Peso         │ 90.0 kg  │ 87.5 kg  │ 85.0 kg  │ ↓ -5.0kg │
  │ % Gordura    │ 20.5%    │ 18.0%    │ 16.2%    │ ↓ -4.3%  │
  │ Massa Magra  │ 71.5 kg  │ 71.8 kg  │ 71.2 kg  │ ↓ -0.3kg │
  └──────────────┴──────────┴──────────┴──────────┴──────────┘
  ```

**Seção 2: Perímetros** (se aplicável)
- **Diagrama do corpo** com linhas indicando cada medida
- **Gráfico de barras horizontal** comparativo:
  - Barra atual vs barra anterior (cores diferentes)
  - Valores numéricos ao lado
- **Relação Cintura/Quadril (RCQ)**: Card destacado com classificação

**Seção 3: Análise Segmentar** (inspirado em InBody)
- **Braços | Tronco | Pernas** (barras horizontais)
- % de massa magra em cada segmento
- Indicador de simetria (D vs E)

**Seção 4: Recomendações Personalizadas** 🤖
- **Taxa Metabólica Basal (TMB)**: "Seu corpo queima X kcal/dia em repouso"
- **Gasto Calórico Diário Total (TDEE)**: Baseado no nível de atividade
- **Meta Calórica**: Para perda/ganho/manutenção
- **Meta Proteica**: X g/dia (baseado em massa magra)
- **Sugestão de Treino**: Foco em hipertrofia/emagrecimento/manutenção

---

**Página 3: Dados Técnicos** (para o profissional)

**Protocolo Utilizado**
- Nome do protocolo (ex: Jackson & Pollock 3 Dobras)
- Fórmulas aplicadas
- Dobras medidas (com valores em mm)

**Tabela Completa de Medidas**
- Todas as medidas brutas
- Data e hora da coleta
- Observações do avaliador

**Rodapé Profissional**
- "Relatório gerado por Core - Gestão para Personal Trainers"
- Data e hora: dd/mm/yyyy às HH:mm
- Assinatura digital do Personal (nome + CREF)
- QR Code (futuro): Link para versão web interativa

---

## 4. Stack Tecnológico MODERNO

### 4.1 Gráficos e Visualizações
- **Recharts** (já instalado): 
  - Line charts com área sombreada (evolução temporal)
  - Donut charts modernos (composição corporal)
  - Bar charts horizontais (perímetros comparativos)
- **Gradientes CSS/SVG**: Mapa de calor no avatar
- **Animações**: Framer Motion ou CSS transitions para transições suaves

### 4.2 Avatar 3D / Silhueta Corporal ⭐

**Opção 1: SVG Avançado com Gradientes** (RECOMENDADO)
```jsx
// Avatar SVG com mapa de calor
<svg viewBox="0 0 400 800">
  {/* Corpo dividido em regiões */}
  <path id="torso" fill="url(#gradient-torso)" />
  <path id="bracos" fill="url(#gradient-bracos)" />
  <path id="pernas" fill="url(#gradient-pernas)" />
  
  {/* Gradientes baseados no % gordura */}
  <defs>
    <linearGradient id="gradient-torso">
      <stop offset="0%" stop-color={getColor(percentualGordura)} />
      <stop offset="100%" stop-color={getColor(percentualGordura, 0.6)} />
    </linearGradient>
  </defs>
  
  {/* Marcadores de medição */}
  <circle cx="200" cy="150" r="5" fill="#a20100" />
  <text x="210" y="155">Peitoral</text>
</svg>
```

**Opção 2: Canvas API** (para efeitos mais complexos)
- Desenhar silhueta com gradientes radiais
- Animação de transição entre avaliações
- Export para PNG (para incluir no PDF)

**Opção 3: Three.js (futuro - avatar 3D real)**
- Modelo 3D low-poly do corpo humano
- Rotação 360° interativa
- Mapa de textura com gradiente de calor

**Biblioteca de Apoio:**
- `react-spring` ou `framer-motion`: Animações fluidas
- `html2canvas`: Capturar visualizações para PDF
- `react-compare-slider`: Comparação antes/depois (slider interativo)

### 4.3 PDF Profissional
- **jsPDF** + **jspdf-autotable** (já instalado)
- **html2canvas**: Converter gráficos React → imagens base64
- **Canvas API**: Desenhar avatar diretamente no PDF
- **Layout A4 multipágina**: 3 páginas (Overview | Análise | Dados Técnicos)
- **Fontes customizadas**: Adicionar fonte Inter/Poppins para PDF

### 4.4 Interface Moderna (Inspirada em Spren/InBody)

**Design System:**
- **Cards com glassmorphism**: `backdrop-filter: blur(10px)`
- **Gradientes sutis**: Fundos com gradiente suave
- **Sombras elevadas**: `box-shadow` para profundidade
- **Micro-interações**: Hover effects, loading states
- **Dark mode ready**: Preparado para tema escuro (futuro)

**Componentes:**
```jsx
// Card de métrica com ícone e variação
<MetricCard
  icon="💪"
  label="Peso"
  value="85.0 kg"
  change="-2.5 kg"
  trend="down" // up | down | neutral
  color="green"
/>

// Avatar comparativo
<AvatarComparison
  before={avaliacaoAnterior}
  after={avaliacaoAtual}
  showHeatmap={true}
  interactive={true} // permite rotação
/>

// Gráfico de evolução
<EvolutionChart
  data={historicoAvaliacoes}
  metrics={['peso', 'percentualGordura']}
  showGoalZone={true}
/>
```

### 4.5 Experiência do Usuário (UX)

**Fluxo Wizard** (passo a passo):
```
┌─────────────────────────────────────────────┐
│  [1] Aluno  →  [2] Protocolo  →  [3] Dados │
│  ●────────────●────────────────○            │
└─────────────────────────────────────────────┘
```

**Loading States:**
- Skeleton screens enquanto carrega
- Animação de "calculando..." quando salva
- Progress bar ao gerar PDF

**Feedback Visual:**
- Toast notifications (react-hot-toast já instalado)
- Validação em tempo real nos campos
- Preview dos cálculos enquanto digita

**Responsivo:**
- Desktop: Layout em 2 colunas (formulário | preview)
- Tablet: Layout em 1 coluna com tabs
- Mobile: Wizard em tela cheia, um campo por vez

---

## 5. Estrutura de Dados

### 5.1 Tabela: `avaliacoes_fisicas`
```sql
id: uuid
personal_id: uuid (FK → users)
aluno_id: uuid (FK → alunos)
data_avaliacao: date
protocolo: 'dobras_3' | 'dobras_7' | 'bioimpedancia' | 'perimetros'

-- Dados básicos
peso: decimal
altura: decimal
idade: integer (calculado)
sexo: 'M' | 'F' (do aluno)

-- Dobras cutâneas (mm) - nullable
dobra_peitoral: decimal?
dobra_abdominal: decimal?
dobra_coxa: decimal?
dobra_triceps: decimal?
dobra_subescapular: decimal?
dobra_axilar_media: decimal?
dobra_supra_iliaca: decimal?

-- Bioimpedância - nullable
bio_gordura_percentual: decimal?
bio_massa_magra_percentual: decimal?
bio_agua_percentual: decimal?
bio_tmb: decimal?

-- Perímetros (cm) - nullable
perimetro_pescoco: decimal?
perimetro_torax: decimal?
perimetro_cintura: decimal?
perimetro_abdomen: decimal?
perimetro_quadril: decimal?
perimetro_braco_direito: decimal?
perimetro_braco_esquerdo: decimal?
perimetro_antebraco_direito: decimal?
perimetro_antebraco_esquerdo: decimal?
perimetro_coxa_direita: decimal?
perimetro_coxa_esquerda: decimal?
perimetro_panturrilha_direita: decimal?
perimetro_panturrilha_esquerda: decimal?

-- Resultados calculados
imc: decimal
densidade_corporal: decimal?
percentual_gordura: decimal
massa_gorda_kg: decimal
massa_magra_kg: decimal
peso_ideal_kg: decimal
rcq: decimal? (relação cintura/quadril)

-- Observações
observacoes: text?

created_at: timestamp
updated_at: timestamp
```

---

## 6. Interface ULTRA MODERNA (UI/UX) 🎨

### 6.1 Dashboard Principal: `/avaliacao`

**Layout Hero** (inspirado em Bodymapp + Spren):
```
┌─────────────────────────────────────────────────────────────┐
│  🏋️ Avaliações Físicas                    [+ Nova Avaliação] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 📊 TOTAL    │  │ 📅 ESTE MÊS │  │ 🔥 ATIVAS   │         │
│  │    47       │  │      8      │  │     12      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔍 Buscar aluno...                    [Filtros ▼]       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  📋 Avaliações Recentes                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 👤 Carlos Silva          📅 27/01/2026    3 Dobras      ││
│  │ 💪 85kg  📏 175cm  🔥 16.2%           [Ver] [Comparar]  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 👤 Ana Costa             📅 25/01/2026    7 Dobras      ││
│  │ 💪 62kg  📏 165cm  🔥 22.5%           [Ver] [Comparar]  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Tabs Modernos** (com ícones):
- 🆕 **Nova Avaliação** (wizard interativo)
- 📊 **Dashboard** (métricas e gráficos)
- 📜 **Histórico** (timeline de avaliações)
- 📈 **Comparativo** (evolução lado a lado)

---

### 6.2 Wizard de Nova Avaliação (Inspirado em Spren)

**Passo 1: Selecionar Aluno** 🎯
```
┌─────────────────────────────────────────────────────────────┐
│  Quem você vai avaliar hoje?                                 │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔍 Buscar aluno por nome...                             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Alunos Recentes:                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 👤 Carlos    │  │ 👤 Ana       │  │ 👤 Pedro     │      │
│  │ Última: há   │  │ Última: há   │  │ Primeira     │      │
│  │ 30 dias      │  │ 15 dias      │  │ avaliação    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│                                    [Próximo →]               │
└─────────────────────────────────────────────────────────────┘
```

**Passo 2: Escolher Protocolo** 📋
```
┌─────────────────────────────────────────────────────────────┐
│  Qual protocolo você vai usar?                               │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  📏 3 DOBRAS    │  │  📏 7 DOBRAS    │                  │
│  │                 │  │                 │                  │
│  │  Rápido e       │  │  Mais preciso   │                  │
│  │  prático        │  │  e completo     │                  │
│  │                 │  │                 │                  │
│  │  ⏱️ 5 min       │  │  ⏱️ 10 min      │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ ⚡ BIOIMPEDÂNCIA│  │  📐 PERÍMETROS  │                  │
│  │                 │  │                 │                  │
│  │  Com aparelho   │  │  Fita métrica   │                  │
│  │  específico     │  │  tradicional    │                  │
│  │                 │  │                 │                  │
│  │  ⏱️ 2 min       │  │  ⏱️ 15 min      │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                               │
│  [← Voltar]                              [Próximo →]        │
└─────────────────────────────────────────────────────────────┘
```

**Passo 3: Preencher Dados** ✍️
```
┌─────────────────────────────────────────────────────────────┐
│  Avaliação: Carlos Silva | Protocolo: 3 Dobras              │
├─────────────────────────────────────────────────────────────┤
│  DADOS BÁSICOS                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 📅 Data      │  │ ⚖️ Peso (kg) │  │ 📏 Altura(cm)│      │
│  │ 27/01/2026   │  │ 85.0         │  │ 175          │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  DOBRAS CUTÂNEAS (mm)                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 💪 Peitoral  │  │ 🔥 Abdominal │  │ 🦵 Coxa      │      │
│  │ 12           │  │ 18           │  │ 15           │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 💡 CÁLCULOS AUTOMÁTICOS                                 ││
│  │                                                          ││
│  │  IMC: 27.8 (Sobrepeso) 🟡                               ││
│  │  % Gordura: 16.2% (Fitness) 🟢                          ││
│  │  Massa Gorda: 13.8 kg                                   ││
│  │  Massa Magra: 71.2 kg                                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  📝 Observações (opcional)                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Aluno relatou treino intenso ontem...                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  [← Voltar]          [Salvar]          [Salvar e Relatório]│
└─────────────────────────────────────────────────────────────┘
```

**Passo 4: Preview do Relatório** 👁️
```
┌─────────────────────────────────────────────────────────────┐
│  Relatório de Avaliação - Carlos Silva                      │
│  [Imprimir] [Baixar PDF] [Compartilhar] [Fechar]           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         🧍 AVATAR 3D COM MAPA DE CALOR 🔥             │  │
│  │                                                        │  │
│  │    ┌─────────┐              ┌─────────┐              │  │
│  │    │ FRENTE  │              │ COSTAS  │              │  │
│  │    │         │              │         │              │  │
│  │    │  🟢🟡   │              │  🟢🟡   │              │  │
│  │    │  🟢🟢   │              │  🟢🟢   │              │  │
│  │    │  🟡🟡   │              │  🟡🟢   │              │  │
│  │    │  🟢🟢   │              │  🟢🟢   │              │  │
│  │    └─────────┘              └─────────┘              │  │
│  │                                                        │  │
│  │  [Rotacionar 360°] [Comparar com anterior]           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  📊 MÉTRICAS PRINCIPAIS                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 💪 PESO  │ │ 📏 IMC   │ │ 🔥 GORD. │ │ 🥩 MAGRA │      │
│  │ 85.0 kg  │ │ 27.8     │ │ 16.2%    │ │ 71.2 kg  │      │
│  │ ↓ -2.5kg │ │ Sobrepeso│ │ Fitness  │ │ ↑ +0.5kg │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                               │
│  📈 GRÁFICO DE EVOLUÇÃO (últimas 6 avaliações)              │
│  [Gráfico de linha: Peso e % Gordura ao longo do tempo]    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### 6.3 Dashboard de Evolução (Inspirado em InBody)

```
┌─────────────────────────────────────────────────────────────┐
│  Evolução: Carlos Silva                    [Período: 6M ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 PROGRESSO GERAL                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                          ││
│  │  Peso:     90kg ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 85kg   ││
│  │            ├─────────────────────────────────────┤       ││
│  │            Meta: 80kg                  ↓ -5kg (6%)      ││
│  │                                                          ││
│  │  Gordura:  20% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 16%     ││
│  │            ├─────────────────────────────────────┤       ││
│  │            Meta: 12%                   ↓ -4% (20%)      ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  📈 GRÁFICO DE LINHA (Peso × % Gordura)                     │
│  [Gráfico interativo com zoom e tooltip]                    │
│                                                               │
│  📋 HISTÓRICO DE AVALIAÇÕES                                  │
│  ┌──────┬─────────┬──────┬──────┬────────┬────────┐        │
│  │ DATA │ PESO    │ IMC  │ GORD │ M.GORDA│ M.MAGRA│        │
│  ├──────┼─────────┼──────┼──────┼────────┼────────┤        │
│  │ 27/01│ 85.0 kg │ 27.8 │ 16.2%│ 13.8kg │ 71.2kg │ [Ver] │
│  │ 27/12│ 87.5 kg │ 28.6 │ 18.0%│ 15.8kg │ 71.7kg │ [Ver] │
│  │ 27/11│ 90.0 kg │ 29.4 │ 20.5%│ 18.5kg │ 71.5kg │ [Ver] │
│  └──────┴─────────┴──────┴──────┴────────┴────────┘        │
│                                                               │
│  [Exportar Evolução em PDF]                                  │
└─────────────────────────────────────────────────────────────┘
```

---

### 6.4 Comparação Lado a Lado (Inspirado em Styku)

```
┌─────────────────────────────────────────────────────────────┐
│  Comparação: Carlos Silva                                    │
│  [Selecionar avaliações: 27/11/2025 ↔️ 27/01/2026]          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐    ┌──────────────────────┐       │
│  │      ANTES           │    │       DEPOIS         │       │
│  │   27/11/2025         │    │    27/01/2026        │       │
│  ├──────────────────────┤    ├──────────────────────┤       │
│  │   🧍 Avatar 3D       │    │   🧍 Avatar 3D       │       │
│  │   (mais vermelho)    │    │   (mais verde)       │       │
│  │                      │    │                      │       │
│  │   90.0 kg            │ ➡️  │   85.0 kg            │       │
│  │   20.5% gordura      │    │   16.2% gordura      │       │
│  │   18.5kg gorda       │    │   13.8kg gorda       │       │
│  │   71.5kg magra       │    │   71.2kg magra       │       │
│  └──────────────────────┘    └──────────────────────┘       │
│                                                               │
│  📊 VARIAÇÕES                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Peso:        ↓ -5.0 kg  (-5.6%)  ✅ Excelente!         ││
│  │ % Gordura:   ↓ -4.3%    (-21%)   ✅ Muito bom!         ││
│  │ Massa Gorda: ↓ -4.7 kg  (-25%)   ✅ Ótimo progresso!   ││
│  │ Massa Magra: ↓ -0.3 kg  (-0.4%)  ⚠️ Manter treino força││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  [Baixar Comparativo em PDF]                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Classificações e Referências

### 7.1 IMC
- < 18.5: Abaixo do peso
- 18.5 - 24.9: Normal
- 25.0 - 29.9: Sobrepeso
- 30.0 - 34.9: Obesidade Grau I
- 35.0 - 39.9: Obesidade Grau II
- ≥ 40.0: Obesidade Grau III

### 7.2 % de Gordura (Homens)
- Essencial: 2-5%
- Atleta: 6-13%
- Fitness: 14-17%
- Aceitável: 18-24%
- Obesidade: ≥ 25%

### 7.3 % de Gordura (Mulheres)
- Essencial: 10-13%
- Atleta: 14-20%
- Fitness: 21-24%
- Aceitável: 25-31%
- Obesidade: ≥ 32%

---

## 8. Implementação por Fases

### Fase 1: MVP (Mínimo Viável)
- ✅ Remover "Financeiro" do menu
- ✅ Criar rota e página "Avaliação"
- ✅ Formulário: Protocolo de 3 Dobras
- ✅ Cálculos automáticos (IMC, % Gordura, Composição)
- ✅ Relatório básico (texto + tabela)
- ✅ Salvar no banco (tabela `avaliacoes_fisicas`)

### Fase 2: Visualização Avançada
- ✅ Silhueta corporal com gradiente de cores
- ✅ Gráficos (pizza, barras)
- ✅ PDF profissional com silhueta

### Fase 3: Protocolos Adicionais
- ✅ Protocolo de 7 Dobras
- ✅ Bioimpedância
- ✅ Perímetros

### Fase 4: Histórico e Evolução
- ✅ Lista de avaliações por aluno
- ✅ Gráficos de evolução (peso, % gordura)
- ✅ Comparativo: Atual vs Anterior vs Primeira

### Fase 5: Extras
- 🔄 Avaliação Postural (fotos + análise)
- 🔄 Envio de relatório por WhatsApp
- 🔄 Metas e acompanhamento

---

## 9. Diferenciais ULTRA TECNOLÓGICOS 🚀

### O que torna o Core diferente:

1. **🎨 Avatar 3D com Mapa de Calor Corporal**
   - Visualização imediata do % de gordura no corpo
   - Gradiente de cores intuitivo (verde = bom, vermelho = atenção)
   - Comparação lado a lado (antes/depois) estilo Styku
   - Rotação 360° interativa (na web)

2. **🧮 Cálculos Científicos em Tempo Real**
   - Fórmulas validadas (Jackson & Pollock, Siri, Brozek)
   - Resultados aparecem enquanto você digita
   - Classificações automáticas por idade/sexo
   - Precisão comparável a DEXA (±2%)

3. **📊 Dashboard de Evolução Inteligente**
   - Gráficos de linha com área sombreada (zona ideal)
   - Comparativo: Primeira | Anterior | Atual | Variação
   - Métricas com setas e % de mudança
   - Progress bars visuais para metas

4. **📱 Experiência Mobile-First**
   - Wizard passo a passo (um campo por vez no mobile)
   - Cards grandes e tocáveis
   - Feedback visual instantâneo
   - Gestos: swipe para comparar, pinch to zoom no avatar

5. **📄 Relatório Profissional Multipágina**
   - PDF em A4 com 3 páginas (Overview | Análise | Técnico)
   - Avatar 3D colorido incluído no PDF
   - Gráficos de evolução exportados como imagem
   - Assinatura digital do Personal (nome + CREF)
   - QR Code (futuro): Link para versão web interativa

6. **🎯 Análise Segmentar** (inspirado em InBody)
   - Braços | Tronco | Pernas (barras horizontais)
   - Indicador de simetria (D vs E)
   - Recomendações personalizadas (TMB, TDEE, meta proteica)

7. **🔄 Comparação Inteligente**
   - Slider interativo antes/depois (react-compare-slider)
   - Destaque automático de áreas que melhoraram/pioraram
   - Feedback motivacional ("↓ -5kg - Excelente progresso!")

8. **💾 Histórico Completo**
   - Timeline de todas as avaliações
   - Filtros por aluno, protocolo, período
   - Busca rápida
   - Export em lote (CSV/PDF)

9. **🎨 Design Moderno Core**
   - Glassmorphism nos cards
   - Gradientes sutis
   - Animações fluidas (framer-motion)
   - Micro-interações (hover, loading states)
   - Identidade visual Core (vermelho #a20100)

10. **🚀 Performance**
    - Cálculos instantâneos (< 100ms)
    - Geração de PDF rápida (< 2s)
    - Lazy loading de histórico
    - Cache de avatares renderizados

---

## 10. Exemplo de Uso

**Cenário:**
Personal Jorge tem um aluno chamado Carlos que quer emagrecer.

**Fluxo:**
1. Jorge acessa "Avaliação" → "Nova Avaliação"
2. Seleciona "Carlos" no dropdown
3. Escolhe "Protocolo de 3 Dobras"
4. Preenche: Peso 85kg, Altura 175cm, Dobras (peitoral 12mm, abdominal 18mm, coxa 15mm)
5. Sistema calcula automaticamente:
   - IMC: 27.8 (Sobrepeso)
   - % Gordura: 16.2% (Fitness)
   - Massa Gorda: 13.8kg
   - Massa Magra: 71.2kg
6. Jorge clica "Gerar Relatório"
7. Aparece preview com:
   - Silhueta do corpo em verde-amarelo (16% é bom)
   - Gráfico de pizza: 16% gordura, 84% massa magra
   - Tabela com todos os dados
8. Jorge clica "Baixar PDF" e entrega para Carlos

**3 meses depois:**
- Jorge faz nova avaliação de Carlos
- Sistema mostra gráfico de evolução: Peso 85kg → 78kg, % Gordura 16.2% → 12.5%
- Carlos vê progresso visual na silhueta (mais verde, menos amarelo)

---

---

## 10. Mockup Visual do Relatório Final

### Página 1: Hero + Avatar
```
╔═══════════════════════════════════════════════════════════╗
║  RELATÓRIO DE AVALIAÇÃO FÍSICA                            ║
║  [Faixa vermelha Core #a20100]                            ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║  Personal: Jorge Amado | CREF: 123456-G/SP               ║
║  Aluno: Carlos Silva | Idade: 28 anos | 27/01/2026       ║
║  ───────────────────────────────────────────────────────  ║
║                                                            ║
║  ┌────────────────────────────────────────────────────┐   ║
║  │          COMPOSIÇÃO CORPORAL ATUAL                 │   ║
║  │                                                     │   ║
║  │    🧍 AVATAR FRENTE    🧍 AVATAR COSTAS            │   ║
║  │    [Mapa de calor]     [Mapa de calor]            │   ║
║  │    🟢🟢🟡🟡🟢🟢        🟢🟢🟡🟢🟢🟢            │   ║
║  │                                                     │   ║
║  │    Classificação: FITNESS (16.2% gordura)          │   ║
║  └────────────────────────────────────────────────────┘   ║
║                                                            ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    ║
║  │ 💪 PESO  │ │ 📏 IMC   │ │ 🔥 GORD. │ │ 🥩 MAGRA │    ║
║  │ 85.0 kg  │ │ 27.8     │ │ 16.2%    │ │ 71.2 kg  │    ║
║  │ ↓ -2.5kg │ │ Sobrepeso│ │ Fitness  │ │ ↑ +0.5kg │    ║
║  └──────────┘ └──────────┘ └──────────┘ └──────────┘    ║
║                                                            ║
║  [Gráfico Donut: 16% Gordura | 84% Massa Magra]          ║
║                                                            ║
╚═══════════════════════════════════════════════════════════╝
```

### Página 2: Evolução + Análise
```
╔═══════════════════════════════════════════════════════════╗
║  EVOLUÇÃO TEMPORAL                                         ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║  📈 [Gráfico de Linha: 6 meses]                           ║
║     Peso (linha azul) + % Gordura (linha vermelha)        ║
║     Área sombreada = zona ideal                           ║
║                                                            ║
║  📊 TABELA COMPARATIVA                                     ║
║  ┌──────────┬──────────┬──────────┬──────────┬─────────┐ ║
║  │          │ PRIMEIRA │ ANTERIOR │  ATUAL   │ VARIAÇÃO│ ║
║  ├──────────┼──────────┼──────────┼──────────┼─────────┤ ║
║  │ Data     │ 27/09/25 │ 27/12/25 │ 27/01/26 │ 4 meses │ ║
║  │ Peso     │ 90.0 kg  │ 87.5 kg  │ 85.0 kg  │ ↓ -5.0kg│ ║
║  │ % Gord.  │ 20.5%    │ 18.0%    │ 16.2%    │ ↓ -4.3% │ ║
║  │ M. Gorda │ 18.5 kg  │ 15.8 kg  │ 13.8 kg  │ ↓ -4.7kg│ ║
║  │ M. Magra │ 71.5 kg  │ 71.7 kg  │ 71.2 kg  │ ↓ -0.3kg│ ║
║  └──────────┴──────────┴──────────┴──────────┴─────────┘ ║
║                                                            ║
║  💡 ANÁLISE AUTOMÁTICA:                                    ║
║  ✅ Perda de gordura consistente (-4.3% em 4 meses)       ║
║  ✅ Massa magra preservada (-0.3kg é normal)              ║
║  🎯 Continue assim! Meta de 12% em ~3 meses               ║
║                                                            ║
╚═══════════════════════════════════════════════════════════╝
```

### Página 3: Dados Técnicos
```
╔═══════════════════════════════════════════════════════════╗
║  DADOS TÉCNICOS DA AVALIAÇÃO                               ║
╠═══════════════════════════════════════════════════════════╣
║  Protocolo: Jackson & Pollock - 3 Dobras (Homens)        ║
║  Avaliador: Jorge Amado (CREF 123456-G/SP)               ║
║  ───────────────────────────────────────────────────────  ║
║  MEDIDAS COLETADAS:                                        ║
║  • Peitoral: 12 mm                                        ║
║  • Abdominal: 18 mm                                       ║
║  • Coxa: 15 mm                                            ║
║  • Soma: 45 mm                                            ║
║  ───────────────────────────────────────────────────────  ║
║  CÁLCULOS:                                                 ║
║  • Densidade Corporal: 1.0612 g/ml                        ║
║  • % Gordura: 16.2% (Fórmula de Siri)                    ║
║  • Massa Gorda: 13.8 kg                                   ║
║  • Massa Magra: 71.2 kg                                   ║
║  ───────────────────────────────────────────────────────  ║
║  OBSERVAÇÕES:                                              ║
║  Aluno relatou treino intenso no dia anterior.            ║
║  Recomendado: manter frequência de treinos.               ║
║                                                            ║
║  ───────────────────────────────────────────────────────  ║
║  Core - Gestão para Personal Trainers | 27/01/2026 14:35 ║
║  Página 3                                                  ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Conclusão: O Futuro da Avaliação Física

Este módulo posiciona o **Core** no **estado da arte** da tecnologia fitness, combinando:

✨ **Design de Apps Premium** (Spren, Bodymapp, Styku)  
🧠 **Inteligência Automática** (cálculos, sugestões, análises)  
🎨 **Visualização 3D Moderna** (avatar com mapa de calor)  
📊 **Analytics Avançado** (evolução, comparações, tendências)  
📱 **UX de Classe Mundial** (wizard, preview, feedback visual)  
🏆 **Precisão Científica** (fórmulas validadas, múltiplos protocolos)

**Resultado:** Personal trainers terão uma ferramenta **profissional, moderna e impressionante** para avaliar e acompanhar seus alunos, gerando relatórios que rivalizem com clínicas e academias de alto padrão! 🚀💪

# Design system

Marca tipográfica `Core.` com C maiúsculo, peso forte e espaçamento compacto. O ponto é um acento vermelho; nenhum haltere é usado como marca. Fonte de sistema garante legibilidade e compatibilidade; a escolha de uma família licenciada específica pode ocorrer depois.

| Token      | Valor   | Aplicação         |
| ---------- | ------- | ----------------- |
| background | #111114 | Fundo             |
| surface    | #202024 | Cards             |
| elevated   | #27272C | Ações secundárias |
| border     | #34343B | Separadores       |
| red        | #A20100 | Ações principais  |
| secondary  | #A3A3AD | Texto secundário  |
| text       | #FFFFFF | Texto principal   |

O vermelho oficial é usado em botões com texto branco. Em ícones/texto sobre fundo escuro, tons claros de vermelho melhoram a leitura. Estados usam texto e ícones além da cor. Cards: raio 16, espaçamento interno 22. Botões e campos: área mínima de aproximadamente 46–48 pontos. Hierarquia: título 30/38, seção 20/28, corpo 14/22, auxiliar 11–12.

Componentes compartilhados: Button, Card, Field, Choice, Heading, Label, Loading e Notice. Campos têm nomes de acessibilidade, botões têm roles/estados e erros ficam em texto. Navegação mobile: cinco destinos inferiores; web a partir de 1000 px: lateral recolhível e busca por nome. Formulários alternam seções e adaptam colunas.

Estados explícitos: ambiente não configurado, acesso pendente, carteira vazia, busca sem resultado, carregamento, falha de servidor, sucesso de gravação e descarte de alterações. Módulos futuros são rotulados como planejados.

Auditoria completa com VoiceOver/TalkBack, navegação por teclado e testes em dispositivos físicos ainda pendentes. Não há certificação formal de acessibilidade nesta entrega.

## Simplificação de uso

O início prioriza quatro ações: Criar treino, Meus alunos, Financeiro e Mensagens. No celular elas formam uma grade de atalhos; os indicadores se limitam a ativos e novas entradas no mês. Banners institucionais e chamadas para recursos indisponíveis saíram desse fluxo.

Montagem de treino usa três etapas nomeadas e abas para cada treino. Cartões de exercícios mostram o resumo e abrem a edição individual. Campos avançados ficam recolhidos. Ações por ícone têm rótulos acessíveis; seleções indicam o estado também por semântica, além da cor. Remoções de treino/exercício pedem confirmação. Revisão precede publicação.

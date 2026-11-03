# Treinos — núcleo implementado

## Fluxo

O editor agora organiza a montagem em três etapas: Aluno, Exercícios e Revisão. A escolha do aluno sugere o nome do programa e aproveita a frequência semanal cadastrada, que continua editável na prescrição. Estruturas Único/AB/ABC/ABCD criam treinos vazios; não prescrevem conteúdo automaticamente. Cada treino tem sua aba e somente um exercício fica expandido por vez.

A seleção permite adicionar vários exercícios, pesquisar enquanto digita e usar favoritos. Um exercício ausente pode ser cadastrado dentro da seleção sem perder o rascunho. Séries, repetições e intervalo ficam juntos; carga, esforço, tempo e observações aparecem sob demanda. A revisão mostra todas as divisões e parâmetros, salva se necessário e exige uma segunda confirmação explícita para liberar. Rascunhos continuam privados.

1. Personal cadastra exercícios próprios ou licenciados.
2. Cria um programa vinculado a um aluno, com duração, frequência e divisões.
3. Adiciona exercícios, séries, repetições e intervalos; parâmetros opcionais aparecem sob demanda.
4. Salva um rascunho privado.
5. Revisa e confirma explicitamente a disponibilização.
6. O servidor valida posse do programa, aluno ativo, versão do rascunho e origem dos exercícios.
7. Uma versão imutável recebe uma cópia das instruções e dos parâmetros prescritos.
8. O aluno visualiza a última versão liberada e registra o que realizou.
9. A sessão fica vinculada à versão original, mesmo após alterações na biblioteca ou no rascunho.

## Banco e segurança

`exercises`, `training_programs`, `program_versions` e `training_sessions` usam RLS. FKs compostas protegem relações entre tenants. O cliente não tem INSERT/UPDATE/DELETE em versões publicadas ou sessões. As duas operações de publicação/conclusão passam por funções privadas com checks de identidade, wrappers invoker públicos e grants restritos.

Publicação bloqueia edição concorrente por timestamp e serializa revisões com lock do programa. Sessões exigem identidade do próprio aluno ativo, exercício pertencente à prescrição, valores válidos e ao menos uma série concluída. Chave de idempotência permite reenviar a mesma conclusão sem duplicar o histórico; mesma chave com payload diferente falha.

O roteiro `tests/live-training-rollback.sql` passou no PostgreSQL hospedado, sem persistir fixtures. PGlite e UI executam cenários adicionais isolados.

## Limites atuais da fase 2

- Vídeos são links HTTPS abertos externamente; upload próprio, imagens e player embutido ainda não implementados.
- Biblioteca tem busca por nome, grupo exato, favoritos e paginação; tags e equipamento são dados cadastrados, sem todos os filtros combinados ainda.
- Duplicação reaproveita programa como modelo; coleções de exercícios e catálogo de modelos independentes continuam pendentes.
- Ordenação por botões; sem gesto de arrastar no celular.
- Histórico mostra as 30 sessões recentes e até 20 publicações; paginação completa, gráficos e comparação por exercício ainda pendentes.
- Duração/frequência são prescritas; datas de vigência, encerramento e renovação de programas ainda precisam de implementação.
- A execução não promete offline. Estado em memória permanece ao trocar abas internas, mas recarregar/fechar pode perder registros não enviados. Não usar como solução offline até implementar cache protegido e sincronização.
- Substituições de exercício, métodos agrupados e progressão automatizada ainda pendentes.
- Core AI permanece desabilitado. Nenhum treino é gerado ou publicado automaticamente por IA.

Referência pública de interação consultada: https://ajuda.mfitpersonal.com.br/ajuda/professor/como-criar-um-treino-para-o-meu-aluno-no-app-da-mfit/. A implementação mantém identidade própria; não copia biblioteca, vídeos ou telas do serviço.

Esses limites impedem declarar a fase 2 integralmente concluída. O núcleo de prescrição/execução está implementado e verificado; a homologação em Android/iOS físicos permanece pendente.

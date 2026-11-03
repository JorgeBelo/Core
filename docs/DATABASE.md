# Banco de dados

## Migração implementada

`20261103165452_core_foundation.sql` cria:

| Tabela        | Finalidade                                                 | Acesso do aluno            |
| ------------- | ---------------------------------------------------------- | -------------------------- |
| professionals | Identidade do profissional vinculada a Auth                | Nenhum                     |
| students      | Cadastro e vínculo profissional/aluno; user_id opcional    | Apenas própria linha ativa |
| student_notes | Notas profissionais segregadas, estrutura preparada sem UI | Nenhum                     |
| audit_events  | Metadados de criação/edição, sem cópia de conteúdo pessoal | Nenhum                     |

`students` representa o vínculo e seus dados de acompanhamento. O mesmo usuário Auth pode ter vínculos com diferentes profissionais. Não existe uma ficha global que permita a um profissional sobrescrever informações de outro. O aluno lê seus vínculos ativos; a interface inicial mostra um deles, seleção entre múltiplos vínculos ainda pendente.

IDs são UUID; timestamps são timestamptz; datas de nascimento e início são date. E-mail é opcional e único por profissional, com índice em lowercase. Não há exclusão física pelo cliente. Inativação mantém o histórico. A vinculação de `user_id` é administrativa e não pode ser alterada pelo frontend. `professional_id`, identidades e timestamps também não são editáveis pelo cliente.

Índices cobrem tenant/status, tenant/nome e tenant/data de início. Busca inicial por ILIKE é paginada; trigramas serão adicionados se métricas reais de volume justificarem. Não prometer latência constante para busca de substring em milhões de registros.

RLS está habilitada em todas as tabelas públicas. Grants são revogados explicitamente; `authenticated` recebe somente operações/colunas necessárias. Notas têm FK composta para impedir associação entre tenants. Auditoria é escrita por trigger restrito, com leitura pelo profissional proprietário.

## Treinamento implementado

`20261103165912_core_training.sql` cria exercises, training_programs (rascunhos), program_versions (publicações imutáveis) e training_sessions (execução). Publicação e conclusão ocorrem em RPCs com validação, identidade derivada do Auth e auditoria. Aluno não lê rascunho nem altera publicação. Detalhes e limites em TRAINING.md.

`20261103165510_legacy_security_hardening.sql` endurece funções/tabelas antigas se existirem; não apaga dados. As versões locais correspondem ao histórico do Supabase hospedado. Objetos do legado anterior continuam fora do baseline local, por isso evitar db push cego contra a base existente.

## Modelo de expansão (inclui complementos ainda não migrados)

Todas as relações de domínio deverão carregar professional_id, com FKs compostas quando ligadas a outra entidade do tenant.

| Fase        | Entidades previstas                                                                                | Regras principais                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 2           | muscle_groups, exercises, exercise_media, exercise_collections                                     | Exercícios próprios/licenciados, paginação, favoritos por profissional                                    |
| 2           | programs, program_versions, workout_days, prescriptions, prescription_exercises                    | Versões imutáveis publicadas; aprovação explícita; aluno somente material liberado                        |
| 2           | training_sessions, performed_sets, exercise_feedback                                               | Referência à versão prescrita; carga e repetição executadas separadas da prescrição                       |
| 3           | commercial_plans, contracts, installments, receipts, receipt_allocations                           | Valores em centavos; pagamentos parciais transacionais; idempotência; vencimento não confirma recebimento |
| 3           | expense_categories, expenses, expense_payments                                                     | Competência e caixa distintos; recorrência gera obrigações sem confirmar baixa                            |
| 4           | consents, anamneses, assessment_protocols, assessments, assessment_measurements, assessment_photos | Método, data, finalidade, restrição e liberação do aluno; storage privado                                 |
| 4           | appointments, appointment_attendees, attendance, makeup_credits, scheduling_policies               | Conflitos no banco; regras versionadas de reposição; histórico de alterações                              |
| 5           | conversations, messages, notifications, notification_preferences                                   | Participantes autorizados; minimização e controle de notificações                                         |
| 6           | ai_proposals, ai_reviews                                                                           | Contexto autorizado; rascunho estruturado; publicação somente após aprovação profissional                 |
| transversal | professional_settings, retention_requests, export_requests                                         | Políticas versionadas, exportação restrita e exclusão administrada                                        |

## Executar e validar

Ver README para Supabase CLI. Os testes PGlite executam a migração real em PostgreSQL com uma pequena camada Auth substituta (`auth.users`, `auth.uid`, roles). Validam RLS, grants, constraints e triggers; não substituem testes no Auth, PostgREST ou Storage do Supabase real. A integração final no stack local permanece obrigatória antes de uso com alunos.

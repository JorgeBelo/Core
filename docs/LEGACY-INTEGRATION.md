# Integração com o legado e continuidade

O briefing novo prevalece integralmente. Reutilizar infraestrutura não significa adaptar o produto novo às limitações antigas.

## Decisões executadas

- Supabase hospedado existente reutilizado; projeto confirmado ativo e saudável pela integração oficial.
- Tabelas `users`, `alunos` e `agenda_personal` preservadas, inclusive todos os seus registros.
- Novas tabelas de identidade, alunos e treinos criadas sem renomear ou substituir tabelas antigas.
- Proprietário existente no Auth vinculado a `professionals`, sem redefinir senha ou criar credencial privilegiada no cliente.
- Permissões de execução das funções administrativas/trigger antigas removidas de `anon` e `authenticated`; acesso anônimo às tabelas antigas revogado; search_path das funções antigas fixado. Nenhuma função de exclusão foi executada.
- Não há cron de exclusão encontrado no momento da inspeção.

## Dados antigos

Importação ainda não realizada. O cadastro antigo armazena valor e status de mensalidade diretamente no aluno e não fornece a mesma estrutura de início/contrato/recebimento do modelo novo. Não inferir datas, pagamentos confirmados ou contratos a partir de informações insuficientes.

A migração de dados deverá ter mapa explícito de identidades e campos, exportação restrita, conferência de totais, idempotência e reconciliação. O antigo `payment_status='pago'` não é evidência suficiente para inventar um recebimento no financeiro novo. O acesso do aluno também exige vínculo de identidade validado, não só coincidência de e-mail.

## GitHub

Repositório existente: https://github.com/JorgeBelo/Core

A nova aplicação é desenvolvida em branch separada da `main`, preservando o histórico da aplicação React/Vite anterior. O novo root contém o monorepo universal; essa substituição é uma mudança revisável na branch, sem merge automático. Não há obrigação de manter dois frontends ativos.

O repositório existente é público. Publicar somente código, testes e documentação técnica. Nunca enviar `.env`, banco, dumps, tokens, credenciais, dados de alunos ou capturas da conta real. Fixtures de testes usam nomes e identidades explicitamente artificiais.

O workflow de qualidade não acessa dados reais. Configuração `vercel.json` desativa deploy automático na nova branch. CI não publica em lojas, não aplica migrações em produção e não contrata serviços.

## Migrações

Os nomes locais foram alinhados às versões efetivamente registradas no Supabase:

1. `20261103165452_core_foundation.sql`
2. `20261103165510_legacy_security_hardening.sql`
3. `20261103165912_core_training.sql`
4. `20261103173924_core_finance.sql`
5. `20261103174116_finance_indexes_and_policies.sql`
6. `20261103180931_student_monthly_fee_and_frequency.sql`
7. `20261103182257_professional_profile_and_student_messages.sql`

Em ambiente novo, aplicar na ordem. Em ambiente hospedado atual, já estão registradas: não executar novamente. Não usar `db reset`, limpeza do legado, restore ou sincronização destrutiva. Para desenvolver com CLI contra esse projeto, verificar o histórico antes de qualquer `db push`, pois o legado pré-existente ainda não possui uma migração de baseline completa.

## Ambiente Windows

Instalador Docker Desktop oficial baixado, checksum conferido e assinatura Docker válida. A instalação por usuário falhou na verificação de pré-requisitos: VirtualMachinePlatform desabilitado. WSL ausente; virtualização de firmware desativada. Habilitar esses recursos exige administrador, acesso ao BIOS/UEFI e possivelmente reinicialização pelo proprietário. Nenhuma reinicialização foi executada e o Docker não foi declarado instalado.

Referências: https://docs.docker.com/desktop/setup/install/windows-install/ e https://learn.microsoft.com/en-us/windows/wsl/install

## Alertas residuais

Após o endurecimento, as funções administrativas antigas deixaram de aparecer como executáveis pela API pública no advisor. Permanecem avisos sobre descoberta de esquema GraphQL para usuários autenticados (RLS continua protegendo linhas) e proteção contra senhas vazadas desabilitada no Auth. Revisar esta última opção no painel, incluindo disponibilidade no plano, sem contratar recursos automaticamente.

Fontes de remediação:

- https://supabase.com/docs/guides/database/database-linter?lint=0027_pg_graphql_authenticated_table_exposed
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Após o financeiro, os avisos de FKs sem índice foram corrigidos. Não há avisos de políticas permissivas duplicadas nas tabelas financeiras. Persistem otimizações de políticas duplicadas/initplan do legado, mantidas até reconciliação específica; índices ainda sem uso são esperados em tabelas novas e não devem ser removidos apenas por esse aviso.

# Operação e segurança

## Estado atual do ambiente hospedado

Supabase existente conectado; tabelas novas aplicadas sem remover o legado. Login confirmado pelo proprietário e cenário `tests/live-training-rollback.sql` aprovado no PostgreSQL hospedado. Nenhum dado de teste desse cenário foi persistido. Credenciais do cliente ficam no `.env` ignorado. A configuração local por Docker permanece opcional e bloqueada pelos pré-requisitos do Windows registrados em LEGACY-INTEGRATION.md.

Auditoria agora também registra aprovação de versão e conclusão de sessão. Ver TRAINING.md para controles de publicação/execução. O template de recuperação descrito abaixo ainda precisa ser conferido no Auth hospedado: os testes de recuperação existentes são testes de interface com fixtures.

## Antes de uso real

Validar stack Supabase real, e-mail, perfis, recuperação e acesso cruzado. Usar ambientes distintos para desenvolvimento e produção. Ativar HTTPS em produção. Definir responsável pelo tratamento, contato, finalidades, bases aplicáveis, retenção, procedimentos de exportação e exclusão e texto de privacidade. Esta entrega contém controles técnicos iniciais; não representa declaração de conformidade jurídica integral.

Não coletar informações de saúde ou fotografias antes dos controles da fase 4 e da revisão operacional. Não colocar segredos em variáveis EXPO_PUBLIC. Chave publicável/anon funciona sob RLS e pode ir ao cliente; `service_role`, chaves secretas, SMTP e credenciais do banco ficam exclusivamente em ambiente administrativo/servidor.

## Provisionamento

No Studio local, Authentication → Users → Add user. Definir e-mail/senha forte e confirmar a conta. Copiar UUID do usuário. Executar no SQL Editor (substituir placeholders):

```sql
insert into public.professionals(user_id,display_name)
values ('UUID-DO-AUTH','Nome do profissional');
```

Para aluno, criar outra conta Auth e vincular administrativamente, confirmando identidade antes de liberar:

```sql
update public.students
set user_id = 'UUID-DO-ALUNO-NO-AUTH'
where id = 'UUID-DO-CADASTRO' and professional_id = 'UUID-DO-PROFISSIONAL';
```

Nunca vincular por simples coincidência de e-mail enviado pelo cliente. O SQL de provisionamento é uma operação privilegiada. Nesta versão não há convite automatizado ou tela de gestão de contas.

## Recuperação

No template de e-mail **Reset Password** do Supabase Auth, usar um código explícito:

```html
<h2>Recuperação de acesso ao Core</h2>
<p>Seu código é: {{ .Token }}</p>
<p>Se você não solicitou, ignore esta mensagem.</p>
```

O app recebe e-mail, código e nova senha; `verifyOtp(type: recovery)` seguido de `updateUser` conclui o fluxo. A sessão de recuperação é encerrada por tentativa de saída mesmo quando a atualização falha. Não depende de capturar tokens em URL. Configure também uma política de senha de pelo menos 12 caracteres no Auth. Em desenvolvimento, consulte o serviço de e-mail local indicado por `supabase status`. Em produção, configurar SMTP e limites de envio. Validar esse fluxo no stack real, incluindo falhas de rede, antes de liberar acesso.

## Sessões e auditoria

Saída usa Supabase Auth. O cache é descartado quando muda a identidade. Web usa memória; mobile SecureStore. A perda de acesso no banco é efetiva mesmo com token ainda válido. Revogação de refresh token não invalida instantaneamente um access token já emitido: considerar expiração/configuração de sessão no servidor.

Auditoria inicial registra ator, entidade, ação e data de criação/edição de aluno, sem conteúdo pessoal. Não inclui ainda exportação, leitura, alterações administrativas externas ou relatórios de auditoria. Não pode ser alterada/apagada pelo cliente comum.

## Backup, restauração e exclusão

Ainda não existe job de backup automatizado. Antes de produção, definir frequência, retenção, criptografia, destino separado e ensaio de restauração. CLI oficial pode exportar o banco; confirmar opções compatíveis com a versão usada. Dados de Auth/Storage precisam de procedimento próprio: um dump de tabelas públicas não equivale a backup completo.

Para teste local, uma exportação de dados pode ser criada com `pnpm dlx supabase db dump --local --data-only -f work/backup.sql` (criar `work/` e protegê-la; contém dados pessoais). Não versionar dumps. Testar restauração em ambiente descartável antes de depender dela. Exportação e exclusão solicitadas por titulares são procedimentos administrativos nesta etapa, ainda sem automação. Não usar `db reset` em ambiente com dados úteis: ele apaga e recria o banco.

## Homologação manual obrigatória

1. Criar dois profissionais e duas contas de aluno no Auth real.
2. Entrar como A; cadastrar, buscar, editar e inativar aluno; recarregar e entrar novamente para confirmar persistência.
3. Entrar como B e tentar acessar URL do aluno A e REST com ID do tenant A: negar.
4. Vincular conta de aluno; confirmar leitura exclusiva e negar gravação/nota privada.
5. Conferir métricas do dashboard após gravações; testar concorrência entre duas abas.
6. Executar recuperação por e-mail; sair e validar nova senha.
7. Repetir Android e iOS, perda de rede e restauração de sessão.

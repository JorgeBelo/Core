# Limpeza do banco de dados – Core

Este guia explica como remover do Supabase as tabelas e views de funcionalidades que **não existem mais no site**.

## O que o site usa hoje

| Recurso | Uso |
|--------|-----|
| **users** | Perfil do personal, login (Supabase Auth + linha em `public.users`) |
| **alunos** | Cadastro e listagem de alunos |
| **agenda_personal** | Grade da agenda semanal |
| **Storage: avatars** | Fotos de perfil |

## O que pode ser removido (não usado)

| Objeto | Origem |
|--------|--------|
| **dashboard_summary** (view) | Dashboard antigo (mensalidades) |
| **mensalidades** | Módulo Financeiro (removido) |
| **aulas** | Página Aulas (removida) |
| **notifications** | Módulo Notificações (removido) |
| **financeiro** | Tabela do módulo Financeiro (removido) |
| **contas_financeiras** | Módulo Financeiro (se foi criada) |
| **avaliacoes_fisicas** | Módulo Avaliação Física (se foi criada) |
| **agenda** | Tabela antiga de agenda (se você passou a usar só **agenda_personal**) |

---

## Como proceder

### 1. Fazer backup (obrigatório)

- No **Supabase**: **Project Settings** → **Database** → use os backups automáticos ou faça um backup manual (export/backup do projeto).
- Se tiver acesso ao `psql`, pode fazer dump:
  ```bash
  pg_dump "postgresql://postgres:[SENHA]@[HOST]:5432/postgres" -F c -f backup_antes_limpeza.dump
  ```

### 2. Conferir o que existe no seu banco

No Supabase, abra **SQL Editor** e rode:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Anote quais dessas tabelas você realmente usa (users, alunos, agenda_personal, etc.).

### 3. Rodar o script de limpeza

1. Abra **SQL Editor** no Supabase.
2. Copie todo o conteúdo do arquivo **`supabase_limpeza_banco.sql`**.
3. Cole no editor.
4. Se você **ainda usa** a tabela **`agenda`** (e não só `agenda_personal`), **comente ou apague** a linha:
   ```sql
   DROP TABLE IF EXISTS agenda;
   ```
5. Execute o script (Run).

### 4. Conferir depois

Rode de novo a listagem de tabelas:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

O esperado é algo como: **users**, **alunos**, **agenda_personal** (e talvez outras que você tenha criado e queira manter).

---

## Se algo der errado

- Se aparecer erro de **foreign key** ao dropar alguma tabela, pode ser que outra tabela ainda a referencie. Nesse caso, comente no script a linha da tabela que está falhando e avise qual foi o erro (ou ajuste o script na ordem correta de `DROP`).
- Se tiver feito backup, você pode restaurar o projeto/banco a partir dele.

---

## Resumo

1. Backup do banco.
2. Ver quais tabelas existem (`pg_tables`).
3. Executar **`supabase_limpeza_banco.sql`** (ajustando a linha do `agenda` se precisar).
4. Conferir de novo as tabelas em `public`.

Depois disso, o banco fica alinhado apenas com o que o site usa hoje (users, alunos, agenda_personal, avatars).

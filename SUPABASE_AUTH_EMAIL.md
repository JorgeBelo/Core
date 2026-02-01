# Configuração de cadastro e e-mail (Supabase Auth)

Se o cadastro criou a conta mas **não enviou e-mail de confirmação** e **não consegue entrar**, é configuração do Supabase. Escolha uma das opções abaixo.

---

## Opção 1: Desativar confirmação de e-mail (recomendado para desenvolvimento/MVP)

Assim o usuário **entra logo após se cadastrar**, sem precisar confirmar o e-mail.

1. Acesse o **Supabase Dashboard** do seu projeto.
2. Vá em **Authentication** → **Providers** → **Email**.
3. Desative a opção **"Confirm email"** (toggle OFF).
4. Clique em **Save**.

**Resultado:** Novos cadastros já poderão fazer login na hora. Contas já criadas (que estavam “aguardando confirmação”) também passam a poder entrar, pois o Supabase deixa de exigir confirmação.

---

## Opção 2: Manter confirmação e configurar envio de e-mail

Se quiser que o **e-mail de confirmação seja enviado** de verdade:

1. No Supabase: **Project Settings** (ícone de engrenagem) → **Authentication**.
2. Em **SMTP Settings**, ative **"Enable Custom SMTP"**.
3. Preencha com os dados do seu provedor de e-mail (ex.: Gmail, SendGrid, Resend):
   - **Sender email:** e-mail que envia (ex.: `noreply@seudominio.com`)
   - **Sender name:** nome que aparece (ex.: `Core`)
   - **Host, Port, Username, Password:** conforme o provedor.

Se não configurar SMTP, o Supabase usa o envio próprio, que tem limite e pode ir para spam ou não funcionar em alguns provedores.

---

## Depois de configurar

- **Opção 1:** Faça login de novo com o e-mail e senha do cadastro; deve entrar normalmente.
- **Opção 2:** Envie um novo cadastro de teste e verifique se o e-mail chegou (e pasta de spam). Ao clicar no link, a conta fica confirmada e o login passa a funcionar.

No app, erros de login agora aparecem em toast (ex.: “E-mail ainda não confirmado” ou “E-mail ou senha incorretos”).

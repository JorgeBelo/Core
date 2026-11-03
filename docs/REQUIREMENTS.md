# Requisitos e escopo

Documento integral fornecido pelo proprietário: `docs/PRODUCT-BRIEF.txt`, preservado localmente como fonte do produto e ignorado pelo Git para não publicar a conversa original. Este documento resume os requisitos técnicos versionados.

## Aceite da primeira entrega

- Aplicativo Expo universal com TypeScript e rotas compartilhadas.
- Design Core escuro, navegação inferior mobile e lateral recolhível web.
- Login por e-mail/senha, saída, recuperação por código e sessão segura por plataforma.
- Perfil profissional e leitura restrita de cadastro para aluno.
- Cadastro persistido de alunos, validação, edição, inativação, busca e paginação.
- Dashboard calculado do PostgreSQL: ativos, inativos, novas entradas e cadastros recentes.
- Migração versionada, grants restritos, RLS e auditoria de gravações.
- Documentação de configuração e testes executáveis.

Sem backend configurado, exibe instrução honesta, sem permitir simulações de cadastro. O checkout atual está conectado ao Supabase hospedado, com login confirmado pelo proprietário e testes transacionais reais. Implementação de código não equivale a homologação de produção: ainda faltam dispositivos, recuperação hospedada e procedimentos operacionais.

## Restrições preservadas

Não criar desktop instalado, marketplace, assinatura SaaS, cobrança automática, integração bancária ou dependência obrigatória de API de IA. Não publicar em lojas ou contratar serviços nesta etapa. Não reutilizar materiais protegidos de concorrentes. Não apresentar dados demonstrativos como reais.

Dados clínicos, fotos, anexos, anamnese e financeiro ainda não estão implementados. Treinamento possui núcleo funcional; os limites e complementos estão em TRAINING.md. O cadastro ainda não contém foto, contrato/plano ou avaliação. Modalidade usa três valores iniciais; cadastro de modalidades personalizadas será incluído posteriormente.

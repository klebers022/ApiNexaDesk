# NexaDesk API

API multiempresa para gestão de chamados. O acesso aos dados é sempre limitado pela empresa e pelo perfil do usuário: `ADMIN`, `AGENT` ou `REQUESTER`.

## Tecnologias

- Node.js, Express e TypeScript
- PostgreSQL no Supabase
- Zod para validação, JWT para autenticação e Vitest para testes
- Docker e GitHub Actions para entrega contínua

## Executar localmente

1. Copie `.env.example` para `.env`.
2. Informe a string de conexão PostgreSQL em `DATABASE_URL`, uma `JWT_SECRET` com ao menos 32 caracteres e a URL do front em `FRONTEND_URL`.
3. Instale dependências e inicie o servidor:

```bash
npm ci
npm run dev
```

A API estará disponível em `http://localhost:3000/api/v1`. O endpoint `GET /api/v1/health` confirma a conectividade com o banco.

## Verificação

```bash
npm run typecheck
npm test
npm run build
docker build --tag nexadesk-api:local .
```

## Banco de dados

As migrations ativas estão em [`supabase/migrations`](supabase/migrations). A primeira cria todo o schema em um banco vazio; a segunda restringe o acesso direto pelo Data API e acrescenta índices de cobertura às chaves estrangeiras compostas.

O projeto Supabase atual recebeu o schema inicial manualmente antes de ter histórico. As duas migrations foram registradas como baseline remota e não devem ser reaplicadas nele. Veja [`supabase/README.md`](supabase/README.md) para detalhes.

## Segurança

O front-end deve chamar somente esta API. Não exponha a senha do banco, a chave `service_role` ou qualquer credencial administrativa no navegador. O RLS e a revogação de permissões para `anon` e `authenticated` bloqueiam acesso direto às tabelas públicas. 

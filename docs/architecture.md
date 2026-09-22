# Arquitetura da aplicação

## Visão geral

O NexaDesk separa o frontend React da API Express. A API autentica usuários, aplica regras por papel e empresa e acessa o PostgreSQL com o driver pg. Supabase é usado como hospedagem do PostgreSQL; o backend não usa o SDK Supabase nem Supabase Auth.

~~~mermaid
flowchart LR
  Browser[Frontend React] -->|JSON + Bearer JWT| API[Express API /api/v1]
  API -->|SQL parametrizado| DB[(Supabase PostgreSQL)]
  API -. chave opcional .-> Gemini[Google Gemini]
  Actions[GitHub Actions] -->|SSH no main| VM[Azure VM de teste]
  VM --> Nginx[Nginx / HTTPS]
  Nginx --> Container[Container Node :3000]
  Container --> DB
~~~

## Fluxo interno

~~~mermaid
flowchart TD
  R[Request] --> G[Rate limiter global]
  G --> Route[Route]
  Route --> Auth[authenticate, quando protegido]
  Auth --> Role[authorize, quando há lista de papéis]
  Role --> C[Controller]
  C --> Z[Validação Zod]
  Z --> S[Service]
  S --> P[pg Pool ou transação]
  P --> DB[(PostgreSQL)]
  DB --> S --> C --> J[Resposta JSON]
  C -. erro não tratado .-> EH[errorHandler]
~~~

Routes compõem URL e middlewares. Controllers traduzem HTTP, validam entradas e mapeiam erros. Services concentram regras e SQL. Não há diretório models, repositories ou utils, nem ORM. Alguns controllers tratam erros localmente; o errorHandler cobre erros propagados.

## Estrutura real

~~~text
.
├── .github/workflows/      CI e deploy
├── docs/                   documentação técnica
├── public/chatbot/         demonstração estática do chat
├── src/
│   ├── config/             validação das variáveis de ambiente
│   ├── controllers/        adaptação HTTP e validação Zod
│   ├── database/           Pool PostgreSQL
│   ├── errors/             AppError
│   ├── middlewares/        auth, RBAC, rate limit e erros
│   ├── routes/             composição dos endpoints
│   ├── schemas/            contratos Zod
│   ├── scripts/            cliente CLI do chatbot
│   ├── services/           regras de negócio e SQL
│   ├── types/              tipos de autenticação e Express
│   ├── app.ts              configuração e montagem do Express
│   └── server.ts           listener e graceful shutdown
├── supabase/
│   ├── migrations/         migrations ativas
│   └── migration/          arquivos legados, não executados pela CLI
└── tests/                  testes unitários e de integração
~~~

## Fluxo multiempresa

~~~mermaid
sequenceDiagram
  participant F as Frontend
  participant A as authenticate
  participant U as users
  participant C as Controller
  participant S as Service
  participant D as PostgreSQL

  F->>A: Request + Authorization Bearer
  A->>A: jwt.verify
  A->>U: SELECT user por sub
  U-->>A: status, role, company_id
  A->>C: request.user
  C->>S: userId, role, companyId
  S->>D: query com company_id
  D-->>S: somente tenant autorizado
  S-->>F: JSON
~~~

O companyId confiável vem do usuário relido do banco, não de body ou query string. SUPER_ADMIN possui company_id nulo; o middleware o converte para string vazia em request.user, uma dívida técnica registrada no roadmap.

## Transações

Criação, atribuição, alteração de status e comentários de chamados usam transações quando também gravam histórico ou notificações. A criação de chamado pela IA recebe um PoolClient e grava ticket e ai_interactions na mesma transação. CRUDs simples usam pool.query diretamente.

## Inicialização e encerramento

server.ts inicia o listener na PORT. SIGTERM e SIGINT fecham primeiro o servidor HTTP e depois pool.end. Não existe timeout forçado de shutdown.

## Decisões identificadas

- SQL direto mantém poucas dependências, mas espalha mapeamento e tratamento de erros.
- A autorização ocorre em rotas e services; os filtros de tenant nos services são a barreira principal.
- RLS está habilitado, mas o acesso de anon/authenticated é revogado e não há policies nas migrations.
- A IA degrada para heurística quando GEMINI_API_KEY não existe ou o provedor falha.

## Responsabilidade dos módulos

| Domínio | Controller | Service principal |
|---|---|---|
| Health | health.controller | health.service |
| Login | auth.controller | auth.service |
| Plataforma/empresa | platform.controller, company.controller | platform.service, company.service |
| Usuários e clientes | user.controller, customer.controller | user.service, customer.service |
| Categorias e equipes | category.controller, team.controller | category.service, team.service |
| Chamados | ticket.controller | ticket.service |
| Dashboard | dashboard.controller | dashboard.service |
| Notificações | notification.controller | notification.service |
| IA e conhecimento | ai.controller, article.controller | ai.service, knowledge.service, ai-interaction.service, article.service |

Controllers leem params/query/body, chamam safeParse, passam identidade autenticada ao service e escolhem o status HTTP. Services validam relações entre entidades, aplicam filtros de tenant, controlam transações e mapeiam snake_case do banco para camelCase da API.

## Middlewares

| Middleware | Responsabilidade |
|---|---|
| apiRateLimiter | limita /api/v1 a 500 requests por IP em 15 minutos |
| authRateLimiter | adiciona limite de 30 tentativas por IP em 15 minutos sobre /auth |
| authenticate | valida Bearer JWT, relê users e popula request.user |
| authorize | confere o papel contra a lista da rota |
| notFound | cria AppError 404 após todas as rotas |
| errorHandler | serializa AppError, JSON/CORS e falhas inesperadas |

Helmet, CORS e express.json são middlewares configurados diretamente em app.ts. Não existe middleware de logging ou validação genérica.

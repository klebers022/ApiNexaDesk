# NexaDesk API

API REST multiempresa para gestão de chamados, equipes, usuários, base de conhecimento e autoatendimento assistido por IA.

Este repositório contém apenas o backend. O frontend React vive no repositório NexaDesk e consome esta API pelo prefixo /api/v1.

## Estado atual

- Node.js 22, TypeScript, Express 5 e PostgreSQL/Supabase.
- Autenticação JWT com consulta do usuário no banco em cada requisição protegida.
- Papéis reais: SUPER_ADMIN, COMPANY_ADMIN, ANALYST e REQUESTER.
- Isolamento multiempresa aplicado nas queries por company_id.
- Validação de entrada com Zod e queries SQL parametrizadas com pg.
- Assistente com Google Gemini opcional e fallback heurístico.
- Vitest, Docker multi-stage, GitHub Actions para CI e deploy por SSH em VM.
- 53 endpoints REST em 13 domínios, além do widget estático em /chatbot.

## Arquitetura

~~~text
Request
  -> Express route
  -> rate limit / autenticação / autorização
  -> controller e validação Zod
  -> service e regra de negócio
  -> pg Pool / PostgreSQL
  -> resposta JSON
~~~

Não existe uma camada repository separada: os services, e em alguns casos controllers de IA, executam SQL parametrizado diretamente.

Consulte [Arquitetura](docs/architecture.md), [Autenticação](docs/authentication.md) e [Autorização](docs/authorization.md).

## Tecnologias

| Área | Implementação |
|---|---|
| Runtime | Node.js 22 |
| Linguagem | TypeScript 7 |
| HTTP | Express 5 |
| Banco | PostgreSQL hospedado no Supabase |
| Validação | Zod 4 |
| Autenticação | JWT e bcrypt |
| Segurança HTTP | Helmet, CORS e express-rate-limit |
| IA | Google Gemini 2.5 Flash, com fallback heurístico |
| Testes | Vitest e Supertest |
| Entrega | Docker e GitHub Actions |

## Funcionalidades

- administração de empresas pelo SUPER_ADMIN;
- usuários, categorias e equipes por empresa;
- chamados com paginação, filtros, atribuição, status, comentários e histórico;
- notificações por usuário;
- dashboard operacional por perfil;
- artigos de conhecimento;
- triagem, busca de soluções e chat de IA;
- auditoria de interações com IA.

Clientes legados e notificações continuam expostos pela API atual, embora a evolução de produto tenha retirado esses itens da navegação do frontend. Veja [Roadmap e divergências](docs/roadmap.md).

## Executando localmente

Pré-requisitos: Node.js 22, npm, Git e um PostgreSQL com as migrations aplicadas.

~~~bash
git clone https://github.com/klebers022/ApiNexaDesk.git
cd ApiNexaDesk
npm ci
cp .env.example .env
npm run dev
~~~

No PowerShell:

~~~powershell
Copy-Item .env.example .env
~~~

A API inicia em http://localhost:3000 e o health check fica em http://localhost:3000/api/v1/health.

Detalhes: [Desenvolvimento](docs/development.md) e [Variáveis de ambiente](docs/environment.md).

## Verificação

~~~bash
npm run typecheck
npm test
npm run build
docker build --tag nexadesk-api:local .
~~~

## Docker

~~~bash
docker build -t nexadesk-api:local .
docker run --rm --name nexadesk-api -p 3000:3000 --env-file .env nexadesk-api:local
~~~

O container de produção roda como o usuário não privilegiado node. O Dockerfile não define HEALTHCHECK; o endpoint de saúde é usado externamente. Consulte [Docker](docs/docker.md).

## Documentação

O índice completo está em [docs/README.md](docs/README.md).

- [Referência da API](docs/api.md)
- [Modelo de dados](docs/database.md)
- [Regras de negócio](docs/business-rules.md)
- [Testes](docs/testing.md)
- [CI/CD](docs/ci-cd.md)
- [Deploy e infraestrutura](docs/deployment.md)
- [Segurança](docs/security.md)
- [Observabilidade](docs/observability.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Roadmap técnico](docs/roadmap.md)

## Licença

ISC, conforme package.json.

# Desenvolvimento local

## Pré-requisitos

- Git;
- Node.js 22 e npm;
- PostgreSQL compatível ou projeto Supabase;
- Docker Desktop, apenas para execução em container.

## Instalação

~~~bash
git clone https://github.com/klebers022/ApiNexaDesk.git
cd ApiNexaDesk
npm ci
cp .env.example .env
~~~

Configure o .env conforme [Variáveis de ambiente](environment.md), aplique as migrations e execute:

~~~bash
npm run dev
~~~

tsx watch reinicia o servidor quando src muda. O prefixo da API é /api/v1.

## Scripts npm

| Script | Comando | Finalidade |
|---|---|---|
| npm run dev | tsx watch src/server.ts | desenvolvimento com reload |
| npm run typecheck | tsc --noEmit | valida tipos de src |
| npm test | vitest run --configLoader runner | suíte uma vez |
| npm run test:watch | vitest | testes em watch |
| npm run build | tsc | compila src para dist |
| npm start | node dist/server.js | executa build |
| npm run chatbot | tsx src/scripts/chatbot-cli.ts | cliente CLI do assistente |

TypeScript inclui somente src/**/*.ts; testes não passam pelo npm run typecheck.

## Banco

As migrations ficam em supabase/migrations. Não há script npm nem configuração local da Supabase CLI no repositório. Escolha um processo controlado e confirme o histórico antes de aplicar no projeto compartilhado.

## Checklist antes de PR

~~~bash
npm run typecheck
npm test
npm run build
docker build -t nexadesk-api:local .
~~~

Não existe lint ou formatter configurado.

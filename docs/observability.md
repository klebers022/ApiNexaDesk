# Observabilidade

## Situação atual

- server.ts registra início e shutdown com console.log/error.
- controllers registram falhas com console.error.
- errorHandler distingue erro de banco e não tratado, incluindo método, path, code, constraint e detail no console.
- IA usa rótulos como AI TRIAGE ERROR, AI SEARCH ERROR e AI CHAT ERROR.
- GET /api/v1/health executa SELECT NOW e comprova que processo e banco respondem.
- Docker expõe logs via stdout/stderr.

Não foram identificados logger estruturado, request ID, correlação, níveis configuráveis, métricas, tracing, APM, dashboards, alertas, uptime monitor ou retenção centralizada.

## Implicações

Logs misturam formatos e podem ficar difíceis de consultar. Não há medição de latência, taxa de erro, saturação do pool, eventos por tenant, consumo/custo de IA ou SLO. O health check é de prontidão simples e não diferencia estado degradado.

## Melhorias futuras

1. Logger JSON com timestamp, level, requestId, rota, status e duração; redigir token, senha, mensagens e connection strings.
2. Middleware de acesso HTTP e propagação de X-Request-ID.
3. Métricas Prometheus/OpenTelemetry para requests, latência, erros, pool e IA.
4. Tracing da API até PostgreSQL e provider de IA.
5. Endpoints separados de liveness/readiness e HEALTHCHECK no container.
6. Dashboards e alertas por disponibilidade, p95, 5xx, conexão de banco e custo de IA.
7. Centralização dos logs do container com retenção definida.

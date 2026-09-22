# Testes

## Configuração

Vitest 3 roda em ambiente node, carrega tests/setup.ts e limpa/restaura mocks. Supertest chama a aplicação Express sem abrir porta.

tests/setup.ts define valores exclusivamente de teste. A URL PostgreSQL local não é acessada pelos casos que mockam banco/health.

## Suíte existente

| Arquivo | Tipo | Cobertura observada |
|---|---|---|
| tests/integration/api.spec.ts | integração HTTP com dependências mockadas | health, login inválido, autenticação ausente/malformada, proteção de IA e widget estático |
| tests/unit/auth.service.spec.ts | unitário | login válido, usuário ausente/inativo e senha inválida |
| tests/unit/ticket.service.spec.ts | unitário | pesquisa por número com CAST |
| tests/unit/ai.service.spec.ts | unitário | heurística, fallback, resposta de solução e diagnóstico |

Os testes atuais somam 20 casos. Não há coleta de coverage configurada, threshold, banco efêmero, teste E2E com PostgreSQL real ou teste do frontend neste repositório.

~~~bash
npm test
npm run test:watch
~~~

## Limitações detectadas

Os fixtures de auth e ticket ainda usam os papéis legados ADMIN. Como testes não entram no tsconfig e algumas dependências estão mockadas, isso não valida os papéis atuais. A suíte também não captura o literal AGENT em atribuição e ranking.

## Testes recomendados

Prioridade alta:

- matriz de isolamento entre duas empresas para cada service;
- autorização de criação e atribuição de ticket por papel;
- máquina completa de status;
- comentários internos invisíveis a REQUESTER;
- criação transacional de empresa e ticket via IA;
- troca obrigatória de senha quando implementada;
- integração real com PostgreSQL descartável e migrations.

Depois:

- CRUD de usuários, categorias, equipes, clientes e artigos;
- paginação, filtros e limites;
- erros do provider Gemini e fallback;
- CORS, rate limit, graceful shutdown e deploy smoke test;
- cobertura com limites por módulo.

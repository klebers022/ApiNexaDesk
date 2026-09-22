# Segurança

## Controles implementados

| Controle | Estado observado |
|---|---|
| Hash de senha | bcrypt, custo 10 |
| JWT | HS secret com mínimo de 32 caracteres e expiração configurável |
| Sessão vigente | usuário e status relidos do banco por request |
| RBAC | authorize nas rotas que declaram papéis |
| Tenant | company_id derivado do usuário e aplicado nas queries |
| SQL injection | placeholders do pg; valores não são concatenados |
| Validação | Zod nos principais params, queries e bodies |
| Headers | Helmet; CSP e crossOriginEmbedderPolicy desativados |
| CORS | allowlist em FRONTEND_URL |
| Body | JSON limitado a 1 MB |
| Rate limit | 500 requests/15 min na API; 30/15 min em /auth |
| Erros | resposta 500 genérica, detalhes de banco apenas no console |
| Container | usuário node sem privilégio |
| Segredos | .env e .env.* ignorados; .env.example usa placeholders |

## Isolamento multiempresa

O principal controle é o companyId obtido da linha users após verificar o JWT. Services filtram por company_id, e FKs compostas protegem o núcleo de chamados.

Riscos:

- RLS está habilitado sem policies; a conexão do backend continua poderosa.
- artigos e mensagens de IA não têm todas as relações compostas por tenant.
- novas queries podem esquecer company_id porque não há repository central ou teste sistemático de isolamento.
- SUPER_ADMIN é representado com companyId vazio no request.

## Achados prioritários

### P0

1. ticket.service valida responsáveis com role = 'AGENT', embora o papel atual seja ANALYST. Isso quebra atribuição.
2. POST /tickets aceita teamId e assigneeId de REQUESTER; um solicitante pode escolher roteamento/responsável ao criar.
3. ANALYST_ASSIGNMENT_FORBIDDEN não é mapeado no controller e retorna 500.
4. must_change_password não é imposto e não existe endpoint para trocar a senha temporária.

### P1

1. O frontend principal e o widget estático usam JWT em localStorage; XSS pode expor a sessão.
2. /chatbot aceita JWT manual e está disponível no mesmo servidor.
3. IA não mascara PII nem aplica proteção, quota ou observabilidade específica.
4. Falta política explícita de CORS para credenciais e ambientes.
5. Rotas de notificação e GET /companies/me não restringem SUPER_ADMIN por authorize.
6. article status não valida :id como UUID; a query continua parametrizada, portanto não cria SQL injection.

### P2

- CSP está desativada.
- Não há auditoria geral de login/administração, apenas histórico de tickets e IA.
- Não há rotação/revogação de JWT, refresh token ou reset de senha.
- Não há secret manager, SAST, dependency scanning ou image scanning nos workflows.

## Segredos e repositório público

Não versione DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, chaves Supabase, tokens JWT, chaves SSH ou conteúdo de .env. O .dockerignore também exclui .env. Revise o histórico Git antes de publicar; ignorar um arquivo não remove versões antigas.

## CORS

FRONTEND_URL aceita uma ou mais URLs separadas por vírgula. Requests sem Origin, como curl e comunicação servidor-servidor, são aceitos. Uma origem presente na allowlist é aceita; outras recebem 403 CORS_NOT_ALLOWED. Métodos: GET, POST, PUT, PATCH, DELETE e OPTIONS. Headers permitidos: Content-Type e Authorization.

Exemplo:

~~~env
FRONTEND_URL=http://localhost:5173,https://app.exemplo.com
~~~

Use origens completas, incluindo protocolo e porta. Wildcard não é implementado.

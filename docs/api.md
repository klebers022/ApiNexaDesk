# Referência da API REST

## Convenções

Base local: http://localhost:3000/api/v1.

Rotas protegidas exigem Authorization: Bearer <JWT>. Corpos são JSON. Sucesso geralmente usa data e listagens paginadas acrescentam pagination. Falhas usam error.code, error.message e, quando disponível, error.details.

~~~json
{
  "data": {},
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
~~~

~~~json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos.",
    "details": []
  }
}
~~~

Não existe especificação OpenAPI/Swagger no repositório.

## Resumo: 53 endpoints

| Domínio | Método | Endpoint | Auth | Papéis |
|---|---|---|---|---|
| Health | GET | /health | não | público |
| Auth | POST | /auth/login | não | público |
| Auth | GET | /auth/me | sim | qualquer autenticado |
| Plataforma | GET | /platform/companies | sim | SUPER_ADMIN |
| Plataforma | POST | /platform/companies | sim | SUPER_ADMIN |
| Empresa | GET | /companies/me | sim | qualquer autenticado |
| Empresa | PUT | /companies/me | sim | COMPANY_ADMIN |
| Usuários | GET | /users | sim | COMPANY_ADMIN |
| Usuários | GET | /users/:id | sim | COMPANY_ADMIN |
| Usuários | POST | /users | sim | COMPANY_ADMIN |
| Usuários | PUT | /users/:id | sim | COMPANY_ADMIN |
| Usuários | DELETE | /users/:id | sim | COMPANY_ADMIN |
| Clientes legados | GET | /customers | sim | COMPANY_ADMIN |
| Clientes legados | GET | /customers/:id | sim | COMPANY_ADMIN |
| Clientes legados | POST | /customers | sim | COMPANY_ADMIN |
| Clientes legados | PUT | /customers/:id | sim | COMPANY_ADMIN |
| Clientes legados | DELETE | /customers/:id | sim | COMPANY_ADMIN |
| Categorias | GET | /categories | sim | COMPANY_ADMIN, ANALYST, REQUESTER |
| Categorias | GET | /categories/:id | sim | COMPANY_ADMIN, ANALYST, REQUESTER |
| Categorias | POST | /categories | sim | COMPANY_ADMIN |
| Categorias | PUT | /categories/:id | sim | COMPANY_ADMIN |
| Categorias | DELETE | /categories/:id | sim | COMPANY_ADMIN |
| Equipes | GET | /teams | sim | COMPANY_ADMIN, ANALYST |
| Equipes | GET | /teams/:id | sim | COMPANY_ADMIN, ANALYST |
| Equipes | GET | /teams/:id/members | sim | COMPANY_ADMIN, ANALYST |
| Equipes | POST | /teams | sim | COMPANY_ADMIN |
| Equipes | PUT | /teams/:id | sim | COMPANY_ADMIN |
| Equipes | POST | /teams/:id/members | sim | COMPANY_ADMIN |
| Equipes | DELETE | /teams/:id/members/:userId | sim | COMPANY_ADMIN |
| Equipes | DELETE | /teams/:id | sim | COMPANY_ADMIN |
| Chamados | GET | /tickets | sim | COMPANY_ADMIN, ANALYST, REQUESTER |
| Chamados | GET | /tickets/:id | sim | COMPANY_ADMIN, ANALYST, REQUESTER |
| Chamados | POST | /tickets | sim | COMPANY_ADMIN, ANALYST, REQUESTER |
| Chamados | PUT | /tickets/:id | sim | COMPANY_ADMIN, ANALYST |
| Chamados | POST | /tickets/:id/assign | sim | COMPANY_ADMIN, ANALYST |
| Chamados | POST | /tickets/:id/status | sim | COMPANY_ADMIN, ANALYST |
| Chamados | POST | /tickets/:id/resolve | sim | COMPANY_ADMIN, ANALYST |
| Chamados | POST | /tickets/:id/close | sim | COMPANY_ADMIN, ANALYST |
| Chamados | POST | /tickets/:id/reopen | sim | COMPANY_ADMIN, ANALYST |
| Chamados | GET | /tickets/:id/comments | sim | COMPANY_ADMIN, ANALYST, REQUESTER |
| Chamados | POST | /tickets/:id/comments | sim | COMPANY_ADMIN, ANALYST, REQUESTER |
| Chamados | GET | /tickets/:id/history | sim | COMPANY_ADMIN, ANALYST, REQUESTER |
| Dashboard | GET | /dashboard | sim | usuários com empresa |
| Notificações | GET | /notifications | sim | qualquer autenticado |
| Notificações | GET | /notifications/unread-count | sim | qualquer autenticado |
| Notificações | PATCH | /notifications/read-all | sim | qualquer autenticado |
| Notificações | PATCH | /notifications/:id/read | sim | qualquer autenticado |
| IA | POST | /ai/triage | sim | COMPANY_ADMIN, ANALYST, REQUESTER |
| IA | POST | /ai/solutions | sim | COMPANY_ADMIN, ANALYST, REQUESTER |
| IA | POST | /ai/chat | sim | COMPANY_ADMIN, ANALYST, REQUESTER |
| Conhecimento | GET | /knowledge-articles | sim | COMPANY_ADMIN, ANALYST, REQUESTER |
| Conhecimento | POST | /knowledge-articles | sim | COMPANY_ADMIN |
| Conhecimento | PATCH | /knowledge-articles/:id/status | sim | COMPANY_ADMIN |

/chatbot é um diretório estático servido fora de /api/v1 e não entra na contagem.

## Health

### GET /health

Público. healthController chama checkDatabaseHealth, que executa SELECT NOW(). Retorna 200 com status, database e timestamp. Uma falha de banco é encaminhada ao errorHandler e resulta em 500. Não usa schema Zod.

~~~json
{
  "data": {
    "status": "ok",
    "database": "connected",
    "timestamp": "2026-09-21T12:00:00.000Z"
  }
}
~~~

## Autenticação

### POST /auth/login

Controller: loginController. Service: login. Schema: loginSchema.

Body: email válido e password não vazio. Retorna 200 com token e user. Erros: 400 VALIDATION_ERROR, 401 INVALID_CREDENTIALS, 403 USER_INACTIVE e 500.

~~~json
{ "email": "usuario@empresa.test", "password": "senha" }
~~~

### GET /auth/me

Controller: meController. Middleware: authenticate. Sem service ou schema. Retorna 200 com data.user igual a request.user. Erros de autenticação: 401.

## Plataforma

### GET /platform/companies

Controller: listPlatformCompaniesController. Service: listPlatformCompanies. Retorna empresas com id, razão/nome fantasia, documento, contato, status, administrador principal, contagem de usuários, equipes e tickets abertos. Códigos: 200, 401, 403 e 500.

### POST /platform/companies

Controller: createPlatformCompanyController. Service: createPlatformCompany. Schema: createPlatformCompanySchema.

Body:

~~~json
{
  "legalName": "Empresa Exemplo Ltda",
  "tradeName": "Empresa Exemplo",
  "document": "00.000.000/0001-00",
  "email": "contato@empresa.test",
  "phone": "11999999999",
  "addressLine1": "Rua Exemplo, 100",
  "addressLine2": null,
  "city": "São Paulo",
  "state": "SP",
  "postalCode": "01000-000",
  "adminName": "Admin Empresa",
  "adminEmail": "admin@empresa.test",
  "temporaryPassword": "senha-temporaria"
}
~~~

Cria empresa, COMPANY_ADMIN e vínculo primary_admin_id na mesma transação. Retorna 201 com id e primaryAdminId. Erros: 400 VALIDATION_ERROR, 401, 403, 409 COMPANY_CREATION_FAILED. O 409 agrega qualquer falha do service.

## Empresa atual

### GET /companies/me

Controller: getCompanyController. Service: getCompany. Retorna somente id, name, createdAt e updatedAt. Códigos: 200, 401, 404 COMPANY_NOT_FOUND e 500. A rota não limita papel; SUPER_ADMIN usa contexto vazio e tende a receber 404.

### PUT /companies/me

Controller: updateCompanyController. Service: updateCompany. Schema: updateCompanySchema.

Body: name de 3 a 150 caracteres. Retorna 200. Erros: 400, 401, 403 e 500. COMPANY_NOT_FOUND lançado pelo service não é convertido para 404.

## Usuários

Controller: user.controller.ts. Services: listUsers, getUserById, createUser, updateUser e deactivateUser.

### GET /users

Schema: listUsersQuerySchema. Query: page=1, pageSize=20 até 100, search opcional, role COMPANY_ADMIN|ANALYST|REQUESTER e status ACTIVE|INACTIVE. Retorna 200 paginado. Erros: 400, 401, 403 e 500.

### GET /users/:id

Schema: userIdParamSchema, UUID. Retorna 200 ou 404 USER_NOT_FOUND. O service filtra company_id. Outros erros: 400, 401, 403 e 500.

### POST /users

Schema: createUserSchema.

~~~json
{
  "name": "Pessoa Exemplo",
  "email": "pessoa@empresa.test",
  "password": "minimo-8",
  "role": "ANALYST",
  "customerId": null
}
~~~

customerId só é permitido a REQUESTER. Retorna 201. Erros: 400 VALIDATION_ERROR, 404 CUSTOMER_NOT_FOUND, 409 EMAIL_ALREADY_EXISTS, 401/403 e 500.

### PUT /users/:id

Schemas: userIdParamSchema e updateUserSchema. Aceita um ou mais de name, email, role, status e customerId. Retorna 200. Erros: 400 VALIDATION_ERROR, CUSTOMER_REQUIRED ou CUSTOMER_NOT_ALLOWED; 404 USER_NOT_FOUND ou CUSTOMER_NOT_FOUND; 409 EMAIL_ALREADY_EXISTS; 401/403 e 500.

### DELETE /users/:id

Schema: userIdParamSchema. Faz soft delete, definindo status INACTIVE. Retorna 200. Erros: 404 USER_NOT_FOUND, 409 CANNOT_DEACTIVATE_SELF, 400, 401, 403 e 500.

## Clientes legados

Controller: customer.controller.ts. Services homônimos em customer.service.ts. Todas as queries filtram company_id.

### GET /customers

Schema: listCustomersQuerySchema. Query: page, pageSize até 100, search e status. Retorna 200 paginado. Erros: 400, 401, 403 e 500.

### GET /customers/:id

Schema: customerIdParamSchema. Retorna 200 ou 404 CUSTOMER_NOT_FOUND; também 400, 401, 403 e 500.

### POST /customers

Schema: createCustomerSchema. Body: name obrigatório; email, phone e document opcionais/nulos. Retorna 201. Erros: 409 CUSTOMER_DOCUMENT_ALREADY_EXISTS, 400, 401, 403 e 500.

### PUT /customers/:id

Schemas: customerIdParamSchema e updateCustomerSchema. Aceita name, email, phone, document e status; exige ao menos um campo. Retorna 200. Erros: 404 CUSTOMER_NOT_FOUND, 409 CUSTOMER_DOCUMENT_ALREADY_EXISTS, 400, 401, 403 e 500.

### DELETE /customers/:id

Soft delete. Schema: customerIdParamSchema. Retorna 200. Erros: 404 CUSTOMER_NOT_FOUND, 400, 401, 403 e 500.

## Categorias

Controller: category.controller.ts. Services: listCategories, getCategoryById, createCategory, updateCategory e deactivateCategory.

### GET /categories

Schema: listCategoriesQuerySchema. Query: page, pageSize até 100, search e status. Retorna 200 paginado. Erros: 400, 401, 403 e 500.

### GET /categories/:id

Schema: categoryIdParamSchema. Retorna 200 ou 404 CATEGORY_NOT_FOUND; também 400, 401, 403 e 500.

### POST /categories

Schema: createCategorySchema. Body: name de 2 a 100 e description opcional/nula até 500. Retorna 201. Erros: 409 CATEGORY_NAME_ALREADY_EXISTS, 400, 401, 403 e 500.

### PUT /categories/:id

Schemas: categoryIdParamSchema e updateCategorySchema. Aceita name, description e status; exige um campo. Retorna 200. Erros: 404 CATEGORY_NOT_FOUND, 409 CATEGORY_NAME_ALREADY_EXISTS, 400, 401, 403 e 500.

### DELETE /categories/:id

Soft delete para INACTIVE. Retorna 200. Erros: 404 CATEGORY_NOT_FOUND, 400, 401, 403 e 500.

## Equipes

Controller: team.controller.ts. Services em team.service.ts.

### GET /teams

Schema: listTeamsQuerySchema. Query: page, pageSize até 100 e search. Retorna 200 paginado, incluindo memberCount. Erros: 400, 401, 403 e 500.

### GET /teams/:id

Schema: teamIdParamSchema. Retorna 200 ou 404 TEAM_NOT_FOUND; também 400, 401, 403 e 500.

### GET /teams/:id/members

Schema: teamIdParamSchema. Retorna membros ordenados por nome. Erros: 404 TEAM_NOT_FOUND, 400, 401, 403 e 500.

### POST /teams

Schema: createTeamSchema. Body: name de 2 a 100 e description opcional/nula. Retorna 201. Erros: 409 TEAM_NAME_ALREADY_EXISTS, 400, 401, 403 e 500.

### PUT /teams/:id

Schemas: teamIdParamSchema e updateTeamSchema. Aceita name e description; exige um campo. Retorna 200. Erros: 404 TEAM_NOT_FOUND, 409 TEAM_NAME_ALREADY_EXISTS, 400, 401, 403 e 500.

### POST /teams/:id/members

Schemas: teamIdParamSchema e addTeamMemberSchema.

~~~json
{ "userId": "<uuid>" }
~~~

Retorna 201. Erros: 404 TEAM_NOT_FOUND ou USER_NOT_FOUND; 400 USER_MUST_BE_AGENT ou USER_INACTIVE; 409 TEAM_MEMBER_ALREADY_EXISTS; 401/403 e 500. Apesar do código de erro legado, o service exige ANALYST.

### DELETE /teams/:id/members/:userId

Schema: teamMemberParamSchema. Retorna 200. Erros: 404 TEAM_MEMBER_NOT_FOUND, 400, 401, 403 e 500.

### DELETE /teams/:id

Schema: teamIdParamSchema. Faz exclusão física quando não há tickets. Retorna 200. Erros: 404 TEAM_NOT_FOUND, 409 TEAM_HAS_TICKETS, 400, 401, 403 e 500.

## Chamados

Controller: ticket.controller.ts. Service: ticket.service.ts.

### GET /tickets

Schema: listTicketsQuerySchema. Query:

| Campo | Regra |
|---|---|
| page | inteiro positivo, padrão 1 |
| pageSize | 1 a 100, padrão 20 |
| search | número, título ou descrição |
| status | OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED |
| priority | LOW, MEDIUM, HIGH, URGENT |
| categoryId | UUID |
| teamId | UUID |
| assigneeId | UUID |

Retorna 200 paginado. O service aplica escopo por papel e tenant. Erros: 400, 401, 403 e 500.

### GET /tickets/:id

Schema: ticketIdParamSchema. Retorna detalhe 200 ou 404 TICKET_NOT_FOUND. A falta de acesso também aparece como 404. Outros erros: 400, 401, 403 e 500.

### POST /tickets

Schema: createTicketSchema.

~~~json
{
  "title": "Não consigo acessar",
  "description": "O sistema informa acesso negado.",
  "priority": "MEDIUM",
  "categoryId": "<uuid>",
  "requesterId": "<uuid opcional>",
  "teamId": null,
  "assigneeId": null
}
~~~

Retorna 201. Erros: 400 VALIDATION_ERROR, REQUESTER_REQUIRED ou ASSIGNEE_NOT_IN_TEAM; 404 REQUESTER_NOT_FOUND, CATEGORY_NOT_FOUND, TEAM_NOT_FOUND ou ASSIGNEE_NOT_FOUND; 401/403 e 500.

### PUT /tickets/:id

Schemas: ticketIdParamSchema e updateTicketSchema. Aceita title, description, priority e categoryId; exige um campo. Retorna 200. Erros: 404 TICKET_NOT_FOUND ou CATEGORY_NOT_FOUND, 400, 401, 403 e 500.

### POST /tickets/:id/assign

Schemas: ticketIdParamSchema e assignTicketSchema. Body contém teamId e/ou assigneeId, ambos opcionais e anuláveis, mas ao menos uma chave deve existir.

~~~json
{ "assigneeId": "<uuid>" }
~~~

Retorna 200. Erros mapeados: 404 TICKET_NOT_FOUND, TEAM_NOT_FOUND ou ASSIGNEE_NOT_FOUND; 400 ASSIGNEE_NOT_IN_TEAM; 401/403 e 500. ANALYST_ASSIGNMENT_FORBIDDEN não está no mapa do controller e hoje vira 500. A consulta de responsável usa o literal legado AGENT, outro defeito conhecido.

### POST /tickets/:id/status

Schemas: ticketIdParamSchema e changeTicketStatusSchema. Body: status válido. Retorna 200. Erros: 409 INVALID_STATUS_TRANSITION, 404 TICKET_NOT_FOUND, 400, 401, 403 e 500.

### POST /tickets/:id/resolve

Sem body. Executa transição para RESOLVED. Mesmos códigos da mudança de status.

### POST /tickets/:id/close

Sem body. Executa transição para CLOSED. Mesmos códigos.

### POST /tickets/:id/reopen

Sem body. Executa transição para IN_PROGRESS. Mesmos códigos.

### GET /tickets/:id/comments

Schema: ticketIdParamSchema. Retorna 200. REQUESTER não recebe is_internal = true. Erros: 404 TICKET_NOT_FOUND, 400, 401, 403 e 500.

### POST /tickets/:id/comments

Schemas: ticketIdParamSchema e createTicketCommentSchema.

~~~json
{ "content": "Mensagem do chamado", "isInternal": false }
~~~

Retorna 201. Erros: 403 INTERNAL_COMMENT_FORBIDDEN, 404 TICKET_NOT_FOUND, 400, 401 e 500.

### GET /tickets/:id/history

Schema: ticketIdParamSchema. Retorna 200 com ações em ordem cronológica. Erros: 404 TICKET_NOT_FOUND, 400, 401, 403 e 500.

## Dashboard

### GET /dashboard

Controller: getDashboardController. Service: getDashboard. Schema: dashboardQuerySchema. Query periodDays é inteiro de 7 a 365, padrão 30.

Retorna totais, agrupamento por status/prioridade/categoria, série diária e ranking. O escopo segue o papel. Erros: 400, 401, 403 COMPANY_CONTEXT_REQUIRED para SUPER_ADMIN e 500.

O ranking filtra u.role = 'AGENT', literal legado que impede resultados de ANALYST.

## Notificações

Controller: notification.controller.ts. Service: notification.service.ts. As rotas têm authenticate, mas não authorize.

### GET /notifications

Schema: listNotificationsQuerySchema. Query: page, pageSize, type e status READ|UNREAD. Retorna 200 paginado. Erros: 400, 401 e 500.

### GET /notifications/unread-count

Sem schema. Retorna 200 com data.count. Erros: 401 e 500.

### PATCH /notifications/read-all

Sem body. Retorna 200 com data.updated. Erros: 401 e 500.

### PATCH /notifications/:id/read

Schema: notificationIdParamSchema. Retorna 200. Erros: 404 NOTIFICATION_NOT_FOUND, 400, 401 e 500.

## Inteligência artificial

Controller: ai.controller.ts. Services: ai.service.ts, knowledge.service.ts e ai-interaction.service.ts.

### POST /ai/triage

Schema: triageTicketSchema. Body: text de 3 a 4000 e categoryId opcional. O controller usa text e ignora categoryId. Retorna 200 com categoryId, categoryName, suggestedTitle, priority, confidence, reasoning e source. Erros: 400, 401, 403 e 500 AI_TRIAGE_ERROR.

### POST /ai/solutions

Schema: searchSolutionsSchema. Body: query de 2 a 500, categoryId opcional e limit de 1 a 20, padrão 5. Retorna 200 com query, count e solutions. Erros: 400, 401, 403 e 500 AI_SEARCH_ERROR.

### POST /ai/chat

Schema: aiChatSchema.

~~~json
{
  "message": "Não consigo conectar à VPN",
  "conversationHistory": [],
  "categoryId": null,
  "action": "message"
}
~~~

action pode ser message, resolve ou create_ticket. message retorna classificação, soluções, resposta e canCreateTicket. resolve registra uma interação resolvida. create_ticket exige REQUESTER, categoria classificável e retorna 201 com ticket. Códigos: 200/201, 400 VALIDATION_ERROR ou CATEGORY_REQUIRED, 403 AI_TICKET_CREATION_REQUESTER_ONLY, 401, 403 de RBAC e 500 AI_CHAT_ERROR.

conversationHistory é validado até 12 mensagens, mas não é usado na geração atual.

## Base de conhecimento

Controller: article.controller.ts. Service: article.service.ts.

### GET /knowledge-articles

Sem query schema. Retorna 200. REQUESTER recebe apenas PUBLISHED; os demais papéis autorizados recebem todos os status. Erros propagados: 401, 403 e 500.

### POST /knowledge-articles

Schema: articleSchema. Body: title 3 a 200, content 20 a 20000, categoryId e sourceTicketId opcionais/nulos. Retorna 201. Erros: 400, 401, 403 e 500.

### PATCH /knowledge-articles/:id/status

Schema de body: articleStatusSchema com DRAFT, PUBLISHED ou ARCHIVED. O parâmetro id não passa por schema UUID; é usado diretamente em query parametrizada. Retorna 200 ou 404 ARTICLE_NOT_FOUND. Outros erros: 400, 401, 403 e 500.

## Schemas Zod

| Arquivo | Schemas |
|---|---|
| auth.schema.ts | loginSchema |
| company.schema.ts | updateCompanySchema, createPlatformCompanySchema |
| user.schema.ts | listUsersQuerySchema, userIdParamSchema, createUserSchema, updateUserSchema |
| customer.schema.ts | listCustomersQuerySchema, customerIdParamSchema, createCustomerSchema, updateCustomerSchema |
| category.schema.ts | listCategoriesQuerySchema, categoryIdParamSchema, createCategorySchema, updateCategorySchema |
| team.schema.ts | listTeamsQuerySchema, teamIdParamSchema, teamMemberParamSchema, createTeamSchema, updateTeamSchema, addTeamMemberSchema |
| ticket.schema.ts | ticketIdParamSchema, listTicketsQuerySchema, createTicketSchema, updateTicketSchema, assignTicketSchema, changeTicketStatusSchema, createTicketCommentSchema |
| notification.schema.ts | listNotificationsQuerySchema, notificationIdParamSchema |
| dashboard.schema.ts | dashboardQuerySchema |
| ai.schema.ts | triageTicketSchema, searchSolutionsSchema, chatMessageSchema, aiChatSchema |
| knowledge.schema.ts | articleSchema, articleStatusSchema |

Validação ocorre manualmente nos controllers com safeParse; não existe middleware genérico de validação.

## Catálogo de implementação

Um travessão indica ausência de service dedicado ou schema Zod.

| Endpoint | Controller | Service | Schema |
|---|---|---|---|
| GET /health | healthController | checkDatabaseHealth | — |
| POST /auth/login | loginController | login | loginSchema |
| GET /auth/me | meController | — | — |
| GET /platform/companies | listPlatformCompaniesController | listPlatformCompanies | — |
| POST /platform/companies | createPlatformCompanyController | createPlatformCompany | createPlatformCompanySchema |
| GET /companies/me | getCompanyController | getCompany | — |
| PUT /companies/me | updateCompanyController | updateCompany | updateCompanySchema |
| GET /users | listUsersController | listUsers | listUsersQuerySchema |
| GET /users/:id | getUserByIdController | getUserById | userIdParamSchema |
| POST /users | createUserController | createUser | createUserSchema |
| PUT /users/:id | updateUserController | updateUser | userIdParamSchema + updateUserSchema |
| DELETE /users/:id | deactivateUserController | deactivateUser | userIdParamSchema |
| GET /customers | listCustomersController | listCustomers | listCustomersQuerySchema |
| GET /customers/:id | getCustomerByIdController | getCustomerById | customerIdParamSchema |
| POST /customers | createCustomerController | createCustomer | createCustomerSchema |
| PUT /customers/:id | updateCustomerController | updateCustomer | customerIdParamSchema + updateCustomerSchema |
| DELETE /customers/:id | deactivateCustomerController | deactivateCustomer | customerIdParamSchema |
| GET /categories | listCategoriesController | listCategories | listCategoriesQuerySchema |
| GET /categories/:id | getCategoryByIdController | getCategoryById | categoryIdParamSchema |
| POST /categories | createCategoryController | createCategory | createCategorySchema |
| PUT /categories/:id | updateCategoryController | updateCategory | categoryIdParamSchema + updateCategorySchema |
| DELETE /categories/:id | deactivateCategoryController | deactivateCategory | categoryIdParamSchema |
| GET /teams | listTeamsController | listTeams | listTeamsQuerySchema |
| GET /teams/:id | getTeamByIdController | getTeamById | teamIdParamSchema |
| GET /teams/:id/members | listTeamMembersController | listTeamMembers | teamIdParamSchema |
| POST /teams | createTeamController | createTeam | createTeamSchema |
| PUT /teams/:id | updateTeamController | updateTeam | teamIdParamSchema + updateTeamSchema |
| POST /teams/:id/members | addTeamMemberController | addTeamMember | teamIdParamSchema + addTeamMemberSchema |
| DELETE /teams/:id/members/:userId | removeTeamMemberController | removeTeamMember | teamMemberParamSchema |
| DELETE /teams/:id | deleteTeamController | deleteTeam | teamIdParamSchema |
| GET /tickets | listTicketsController | listTickets | listTicketsQuerySchema |
| GET /tickets/:id | getTicketByIdController | getTicketById | ticketIdParamSchema |
| POST /tickets | createTicketController | createTicket | createTicketSchema |
| PUT /tickets/:id | updateTicketController | updateTicket | ticketIdParamSchema + updateTicketSchema |
| POST /tickets/:id/assign | assignTicketController | assignTicket | ticketIdParamSchema + assignTicketSchema |
| POST /tickets/:id/status | changeTicketStatusController | changeTicketStatus | ticketIdParamSchema + changeTicketStatusSchema |
| POST /tickets/:id/resolve | resolveTicketController | changeTicketStatus | ticketIdParamSchema |
| POST /tickets/:id/close | closeTicketController | changeTicketStatus | ticketIdParamSchema |
| POST /tickets/:id/reopen | reopenTicketController | changeTicketStatus | ticketIdParamSchema |
| GET /tickets/:id/comments | listTicketCommentsController | listTicketComments | ticketIdParamSchema |
| POST /tickets/:id/comments | createTicketCommentController | createTicketComment | ticketIdParamSchema + createTicketCommentSchema |
| GET /tickets/:id/history | listTicketHistoryController | listTicketHistory | ticketIdParamSchema |
| GET /dashboard | getDashboardController | getDashboard | dashboardQuerySchema |
| GET /notifications | listNotificationsController | listNotifications | listNotificationsQuerySchema |
| GET /notifications/unread-count | unreadCountController | getUnreadNotificationCount | — |
| PATCH /notifications/read-all | markAllNotificationsReadController | markAllNotificationsAsRead | — |
| PATCH /notifications/:id/read | markNotificationReadController | markNotificationAsRead | notificationIdParamSchema |
| POST /ai/triage | triageController | classifyTicket | triageTicketSchema |
| POST /ai/solutions | searchSolutionsController | searchPublishedKnowledge | searchSolutionsSchema |
| POST /ai/chat | chatController | classifyTicket, searchPublishedKnowledge, recordAiInteraction/createAiRequesterTicket | aiChatSchema |
| GET /knowledge-articles | listArticlesController | listArticles | — |
| POST /knowledge-articles | createArticleController | createArticle | articleSchema |
| PATCH /knowledge-articles/:id/status | setArticleStatusController | setArticleStatus | articleStatusSchema no body |

## Exemplos de recursos retornados

Os exemplos mostram nomes de campos; UUIDs e datas são ilustrativos. Listagens usam arrays desses recursos e pagination.

### Usuário

~~~json
{
  "data": {
    "id": "<uuid>",
    "companyId": "<uuid>",
    "customerId": null,
    "name": "Analista",
    "email": "analista@empresa.test",
    "role": "ANALYST",
    "status": "ACTIVE",
    "createdAt": "2026-09-21T12:00:00.000Z",
    "updatedAt": "2026-09-21T12:00:00.000Z"
  }
}
~~~

### Categoria e equipe

~~~json
{
  "data": {
    "id": "<uuid>",
    "companyId": "<uuid>",
    "name": "Acesso",
    "description": "Login e permissões",
    "status": "ACTIVE",
    "memberCount": 3,
    "createdAt": "2026-09-21T12:00:00.000Z",
    "updatedAt": "2026-09-21T12:00:00.000Z"
  }
}
~~~

status pertence à categoria; memberCount pertence à equipe.

### Chamado

~~~json
{
  "data": {
    "id": "<uuid>",
    "ticketNumber": 42,
    "title": "Acesso negado",
    "description": "Não consigo abrir o painel.",
    "status": "OPEN",
    "priority": "MEDIUM",
    "requester": { "id": "<uuid>", "name": "Solicitante" },
    "assignee": null,
    "team": { "id": "<uuid>", "name": "Suporte" },
    "category": { "id": "<uuid>", "name": "Acesso" },
    "createdAt": "2026-09-21T12:00:00.000Z",
    "updatedAt": "2026-09-21T12:00:00.000Z",
    "resolvedAt": null,
    "closedAt": null
  }
}
~~~

Criação, edição, atribuição e status retornam subconjuntos coerentes com a operação e o RETURNING do service.

### Comentário

~~~json
{
  "data": {
    "id": "<uuid>",
    "ticketId": "<uuid>",
    "author": { "id": "<uuid>", "name": "Analista", "role": "ANALYST" },
    "content": "Verificação em andamento.",
    "isInternal": false,
    "createdAt": "2026-09-21T12:00:00.000Z",
    "updatedAt": "2026-09-21T12:00:00.000Z"
  }
}
~~~

Histórico retorna id, ticketId, user, action, oldValue, newValue e createdAt. Notificação retorna id, type, title, message, isRead, readAt e createdAt.

### Artigo

~~~json
{
  "data": {
    "id": "<uuid>",
    "title": "Como redefinir senha",
    "content": "Procedimento completo...",
    "status": "PUBLISHED",
    "categoryId": "<uuid>",
    "categoryName": "Acesso",
    "sourceTicketId": null,
    "publishedAt": "2026-09-21T12:00:00.000Z",
    "createdAt": "2026-09-21T11:00:00.000Z",
    "updatedAt": "2026-09-21T12:00:00.000Z"
  }
}
~~~

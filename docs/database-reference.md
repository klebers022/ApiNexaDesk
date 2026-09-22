# Referência do schema PostgreSQL

Esta referência representa o resultado cumulativo das migrations ativas. NN significa NOT NULL.

## companies

| Coluna | Tipo | Regra |
|---|---|---|
| id | UUID | NN, gen_random_uuid(), PK |
| name | VARCHAR(150) | NN |
| legal_name | VARCHAR(150) | anulável |
| trade_name | VARCHAR(150) | anulável |
| document | VARCHAR(30) | anulável, único quando informado |
| email | VARCHAR(255) | anulável |
| phone | VARCHAR(30) | anulável |
| address_line1 | VARCHAR(150) | anulável |
| address_line2 | VARCHAR(100) | anulável |
| city | VARCHAR(100) | anulável |
| state | VARCHAR(100) | anulável |
| postal_code | VARCHAR(20) | anulável |
| status | VARCHAR(20) | NN, ACTIVE, CHECK |
| primary_admin_id | UUID | anulável, FK users, SET NULL |
| created_at | TIMESTAMPTZ | NN, NOW() |
| updated_at | TIMESTAMPTZ | NN, NOW() |

## customers

| Coluna | Tipo | Regra |
|---|---|---|
| id | UUID | NN, gen_random_uuid(), PK |
| company_id | UUID | NN, FK companies, CASCADE |
| name | VARCHAR(150) | NN |
| email | VARCHAR(255) | anulável |
| phone | VARCHAR(30) | anulável |
| document | VARCHAR(30) | anulável, único por empresa quando informado |
| status | VARCHAR(20) | NN, ACTIVE, CHECK |
| created_at | TIMESTAMPTZ | NN, NOW() |
| updated_at | TIMESTAMPTZ | NN, NOW() |

## users

| Coluna | Tipo | Regra |
|---|---|---|
| id | UUID | NN, gen_random_uuid(), PK |
| company_id | UUID | anulável para SUPER_ADMIN, FK companies, CASCADE |
| customer_id | UUID | anulável, FK composta customers |
| name | VARCHAR(150) | NN |
| email | VARCHAR(255) | NN, único por LOWER(email) |
| password_hash | TEXT | NN |
| role | VARCHAR(20) | NN, CHECK |
| status | VARCHAR(20) | NN, ACTIVE, CHECK |
| must_change_password | BOOLEAN | NN, FALSE |
| created_at | TIMESTAMPTZ | NN, NOW() |
| updated_at | TIMESTAMPTZ | NN, NOW() |

## categories

| Coluna | Tipo | Regra |
|---|---|---|
| id | UUID | NN, gen_random_uuid(), PK |
| company_id | UUID | NN, FK companies, CASCADE |
| name | VARCHAR(100) | NN, único por empresa |
| description | VARCHAR(500) | anulável |
| status | VARCHAR(20) | NN, ACTIVE, CHECK |
| created_at | TIMESTAMPTZ | NN, NOW() |
| updated_at | TIMESTAMPTZ | NN, NOW() |

## teams e team_members

| Tabela.coluna | Tipo | Regra |
|---|---|---|
| teams.id | UUID | NN, gen_random_uuid(), PK |
| teams.company_id | UUID | NN, FK companies, CASCADE |
| teams.name | VARCHAR(100) | NN, único por empresa |
| teams.description | VARCHAR(500) | anulável |
| teams.created_at | TIMESTAMPTZ | NN, NOW() |
| teams.updated_at | TIMESTAMPTZ | NN, NOW() |
| team_members.id | UUID | NN, gen_random_uuid(), PK |
| team_members.company_id | UUID | NN, FK companies, CASCADE |
| team_members.team_id | UUID | NN, FK composta teams, CASCADE |
| team_members.user_id | UUID | NN, FK composta users, CASCADE |
| team_members.created_at | TIMESTAMPTZ | NN, NOW() |

company_id/team_id/user_id é único em team_members.

## tickets

| Coluna | Tipo | Regra |
|---|---|---|
| id | UUID | NN, gen_random_uuid(), PK |
| company_id | UUID | NN, FK companies, CASCADE |
| ticket_number | BIGINT | NN, identity, único por empresa |
| title | VARCHAR(200) | NN |
| description | TEXT | NN |
| status | VARCHAR(30) | NN, OPEN, CHECK |
| priority | VARCHAR(10) | NN, MEDIUM, CHECK |
| requester_id | UUID | NN, FK composta users |
| assignee_id | UUID | anulável, FK composta users |
| team_id | UUID | anulável, FK composta teams |
| category_id | UUID | NN, FK composta categories |
| created_at | TIMESTAMPTZ | NN, NOW() |
| updated_at | TIMESTAMPTZ | NN, NOW() |
| resolved_at | TIMESTAMPTZ | anulável |
| closed_at | TIMESTAMPTZ | anulável |

## ticket_history e ticket_comments

| Tabela.coluna | Tipo | Regra |
|---|---|---|
| ticket_history.id | UUID | NN, gen_random_uuid(), PK |
| ticket_history.company_id | UUID | NN, FK companies, CASCADE |
| ticket_history.ticket_id | UUID | NN, FK composta tickets, CASCADE |
| ticket_history.user_id | UUID | anulável, FK users, RESTRICT |
| ticket_history.action | VARCHAR(50) | NN |
| ticket_history.old_value | TEXT | anulável |
| ticket_history.new_value | TEXT | anulável |
| ticket_history.created_at | TIMESTAMPTZ | NN, NOW() |
| ticket_comments.id | UUID | NN, gen_random_uuid(), PK |
| ticket_comments.company_id | UUID | NN, FK companies, CASCADE |
| ticket_comments.ticket_id | UUID | NN, FK composta tickets, CASCADE |
| ticket_comments.user_id | UUID | NN, FK composta users |
| ticket_comments.content | TEXT | NN, não vazio |
| ticket_comments.is_internal | BOOLEAN | NN, FALSE |
| ticket_comments.created_at | TIMESTAMPTZ | NN, NOW() |
| ticket_comments.updated_at | TIMESTAMPTZ | NN, NOW() |

## notifications

| Coluna | Tipo | Regra |
|---|---|---|
| id | UUID | NN, gen_random_uuid(), PK |
| company_id | UUID | NN, FK companies, CASCADE |
| user_id | UUID | NN, FK composta users, CASCADE |
| type | VARCHAR(30) | NN, CHECK |
| title | VARCHAR(255) | NN |
| message | TEXT | NN |
| read_at | TIMESTAMPTZ | anulável |
| created_at | TIMESTAMPTZ | NN, NOW() |

## ai_interactions

| Coluna | Tipo | Regra |
|---|---|---|
| id | UUID | NN, gen_random_uuid(), PK |
| company_id | UUID | NN, FK companies, CASCADE |
| user_id | UUID | NN, FK users, RESTRICT |
| action | VARCHAR(20) | NN, CHECK |
| input_message | TEXT | NN |
| response | TEXT | NN |
| classification | JSONB | anulável |
| matched_solutions | JSONB | anulável |
| ticket_id | UUID | anulável, FK tickets, SET NULL |
| resolved_at | TIMESTAMPTZ | anulável |
| created_at | TIMESTAMPTZ | NN, NOW() |

## knowledge_articles

| Coluna | Tipo | Regra |
|---|---|---|
| id | UUID | NN, gen_random_uuid(), PK |
| company_id | UUID | NN, FK companies, CASCADE |
| title | VARCHAR(200) | NN |
| content | TEXT | NN, não vazio |
| category_id | UUID | anulável, FK categories, SET NULL |
| status | VARCHAR(20) | NN, DRAFT, CHECK |
| source_ticket_id | UUID | anulável, FK tickets, SET NULL |
| created_by | UUID | NN, FK users, RESTRICT |
| published_by | UUID | anulável, FK users, SET NULL |
| published_at | TIMESTAMPTZ | anulável |
| created_at | TIMESTAMPTZ | NN, NOW() |
| updated_at | TIMESTAMPTZ | NN, NOW() |

## ai_conversations e ai_messages

| Tabela.coluna | Tipo | Regra |
|---|---|---|
| ai_conversations.id | UUID | NN, gen_random_uuid(), PK |
| ai_conversations.company_id | UUID | NN, FK companies, CASCADE |
| ai_conversations.user_id | UUID | NN, FK users, CASCADE |
| ai_conversations.title | VARCHAR(160) | anulável |
| ai_conversations.created_at | TIMESTAMPTZ | NN, NOW() |
| ai_conversations.updated_at | TIMESTAMPTZ | NN, NOW() |
| ai_messages.id | UUID | NN, gen_random_uuid(), PK |
| ai_messages.conversation_id | UUID | NN, FK ai_conversations, CASCADE |
| ai_messages.company_id | UUID | NN, FK companies, CASCADE |
| ai_messages.role | VARCHAR(20) | NN, USER ou ASSISTANT |
| ai_messages.content | TEXT | NN, não vazio |
| ai_messages.created_at | TIMESTAMPTZ | NN, NOW() |

## Índices e constraints nomeados

- customers_id_company_unique, customers_company_document_unique e idx_customers_company_status.
- users_id_company_unique, users_email_unique_ci, idx_users_company_role_status e idx_users_customer_company.
- categories_company_name_unique, categories_id_company_unique e idx_categories_company_status.
- teams_company_name_unique e teams_id_company_unique.
- team_members_unique e quatro índices por company/team/user nas duas ordens.
- tickets_company_number_unique, tickets_id_company_unique e índices por company/status, assignee, requester, category, team e created_at, além dos inversos para FKs.
- índices de ticket/user em ticket_history e ticket_comments nas ordens usadas pelas FKs e consultas.
- idx_notifications_unread e idx_notifications_user_company.
- companies_document_unique.
- ai_interactions_company_user_created_idx.
- knowledge_articles_company_status_idx.
- ai_conversations_company_user_updated_idx.
- ai_messages_conversation_created_idx.

As definições exatas permanecem em supabase/migrations.

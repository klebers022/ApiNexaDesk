# Banco de dados e migrations

## Visão geral

O banco é PostgreSQL hospedado no Supabase. A aplicação usa pg Pool com até 10 conexões, idle timeout de 30 segundos e connection timeout de 10 segundos. Não há ORM.

O estado final das seis migrations ativas contém 14 tabelas. A extensão pgcrypto fornece gen_random_uuid.

## Modelo relacional

~~~mermaid
erDiagram
  companies ||--o{ users : possui
  companies ||--o{ customers : legado
  companies ||--o{ categories : possui
  companies ||--o{ teams : possui
  companies ||--o{ tickets : possui
  companies ||--o{ knowledge_articles : possui
  companies ||--o{ ai_interactions : registra
  companies ||--o{ ai_conversations : possui
  companies ||--o{ ai_messages : isola
  companies o|--o| users : primary_admin
  customers o|--o{ users : vincula_requesters
  teams ||--o{ team_members : possui
  users ||--o{ team_members : participa
  users ||--o{ tickets : requester
  users o|--o{ tickets : assignee
  categories ||--o{ tickets : classifica
  teams o|--o{ tickets : atende
  tickets ||--o{ ticket_comments : recebe
  tickets ||--o{ ticket_history : registra
  users ||--o{ ticket_comments : escreve
  users o|--o{ ticket_history : executa
  users ||--o{ notifications : recebe
  tickets o|--o{ ai_interactions : originado
  categories o|--o{ knowledge_articles : classifica
  tickets o|--o{ knowledge_articles : origina
  users ||--o{ knowledge_articles : cria
  users o|--o{ knowledge_articles : publica
  users ||--o{ ai_interactions : executa
  users ||--o{ ai_conversations : possui
  ai_conversations ||--o{ ai_messages : contém
~~~

## Tabelas

A referência coluna a coluna e a lista nominal de índices estão em [Referência do schema](database-reference.md).

### companies

PK id UUID. Campos: name, legal_name, trade_name, document, email, phone, address_line1, address_line2, city, state, postal_code, status, primary_admin_id, created_at e updated_at. status aceita ACTIVE ou INACTIVE. document possui índice único parcial. primary_admin_id referencia users com ON DELETE SET NULL.

### customers

Entidade legada. PK id; FK company_id com CASCADE. Campos name, email, phone, document, status, created_at e updated_at. Unique composto id/company_id e documento único por empresa quando informado. A tabela tem comentário SQL de legado.

### users

PK id. company_id é anulável somente para SUPER_ADMIN. Campos customer_id, name, email, password_hash, role, status, must_change_password, created_at e updated_at.

role aceita SUPER_ADMIN, COMPANY_ADMIN, ANALYST e REQUESTER. users_company_by_role_check exige SUPER_ADMIN sem empresa/customer, COMPANY_ADMIN e ANALYST com empresa e sem customer, e REQUESTER com empresa. O email é único globalmente por LOWER(email). A FK composta de customer impede vínculo entre empresas.

### categories

PK id; FK company_id CASCADE. name, description, status, created_at e updated_at. status ACTIVE/INACTIVE. Nome é único por empresa. Unique id/company_id sustenta FKs compostas.

### teams

PK id; FK company_id CASCADE. name, description, created_at e updated_at. Nome único por empresa e unique id/company_id.

### team_members

PK id. company_id, team_id, user_id e created_at. FKs compostas garantem equipe e usuário no mesmo tenant, ambas com CASCADE. Associação company/team/user é única.

### tickets

PK id. company_id, ticket_number identity, title, description, status, priority, requester_id, assignee_id, team_id, category_id, created_at, updated_at, resolved_at e closed_at.

status: OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED ou CLOSED. priority: LOW, MEDIUM, HIGH ou URGENT. ticket_number é único dentro da empresa. FKs compostas garantem requester, assignee, team e category no tenant.

### ticket_history

PK id. company_id, ticket_id, user_id anulável, action, old_value, new_value e created_at. Ticket usa FK composta com CASCADE. Após a migration preserve_history_for_platform_admin, user_id referencia users apenas por id com RESTRICT para preservar histórico de usuários promovidos a SUPER_ADMIN.

### ticket_comments

PK id. company_id, ticket_id, user_id, content, is_internal, created_at e updated_at. content não pode ficar vazio após trim. Ticket usa CASCADE; usuário não especifica ação de exclusão.

### notifications

PK id. company_id, user_id, type, title, message, read_at e created_at. type aceita TICKET_ASSIGNED, TICKET_COMMENTED, TICKET_RESOLVED e SLA_WARNING. A FK composta de usuário usa CASCADE.

### ai_interactions

PK id. company_id, user_id, action, input_message, response, classification JSONB, matched_solutions JSONB, ticket_id, resolved_at e created_at. action aceita MESSAGE, RESOLVE e CREATE_TICKET. Empresa CASCADE, usuário RESTRICT e ticket SET NULL.

### knowledge_articles

PK id. company_id, title, content, category_id, status, source_ticket_id, created_by, published_by, published_at, created_at e updated_at. status aceita DRAFT, PUBLISHED e ARCHIVED. Categoria e ticket usam SET NULL; criador RESTRICT; publicador SET NULL.

As FKs simples de category_id e source_ticket_id não incluem company_id. A aplicação filtra tenant, mas o banco não impede diretamente um artigo de apontar para categoria/ticket de outra empresa.

### ai_conversations

PK id. company_id, user_id, title, created_at e updated_at. Empresa e usuário usam CASCADE. A tabela ainda não possui API.

### ai_messages

PK id. conversation_id, company_id, role, content e created_at. role aceita USER ou ASSISTANT; content não vazio. Ambas as FKs usam CASCADE. Não existe constraint composta que prove que conversation_id e company_id pertencem ao mesmo tenant.

## Índices

As migrations criam índices de tenant/status em customers, users e categories; tenant e participantes em team_members; status, responsável, solicitante, categoria, equipe e criação em tickets; ticket/data em histórico e comentários; notificações não lidas; empresas por document; IA por empresa/usuário/data; artigos por empresa/status/data; conversas por empresa/usuário/data; e mensagens por conversa/data.

Há pares de índices com ordem invertida para várias FKs compostas, adicionados pela migration harden_database_foundation.

## Timestamps

set_updated_at atualiza updated_at antes de UPDATE em companies, customers, users, categories, teams, tickets, ticket_comments, knowledge_articles e ai_conversations. A função usa search_path pg_catalog e teve EXECUTE revogado de PUBLIC.

## RLS e privilégios

RLS foi habilitado nas 14 tabelas. As migrations não criam policies. A migration de hardening revoga todos os privilégios de anon e authenticated nas tabelas públicas. O backend conecta por DATABASE_URL e o isolamento ocorre principalmente nas queries.

## Ordem das migrations

1. 20260917192839_initial_schema_nexadesk.sql
2. 20260917192851_harden_database_foundation.sql
3. 20260917220000_multi_tenant_platform.sql
4. 20260921143000_preserve_history_for_platform_admin.sql
5. 20260921213000_ai_interactions.sql
6. 20260921220000_ai_knowledge_and_conversations.sql

Arquivos em supabase/migration usam o diretório legado singular e não devem ser aplicados pela Supabase CLI.

## Aplicação

Em um banco vazio, aplique as migrations ativas em ordem com a ferramenta escolhida para o ambiente. Antes de aplicar em banco existente, consulte o histórico remoto; o projeto Supabase original recebeu a base inicial manualmente e teve migrations registradas/aplicadas em momentos diferentes.

O repositório não contém seeds executáveis nem um script npm de migration. Dados demonstrativos criados no ambiente remoto não fazem parte das migrations.

## Integridade e riscos

- FKs compostas fornecem boa defesa contra cruzamento de tenant no núcleo de tickets.
- knowledge_articles e ai_messages possuem company_id separado sem FK composta para categoria/ticket/conversa.
- RLS sem policies não é uma segunda barreira para a conexão do backend.
- Não há migration de rollback.
- O schema usa CHECKs textuais em vez de enums PostgreSQL.

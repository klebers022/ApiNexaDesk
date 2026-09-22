# Regras de negócio

## Empresas e usuários

- SUPER_ADMIN cria empresa e administrador inicial em uma transação.
- Documento de empresa é único quando informado.
- O administrador inicial recebe senha bcrypt e must_change_password = true.
- COMPANY_ADMIN cria, edita e inativa usuários somente em sua empresa.
- Emails são globalmente únicos sem diferença entre maiúsculas e minúsculas.
- Um administrador não pode inativar a própria conta.
- REQUESTER pode manter customer_id legado; COMPANY_ADMIN e ANALYST não podem.
- A criação comum de usuário não exige customer_id para REQUESTER e não marca troca obrigatória.

## Clientes legados

customers está marcado como legado na migration, mas cinco endpoints continuam montados para COMPANY_ADMIN. Inativar um customer também inativa usuários relacionados no service. O módulo ainda participa de validações de REQUESTER.

## Categorias

- Nome é único por empresa.
- Criação e edição são exclusivas de COMPANY_ADMIN.
- Exclusão é soft delete: status passa a INACTIVE.
- Somente categoria ACTIVE pode ser usada ao criar ou alterar ticket.

## Equipes

- Nome é único por empresa.
- Apenas ANALYST ativo pode ser membro.
- Uma associação empresa/equipe/usuário é única.
- Equipe com qualquer ticket vinculado não pode ser excluída.
- Remover membro não redistribui tickets já atribuídos.

## Chamados

Todos os papéis com empresa podem criar. REQUESTER sempre vira o solicitante. COMPANY_ADMIN e ANALYST precisam enviar requesterId de um REQUESTER ativo. Categoria deve estar ativa. Equipe e responsável devem pertencer à empresa; com ambos, o responsável deve ser membro.

A criação grava TICKET_CREATED e pode notificar o responsável. O service aceita teamId e assigneeId enviados por REQUESTER, uma lacuna atual.

Listagens são paginadas e ordenadas por criação decrescente. search procura número, título e descrição com ILIKE. Filtros: status, priority, categoryId, teamId e assigneeId.

COMPANY_ADMIN e ANALYST podem alterar título, descrição, prioridade e categoria de ticket acessível. Alterações de prioridade e categoria geram histórico.

### Máquina de status

~~~mermaid
stateDiagram-v2
  OPEN --> IN_PROGRESS
  IN_PROGRESS --> WAITING_CUSTOMER
  IN_PROGRESS --> RESOLVED
  WAITING_CUSTOMER --> IN_PROGRESS
  WAITING_CUSTOMER --> RESOLVED
  RESOLVED --> CLOSED
  RESOLVED --> IN_PROGRESS
  CLOSED --> IN_PROGRESS
~~~

Reabrir RESOLVED ou CLOSED limpa resolved_at e closed_at. Resolver preenche resolved_at. Fechar preenche closed_at. Mudanças gravam STATUS_CHANGED; resolução por outro usuário notifica o solicitante.

REQUESTER só acessa o próprio ticket, não cria comentário interno e não recebe internos na listagem. Comentários públicos notificam a outra parte. O histórico é visível a qualquer papel que consiga abrir o ticket.

## Artigos e IA

- COMPANY_ADMIN cria e altera status DRAFT, PUBLISHED ou ARCHIVED.
- REQUESTER recebe somente artigos PUBLISHED; ANALYST e COMPANY_ADMIN recebem todos.
- A busca usa artigos PUBLISHED do mesmo tenant e comparação lexical.
- Triagem tenta Gemini e usa heurística em ausência ou falha.
- Somente REQUESTER cria ticket pelo chat.
- resolve registra deflexão sem criar ticket.
- conversationHistory é validado, mas não é usado pelo controller ou modelo.
- ai_conversations e ai_messages existem no banco, mas não possuem service ou endpoint.

## Notificações

Cada usuário lista e altera somente notificações com seu company_id e user_id. Tipos: TICKET_ASSIGNED, TICKET_COMMENTED, TICKET_RESOLVED e SLA_WARNING. Não há job de SLA identificado.

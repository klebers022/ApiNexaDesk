# Autorização e isolamento multiempresa

## Papéis reais

O contexto antigo ADMIN, AGENT e REQUESTER diverge do código atual. A migration multi_tenant_platform converte ADMIN para COMPANY_ADMIN e AGENT para ANALYST e introduz SUPER_ADMIN.

| Papel | Empresa | Escopo real |
|---|---|---|
| SUPER_ADMIN | nenhuma | lista e cria empresas da plataforma |
| COMPANY_ADMIN | exatamente uma | administra recursos da própria empresa |
| ANALYST | exatamente uma | lê equipes e atua em chamados acessíveis |
| REQUESTER | exatamente uma | cria e acompanha os próprios chamados |

## Matriz de permissões observada

| Recurso | SUPER_ADMIN | COMPANY_ADMIN | ANALYST | REQUESTER |
|---|---:|---:|---:|---:|
| Login e /auth/me | sim | sim | sim | sim |
| Listar/criar empresas da plataforma | sim | não | não | não |
| Ler empresa atual | rota aceita, mas retorna 404 | sim | sim | sim |
| Editar nome da empresa atual | não | sim | não | não |
| Gerenciar usuários | não | sim | não | não |
| Gerenciar clientes legados | não | sim | não | não |
| Ler categorias | não | sim | sim | sim |
| Gerenciar categorias | não | sim | não | não |
| Ler equipes e membros | não | sim | sim | não |
| Gerenciar equipes e membros | não | sim | não | não |
| Criar chamado | não | sim | sim | sim |
| Listar/ver chamado | não | todos da empresa | próprio ou de equipe | somente próprio |
| Editar chamado | não | sim | acessível | não |
| Atribuir chamado | não | sim | somente assumir da própria equipe | não |
| Alterar status | não | sim | acessível | não |
| Comentar | não | sim | acessível | próprio |
| Criar/ver comentário interno | não | sim | sim | não |
| Ver histórico | não | sim | acessível | próprio |
| Dashboard operacional | 403 | empresa | acessíveis | próprios |
| Notificações próprias | tenant vazio | sim | sim | sim |
| Ler artigos | não | todos | todos | somente PUBLISHED |
| Criar/publicar artigos | não | sim | não | não |
| IA triagem/soluções/chat | não | sim | sim | sim |
| Criar ticket pelo chat | não | não | não | sim |

## Escopo de chamados

- COMPANY_ADMIN: qualquer ticket com t.company_id igual ao tenant autenticado.
- REQUESTER: adiciona requester_id igual ao usuário autenticado.
- ANALYST: assignee_id igual ao usuário ou team_id pertencente a uma equipe do usuário.

Esse filtro é aplicado em listagem, detalhe, edição, atribuição, status, comentários e histórico por listTickets, getTicketById ou findAccessibleTicket.

## Atribuição

O service pretende permitir ao ANALYST assumir apenas um ticket sem responsável, já associado a uma de suas equipes, mantendo a equipe e definindo assigneeId para si. COMPANY_ADMIN pode alterar equipe e responsável, desde que ambos pertençam ao tenant e o responsável pertença à equipe quando há equipe.

Há uma inconsistência atual: a validação SQL do responsável ainda procura role = 'AGENT', embora o papel migrado seja ANALYST. Isso bloqueia atribuições válidas e está registrado como P0.

## Limites conhecidos

- POST /tickets aceita teamId e assigneeId de REQUESTER e ANALYST; o service não remove esses campos por papel.
- Rotas de notificações não usam authorize; SUPER_ADMIN chega ao service com companyId vazio.
- GET /companies/me exige apenas autenticação, embora SUPER_ADMIN não tenha empresa.
- RLS está habilitado sem policies; o isolamento efetivo depende da API e das queries.
- AuthenticatedUser representa companyId como string e usa string vazia para SUPER_ADMIN.

Consulte [Segurança](security.md) e [Roadmap](roadmap.md).

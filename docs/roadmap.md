# Roadmap técnico e divergências

Este arquivo separa o que existe do que precisa ser corrigido ou evoluído.

## P0 — essencial

1. Trocar literais SQL AGENT por ANALYST em ticket.service e dashboard.service e ajustar fixtures antigos.
2. Bloquear teamId/assigneeId de REQUESTER na criação e definir regra explícita para ANALYST.
3. Mapear ANALYST_ASSIGNMENT_FORBIDDEN para 403.
4. Implementar troca obrigatória de senha, marcar usuários comuns com senha temporária e impedir acesso operacional até a troca.
5. Criar testes de isolamento entre tenants e autorização por papel com PostgreSQL real.
6. Decidir e concluir a retirada pública de customers e notifications ou alinhar o produto ao código.

## P1 — importante

1. Representar companyId como null para SUPER_ADMIN e bloquear rotas operacionais sem tenant.
2. Corrigir ranking que ainda usa AGENT.
3. Persistir/consultar ai_conversations e ai_messages ou remover tabelas até uso.
4. Usar conversationHistory na IA e criar política de PII, retenção, prompt injection, quota e custo.
5. Migrar sessão do browser para estratégia com cookie HttpOnly ou defesa equivalente; retirar/restringir /chatbot.
6. Adicionar OpenAPI 3 gerada/validada no CI.
7. Uniformizar erros e validação de params, inclusive article :id.
8. Adicionar health check pós-deploy, migrations controladas, rollback e environments protegidos.
9. Versionar Nginx/infraestrutura e procedimento de backup/restore.
10. Fortalecer integridade multiempresa de knowledge_articles e ai_messages com FKs compostas.

## P2 — evolução

- logger JSON, request ID, métricas, tracing, dashboards e alertas;
- cobertura, E2E e testes de carga;
- full-text search/pgvector e avaliação de qualidade da IA;
- refresh/revogação de sessão e recuperação de senha;
- convite por email e anexos em Supabase Storage;
- IaC e ambientes dev/staging/prod;
- registry de imagens, SBOM e scans de dependência/container;
- SLA por empresa/prioridade e job de alertas;
- paginação em artigos e empresas;
- lint/formatter e regras de arquitetura.

## Divergências confirmadas

| Expectativa anterior | Código atual |
|---|---|
| Perfis ADMIN/AGENT/REQUESTER | SUPER_ADMIN/COMPANY_ADMIN/ANALYST/REQUESTER |
| Clientes descontinuados na API | cinco endpoints ainda ativos |
| Notificações removidas | quatro endpoints e tabela continuam ativos |
| Usuários recebem senha temporária | apenas administrador inicial recebe must_change_password true |
| Conversas de IA persistidas | tabelas existem; API não usa |
| Histórico de chat influencia resposta | campo é validado e ignorado |
| Atribuição para ANALYST | SQL ainda procura AGENT |
| Ranking de analistas | SQL ainda procura AGENT |
| Pipeline com deploy e health check | deploy existe, mas não testa saúde |
| Infra Nginx/Certbot documentada no repo | não há arquivos versionados |
| Swagger/OpenAPI | não identificado |

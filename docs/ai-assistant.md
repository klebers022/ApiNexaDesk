# Assistente de IA

## Componentes

- ai.controller.ts expõe triagem, busca e chat.
- ai.service.ts classifica tickets, gera respostas e produz diagnóstico.
- knowledge.service.ts pesquisa artigos publicados e contém uma busca histórica não exposta pelas rotas atuais.
- ai-interaction.service.ts audita interações e cria tickets de REQUESTER em transação.
- article.service.ts administra a base curada.
- @google/genai integra o modelo gemini-2.5-flash quando há GEMINI_API_KEY.

## Triagem

classifyTicket tenta o Gemini com saída JSON e valida/mapeia a categoria para a lista ativa da empresa. Em chave ausente, JSON inválido ou falha do provedor, usa classifyTicketHeuristic.

A heurística procura termos de urgência, impacto, servidor, faturamento, acesso e conectividade. Ela devolve categoria, título sugerido, prioridade, confiança, justificativa e source = heuristic. Se não houver categoria, categoryId fica vazio e categoryName vira Geral.

## Busca de conhecimento

searchPublishedKnowledge:

1. normaliza a consulta, remove acentos, pontuação e stop words;
2. busca até 100 artigos PUBLISHED da empresa;
3. opcionalmente restringe à categoria pedida ou artigo sem categoria;
4. pontua a presença de palavras;
5. ordena e limita o resultado.

É busca lexical em memória depois do SELECT. Não há embeddings, pgvector, full-text search ou reranking semântico.

## Chat

~~~mermaid
sequenceDiagram
  participant U as Usuário
  participant C as aiController
  participant K as Knowledge
  participant M as Gemini/Heurística
  participant D as PostgreSQL

  U->>C: message + action
  C->>D: categorias ativas do tenant
  C->>M: classificar
  C->>K: artigos publicados do tenant
  alt action = message
    C->>M: gerar orientação
    C->>D: registrar ai_interactions
    C-->>U: resposta + classificação + soluções
  else action = resolve
    C->>D: registrar deflexão
    C-->>U: resolvido sem ticket
  else action = create_ticket
    C->>D: transação ticket + interação
    C-->>U: ticket criado
  end
~~~

Somente REQUESTER pode executar create_ticket. createAiRequesterTicket usa o mesmo PoolClient para createTicket e ai_interactions, garantindo commit ou rollback conjunto.

## Persistência

ai_interactions guarda mensagem, resposta, classificação, soluções correspondentes, ticket opcional e resolved_at. ai_conversations e ai_messages existem no schema, mas não são gravadas nem lidas por código atual.

conversationHistory é aceito e validado em aiChatSchema, até 12 mensagens de 1000 caracteres, mas o controller não o encaminha ao modelo. O chat atual é efetivamente sem memória entre mensagens.

## Privacidade e segurança

Os prompts podem enviar ao Google o texto digitado e trechos de artigos publicados quando GEMINI_API_KEY está ativa. Não existe mascaramento de PII, consentimento, política de retenção, proteção específica contra prompt injection ou quota por empresa. O rate limit global também cobre IA, mas não há limite dedicado nem medição de tokens/custos.

## Widget estático e CLI

public/chatbot/index.html é servido em /chatbot e permite informar manualmente URL da API e JWT, armazenando o token no localStorage. src/scripts/chatbot-cli.ts oferece um cliente de terminal via npm run chatbot. O widget é uma demonstração e requer endurecimento antes de exposição pública.

## Limites conhecidos

- categoryId em /ai/triage é validado, mas ignorado.
- conversationHistory não participa da geração.
- buscas retornam campos herdados do formato HistoricalSolution, como ticketNumber = 0 para artigos.
- falhas no registro de interação fazem /chat retornar erro mesmo quando uma resposta poderia ser gerada.
- não há streaming, cancelamento, timeout explícito ou circuit breaker.

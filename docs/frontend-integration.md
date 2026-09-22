# Integração frontend e backend

## Base e protocolo

O frontend React deve apontar para a origem da API e acrescentar /api/v1. As requisições e respostas usam JSON. Rotas protegidas enviam:

~~~http
Authorization: Bearer <JWT>
Content-Type: application/json
~~~

FRONTEND_URL no backend deve conter exatamente a origem do browser, incluindo protocolo e porta. É possível configurar múltiplas origens separadas por vírgula.

## Login e sessão

1. POST /auth/login;
2. guardar token e objeto user;
3. enviar Bearer nas chamadas;
4. chamar GET /auth/me ao restaurar a sessão;
5. em 401, limpar sessão e solicitar login;
6. em 403, mostrar falta de permissão ou contexto;
7. observar mustChangePassword, embora a API ainda não ofereça troca.

O frontend atual armazena JWT no localStorage. Cookies HttpOnly exigiriam mudança coordenada de API e frontend.

## Listagens

Usuários, clientes, categorias, equipes, tickets e notificações retornam:

~~~json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
~~~

O frontend deve manter filtros na URL ou estado e enviar nomes exatamente como definidos em [API](api.md).

## Erros

Use error.code para lógica de interface e error.message para mensagem. error.details pode conter issues Zod e muda de formato entre flatten().fieldErrors e issues. Trate 429 e 500 de modo explícito.

## Perfis

A interface pode esconder ações por role para UX, mas a API continua sendo a autoridade. SUPER_ADMIN usa rotas /platform; usuários de empresa usam módulos operacionais.

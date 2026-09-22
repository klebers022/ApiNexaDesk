# Respostas e tratamento de erros

## Formato

Controllers retornam erros conhecidos diretamente. AppError é tratado pelo errorHandler. JSON inválido e CORS possuem casos específicos. Falhas restantes são registradas e retornam uma mensagem genérica.

~~~json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Recurso não encontrado.",
    "details": []
  }
}
~~~

details é opcional. Não existe um catálogo central de códigos; vários controllers mantêm mapas locais.

| Status | Uso real |
|---:|---|
| 200 | leitura ou atualização bem-sucedida |
| 201 | criação bem-sucedida |
| 400 | Zod ou regra de entrada |
| 401 | token ausente/inválido, credencial inválida ou usuário inativo no middleware |
| 403 | papel, origem CORS, comentário interno, contexto de empresa ou usuário inativo no login |
| 404 | rota ou recurso não encontrado/inacessível |
| 409 | duplicidade, transição inválida, auto-inativação ou equipe com tickets |
| 429 | limite global ou de autenticação |
| 500 | banco, falha inesperada ou erro de IA encapsulado |

422 não é utilizado.

## Middlewares

- notFound cria AppError 404 ROUTE_NOT_FOUND depois de todas as rotas.
- errorHandler serializa AppError, JSON inválido como INVALID_JSON, CORS como CORS_NOT_ALLOWED e demais erros como INTERNAL_SERVER_ERROR.
- erros de banco têm detail registrado no servidor; o cliente não o recebe.

## Inconsistências

- Muitos controllers capturam tudo e retornam 500, sem passar pelo handler global.
- createPlatformCompany converte qualquer falha em 409.
- updateCompany não converte COMPANY_NOT_FOUND em 404.
- ANALYST_ASSIGNMENT_FORBIDDEN não está no mapa de ticket e vira 500.
- healthController não captura erro, portanto usa corretamente o handler global.

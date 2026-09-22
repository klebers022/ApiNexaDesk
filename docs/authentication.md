# Autenticação

## Login

POST /api/v1/auth/login valida email e password com loginSchema. O email é normalizado para minúsculas. auth.service consulta users de forma case-insensitive, rejeita conta ausente ou inativa e compara a senha com bcrypt.

~~~mermaid
sequenceDiagram
  participant F as Frontend
  participant C as loginController
  participant S as auth.service
  participant D as PostgreSQL
  participant B as bcrypt
  participant J as JWT

  F->>C: email + password
  C->>C: loginSchema
  C->>S: login
  S->>D: SELECT users por email
  S->>B: compare(password, password_hash)
  S->>J: sign(sub, companyId, role)
  J-->>F: token + user
~~~

O JWT contém:

| Claim | Origem |
|---|---|
| sub | users.id |
| companyId | users.company_id; string vazia para SUPER_ADMIN |
| role | papel vigente no login |
| iat e exp | adicionados por jsonwebtoken |

A validade vem de JWT_EXPIRES_IN, com padrão 1h. A assinatura usa JWT_SECRET.

## Requisições protegidas

~~~http
Authorization: Bearer <JWT>
~~~

authenticate verifica assinatura e expiração, extrai sub e consulta users novamente. O middleware só aceita status ACTIVE e preenche request.user com id, companyId, customerId, nome, email, role, status e mustChangePassword.

Respostas usuais:

- 401 UNAUTHORIZED: header ausente ou usuário inexistente/inativo;
- 401 INVALID_TOKEN: formato, assinatura ou expiração inválidos;
- 403 FORBIDDEN: papel não permitido.

## Senhas e primeiro acesso

Senhas são armazenadas com bcrypt, custo 10. createPlatformCompany cria o administrador inicial com must_change_password = true. createUser não preenche esse campo, portanto usa o default false da migration.

Não existe endpoint de troca ou recuperação de senha, renovação de token, logout server-side ou revogação. O campo mustChangePassword é devolvido, mas não é imposto pelo middleware. Esses gaps estão no [roadmap](roadmap.md).

## Exemplo

~~~http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@empresa.test",
  "password": "senha-local"
}
~~~

~~~json
{
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "<uuid>",
      "companyId": "<uuid>",
      "customerId": null,
      "name": "Administrador",
      "email": "admin@empresa.test",
      "role": "COMPANY_ADMIN",
      "status": "ACTIVE",
      "mustChangePassword": true
    }
  }
}
~~~

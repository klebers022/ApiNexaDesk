# Troubleshooting

## API encerra ao iniciar

env.ts encerra com código 1 quando falta DATABASE_URL, FRONTEND_URL ou JWT_SECRET, quando o secret tem menos de 32 caracteres ou uma URL é inválida. Confira a saída e o .env carregado no diretório de execução.

## Banco não conecta

- confira DATABASE_URL completa e sem caracteres quebrados;
- confirme host, porta, database, usuário e senha;
- verifique se a senha precisa de URL encoding;
- confira exigência de SSL do endpoint Supabase;
- teste DNS e acesso de rede;
- confirme limites/conexões do projeto.

ENOTFOUND indica normalmente hostname incorreto, connection string truncada ou DNS indisponível.

## invalid input syntax for type uuid: ""

Ocorre ao enviar string vazia a coluna/parâmetro UUID. SUPER_ADMIN não tem company_id e o middleware hoje converte null em string vazia. O dashboard já bloqueia esse contexto; outras rotas sem authorize podem reproduzir o problema. Use rotas /platform para SUPER_ADMIN e corrija o tipo para null antes de ampliar recursos.

## CORS no frontend

- confira Origin no DevTools;
- adicione a origem exata a FRONTEND_URL;
- separe múltiplas origens por vírgula;
- reinicie a API após alterar .env;
- não confunda http com https nem omita a porta local.

## Imagem Docker não encontrada

~~~bash
docker images
docker build -t nexadesk-api:local .
docker run --rm -p 3000:3000 --env-file .env nexadesk-api:local
~~~

A tag do run deve ser igual à tag do build.

## Porta 3000 ocupada

~~~bash
docker ps
docker run --rm -p 3001:3000 --env-file .env nexadesk-api:local
~~~

Pare o processo existente ou use outra porta no host.

## Container não inicia

~~~bash
docker ps -a
docker logs nexadesk-api
docker inspect nexadesk-api
~~~

Verifique variáveis obrigatórias, acesso ao banco e arquitetura da imagem.

## Nginx retorna 502

~~~bash
docker ps
docker logs nexadesk-api
curl -i http://127.0.0.1:3000/api/v1/health
sudo nginx -t
~~~

Se o curl local falhar, resolva API/container. Se funcionar, revise proxy_pass, firewall local e logs Nginx.

## Pipeline falha

Reproduza npm ci, npm run typecheck, npm test, npm run build e docker build localmente. No deploy, confira secrets SSH, acesso do usuário ao diretório/repositório, .env na VM e Docker daemon.

## Atribuição retorna responsável não encontrado

O service ainda consulta role = 'AGENT'. Como o schema atual usa ANALYST, a atribuição fica bloqueada. É um bug P0 conhecido, não um cadastro inválido.

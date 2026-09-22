# Docker

## Imagem

O Dockerfile usa duas etapas baseadas em node:22-alpine.

1. build: copia package files, executa npm ci, copia tsconfig e src e executa npm run build.
2. production: instala apenas dependências de produção, copia dist, troca para USER node, expõe 3000 e executa node dist/server.js.

Esse desenho remove TypeScript, testes e devDependencies da imagem final. .dockerignore exclui node_modules, dist, .env, Git, workflows, cobertura, migrations e testes.

Não há HEALTHCHECK no Dockerfile.

## Build e execução

~~~bash
docker build -t nexadesk-api:local .
docker run --rm --name nexadesk-api -p 3000:3000 --env-file .env nexadesk-api:local
~~~

Para publicar somente no loopback de uma VM:

~~~bash
docker run -d \
  --name nexadesk-api \
  --env-file .env \
  -p 127.0.0.1:3000:3000 \
  --restart unless-stopped \
  nexadesk-api:latest
~~~

## Diagnóstico

~~~bash
docker images
docker ps -a
docker logs nexadesk-api
curl http://127.0.0.1:3000/api/v1/health
~~~

Se a tag informada no docker run não existir, confira docker images e use exatamente a tag do build. Se a porta 3000 estiver ocupada, pare o processo/container ou publique outra porta, por exemplo -p 3001:3000.

Não há docker-compose no repositório.

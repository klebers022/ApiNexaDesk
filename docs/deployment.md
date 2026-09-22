# Deploy e infraestrutura

## Implementação versionada

O mecanismo versionado é o workflow [CI/CD](ci-cd.md): conexão SSH e rebuild no próprio host. A API fica vinculada a 127.0.0.1:3000, adequada para receber tráfego por reverse proxy local.

~~~mermaid
flowchart LR
  User[Usuário] --> Front[Frontend]
  Front -->|HTTPS /api/v1| Nginx[Nginx na VM]
  Nginx -->|HTTP 127.0.0.1:3000| Docker[Container NexaDesk API]
  Docker -->|TLS PostgreSQL conforme URL| DB[(Supabase PostgreSQL)]
  Docker -. opcional .-> Gemini[Google Gemini]
~~~

## Nginx e HTTPS

Não há arquivo de configuração Nginx, unit systemd, compose ou configuração Certbot no repositório. O ambiente Azure/Ubuntu já foi usado para testes com Nginx, HTTPS e Certbot, mas os comandos e domínios não podem ser reconstruídos apenas pelo código.

Antes de repetir o deploy, versionar em diretório de infraestrutura:

- server_name real;
- proxy_pass para http://127.0.0.1:3000;
- headers Host, X-Real-IP, X-Forwarded-For e X-Forwarded-Proto;
- limites/timeouts adequados;
- procedimento certbot --nginx e certbot renew --dry-run;
- firewall permitindo somente SSH, HTTP e HTTPS;
- backup e restauração.

Esses itens são recomendações, não configuração presente.

## Procedimento atual

1. CI valida código e Docker build.
2. Deploy conecta por SSH após sucesso em main.
3. Host faz git pull.
4. Host constrói a imagem.
5. Container anterior é parado/removido.
6. Novo container inicia com .env local.
7. Imagens não usadas são removidas.

Há interrupção entre remoção e início e não há health check. A VM foi usada para aprendizado/testes e a disponibilidade contínua não é garantida pelo repositório.

## Checklist manual

- migrations compatíveis aplicadas;
- .env presente, com permissões restritas;
- DNS e certificado válidos;
- docker ps e docker logs sem falhas;
- curl http://127.0.0.1:3000/api/v1/health retorna 200;
- endpoint HTTPS externo retorna 200;
- FRONTEND_URL contém exatamente a origem do frontend;
- backup recente e caminho de rollback conhecidos.

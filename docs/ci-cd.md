# CI/CD

## Continuous Integration

.github/workflows/ci.yml executa em pull requests e pushes para main, com permissão contents: read.

~~~mermaid
flowchart LR
  Event[PR ou push main] --> Checkout
  Checkout --> Node[Node 22 + cache npm]
  Node --> Install[npm ci]
  Install --> Typecheck[npm run typecheck]
  Typecheck --> Tests[npm test]
  Tests --> Build[npm run build]
  Build --> Image[docker build com SHA]
~~~

O job roda em ubuntu-latest, tem timeout de 10 minutos e não publica a imagem em registry.

## Deploy

.github/workflows/deploy.yml escuta a conclusão do workflow Continuous Integration. Só executa quando o CI teve sucesso e head_branch é main.

O appleboy/ssh-action conecta à VM, entra em /home/azureuser/ApiNexaDesk, faz git pull, constrói nexadesk-api:latest, substitui o container, publica 127.0.0.1:3000:3000 com restart unless-stopped e remove imagens não usadas.

Secrets exigidos:

| Secret | Uso |
|---|---|
| AZURE_VM_HOST | host ou IP da VM |
| AZURE_VM_USER | usuário SSH |
| AZURE_VM_SSH_KEY | chave privada SSH |

O .env precisa existir no host e não é gerenciado pelo workflow.

## Lacunas

- não aplica migrations;
- não executa health check depois do container;
- não guarda imagem anterior nem automatiza rollback;
- faz deploy direto de main sem environment/protection;
- git pull depende do estado limpo e credenciais do checkout na VM;
- não fixa ação por commit SHA;
- não publica artefatos, cobertura, SBOM ou scan;
- deploy e CI usam o mesmo nome de workflow por string, criando acoplamento.

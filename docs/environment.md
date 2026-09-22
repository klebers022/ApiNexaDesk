# Variáveis de ambiente

env.ts carrega dotenv e valida process.env com Zod durante a importação. Configuração inválida imprime fieldErrors e encerra o processo com código 1.

| Variável | Obrigatória | Padrão | Uso | Exemplo seguro |
|---|---:|---|---|---|
| PORT | não | 3000 | listener HTTP | 3000 |
| NODE_ENV | não | development | ambiente; aceita development, test, production | development |
| DATABASE_URL | sim | — | conexão PostgreSQL usada por pg Pool | postgresql://USER:PASSWORD@HOST:5432/DATABASE |
| FRONTEND_URL | sim | — | uma ou mais origens CORS separadas por vírgula | http://localhost:5173 |
| JWT_SECRET | sim | — | assinatura JWT; mínimo 32 caracteres | substitua-por-segredo-forte-de-32-chars |
| JWT_EXPIRES_IN | não | 1h | expiração passada ao jsonwebtoken | 1h |
| GEMINI_API_KEY | não | — | habilita Google Gemini; sem ela usa heurística | sua_chave_local |

DATABASE_URL pode precisar de SSL conforme o endpoint Supabase escolhido. O código não define ssl explicitamente; parâmetros da connection string e comportamento do driver/provedor determinam a conexão.

Use .env somente em desenvolvimento e no host de deploy. O Dockerfile não copia .env para a imagem; docker run recebe --env-file.

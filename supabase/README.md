# Banco de dados

As migrations ativas ficam em `supabase/migrations` e devem ser aplicadas em ordem de nome.

O schema inicial foi aplicado manualmente no projeto Supabase antes de o histórico ser configurado. A baseline remota já foi registrada; não execute novamente a migration inicial em produção. Em bancos novos, execute as duas migrations da pasta `migrations`.

Os arquivos restantes em `supabase/migration` são legados. Eles foram incorporados à migration inicial e não devem ser executados.

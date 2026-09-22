# Banco de dados Supabase

As migrations ativas ficam em migrations e devem ser consideradas em ordem de nome:

1. schema inicial;
2. hardening de privilégios e índices;
3. plataforma multiempresa e novos papéis;
4. preservação do histórico ao promover SUPER_ADMIN;
5. auditoria de IA;
6. artigos e conversas de IA.

O projeto Supabase original recebeu o schema inicial manualmente antes de o histórico ser consolidado. Confirme a tabela de migrations e o estado remoto antes de reaplicar qualquer arquivo.

O diretório migration, no singular, é legado. Seus dois arquivos de customers já foram incorporados ao schema inicial e não devem ser executados.

O repositório não contém seeds executáveis. Consulte [documentação completa do modelo](../docs/database.md).

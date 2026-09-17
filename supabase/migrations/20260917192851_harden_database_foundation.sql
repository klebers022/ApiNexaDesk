-- Protege o banco contra acesso direto pelo Data API e adiciona
-- índices de cobertura para as chaves estrangeiras compostas.

BEGIN;

ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;

CREATE INDEX IF NOT EXISTS idx_notifications_user_company
  ON public.notifications (user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_company
  ON public.team_members (team_id, company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_company
  ON public.team_members (user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_company
  ON public.ticket_comments (ticket_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_user_company
  ON public.ticket_comments (user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_company
  ON public.ticket_history (ticket_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_user_company
  ON public.ticket_history (user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_company
  ON public.tickets (assignee_id, company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_category_company
  ON public.tickets (category_id, company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_requester_company
  ON public.tickets (requester_id, company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_team_company
  ON public.tickets (team_id, company_id);
CREATE INDEX IF NOT EXISTS idx_users_customer_company
  ON public.users (customer_id, company_id);

COMMIT;

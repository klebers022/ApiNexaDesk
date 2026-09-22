-- Permite promover contas com histórico de atendimento para SUPER_ADMIN.
-- O histórico continua vinculado ao usuário e à empresa original do evento.
BEGIN;

ALTER TABLE public.ticket_history
  DROP CONSTRAINT IF EXISTS ticket_history_user_same_company_fk;

ALTER TABLE public.ticket_history
  ADD CONSTRAINT ticket_history_user_fk
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;

COMMIT;

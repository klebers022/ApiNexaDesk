-- Auditoria das ações do assistente de IA e vínculo transacional com tickets.
BEGIN;

CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  action VARCHAR(20) NOT NULL CHECK (action IN ('MESSAGE', 'RESOLVE', 'CREATE_TICKET')),
  input_message TEXT NOT NULL,
  response TEXT NOT NULL,
  classification JSONB,
  matched_solutions JSONB,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ai_interactions_company_user_created_idx
  ON public.ai_interactions (company_id, user_id, created_at DESC);

ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

COMMIT;

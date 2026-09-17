-- NexaDesk: schema inicial PostgreSQL / Supabase, registrado como baseline remota.
-- Esta migration representa a base do banco e deve ser aplicada em bancos vazios.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(30),
  document VARCHAR(30),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customers_id_company_unique UNIQUE (id, company_id)
);

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'AGENT', 'REQUESTER')),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_customer_same_company_fk
    FOREIGN KEY (customer_id, company_id)
    REFERENCES public.customers (id, company_id) ON DELETE RESTRICT,
  CONSTRAINT users_customer_by_role_check CHECK (
    (role = 'REQUESTER' AND customer_id IS NOT NULL)
    OR (role IN ('ADMIN', 'AGENT') AND customer_id IS NULL)
  ),
  CONSTRAINT users_id_company_unique UNIQUE (id, company_id)
);

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_company_name_unique UNIQUE (company_id, name),
  CONSTRAINT categories_id_company_unique UNIQUE (id, company_id)
);

CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT teams_company_name_unique UNIQUE (company_id, name),
  CONSTRAINT teams_id_company_unique UNIQUE (id, company_id)
);

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  team_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT team_members_team_same_company_fk
    FOREIGN KEY (team_id, company_id) REFERENCES public.teams (id, company_id) ON DELETE CASCADE,
  CONSTRAINT team_members_user_same_company_fk
    FOREIGN KEY (user_id, company_id) REFERENCES public.users (id, company_id) ON DELETE CASCADE,
  CONSTRAINT team_members_unique UNIQUE (company_id, team_id, user_id)
);

CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ticket_number BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED')),
  priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM'
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  requester_id UUID NOT NULL,
  assignee_id UUID,
  team_id UUID,
  category_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  CONSTRAINT tickets_company_number_unique UNIQUE (company_id, ticket_number),
  CONSTRAINT tickets_id_company_unique UNIQUE (id, company_id),
  CONSTRAINT tickets_requester_same_company_fk FOREIGN KEY (requester_id, company_id)
    REFERENCES public.users (id, company_id),
  CONSTRAINT tickets_assignee_same_company_fk FOREIGN KEY (assignee_id, company_id)
    REFERENCES public.users (id, company_id),
  CONSTRAINT tickets_team_same_company_fk FOREIGN KEY (team_id, company_id)
    REFERENCES public.teams (id, company_id),
  CONSTRAINT tickets_category_same_company_fk FOREIGN KEY (category_id, company_id)
    REFERENCES public.categories (id, company_id)
);

CREATE TABLE public.ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL,
  user_id UUID,
  action VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ticket_history_ticket_same_company_fk FOREIGN KEY (ticket_id, company_id)
    REFERENCES public.tickets (id, company_id) ON DELETE CASCADE,
  CONSTRAINT ticket_history_user_same_company_fk FOREIGN KEY (user_id, company_id)
    REFERENCES public.users (id, company_id) ON DELETE RESTRICT
);

CREATE TABLE public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (btrim(content) <> ''),
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ticket_comments_ticket_same_company_fk FOREIGN KEY (ticket_id, company_id)
    REFERENCES public.tickets (id, company_id) ON DELETE CASCADE,
  CONSTRAINT ticket_comments_user_same_company_fk FOREIGN KEY (user_id, company_id)
    REFERENCES public.users (id, company_id)
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type VARCHAR(30) NOT NULL
    CHECK (type IN ('TICKET_ASSIGNED', 'TICKET_COMMENTED', 'TICKET_RESOLVED', 'SLA_WARNING')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_user_same_company_fk FOREIGN KEY (user_id, company_id)
    REFERENCES public.users (id, company_id) ON DELETE CASCADE
);

CREATE INDEX idx_customers_company_status ON public.customers (company_id, status);
CREATE UNIQUE INDEX customers_company_document_unique
  ON public.customers (company_id, document) WHERE document IS NOT NULL;
CREATE UNIQUE INDEX users_email_unique_ci ON public.users (LOWER(email));
CREATE INDEX idx_users_company_role_status ON public.users (company_id, role, status);
CREATE INDEX idx_categories_company_status ON public.categories (company_id, status);
CREATE INDEX idx_team_members_company_team ON public.team_members (company_id, team_id);
CREATE INDEX idx_team_members_company_user ON public.team_members (company_id, user_id);
CREATE INDEX idx_tickets_company_status ON public.tickets (company_id, status);
CREATE INDEX idx_tickets_company_assignee ON public.tickets (company_id, assignee_id);
CREATE INDEX idx_tickets_company_requester ON public.tickets (company_id, requester_id);
CREATE INDEX idx_tickets_company_category ON public.tickets (company_id, category_id);
CREATE INDEX idx_tickets_company_team ON public.tickets (company_id, team_id);
CREATE INDEX idx_tickets_company_created_at ON public.tickets (company_id, created_at DESC);
CREATE INDEX idx_ticket_history_company_ticket ON public.ticket_history (company_id, ticket_id, created_at DESC);
CREATE INDEX idx_ticket_comments_company_ticket ON public.ticket_comments (company_id, ticket_id, created_at ASC);
CREATE INDEX idx_notifications_unread ON public.notifications (company_id, user_id, created_at DESC) WHERE read_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER companies_set_updated_at BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER customers_set_updated_at BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER teams_set_updated_at BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tickets_set_updated_at BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER ticket_comments_set_updated_at BEFORE UPDATE ON public.ticket_comments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

COMMIT;

-- NexaDesk multiempresa: empresas clientes, papéis e primeiro acesso.
BEGIN;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS legal_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS trade_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS document VARCHAR(30),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(150),
  ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  ADD COLUMN IF NOT EXISTS primary_admin_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS companies_document_unique
  ON public.companies (document) WHERE document IS NOT NULL;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  ALTER COLUMN company_id DROP NOT NULL;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_customer_by_role_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE public.users SET role = 'COMPANY_ADMIN' WHERE role = 'ADMIN';
UPDATE public.users SET role = 'ANALYST' WHERE role = 'AGENT';

ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (
  role IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'ANALYST', 'REQUESTER')
);
ALTER TABLE public.users ADD CONSTRAINT users_company_by_role_check CHECK (
  (role = 'SUPER_ADMIN' AND company_id IS NULL AND customer_id IS NULL)
  OR (role IN ('COMPANY_ADMIN', 'ANALYST') AND company_id IS NOT NULL AND customer_id IS NULL)
  OR (role = 'REQUESTER' AND company_id IS NOT NULL)
);

ALTER TABLE public.companies
  ADD CONSTRAINT companies_primary_admin_fk
  FOREIGN KEY (primary_admin_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- O cadastro antigo permanece somente para consulta/migração histórica.
COMMENT ON TABLE public.customers IS 'LEGACY: substituído por companies como entidade cliente da plataforma.';

COMMIT;

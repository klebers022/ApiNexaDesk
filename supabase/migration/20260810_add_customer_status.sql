BEGIN;

ALTER TABLE public.customers
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE public.customers
ADD CONSTRAINT customers_status_check
CHECK (
  status IN ('ACTIVE', 'INACTIVE')
);

CREATE INDEX idx_customers_company_status
ON public.customers (
  company_id,
  status
);

COMMIT;
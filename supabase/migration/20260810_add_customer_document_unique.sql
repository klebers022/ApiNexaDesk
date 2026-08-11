CREATE UNIQUE INDEX IF NOT EXISTS customers_company_document_unique
ON public.customers (company_id, document)
WHERE document IS NOT NULL;
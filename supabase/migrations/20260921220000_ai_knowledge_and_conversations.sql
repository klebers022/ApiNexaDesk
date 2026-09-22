-- Base de conhecimento curada por empresa e conversas persistidas de IA.
BEGIN;

CREATE TABLE public.knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL CHECK (btrim(content) <> ''),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  source_ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  published_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX knowledge_articles_company_status_idx
  ON public.knowledge_articles (company_id, status, updated_at DESC);

CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ai_conversations_company_user_updated_idx
  ON public.ai_conversations (company_id, user_id, updated_at DESC);

CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'ASSISTANT')),
  content TEXT NOT NULL CHECK (btrim(content) <> ''),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ai_messages_conversation_created_idx ON public.ai_messages (conversation_id, created_at);

ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER knowledge_articles_set_updated_at BEFORE UPDATE ON public.knowledge_articles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER ai_conversations_set_updated_at BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;

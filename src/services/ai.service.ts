import { env } from "../config/env";
import { HistoricalSolution } from "./knowledge.service";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface CategorySummary {
  id: string;
  name: string;
  description?: string | null;
}

export interface TicketClassification {
  categoryId: string;
  categoryName: string;
  suggestedTitle: string;
  priority: TicketPriority;
  confidence: number;
  reasoning: string;
  source: "llm" | "heuristic";
}

let genAiClient: any = null;

async function getGeminiClient(): Promise<any> {
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim() === "" || env.GEMINI_API_KEY === "sua_chave_aqui") {
    return null;
  }
  if (!genAiClient) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      genAiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    } catch (error) {
      console.warn("⚠️ [AI SERVICE] Erro ao instanciar GoogleGenAI:", (error as Error).message);
      return null;
    }
  }
  return genAiClient;
}

// ======================================================
// HEURISTIC ENGINE (ZERO-CRASH FALLBACK)
// ======================================================

const URGENT_KEYWORDS = [
  "fora do ar", "indisponivel", "indisponível", "caiu", "parou", "paralisado",
  "travou tudo", "urgente", "emergencia", "emergência", "interrupcao", "interrupção",
  "perda de dados", "corrompido", "paralisada", "falha geral", "producao parada",
  "produção parada", "servidor caiu", "banco travou", "sistema fora",
];

const HIGH_KEYWORDS = [
  "erro 500", "nao consigo", "não consigo", "bloqueado", "bloqueio", "faturar",
  "pagamento", "checkout", "lento", "lentidao", "lentidão", "critico", "crítico",
  "falha de login", "expirou", "rejeitado", "timeout", "falhou", "inoperante",
];

const LOW_KEYWORDS = [
  "como faco", "como faço", "duvida", "dúvida", "ajuste", "tutorial", "manual",
  "orientacao", "orientação", "perguntar", "solicitacao simples", "trocar foto",
  "alterar nome", "estetico", "estético", "sugestao", "sugestão",
];

function determinePriorityHeuristic(text: string): { priority: TicketPriority; reasoning: string } {
  const normalized = text.toLowerCase();

  for (const word of URGENT_KEYWORDS) {
    if (normalized.includes(word)) {
      return {
        priority: "URGENT",
        reasoning: `Detectado indicativo de indisponibilidade ou incidente crítico (${word}).`,
      };
    }
  }

  for (const word of HIGH_KEYWORDS) {
    if (normalized.includes(word)) {
      return {
        priority: "HIGH",
        reasoning: `Detectado impacto operacional relevante na rotina de trabalho (${word}).`,
      };
    }
  }

  for (const word of LOW_KEYWORDS) {
    if (normalized.includes(word)) {
      return {
        priority: "LOW",
        reasoning: `Identificado como pedido de orientação, dúvida ou ajuste de baixa severidade (${word}).`,
      };
    }
  }

  return {
    priority: "MEDIUM",
    reasoning: "Problema técnico operacional padrão sem evidência explícita de parada total.",
  };
}

function cleanTitle(text: string): string {
  const firstLine = text.trim().split(/[\n\r]+/)[0];
  const firstSentence = firstLine.split(/[.!?]/)[0].trim();
  const cleaned = firstSentence.length > 5 ? firstSentence : firstLine;
  return cleaned.length > 80 ? `${cleaned.slice(0, 77)}...` : cleaned;
}

export function classifyTicketHeuristic(
  text: string,
  categories: CategorySummary[]
): TicketClassification {
  if (categories.length === 0) {
    const { priority, reasoning } = determinePriorityHeuristic(text);
    return {
      categoryId: "",
      categoryName: "Geral",
      suggestedTitle: cleanTitle(text),
      priority,
      confidence: 0.6,
      reasoning: `${reasoning} Nenhuma categoria cadastrada na empresa.`,
      source: "heuristic",
    };
  }

  const normalizedText = text.toLowerCase();
  let bestCategory = categories[0];
  let maxScore = -1;

  for (const cat of categories) {
    let score = 0;
    const catName = cat.name.toLowerCase();
    const catDesc = (cat.description || "").toLowerCase();

    // Palavras individuais da categoria
    const nameWords = catName.split(/\s+/).filter((w) => w.length > 2);
    for (const w of nameWords) {
      if (normalizedText.includes(w)) score += 3;
    }

    if (catDesc) {
      const descWords = catDesc.split(/\s+/).filter((w) => w.length > 3);
      for (const w of descWords) {
        if (normalizedText.includes(w)) score += 1.5;
      }
    }

    // Heurísticas específicas por contexto comum
    if (catName.includes("infra") || catName.includes("servidor") || catName.includes("ti")) {
      if (normalizedText.includes("servidor") || normalizedText.includes("banco") || normalizedText.includes("deploy")) {
        score += 4;
      }
    }
    if (catName.includes("acesso") || catName.includes("login") || catName.includes("conta")) {
      if (normalizedText.includes("senha") || normalizedText.includes("login") || normalizedText.includes("autentica")) {
        score += 4;
      }
    }
    if (catName.includes("rede") || catName.includes("conex")) {
      if (normalizedText.includes("internet") || normalizedText.includes("vpn") || normalizedText.includes("wi-fi") || normalizedText.includes("wifi")) {
        score += 4;
      }
    }
    if (catName.includes("financeiro") || catName.includes("fatura") || catName.includes("cobranca")) {
      if (normalizedText.includes("pagamento") || normalizedText.includes("cartao") || normalizedText.includes("boleto") || normalizedText.includes("nota")) {
        score += 4;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }

  const { priority, reasoning } = determinePriorityHeuristic(text);
  const confidence = maxScore > 3 ? 0.88 : maxScore > 0 ? 0.75 : 0.6;

  return {
    categoryId: bestCategory.id,
    categoryName: bestCategory.name,
    suggestedTitle: cleanTitle(text),
    priority,
    confidence,
    reasoning: `${reasoning} Categoria selecionada por correlação semântica com os termos da solicitação.`,
    source: "heuristic",
  };
}

// ======================================================
// CLASSIFY TICKET (PRIMARY: GEMINI LLM, BACKUP: HEURISTIC)
// ======================================================

export async function classifyTicket({
  text,
  categories,
}: {
  text: string;
  categories: CategorySummary[];
}): Promise<TicketClassification> {
  const gemini = await getGeminiClient();

  if (!gemini || categories.length === 0) {
    return classifyTicketHeuristic(text, categories);
  }

  try {
    const categoriesListStr = categories
      .map((c) => `- ID: ${c.id} | Nome: "${c.name}" | Descrição: "${c.description || ""}"`)
      .join("\n");

    const prompt = `Você é o classificador especialista em triagem de chamados do NexaDesk.
Analise a seguinte solicitação de suporte enviada pelo usuário e selecione a categoria mais apropriada entre as categorias cadastradas.
Defina a prioridade adequada seguindo estas regras de SLA:
- URGENT: Sistemas inoperantes, parada total da empresa ou de operações críticas, indisponibilidade geral.
- HIGH: Bloqueio importante no fluxo de trabalho de um setor, falhas graves sem contorno imediato.
- MEDIUM: Problemas operacionais comuns, lentidão pontual, bugs em funcionalidades não impeditivas.
- LOW: Dúvidas de uso, orientações, solicitações de melhorias visuais ou configurações simples.

Categorias disponíveis:
${categoriesListStr}

Mensagem do usuário:
"""${text}"""

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "categoryId": "ID_EXATO_DA_CATEGORIA_ESCOLHIDA",
  "suggestedTitle": "Título conciso e profissional em até 60 caracteres",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "confidence": número entre 0.0 e 1.0,
  "reasoning": "Explicação objetiva de 1 a 2 frases do motivo da classificação e prioridade"
}`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text?.trim() || "";
    const parsed = JSON.parse(responseText);

    const matchedCategory = categories.find((c) => c.id === parsed.categoryId) || categories[0];
    const validPriorities: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    const priority: TicketPriority = validPriorities.includes(parsed.priority)
      ? parsed.priority
      : "MEDIUM";

    return {
      categoryId: matchedCategory.id,
      categoryName: matchedCategory.name,
      suggestedTitle: parsed.suggestedTitle || cleanTitle(text),
      priority,
      confidence: typeof parsed.confidence === "number" ? Math.min(Math.max(parsed.confidence, 0.1), 0.99) : 0.9,
      reasoning: parsed.reasoning || "Classificação realizada com sucesso pelo modelo de inteligência artificial.",
      source: "llm",
    };
  } catch (error) {
    console.warn("⚠️ [AI SERVICE] Falha na chamada ao Google Gemini, ativando fallback heurístico:", (error as Error).message);
    return classifyTicketHeuristic(text, categories);
  }
}

// ======================================================
// GENERATE SOLUTION RESPONSE
// ======================================================

export async function generateSolutionResponse({
  userMessage,
  matchingSolutions,
}: {
  userMessage: string;
  matchingSolutions: HistoricalSolution[];
}): Promise<string> {
  const gemini = await getGeminiClient();

  if (matchingSolutions.length > 0) {
    if (gemini) {
      try {
        const solutionsContext = matchingSolutions
          .slice(0, 3)
          .map(
            (s, index) =>
              `Solução #${index + 1} (Chamado #${s.ticketNumber} - ${s.title}):\n${s.solutionSnippet}`
          )
          .join("\n\n");

        const prompt = `Você é o assistente virtual de autoatendimento NexaDesk.
Com base nas soluções comprovadas encontradas na base histórica da empresa, elabore uma resposta amigável, clara e formatada em Markdown com um guia passo a passo para ajudar o usuário a resolver o problema agora mesmo.

Problema do usuário:
"""${userMessage}"""

Soluções encontradas na base de conhecimento:
${solutionsContext}

Diretrizes:
- Responda em Português do Brasil de forma empática e profissional.
- Organize os passos em tópicos numerados ou em lista com marcadores claros.
- Finalize perguntando educadamente se o passo a passo resolveu o problema ou se ele prefere que um chamado seja aberto imediatamente para nossa equipe humana de analistas.`;

        const response = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        if (response.text) {
          return response.text.trim();
        }
      } catch (error) {
        console.warn("⚠️ [AI SERVICE] Falha ao sintetizar solução com Gemini, usando formato estruturado padrão:", (error as Error).message);
      }
    }

    // Resposta estruturada padrão em caso de fallback
    const bestSolution = matchingSolutions[0];
    return `Olá! Encontrei procedimentos já validados em nossa base de conhecimento para essa situação (Baseado no chamado #${bestSolution.ticketNumber} - *${bestSolution.title}*):

### 📋 Passo a Passo Recomendado:
${bestSolution.solutionSnippet}

---
💡 **Essa orientação conseguiu resolver o seu problema?**
- Se sim, você pode confirmar para registrar a resolução imediata.
- Se ainda precisar de ajuda, clique em **"Abrir Chamado"** que já encaminharei sua solicitação com a categoria e prioridade preenchidas!`;
  }

  // Nenhuma solução histórica encontrada
  return `Compreendi a sua solicitação. Não encontrei uma solução idêntica documentada na base histórica, mas já estruturei o diagnóstico preliminar para agilizar o seu atendimento humano.

Deseja que eu registre a abertura do seu chamado na categoria identificada agora mesmo?`;
}

// ======================================================
// GENERATE DIAGNOSTIC COMMENT FOR ANALYSTS
// ======================================================

export function generateDiagnosticComment({
  userMessage,
  classification,
  solutionsAttempted,
}: {
  userMessage: string;
  classification: TicketClassification;
  solutionsAttempted: HistoricalSolution[];
}): string {
  const solutionsList =
    solutionsAttempted.length > 0
      ? solutionsAttempted
          .slice(0, 3)
          .map((s) => `  - Chamado #${s.ticketNumber} ("${s.title}") [Relevância: ${s.score}]`)
          .join("\n")
      : "  - Nenhuma solução histórica compatível localizada previamente.";

  const confidencePct = Math.round(classification.confidence * 100);

  return `🤖 **Diagnóstico Automático da IA NexaDesk**

- **Classificação:** Categoria \`${classification.categoryName}\`
- **Prioridade Recomendada:** \`${classification.priority}\`
- **Confiança da Análise:** ${confidencePct}% (${classification.source === "llm" ? "Google Gemini LLM" : "Motor Heurístico Fallback"})
- **Parecer da IA:** ${classification.reasoning}

📌 **Base Histórica Consultada:**
${solutionsList}

📝 **Relato Inicial do Solicitante:**
> "${userMessage}"

*(Nota inserida automaticamente pelo assistente virtual no momento do encaminhamento ao suporte técnico).*`;
}

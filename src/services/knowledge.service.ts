import { pool } from "../database/connection";

export interface HistoricalSolution {
  ticketId: string;
  ticketNumber: number;
  title: string;
  categoryName: string;
  categoryId: string;
  status: string;
  solutionSnippet: string;
  score: number;
}

interface SearchSimilarSolutionsParams {
  companyId: string;
  userId: string;
  userRole: "SUPER_ADMIN" | "COMPANY_ADMIN" | "ANALYST" | "REQUESTER";
  query: string;
  categoryId?: string;
  limit?: number;
}

interface DbTicketRow {
  id: string;
  ticket_number: string | number;
  title: string;
  description: string;
  status: string;
  category_id: string;
  category_name: string | null;
  public_comment: string | null;
}

// Lista básica de stop words comuns em português
const STOP_WORDS = new Set([
  "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das",
  "em", "no", "na", "nos", "nas", "por", "para", "com", "sem", "sobre", "entre",
  "e", "ou", "mas", "que", "se", "como", "quando", "onde", "porque", "porquê",
  "meu", "minha", "seu", "sua", "nosso", "nossa", "ele", "ela", "eles", "elas",
  "eu", "voce", "você", "nós", "estou", "esta", "está", "estava", "ter", "tem",
  "tinha", "foi", "ser", "sendo", "fazer", "fazendo", "muito", "pouco", "ja", "já",
  "não", "nao", "sim", "dar", "deu", "deve", "pode", "poderia",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

export async function searchPublishedKnowledge({
  companyId, query, categoryId, limit = 3,
}: { companyId: string; query: string; categoryId?: string; limit?: number }): Promise<HistoricalSolution[]> {
  const keywords = extractKeywords(query);
  if (!keywords.length) return [];
  const result = await pool.query<{
    id:string; title:string; content:string; category_id:string|null; category_name:string|null;
  }>(
    `SELECT a.id,a.title,a.content,a.category_id,c.name AS category_name
     FROM knowledge_articles a
     LEFT JOIN categories c ON c.id=a.category_id AND c.company_id=a.company_id
     WHERE a.company_id=$1 AND a.status='PUBLISHED'
       ${categoryId ? "AND (a.category_id=$2 OR a.category_id IS NULL)" : ""}
     ORDER BY a.updated_at DESC LIMIT 100`,
    categoryId ? [companyId,categoryId] : [companyId],
  );
  return result.rows.map((article) => {
    const searchable=extractKeywords(`${article.title} ${article.content}`);
    const score=keywords.reduce((total, word) => total + (searchable.includes(word) ? 1 : 0), 0);
    return {
      ticketId: article.id, ticketNumber: 0, title: article.title,
      categoryName: article.category_name || "Geral", categoryId: article.category_id || "",
      status: "PUBLISHED", solutionSnippet: article.content.slice(0,300), score,
    };
  }).filter((article)=>article.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
}

export async function searchSimilarSolutions({
  companyId,
  userId,
  userRole,
  query,
  categoryId,
  limit = 5,
}: SearchSimilarSolutionsParams): Promise<HistoricalSolution[]> {
  if (userRole === "REQUESTER" || userRole === "SUPER_ADMIN") return [];

  const keywords = extractKeywords(query);

  if (keywords.length === 0) {
    return [];
  }

  // Busca tickets com status de conclusão no PostgreSQL dentro do tenant da empresa
  const analystRestriction = userRole === "ANALYST"
    ? `AND (t.assignee_id = $2 OR EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.company_id = t.company_id
          AND tm.team_id = t.team_id
          AND tm.user_id = $2
      ))`
    : "";
  const categoryPosition = userRole === "ANALYST" ? 3 : 2;
  const sql = `
    SELECT
      t.id,
      t.ticket_number,
      t.title,
      t.description,
      t.status,
      t.category_id,
      c.name AS category_name,
      (
        SELECT tc.content
        FROM ticket_comments tc
        WHERE tc.ticket_id = t.id
          AND tc.company_id = t.company_id
          AND tc.is_internal = FALSE
        ORDER BY tc.created_at DESC
        LIMIT 1
      ) AS public_comment
    FROM tickets t
    LEFT JOIN categories c ON c.id = t.category_id AND c.company_id = t.company_id
    WHERE t.company_id = $1
      AND t.status IN ('RESOLVED', 'CLOSED')
      ${analystRestriction}
      ${categoryId ? `AND t.category_id = $${categoryPosition}` : ""}
    ORDER BY t.updated_at DESC
    LIMIT 100;
  `;

  const values = userRole === "ANALYST"
    ? (categoryId ? [companyId, userId, categoryId] : [companyId, userId])
    : (categoryId ? [companyId, categoryId] : [companyId]);
  const { rows } = await pool.query<DbTicketRow>(sql, values);

  const scoredSolutions: HistoricalSolution[] = [];

  for (const row of rows) {
    let score = 0;

    const normalizedTitle = extractKeywords(row.title);
    const normalizedDesc = extractKeywords(row.description);
    const normalizedComments = extractKeywords(row.public_comment || "");

    for (const keyword of keywords) {
      if (normalizedTitle.includes(keyword)) score += 4;
      if (normalizedDesc.includes(keyword)) score += 2;
      if (normalizedComments.includes(keyword)) score += 1.5;
    }

    if (categoryId && row.category_id === categoryId) {
      score += 2;
    }

    if (score > 0) {
      // Extrair snippet de solução prioritariamente dos comentários mais recentes ou da descrição
      let solutionSnippet = "";
      if (row.public_comment) {
        // Encontra o comentário mais recente relevante
        solutionSnippet = row.public_comment.slice(0, 300);
      } else {
        solutionSnippet = row.description.slice(0, 300);
      }

      scoredSolutions.push({
        ticketId: row.id,
        ticketNumber: Number(row.ticket_number),
        title: row.title,
        categoryName: row.category_name || "Geral",
        categoryId: row.category_id,
        status: row.status,
        solutionSnippet,
        score,
      });
    }
  }

  // Ordena por maior pontuação
  scoredSolutions.sort((a, b) => b.score - a.score);

  return scoredSolutions.slice(0, limit);
}

import { pool } from "../database/connection";

export async function listArticles(companyId: string, publishedOnly = false) {
  const result = await pool.query(
    `SELECT a.id, a.title, a.content, a.status, a.category_id AS "categoryId",
      a.source_ticket_id AS "sourceTicketId", a.published_at AS "publishedAt",
      a.created_at AS "createdAt", a.updated_at AS "updatedAt",
      c.name AS "categoryName"
     FROM knowledge_articles a
     LEFT JOIN categories c ON c.id = a.category_id AND c.company_id = a.company_id
     WHERE a.company_id = $1 ${publishedOnly ? "AND a.status = 'PUBLISHED'" : ""}
     ORDER BY a.updated_at DESC`,
    [companyId],
  );
  return result.rows;
}

export async function createArticle(companyId: string, userId: string, input: {title:string;content:string;categoryId?:string|null;sourceTicketId?:string|null}) {
  const result = await pool.query(
    `INSERT INTO knowledge_articles (company_id,title,content,category_id,source_ticket_id,created_by)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id,title,content,status,category_id AS "categoryId",created_at AS "createdAt"`,
    [companyId,input.title,input.content,input.categoryId ?? null,input.sourceTicketId ?? null,userId],
  );
  return result.rows[0];
}

export async function setArticleStatus(companyId: string, userId: string, id: string, status: "DRAFT"|"PUBLISHED"|"ARCHIVED") {
  const result = await pool.query(
    `UPDATE knowledge_articles SET status=$1,
      published_by=CASE WHEN $1='PUBLISHED' THEN $2 ELSE published_by END,
      published_at=CASE WHEN $1='PUBLISHED' THEN NOW() ELSE published_at END
     WHERE id=$3 AND company_id=$4
     RETURNING id,title,status,published_at AS "publishedAt"`,
    [status,userId,id,companyId],
  );
  return result.rows[0] ?? null;
}

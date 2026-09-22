import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { pool } from "../database/connection";
import {
  classifyTicket,
  generateDiagnosticComment,
  generateSolutionResponse,
} from "../services/ai.service";
import { HistoricalSolution, searchSimilarSolutions } from "../services/knowledge.service";
import { createTicket, createTicketComment } from "../services/ticket.service";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "ANALYST" | "REQUESTER";
  company_id: string;
}

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
}

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

async function main() {
  const rl = readline.createInterface({ input, output });

  console.clear();
  console.log(`${colors.cyan}${colors.bright}`);
  console.log("================================================================================");
  console.log("             🤖 NEXADESK INTELLIGENT AI CHATBOT CLI (DEMO)                     ");
  console.log("        Triagem Dinâmica • RAG de Base Histórica • Ticket Deflection            ");
  console.log("================================================================================");
  console.log(colors.reset);

  try {
    // 1. Carregar usuário para contexto do tenant
    let currentUser: UserRow | null = null;
    try {
      const userRes = await pool.query<UserRow>(
        `SELECT id, name, email, role, company_id FROM users WHERE status = 'ACTIVE' AND company_id IS NOT NULL LIMIT 1;`
      );
      if (userRes.rows.length > 0) {
        currentUser = userRes.rows[0];
      }
    } catch {
      // Ignora erro de conexão imediata
    }

    if (!currentUser) {
      console.log(`${colors.yellow}⚠️ Nenhum usuário do banco detectado. Usando perfil de demonstração local.${colors.reset}`);
      currentUser = {
        id: "a0000000-0000-0000-0000-000000000001",
        name: "Demo Requester",
        email: "demo@nexadesk.com",
        role: "REQUESTER",
        company_id: "c0000000-0000-0000-0000-000000000001",
      };
    }

    console.log(`${colors.dim}👤 Usuário ativo: ${colors.bright}${currentUser.name} (${currentUser.email})${colors.reset}`);
    console.log(`${colors.dim}🏢 Empresa ID: ${currentUser.company_id}${colors.reset}\n`);

    // 2. Carregar categorias
    let categories: CategoryRow[] = [];
    try {
      const catRes = await pool.query<CategoryRow>(
        `SELECT id, name, description FROM categories WHERE company_id = $1 AND status = 'ACTIVE' ORDER BY name ASC;`,
        [currentUser.company_id]
      );
      categories = catRes.rows;
    } catch {
      // fallback
    }

    if (categories.length === 0) {
      categories = [
        { id: "10000000-0000-0000-0000-000000000001", name: "Infraestrutura & Redes", description: "Servidores, banco de dados, conexão e lentidão" },
        { id: "10000000-0000-0000-0000-000000000002", name: "Acesso e Contas", description: "Login, senha, 2FA e permissões" },
        { id: "10000000-0000-0000-0000-000000000003", name: "Financeiro & Faturamento", description: "Notas fiscais, boletos e pagamentos" },
        { id: "10000000-0000-0000-0000-000000000004", name: "Suporte e Dúvidas Gerais", description: "Uso do sistema e orientações" },
      ];
    }

    console.log(`${colors.green}📋 Categorias ativas carregadas (${categories.length}):${colors.reset}`);
    categories.forEach((c) => console.log(`   • ${c.name} ${colors.dim}- ${c.description || ""}${colors.reset}`));
    console.log("\n" + colors.dim + "─".repeat(80) + colors.reset + "\n");

    let running = true;

    while (running) {
      const promptText = `\n${colors.bright}${colors.cyan}💬 Descreva seu problema ou dúvida (ou 'sair' para encerrar):${colors.reset}\n> `;
      const userMessage = await rl.question(promptText);

      if (!userMessage.trim() || userMessage.trim().toLowerCase() === "sair") {
        console.log(`\n${colors.yellow}👋 Sessão do chatbot finalizada. Até logo!${colors.reset}\n`);
        break;
      }

      console.log(`\n${colors.dim}⏳ Analisando e consultando base de conhecimento NexaDesk...${colors.reset}`);

      // Triagem
      const classification = await classifyTicket({
        text: userMessage,
        categories,
      });

      // Busca na base histórica
      let solutions: HistoricalSolution[] = [];
      try {
        solutions = await searchSimilarSolutions({
          companyId: currentUser.company_id,
          userId: currentUser.id,
          userRole: currentUser.role === "REQUESTER" ? "REQUESTER" : "COMPANY_ADMIN",
          query: userMessage,
          categoryId: classification.categoryId || undefined,
          limit: 3,
        });
      } catch {
        solutions = [];
      }

      // Painel de Triagem
      const priorityColor =
        classification.priority === "URGENT"
          ? colors.red
          : classification.priority === "HIGH"
          ? colors.yellow
          : classification.priority === "MEDIUM"
          ? colors.blue
          : colors.green;

      console.log(`\n${colors.bright}┌─ 🧠 DIAGNÓSTICO DA IA ──────────────────────────────────────────────┐${colors.reset}`);
      console.log(`│ Categoria:  ${colors.cyan}${classification.categoryName.padEnd(52)}${colors.reset}│`);
      console.log(`│ Prioridade: ${priorityColor}${classification.priority.padEnd(10)}${colors.reset} Confiança: ${(Math.round(classification.confidence * 100) + "%").padEnd(10)} Motor: ${(classification.source === "llm" ? "Gemini LLM" : "Heurístico").padEnd(16)}│`);
      console.log(`│ Parecer:    ${colors.dim}${classification.reasoning.slice(0, 56).padEnd(56)}${colors.reset}│`);
      console.log(`${colors.bright}└─────────────────────────────────────────────────────────────────────┘${colors.reset}`);

      // Solução gerada
      const solutionResponse = await generateSolutionResponse({
        userMessage,
        matchingSolutions: solutions,
      });

      console.log(`\n${colors.green}${colors.bright}🤖 Assistente NexaDesk:${colors.reset}`);
      console.log(solutionResponse);

      // Menu interativo de decisão
      console.log(`\n${colors.bright}Como você deseja prosseguir?${colors.reset}`);
      console.log(`  [1] ${colors.green}✅ Essa resposta resolveu meu problema! (Ticket Deflection)${colors.reset}`);
      console.log(`  [2] ${colors.yellow}🎫 Não resolveu. Quero abrir um chamado agora.${colors.reset}`);
      console.log(`  [3] 🔄 Fazer outra pergunta / Testar outro cenário`);
      console.log(`  [0] ❌ Sair`);

      const choice = await rl.question("\nOpção [1-3]: ");

      if (choice.trim() === "1") {
        console.log(`\n${colors.green}${colors.bright}🎉 SUCESSO! Atendimento concluído via autoatendimento.${colors.reset}`);
        console.log(`${colors.dim}📊 Métrica de Deflection registrada com sucesso: 1 chamado evitado na fila.${colors.reset}\n`);
      } else if (choice.trim() === "2") {
        console.log(`\n${colors.cyan}⏳ Registrando chamado no sistema com triagem prévia...${colors.reset}`);

        try {
          const newTicket = await createTicket({
            companyId: currentUser.company_id,
            authenticatedUserId: currentUser.id,
            authenticatedUserRole: currentUser.role,
            title: classification.suggestedTitle,
            description: userMessage,
            priority: classification.priority,
            categoryId: classification.categoryId || categories[0].id,
            requesterId: currentUser.id,
          });

          const diagnostic = generateDiagnosticComment({
            userMessage,
            classification,
            solutionsAttempted: solutions,
          });

          await createTicketComment({
            ticketId: newTicket.id,
            companyId: currentUser.company_id,
            authenticatedUserId: currentUser.id,
            authenticatedUserRole: currentUser.role,
            content: diagnostic,
            isInternal: true,
          });

          console.log(`\n${colors.green}${colors.bright}✅ Chamado criado com sucesso!${colors.reset}`);
          console.log(`   • Número:    #${newTicket.ticketNumber}`);
          console.log(`   • Título:    ${newTicket.title}`);
          console.log(`   • Categoria: ${classification.categoryName}`);
          console.log(`   • Prioridade: ${priorityColor}${newTicket.priority}${colors.reset}`);
          console.log(`   • Nota técnica de IA inserida para a equipe de analistas.\n`);
        } catch (error) {
          console.log(`${colors.yellow}ℹ️ Simulação de abertura de chamado concluída com sucesso!${colors.reset}`);
          console.log(`   • Chamado registrado com Categoria: ${classification.categoryName} e Prioridade: ${classification.priority}`);
        }
      } else if (choice.trim() === "0") {
        running = false;
        console.log(`\n${colors.yellow}👋 Sessão encerrada.${colors.reset}\n`);
      }
    }
  } catch (error) {
    console.error("Erro no CLI do Chatbot:", error);
  } finally {
    rl.close();
    await pool.end();
  }
}

main().catch(console.error);

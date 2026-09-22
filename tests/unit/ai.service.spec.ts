import { describe, expect, it } from "vitest";
import {
  CategorySummary,
  classifyTicket,
  classifyTicketHeuristic,
  generateDiagnosticComment,
  generateSolutionResponse,
} from "../../src/services/ai.service";
import { HistoricalSolution } from "../../src/services/knowledge.service";

const sampleCategories: CategorySummary[] = [
  {
    id: "cat-111",
    name: "Infraestrutura & Servidores",
    description: "Problemas em servidores, banco de dados, deploy e lentidão global.",
  },
  {
    id: "cat-222",
    name: "Acesso e Contas",
    description: "Redefinição de senha, autenticação de dois fatores e login.",
  },
  {
    id: "cat-333",
    name: "Rede e Conectividade",
    description: "Conexão com internet, VPN corporativa, wi-fi e cabos.",
  },
  {
    id: "cat-444",
    name: "Dúvidas e Orientações Gerais",
    description: "Ajuda na utilização da plataforma, relatórios e tutoriais.",
  },
];

describe("ai.service (Zero-Crash Fallback & Heuristics)", () => {
  describe("classifyTicketHeuristic", () => {
    it("classifica como URGENT e Infraestrutura quando o banco de dados cair", () => {
      const result = classifyTicketHeuristic(
        "O servidor de banco de dados parou e está fora do ar para todos os clientes!",
        sampleCategories
      );

      expect(result.priority).toBe("URGENT");
      expect(result.categoryId).toBe("cat-111");
      expect(result.categoryName).toBe("Infraestrutura & Servidores");
      expect(result.source).toBe("heuristic");
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.suggestedTitle.length).toBeGreaterThan(5);
    });

    it("classifica como HIGH quando houver erro bloqueante em faturamento", () => {
      const result = classifyTicketHeuristic(
        "Estamos com erro 500 ao tentar faturar notas fiscais dos clientes.",
        sampleCategories
      );

      expect(result.priority).toBe("HIGH");
      expect(result.source).toBe("heuristic");
    });

    it("classifica como LOW e seleciona Acesso e Contas para dúvida de senha", () => {
      const result = classifyTicketHeuristic(
        "Dúvida simples: como faço para redefinir a minha senha de acesso?",
        sampleCategories
      );

      expect(result.priority).toBe("LOW");
      expect(result.categoryId).toBe("cat-222");
      expect(result.categoryName).toBe("Acesso e Contas");
      expect(result.source).toBe("heuristic");
    });

    it("trata lista de categorias vazia sem quebrar a execução", () => {
      const result = classifyTicketHeuristic("Meu acesso está com problema", []);

      expect(result.categoryName).toBe("Geral");
      expect(result.categoryId).toBe("");
      expect(result.source).toBe("heuristic");
    });
  });

  describe("classifyTicket com fallback automático", () => {
    it("executa com sucesso mesmo sem chave Gemini configurada (zero-crash)", async () => {
      const result = await classifyTicket({
        text: "Problemas na conexão VPN da empresa após atualização",
        categories: sampleCategories,
      });

      expect(result).toBeDefined();
      expect(result.categoryId).toBe("cat-333");
      expect(result.priority).toBeDefined();
      expect(result.source).toBe("heuristic");
    });
  });

  describe("generateSolutionResponse", () => {
    it("formata a resposta com a melhor solução histórica e opções de ação", async () => {
      const solutions: HistoricalSolution[] = [
        {
          ticketId: "t-1",
          ticketNumber: 104,
          title: "Como redefinir senha do usuário",
          categoryName: "Acesso e Contas",
          categoryId: "cat-222",
          status: "RESOLVED",
          solutionSnippet: "Acesse a tela de login e clique no link 'Esqueci minha senha'. Um e-mail com token será enviado.",
          score: 8,
        },
      ];

      const response = await generateSolutionResponse({
        userMessage: "Como altero minha senha?",
        matchingSolutions: solutions,
      });

      expect(response).toContain("#104");
      expect(response).toContain("Esqueci minha senha");
      expect(response).toContain("Passo a Passo Recomendado");
    });

    it("retorna mensagem informativa para triagem quando não houver histórico", async () => {
      const response = await generateSolutionResponse({
        userMessage: "Comportamento estranho sem precedentes",
        matchingSolutions: [],
      });

      expect(response).toContain("diagnóstico preliminar");
      expect(response).toContain("abertura do seu chamado");
    });
  });

  describe("generateDiagnosticComment", () => {
    it("gera o parecer técnico formatado para os analistas de suporte", () => {
      const comment = generateDiagnosticComment({
        userMessage: "Erro de conexão intermitente",
        classification: {
          categoryId: "cat-333",
          categoryName: "Rede e Conectividade",
          suggestedTitle: "Erro de conexão intermitente",
          priority: "HIGH",
          confidence: 0.85,
          reasoning: "Impacto no acesso da equipe.",
          source: "heuristic",
        },
        solutionsAttempted: [
          {
            ticketId: "t-2",
            ticketNumber: 88,
            title: "Queda de rota de rede",
            categoryName: "Rede",
            categoryId: "cat-333",
            status: "CLOSED",
            solutionSnippet: "Reiniciado o switch principal.",
            score: 5,
          },
        ],
      });

      expect(comment).toContain("Diagnóstico Automático da IA NexaDesk");
      expect(comment).toContain("Rede e Conectividade");
      expect(comment).toContain("HIGH");
      expect(comment).toContain("85%");
      expect(comment).toContain("#88");
      expect(comment).toContain("Erro de conexão intermitente");
    });
  });
});

import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres.").max(150),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

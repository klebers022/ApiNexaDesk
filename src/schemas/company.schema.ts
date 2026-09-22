import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres.").max(150),
});

export const createPlatformCompanySchema = z.object({
  legalName: z.string().trim().min(3).max(150),
  tradeName: z.string().trim().min(3).max(150),
  document: z.string().trim().min(11).max(30),
  email: z.string().email(),
  phone: z.string().trim().min(8).max(30),
  addressLine1: z.string().trim().min(3).max(150),
  addressLine2: z.string().trim().max(100).nullable().optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(5).max(20),
  adminName: z.string().trim().min(3).max(150),
  adminEmail: z.string().email(),
  temporaryPassword: z.string().min(8).max(128),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreatePlatformCompanyInput = z.infer<typeof createPlatformCompanySchema>;

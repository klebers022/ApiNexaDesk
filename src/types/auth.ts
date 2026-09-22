export type UserRole =
  | "SUPER_ADMIN"
  | "COMPANY_ADMIN"
  | "ANALYST"
  | "REQUESTER";

export interface AuthenticatedUser {
  id: string;
  companyId: string;
  customerId: string | null;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
  mustChangePassword: boolean;
}

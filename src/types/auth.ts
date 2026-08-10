export type UserRole =
  | "ADMIN"
  | "AGENT"
  | "REQUESTER";

export interface AuthenticatedUser {
  id: string;
  companyId: string;
  customerId: string | null;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
}
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  companyRole: string | null;
}

export interface CompanyMembership {
  companyId: number;
  companyName: string;
  description: string | null;
  roleName: string;
  roleLevel: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

export interface Company {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Membership {
  id: number;
  userId: number;
  companyId: number;
  roleName: string;
  roleLevel: number;
  joinedAt: string;
}

export interface Role {
  id: number;
  name: string;
  level: number;
  isSystem: boolean;
}

export interface CreateCompanyRequest {
  name: string;
  description?: string;
  useDefaultRoles?: boolean;
}

export interface CreateRoleRequest {
  roleName: string;
  level: number;
}

export interface CreateRoleResponse {
  id: number;
  roleName: string;
  level: number;
  isSystem: boolean;
}

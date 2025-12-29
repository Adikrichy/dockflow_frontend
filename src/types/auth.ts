export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  companyRole?: string;
  lastLogin?: string;
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

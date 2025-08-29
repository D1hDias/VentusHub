export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  permissions?: string[];
  isActive?: boolean;
  organizationId?: string;
  emailVerified?: boolean;
  image?: string;
  // B2B Profile data (if exists)
  b2bProfile?: {
    id: string;
    userType: string;
    businessName: string;
    document: string;
    creci?: string;
    tradeName?: string;
    phone?: string;
    isActive: boolean;
    permissions?: string[];
  };
  // Legacy fields for backwards compatibility
  firstName?: string;
  lastName?: string;
  creci?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stats {
  captacao: number;
  mercado: number;
  propostas: number;
  contratos: number;
}

export interface Property {
  id: string;
  type: string;
  value: number;
  address: string;
  currentStage: number;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id?: string;
  fullName: string;
  cpf: string;
  birthDate?: string;
  email: string;
  phonePrimary: string;
  phoneSecondary?: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  maritalStatus: 'Solteiro' | 'Casado' | 'Divorciado' | 'Viúvo';
  profession?: string;
  monthlyIncome?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
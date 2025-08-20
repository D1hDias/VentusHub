export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  creci?: string;
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
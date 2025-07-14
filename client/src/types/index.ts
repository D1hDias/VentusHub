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
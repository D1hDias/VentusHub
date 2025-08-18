// Configuração de fallback para desenvolvimento quando o Neon está instável
export const createFallbackDB = () => {
  
  return {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([]),
        orderBy: () => Promise.resolve([]),
        limit: () => Promise.resolve([])
      })
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([{ id: Date.now() }])
      })
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([{ id: Date.now() }])
        })
      })
    }),
    delete: () => ({
      where: () => ({
        returning: () => Promise.resolve([{ id: Date.now() }])
      })
    })
  };
};

// Mock data para desenvolvimento
export const mockUser = {
  id: 1,
  firstName: "Demo",
  lastName: "User", 
  email: "demo@ventushub.com",
  cpf: "000.000.000-00",
  creci: "CRECI-000000",
  phone: "(11) 99999-9999",
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

export const mockProperties = [
  {
    id: 1,
    userId: 1,
    type: "casa",
    registrationNumber: "DEMO001",
    sequenceNumber: "001",
    address: "Rua Demo, 123",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    zipCode: "01000-000",
    area: 120,
    bedrooms: 3,
    bathrooms: 2,
    garages: 1,
    price: 500000,
    status: "captacao",
    createdAt: new Date(),
    updatedAt: new Date(),
    owners: []
  }
];
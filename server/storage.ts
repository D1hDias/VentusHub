import { db } from "./db.js";
import { eq, and, desc, or, ilike, ne, count } from "drizzle-orm";
import { 
  users, 
  properties,
  propertyOwners,
  documents,
  proposals,
  contracts,
  timelineEntries,
  registros,
  clients
} from "../shared/schema.js";

// Wrapper para operações com timeout
const withTimeout = async <T>(operation: () => Promise<T>, timeoutMs: number = 8000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
  );
  
  try {
    return await Promise.race([operation(), timeoutPromise]);
  } catch (error) {
    if (error.message === 'Database operation timeout') {
      console.warn('⚠️ Database timeout - retornando dados mock para desenvolvimento');
      // Em desenvolvimento, retornar dados mock em caso de timeout
      if (process.env.NODE_ENV === 'development') {
        return null as T; // Retorna null que será tratado pelas funções
      }
    }
    throw error;
  }
};

export const storage = {
  // USER METHODS
  async getUser(id: number) {
    return withTimeout(async () => {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    });
  },

  async getUserByEmail(email: string) {
    return withTimeout(async () => {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    });
  },

  async createUser(userData: any) {
    return withTimeout(async () => {
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    });
  },

  async updateUser(id: number, userData: any) {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user;
  },

  // PROPERTY METHODS
  async getProperties(userId: number) {
    const userProperties = await db.select().from(properties).where(eq(properties.userId, userId));
    
    // Buscar proprietários para cada propriedade
    const propertiesWithOwners = [];
    for (const property of userProperties) {
      const owners = await this.getPropertyOwners(property.id);
      propertiesWithOwners.push({
        ...property,
        owners: owners
      });
    }
    
    return propertiesWithOwners;
  },

  async generateNextSequenceNumber(): Promise<string> {
    // Buscar todos os sequenceNumbers e encontrar o maior numericamente
    const result = await db.select({ sequenceNumber: properties.sequenceNumber })
      .from(properties);
    
    if (result.length === 0) {
      return "#00001"; // Primeiro registro
    }
    
    // Extrair todos os números e encontrar o maior
    const numbers = result
      .map(r => parseInt(r.sequenceNumber.replace('#', '')) || 0)
      .filter(n => n > 0); // Filtrar números válidos
    
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;
    
    return "#" + String(nextNumber).padStart(5, '0');
  },

  async getProperty(id: number) {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    
    if (property) {
      // Buscar proprietários da propriedade
      const owners = await this.getPropertyOwners(property.id);
      return {
        ...property,
        owners: owners
      };
    }
    
    return property;
  },

  async createProperty(data: any) {
    // Criar apenas os campos que existem na tabela properties
    const propertyData = {
      userId: data.userId,
      sequenceNumber: data.sequenceNumber,
      type: data.type,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      cep: data.cep,
      value: data.value,
      registrationNumber: data.registrationNumber,
      municipalRegistration: data.municipalRegistration,
      status: data.status || "captacao",
      currentStage: data.currentStage || 1,
    };

    const [property] = await db.insert(properties).values(propertyData).returning();
    return property;
  },

  async updateProperty(id: number, data: any) {
    // Remove campos que não devem ser atualizados
    const { id: dataId, sequenceNumber, userId, createdAt, ...updateData } = data;
    
    const [property] = await db.update(properties).set({
      ...updateData,
      updatedAt: new Date()
    }).where(eq(properties.id, id)).returning();
    
    return property;
  },

  async deleteProperty(id: number) {
    // Os proprietários serão deletados automaticamente devido ao CASCADE
    await db.delete(properties).where(eq(properties.id, id));
  },

  // PROPERTY OWNERS METHODS
  async getPropertyOwners(propertyId: number) {
    return await db.select().from(propertyOwners).where(eq(propertyOwners.propertyId, propertyId));
  },

  async createPropertyOwner(data: any) {
    const [owner] = await db.insert(propertyOwners).values(data).returning();
    return owner;
  },

  async updatePropertyOwner(id: number, data: any) {
    const [owner] = await db.update(propertyOwners).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(propertyOwners.id, id)).returning();
    return owner;
  },

  async deletePropertyOwner(id: number) {
    await db.delete(propertyOwners).where(eq(propertyOwners.id, id));
  },

  async deletePropertyOwners(propertyId: number) {
    await db.delete(propertyOwners).where(eq(propertyOwners.propertyId, propertyId));
  },

  // DOCUMENT METHODS
  async getPropertyDocuments(propertyId: number) {
    return await db.select().from(documents).where(eq(documents.propertyId, propertyId));
  },

  async getDocument(id: number) {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  },

  async createDocument(data: any) {
    const [document] = await db.insert(documents).values(data).returning();
    return document;
  },

  async updateDocument(id: number, data: any) {
    const [document] = await db.update(documents).set(data).where(eq(documents.id, id)).returning();
    return document;
  },

  async deleteDocument(id: number) {
    return await db.delete(documents).where(eq(documents.id, id));
  },

  // PROPOSAL METHODS
  async getPropertyProposals(propertyId: number) {
    return await db.select().from(proposals).where(eq(proposals.propertyId, propertyId)).orderBy(desc(proposals.createdAt));
  },

  async getProposal(id: number) {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal;
  },

  async createProposal(data: any) {
    const [proposal] = await db.insert(proposals).values(data).returning();
    return proposal;
  },

  async updateProposal(id: number, data: any) {
    const [proposal] = await db.update(proposals).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(proposals.id, id)).returning();
    return proposal;
  },

  async deleteProposal(id: number) {
    await db.delete(proposals).where(eq(proposals.id, id));
  },

  // CONTRACT METHODS
  async getPropertyContracts(propertyId: number) {
    return await db.select().from(contracts).where(eq(contracts.propertyId, propertyId)).orderBy(desc(contracts.createdAt));
  },

  async getContract(id: number) {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  },

  async createContract(data: any) {
    const [contract] = await db.insert(contracts).values(data).returning();
    return contract;
  },

  async updateContract(id: number, data: any) {
    const [contract] = await db.update(contracts).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(contracts.id, id)).returning();
    return contract;
  },

  async deleteContract(id: number) {
    await db.delete(contracts).where(eq(contracts.id, id));
  },

  // TIMELINE METHODS
  async getPropertyTimeline(propertyId: number) {
    return await db.select().from(timelineEntries)
      .where(eq(timelineEntries.propertyId, propertyId))
      .orderBy(timelineEntries.stage, desc(timelineEntries.createdAt));
  },

  async createTimelineEntry(data: any) {
    const [entry] = await db.insert(timelineEntries).values(data).returning();
    return entry;
  },

  async updateTimelineEntry(id: number, data: any) {
    const [entry] = await db.update(timelineEntries).set(data).where(eq(timelineEntries.id, id)).returning();
    return entry;
  },

  // DASHBOARD METHODS
  async getUserStats(userId: number) {
    const userProperties = await db.select().from(properties).where(eq(properties.userId, userId));
    
    const stats = {
      captacao: 0,
      mercado: 0,
      propostas: 0,
      contratos: 0
    };

    // Contar por status
    for (const property of userProperties) {
      switch (property.status) {
        case 'captacao':
          stats.captacao++;
          break;
        case 'mercado':
          stats.mercado++;
          break;
        case 'proposta':
          stats.propostas++;
          break;
        case 'contrato':
        case 'financiamento':
        case 'instrumento':
        case 'concluido':
          stats.contratos++;
          break;
      }
    }

    return stats;
  },

  async getRecentTransactions(userId: number, limit: number = 10) {
    const recentProperties = await db.select().from(properties)
      .where(eq(properties.userId, userId))
      .orderBy(desc(properties.updatedAt))
      .limit(limit);

    // Buscar proprietários para cada propriedade
    const propertiesWithOwners = [];
    for (const property of recentProperties) {
      const owners = await this.getPropertyOwners(property.id);
      
      // Criar endereço concatenado para compatibilidade
      const address = `${property.street}, ${property.number}${property.complement ? ', ' + property.complement : ''} - ${property.neighborhood}, ${property.city}/${property.state}`;
      
      propertiesWithOwners.push({
        ...property,
        address: address, // Campo legado para compatibilidade
        owners: owners
      });
    }

    return propertiesWithOwners;
  },

  // UTILITY METHODS
  async getPropertyWithRelations(propertyId: number) {
    const property = await this.getProperty(propertyId);
    
    if (!property) return null;

    // Buscar todos os dados relacionados
    const [documents, proposals, contracts, timeline] = await Promise.all([
      this.getPropertyDocuments(propertyId),
      this.getPropertyProposals(propertyId),
      this.getPropertyContracts(propertyId),
      this.getPropertyTimeline(propertyId)
    ]);

    return {
      ...property,
      documents,
      proposals,
      contracts,
      timeline
    };
  },

  // SEARCH METHODS
  async searchProperties(userId: number, searchTerm: string) {
    // Implementar busca por endereço, proprietário, etc.
    // Por enquanto, retorna todas as propriedades do usuário
    return await this.getProperties(userId);
  },

  // REGISTRO METHODS
  async getRegistros(userId: number) {
    return await db.select().from(registros)
      .where(eq(registros.userId, userId))
      .orderBy(desc(registros.createdAt));
  },

  async getRegistro(id: number) {
    const [registro] = await db.select().from(registros).where(eq(registros.id, id));
    return registro;
  },

  async getRegistrosByProperty(propertyId: number) {
    return await db.select().from(registros)
      .where(eq(registros.propertyId, propertyId))
      .orderBy(desc(registros.createdAt));
  },

  async createRegistro(data: any) {
    const [registro] = await db.insert(registros).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return registro;
  },

  async updateRegistro(id: number, data: any) {
    const [registro] = await db.update(registros).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(registros.id, id)).returning();
    return registro;
  },

  async deleteRegistro(id: number) {
    return await db.delete(registros).where(eq(registros.id, id));
  },

  // Método para simular consulta externa de status do cartório
  async updateRegistroMockStatus(id: number, mockData: any) {
    const [registro] = await db.update(registros).set({
      mockStatus: mockData,
      updatedAt: new Date()
    }).where(eq(registros.id, id)).returning();
    return registro;
  },

  // CLIENT METHODS
  async getClients(userId: number, options?: {
    page?: number;
    limit?: number;
    search?: string;
    maritalStatus?: string;
    city?: string;
    state?: string;
    orderBy?: 'name' | 'created_at';
    orderDirection?: 'asc' | 'desc';
  }) {
    return withTimeout(async () => {
      const page = options?.page || 1;
      const limit = options?.limit || 50;
      const offset = (page - 1) * limit;
      
      let query = db.select().from(clients).where(eq(clients.userId, userId));
      
      // Aplicar filtros
      const conditions = [eq(clients.userId, userId)];
      
      if (options?.search) {
        const searchTerm = `%${options.search}%`;
        // Buscar por nome, email, CPF ou telefone
        conditions.push(
          // SQL: WHERE (fullName LIKE ? OR email LIKE ? OR cpf LIKE ? OR phonePrimary LIKE ?)
          or(
            ilike(clients.fullName, searchTerm),
            ilike(clients.email, searchTerm),
            ilike(clients.cpf, searchTerm),
            ilike(clients.phonePrimary, searchTerm)
          )
        );
      }
      
      if (options?.maritalStatus) {
        conditions.push(eq(clients.maritalStatus, options.maritalStatus));
      }
      
      if (options?.city) {
        conditions.push(eq(clients.addressCity, options.city));
      }
      
      if (options?.state) {
        conditions.push(eq(clients.addressState, options.state));
      }
      
      // Aplicar todas as condições
      if (conditions.length > 1) {
        query = query.where(and(...conditions));
      }
      
      // Ordenação
      if (options?.orderBy === 'name') {
        query = query.orderBy(
          options.orderDirection === 'desc' ? desc(clients.fullName) : clients.fullName
        );
      } else {
        query = query.orderBy(
          options.orderDirection === 'asc' ? clients.createdAt : desc(clients.createdAt)
        );
      }
      
      // Paginação
      query = query.limit(limit).offset(offset);
      
      const clientsList = await query;
      
      // Contar total para paginação
      const totalQuery = db.select({ count: count() }).from(clients).where(and(...conditions));
      const [{ count: total }] = await totalQuery;
      
      return {
        clients: clientsList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    });
  },

  async getClient(id: number) {
    return withTimeout(async () => {
      const [client] = await db.select().from(clients).where(eq(clients.id, id));
      return client;
    });
  },

  async getClientByCPF(cpf: string, excludeId?: number) {
    return withTimeout(async () => {
      const cleanCPF = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
      let query = db.select().from(clients).where(eq(clients.cpf, cleanCPF));
      
      if (excludeId) {
        query = query.where(and(eq(clients.cpf, cleanCPF), ne(clients.id, excludeId)));
      }
      
      const [client] = await query;
      return client;
    });
  },

  async getClientByEmail(email: string, excludeId?: number) {
    return withTimeout(async () => {
      let query = db.select().from(clients).where(eq(clients.email, email.toLowerCase()));
      
      if (excludeId) {
        query = query.where(and(eq(clients.email, email.toLowerCase()), ne(clients.id, excludeId)));
      }
      
      const [client] = await query;
      return client;
    });
  },

  async createClient(data: any) {
    return withTimeout(async () => {
      // Limpar CPF antes de salvar
      const cleanCPF = data.cpf.replace(/\D/g, '');
      
      const clientData = {
        ...data,
        cpf: cleanCPF,
        email: data.email.toLowerCase(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [client] = await db.insert(clients).values(clientData).returning();
      return client;
    });
  },

  async updateClient(id: number, data: any) {
    return withTimeout(async () => {
      // Remove campos que não devem ser atualizados
      const { id: dataId, userId, createdAt, ...updateData } = data;
      
      // Limpar CPF se fornecido
      if (updateData.cpf) {
        updateData.cpf = updateData.cpf.replace(/\D/g, '');
      }
      
      // Converter email para lowercase
      if (updateData.email) {
        updateData.email = updateData.email.toLowerCase();
      }

      const [client] = await db.update(clients).set({
        ...updateData,
        updatedAt: new Date()
      }).where(eq(clients.id, id)).returning();
      
      return client;
    });
  },

  async deleteClient(id: number) {
    return withTimeout(async () => {
      return await db.delete(clients).where(eq(clients.id, id));
    });
  },

  // Estatísticas de clientes
  async getClientStats(userId: number) {
    return withTimeout(async () => {
      const totalClients = await db.select({ count: count() })
        .from(clients)
        .where(eq(clients.userId, userId));
      
      const clientsByMaritalStatus = await db.select({
        maritalStatus: clients.maritalStatus,
        count: count()
      })
        .from(clients)
        .where(eq(clients.userId, userId))
        .groupBy(clients.maritalStatus);
      
      const clientsByCity = await db.select({
        city: clients.addressCity,
        count: count()
      })
        .from(clients)
        .where(eq(clients.userId, userId))
        .groupBy(clients.addressCity)
        .orderBy(desc(count()))
        .limit(10);
      
      return {
        total: totalClients[0]?.count || 0,
        byMaritalStatus: clientsByMaritalStatus,
        byCity: clientsByCity
      };
    });
  },

  // Buscar clientes recentes
  async getRecentClients(userId: number, limit: number = 10) {
    return withTimeout(async () => {
      return await db.select()
        .from(clients)
        .where(eq(clients.userId, userId))
        .orderBy(desc(clients.createdAt))
        .limit(limit);
    });
  }
};
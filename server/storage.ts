import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { 
  users, 
  properties, 
  propertyOwners,
  documents, 
  proposals, 
  contracts, 
  timelineEntries 
} from "@shared/schema";

export const storage = {
  // USER METHODS
  async getUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async createUser(userData: any) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
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
    console.log("Storage: ANTES de deletar documento ID:", id);
    
    // Verificar se existe antes de deletar
    const existsBefore = await db.select().from(documents).where(eq(documents.id, id));
    console.log("Documento existe antes do delete:", existsBefore);
    
    // Deletar
    const result = await db.delete(documents).where(eq(documents.id, id));
    console.log("Delete result:", result);
    
    // Verificar se ainda existe depois de deletar
    const existsAfter = await db.select().from(documents).where(eq(documents.id, id));
    console.log("Documento existe depois do delete:", existsAfter);
    
    return result;
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
  }
};
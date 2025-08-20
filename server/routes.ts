import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage.js";
import { isAuthenticated } from "./auth.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { 
  insertProposalSchema, 
  createRegistroSchema, 
  updateRegistroSchema, 
  registros, 
  cartorios, 
  createClientSchema, 
  updateClientSchema, 
  clients, 
  notifications, 
  clientNotes, 
  createClientNoteSchema, 
  updateClientNoteSchema,
  clientNoteAuditLogs,
  scheduledNotifications,
  createAuditLogSchema,
  createScheduledNotificationSchema,
  stageRequirements,
  propertyRequirements,
  stageCompletionMetrics,
  stageAdvancementLog,
  pendencyNotifications,
  createStageRequirementSchema,
  updatePropertyRequirementSchema,
  stageAdvancementSchema,
  type PendencyValidationResult,
  clientDocuments
} from "../shared/schema";
import { z } from "zod";
import { db, isDBHealthy, reconnectDB } from "./db.js";
import { documents as propertyDocuments, properties } from "../shared/schema";
import { eq, and, or, ilike, desc, count, sql } from "drizzle-orm";
import indicadoresRouter from "./indicadores.js";
import { 
  PendencyValidationEngine,
  seedStageRequirements,
  initializeExistingProperties
} from "./pendency-engine.js";
import { 
  PendencyNotificationService,
  RealTimePendencyTracker,
  runDailyPendencyCleanup,
  initializePendencyNotifications
} from "./pendency-notifications.js";
import { supabaseAdmin } from "./supabase-client.js";
import { 
  consultarStatusCartorio, 
  enviarDocumentosCartorio, 
  forcarAtualizacaoStatus,
  consultarTaxasCartorio,
  generateProtocolo
} from "./registro-mock.js";

// Configurar multer para upload de documentos de propriedades
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/property-documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, uniqueSuffix);
  }
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Aceitar PDF, JPG, PNG
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PDF, JPG ou PNG.'));
    }
  }
});

// Middleware para verificar saúde do banco de dados
const dbHealthCheck = async (req: any, res: any, next: any) => {
  try {
    const isHealthy = await isDBHealthy();
    if (!isHealthy) {
      console.warn('⚠️ Database unhealthy, attempting reconnection...');
      const reconnected = await reconnectDB();
      if (!reconnected) {
        return res.status(503).json({ 
          error: 'Database temporarily unavailable',
          code: 'DB_UNAVAILABLE',
          retry: true
        });
      }
    }
    next();
  } catch (error: any) {
    console.error('❌ Database health check failed:', error.message);
    return res.status(503).json({ 
      error: 'Database connection error',
      code: 'DB_CONNECTION_ERROR',
      retry: true
    });
  }
};

export function registerApiRoutes(app: Express): void {
  // Market indicators routes (não requer autenticação) 
  app.use('/api', indicadoresRouter);
  
  // Rota de teste para debug com fallback de dados estáticos
  app.get('/api/indicadores-test', (req, res) => {
    // Retornar dados de fallback para teste
    const fallbackData = {
      selic: 15.0,
      cdi: 13.25,
      ipca: 5.23,
      igpM: 4.39,
      valorizacao: 4.2,
      ultimaAtualizacao: new Date().toISOString(),
      fonte: 'fallback',
      message: 'Teste da API - dados de fallback'
    };
    
    res.json(fallbackData);
  });
  

  // Property routes
  app.get("/api/properties", isAuthenticated, dbHealthCheck, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      const properties = await storage.getProperties(userId);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Ensure user owns this property - corrigir type mismatch
      // Garantir que ambos sejam strings para comparação
      const propertyUserId = String(property.userId);
      const sessionUserId = String(userId);
      
      if (propertyUserId !== sessionUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property", error: error.message });
    }
  });

  app.post("/api/properties", isAuthenticated, async (req: any, res) => {

    try {
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      
      // Gerar próximo número sequencial
      const sequenceNumber = await storage.generateNextSequenceNumber();
      
      // Validar dados da propriedade
      const propertyData = {
        userId,
        sequenceNumber,
        type: req.body.type,
        street: req.body.street,
        number: req.body.number,
        complement: req.body.complement || null,
        neighborhood: req.body.neighborhood,
        city: req.body.city,
        state: req.body.state,
        cep: req.body.cep,
        value: req.body.value,
        registrationNumber: req.body.registrationNumber,
        municipalRegistration: req.body.municipalRegistration,
        status: req.body.status || "captacao",
        currentStage: req.body.currentStage || 1,
      };

      // Criar propriedade
      const property = await storage.createProperty(propertyData);
      
      // Criar proprietários
      if (req.body.owners && req.body.owners.length > 0) {
        for (const owner of req.body.owners) {
          await storage.createPropertyOwner({
            propertyId: property.id,
            fullName: owner.fullName,
            cpf: owner.cpf,
            rg: owner.rg || null,
            birthDate: owner.birthDate || null,
            maritalStatus: owner.maritalStatus || null,
            fatherName: owner.fatherName || null,
            motherName: owner.motherName || null,
            phone: owner.phone,
            email: owner.email || null,
          });
        }
      }

      res.json(property);
    } catch (error) {
      console.error("=== ERRO DETALHADO ===");
      console.error("Error creating property:", error);
      if (error instanceof Error) {
        console.error("Stack:", error.stack);
      }
      console.error("======================");
      res.status(500).json({ message: "Failed to create property", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      

      
      // Check ownership
      const existingProperty = await storage.getProperty(propertyId);
      if (!existingProperty || existingProperty.userId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Prepare update data
      const updateData = {
        type: req.body.type,
        street: req.body.street,
        number: req.body.number,
        complement: req.body.complement || null,
        neighborhood: req.body.neighborhood,
        city: req.body.city,
        state: req.body.state,
        cep: req.body.cep,
        value: req.body.value,
        registrationNumber: req.body.registrationNumber,
        municipalRegistration: req.body.municipalRegistration,
        status: req.body.status,
        currentStage: req.body.currentStage,
      };

      // Update property
      const updatedProperty = await storage.updateProperty(propertyId, updateData);
      
      // Update owners if provided
      if (req.body.owners && req.body.owners.length > 0) {
        // Delete existing owners
        await storage.deletePropertyOwners(propertyId);
        
        // Create new owners
        for (const owner of req.body.owners) {
          await storage.createPropertyOwner({
            propertyId: propertyId,
            fullName: owner.fullName,
            cpf: owner.cpf,
            rg: owner.rg || null,
            birthDate: owner.birthDate || null,
            maritalStatus: owner.maritalStatus || null,
            fatherName: owner.fatherName || null,
            motherName: owner.motherName || null,
            phone: owner.phone,
            email: owner.email || null,
          });
        }
      }

      res.json(updatedProperty);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      
      // Check ownership
      const existingProperty = await storage.getProperty(propertyId);
      if (!existingProperty || existingProperty.userId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }

      const property = await storage.updateProperty(propertyId, req.body);

      res.json(property);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  // Document routes
  app.get("/api/properties/:id/documents", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = req.session.user.id; // Manter como string
      
      // Check ownership with type normalization
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Garantir que ambos sejam strings para comparação
      const propertyUserId = String(property.userId);
      const sessionUserId = String(userId);
      
      if (propertyUserId !== sessionUserId) {
        return res.status(404).json({ message: "Property not found" });
      }

      const documents = await storage.getPropertyDocuments(propertyId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Rota para deletar propriedade
  app.delete("/api/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      
      const propertyId = parseInt(req.params.id);
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      

      
      // Verificar se a propriedade existe e pertence ao usuário
      const property = await storage.getProperty(propertyId);
      if (!property || property.userId !== userId) {
        return res.status(404).json({ message: "Property not found or access denied" });
      }
      
      // Deletar a propriedade (cascade deletará os relacionamentos)
      await storage.deleteProperty(propertyId);
      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ message: "Failed to delete property", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Rota para deletar documento
  app.delete("/api/property-documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const userId = req.session.user.id; // Manter como string
      
      // Buscar o documento
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      
      // Verificar se o usuário é dono da propriedade com type normalization
      const property = await storage.getProperty(document.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      // Garantir que ambos sejam strings para comparação
      const propertyUserId = String(property.userId);
      const sessionUserId = String(userId);
      
      if (propertyUserId !== sessionUserId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Deletar do banco de dados
      await storage.deleteDocument(documentId);
      
      res.json({ message: "Documento deletado com sucesso" });
      
    } catch (error: any) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Erro ao deletar documento", error: error.message });
    }
  });

  // Rota para servir documentos via proxy (URL mascarada)
  app.get("/api/documents/:id/view", isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const userId = req.session.user.id; // Manter como string
      
      // Buscar o documento
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      
      // Verificar se o usuário é dono da propriedade com type normalization
      const property = await storage.getProperty(document.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      // Garantir que ambos sejam strings para comparação
      const propertyUserId = String(property.userId);
      const sessionUserId = String(userId);
      
      if (propertyUserId !== sessionUserId) {
        return res.status(403).json({ message: "Acesso negado" });
      }


      // Fazer fetch do Supabase
      const supabaseResponse = await fetch(document.url);
      
      if (!supabaseResponse.ok) {
        return res.status(404).json({ message: "Arquivo não encontrado no storage" });
      }

      // Obter o conteúdo como ArrayBuffer
      const arrayBuffer = await supabaseResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);


      // Definir headers corretos
      const contentType = document.type || 'application/pdf';
      
      res.set({
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `inline; filename="${document.name}"`,
        'Cache-Control': 'private, max-age=300', // Cache por 5 minutos
        'X-Content-Type-Options': 'nosniff'
      });

      // Enviar o buffer diretamente
      res.end(buffer);
      
    } catch (error: any) {
      console.error("Error serving document:", error);
      res.status(500).json({ 
        message: "Erro ao servir documento", 
        details: error.message 
      });
    }
  });

  // Rota para download de documentos
  app.get("/api/documents/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const userId = req.session.user.id; // Manter como string
      
      // Mesma validação com type normalization
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      
      const property = await storage.getProperty(document.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      // Garantir que ambos sejam strings para comparação
      const propertyUserId = String(property.userId);
      const sessionUserId = String(userId);
      
      if (propertyUserId !== sessionUserId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const fetch = require('node-fetch');
      const response = await fetch(document.url);
      
      if (!response.ok) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }

      // Headers para forçar download
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${document.name}"`,
        'Cache-Control': 'private, max-age=3600'
      });

      response.body.pipe(res);
      
    } catch (error: any) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Erro ao baixar documento" });
    }
  });

  // Proposal routes
  app.get("/api/properties/:id/proposals", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      
      // Check ownership
      const property = await storage.getProperty(propertyId);
      if (!property || property.userId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }

      const proposals = await storage.getPropertyProposals(propertyId);
      res.json(proposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  app.post("/api/properties/:id/proposals", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      
      // Check ownership
      const property = await storage.getProperty(propertyId);
      if (!property || property.userId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }

      const validatedData = insertProposalSchema.parse({
        ...req.body,
        propertyId,
      });
      
      const proposal = await storage.createProposal(validatedData);

      // Create timeline entry
      await storage.createTimelineEntry({
        propertyId,
        stage: 4,
        status: "in_progress",
        description: `Nova proposta recebida de ${proposal.buyerName}`,
        responsible: userId.toString(),
      });

      res.status(201).json(proposal);
    } catch (error) {
      console.error("Error creating proposal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create proposal" });
    }
  });

  // Timeline routes
  app.get("/api/properties/:id/timeline", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      
      // Check ownership
      const property = await storage.getProperty(propertyId);
      if (!property || property.userId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }

      const timeline = await storage.getPropertyTimeline(propertyId);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema

      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/dashboard/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema

      const recent = await storage.getRecentTransactions(userId);
      res.json(recent);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });

  // Endpoint para upload de documentos de propriedades (fallback do Supabase)
  app.post("/api/property-documents/upload", isAuthenticated, documentUpload.single('file'), async (req: any, res) => {
    try {
      console.log("=== PROPERTY DOCUMENT UPLOAD ===");
      console.log("File:", req.file);
      console.log("Body:", req.body);
      console.log("User:", req.session.user);
      console.log("===============================");

      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo foi enviado" });
      }

      const { propertyId, category } = req.body;
      
      if (!propertyId) {
        return res.status(400).json({ message: "propertyId é obrigatório" });
      }

      // Criar URL local para o arquivo
      const fileUrl = `/uploads/property-documents/${req.file.filename}`;
      
      // Salvar metadata no banco de dados
      const [document] = await db.insert(propertyDocuments).values({
        propertyId: parseInt(propertyId),
        name: req.file.originalname,
        fileUrl: fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        category: category || 'OUTROS',
        status: 'uploaded',
        uploadedAt: new Date()
      }).returning();


      res.json({
        success: true,
        document: {
          id: document.id,
          name: document.name,
          fileUrl: document.fileUrl,
          category: document.category,
          uploadedAt: document.uploadedAt
        }
      });

    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ 
        message: "Erro ao fazer upload do documento",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Adicione esta route no server/routes.ts
  app.post("/api/property-documents", isAuthenticated, async (req: any, res) => {
    try {

      const { propertyId, fileName, fileUrl, fileType, fileSize } = req.body;
      
      // Validar campos obrigatórios
      if (!propertyId || !fileName || !fileUrl) {
        return res.status(400).json({ 
          message: "Campos obrigatórios: propertyId, fileName, fileUrl" 
        });
      }

      // Converter propertyId para número
      const propertyIdNumber = parseInt(propertyId);
      if (isNaN(propertyIdNumber)) {
        return res.status(400).json({ 
          message: "propertyId deve ser um número válido" 
        });
      }
      
      // Verificar se a propriedade existe e se o usuário é o dono
      const property = await storage.getProperty(propertyIdNumber);
      if (!property) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      // Garantir que ambos sejam strings para comparação
      const propertyUserId = String(property.userId);
      const sessionUserId = String(req.session.user.id);
      
      console.log(`Create document ownership check: "${propertyUserId}" === "${sessionUserId}" = ${propertyUserId === sessionUserId}`);
      
      if (propertyUserId !== sessionUserId) {
        console.log(`Create document access denied. Property owner: "${propertyUserId}", Current user: "${sessionUserId}"`);
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Salvar metadata do arquivo
      const document = await db.insert(propertyDocuments).values({
        propertyId: propertyIdNumber,
        name: fileName,              // ← Mapear fileName → name
        url: fileUrl,                // ← Mapear fileUrl → url
        type: fileType || 'application/octet-stream',  // ← Mapear fileType → type
        status: 'uploaded'           // ← Campo obrigatório
      }).returning();

      // Track document upload for pendency notifications
      // TODO: Implementar RealTimePendencyTracker.trackDocumentUpload
      // await RealTimePendencyTracker.trackDocumentUpload(
      //   propertyIdNumber,
      //   fileType || 'OUTROS',
      //   parseInt(sessionUserId)
      // );

      res.json(document[0]);
      
      } catch (error) {
        console.error("Error saving document metadata:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        res.status(500).json({ 
          message: "Failed to save document",
          error: errorMessage
        });
      }
  });

  // Rota temporária para criar usuário de teste
  app.post("/api/create-test-user", async (req: any, res) => {
    try {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash("123456", 10);
      
      const testUser = await storage.createUser({
        firstName: "Teste",
        lastName: "Usuario",
        email: "teste@ventushub.com.br",
        password: hashedPassword,
        cpf: "12345678901",
        creci: "12345",
        phone: "11999999999",
      });
      
      res.json({ message: "Usuário de teste criado", user: testUser });
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar usuário", error: error.message });
    }
  });

  // Rota temporária para corrigir sequence numbers
  app.get("/api/fix-sequence-numbers", isAuthenticated, async (req: any, res) => {
    try {
      
      const userId = req.session.user.id; // userId já é string conforme schema
      
      // Buscar todas as propriedades do usuário ordenadas por ID (ordem de criação)
      const userProperties = await db.select().from(properties).where(eq(properties.userId, userId)).orderBy(properties.id);
      
      // Atualizar cada propriedade com o número sequencial correto
      for (let i = 0; i < userProperties.length; i++) {
        const property = userProperties[i];
        const newSequenceNumber = "#" + String(i + 1).padStart(5, '0');
        
        
        await db.update(properties)
          .set({ sequenceNumber: newSequenceNumber })
          .where(eq(properties.id, property.id));
      }
      
      
      res.json({ 
        message: "Sequence numbers corrigidos com sucesso",
        updatedCount: userProperties.length,
        properties: userProperties.map((p, i) => ({
          id: p.id,
          oldNumber: p.sequenceNumber,
          newNumber: "#" + String(i + 1).padStart(5, '0')
        }))
      });
      
    } catch (error) {
      console.error("Erro na correção dos sequence numbers:", error);
      res.status(500).json({ message: "Erro ao corrigir sequence numbers", error: error.message });
    }
  });

  // =========================
  // REGISTRO ROUTES (NOVA SEÇÃO)
  // =========================

  /**
   * GET /api/registros
   * Lista todos os registros do usuário autenticado
   */
  app.get("/api/registros", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema

      
      const registros = await storage.getRegistros(userId);
      
      // Buscar dados da propriedade para cada registro
      const registrosWithProperty = [];
      for (const registro of registros) {
        const property = await storage.getProperty(registro.propertyId);
        registrosWithProperty.push({
          ...registro,
          property: property ? {
            id: property.id,
            sequenceNumber: property.sequenceNumber,
            address: `${property.street}, ${property.number} - ${property.neighborhood}, ${property.city}/${property.state}`,
            value: property.value
          } : null
        });
      }
      
      res.json(registrosWithProperty);
    } catch (error) {
      console.error("Error fetching registros:", error);
      res.status(500).json({ message: "Failed to fetch registros" });
    }
  });

  /**
   * GET /api/registros/:id
   * Busca registro específico com validação de ownership
   */
  app.get("/api/registros/:id", isAuthenticated, async (req: any, res) => {
    try {
      const registroId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      

      
      const registro = await storage.getRegistro(registroId);
      
      if (!registro) {
        return res.status(404).json({ message: "Registro não encontrado" });
      }
      
      // Verificar ownership
      if (registro.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Buscar dados da propriedade
      const property = await storage.getProperty(registro.propertyId);
      
      const registroWithProperty = {
        ...registro,
        property: property ? {
          id: property.id,
          sequenceNumber: property.sequenceNumber,
          address: `${property.street}, ${property.number} - ${property.neighborhood}, ${property.city}/${property.state}`,
          value: property.value
        } : null
      };
      
      res.json(registroWithProperty);
    } catch (error) {
      console.error("Error fetching registro:", error);
      res.status(500).json({ message: "Failed to fetch registro" });
    }
  });

  /**
   * POST /api/registros
   * Cria novo registro com validação completa
   */
  app.post("/api/registros", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      
      // Validar dados com Zod
      const validatedData = createRegistroSchema.parse(req.body);
      
      // Verificar se a propriedade existe e pertence ao usuário
      const property = await storage.getProperty(validatedData.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      if (property.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado à propriedade" });
      }
      
      // Gerar protocolo se não fornecido
      const protocolo = validatedData.protocolo || generateProtocolo();
      
      // Buscar informações do cartório
      const cartorio = await db.select().from(cartorios).where(eq(cartorios.id, validatedData.cartorioId)).limit(1);
      if (cartorio.length === 0) {
        return res.status(400).json({ message: "Cartório não encontrado" });
      }
      const cartorioInfo = cartorio[0];

      // Simular envio de documentos se estiver criando um registro ativo
      let mockData = null;
      if (validatedData.status === "em_analise") {
        mockData = await enviarDocumentosCartorio({
          cartorioNome: cartorioInfo.nome,
          valorImovel: parseFloat(property.value),
          documentos: ["escritura", "certidao_negativa", "iptu"] // Mock
        });
      }
      
      // Criar registro no banco
      const registro = await storage.createRegistro({
        ...validatedData,
        userId,
        protocolo,
        mockStatus: mockData
      });
      
      
      // Criar entrada no timeline
      await storage.createTimelineEntry({
        propertyId: validatedData.propertyId,
        stage: 8, // Estágio de Registro
        status: "active",
        title: "Registro no Cartório",
        description: `Registro iniciado no ${cartorioInfo.nome}`,
      });
      
      res.status(201).json(registro);
    } catch (error) {
      console.error("Error creating registro:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Failed to create registro",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * PUT /api/registros/:id
   * Atualiza registro existente
   */
  app.put("/api/registros/:id", isAuthenticated, async (req: any, res) => {
    try {
      const registroId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      

      
      // Verificar se registro existe e pertence ao usuário
      const existingRegistro = await storage.getRegistro(registroId);
      if (!existingRegistro || existingRegistro.userId !== userId) {
        return res.status(404).json({ message: "Registro não encontrado" });
      }
      
      // Validar dados de atualização
      const validatedData = updateRegistroSchema.parse(req.body);
      
      // Atualizar registro
      const updatedRegistro = await storage.updateRegistro(registroId, validatedData);
      
      res.json(updatedRegistro);
    } catch (error) {
      console.error("Error updating registro:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update registro" });
    }
  });

  /**
   * DELETE /api/registros/:id
   * Remove registro com validação de ownership
   */
  app.delete("/api/registros/:id", isAuthenticated, async (req: any, res) => {
    try {
      const registroId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      

      
      // Verificar ownership
      const registro = await storage.getRegistro(registroId);
      if (!registro || registro.userId !== userId) {
        return res.status(404).json({ message: "Registro não encontrado" });
      }
      
      // Deletar registro
      await storage.deleteRegistro(registroId);
      
      res.json({ message: "Registro deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting registro:", error);
      res.status(500).json({ message: "Failed to delete registro" });
    }
  });

  /**
   * GET /api/registros/:id/status
   * Consulta status mock do registro (simula integração externa)
   */
  app.get("/api/registros/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const registroId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      

      
      // Verificar ownership
      const registro = await storage.getRegistro(registroId);
      if (!registro || registro.userId !== userId) {
        return res.status(404).json({ message: "Registro não encontrado" });
      }
      
      if (!registro.protocolo) {
        return res.status(400).json({ message: "Registro sem protocolo para consulta" });
      }
      
      // Simular consulta externa
      const statusMock = await consultarStatusCartorio(registro.protocolo);
      
      // Atualizar mock status no banco
      await storage.updateRegistroMockStatus(registroId, statusMock);
      
      // Buscar informações do cartório
      const cartorioInfo = await db.select().from(cartorios).where(eq(cartorios.id, registro.cartorioId)).limit(1);
      const cartorioNome = cartorioInfo.length > 0 ? cartorioInfo[0].nome : 'Cartório não encontrado';
      
      res.json({
        registro: {
          id: registro.id,
          protocolo: registro.protocolo,
          cartorioNome: cartorioNome
        },
        statusAtual: registro.status,
        statusConsultado: statusMock
      });
    } catch (error) {
      console.error("Error consulting registro status:", error);
      res.status(500).json({ message: "Failed to consult status" });
    }
  });

  /**
   * POST /api/registros/:id/update-status
   * Atualiza status via mock (simula webhook do cartório)
   */
  app.post("/api/registros/:id/update-status", isAuthenticated, async (req: any, res) => {
    try {
      const registroId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      const { novoStatus } = req.body;
      

      
      // Verificar ownership
      const registro = await storage.getRegistro(registroId);
      if (!registro || registro.userId !== userId) {
        return res.status(404).json({ message: "Registro não encontrado" });
      }
      
      // Validar novo status
      const statusValidos = ["pendente_envio", "em_analise", "aguardando_pagamento", "registrado", "indeferido"];
      if (!statusValidos.includes(novoStatus)) {
        return res.status(400).json({ message: "Status inválido" });
      }
      
      // Simular atualização forçada
      const mockData = await forcarAtualizacaoStatus(registro.protocolo!, novoStatus);
      
      // Atualizar registro
      const updatedRegistro = await storage.updateRegistro(registroId, {
        status: novoStatus,
        mockStatus: mockData
      });
      
      res.json({
        message: "Status atualizado com sucesso",
        registro: updatedRegistro,
        mockData
      });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  /**
   * GET /api/properties/:id/registros
   * Lista registros de uma propriedade específica
   */
  app.get("/api/properties/:id/registros", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      

      
      // Verificar ownership da propriedade
      const property = await storage.getProperty(propertyId);
      if (!property || property.userId !== userId) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      const registros = await storage.getRegistrosByProperty(propertyId);
      
      res.json(registros);
    } catch (error) {
      console.error("Error fetching property registros:", error);
      res.status(500).json({ message: "Failed to fetch property registros" });
    }
  });

  /**
   * GET /api/cartorios
   * Lista cartórios disponíveis para seleção
   */
  app.get("/api/cartorios", isAuthenticated, async (req: any, res) => {
    try {
      const cartoriosList = await db.select().from(cartorios).where(eq(cartorios.ativo, true));
      res.json(cartoriosList);
    } catch (error) {
      console.error("Error fetching cartorios:", error);
      res.status(500).json({ message: "Failed to fetch cartorios" });
    }
  });

  /**
   * POST /api/cartorios/consultar-taxas
   * Consulta taxas de um cartório para um valor de imóvel
   */
  app.post("/api/cartorios/consultar-taxas", isAuthenticated, async (req: any, res) => {
    try {
      const { cartorioNome, valorImovel } = req.body;
      

      
      if (!cartorioNome || !valorImovel) {
        return res.status(400).json({ message: "cartorioNome e valorImovel são obrigatórios" });
      }
      
      const taxas = await consultarTaxasCartorio(cartorioNome, parseFloat(valorImovel));
      
      res.json(taxas);
    } catch (error) {
      console.error("Error consulting taxes:", error);
      res.status(500).json({ message: "Failed to consult taxes" });
    }
  });

  // =========================
  // CLIENTS ROUTES (NOVA SEÇÃO)
  // =========================

  /**
   * GET /api/clients
   * Lista clientes do usuário autenticado com paginação e filtros
   */
  app.get("/api/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      
      // Extrair query parameters
      const {
        page = 1,
        limit = 50,
        search,
        maritalStatus,
        city,
        state,
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = req.query;
      
      const options = {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100), // Máximo 100 por página
        search: search as string,
        maritalStatus: maritalStatus as string,
        city: city as string,
        state: state as string,
        orderBy: orderBy as 'name' | 'created_at',
        orderDirection: orderDirection as 'asc' | 'desc'
      };
      
      
      const result = await storage.getClients(userId, options);
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ 
        message: "Failed to fetch clients",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * GET /api/clients/:id
   * Busca cliente específico com validação de ownership
   */
  app.get("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      
      
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID do cliente inválido" });
      }
      
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      
      // Verificar ownership
      if (client.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ 
        message: "Failed to fetch client",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/clients
   * Cria novo cliente com validação completa
   */
  app.post("/api/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      
      // Validar dados com Zod
      const validatedData = createClientSchema.parse(req.body);
      
      // Verificar se CPF já existe
      const existingCPF = await storage.getClientByCPF(validatedData.cpf);
      if (existingCPF) {
        return res.status(409).json({ 
          message: "CPF já cadastrado",
          field: "cpf"
        });
      }
      
      // Verificar se email já existe
      const existingEmail = await storage.getClientByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(409).json({ 
          message: "Email já cadastrado",
          field: "email"
        });
      }
      
      // Criar cliente
      const client = await storage.createClient({
        ...validatedData,
        userId
      });
      
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Failed to create client",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * PUT /api/clients/:id
   * Atualiza cliente existente
   */
  app.put("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      
      
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID do cliente inválido" });
      }
      
      // Verificar se cliente existe e pertence ao usuário
      const existingClient = await storage.getClient(clientId);
      
      if (!existingClient || existingClient.userId !== userId) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      
      // Validar dados de atualização
      const validatedData = updateClientSchema.parse(req.body);
      
      // Verificar CPF único (se alterado)
      if (validatedData.cpf && validatedData.cpf !== existingClient.cpf) {
        const existingCPF = await storage.getClientByCPF(validatedData.cpf, clientId);
        if (existingCPF) {
          return res.status(409).json({ 
            message: "CPF já cadastrado para outro cliente",
            field: "cpf"
          });
        }
      }
      
      // Verificar email único (se alterado)
      if (validatedData.email && validatedData.email.toLowerCase() !== existingClient.email.toLowerCase()) {
        const existingEmail = await storage.getClientByEmail(validatedData.email, clientId);
        if (existingEmail) {
          return res.status(409).json({ 
            message: "Email já cadastrado para outro cliente",
            field: "email"
          });
        }
      }
      
      // Atualizar cliente
      const updatedClient = await storage.updateClient(clientId, validatedData);
      
      res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Failed to update client",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * DELETE /api/clients/:id
   * Remove cliente com validação de ownership
   */
  app.delete("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      
      
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID do cliente inválido" });
      }
      
      // Verificar ownership
      const client = await storage.getClient(clientId);
      if (!client || client.userId !== userId) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      
      // Deletar cliente
      await storage.deleteClient(clientId);
      
      res.json({ message: "Cliente deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ 
        message: "Failed to delete client",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * GET /api/clients/stats
   * Estatísticas dos clientes do usuário
   */
  app.get("/api/clients/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      
      const stats = await storage.getClientStats(userId);
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching client stats:", error);
      res.status(500).json({ 
        message: "Failed to fetch client statistics",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * GET /api/clients/recent
   * Clientes recentes do usuário
   */
  app.get("/api/clients/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString(); // Manter como string para compatibilidade com schema
      const limit = parseInt(req.query.limit as string) || 10;
      
      
      const recentClients = await storage.getRecentClients(userId, Math.min(limit, 50));
      
      res.json(recentClients);
    } catch (error) {
      console.error("Error fetching recent clients:", error);
      res.status(500).json({ 
        message: "Failed to fetch recent clients",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/clients/validate-cpf
   * Valida CPF sem criar cliente (para validação em tempo real)
   */
  app.post("/api/clients/validate-cpf", isAuthenticated, async (req: any, res) => {
    try {
      const { cpf, excludeId } = req.body;
      
      if (!cpf) {
        return res.status(400).json({ message: "CPF é obrigatório" });
      }
      
      const existingClient = await storage.getClientByCPF(cpf, excludeId);
      
      res.json({ 
        isValid: !existingClient,
        message: existingClient ? "CPF já cadastrado" : "CPF disponível"
      });
    } catch (error) {
      console.error("Error validating CPF:", error);
      res.status(500).json({ message: "Failed to validate CPF" });
    }
  });

  /**
   * POST /api/clients/validate-email
   * Valida email sem criar cliente (para validação em tempo real)
   */
  app.post("/api/clients/validate-email", isAuthenticated, async (req: any, res) => {
    try {
      const { email, excludeId } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      
      const existingClient = await storage.getClientByEmail(email, excludeId);
      
      res.json({ 
        isValid: !existingClient,
        message: existingClient ? "Email já cadastrado" : "Email disponível"
      });
    } catch (error) {
      console.error("Error validating email:", error);
      res.status(500).json({ message: "Failed to validate email" });
    }
  });

  // ================================
  // CLIENT NOTES ROUTES (CRM)
  // ================================

  /**
   * GET /api/clients/:id/details
   * Busca cliente com notas para página de CRM
   */
  app.get("/api/clients/:id/details", isAuthenticated, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      
      
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID do cliente inválido" });
      }
      
      // Buscar cliente
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      
      // Verificar ownership
      if (client.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Buscar notas do cliente
      const notes = await db.select()
        .from(clientNotes)
        .where(eq(clientNotes.clientId, clientId))
        .orderBy(desc(clientNotes.createdAt));
      
      // Buscar documentos do cliente
      const documents = await db.select()
        .from(clientDocuments)
        .where(eq(clientDocuments.clientId, clientId))
        .orderBy(desc(clientDocuments.uploadedAt));
      
      // Contar notas por tipo
      const noteStats = {
        total: notes.length,
        pending: notes.filter(n => !n.isCompleted && n.type === 'reminder').length,
        completed: notes.filter(n => n.isCompleted).length,
        reminders: notes.filter(n => n.type === 'reminder').length,
        notes: notes.filter(n => n.type === 'note').length,
        meetings: notes.filter(n => n.type === 'meeting').length,
        calls: notes.filter(n => n.type === 'call').length,
      };
      
      res.json({
        client,
        notes,
        documents,
        stats: noteStats
      });
    } catch (error) {
      console.error("Error fetching client details:", error);
      res.status(500).json({ 
        message: "Failed to fetch client details",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * GET /api/clients/:id/notes
   * Lista todas as notas de um cliente
   */
  app.get("/api/clients/:id/notes", isAuthenticated, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      
      
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID do cliente inválido" });
      }
      
      // Verificar se cliente existe e pertence ao usuário
      const client = await storage.getClient(clientId);
      if (!client || client.userId !== userId) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      
      // Filtros opcionais
      const { type, priority, completed } = req.query;
      
      let query = db.select()
        .from(clientNotes)
        .where(eq(clientNotes.clientId, clientId));
      
      // Aplicar filtros se fornecidos
      if (type) {
        query = query.where(and(eq(clientNotes.clientId, clientId), eq(clientNotes.type, type as string)));
      }
      
      if (priority) {
        query = query.where(and(eq(clientNotes.clientId, clientId), eq(clientNotes.priority, priority as string)));
      }
      
      if (completed !== undefined) {
        const isCompleted = completed === 'true';
        query = query.where(and(eq(clientNotes.clientId, clientId), eq(clientNotes.isCompleted, isCompleted)));
      }
      
      const notes = await query.orderBy(desc(clientNotes.createdAt));
      
      res.json(notes);
    } catch (error) {
      console.error("Error fetching client notes:", error);
      res.status(500).json({ 
        message: "Failed to fetch client notes",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/clients/:id/notes
   * Cria nova nota para um cliente
   */
  app.post("/api/clients/:id/notes", isAuthenticated, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      
      
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID do cliente inválido" });
      }
      
      // Verificar se cliente existe e pertence ao usuário
      const client = await storage.getClient(clientId);
      if (!client || client.userId !== userId) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      
      // Validar dados da nota
      const validatedData = createClientNoteSchema.parse({
        ...req.body,
        clientId
      });
      
      // Criar nota
      const note = await db.insert(clientNotes)
        .values({
          ...validatedData,
          userId,
        })
        .returning();
      
      // Criar notificação se for um lembrete
      if (validatedData.type === 'reminder' && validatedData.reminderDate) {
        await db.insert(notifications).values({
          userId,
          type: 'info',
          title: 'Lembrete de Cliente',
          message: `Lembrete para ${client.fullName}: ${validatedData.title}`,
          category: 'client',
          relatedId: clientId,
          isRead: false,
        });
      }
      
      res.status(201).json(note[0]);
    } catch (error) {
      console.error("Error creating client note:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Failed to create client note",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * PUT /api/client-notes/:id
   * Atualiza nota existente
   */
  app.put("/api/client-notes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      
      
      if (isNaN(noteId)) {
        return res.status(400).json({ message: "ID da nota inválido" });
      }
      
      // Verificar se nota existe e pertence ao usuário
      const existingNote = await db.select()
        .from(clientNotes)
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.userId, userId)))
        .limit(1);
      
      if (existingNote.length === 0) {
        return res.status(404).json({ message: "Nota não encontrada" });
      }
      
      // Validar dados de atualização
      const validatedData = updateClientNoteSchema.parse(req.body);
      
      // Se está marcando como concluída, adicionar timestamp
      if (validatedData.isCompleted && !existingNote[0].isCompleted) {
        validatedData.completedAt = new Date();
      }
      
      // Atualizar nota
      const updatedNote = await db.update(clientNotes)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.userId, userId)))
        .returning();
      
      res.json(updatedNote[0]);
    } catch (error) {
      console.error("Error updating client note:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Failed to update client note",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * DELETE /api/client-notes/:id
   * Remove nota com validação de ownership
   */
  app.delete("/api/client-notes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      
      
      if (isNaN(noteId)) {
        return res.status(400).json({ message: "ID da nota inválido" });
      }
      
      // Verificar se nota existe e pertence ao usuário
      const existingNote = await db.select()
        .from(clientNotes)
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.userId, userId)))
        .limit(1);
      
      if (existingNote.length === 0) {
        return res.status(404).json({ message: "Nota não encontrada" });
      }
      
      // Deletar nota
      await db.delete(clientNotes)
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.userId, userId)));
      
      res.json({ message: "Nota deletada com sucesso" });
    } catch (error) {
      console.error("Error deleting client note:", error);
      res.status(500).json({ 
        message: "Failed to delete client note",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ================================
  // NOTIFICATIONS ROUTES
  // ================================

  /**
   * GET /api/notifications
   * Buscar notificações do usuário com paginação
   */
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString(); // Converter para string se necessário
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // máximo 50
      const offset = (page - 1) * limit;

      // Buscar notificações do usuário
      const [notificationsResult, totalCount] = await Promise.all([
        db.select()
          .from(notifications)
          .where(eq(notifications.userId, userId))
          .orderBy(desc(notifications.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() })
          .from(notifications)
          .where(eq(notifications.userId, userId))
      ]);

      // Contar não lidas
      const unreadCountResult = await db.select({ count: count() })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));

      const unreadCount = unreadCountResult[0]?.count || 0;
      const total = totalCount[0]?.count || 0;
      const hasMore = offset + notificationsResult.length < total;

      res.json({
        notifications: notificationsResult,
        unreadCount,
        pagination: {
          page,
          limit,
          hasMore
        }
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ 
        message: "Failed to fetch notifications",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  /**
   * PATCH /api/notifications/:id/read
   * Marcar notificação como lida
   */
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString();
      const notificationId = parseInt(req.params.id);

      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }

      // Verificar se a notificação pertence ao usuário
      const notification = await db.select()
        .from(notifications)
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ))
        .limit(1);

      if (notification.length === 0) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Marcar como lida
      await db.update(notifications)
        .set({ 
          isRead: true, 
          readAt: new Date() 
        })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));

      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ 
        message: "Failed to mark notification as read",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  /**
   * PATCH /api/notifications/read-all
   * Marcar todas as notificações como lidas
   */
  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString();

      // Marcar todas as notificações não lidas como lidas
      await db.update(notifications)
        .set({ 
          isRead: true, 
          readAt: new Date() 
        })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));

      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ 
        message: "Failed to mark all notifications as read",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  // ================================
  // ENHANCED CRM ROUTES
  // ================================

  /**
   * POST /api/client-notes/:id/complete
   * Marcar nota como completa com auditoria
   */
  app.post("/api/client-notes/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      const { reason } = req.body;

      if (isNaN(noteId)) {
        return res.status(400).json({ message: "ID da nota inválido" });
      }

      // Buscar nota atual
      const existingNote = await db.select()
        .from(clientNotes)
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.userId, userId)))
        .limit(1);

      if (existingNote.length === 0) {
        return res.status(404).json({ message: "Nota não encontrada" });
      }

      const note = existingNote[0];

      // Atualizar nota
      const updatedNote = await db.update(clientNotes)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          completedBy: userId,
          status: 'completed',
          updatedAt: new Date()
        })
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.userId, userId)))
        .returning();

      // Criar log de auditoria
      await db.insert(clientNoteAuditLogs).values({
        noteId,
        userId,
        action: 'completed',
        field: 'isCompleted',
        oldValue: 'false',
        newValue: 'true',
        reason: reason || null,
        metadata: { completedAt: new Date().toISOString() }
      });

      res.json({
        message: "Nota marcada como completa",
        note: updatedNote[0]
      });
    } catch (error) {
      console.error("Error completing note:", error);
      res.status(500).json({
        message: "Erro ao completar nota",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/client-notes/:id/schedule-reminder
   * Agendar lembrete para nota
   */
  app.post("/api/client-notes/:id/schedule-reminder", isAuthenticated, async (req: any, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      
      const validatedData = createScheduledNotificationSchema.parse({
        ...req.body,
        relatedType: 'client_note',
        relatedId: noteId,
        scheduledFor: new Date(req.body.scheduledFor)
      });

      if (isNaN(noteId)) {
        return res.status(400).json({ message: "ID da nota inválido" });
      }

      // Verificar se nota existe
      const note = await db.select()
        .from(clientNotes)
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.userId, userId)))
        .limit(1);

      if (note.length === 0) {
        return res.status(404).json({ message: "Nota não encontrada" });
      }

      // Criar notificação agendada
      const notification = await db.insert(scheduledNotifications)
        .values({
          userId,
          ...validatedData
        })
        .returning();

      res.json({
        message: "Lembrete agendado com sucesso",
        notification: notification[0]
      });
    } catch (error) {
      console.error("Error scheduling reminder:", error);
      res.status(500).json({
        message: "Erro ao agendar lembrete",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * GET /api/client-notes/:id/audit-log
   * Buscar histórico de auditoria de uma nota
   */
  app.get("/api/client-notes/:id/audit-log", isAuthenticated, async (req: any, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();

      if (isNaN(noteId)) {
        return res.status(400).json({ message: "ID da nota inválido" });
      }

      // Verificar se nota existe e pertence ao usuário
      const note = await db.select()
        .from(clientNotes)
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.userId, userId)))
        .limit(1);

      if (note.length === 0) {
        return res.status(404).json({ message: "Nota não encontrada" });
      }

      // Buscar logs de auditoria
      const auditLogs = await db.select()
        .from(clientNoteAuditLogs)
        .where(eq(clientNoteAuditLogs.noteId, noteId))
        .orderBy(desc(clientNoteAuditLogs.createdAt));

      res.json({
        noteId,
        auditLogs
      });
    } catch (error) {
      console.error("Error fetching audit log:", error);
      res.status(500).json({
        message: "Erro ao buscar histórico",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * GET /api/clients/:id/notes/upcoming
   * Buscar lembretes e reuniões próximas do cliente
   */
  app.get("/api/clients/:id/notes/upcoming", isAuthenticated, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      const days = parseInt(req.query.days as string) || 7; // Próximos 7 dias por padrão

      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID do cliente inválido" });
      }

      // Verificar se cliente existe e pertence ao usuário
      const client = await storage.getClient(clientId);
      if (!client || client.userId !== userId) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      const fromDate = new Date();
      const toDate = new Date();
      toDate.setDate(toDate.getDate() + days);

      // Buscar notas com lembretes próximos
      const upcomingNotes = await db.select()
        .from(clientNotes)
        .where(and(
          eq(clientNotes.clientId, clientId),
          eq(clientNotes.userId, userId),
          eq(clientNotes.isCompleted, false),
          // Filtrar por data de lembrete
          and(
            eq(clientNotes.reminderDate, fromDate), // Placeholder - será substituído pela comparação correta
            eq(clientNotes.reminderDate, toDate)    // Placeholder - será substituído pela comparação correta
          )
        ))
        .orderBy(clientNotes.reminderDate);

      res.json({
        clientId,
        period: `${days} dias`,
        upcomingNotes
      });
    } catch (error) {
      console.error("Error fetching upcoming notes:", error);
      res.status(500).json({
        message: "Erro ao buscar lembretes próximos",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/client-notes/call
   * Endpoint especializado para registrar ligações
   */
  app.post("/api/client-notes/call", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString();
      
      const validatedData = createClientNoteSchema.parse({
        ...req.body,
        type: 'call',
        userId
      });

      // Criar nota de ligação
      const note = await db.insert(clientNotes)
        .values({
          ...validatedData,
          userId
        })
        .returning();

      // Criar log de auditoria
      await db.insert(clientNoteAuditLogs).values({
        noteId: note[0].id,
        userId,
        action: 'created',
        reason: 'Ligação registrada',
        metadata: {
          type: 'call',
          duration: validatedData.duration || null,
          callResult: validatedData.callResult || null
        }
      });

      res.status(201).json({
        message: "Ligação registrada com sucesso",
        note: note[0]
      });
    } catch (error) {
      console.error("Error creating call note:", error);
      res.status(500).json({
        message: "Erro ao registrar ligação",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/client-notes/meeting
   * Endpoint especializado para agendar reuniões
   */
  app.post("/api/client-notes/meeting", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString();
      
      const validatedData = createClientNoteSchema.parse({
        ...req.body,
        type: 'meeting',
        userId
      });

      // Criar nota de reunião
      const note = await db.insert(clientNotes)
        .values({
          ...validatedData,
          userId
        })
        .returning();

      // Criar log de auditoria
      await db.insert(clientNoteAuditLogs).values({
        noteId: note[0].id,
        userId,
        action: 'created',
        reason: 'Reunião agendada',
        metadata: {
          type: 'meeting',
          location: validatedData.location || null,
          participants: validatedData.participants || null,
          reminderDate: validatedData.reminderDate || null
        }
      });

      // Se tem data de lembrete, criar notificação agendada
      if (validatedData.reminderDate) {
        await db.insert(scheduledNotifications).values({
          userId,
          relatedType: 'client_note',
          relatedId: note[0].id,
          title: `Reunião: ${validatedData.title}`,
          message: `Reunião agendada para ${validatedData.reminderDate}`,
          scheduledFor: validatedData.reminderDate,
          notificationType: 'in_app',
          metadata: {
            type: 'meeting_reminder',
            location: validatedData.location
          }
        });
      }

      res.status(201).json({
        message: "Reunião agendada com sucesso",
        note: note[0]
      });
    } catch (error) {
      console.error("Error creating meeting note:", error);
      res.status(500).json({
        message: "Erro ao agendar reunião",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ================================
  // PENDENCY CONTROL SYSTEM ROUTES
  // ================================

  /**
   * GET /api/properties/:id/pendencies
   * Get all pendencies for a property with real-time validation
   */
  app.get("/api/properties/:id/pendencies", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "ID da propriedade inválido" });
      }
      
      // Verify property ownership
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length || property[0].userId !== userId) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      // Get comprehensive pendency summary
      const summary = await PendencyValidationEngine.getPropertyPendencySummary(propertyId);
      
      res.json(summary);
    } catch (error) {
      console.error("Error fetching property pendencies:", error);
      res.status(500).json({ 
        message: "Erro ao buscar pendências",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * GET /api/properties/:id/stage/:stageId/requirements
   * Get stage-specific requirements with validation status
   */
  app.get("/api/properties/:id/stage/:stageId/requirements", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const stageId = parseInt(req.params.stageId);
      const userId = req.session.user.id.toString();
      
      if (isNaN(propertyId) || isNaN(stageId)) {
        return res.status(400).json({ message: "IDs inválidos" });
      }
      
      if (stageId < 1 || stageId > 8) {
        return res.status(400).json({ message: "Stage ID deve estar entre 1 e 8" });
      }
      
      // Verify property ownership
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length || property[0].userId !== userId) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      // Validate stage requirements
      const validationResult = await PendencyValidationEngine.validateStageRequirements(propertyId, stageId);
      
      // Get detailed requirements
      const requirements = await db.select({
        requirement: stageRequirements,
        propertyRequirement: propertyRequirements
      })
      .from(stageRequirements)
      .leftJoin(
        propertyRequirements,
        and(
          eq(propertyRequirements.requirementId, stageRequirements.id),
          eq(propertyRequirements.propertyId, propertyId)
        )
      )
      .where(
        and(
          eq(stageRequirements.stageId, stageId),
          sql`${stageRequirements.propertyTypes} = '*' OR ${stageRequirements.propertyTypes} LIKE ${`%${property[0].type}%`}`
        )
      );
      
      res.json({
        stageId,
        propertyId,
        validation: validationResult,
        requirements: requirements.map(r => ({
          ...r.requirement,
          status: r.propertyRequirement?.status || 'PENDING',
          completionPercentage: r.propertyRequirement?.completionPercentage || 0,
          notes: r.propertyRequirement?.notes,
          validationData: r.propertyRequirement?.validationData,
          lastCheckedAt: r.propertyRequirement?.lastCheckedAt,
          completedAt: r.propertyRequirement?.completedAt,
          completedBy: r.propertyRequirement?.completedBy
        }))
      });
    } catch (error) {
      console.error("Error fetching stage requirements:", error);
      res.status(500).json({ 
        message: "Erro ao buscar requisitos do estágio",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/properties/:id/advance-stage
   * Advance property to next stage with pendency validation
   */
  app.post("/api/properties/:id/advance-stage", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "ID da propriedade inválido" });
      }
      
      // Verify property ownership
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length || property[0].userId !== userId) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      // Validate advancement data
      const validatedData = stageAdvancementSchema.parse(req.body);
      
      // Validate target stage
      if (validatedData.toStage < 1 || validatedData.toStage > 8) {
        return res.status(400).json({ message: "Estágio de destino deve estar entre 1 e 8" });
      }
      
      if (validatedData.toStage <= property[0].currentStage) {
        return res.status(400).json({ message: "Estágio de destino deve ser superior ao atual" });
      }
      
      // Advance stage
      const result = await PendencyValidationEngine.advancePropertyStage(
        propertyId,
        validatedData,
        userId
      );
      
      if (result.success) {
        // Track stage advancement for real-time notifications
        // TODO: Implementar RealTimePendencyTracker.trackStageAdvancement
        // await RealTimePendencyTracker.trackStageAdvancement(
        //   propertyId,
        //   property[0].currentStage,
        //   result.newStage,
        //   validatedData.advancementType,
        //   userId
        // );
        
        res.json({
          success: true,
          message: result.message,
          previousStage: property[0].currentStage,
          newStage: result.newStage,
          validation: result.validationResult
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          currentStage: result.newStage,
          validation: result.validationResult
        });
      }
    } catch (error) {
      console.error("Error advancing property stage:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Erro ao avançar estágio",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * PUT /api/properties/:id/requirements/:reqId
   * Update requirement status manually
   */
  app.put("/api/properties/:id/requirements/:reqId", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const requirementId = parseInt(req.params.reqId);
      const userId = req.session.user.id.toString();
      
      if (isNaN(propertyId) || isNaN(requirementId)) {
        return res.status(400).json({ message: "IDs inválidos" });
      }
      
      // Verify property ownership
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length || property[0].userId !== userId) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      // Validate update data
      const validatedData = updatePropertyRequirementSchema.parse(req.body);
      
      // Check if property requirement exists
      const existing = await db.select()
        .from(propertyRequirements)
        .where(
          and(
            eq(propertyRequirements.propertyId, propertyId),
            eq(propertyRequirements.requirementId, requirementId)
          )
        )
        .limit(1);
      
      if (!existing.length) {
        return res.status(404).json({ message: "Requisito não encontrado para esta propriedade" });
      }
      
      // Add completion data if marking as completed
      const updateData: any = {
        ...validatedData,
        updatedAt: new Date()
      };
      
      if (validatedData.status === 'COMPLETED' && !existing[0].completedAt) {
        updateData.completedAt = new Date();
        updateData.completedBy = userId;
      }
      
      // Update requirement
      const updated = await db.update(propertyRequirements)
        .set(updateData)
        .where(eq(propertyRequirements.id, existing[0].id))
        .returning();
      
      // Update cached metrics
      await PendencyValidationEngine.updateStageCompletionMetrics(propertyId);
      
      // Track requirement update for real-time notifications
      // TODO: Implementar RealTimePendencyTracker.trackRequirementUpdate
      // await RealTimePendencyTracker.trackRequirementUpdate(
      //   propertyId,
      //   requirementId,
      //   existing[0].status,
      //   validatedData.status || existing[0].status,
      //   userId
      // );
      
      res.json({
        message: "Requisito atualizado com sucesso",
        requirement: updated[0]
      });
    } catch (error) {
      console.error("Error updating requirement:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Erro ao atualizar requisito",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * GET /api/stage-templates/:stageId
   * Get requirement templates for a specific stage
   */
  app.get("/api/stage-templates/:stageId", isAuthenticated, async (req: any, res) => {
    try {
      const stageId = parseInt(req.params.stageId);
      
      if (isNaN(stageId) || stageId < 1 || stageId > 8) {
        return res.status(400).json({ message: "Stage ID deve estar entre 1 e 8" });
      }
      
      // Get stage requirements templates
      const requirements = await db.select()
        .from(stageRequirements)
        .where(eq(stageRequirements.stageId, stageId));
      
      const stageNames = [
        '', 'Captação', 'Due Diligence', 'Mercado', 'Propostas', 
        'Contratos', 'Financiamento', 'Instrumento', 'Concluído'
      ];
      
      res.json({
        stageId,
        stageName: stageNames[stageId] || `Stage ${stageId}`,
        requirements: requirements.map(req => ({
          id: req.id,
          requirementKey: req.requirementKey,
          requirementName: req.requirementName,
          description: req.description,
          category: req.category,
          isCritical: req.isCritical,
          validationRules: req.validationRules,
          propertyTypes: req.propertyTypes
        }))
      });
    } catch (error) {
      console.error("Error fetching stage templates:", error);
      res.status(500).json({ 
        message: "Erro ao buscar templates do estágio",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/properties/:id/validate-requirements
   * Trigger manual validation of all requirements for a property
   */
  app.post("/api/properties/:id/validate-requirements", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "ID da propriedade inválido" });
      }
      
      // Verify property ownership
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length || property[0].userId !== userId) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      // Update all stage metrics
      await PendencyValidationEngine.updateStageCompletionMetrics(propertyId);
      
      // Get updated summary
      const summary = await PendencyValidationEngine.getPropertyPendencySummary(propertyId);
      
      res.json({
        message: "Validação de requisitos executada com sucesso",
        summary
      });
    } catch (error) {
      console.error("Error validating requirements:", error);
      res.status(500).json({ 
        message: "Erro ao validar requisitos",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * GET /api/properties/:id/stage-advancement-log
   * Get audit trail of stage advancements for a property
   */
  app.get("/api/properties/:id/stage-advancement-log", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "ID da propriedade inválido" });
      }
      
      // Verify property ownership
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length || property[0].userId !== userId) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      // Get advancement log
      const log = await db.select()
        .from(stageAdvancementLog)
        .where(eq(stageAdvancementLog.propertyId, propertyId))
        .orderBy(desc(stageAdvancementLog.createdAt));
      
      const stageNames = [
        '', 'Captação', 'Due Diligence', 'Mercado', 'Propostas', 
        'Contratos', 'Financiamento', 'Instrumento', 'Concluído'
      ];
      
      res.json({
        propertyId,
        log: log.map(entry => ({
          ...entry,
          fromStageName: entry.fromStage ? stageNames[entry.fromStage] : null,
          toStageName: stageNames[entry.toStage] || `Stage ${entry.toStage}`
        }))
      });
    } catch (error) {
      console.error("Error fetching stage advancement log:", error);
      res.status(500).json({ 
        message: "Erro ao buscar histórico de avanços",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ================================
  // ADMIN/SETUP ROUTES FOR PENDENCY SYSTEM
  // ================================

  /**
   * POST /api/admin/seed-stage-requirements
   * Seed default stage requirements (admin only)
   */
  app.post("/api/admin/seed-stage-requirements", isAuthenticated, async (req: any, res) => {
    try {
      // Note: In production, add admin role check here
      await seedStageRequirements();
      res.json({ message: "Stage requirements seeded successfully" });
    } catch (error) {
      console.error("Error seeding stage requirements:", error);
      res.status(500).json({ 
        message: "Erro ao popular requisitos de estágio",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/admin/initialize-existing-properties
   * Initialize pendency tracking for existing properties (admin only)
   */
  app.post("/api/admin/initialize-existing-properties", isAuthenticated, async (req: any, res) => {
    try {
      // Note: In production, add admin role check here
      await initializeExistingProperties();
      await initializePendencyNotifications();
      res.json({ message: "Existing properties initialized successfully" });
    } catch (error) {
      console.error("Error initializing existing properties:", error);
      res.status(500).json({ 
        message: "Erro ao inicializar propriedades existentes",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/admin/stage-requirements
   * Create custom stage requirement (admin only)
   */
  app.post("/api/admin/stage-requirements", isAuthenticated, async (req: any, res) => {
    try {
      // Note: In production, add admin role check here
      const validatedData = createStageRequirementSchema.parse(req.body);
      
      const requirement = await db.insert(stageRequirements)
        .values(validatedData)
        .returning();
      
      res.status(201).json({
        message: "Requisito de estágio criado com sucesso",
        requirement: requirement[0]
      });
    } catch (error) {
      console.error("Error creating stage requirement:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Erro ao criar requisito de estágio",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ================================
  // PENDENCY NOTIFICATION ROUTES
  // ================================

  /**
   * GET /api/pendency-notifications
   * Get active pendency notifications for current user
   */
  app.get("/api/pendency-notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString();
      const limit = parseInt(req.query.limit as string) || 50;
      
      const notifications = await PendencyNotificationService.getUserPendencyNotifications(userId, limit);
      
      res.json({
        notifications,
        count: notifications.length
      });
    } catch (error) {
      console.error("Error fetching pendency notifications:", error);
      res.status(500).json({ 
        message: "Erro ao buscar notificações de pendências",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * GET /api/properties/:id/pendency-notifications
   * Get pendency notifications for a specific property
   */
  app.get("/api/properties/:id/pendency-notifications", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "ID da propriedade inválido" });
      }
      
      // Verify property ownership
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length || property[0].userId !== userId) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      const notifications = await PendencyNotificationService.getPropertyPendencyNotifications(propertyId, userId);
      
      res.json({
        propertyId,
        notifications,
        count: notifications.length
      });
    } catch (error) {
      console.error("Error fetching property pendency notifications:", error);
      res.status(500).json({ 
        message: "Erro ao buscar notificações da propriedade",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/pendency-notifications/:id/resolve
   * Mark a pendency notification as resolved
   */
  app.post("/api/pendency-notifications/:id/resolve", isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "ID da notificação inválido" });
      }
      
      await PendencyNotificationService.resolveNotification(notificationId, userId);
      
      res.json({
        message: "Notificação marcada como resolvida"
      });
    } catch (error) {
      console.error("Error resolving pendency notification:", error);
      res.status(500).json({ 
        message: "Erro ao resolver notificação",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/properties/:id/trigger-pendency-review
   * Trigger manual pendency review for a property
   */
  app.post("/api/properties/:id/trigger-pendency-review", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "ID da propriedade inválido" });
      }
      
      // Verify property ownership
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length || property[0].userId !== userId) {
        return res.status(404).json({ message: "Propriedade não encontrada" });
      }
      
      await PendencyNotificationService.triggerPendencyReview(propertyId, userId);
      
      res.json({
        message: "Revisão de pendências iniciada com sucesso"
      });
    } catch (error) {
      console.error("Error triggering pendency review:", error);
      res.status(500).json({ 
        message: "Erro ao iniciar revisão de pendências",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/admin/run-pendency-cleanup
   * Run daily pendency cleanup (admin only)
   */
  app.post("/api/admin/run-pendency-cleanup", isAuthenticated, async (req: any, res) => {
    try {
      // Note: In production, add admin role check here
      await runDailyPendencyCleanup();
      res.json({ message: "Pendency cleanup completed successfully" });
    } catch (error) {
      console.error("Error running pendency cleanup:", error);
      res.status(500).json({ 
        message: "Erro ao executar limpeza de pendências",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ================================
  // ENHANCED PROPERTY CREATION WITH PENDENCY TRACKING
  // ================================

  // Override the existing property creation to include pendency initialization
  app.post("/api/properties-with-pendency", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id.toString();
      
      // Generate next sequence number
      const sequenceNumber = await storage.generateNextSequenceNumber();
      
      // Validate property data
      const propertyData = {
        userId,
        sequenceNumber,
        type: req.body.type,
        street: req.body.street,
        number: req.body.number,
        complement: req.body.complement || null,
        neighborhood: req.body.neighborhood,
        city: req.body.city,
        state: req.body.state,
        cep: req.body.cep,
        value: req.body.value,
        registrationNumber: req.body.registrationNumber,
        municipalRegistration: req.body.municipalRegistration,
        status: req.body.status || "captacao",
        currentStage: req.body.currentStage || 1,
      };

      // Create property
      const property = await storage.createProperty(propertyData);
      
      // Initialize pendency tracking
      await PendencyValidationEngine.initializePropertyRequirements(property.id, property.type);
      
      // Create owners if provided
      if (req.body.owners && req.body.owners.length > 0) {
        for (const owner of req.body.owners) {
          await storage.createPropertyOwner({
            propertyId: property.id,
            fullName: owner.fullName,
            cpf: owner.cpf,
            rg: owner.rg || null,
            birthDate: owner.birthDate || null,
            maritalStatus: owner.maritalStatus || null,
            fatherName: owner.fatherName || null,
            motherName: owner.motherName || null,
            phone: owner.phone,
            email: owner.email || null,
          });
        }
      }

      // Get initial pendency summary
      const pendencySummary = await PendencyValidationEngine.getPropertyPendencySummary(property.id);

      res.json({
        property,
        pendencySummary
      });
    } catch (error) {
      console.error("Error creating property with pendency tracking:", error);
      res.status(500).json({ 
        message: "Erro ao criar propriedade com controle de pendências", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // ======================================
  // CLIENT DOCUMENTS ROUTES
  // ======================================

  /**
   * POST /api/clients/documents/upload
   * Upload document for client
   */
  app.post("/api/clients/documents/upload", isAuthenticated, multer().single('file'), async (req: any, res) => {
    try {
      // Check if Supabase is configured
      if (!supabaseAdmin) {
        return res.status(503).json({ 
          message: "Serviço de upload não configurado. Entre em contato com o administrador." 
        });
      }

      const userId = req.session.user.id.toString();
      const { clientId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Nenhum arquivo fornecido" });
      }

      if (!clientId) {
        return res.status(400).json({ message: "ID do cliente é obrigatório" });
      }

      const clientIdNum = parseInt(clientId);
      if (isNaN(clientIdNum)) {
        return res.status(400).json({ message: "ID do cliente inválido" });
      }

      // Verificar se cliente existe e pertence ao usuário
      const client = await storage.getClient(clientIdNum);
      if (!client || client.userId !== userId) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      // Validar tipo de arquivo
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif'
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
          message: "Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG, PNG ou GIF" 
        });
      }

      // Limitar tamanho do arquivo (10MB)
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "Arquivo muito grande. Máximo 10MB" });
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const fileName = `client-${clientId}-${timestamp}${extension}`;
      const bucketPath = `clients/${clientId}/${fileName}`;

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('documents')
        .upload(bucketPath, file.buffer, {
          contentType: file.mimetype,
          duplex: 'half'
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return res.status(500).json({ message: "Erro ao fazer upload do arquivo" });
      }

      // Obter URL pública do arquivo
      const { data: urlData } = supabaseAdmin.storage
        .from('documents')
        .getPublicUrl(bucketPath);

      // Salvar registro no banco de dados
      const [document] = await db.insert(clientDocuments).values({
        clientId: clientIdNum,
        fileName,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storageUrl: urlData.publicUrl,
        uploadedBy: userId
      }).returning();

      res.status(201).json({
        message: "Documento enviado com sucesso",
        document
      });

    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  /**
   * GET /api/clients/:id/documents
   * Get all documents for a client
   */
  app.get("/api/clients/:id/documents", isAuthenticated, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();

      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID do cliente inválido" });
      }

      // Verificar se cliente existe e pertence ao usuário
      const client = await storage.getClient(clientId);
      if (!client || client.userId !== userId) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      // Buscar documentos do cliente
      const documents = await db.select()
        .from(clientDocuments)
        .where(eq(clientDocuments.clientId, clientId))
        .orderBy(desc(clientDocuments.uploadedAt));

      res.json({ documents });

    } catch (error) {
      console.error("Error fetching client documents:", error);
      res.status(500).json({ 
        message: "Erro ao buscar documentos", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  /**
   * DELETE /api/clients/documents/:id
   * Delete a client document
   */
  app.delete("/api/clients/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const userId = req.session.user.id.toString();

      if (isNaN(documentId)) {
        return res.status(400).json({ message: "ID do documento inválido" });
      }

      // Buscar documento
      const [document] = await db.select()
        .from(clientDocuments)
        .where(eq(clientDocuments.id, documentId));

      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }

      // Verificar se cliente pertence ao usuário
      const client = await storage.getClient(document.clientId);
      if (!client || client.userId !== userId) {
        return res.status(403).json({ message: "Sem permissão para deletar este documento" });
      }

      // Deletar do Supabase Storage se configurado
      if (supabaseAdmin) {
        const urlParts = document.storageUrl.split('/');
        const bucketPath = urlParts.slice(-3).join('/'); // clients/{clientId}/{fileName}

        const { error: storageError } = await supabaseAdmin.storage
          .from('documents')
          .remove([bucketPath]);

        if (storageError) {
          console.error("Supabase storage delete error:", storageError);
          // Continue mesmo se o storage falhar (arquivo pode já ter sido deletado)
        }
      }

      // Deletar registro do banco
      await db.delete(clientDocuments)
        .where(eq(clientDocuments.id, documentId));

      res.json({ message: "Documento deletado com sucesso" });

    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ 
        message: "Erro ao deletar documento", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Removido createServer pois não é necessário aqui
}
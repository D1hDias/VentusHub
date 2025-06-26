import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, setupAuthRoutes, isAuthenticated } from "./auth";
import { insertPropertySchema, insertProposalSchema, insertContractSchema, insertTimelineEntrySchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { documents as propertyDocuments } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth middleware
  setupAuth(app);
  
  // Setup auth routes
  setupAuthRoutes(app);

  // Property routes
  app.get("/api/properties", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.session.user.id);
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
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Ensure user owns this property
      if (property.userId !== parseInt(req.session.user.id)) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", isAuthenticated, async (req: any, res) => {
    console.log("=== DADOS RECEBIDOS ===");
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("User ID:", req.session.user.id);
    console.log("========================");

    try {
      const userId = parseInt(req.session.user.id);
      
      // Validar dados da propriedade
      const propertyData = {
        userId,
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
        status: "captacao",
        currentStage: 1,
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
            rg: owner.rg,
            birthDate: owner.birthDate,
            maritalStatus: owner.maritalStatus,
            fatherName: owner.fatherName,
            motherName: owner.motherName,
            phone: owner.phone,
            email: owner.email,
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

  app.patch("/api/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      
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
      const userId = parseInt(req.session.user.id);
      
      console.log("=== GET DOCUMENTS API ===");
      console.log("Property ID:", propertyId);
      console.log("User ID:", userId);
      
      // Check ownership
      const property = await storage.getProperty(propertyId);
      if (!property || property.userId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }

      const documents = await storage.getPropertyDocuments(propertyId);
      console.log("Documents from DB:", documents);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Rota para deletar documento
  app.delete("/api/property-documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      console.log("=== DELETE DOCUMENT API ===");
      console.log("Document ID:", req.params.id);
      console.log("User ID:", req.session.user.id);
      
      const documentId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      
      // Buscar o documento
      const document = await storage.getDocument(documentId);
      console.log("Document found:", document);
      
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      
      // Verificar se o usuário é dono da propriedade
      const property = await storage.getProperty(document.propertyId);
      if (!property || property.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // CONFIRMAR ANTES DE DELETAR
      console.log("ANTES DE DELETAR - Documentos da propriedade:", await storage.getPropertyDocuments(document.propertyId));

      // Deletar do banco de dados
      await storage.deleteDocument(documentId);
      console.log("Document deleted successfully");
      
      // CONFIRMAR DEPOIS DE DELETAR
      console.log("DEPOIS DE DELETAR - Documentos da propriedade:", await storage.getPropertyDocuments(document.propertyId));
      
      res.json({ message: "Documento deletado com sucesso" });
      
    } catch (error: any) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Erro ao deletar documento", error: error.message });
    }
  });

  // Rota para servir documentos via proxy (URL mascarada)
  app.get("/api/documents/:id/view", isAuthenticated, async (req: any, res) => {
    try {
      console.log("=== SERVE DOCUMENT DEBUG ===");
      console.log("Document ID:", req.params.id);
      
      const documentId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      
      // Buscar o documento
      const document = await storage.getDocument(documentId);
      console.log("Document found:", document?.name);
      
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      
      // Verificar se o usuário é dono da propriedade
      const property = await storage.getProperty(document.propertyId);
      if (!property || property.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      console.log("Proxying document from Supabase...");

      // Fazer fetch do Supabase
      const supabaseResponse = await fetch(document.url);
      
      if (!supabaseResponse.ok) {
        console.log("Supabase error:", supabaseResponse.status);
        return res.status(404).json({ message: "Arquivo não encontrado no storage" });
      }

      // Obter o conteúdo como ArrayBuffer
      const arrayBuffer = await supabaseResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log("File size:", buffer.length, "bytes");

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
      const userId = parseInt(req.session.user.id);
      
      // Mesma validação...
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      
      const property = await storage.getProperty(document.propertyId);
      if (!property || property.userId !== userId) {
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
      const userId = parseInt(req.session.user.id);
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/dashboard/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.session.user.id);
      const recent = await storage.getRecentTransactions(userId);
      res.json(recent);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });

  // Adicione esta route no server/routes.ts
  app.post("/api/property-documents", isAuthenticated, async (req: any, res) => {
    try {
      console.log("=== PROPERTY-DOCUMENTS REQUEST ===");
      console.log("Body:", JSON.stringify(req.body, null, 2));
      console.log("User:", req.session.user);
      console.log("===================================");

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
      
      if (property.userId !== parseInt(req.session.user.id)) {
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

      console.log("Documento salvo:", document[0]);
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

  const httpServer = createServer(app);
  return httpServer;
}
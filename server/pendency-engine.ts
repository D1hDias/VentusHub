/**
 * PENDENCY VALIDATION ENGINE
 * 
 * Comprehensive validation system for property stage requirements
 * with configurable rules, automatic pendency detection, and
 * real-time completion calculations.
 */

import { db } from "./db.js";
import { 
  properties, 
  stageRequirements, 
  propertyRequirements, 
  stageCompletionMetrics,
  stageAdvancementLog,
  pendencyNotifications,
  documents,
  propertyOwners,
  type PendencyValidationResult,
  type StageAdvancement 
} from "../shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

// ======================================
// STAGE REQUIREMENT DEFINITIONS
// ======================================

export interface StageRequirementDefinition {
  stageId: number;
  requirementKey: string;
  requirementName: string;
  description: string;
  category: 'DOCUMENT' | 'DATA' | 'VALIDATION' | 'APPROVAL';
  isCritical: boolean;
  validationRules: Record<string, any>;
  propertyTypes: string; // '*' for all, or 'apartamento,casa'
  autoValidation?: (propertyId: number) => Promise<{
    status: 'PENDING' | 'COMPLETED' | 'NOT_APPLICABLE' | 'FAILED';
    completionPercentage: number;
    validationData?: Record<string, any>;
    notes?: string;
  }>;
}

// Default stage requirements for all property types
export const DEFAULT_STAGE_REQUIREMENTS: StageRequirementDefinition[] = [
  // ======= STAGE 1: CAPTAÇÃO =======
  {
    stageId: 1,
    requirementKey: 'PROPERTY_BASIC_INFO',
    requirementName: 'Informações Básicas do Imóvel',
    description: 'Dados essenciais: tipo, endereço, valor, área',
    category: 'DATA',
    isCritical: true,
    validationRules: { 
      requiredFields: ['type', 'street', 'number', 'neighborhood', 'city', 'state', 'cep', 'value'],
      minValue: 1000
    },
    propertyTypes: '*',
    autoValidation: async (propertyId: number) => {
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length) return { status: 'FAILED', completionPercentage: 0 };
      
      const p = property[0];
      const requiredFields = ['type', 'street', 'number', 'neighborhood', 'city', 'state', 'cep', 'value'];
      const completedFields = requiredFields.filter(field => p[field as keyof typeof p] != null);
      const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
      
      return {
        status: completionPercentage === 100 ? 'COMPLETED' : 'PENDING',
        completionPercentage,
        validationData: { completedFields, missingFields: requiredFields.filter(f => !completedFields.includes(f)) }
      };
    }
  },
  {
    stageId: 1,
    requirementKey: 'PROPERTY_OWNERS',
    requirementName: 'Proprietários Cadastrados',
    description: 'Pelo menos um proprietário com dados completos',
    category: 'DATA',
    isCritical: true,
    validationRules: { 
      minOwners: 1,
      requiredOwnerFields: ['fullName', 'cpf', 'phone']
    },
    propertyTypes: '*',
    autoValidation: async (propertyId: number) => {
      const owners = await db.select().from(propertyOwners).where(eq(propertyOwners.propertyId, propertyId));
      
      if (owners.length === 0) {
        return { status: 'PENDING', completionPercentage: 0, notes: 'Nenhum proprietário cadastrado' };
      }
      
      const requiredFields = ['fullName', 'cpf', 'phone'];
      let totalFields = 0;
      let completedFields = 0;
      
      owners.forEach(owner => {
        requiredFields.forEach(field => {
          totalFields++;
          if (owner[field as keyof typeof owner]) completedFields++;
        });
      });
      
      const completionPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
      
      return {
        status: completionPercentage >= 80 ? 'COMPLETED' : 'PENDING',
        completionPercentage,
        validationData: { ownersCount: owners.length, completedFields, totalFields }
      };
    }
  },
  {
    stageId: 1,
    requirementKey: 'PROPERTY_REGISTRATION',
    requirementName: 'Números de Registro',
    description: 'IPTU e inscrição municipal obrigatórios',
    category: 'DATA',
    isCritical: true,
    validationRules: { 
      requiredFields: ['registrationNumber', 'municipalRegistration']
    },
    propertyTypes: '*',
    autoValidation: async (propertyId: number) => {
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length) return { status: 'FAILED', completionPercentage: 0 };
      
      const p = property[0];
      const hasRegistration = !!p.registrationNumber;
      const hasMunicipal = !!p.municipalRegistration;
      const completionPercentage = ((hasRegistration ? 1 : 0) + (hasMunicipal ? 1 : 0)) * 50;
      
      return {
        status: completionPercentage === 100 ? 'COMPLETED' : 'PENDING',
        completionPercentage,
        validationData: { hasRegistration, hasMunicipal }
      };
    }
  },

  // ======= STAGE 2: DUE DILIGENCE =======
  {
    stageId: 2,
    requirementKey: 'PROPERTY_DOCUMENTS',
    requirementName: 'Documentos Básicos',
    description: 'Matrícula, IPTU, certidões básicas',
    category: 'DOCUMENT',
    isCritical: true,
    validationRules: { 
      requiredDocTypes: ['MATRICULA', 'IPTU', 'CERTIDAO_NEGATIVA'],
      minDocuments: 3
    },
    propertyTypes: '*',
    autoValidation: async (propertyId: number) => {
      const docs = await db.select().from(documents).where(eq(documents.propertyId, propertyId));
      
      const requiredTypes = ['MATRICULA', 'IPTU', 'CERTIDAO_NEGATIVA'];
      const availableTypes = [...new Set(docs.map(d => d.type?.toUpperCase() || 'OUTROS'))];
      const hasRequiredDocs = requiredTypes.filter(type => availableTypes.includes(type));
      const completionPercentage = Math.round((hasRequiredDocs.length / requiredTypes.length) * 100);
      
      return {
        status: completionPercentage >= 80 ? 'COMPLETED' : 'PENDING',
        completionPercentage,
        validationData: { 
          totalDocs: docs.length, 
          hasRequiredDocs, 
          missingDocs: requiredTypes.filter(t => !hasRequiredDocs.includes(t))
        }
      };
    }
  },
  {
    stageId: 2,
    requirementKey: 'LEGAL_VALIDATION',
    requirementName: 'Validação Jurídica',
    description: 'Análise de documentos e situação legal',
    category: 'VALIDATION',
    isCritical: true,
    validationRules: { 
      requiresManualApproval: true 
    },
    propertyTypes: '*'
  },
  {
    stageId: 2,
    requirementKey: 'TECHNICAL_EVALUATION',
    requirementName: 'Avaliação Técnica',
    description: 'Vistoria técnica e avaliação de valor',
    category: 'VALIDATION',
    isCritical: false,
    validationRules: { 
      requiresManualApproval: true 
    },
    propertyTypes: '*'
  },

  // ======= STAGE 3: MERCADO =======
  {
    stageId: 3,
    requirementKey: 'MARKET_PRICE',
    requirementName: 'Precificação de Mercado',
    description: 'Valor de mercado definido e aprovado',
    category: 'VALIDATION',
    isCritical: true,
    validationRules: { 
      requiresApproval: true,
      minValue: 50000
    },
    propertyTypes: '*'
  },
  {
    stageId: 3,
    requirementKey: 'MARKETING_MATERIAL',
    requirementName: 'Material de Marketing',
    description: 'Fotos, descrição e material promocional',
    category: 'DOCUMENT',
    isCritical: false,
    validationRules: { 
      minPhotos: 5 
    },
    propertyTypes: '*'
  },
  {
    stageId: 3,
    requirementKey: 'LISTING_APPROVAL',
    requirementName: 'Aprovação para Listagem',
    description: 'Autorização final para exposição no mercado',
    category: 'APPROVAL',
    isCritical: true,
    validationRules: { 
      requiresManagerApproval: true 
    },
    propertyTypes: '*'
  },

  // ======= STAGE 4: PROPOSTAS =======
  {
    stageId: 4,
    requirementKey: 'PROPOSAL_ANALYSIS',
    requirementName: 'Análise de Propostas',
    description: 'Avaliação e validação das propostas recebidas',
    category: 'VALIDATION',
    isCritical: true,
    validationRules: { 
      requiresApproval: true 
    },
    propertyTypes: '*'
  },
  {
    stageId: 4,
    requirementKey: 'BUYER_QUALIFICATION',
    requirementName: 'Qualificação do Comprador',
    description: 'Verificação da capacidade financeira do comprador',
    category: 'VALIDATION',
    isCritical: true,
    validationRules: { 
      requiresCreditCheck: true 
    },
    propertyTypes: '*'
  },

  // ======= STAGE 5: CONTRATOS =======
  {
    stageId: 5,
    requirementKey: 'CONTRACT_DRAFT',
    requirementName: 'Minuta de Contrato',
    description: 'Elaboração da minuta contratual',
    category: 'DOCUMENT',
    isCritical: true,
    validationRules: { 
      requiresLegalReview: true 
    },
    propertyTypes: '*'
  },
  {
    stageId: 5,
    requirementKey: 'PARTIES_APPROVAL',
    requirementName: 'Aprovação das Partes',
    description: 'Acordo e assinatura de vendedor e comprador',
    category: 'APPROVAL',
    isCritical: true,
    validationRules: { 
      requiresBothParties: true 
    },
    propertyTypes: '*'
  },

  // ======= STAGE 6: FINANCIAMENTO =======
  {
    stageId: 6,
    requirementKey: 'FINANCING_DOCS',
    requirementName: 'Documentos para Financiamento',
    description: 'Documentação completa para análise bancária',
    category: 'DOCUMENT',
    isCritical: true,
    validationRules: { 
      requiredDocs: ['RG', 'CPF', 'COMPROVANTE_RENDA', 'COMPROVANTE_RESIDENCIA']
    },
    propertyTypes: '*'
  },
  {
    stageId: 6,
    requirementKey: 'BANK_APPROVAL',
    requirementName: 'Aprovação Bancária',
    description: 'Financiamento aprovado pela instituição financeira',
    category: 'APPROVAL',
    isCritical: true,
    validationRules: { 
      requiresBankApproval: true 
    },
    propertyTypes: '*'
  },

  // ======= STAGE 7: INSTRUMENTO =======
  {
    stageId: 7,
    requirementKey: 'DEED_PREPARATION',
    requirementName: 'Preparação da Escritura',
    description: 'Elaboração da escritura pública',
    category: 'DOCUMENT',
    isCritical: true,
    validationRules: { 
      requiresNotary: true 
    },
    propertyTypes: '*'
  },
  {
    stageId: 7,
    requirementKey: 'FINAL_PAYMENT',
    requirementName: 'Pagamento Final',
    description: 'Liquidação financeira da transação',
    category: 'VALIDATION',
    isCritical: true,
    validationRules: { 
      requiresPaymentConfirmation: true 
    },
    propertyTypes: '*'
  },

  // ======= STAGE 8: CONCLUÍDO =======
  {
    stageId: 8,
    requirementKey: 'REGISTRY_TRANSFER',
    requirementName: 'Transferência de Registro',
    description: 'Registro da transferência no cartório',
    category: 'DOCUMENT',
    isCritical: true,
    validationRules: { 
      requiresRegistryOffice: true 
    },
    propertyTypes: '*'
  },
  {
    stageId: 8,
    requirementKey: 'TRANSACTION_CLOSURE',
    requirementName: 'Fechamento da Transação',
    description: 'Finalização completa do processo',
    category: 'APPROVAL',
    isCritical: true,
    validationRules: { 
      requiresFinalApproval: true 
    },
    propertyTypes: '*'
  }
];

// ======================================
// PENDENCY VALIDATION ENGINE
// ======================================

export class PendencyValidationEngine {
  /**
   * Initialize property requirements for a new property
   */
  static async initializePropertyRequirements(propertyId: number, propertyType: string): Promise<void> {
    try {
      // Get applicable requirements for property type
      const applicableRequirements = await this.getApplicableRequirements(propertyType);
      
      // Create property requirements entries
      const requirementEntries = applicableRequirements.map(req => ({
        propertyId,
        requirementId: req.id,
        stageId: req.stageId,
        status: 'PENDING' as const,
        completionPercentage: 0,
        lastCheckedAt: new Date()
      }));
      
      if (requirementEntries.length > 0) {
        await db.insert(propertyRequirements).values(requirementEntries);
      }
      
      // Initialize completion metrics for all stages
      await this.updateStageCompletionMetrics(propertyId);
      
    } catch (error) {
      console.error('Error initializing property requirements:', error);
      throw error;
    }
  }

  /**
   * Get applicable requirements for a property type
   */
  static async getApplicableRequirements(propertyType: string) {
    return await db.select()
      .from(stageRequirements)
      .where(
        sql`${stageRequirements.propertyTypes} = '*' OR ${stageRequirements.propertyTypes} LIKE ${`%${propertyType}%`}`
      );
  }

  /**
   * Validate property requirements for a specific stage
   */
  static async validateStageRequirements(
    propertyId: number, 
    stageId: number
  ): Promise<PendencyValidationResult> {
    try {
      // Get property details
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length) {
        throw new Error('Property not found');
      }

      // Get stage requirements
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

      // Run auto-validations
      await this.runAutoValidations(propertyId, requirements);

      // Calculate completion metrics
      const totalRequirements = requirements.length;
      const completedRequirements = requirements.filter(r => 
        r.propertyRequirement?.status === 'COMPLETED'
      ).length;
      const criticalRequirements = requirements.filter(r => r.requirement.isCritical).length;
      const completedCritical = requirements.filter(r => 
        r.requirement.isCritical && r.propertyRequirement?.status === 'COMPLETED'
      ).length;
      
      const completionPercentage = totalRequirements > 0 
        ? Math.round((completedRequirements / totalRequirements) * 100) 
        : 100;
      const criticalCompletionPercentage = criticalRequirements > 0 
        ? Math.round((completedCritical / criticalRequirements) * 100) 
        : 100;

      // Identify blocking requirements
      const blockingRequirements = requirements
        .filter(r => 
          r.requirement.isCritical && 
          (!r.propertyRequirement || r.propertyRequirement.status !== 'COMPLETED')
        )
        .map(r => ({
          id: r.requirement.id,
          requirementKey: r.requirement.requirementKey,
          requirementName: r.requirement.requirementName,
          category: r.requirement.category,
          status: r.propertyRequirement?.status || 'PENDING',
          notes: r.propertyRequirement?.notes || undefined
        }));

      const canAdvance = blockingRequirements.length === 0 && criticalCompletionPercentage >= 90;

      // Generate warnings
      const warnings: string[] = [];
      if (completionPercentage < 100) {
        warnings.push(`${totalRequirements - completedRequirements} pendências restantes`);
      }
      if (criticalCompletionPercentage < 100) {
        warnings.push(`${criticalRequirements - completedCritical} pendências críticas restantes`);
      }

      const result: PendencyValidationResult = {
        canAdvance,
        totalRequirements,
        completedRequirements,
        criticalRequirements,
        completedCritical,
        completionPercentage,
        criticalCompletionPercentage,
        blockingRequirements,
        warnings: warnings.length > 0 ? warnings : undefined
      };

      // Update cached metrics
      await this.updateStageCompletionMetrics(propertyId, stageId, result);

      return result;

    } catch (error) {
      console.error('Error validating stage requirements:', error);
      throw error;
    }
  }

  /**
   * Run automatic validations for requirements that support it
   */
  static async runAutoValidations(
    propertyId: number, 
    requirements: Array<{
      requirement: any;
      propertyRequirement: any;
    }>
  ): Promise<void> {
    const autoValidationPromises = requirements.map(async ({ requirement, propertyRequirement }) => {
      // Find the auto-validation function
      const definitionReq = DEFAULT_STAGE_REQUIREMENTS.find(
        def => def.requirementKey === requirement.requirementKey
      );
      
      if (definitionReq?.autoValidation) {
        try {
          const validationResult = await definitionReq.autoValidation(propertyId);
          
          // Update or create property requirement
          if (propertyRequirement) {
            await db.update(propertyRequirements)
              .set({
                status: validationResult.status,
                completionPercentage: validationResult.completionPercentage,
                validationData: validationResult.validationData || {},
                notes: validationResult.notes,
                lastCheckedAt: new Date(),
                updatedAt: new Date()
              })
              .where(eq(propertyRequirements.id, propertyRequirement.id));
          } else {
            await db.insert(propertyRequirements).values({
              propertyId,
              requirementId: requirement.id,
              stageId: requirement.stageId,
              status: validationResult.status,
              completionPercentage: validationResult.completionPercentage,
              validationData: validationResult.validationData || {},
              notes: validationResult.notes,
              lastCheckedAt: new Date()
            });
          }
        } catch (error) {
          console.error(`Error in auto-validation for ${requirement.requirementKey}:`, error);
        }
      }
    });

    await Promise.all(autoValidationPromises);
  }

  /**
   * Update cached stage completion metrics
   */
  static async updateStageCompletionMetrics(
    propertyId: number, 
    stageId?: number, 
    validationResult?: PendencyValidationResult
  ): Promise<void> {
    try {
      const stagesToUpdate = stageId ? [stageId] : [1, 2, 3, 4, 5, 6, 7, 8];
      
      for (const stage of stagesToUpdate) {
        let result = validationResult;
        if (!result || stage !== stageId) {
          result = await this.validateStageRequirements(propertyId, stage);
        }
        
        // Upsert metrics
        const existingMetric = await db.select()
          .from(stageCompletionMetrics)
          .where(
            and(
              eq(stageCompletionMetrics.propertyId, propertyId),
              eq(stageCompletionMetrics.stageId, stage)
            )
          )
          .limit(1);
        
        const metricsData = {
          totalRequirements: result.totalRequirements,
          completedRequirements: result.completedRequirements,
          criticalRequirements: result.criticalRequirements,
          completedCritical: result.completedCritical,
          completionPercentage: result.completionPercentage.toString(),
          criticalCompletionPercentage: result.criticalCompletionPercentage.toString(),
          canAdvance: result.canAdvance,
          blockingRequirements: result.blockingRequirements.length,
          lastUpdated: new Date()
        };
        
        if (existingMetric.length > 0) {
          await db.update(stageCompletionMetrics)
            .set(metricsData)
            .where(
              and(
                eq(stageCompletionMetrics.propertyId, propertyId),
                eq(stageCompletionMetrics.stageId, stage)
              )
            );
        } else {
          await db.insert(stageCompletionMetrics).values({
            propertyId,
            stageId: stage,
            ...metricsData
          });
        }
      }
    } catch (error) {
      console.error('Error updating stage completion metrics:', error);
    }
  }

  /**
   * Advance property to next stage with validation
   */
  static async advancePropertyStage(
    propertyId: number,
    advancement: StageAdvancement,
    userId: string
  ): Promise<{
    success: boolean;
    newStage: number;
    validationResult: PendencyValidationResult;
    message: string;
  }> {
    try {
      // Get current property
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length) {
        throw new Error('Property not found');
      }

      const currentStage = property[0].currentStage;
      const targetStage = advancement.toStage;

      // Validate current stage before advancement
      const validationResult = await this.validateStageRequirements(propertyId, currentStage);

      let canAdvance = false;
      let message = '';

      if (advancement.advancementType === 'OVERRIDE') {
        if (!advancement.overrideReason) {
          throw new Error('Override reason is required for manual override');
        }
        canAdvance = true;
        message = `Stage advanced with override: ${advancement.overrideReason}`;
      } else if (advancement.advancementType === 'AUTOMATIC') {
        canAdvance = validationResult.canAdvance;
        message = canAdvance 
          ? 'Stage advanced automatically - all requirements met'
          : 'Cannot advance automatically - blocking requirements exist';
      } else {
        // MANUAL advancement - allow with warnings
        canAdvance = true;
        message = validationResult.canAdvance 
          ? 'Stage advanced manually - all requirements met'
          : 'Stage advanced manually with pending requirements';
      }

      if (!canAdvance && advancement.advancementType !== 'OVERRIDE') {
        return {
          success: false,
          newStage: currentStage,
          validationResult,
          message: 'Cannot advance - critical requirements not met. Use override if necessary.'
        };
      }

      // Update property stage
      await db.update(properties)
        .set({
          currentStage: targetStage,
          updatedAt: new Date()
        })
        .where(eq(properties.id, propertyId));

      // Log advancement
      await db.insert(stageAdvancementLog).values({
        propertyId,
        fromStage: currentStage,
        toStage: targetStage,
        userId,
        advancementType: advancement.advancementType,
        validationStatus: canAdvance ? 'PASSED' : 'OVERRIDDEN',
        pendingCriticalCount: validationResult.criticalRequirements - validationResult.completedCritical,
        pendingNonCriticalCount: validationResult.totalRequirements - validationResult.completedRequirements - (validationResult.criticalRequirements - validationResult.completedCritical),
        completionPercentage: validationResult.completionPercentage.toString(),
        validationResults: validationResult,
        overrideReason: advancement.overrideReason,
        metadata: advancement.metadata
      });

      // Update metrics for new stage
      await this.updateStageCompletionMetrics(propertyId);

      return {
        success: true,
        newStage: targetStage,
        validationResult,
        message
      };

    } catch (error) {
      console.error('Error advancing property stage:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive pendency summary for a property
   */
  static async getPropertyPendencySummary(propertyId: number): Promise<{
    currentStage: number;
    stageMetrics: Array<{
      stageId: number;
      stageName: string;
      totalRequirements: number;
      completedRequirements: number;
      completionPercentage: number;
      canAdvance: boolean;
      blockingCount: number;
    }>;
    recentActivity: any[];
    criticalPendencies: any[];
  }> {
    try {
      // Get property current stage
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length) {
        throw new Error('Property not found');
      }

      const currentStage = property[0].currentStage;

      // Get metrics for all stages
      const metrics = await db.select()
        .from(stageCompletionMetrics)
        .where(eq(stageCompletionMetrics.propertyId, propertyId));

      const stageNames = [
        '', 'Captação', 'Due Diligence', 'Mercado', 'Propostas', 
        'Contratos', 'Financiamento', 'Instrumento', 'Concluído'
      ];

      const stageMetrics = metrics.map(metric => ({
        stageId: metric.stageId,
        stageName: stageNames[metric.stageId] || `Stage ${metric.stageId}`,
        totalRequirements: metric.totalRequirements,
        completedRequirements: metric.completedRequirements,
        completionPercentage: parseFloat(metric.completionPercentage || '0'),
        canAdvance: metric.canAdvance,
        blockingCount: metric.blockingRequirements
      }));

      // Get recent activity
      const recentActivity = await db.select()
        .from(stageAdvancementLog)
        .where(eq(stageAdvancementLog.propertyId, propertyId))
        .orderBy(desc(stageAdvancementLog.createdAt))
        .limit(10);

      // Get critical pendencies across all stages
      const criticalPendencies = await db.select({
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
          eq(stageRequirements.isCritical, true),
          sql`(${propertyRequirements.status} != 'COMPLETED' OR ${propertyRequirements.status} IS NULL)`
        )
      );

      return {
        currentStage,
        stageMetrics,
        recentActivity,
        criticalPendencies: criticalPendencies.map(cp => ({
          stageId: cp.requirement.stageId,
          requirementName: cp.requirement.requirementName,
          category: cp.requirement.category,
          status: cp.propertyRequirement?.status || 'PENDING',
          notes: cp.propertyRequirement?.notes
        }))
      };

    } catch (error) {
      console.error('Error getting property pendency summary:', error);
      throw error;
    }
  }
}

// ======================================
// SEEDING FUNCTIONS
// ======================================

/**
 * Seed default stage requirements into database
 */
export async function seedStageRequirements(): Promise<void> {
  try {
    console.log('Seeding stage requirements...');
    
    // Check if requirements already exist
    const existingCount = await db.select().from(stageRequirements);
    if (existingCount.length > 0) {
      console.log('Stage requirements already exist, skipping seed');
      return;
    }
    
    // Insert default requirements
    for (const requirement of DEFAULT_STAGE_REQUIREMENTS) {
      const { autoValidation, ...dbRequirement } = requirement;
      await db.insert(stageRequirements).values(dbRequirement);
    }
    
    console.log(`Seeded ${DEFAULT_STAGE_REQUIREMENTS.length} stage requirements`);
  } catch (error) {
    console.error('Error seeding stage requirements:', error);
    throw error;
  }
}

/**
 * Initialize pendency tracking for existing properties
 */
export async function initializeExistingProperties(): Promise<void> {
  try {
    console.log('Initializing pendency tracking for existing properties...');
    
    // Get all properties without pendency tracking
    const propertiesWithoutTracking = await db.select()
      .from(properties)
      .leftJoin(
        propertyRequirements,
        eq(propertyRequirements.propertyId, properties.id)
      )
      .where(sql`${propertyRequirements.propertyId} IS NULL`)
      .groupBy(properties.id);
    
    console.log(`Found ${propertiesWithoutTracking.length} properties without pendency tracking`);
    
    // Initialize each property
    for (const propertyData of propertiesWithoutTracking) {
      const property = propertyData.properties;
      if (property) {
        await PendencyValidationEngine.initializePropertyRequirements(
          property.id, 
          property.type
        );
        console.log(`Initialized pendency tracking for property ${property.id}`);
      }
    }
    
    console.log('Finished initializing existing properties');
  } catch (error) {
    console.error('Error initializing existing properties:', error);
    throw error;
  }
}
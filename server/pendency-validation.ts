/**
 * VentusHub Pendency Validation Engine
 * 
 * Provides comprehensive validation logic for property pipeline stage requirements.
 * Supports configurable rules, automatic validation, and real-time compliance checking.
 * 
 * @author VentusHub Backend Architecture Expert
 * @version 1.0.0
 */

import { db } from "./db.js";
import { 
  properties, 
  stageRequirements, 
  propertyRequirements, 
  stageCompletionMetrics,
  stageAdvancementLog,
  pendencyNotifications,
  documents as propertyDocuments,
  propertyOwners,
  proposals,
  contracts
} from "../shared/schema.js";
import { eq, and, or, count, desc } from "drizzle-orm";
import type { 
  PendencyValidationResult, 
  UpdatePropertyRequirement,
  StageAdvancement 
} from "../shared/schema.js";

// ======================================
// VALIDATION RULE INTERFACES
// ======================================

interface ValidationRule {
  type: 'required_field' | 'document_uploaded' | 'min_value' | 'max_value' | 'custom_function' | 'dependent_stage';
  field?: string;
  documentType?: string;
  minValue?: number;
  maxValue?: number;
  customValidator?: string;
  dependentStage?: number;
  message?: string;
}

interface ValidationContext {
  property: any;
  propertyOwners: any[];
  documents: any[];
  proposals: any[];
  contracts: any[];
  currentRequirements: any[];
}

interface RequirementValidationResult {
  requirementId: number;
  requirementKey: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'NOT_APPLICABLE';
  completionPercentage: number;
  validationData?: Record<string, any>;
  message?: string;
  notes?: string;
}

// ======================================
// VALIDATION ENGINE CLASS
// ======================================

export class PendencyValidationEngine {
  
  /**
   * Validates all requirements for a specific property stage
   */
  async validatePropertyStage(propertyId: number, stageId: number): Promise<PendencyValidationResult> {
    try {
      // Get property data
      const property = await this.getPropertyData(propertyId);
      if (!property) {
        throw new Error(`Property ${propertyId} not found`);
      }

      // Get validation context
      const context = await this.buildValidationContext(propertyId);
      
      // Get applicable stage requirements
      const requirements = await this.getStageRequirements(stageId, property.type);
      
      // Validate each requirement
      const validationResults: RequirementValidationResult[] = [];
      
      for (const requirement of requirements) {
        const result = await this.validateRequirement(requirement, context);
        validationResults.push(result);
        
        // Update requirement status in database
        await this.updateRequirementStatus(propertyId, requirement.id, result);
      }
      
      // Calculate metrics
      const metrics = this.calculateStageMetrics(validationResults, requirements);
      
      // Update cached metrics
      await this.updateStageMetrics(propertyId, stageId, metrics);
      
      return metrics;
      
    } catch (error) {
      console.error('Error validating property stage:', error);
      throw error;
    }
  }

  /**
   * Validates if a property can advance to the next stage
   */
  async validateStageAdvancement(
    propertyId: number, 
    fromStage: number, 
    toStage: number, 
    userId: string,
    advancementType: 'AUTOMATIC' | 'MANUAL' | 'OVERRIDE' = 'MANUAL',
    overrideReason?: string
  ): Promise<{ canAdvance: boolean; validation: PendencyValidationResult; logId?: number }> {
    
    // Validate current stage requirements
    const validation = await this.validatePropertyStage(propertyId, fromStage);
    
    const canAdvance = validation.canAdvance || advancementType === 'OVERRIDE';
    
    // Log advancement attempt
    const logResult = await db.insert(stageAdvancementLog).values({
      propertyId,
      fromStage,
      toStage,
      userId,
      advancementType,
      validationStatus: canAdvance ? 
        (validation.canAdvance ? 'PASSED' : 'OVERRIDDEN') : 'FAILED',
      pendingCriticalCount: validation.criticalRequirements - validation.completedCritical,
      pendingNonCriticalCount: validation.totalRequirements - validation.completedRequirements - 
        (validation.criticalRequirements - validation.completedCritical),
      completionPercentage: validation.completionPercentage,
      validationResults: {
        blockingRequirements: validation.blockingRequirements,
        warnings: validation.warnings || [],
        timestamp: new Date().toISOString()
      },
      overrideReason: advancementType === 'OVERRIDE' ? overrideReason : null,
      metadata: {
        totalRequirements: validation.totalRequirements,
        completedRequirements: validation.completedRequirements,
        criticalRequirements: validation.criticalRequirements,
        completedCritical: validation.completedCritical
      }
    }).returning();

    // If advancement is successful, initialize requirements for next stage
    if (canAdvance && logResult[0]) {
      await this.initializeStageRequirements(propertyId, toStage);
    }

    return {
      canAdvance,
      validation,
      logId: logResult[0]?.id
    };
  }

  /**
   * Get all requirements for a stage filtered by property type
   */
  private async getStageRequirements(stageId: number, propertyType: string) {
    return await db.select()
      .from(stageRequirements)
      .where(and(
        eq(stageRequirements.stageId, stageId),
        or(
          eq(stageRequirements.propertyTypes, '*'),
          // Check if property type is in comma-separated list
          db.raw(`stage_requirements.property_types LIKE ${'%' + propertyType + '%'}`)
        )
      ))
      .orderBy(stageRequirements.isCritical, stageRequirements.requirementName);
  }

  /**
   * Build validation context with all related data
   */
  private async buildValidationContext(propertyId: number): Promise<ValidationContext> {
    const [property, owners, documents, proposalsList, contractsList, requirements] = await Promise.all([
      db.select().from(properties).where(eq(properties.id, propertyId)).limit(1),
      db.select().from(propertyOwners).where(eq(propertyOwners.propertyId, propertyId)),
      db.select().from(propertyDocuments).where(eq(propertyDocuments.propertyId, propertyId)),
      db.select().from(proposals).where(eq(proposals.propertyId, propertyId)),
      db.select().from(contracts).where(eq(contracts.propertyId, propertyId)),
      db.select().from(propertyRequirements).where(eq(propertyRequirements.propertyId, propertyId))
    ]);

    return {
      property: property[0],
      propertyOwners: owners,
      documents,
      proposals: proposalsList,
      contracts: contractsList,
      currentRequirements: requirements
    };
  }

  /**
   * Validate individual requirement using configurable rules
   */
  private async validateRequirement(
    requirement: any, 
    context: ValidationContext
  ): Promise<RequirementValidationResult> {
    
    const validationRules: ValidationRule[] = requirement.validationRules || [];
    let status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'NOT_APPLICABLE' = 'PENDING';
    let completionPercentage = 0;
    let validationData: Record<string, any> = {};
    let message = '';
    let notes = '';

    try {
      // Apply validation rules
      const ruleResults = await Promise.all(
        validationRules.map(rule => this.applyValidationRule(rule, context))
      );

      // Calculate overall status
      const passedRules = ruleResults.filter(r => r.passed).length;
      const totalRules = ruleResults.length;
      
      if (totalRules === 0) {
        // No rules defined, check for basic completion indicators
        status = await this.defaultValidation(requirement, context);
        completionPercentage = status === 'COMPLETED' ? 100 : 0;
      } else {
        completionPercentage = Math.round((passedRules / totalRules) * 100);
        
        if (passedRules === totalRules) {
          status = 'COMPLETED';
        } else if (passedRules === 0) {
          status = 'PENDING';
        } else {
          status = 'PENDING'; // Partial completion
        }
      }

      // Aggregate validation data
      validationData = {
        rulesApplied: ruleResults.length,
        rulesPassed: passedRules,
        ruleResults: ruleResults,
        lastValidated: new Date().toISOString()
      };

      // Generate message
      message = this.generateValidationMessage(requirement, status, ruleResults);

    } catch (error) {
      status = 'FAILED';
      message = `Validation error: ${error.message}`;
      validationData = { error: error.message };
    }

    return {
      requirementId: requirement.id,
      requirementKey: requirement.requirementKey,
      status,
      completionPercentage,
      validationData,
      message,
      notes
    };
  }

  /**
   * Apply individual validation rule
   */
  private async applyValidationRule(rule: ValidationRule, context: ValidationContext): Promise<{
    rule: ValidationRule;
    passed: boolean;
    message: string;
    data?: any;
  }> {
    switch (rule.type) {
      case 'required_field':
        return this.validateRequiredField(rule, context);
      
      case 'document_uploaded':
        return this.validateDocumentUploaded(rule, context);
      
      case 'min_value':
        return this.validateMinValue(rule, context);
      
      case 'max_value':
        return this.validateMaxValue(rule, context);
      
      case 'dependent_stage':
        return this.validateDependentStage(rule, context);
      
      case 'custom_function':
        return this.validateCustomFunction(rule, context);
      
      default:
        return {
          rule,
          passed: false,
          message: `Unknown validation rule type: ${rule.type}`
        };
    }
  }

  /**
   * Validate required field rule
   */
  private validateRequiredField(rule: ValidationRule, context: ValidationContext) {
    const fieldValue = this.getFieldValue(rule.field!, context);
    const passed = fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    
    return {
      rule,
      passed,
      message: passed ? `Field ${rule.field} is present` : `Field ${rule.field} is required`,
      data: { fieldValue }
    };
  }

  /**
   * Validate document uploaded rule
   */
  private validateDocumentUploaded(rule: ValidationRule, context: ValidationContext) {
    const document = context.documents.find(doc => 
      doc.type === rule.documentType || doc.name?.includes(rule.documentType!)
    );
    
    const passed = !!document;
    
    return {
      rule,
      passed,
      message: passed ? 
        `Document ${rule.documentType} found` : 
        `Document ${rule.documentType} is required`,
      data: { documentId: document?.id, documentName: document?.name }
    };
  }

  /**
   * Validate minimum value rule
   */
  private validateMinValue(rule: ValidationRule, context: ValidationContext) {
    const fieldValue = parseFloat(this.getFieldValue(rule.field!, context) || '0');
    const passed = fieldValue >= (rule.minValue || 0);
    
    return {
      rule,
      passed,
      message: passed ? 
        `${rule.field} meets minimum value` : 
        `${rule.field} must be at least ${rule.minValue}`,
      data: { fieldValue, minValue: rule.minValue }
    };
  }

  /**
   * Validate maximum value rule
   */
  private validateMaxValue(rule: ValidationRule, context: ValidationContext) {
    const fieldValue = parseFloat(this.getFieldValue(rule.field!, context) || '0');
    const passed = fieldValue <= (rule.maxValue || Infinity);
    
    return {
      rule,
      passed,
      message: passed ? 
        `${rule.field} is within maximum value` : 
        `${rule.field} must not exceed ${rule.maxValue}`,
      data: { fieldValue, maxValue: rule.maxValue }
    };
  }

  /**
   * Validate dependent stage rule
   */
  private validateDependentStage(rule: ValidationRule, context: ValidationContext) {
    const currentStage = context.property.currentStage;
    const passed = currentStage >= (rule.dependentStage || 1);
    
    return {
      rule,
      passed,
      message: passed ? 
        `Dependent stage ${rule.dependentStage} completed` : 
        `Stage ${rule.dependentStage} must be completed first`,
      data: { currentStage, dependentStage: rule.dependentStage }
    };
  }

  /**
   * Validate custom function rule
   */
  private async validateCustomFunction(rule: ValidationRule, context: ValidationContext) {
    try {
      // This would be expanded to support custom validation functions
      // For security, only allow predefined functions
      const passed = await this.executeCustomValidator(rule.customValidator!, context);
      
      return {
        rule,
        passed,
        message: passed ? 'Custom validation passed' : 'Custom validation failed'
      };
    } catch (error) {
      return {
        rule,
        passed: false,
        message: `Custom validation error: ${error.message}`
      };
    }
  }

  /**
   * Default validation when no rules are specified
   */
  private async defaultValidation(requirement: any, context: ValidationContext): Promise<'COMPLETED' | 'PENDING'> {
    // Basic validation based on requirement category
    switch (requirement.category) {
      case 'DOCUMENT':
        // Check if any document exists for this property
        return context.documents.length > 0 ? 'COMPLETED' : 'PENDING';
      
      case 'DATA':
        // Check if basic property data is complete
        const property = context.property;
        const hasBasicData = property.value && property.street && property.city;
        return hasBasicData ? 'COMPLETED' : 'PENDING';
      
      case 'VALIDATION':
        // Default to pending for validation requirements
        return 'PENDING';
      
      case 'APPROVAL':
        // Default to pending for approval requirements
        return 'PENDING';
      
      default:
        return 'PENDING';
    }
  }

  /**
   * Calculate stage completion metrics
   */
  private calculateStageMetrics(
    validationResults: RequirementValidationResult[], 
    requirements: any[]
  ): PendencyValidationResult {
    
    const totalRequirements = requirements.length;
    const completedRequirements = validationResults.filter(r => r.status === 'COMPLETED').length;
    const criticalRequirements = requirements.filter(r => r.isCritical).length;
    const completedCritical = validationResults.filter(r => 
      r.status === 'COMPLETED' && 
      requirements.find(req => req.id === r.requirementId)?.isCritical
    ).length;
    
    const completionPercentage = totalRequirements > 0 ? 
      Math.round((completedRequirements / totalRequirements) * 100) : 100;
    
    const criticalCompletionPercentage = criticalRequirements > 0 ? 
      Math.round((completedCritical / criticalRequirements) * 100) : 100;
    
    const blockingRequirements = validationResults
      .filter(r => {
        const requirement = requirements.find(req => req.id === r.requirementId);
        return requirement?.isCritical && r.status !== 'COMPLETED';
      })
      .map(r => {
        const requirement = requirements.find(req => req.id === r.requirementId);
        return {
          id: r.requirementId,
          requirementKey: r.requirementKey,
          requirementName: requirement?.requirementName || r.requirementKey,
          category: requirement?.category || 'UNKNOWN',
          status: r.status,
          notes: r.notes
        };
      });
    
    const canAdvance = blockingRequirements.length === 0;
    
    const warnings: string[] = [];
    if (criticalCompletionPercentage < 100) {
      warnings.push(`${criticalRequirements - completedCritical} critical requirements pending`);
    }
    if (completionPercentage < 80) {
      warnings.push(`Only ${completionPercentage}% of requirements completed`);
    }

    return {
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
  }

  /**
   * Update requirement status in database
   */
  private async updateRequirementStatus(
    propertyId: number, 
    requirementId: number, 
    result: RequirementValidationResult
  ) {
    await db.insert(propertyRequirements)
      .values({
        propertyId,
        requirementId,
        stageId: await this.getRequirementStage(requirementId),
        status: result.status,
        completionPercentage: result.completionPercentage,
        validationData: result.validationData,
        notes: result.notes,
        lastCheckedAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [propertyRequirements.propertyId, propertyRequirements.requirementId],
        set: {
          status: result.status,
          completionPercentage: result.completionPercentage,
          validationData: result.validationData,
          notes: result.notes,
          lastCheckedAt: new Date(),
          updatedAt: new Date()
        }
      });
  }

  /**
   * Update cached stage metrics
   */
  private async updateStageMetrics(
    propertyId: number, 
    stageId: number, 
    metrics: PendencyValidationResult
  ) {
    await db.insert(stageCompletionMetrics)
      .values({
        propertyId,
        stageId,
        totalRequirements: metrics.totalRequirements,
        completedRequirements: metrics.completedRequirements,
        criticalRequirements: metrics.criticalRequirements,
        completedCritical: metrics.completedCritical,
        completionPercentage: metrics.completionPercentage,
        criticalCompletionPercentage: metrics.criticalCompletionPercentage,
        canAdvance: metrics.canAdvance,
        blockingRequirements: metrics.blockingRequirements.length,
        lastUpdated: new Date()
      })
      .onConflictDoUpdate({
        target: [stageCompletionMetrics.propertyId, stageCompletionMetrics.stageId],
        set: {
          totalRequirements: metrics.totalRequirements,
          completedRequirements: metrics.completedRequirements,
          criticalRequirements: metrics.criticalRequirements,
          completedCritical: metrics.completedCritical,
          completionPercentage: metrics.completionPercentage,
          criticalCompletionPercentage: metrics.criticalCompletionPercentage,
          canAdvance: metrics.canAdvance,
          blockingRequirements: metrics.blockingRequirements.length,
          lastUpdated: new Date()
        }
      });
  }

  /**
   * Initialize requirements for a new stage
   */
  private async initializeStageRequirements(propertyId: number, stageId: number) {
    const property = await this.getPropertyData(propertyId);
    if (!property) return;

    const requirements = await this.getStageRequirements(stageId, property.type);
    
    for (const requirement of requirements) {
      await db.insert(propertyRequirements)
        .values({
          propertyId,
          requirementId: requirement.id,
          stageId,
          status: 'PENDING'
        })
        .onConflictDoNothing();
    }
  }

  /**
   * Helper methods
   */
  private async getPropertyData(propertyId: number) {
    const result = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
    return result[0] || null;
  }

  private async getRequirementStage(requirementId: number): Promise<number> {
    const result = await db.select({ stageId: stageRequirements.stageId })
      .from(stageRequirements)
      .where(eq(stageRequirements.id, requirementId))
      .limit(1);
    return result[0]?.stageId || 1;
  }

  private getFieldValue(fieldPath: string, context: ValidationContext): any {
    const pathParts = fieldPath.split('.');
    let value: any = context;
    
    for (const part of pathParts) {
      value = value?.[part];
    }
    
    return value;
  }

  private generateValidationMessage(
    requirement: any, 
    status: string, 
    ruleResults: any[]
  ): string {
    if (status === 'COMPLETED') {
      return `${requirement.requirementName} completed successfully`;
    }
    
    if (ruleResults.length === 0) {
      return `${requirement.requirementName} pending completion`;
    }
    
    const failedRules = ruleResults.filter(r => !r.passed);
    if (failedRules.length > 0) {
      return failedRules.map(r => r.message).join('; ');
    }
    
    return `${requirement.requirementName} validation in progress`;
  }

  private async executeCustomValidator(validatorName: string, context: ValidationContext): Promise<boolean> {
    // Predefined custom validators for security
    const validators: Record<string, (context: ValidationContext) => boolean> = {
      'hasOwnerDocuments': (ctx) => ctx.propertyOwners.length > 0 && ctx.documents.length > 0,
      'hasAcceptedProposal': (ctx) => ctx.proposals.some(p => p.status === 'accepted'),
      'hasSignedContract': (ctx) => ctx.contracts.some(c => c.status === 'active'),
      'valueAbove100k': (ctx) => parseFloat(ctx.property.value) > 100000,
    };
    
    const validator = validators[validatorName];
    if (!validator) {
      throw new Error(`Unknown custom validator: ${validatorName}`);
    }
    
    return validator(context);
  }

  /**
   * Get pending requirements for a property
   */
  async getPendingRequirements(propertyId: number, stageId?: number) {
    let query = db.select({
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
      stageId ? 
        eq(stageRequirements.stageId, stageId) : 
        undefined
    );

    const results = await query;
    
    return results
      .filter(r => !r.propertyRequirement || r.propertyRequirement.status !== 'COMPLETED')
      .map(r => ({
        ...r.requirement,
        currentStatus: r.propertyRequirement?.status || 'PENDING',
        completionPercentage: r.propertyRequirement?.completionPercentage || 0,
        notes: r.propertyRequirement?.notes,
        lastChecked: r.propertyRequirement?.lastCheckedAt
      }));
  }

  /**
   * Get stage completion metrics from cache
   */
  async getStageMetrics(propertyId: number, stageId: number) {
    const result = await db.select()
      .from(stageCompletionMetrics)
      .where(and(
        eq(stageCompletionMetrics.propertyId, propertyId),
        eq(stageCompletionMetrics.stageId, stageId)
      ))
      .limit(1);

    if (result.length === 0) {
      // If no cached metrics, calculate them
      return await this.validatePropertyStage(propertyId, stageId);
    }

    return {
      canAdvance: result[0].canAdvance,
      totalRequirements: result[0].totalRequirements,
      completedRequirements: result[0].completedRequirements,
      criticalRequirements: result[0].criticalRequirements,
      completedCritical: result[0].completedCritical,
      completionPercentage: parseFloat(result[0].completionPercentage),
      criticalCompletionPercentage: parseFloat(result[0].criticalCompletionPercentage),
      blockingRequirements: [], // Would need to fetch from pending requirements
      lastUpdated: result[0].lastUpdated
    };
  }
}

// Export singleton instance
export const pendencyValidator = new PendencyValidationEngine();
/**
 * DEFAULT NOTIFICATION TEMPLATES AND RULES
 * 
 * Pre-configured templates and rules for automatic notification generation
 * Covers all major user actions in the VentusHub system
 */

import { db } from './db';
import { notificationTemplates, notificationRules } from '../shared/schema';
import { eq } from 'drizzle-orm';

// ======================================
// DEFAULT NOTIFICATION TEMPLATES
// ======================================

export const defaultTemplates = [
  // PROPERTY NOTIFICATIONS
  {
    templateKey: 'property_stage_advanced',
    name: 'Propriedade Avançou de Etapa',
    category: 'property',
    titleTemplate: '🏠 Propriedade {{propertyAddress}} avançou para {{newStageName}}',
    messageTemplate: 'A propriedade {{propertyAddress}} foi promovida da etapa "{{oldStageName}}" para "{{newStageName}}". Continue acompanhando o progresso.',
    shortMessageTemplate: 'Propriedade avançou para {{newStageName}}',
    defaultType: 'success',
    defaultPriority: 2,
    defaultIconType: 'home',
    autoExpireDays: 30
  },
  {
    templateKey: 'property_created',
    name: 'Nova Propriedade Cadastrada',
    category: 'property',
    titleTemplate: '🏠 Nova propriedade cadastrada',
    messageTemplate: 'A propriedade {{propertyAddress}} foi cadastrada com sucesso no sistema. Código: {{propertySequence}}',
    shortMessageTemplate: 'Nova propriedade: {{propertyAddress}}',
    defaultType: 'success',
    defaultPriority: 3,
    defaultIconType: 'plus-circle'
  },
  {
    templateKey: 'property_pendency_created',
    name: 'Nova Pendência Criada',
    category: 'pendency',
    titleTemplate: '⚠️ Nova pendência: {{requirementName}}',
    messageTemplate: 'Uma nova pendência foi identificada para a propriedade {{propertyAddress}}: {{requirementName}}. {{requirementDescription}}',
    shortMessageTemplate: 'Pendência: {{requirementName}}',
    defaultType: 'warning',
    defaultPriority: 2,
    defaultIconType: 'alert-triangle',
    autoExpireDays: 7
  },
  {
    templateKey: 'property_pendency_resolved',
    name: 'Pendência Resolvida',
    category: 'pendency',
    titleTemplate: '✅ Pendência resolvida: {{requirementName}}',
    messageTemplate: 'A pendência "{{requirementName}}" da propriedade {{propertyAddress}} foi resolvida com sucesso.',
    shortMessageTemplate: 'Pendência resolvida: {{requirementName}}',
    defaultType: 'success',
    defaultPriority: 3,
    defaultIconType: 'check-circle'
  },

  // CLIENT NOTIFICATIONS
  {
    templateKey: 'client_created',
    name: 'Novo Cliente Cadastrado',
    category: 'client',
    titleTemplate: '👤 Novo cliente: {{clientName}}',
    messageTemplate: 'O cliente {{clientName}} foi cadastrado com sucesso no sistema.',
    shortMessageTemplate: 'Novo cliente: {{clientName}}',
    defaultType: 'info',
    defaultPriority: 3,
    defaultIconType: 'user-plus'
  },
  {
    templateKey: 'client_note_reminder',
    name: 'Lembrete de Cliente',
    category: 'reminder',
    titleTemplate: '⏰ Lembrete: {{noteTitle}}',
    messageTemplate: 'Lembrete agendado para o cliente {{clientName}}: {{noteTitle}}. {{noteContent}}',
    shortMessageTemplate: 'Lembrete: {{clientName}}',
    defaultType: 'info',
    defaultPriority: 2,
    defaultIconType: 'bell',
    autoExpireDays: 1
  },
  {
    templateKey: 'client_meeting_scheduled',
    name: 'Reunião Agendada',
    category: 'reminder',
    titleTemplate: '📅 Reunião agendada com {{clientName}}',
    messageTemplate: 'Reunião agendada para {{meetingDate}} com {{clientName}}. Local: {{meetingLocation}}',
    shortMessageTemplate: 'Reunião: {{clientName}}',
    defaultType: 'info',
    defaultPriority: 2,
    defaultIconType: 'calendar'
  },
  {
    templateKey: 'client_call_logged',
    name: 'Ligação Registrada',
    category: 'client',
    titleTemplate: '📞 Ligação registrada para {{clientName}}',
    messageTemplate: 'Ligação de {{callDuration}} minutos registrada para {{clientName}}. Resultado: {{callResult}}',
    shortMessageTemplate: 'Ligação: {{clientName}}',
    defaultType: 'info',
    defaultPriority: 4,
    defaultIconType: 'phone'
  },

  // DOCUMENT NOTIFICATIONS
  {
    templateKey: 'document_uploaded',
    name: 'Documento Enviado',
    category: 'document',
    titleTemplate: '📄 Documento enviado: {{documentName}}',
    messageTemplate: 'O documento "{{documentName}}" foi enviado para a propriedade {{propertyAddress}}.',
    shortMessageTemplate: 'Documento: {{documentName}}',
    defaultType: 'success',
    defaultPriority: 3,
    defaultIconType: 'file-text'
  },
  {
    templateKey: 'document_approved',
    name: 'Documento Aprovado',
    category: 'document',
    titleTemplate: '✅ Documento aprovado: {{documentName}}',
    messageTemplate: 'O documento "{{documentName}}" foi aprovado para a propriedade {{propertyAddress}}.',
    shortMessageTemplate: 'Documento aprovado: {{documentName}}',
    defaultType: 'success',
    defaultPriority: 3,
    defaultIconType: 'check-circle'
  },
  {
    templateKey: 'document_rejected',
    name: 'Documento Rejeitado',
    category: 'document',
    titleTemplate: '❌ Documento rejeitado: {{documentName}}',
    messageTemplate: 'O documento "{{documentName}}" foi rejeitado para a propriedade {{propertyAddress}}. Motivo: {{rejectionReason}}',
    shortMessageTemplate: 'Documento rejeitado: {{documentName}}',
    defaultType: 'error',
    defaultPriority: 2,
    defaultIconType: 'x-circle'
  },

  // CONTRACT NOTIFICATIONS
  {
    templateKey: 'contract_generated',
    name: 'Contrato Gerado',
    category: 'property',
    titleTemplate: '📋 Contrato gerado para {{propertyAddress}}',
    messageTemplate: 'O contrato foi gerado com sucesso para a propriedade {{propertyAddress}}.',
    shortMessageTemplate: 'Contrato gerado',
    defaultType: 'success',
    defaultPriority: 2,
    defaultIconType: 'file-signature'
  },
  {
    templateKey: 'contract_signed',
    name: 'Contrato Assinado',
    category: 'property',
    titleTemplate: '✍️ Contrato assinado para {{propertyAddress}}',
    messageTemplate: 'O contrato foi assinado com sucesso para a propriedade {{propertyAddress}}. Parabéns!',
    shortMessageTemplate: 'Contrato assinado!',
    defaultType: 'success',
    defaultPriority: 1,
    defaultIconType: 'check-circle'
  },

  // SYSTEM NOTIFICATIONS
  {
    templateKey: 'system_maintenance',
    name: 'Manutenção do Sistema',
    category: 'system',
    titleTemplate: '🔧 Manutenção programada',
    messageTemplate: 'O sistema entrará em manutenção em {{maintenanceDate}}. Duração prevista: {{maintenanceDuration}}',
    shortMessageTemplate: 'Manutenção: {{maintenanceDate}}',
    defaultType: 'warning',
    defaultPriority: 2,
    defaultIconType: 'tool'
  },
  {
    templateKey: 'backup_completed',
    name: 'Backup Concluído',
    category: 'system',
    titleTemplate: '💾 Backup concluído',
    messageTemplate: 'O backup do sistema foi concluído com sucesso em {{backupDate}}.',
    shortMessageTemplate: 'Backup concluído',
    defaultType: 'success',
    defaultPriority: 5,
    defaultIconType: 'database'
  }
];

// ======================================
// DEFAULT NOTIFICATION RULES
// ======================================

export const defaultRules = [
  // PROPERTY STAGE ADVANCEMENT
  {
    ruleKey: 'property_stage_advanced_rule',
    name: 'Notificar Avanço de Etapa',
    description: 'Notifica quando uma propriedade avança de etapa',
    triggerEvents: 'property:stage_advanced',
    entityTypes: 'property',
    templateKey: 'property_stage_advanced',
    targetUsers: 'owner',
    delayMinutes: 0,
    isActive: true
  },

  // PROPERTY CREATION
  {
    ruleKey: 'property_created_rule',
    name: 'Notificar Nova Propriedade',
    description: 'Notifica quando uma nova propriedade é cadastrada',
    triggerEvents: 'property:created',
    entityTypes: 'property',
    templateKey: 'property_created',
    targetUsers: 'owner',
    delayMinutes: 0,
    isActive: true
  },

  // PENDENCY MANAGEMENT
  {
    ruleKey: 'pendency_created_rule',
    name: 'Notificar Nova Pendência',
    description: 'Notifica quando uma nova pendência é criada',
    triggerEvents: 'pendency:created',
    entityTypes: 'property',
    templateKey: 'property_pendency_created',
    targetUsers: 'owner',
    delayMinutes: 5, // Small delay to avoid spam
    throttleMinutes: 60, // Max 1 per hour for same property
    isActive: true
  },
  {
    ruleKey: 'pendency_resolved_rule',
    name: 'Notificar Pendência Resolvida',
    description: 'Notifica quando uma pendência é resolvida',
    triggerEvents: 'pendency:resolved',
    entityTypes: 'property',
    templateKey: 'property_pendency_resolved',
    targetUsers: 'owner',
    delayMinutes: 0,
    isActive: true
  },

  // CLIENT MANAGEMENT
  {
    ruleKey: 'client_created_rule',
    name: 'Notificar Novo Cliente',
    description: 'Notifica quando um novo cliente é cadastrado',
    triggerEvents: 'client:created',
    entityTypes: 'client',
    templateKey: 'client_created',
    targetUsers: 'owner',
    delayMinutes: 0,
    isActive: true
  },
  {
    ruleKey: 'client_reminder_rule',
    name: 'Notificar Lembrete de Cliente',
    description: 'Notifica quando um lembrete de cliente é agendado',
    triggerEvents: 'client_note:reminder_created',
    entityTypes: 'client_note',
    templateKey: 'client_note_reminder',
    targetUsers: 'owner',
    delayMinutes: 0,
    isActive: true
  },
  {
    ruleKey: 'client_meeting_rule',
    name: 'Notificar Reunião Agendada',
    description: 'Notifica quando uma reunião é agendada',
    triggerEvents: 'client_note:meeting_created',
    entityTypes: 'client_note',
    templateKey: 'client_meeting_scheduled',
    targetUsers: 'owner',
    delayMinutes: 0,
    isActive: true
  },
  {
    ruleKey: 'client_call_rule',
    name: 'Notificar Ligação Registrada',
    description: 'Notifica quando uma ligação é registrada',
    triggerEvents: 'client_note:call_logged',
    entityTypes: 'client_note',
    templateKey: 'client_call_logged',
    targetUsers: 'owner',
    delayMinutes: 0,
    throttleMinutes: 30, // Max 2 per hour
    isActive: true
  },

  // DOCUMENT MANAGEMENT
  {
    ruleKey: 'document_uploaded_rule',
    name: 'Notificar Documento Enviado',
    description: 'Notifica quando um documento é enviado',
    triggerEvents: 'document:uploaded',
    entityTypes: 'document',
    templateKey: 'document_uploaded',
    targetUsers: 'owner',
    delayMinutes: 0,
    isActive: true
  },
  {
    ruleKey: 'document_approved_rule',
    name: 'Notificar Documento Aprovado',
    description: 'Notifica quando um documento é aprovado',
    triggerEvents: 'document:approved',
    entityTypes: 'document',
    templateKey: 'document_approved',
    targetUsers: 'owner',
    delayMinutes: 0,
    isActive: true
  },
  {
    ruleKey: 'document_rejected_rule',
    name: 'Notificar Documento Rejeitado',
    description: 'Notifica quando um documento é rejeitado',
    triggerEvents: 'document:rejected',
    entityTypes: 'document',
    templateKey: 'document_rejected',
    targetUsers: 'owner',
    delayMinutes: 0,
    isActive: true
  },

  // CONTRACT MANAGEMENT
  {
    ruleKey: 'contract_generated_rule',
    name: 'Notificar Contrato Gerado',
    description: 'Notifica quando um contrato é gerado',
    triggerEvents: 'contract:generated',
    entityTypes: 'contract',
    templateKey: 'contract_generated',
    targetUsers: 'owner',
    delayMinutes: 0,
    isActive: true
  },
  {
    ruleKey: 'contract_signed_rule',
    name: 'Notificar Contrato Assinado',
    description: 'Notifica quando um contrato é assinado',
    triggerEvents: 'contract:signed',
    entityTypes: 'contract',
    templateKey: 'contract_signed',
    targetUsers: 'owner',
    delayMinutes: 0,
    isActive: true
  }
];

// ======================================
// STAGE NAME MAPPINGS
// ======================================

export const stageNames = {
  1: 'Captação',
  2: 'Due Diligence',
  3: 'Mercado',
  4: 'Propostas',
  5: 'Contratos',
  6: 'Financiamento',
  7: 'Instrumento',
  8: 'Concluído'
};

export const callResults = {
  'success': 'Conversa realizada',
  'no_answer': 'Não atendeu',
  'busy': 'Linha ocupada',
  'callback_requested': 'Solicitou retorno',
  'voicemail': 'Caixa postal',
  'disconnected': 'Chamada cortou'
};

// ======================================
// SETUP FUNCTIONS
// ======================================

export async function setupDefaultTemplates(): Promise<void> {
  console.log('📄 Setting up default notification templates...');

  for (const template of defaultTemplates) {
    try {
      // Check if template already exists
      const existing = await db.select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.templateKey, template.templateKey))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(notificationTemplates).values({
          templateKey: template.templateKey,
          name: template.name,
          category: template.category,
          titleTemplate: template.titleTemplate,
          messageTemplate: template.messageTemplate,
          shortMessageTemplate: template.shortMessageTemplate,
          defaultType: template.defaultType,
          defaultPriority: template.defaultPriority,
          defaultIconType: template.defaultIconType,
          autoExpireDays: template.autoExpireDays,
          isActive: true,
          allowDuplicates: true
        });

        console.log(`✅ Created template: ${template.templateKey}`);
      } else {
        console.log(`⏭️  Template already exists: ${template.templateKey}`);
      }
    } catch (error) {
      console.error(`❌ Error creating template ${template.templateKey}:`, error);
    }
  }
}

export async function setupDefaultRules(): Promise<void> {
  console.log('📋 Setting up default notification rules...');

  for (const rule of defaultRules) {
    try {
      // Check if rule already exists
      const existing = await db.select()
        .from(notificationRules)
        .where(eq(notificationRules.ruleKey, rule.ruleKey))
        .limit(1);

      if (existing.length === 0) {
        // Find template ID
        const template = await db.select()
          .from(notificationTemplates)
          .where(eq(notificationTemplates.templateKey, rule.templateKey))
          .limit(1);

        if (template.length === 0) {
          console.warn(`⚠️  Template not found for rule ${rule.ruleKey}: ${rule.templateKey}`);
          continue;
        }

        await db.insert(notificationRules).values({
          ruleKey: rule.ruleKey,
          name: rule.name,
          description: rule.description,
          triggerEvents: rule.triggerEvents,
          entityTypes: rule.entityTypes,
          templateId: template[0].id,
          targetUsers: rule.targetUsers,
          delayMinutes: rule.delayMinutes,
          throttleMinutes: rule.throttleMinutes,
          isActive: rule.isActive
        });

        console.log(`✅ Created rule: ${rule.ruleKey}`);
      } else {
        console.log(`⏭️  Rule already exists: ${rule.ruleKey}`);
      }
    } catch (error) {
      console.error(`❌ Error creating rule ${rule.ruleKey}:`, error);
    }
  }
}

export async function setupDefaultNotificationSystem(): Promise<void> {
  console.log('🔔 Setting up default notification system...');
  
  try {
    await setupDefaultTemplates();
    await setupDefaultRules();
    
    console.log('✅ Default notification system setup completed');
  } catch (error) {
    console.error('❌ Error setting up default notification system:', error);
    throw error;
  }
}
/**
 * PENDENCY CONTROL SYSTEM TYPES
 * 
 * TypeScript interfaces and types for the VentusHub
 * pendency control system frontend integration.
 */

// ======================================
// CORE INTERFACES
// ======================================

export interface StageRequirement {
  id: number;
  stageId: number;
  requirementKey: string;
  requirementName: string;
  description: string;
  category: RequirementCategory;
  isCritical: boolean;
  validationRules: Record<string, any>;
  propertyTypes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyRequirement {
  id: number;
  propertyId: number;
  requirementId: number;
  stageId: number;
  status: RequirementStatus;
  completionPercentage: number;
  validationData?: Record<string, any>;
  notes?: string;
  completedBy?: string;
  completedAt?: Date;
  lastCheckedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StageCompletionMetrics {
  id: number;
  propertyId: number;
  stageId: number;
  totalRequirements: number;
  completedRequirements: number;
  criticalRequirements: number;
  completedCritical: number;
  completionPercentage: number;
  criticalCompletionPercentage: number;
  canAdvance: boolean;
  blockingRequirements: number;
  lastUpdated: Date;
}

export interface StageAdvancementLog {
  id: number;
  propertyId: number;
  fromStage?: number;
  toStage: number;
  userId: string;
  advancementType: AdvancementType;
  validationStatus: ValidationStatus;
  pendingCriticalCount: number;
  pendingNonCriticalCount: number;
  completionPercentage: string;
  validationResults?: PendencyValidationResult;
  overrideReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface PendencyNotification {
  id: number;
  propertyId: number;
  requirementId?: number;
  userId: string;
  notificationType: PendencyNotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: Date;
  autoResolveAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ======================================
// ENUMS AND LITERALS
// ======================================

export type RequirementCategory = 'DOCUMENT' | 'DATA' | 'VALIDATION' | 'APPROVAL';

export type RequirementStatus = 'PENDING' | 'COMPLETED' | 'NOT_APPLICABLE' | 'FAILED';

export type AdvancementType = 'AUTOMATIC' | 'MANUAL' | 'OVERRIDE';

export type ValidationStatus = 'PASSED' | 'FAILED' | 'OVERRIDDEN';

export type PendencyNotificationType = 
  | 'MISSING_DOCUMENT' 
  | 'VALIDATION_FAILED' 
  | 'STAGE_BLOCKED' 
  | 'STAGE_ADVANCED'
  | 'CRITICAL_PENDENCY'
  | 'DEADLINE_WARNING'
  | 'REQUIREMENTS_UPDATED';

export type NotificationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const STAGE_NAMES: Record<number, string> = {
  1: 'Captação',
  2: 'Due Diligence', 
  3: 'Mercado',
  4: 'Propostas',
  5: 'Contratos',
  6: 'Financiamento',
  7: 'Instrumento',
  8: 'Concluído'
};

export const REQUIREMENT_CATEGORY_LABELS: Record<RequirementCategory, string> = {
  DOCUMENT: 'Documento',
  DATA: 'Dados',
  VALIDATION: 'Validação',
  APPROVAL: 'Aprovação'
};

export const REQUIREMENT_STATUS_LABELS: Record<RequirementStatus, string> = {
  PENDING: 'Pendente',
  COMPLETED: 'Concluído',
  NOT_APPLICABLE: 'Não Aplicável',
  FAILED: 'Falhado'
};

// ======================================
// REQUEST/RESPONSE INTERFACES
// ======================================

export interface PendencyValidationResult {
  canAdvance: boolean;
  totalRequirements: number;
  completedRequirements: number;
  criticalRequirements: number;
  completedCritical: number;
  completionPercentage: number;
  criticalCompletionPercentage: number;
  blockingRequirements: BlockingRequirement[];
  warnings?: string[];
}

export interface BlockingRequirement {
  id: number;
  requirementKey: string;
  requirementName: string;
  category: string;
  status: string;
  notes?: string;
}

export interface StageAdvancementRequest {
  toStage: number;
  advancementType?: AdvancementType;
  overrideReason?: string;
  metadata?: Record<string, any>;
}

export interface UpdateRequirementRequest {
  status?: RequirementStatus;
  completionPercentage?: number;
  validationData?: Record<string, any>;
  notes?: string;
  completedBy?: string;
}

export interface PropertyPendencySummary {
  currentStage: number;
  stageMetrics: StageMetric[];
  recentActivity: StageAdvancementLogWithNames[];
  criticalPendencies: CriticalPendency[];
}

export interface StageMetric {
  stageId: number;
  stageName: string;
  totalRequirements: number;
  completedRequirements: number;
  completionPercentage: number;
  canAdvance: boolean;
  blockingCount: number;
}

export interface StageAdvancementLogWithNames extends StageAdvancementLog {
  fromStageName?: string;
  toStageName: string;
}

export interface CriticalPendency {
  stageId: number;
  requirementName: string;
  category: string;
  status: string;
  notes?: string;
}

export interface StageRequirementDetails extends StageRequirement {
  status: RequirementStatus;
  completionPercentage: number;
  notes?: string;
  validationData?: Record<string, any>;
  lastCheckedAt?: Date;
  completedAt?: Date;
  completedBy?: string;
}

export interface StageRequirementsResponse {
  stageId: number;
  propertyId: number;
  validation: PendencyValidationResult;
  requirements: StageRequirementDetails[];
}

export interface StageTemplateResponse {
  stageId: number;
  stageName: string;
  requirements: StageRequirement[];
}

export interface PendencyNotificationWithContext extends PendencyNotification {
  property?: {
    sequenceNumber: string;
    address: string;
  };
  requirement?: {
    requirementName: string;
    category: string;
    isCritical: boolean;
  };
}

// ======================================
// UTILITY TYPES
// ======================================

export interface PendencyBadgeData {
  stageId: number;
  stageName: string;
  totalPendencies: number;
  criticalPendencies: number;
  completionPercentage: number;
  canAdvance: boolean;
  isBlocked: boolean;
  nextRequiredActions: string[];
}

export interface PendencyModalData {
  propertyId: number;
  propertySequenceNumber: string;
  currentStage: number;
  stageRequirements: StageRequirementDetails[];
  validationResult: PendencyValidationResult;
  recentActivity: StageAdvancementLogWithNames[];
  notifications: PendencyNotificationWithContext[];
}

export interface RequirementValidationResult {
  isValid: boolean;
  completionPercentage: number;
  validationData?: Record<string, any>;
  errors?: string[];
  warnings?: string[];
}

export interface StageAdvancementResult {
  success: boolean;
  message: string;
  previousStage?: number;
  newStage: number;
  validation: PendencyValidationResult;
}

// ======================================
// COMPONENT PROPS INTERFACES
// ======================================

export interface PendencyBadgeProps {
  propertyId: number;
  currentStage: number;
  compact?: boolean;
  onClick?: () => void;
}

export interface PendencyModalProps {
  propertyId: number;
  isOpen: boolean;
  onClose: () => void;
  onStageAdvance?: (newStage: number) => void;
  onRequirementUpdate?: (requirementId: number, status: RequirementStatus) => void;
}

export interface StageRequirementListProps {
  propertyId: number;
  stageId: number;
  requirements: StageRequirementDetails[];
  onRequirementUpdate: (requirementId: number, updates: UpdateRequirementRequest) => void;
  readonly?: boolean;
}

export interface StageAdvancementButtonProps {
  propertyId: number;
  currentStage: number;
  nextStage: number;
  validationResult: PendencyValidationResult;
  onAdvance: (advancement: StageAdvancementRequest) => Promise<void>;
  disabled?: boolean;
}

export interface PendencyTimelineProps {
  propertyId: number;
  stages: StageMetric[];
  currentStage: number;
  onStageClick?: (stageId: number) => void;
}

export interface NotificationListProps {
  notifications: PendencyNotificationWithContext[];
  onResolve: (notificationId: number) => void;
  onActionClick: (actionUrl: string) => void;
  maxItems?: number;
}

// ======================================
// HOOK INTERFACES
// ======================================

export interface UsePendencyData {
  summary: PropertyPendencySummary | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseStageRequirements {
  requirements: StageRequirementDetails[];
  validation: PendencyValidationResult | null;
  isLoading: boolean;
  error: string | null;
  updateRequirement: (requirementId: number, updates: UpdateRequirementRequest) => Promise<void>;
  validateStage: () => Promise<void>;
}

export interface UsePendencyNotifications {
  notifications: PendencyNotificationWithContext[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  resolve: (notificationId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseStageAdvancement {
  canAdvance: boolean;
  isAdvancing: boolean;
  error: string | null;
  advance: (advancement: StageAdvancementRequest) => Promise<StageAdvancementResult>;
  validateAdvancement: (toStage: number) => Promise<PendencyValidationResult>;
}

// ======================================
// API SERVICE INTERFACES
// ======================================

export interface PendencyApiService {
  // Pendency summary and validation
  getPropertyPendencies(propertyId: number): Promise<PropertyPendencySummary>;
  getStageRequirements(propertyId: number, stageId: number): Promise<StageRequirementsResponse>;
  validatePropertyRequirements(propertyId: number): Promise<PropertyPendencySummary>;
  
  // Stage management
  advancePropertyStage(propertyId: number, advancement: StageAdvancementRequest): Promise<StageAdvancementResult>;
  getStageAdvancementLog(propertyId: number): Promise<StageAdvancementLogWithNames[]>;
  
  // Requirement management
  updateRequirement(propertyId: number, requirementId: number, updates: UpdateRequirementRequest): Promise<PropertyRequirement>;
  getStageTemplates(stageId: number): Promise<StageTemplateResponse>;
  
  // Notifications
  getPendencyNotifications(limit?: number): Promise<PendencyNotificationWithContext[]>;
  getPropertyPendencyNotifications(propertyId: number): Promise<PendencyNotificationWithContext[]>;
  resolvePendencyNotification(notificationId: number): Promise<void>;
  triggerPendencyReview(propertyId: number): Promise<void>;
}

// ======================================
// VALIDATION HELPERS
// ======================================

export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any, context?: any) => boolean;
}

export interface PropertyValidationContext {
  propertyId: number;
  propertyType: string;
  currentStage: number;
  propertyData: Record<string, any>;
  documentsData: Record<string, any>;
  ownersData: any[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ======================================
// EXPORT HELPERS
// ======================================

export const createEmptyPendencyValidationResult = (): PendencyValidationResult => ({
  canAdvance: false,
  totalRequirements: 0,
  completedRequirements: 0,
  criticalRequirements: 0,
  completedCritical: 0,
  completionPercentage: 0,
  criticalCompletionPercentage: 0,
  blockingRequirements: [],
  warnings: []
});

export const getStageNameById = (stageId: number): string => {
  return STAGE_NAMES[stageId] || `Stage ${stageId}`;
};

export const getRequirementCategoryLabel = (category: RequirementCategory): string => {
  return REQUIREMENT_CATEGORY_LABELS[category] || category;
};

export const getRequirementStatusLabel = (status: RequirementStatus): string => {
  return REQUIREMENT_STATUS_LABELS[status] || status;
};

export const getSeverityColor = (severity: NotificationSeverity): string => {
  switch (severity) {
    case 'CRITICAL': return 'red';
    case 'HIGH': return 'orange';
    case 'MEDIUM': return 'yellow';
    case 'LOW': return 'blue';
    default: return 'gray';
  }
};

export const getCompletionStatusColor = (percentage: number): string => {
  if (percentage >= 90) return 'green';
  if (percentage >= 70) return 'yellow';
  if (percentage >= 50) return 'orange';
  return 'red';
};
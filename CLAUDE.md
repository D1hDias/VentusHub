# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VentusHub** is a comprehensive real estate platform with an integrated financial ecosystem. It's a full-stack React/TypeScript application with Express.js backend, featuring property management, financial simulators, credit analysis tools, and a multi-stage property sales pipeline.

### Core Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Database**: PostgreSQL (Neon Database)
- **Authentication**: Session-based with express-session
- **State Management**: TanStack Query for server state
- **Routing**: Wouter (lightweight React router)
- **Styling**: Tailwind CSS + Framer Motion for animations
- **Icons**: Lucide React
- **PDF Generation**: jsPDF for reports

## Development Commands

### ⚠️ IMPORTANT SERVER EXECUTION RULE
**NEVER run `npm run dev` or any server commands directly in Claude Code.**
**When testing or checking if the server runs correctly, always ask the user to run the command manually.**

### Local Development
```bash
npm run dev          # Start development server with Vite + Express
npm run dev:no-vite  # Run backend only (production mode without Vite)
npm run dev:simple   # Simple TSX server start
```

**Note**: These commands should only be executed by the user, not by Claude Code.

### Database Management
```bash
npm run db:push      # Push schema changes to database using Drizzle Kit
```

### Build & Production
```bash
npm run build        # Build frontend + bundle backend
npm run start        # Start production server
npm run start:80     # Start on port 80
npm run start:443    # Start on port 443 (HTTPS)
```

### Type Checking
```bash
npm run check        # TypeScript type checking
```

## Key Project Structure

### Client-Side (`/client/src/`)
- **`pages/`**: Main application pages and simulators
- **`components/`**: Reusable UI components (shadcn/ui based)
- **`hooks/`**: Custom React hooks (auth, notifications, etc.)
- **`lib/`**: Utilities and configurations
- **`types/`**: TypeScript type definitions

### Server-Side (`/server/`)
- **`index.ts`**: Main server entry point with middleware setup
- **`auth.ts`**: Authentication middleware and session management
- **`routes.ts`**: API route definitions
- **`db.ts`**: Database connection and Drizzle setup

### Shared (`/shared/`)
- **`schema.ts`**: Drizzle database schema definitions
- **`liquidity.ts`**: Property liquidity calculation utilities

## Application Features

### 1. Property Management Pipeline
8-stage property sales process:
1. **Captação**: Property capture and initial data
2. **Due Diligence**: Document verification and legal checks
3. **Mercado**: Market listing and pricing
4. **Propostas**: Buyer proposals management
5. **Contratos**: Contract generation and management
6. **Financiamento**: Financing and credit processing
7. **Instrumento**: Final legal instruments
8. **Concluído**: Completed transactions

### 2. Client Management System (CRM)
Complete client relationship management:
- **Client Profiles**: Full customer information and contact details
- **Notes & Interactions**: Timeline tracking with notes, reminders, calls, and meetings
- **Document Management**: File upload/storage with Supabase integration
  - Support for PDF, DOC, DOCX, JPG, PNG, GIF formats
  - In-browser document viewer with navigation between multiple files
  - Secure file storage with access control and 10MB file size limit
- **Activity Statistics**: Comprehensive interaction tracking and analytics

### 3. Financial Simulators
Over 15 specialized calculators:
- Property valuation and registration costs
- Financing vs. purchase power analysis
- SAC vs. Price amortization systems
- ROI and flipping analysis
- Commercial credit (PJ) simulation

### 3. Database Schema
Key tables:
- `users`: User authentication and profiles
- `properties`: Property data with 8-stage status tracking
- `propertyOwners`: Separate owner information
- `documents`: Document management
- `proposals`, `contracts`: Transaction management
- `notifications`: User notification system
- `clients`: Client management and CRM data
- `clientNotes`: Client interaction history (notes, calls, meetings, reminders)
- `clientDocuments`: Client file storage with Supabase integration

## Important Technical Details

### Database Connection
- Uses Neon Database (PostgreSQL serverless)
- **Critical**: Package version `@neondatabase/serverless@0.10.1` (avoid 0.10.4+ due to compatibility issues)
- Connection managed through Drizzle ORM

### Authentication System
- Session-based authentication with `express-session`
- Protected routes use `ProtectedRoute` wrapper
- Session storage in PostgreSQL `sessions` table

### Component Communication
- Custom event system for cross-component communication
- Example: `CustomEvent('disableSecondSidebar')` for sidebar control

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Sticky sidebar patterns for enhanced UX
- Grid layouts optimized for different screen sizes

### API Integration
- Market indicators fetched from external APIs with caching
- Real-time data updates for financial calculations
- Supabase Storage integration for file management
  - `/api/clients/documents/upload` - POST multipart file upload
  - `/api/clients/:id/documents` - GET client documents list
  - `/api/clients/documents/:id` - DELETE document removal

## Development Patterns

### Form Handling
- Controlled components with validation
- Currency formatting utilities
- Error state management with user feedback

### PDF Generation
- Client-side PDF creation using jsPDF
- Logo embedding and corporate branding
- Tabular data presentation with autoTable

### State Management
- TanStack Query for server state
- Local React state for UI interactions
- Custom hooks for complex logic encapsulation

## Deployment

### Production Deployment
- Dockerized application with docker-compose
- Nginx reverse proxy configuration
- SSL/TLS termination
- Automated deployment scripts (`deploy-update.sh`, `rollback.sh`)

### Environment Configuration
- Development: Vite dev server + Express API
- Production: Static file serving + Express API
- Environment-specific configurations in server setup

## Common Workflows

### Adding New Simulators
1. Create page component in `client/src/pages/`
2. Add route to `App.tsx`
3. Implement calculation logic with proper validation
4. Add PDF export functionality if needed

### Database Changes
1. Update schema in `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Update related API routes and types

### UI Component Development
- Use shadcn/ui components as base
- Follow existing patterns for form layouts
- Implement proper loading and error states

## Security Considerations
- All routes require authentication except login/register
- CORS properly configured for production domains
- Session security with secure cookies in production
- Input validation on both client and server

## Performance Notes
- Vite for fast development builds
- Code splitting with dynamic imports
- Image optimization for assets
- Database query optimization with Drizzle

## Notification System

### Comprehensive Notification Infrastructure
VentusHub includes a complete notification system with real-time delivery, multi-channel support, and user preferences:

- **Real-time WebSocket**: Socket.IO integration for instant notifications
- **Multi-channel Delivery**: In-app, email, SMS, and push notifications
- **Provider System**: Flexible email/SMS provider integration (Resend, SendGrid, Twilio, Amazon SNS)
- **User Preferences**: Granular notification settings and subscription management
- **Templates & Rules**: Event-driven notification generation with templates
- **Analytics**: Comprehensive delivery tracking and performance metrics

### Key Files
- **`server/notification-service.ts`**: Core notification service with event processing
- **`server/notification-providers.ts`**: Multi-provider email/SMS system
- **`client/src/hooks/useEnhancedNotifications.ts`**: Frontend notification management
- **`client/src/components/NotificationSettings.tsx`**: User preference interface

### Usage
```typescript
// Trigger notifications for system events
await notificationService.onPropertyStageAdvanced(propertyId, fromStage, toStage, userId);
await notificationService.onDocumentUploaded(documentId, propertyId, userId, documentType);

// Create custom notifications
await notificationService.createNotification({
  userId,
  type: 'info',
  category: 'property',
  title: 'Notification Title',
  message: 'Notification content'
});
```

## Universal Document Pendency Modal

### DocumentsPendingModal - Universal Component
**Location**: `/client/src/components/DocumentsPendingModal.tsx`

A highly configurable, universal component for managing document pendencies across all entity types in the system (properties, clients, contracts, etc.).

### Key Features
- **Universal Design**: Single component handles all entity types
- **Configurable**: Fully customizable documents and field requirements
- **Stage-Based**: Documents filtered by workflow stages
- **Upload Integration**: Direct Supabase upload with progress tracking
- **Validation System**: Custom validation logic per entity type
- **Responsive UI**: Mobile-first design with intuitive UX

### Core Interfaces
```typescript
interface Entity {
  id?: string | number;
  sequenceNumber?: string;
  stage?: number;
  type?: string;
  [key: string]: any;
}

interface DocumentDefinition {
  key: string;
  name: string;
  icon: string;
  description: string;
  required?: boolean;
  stages?: number[];
  acceptedFormats?: string[];
  maxSize?: number;
}

interface PendencyConfig {
  entityType: 'property' | 'client' | 'contract' | 'generic';
  stage?: number;
  documents?: DocumentDefinition[];
  fields?: FieldDefinition[];
  customValidation?: (entity: Entity) => {
    pendingDocs: DocumentDefinition[];
    pendingFields: FieldDefinition[];
  };
}
```

### Helper Functions
```typescript
// Pre-configured setups for common entity types
createPropertyDocumentConfig(stage?: number): PendencyConfig
createClientDocumentConfig(customDocs?, customFields?): PendencyConfig
createContractDocumentConfig(customDocs?): PendencyConfig
createGenericDocumentConfig(entityType, documents, fields?, customValidation?): PendencyConfig
```

### Usage Examples
```typescript
// Property documents for specific stage
const config = createPropertyDocumentConfig(2); // Due Diligence stage

// Custom client documents
const clientConfig = createClientDocumentConfig(customDocs, customFields);

// Generic entity with custom validation
const genericConfig = createGenericDocumentConfig('generic', docs, fields, validation);

// Implementation
<DocumentsPendingModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  entity={entity}
  config={config}
  onDocumentUploaded={(docKey) => {
    // Automatic notification integration
    notificationService.onDocumentUploaded(documentId, entityId, userId, docKey);
  }}
  onComplete={() => {
    // Called when all requirements are met
  }}
/>
```

### Upload System
- **Dynamic Buckets**: `{entityType}-documents` (e.g., `property-documents`, `client-documents`)
- **Dynamic APIs**: `/api/{entityType}-documents`
- **File Organization**: Files organized by entity ID in Supabase
- **Format Support**: PDF, JPG, JPEG, PNG with configurable size limits
- **Progress Tracking**: Real-time upload progress and error handling

### Default Configurations

#### Property Documents (Stage-Based)
- **Ônus Reais**: Stages 1, 2, 3 (Captação, Due Diligence, Mercado)
- **Espelho de IPTU**: Stages 1, 2
- **RG/CNH dos Proprietários**: Stages 1, 2, 6
- **Certidão de Estado Civil**: Stages 2, 6
- **Comprovante de Residência**: Stages 1, 2
- **Escritura/Registro**: Stages 2, 7
- **Contrato de Compra e Venda**: Stages 5, 6, 7

#### Property Fields
- **Basic Info**: Type, address, number, neighborhood, city
- **Financial**: Property value (required in stages 1 and 4)
- **Legal**: Owner data, registration number

### Benefits
- **Code Organization**: Single component for all document scenarios
- **Maintainability**: Centralized logic, easier updates
- **Consistency**: Uniform UX across all entity types
- **Flexibility**: Easy extension for new entity types
- **Integration**: Seamless notification system integration

### Documentation
Complete documentation available in: `/DOCUMENTOS-PENDENCIAS-MODAL.md`
Usage examples available in: `/client/src/components/DocumentsPendingModal.example.tsx`

## Format Utilities

### Universal Formatting Functions
**Location**: `/client/src/lib/formatUtils.ts`

Centralized formatting utilities for consistent data presentation across the entire application.

### Available Functions
```typescript
// Sequence number formatting
formatSequenceNumber(sequenceNumber: string | undefined | null): string
// Example: formatSequenceNumber("1") → "#00001"

// Currency formatting
formatCurrency(value: number | string): string
// Example: formatCurrency(500000) → "R$ 500.000,00"

// Property address formatting
formatPropertyAddress(property: PropertyObject): string
// Example: formatPropertyAddress({street: "Rua A", number: "123", neighborhood: "Centro"}) → "Rua A, 123 - Centro"

// Stage name formatting
formatStageName(stage: number): string
// Example: formatStageName(1) → "Captação"

// Stage CSS classes
formatStageClasses(stage: number): string
// Example: formatStageClasses(1) → "bg-orange-100 text-orange-600 border-orange-200"
```

### Usage
```typescript
import { formatSequenceNumber, formatCurrency, formatPropertyAddress, formatStageName, formatStageClasses } from "@/lib/formatUtils";

// In components
const displayNumber = formatSequenceNumber(property.sequenceNumber);
const displayValue = formatCurrency(property.value);
const displayAddress = formatPropertyAddress(property);
```

### Benefits
- **Consistency**: Uniform formatting across all components
- **Maintainability**: Single point of change for format rules
- **Type Safety**: TypeScript support with proper error handling
- **Performance**: Optimized functions with proper validation
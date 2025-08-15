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

### 2. Financial Simulators
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
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (serves both frontend and backend on port 5000)
- `npm run build` - Build production bundle (frontend + backend)
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking

### Database Operations
- `npm run db:push` - Push schema changes to database using Drizzle
- Database migrations are stored in `/migrations/` directory

### Git Operations
- `npm run sync` - Quick git add, commit with "Auto update" message, and push

### Production Deployment
- `npm run start:80` - Start production server on port 80
- `npm run start:443` - Start production server on port 443 (HTTPS)
- Build process combines frontend (Vite) and backend (esbuild) into unified deployment

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based auth with express-session
- **Routing**: Wouter (client-side)
- **State Management**: TanStack React Query
- **UI Components**: Radix UI + shadcn/ui + Tailwind CSS
- **File Storage**: Supabase Storage + local uploads

### Project Structure

**Full-Stack Architecture**: Single repository with integrated frontend/backend serving on port 5000.

**Key Directories**:
- `/client/src/` - React frontend application
- `/server/` - Express.js backend services
- `/shared/` - Shared TypeScript schemas and types
- `/migrations/` - Database migration files

### Backend Architecture

**Core Files**:
- `server/index.ts` - Main Express server entry point
- `server/routes.ts` - API route definitions
- `server/auth.ts` - Authentication middleware and session management
- `server/storage.ts` - Database operations and data access layer
- `server/db.ts` - Database connection and configuration

**Database Schema** (`shared/schema.ts`):
- Properties with owners, documents, proposals, contracts
- Sequential numbering system for property identification (#00001, #00002, etc.)
- 7-stage property workflow: Captação → Due Diligence → Mercado → Propostas → Contratos → Instrumento → Concluído

### Frontend Architecture

**Main Application** (`client/src/App.tsx`):
- Protected/Public route system
- Layout wrapper for authenticated pages
- Portuguese route names (/captacao, /due-diligence, /mercado, etc.)

**Page Organization**:
- **Dashboard** - Overview with KPIs and recent activity
- **PropertyCapture** - Property registration and management
- **DueDiligence** - Document validation and legal verification
- **MarketListing** - Property marketing and publication
- **Proposals** - Buyer proposal management and negotiation
- **Contracts** - Contract creation and digital signing
- **FinalInstrument** - Deed preparation and notary registration
- **Timeline** - Complete transaction progress visualization
- **PropertyDetails** - Individual property detail pages with progress tracking

**Key Components**:
- `PropertyModal` - Universal property creation/editing modal with document upload
- `DocumentsPendingModal` - Document requirements tracking
- `Layout` - Main application shell with sidebar navigation
- Comprehensive UI component library in `/components/ui/`

### Data Flow Patterns

**Property Workflow**:
1. Properties have sequential numbers (#00001, #00002) displayed throughout the system
2. 7-stage progression with currentStage tracking (1-7)
3. Status field tracks current phase (captacao, diligence, mercado, etc.)
4. Related entities (owners, documents, proposals, contracts) link via propertyId

**State Management**:
- TanStack React Query for server state
- React hooks for local component state
- Authentication context via useAuth hook

**File Handling**:
- Supabase Storage for document uploads
- Local uploads directory for avatars
- PropertyModal handles categorized document uploads (Ônus Reais, IPTU, RG/CNH, etc.)

### Authentication & Security

**Session-Based Auth**:
- Express-session with PostgreSQL session store
- Protected routes require authentication middleware
- User context available via useAuth hook

**Data Access**:
- Properties filtered by userId for security
- API routes check user ownership before data access

### UI/UX Patterns

**Sequential Numbering**: Property numbers (#00001) appear consistently in:
- Table listings
- Modal titles ("Editar Imóvel #00001")
- Page headers
- Detail views

**Modal System**: Standardized modal patterns for:
- Property editing with document upload
- Proposal details
- Contract management
- Document tracking

**Progress Tracking**: Visual progress indicators throughout:
- Property detail pages show 7-stage progress
- Timeline page visualizes complete transaction flow
- Dashboard provides overview metrics

**Hover Effects Standard**: Consistent hover pattern for interactive lists and cards:
- Container: `hover:space-y-2 transition-all duration-300` (reduces spacing)
- Individual items: `hover:bg-accent/50 hover:shadow-md hover:border-primary/20 hover:scale-[1.02] cursor-pointer transition-all duration-300 ease-in-out`
- Use this pattern for: property lists, transaction items, card grids, navigation items
- Benefits: Modern feel, visual feedback, smooth animations (300ms duration)

### Development Notes

**Database Schema Changes**:
- Modify `shared/schema.ts` then run `npm run db:push`
- Drizzle automatically generates migrations

**New Property Stages**:
- Update currentStage logic in components
- Add stage to progress tracking systems
- Consider impact on Timeline and Dashboard views

**Document Categories**:
- PropertyModal defines required document types
- Categories: ONUS_REAIS, ESPELHO_IPTU, RG_CNH, CERTIDAO_ESTADO_CIVIL, COMPROVANTE_RESIDENCIA

**API Conventions**:
- RESTful routes in `server/routes.ts`
- Data operations abstracted in `server/storage.ts`
- All API routes prefixed with `/api/`

### Port Configuration

The application runs on port 5000 for development and port 80 for production (with HTTPS on 443), serving the integrated frontend and backend together.

## Financial Simulators Architecture

**Comprehensive Financial Tools**: The system includes 14+ specialized financial simulators (`Simulador*.tsx` files):

**Core Simulators**:
- `SimuladorFinanciamento.tsx` - Complete mortgage financing calculator with multi-bank comparison
- `SimuladorCGI.tsx` - Real estate collateral credit (CGI) simulator with 60% max financing limit
- `SimuladorConsorcioXFinanciamento.tsx` - Consortium vs financing comparison
- `SimuladorAluguelXCompra.tsx` - Rent vs buy decision calculator

**Investment Analysis**:
- `SimuladorPotencialDeValorizacao.tsx` - Property appreciation potential
- `SimuladorRoiFlipping.tsx` - Real estate flipping ROI calculator
- `SimuladorRendaPassiva.tsx` - Passive income from rental properties
- `SimuladorLiquidezImovel.tsx` - Property liquidity analysis

**Market Analysis**:
- `SimuladorValorImovel.tsx` - Property valuation calculator
- `SimuladorMetroQuadrado.tsx` - Price per square meter analysis
- `SimuladorPoderDeCompra.tsx` - Purchasing power calculator

**Professional Tools**:
- `SimuladorComissaoEMetas.tsx` - Real estate agent commission and goal calculator
- `SimuladorValorRegistro.tsx` - Property registration cost calculator
- `SimuladorSacXPrice.tsx` - SAC vs PRICE amortization system comparison

**Financial Simulator Patterns**:
- **Multi-bank Configuration**: `BANCOS_CONFIG` objects with bank-specific rules, logos, interest rates, and limits
- **PDF Generation**: jsPDF integration for detailed financial reports and amortization tables
- **Age-based Calculations**: Dynamic term limits based on borrower age (max 80 years old)
- **Real-time Validation**: Form validation with Brazilian financial regulations
- **Responsive Charts**: Recharts integration for visual financial data representation

**Banking System Integration**:
- Individual bank configurations with specific rules:
  - Interest rates by amortization system (SAC, PRICE)
  - Maximum financing percentages (60%-80%)
  - Age-based term limits
  - Insurance calculations (MIP, DFI)
  - Regional variations and special programs

## LLM Integration System

**AI-Powered Features** (`/llm/` directory):

**Multi-Provider Support**:
- Anthropic Claude (`providers/anthropic.ts`)
- Google Gemini (`providers/gemini.ts`) 
- OpenAI GPT (`providers/openai.ts`)
- OpenRouter (`providers/openrouter.ts`)

**Specialized Prompts**:
- `prompts/business-prompts.ts` - Real estate business intelligence prompts
- `prompts/system-prompts.ts` - Core system behavior prompts
- `prompts/training-prompts.ts` - Domain-specific training prompts covering market knowledge, legal requirements, and best practices

**Default Configuration**: Uses DeepSeek Chat via OpenRouter with temperature 0.7 and context-aware system prompts for real estate domain expertise.

## Vite Configuration & Aliases

**Path Aliases**:
- `@/` → `client/src/` (React components and pages)
- `@shared/` → `shared/` (Shared TypeScript schemas)
- `@assets/` → `attached_assets/` (Project documentation and wireframes)

**Build Configuration**:
- Development server on port 5000 with hot reload
- Production build outputs to `dist/public/`
- File system access restricted for security

## Outras informações relevantes

Leia os arquivos de PDF nos seguintes endereços "C:\Users\diego\OneDrive\Desktop\Projeto Imobiliário\VentusHub\attached_assets\Projeto de Software Imobiliário 1.0 – Etapas e Funcionalidades.docx" e "C:\Users\diego\OneDrive\Desktop\Projeto Imobiliário\VentusHub\attached_assets\sistema_imobiliario_completo_ia_2025.pdf", absorva, analise e treine com o conteúdo que lá está pois é uma apresentação completa sobre como deverá ser o sistema. Use como "livro de cabeceira" pois é uma bússola para chegarmos até nosso objetivo final.

- Evite desperdício de tokens.
- Você tem acesso ao meu repositório Github desse projeto então tentarei deixá-lo sempre atualizado para que nossos ajustes e alterações sejam todos bem sucedidos. Conforme for me orientando com códigos de programação pra alterar alguma parte do sistema que eu solicite, eu o farei nos códigos e nos fim você terá a atualização dos mesmos em tempo real junto comigo.
- Apenas me fale o básico de forma didática.
- Aponte o código para que eu o encontre em meio a todo o arquivo que estaremos trabalhando e diga o que alterar e onde alterar para chegarmos ao objetivo proposto.

A Importância Fundamental da Consistência de Nomenclatura
Manter convenções de nomenclatura consistentes para campos de formulário, IDs e todos os outros elementos do código é absolutamente crucial para a integridade e eficiência deste projeto. Isso não é apenas uma preferência estilística; é um princípio fundamental para uma programação segura, eficaz e de fácil manutenção.

Veja por que essa consistência é inegociável:

Integração com Banco de Dados: Nomenclaturas inconsistentes comprometem diretamente nossa capacidade de mapear dados de formulário para campos de banco de dados de forma confiável. Nomes incompatíveis levam a dados corrompidos, informações perdidas e um custo significativo de depuração. Precisamos garantir um fluxo de dados contínuo e previsível da interface do usuário para a camada de armazenamento persistente.

Confiabilidade da Automação: Nossos processos de automação (por exemplo, scripts de processamento de dados, interações com APIs, frameworks de teste) dependem inteiramente da identificação previsível dos elementos. Qualquer desvio na nomenclatura quebrará essas automações, exigindo retrabalho constante e introduzindo instabilidade em nossos pipelines de desenvolvimento e implantação.

Manutenibilidade e Legibilidade do Código: A nomenclatura consistente atua como uma linguagem universal em nossa base de código. Ela melhora drasticamente a legibilidade para todos os desenvolvedores, tornando mais fácil entender o propósito e a função de cada elemento. Isso reduz a carga cognitiva, acelera o desenvolvimento e minimiza o risco de introduzir novos bugs quando as modificações são feitas.

Coesão Sistêmica: Toda mudança no código, seja um novo recurso ou uma correção de bug, tem efeitos em cascata. Manter uma nomenclatura consistente garante que essas mudanças se propaguem de forma previsível e que as conexões entre as diferentes partes do sistema (UI, lógica de backend, banco de dados, serviços externos) permaneçam alinhadas. Isso evita falhas silenciosas e comportamentos inesperados.

Superfície de Erro Reduzida: Nomenclaturas inconsistentes são uma das principais fontes de bugs difíceis de diagnosticar. Elas levam a erros de digitação, referências incorretas e erros lógicos que podem ser incrivelmente demorados para identificar e resolver. Ao aderir a convenções de nomenclatura rigorosas, reduzimos proativamente essa superfície de erro.

Em essência, a nomenclatura consistente é a base sobre a qual construímos uma aplicação robusta, escalável e segura. É o principal mecanismo pelo qual garantimos que todos os componentes do nosso projeto permaneçam interconectados e funcionem harmoniosamente. Trate as convenções de nomenclatura não como diretrizes, mas como padrões obrigatórios para todo o trabalho de desenvolvimento.
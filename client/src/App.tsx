import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "./hooks/useAuth";
// import { OrganizationProvider } from "./hooks/useOrganization";
import { Loader2 } from "lucide-react";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import PropertyCapture from "./pages/PropertyCapture";
import Settings from "./pages/Settings";
import DueDiligence from "./pages/DueDiligence";
import PropertiesMarket from "./pages/MarketListing";
import Proposals from "./pages/Proposals";
import Contracts from "./pages/Contracts";
import { Financiamento } from "./pages/Financiamento";
import DefinitiveInstrument from "./pages/FinalInstrument";
import Timeline from "./pages/Timeline";
import PropertyDetails from "./pages/PropertyDetails";
import ClientDetails from "./pages/ClientDetails";
import SimuladorValorRegistro from "./pages/SimuladorValorRegistro";
import SimuladorFinanciamento from "./pages/SimuladorFinanciamento";
import SimuladorMetroQuadrado from "./pages/SimuladorMetroQuadrado";
import SimuladorValorImovel from "./pages/SimuladorValorImovel";
import SimuladorPoderDeCompra from "./pages/SimuladorPoderDeCompra";
import SimuladorAluguelXCompra from "./pages/SimuladorAluguelXCompra";
import SimuladorConsorcioXFinanciamento from "./pages/SimuladorConsorcioXFinanciamento";
import SimuladorSacXPrice from "./pages/SimuladorSacXPrice";
import SimuladorRoiFlipping from "./pages/SimuladorRoiFlipping";
import SimuladorPotencialDeValorizacao from "./pages/SimuladorPotencialDeValorizacao";
import SimuladorComissaoEMetas from "./pages/SimuladorComissaoEMetas";
import SimuladorRendaPassiva from "./pages/SimuladorRendaPassiva";
import SimuladorCGI from "./pages/SimuladorCGI";
import CreditoFinanciamento from "./pages/CreditoFinanciamento";
import CreditoConsorcio from "./pages/CreditoConsorcio";
import CreditoCGI from "./pages/CreditoCGI";
import CreditoPJ from "./pages/CreditoPJ";
import SimuladorCreditoPJ from "./pages/SimuladorCreditoPJ";
import Notifications from "./pages/Notifications";
import Registro from "./pages/Registro";
import Clientes from "./pages/Clientes";
import DocumentosUteis from "./pages/DocumentosUteis";
import MasterAdminLogin from "./pages/MasterAdminLogin";
import MasterAdmin from "./pages/MasterAdmin";
import B2BLogin from "./pages/B2BLogin";
import Equipe from "./pages/Equipe";
import Relatorios from "./pages/Relatorios";

// Components
import Layout from "./components/Layout";


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Layout><Dashboard /></Layout>;
  }

  return <>{children}</>;
}


function AppRoutes() {
  return (
    <Switch>
      {/* Rotas públicas */}
      <Route path="/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>
      
      <Route path="/register">
        <PublicRoute>
          <Register />
        </PublicRoute>
      </Route>

      <Route path="/reset-password">
        <PublicRoute>
          <ResetPassword />
        </PublicRoute>
      </Route>

      {/* B2B Partner Login */}
      <Route path="/b2b">
        <PublicRoute>
          <B2BLogin />
        </PublicRoute>
      </Route>

      {/* Master Admin Routes - Public (has own auth) */}
      <Route path="/master-admin-login">
        <PublicRoute>
          <MasterAdminLogin />
        </PublicRoute>
      </Route>

      <Route path="/master-admin">
        <MasterAdmin />
      </Route>

      {/* Rotas protegidas */}
      <Route path="/configuracoes">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>

      <Route path="/notifications">
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/captacao">
        <ProtectedRoute>
          <PropertyCapture />
        </ProtectedRoute>
      </Route>

      <Route path="/due-diligence">
        <ProtectedRoute>
          <DueDiligence />
        </ProtectedRoute>
      </Route>

      <Route path="/mercado">
        <ProtectedRoute>
          <PropertiesMarket />
        </ProtectedRoute>
      </Route>

      <Route path="/propostas">
        <ProtectedRoute>
          <Proposals />
        </ProtectedRoute>
      </Route>

      <Route path="/contratos">
        <ProtectedRoute>
          <Contracts />
        </ProtectedRoute>
      </Route>

      <Route path="/credito">
        <ProtectedRoute>
          <Financiamento />
        </ProtectedRoute>
      </Route>

      <Route path="/credito/financiamento">
        <ProtectedRoute>
          <CreditoFinanciamento />
        </ProtectedRoute>
      </Route>

      <Route path="/credito/consorcio">
        <ProtectedRoute>
          <CreditoConsorcio />
        </ProtectedRoute>
      </Route>

      <Route path="/credito/cgi">
        <ProtectedRoute>
          <CreditoCGI />
        </ProtectedRoute>
      </Route>

      <Route path="/credito/pj">
        <ProtectedRoute>
          <CreditoPJ />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-credito-pj">
        <ProtectedRoute>
          <SimuladorCreditoPJ />
        </ProtectedRoute>
      </Route>

      <Route path="/instrumento">
        <ProtectedRoute>
          <DefinitiveInstrument />
        </ProtectedRoute>
      </Route>

      <Route path="/registro">
        <ProtectedRoute>
          <Registro />
        </ProtectedRoute>
      </Route>

      <Route path="/clientes">
        <ProtectedRoute>
          <Clientes />
        </ProtectedRoute>
      </Route>

      <Route path="/documentos-uteis">
        <ProtectedRoute>
          <DocumentosUteis />
        </ProtectedRoute>
      </Route>






      <Route path="/timeline">
        <ProtectedRoute>
          <Timeline />
        </ProtectedRoute>
      </Route>

      {/* Rotas específicas para Imobiliárias */}
      <Route path="/equipe">
        <ProtectedRoute>
          <Equipe />
        </ProtectedRoute>
      </Route>

      <Route path="/relatorios">
        <ProtectedRoute>
          <Relatorios />
        </ProtectedRoute>
      </Route>

      <Route path="/property/:id">
        <ProtectedRoute>
          <PropertyDetails />
        </ProtectedRoute>
      </Route>

      <Route path="/client/:id">
        <ProtectedRoute>
          <ClientDetails />
        </ProtectedRoute>
      </Route>

      {/* Rotas dos Simuladores */}
      <Route path="/simulador-valor-registro">
        <ProtectedRoute>
          <SimuladorValorRegistro />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-financiamento">
        <ProtectedRoute>
          <SimuladorFinanciamento />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-metro-quadrado">
        <ProtectedRoute>
          <SimuladorMetroQuadrado />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-valor-imovel">
        <ProtectedRoute>
          <SimuladorValorImovel />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-poder-de-compra">
        <ProtectedRoute>
          <SimuladorPoderDeCompra />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-aluguel-x-compra">
        <ProtectedRoute>
          <SimuladorAluguelXCompra />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-consorcio-x-financiamento">
        <ProtectedRoute>
          <SimuladorConsorcioXFinanciamento />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-sac-x-price">
        <ProtectedRoute>
          <SimuladorSacXPrice />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-roi-flipping">
        <ProtectedRoute>
          <SimuladorRoiFlipping />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-potencial-de-valorizacao">
        <ProtectedRoute>
          <SimuladorPotencialDeValorizacao />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-comissao-e-metas">
        <ProtectedRoute>
          <SimuladorComissaoEMetas />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-renda-passiva">
        <ProtectedRoute>
          <SimuladorRendaPassiva />
        </ProtectedRoute>
      </Route>

      <Route path="/simulador-cgi">
        <ProtectedRoute>
          <SimuladorCGI />
        </ProtectedRoute>
      </Route>

      {/* Rota padrão - redirecionando para dashboard com autenticação */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Search, Store, Handshake, File, Stamp, Clock, CheckCircle } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Home,
      title: "Captação de Imóveis",
      description: "Sistema completo para cadastro e documentação de imóveis"
    },
    {
      icon: Search,
      title: "Due Diligence Automatizada",
      description: "Validação automática de documentos e certidões"
    },
    {
      icon: Store,
      title: "Gestão de Mercado",
      description: "Controle total dos imóveis disponíveis para venda"
    },
    {
      icon: Handshake,
      title: "Gestão de Propostas",
      description: "Acompanhamento completo do processo de negociação"
    },
    {
      icon: File,
      title: "Contratos Inteligentes",
      description: "Geração e gestão automatizada de contratos"
    },
    {
      icon: Stamp,
      title: "Instrumento Definitivo",
      description: "Finalização automática com cartórios e bancos"
    },
    {
      icon: Clock,
      title: "Timeline Completa",
      description: "Acompanhamento visual de todo o processo"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Ventus Hub</span>
          </div>
          <Button onClick={() => window.location.href = "/api/login"}>
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Ventus Hub - Corretores
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A plataforma completa para digitalizar e automatizar todos os processos do mercado imobiliário.
            Gerencie sua carteira de imóveis com eficiência e profissionalismo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => window.location.href = "/api/login"}
            >
              Começar Agora
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">7 Etapas Automatizadas</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Do primeiro contato com o proprietário até a escritura definitiva,
            acompanhe e gerencie todo o processo em uma única plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Por que escolher o Ventus Hub?</h2>
              <div className="space-y-4">
                {[
                  "Redução de 70% no tempo de processamento",
                  "Documentação 100% digital e organizada",
                  "Compliance automático com regulamentações",
                  "Relatórios gerenciais em tempo real",
                  "Integração com cartórios e bancos",
                  "Suporte especializado 24/7"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="p-8">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl">Comece Hoje Mesmo</CardTitle>
                <CardDescription>
                  Junte-se a centenas de corretores que já transformaram seus negócios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => window.location.href = "/api/login"}
                >
                  Entrar com Replit
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Ventus Hub. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

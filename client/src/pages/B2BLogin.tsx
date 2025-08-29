import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Users, Eye, EyeOff, CheckCircle } from 'lucide-react';
import logoMasterImage from '@/assets/logo_master.png';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function B2BLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        // Salvar que o login foi feito via B2B para o logout correto
        localStorage.setItem('loginSource', 'b2b');
        
        // Toast de sucesso específico para B2B
        toast({
          title: "Bem-vindo ao VentusHub! 🚀",
          description: "Login B2B realizado com sucesso. Redirecionando...",
          variant: "success" as any,
        });
        
        // Delay para mostrar o toast
        setTimeout(() => {
          setLocation('/dashboard');
        }, 500);
      } else {
        const errorMessage = result.error || 'Erro ao fazer login';
        setError(errorMessage);
        
        // Toast de erro
        toast({
          title: "Erro no login B2B",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = 'Erro interno do servidor';
      setError(errorMessage);
      
      // Toast de erro para exceções
      toast({
        title: "Erro no servidor",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001f3f] relative">
      {/* Links legais no topo direito */}
      <div className="absolute top-0 right-0 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-end gap-2 md:gap-4 text-xs text-white/70">
          <a 
            href="/politica-privacidade" 
            className="hover:text-white transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              // Implementar navegação futura
            }}
          >
            Política de Privacidade
          </a>
          <span className="hidden md:inline text-white/40">•</span>
          <a 
            href="/termos-uso" 
            className="hover:text-white transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              // Implementar navegação futura
            }}
          >
            Termos de Uso
          </a>
          <span className="hidden md:inline text-white/40">•</span>
          <a 
            href="/politica-cookies" 
            className="hover:text-white transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              // Implementar navegação futura
            }}
          >
            Política de Cookies
          </a>
          <span className="hidden md:inline text-white/40">•</span>
          <a 
            href="/suporte" 
            className="hover:text-white transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              // Implementar navegação futura
            }}
          >
            Suporte
          </a>
        </div>
      </div>

      {/* Container principal do formulário */}
      <div className="flex items-center justify-start min-h-screen p-4">
        <div className="w-full max-w-lg" style={{ marginLeft: '150px' }}>
        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white dark:bg-gray-900 backdrop-blur-sm scale-110">
          <CardHeader className="space-y-4 text-center pb-6">
            {/* Logo VentusHub */}
            <div className="flex justify-center">
              <div className="relative">
                <img src={logoMasterImage} alt="VentusHub Portal de Parceiros" className="h-20 w-auto" />
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-2">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
            </div>
            
            {/* Títulos */}
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                Portal de Parceiros
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400 mt-2">
                Acesso exclusivo para Corretores e Imobiliárias
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 text-base pr-12"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Entrar na Plataforma</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  🔐 Primeiro Acesso?
                </p>
                <p className="text-xs text-blue-700">
                  Use sua senha padrão <code className="bg-blue-100 px-1 py-0.5 rounded">Temp123456</code> e altere após o primeiro login
                </p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Problemas para acessar? Entre em contato conosco
              </p>
            </div>
          </CardContent>
        </Card>

          {/* Footer dentro do card mantido como está */}
          <div className="text-center mt-12">
            <p className="text-xs text-white/80">
              VentusHub Portal de Parceiros
            </p>
            <p className="text-xs text-white/60 mt-1">
              © {new Date().getFullYear()} - Sistema de Gestão Imobiliária
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
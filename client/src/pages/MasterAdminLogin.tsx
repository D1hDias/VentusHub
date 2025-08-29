import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Shield, Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logoMasterImage from '@/assets/logo_master.png';

interface LoginForm {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  adminId?: string;
  error?: string;
  message?: string;
  // sessionToken no longer included - stored in secure httpOnly cookie
}

export default function MasterAdminLogin() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<LoginForm>({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/master-admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify(form),
      });

      const data: LoginResponse = await response.json();

      if (data.success) {
        // Token is now stored securely in httpOnly cookie
        // Only store non-sensitive admin ID for UI purposes
        localStorage.setItem('masterAdminId', data.adminId || '');
        
        // Redirect to master admin dashboard
        setLocation('/master-admin');
      } else {
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = form.username.trim().length >= 3 && form.password.length >= 8;

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
        <Card className="shadow-2xl border-0 bg-white dark:bg-gray-900 backdrop-blur-sm scale-110">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="flex justify-center">
              <div className="relative">
                <img 
                  src={logoMasterImage} 
                  alt="VentusHub Master Admin" 
                  className="h-20 w-auto"
                />
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-2">
                  <Shield className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                Master Admin
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400 mt-2">
                Painel de Administração VentusHub
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-base font-medium">
                  Usuário
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="username"
                    type="text"
                    value={form.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Nome de usuário"
                    className="pl-12 h-14 text-base"
                    autoComplete="username"
                    required
                    minLength={3}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Senha do administrador"
                    className="pl-12 pr-12 h-14 text-base"
                    autoComplete="current-password"
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Entrar no Painel</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Acesso restrito aos administradores do sistema
                </p>
                <Button
                  variant="link"
                  className="text-sm text-blue-600 hover:text-blue-700 p-0 h-auto mt-2"
                  onClick={() => setLocation('/login')}
                >
                  ← Voltar ao login normal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

          <div className="text-center mt-12">
            <p className="text-xs text-white/80">
              VentusHub Master Admin Panel
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
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Eye, EyeOff, Loader2, Mail, Lock, User, Check, Crown, Shield } from 'lucide-react';

export default function Register() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [checkingFirstUser, setCheckingFirstUser] = useState(true);

  // Verificar se é o primeiro usuário
  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        const response = await fetch('/api/setup/is-first-user');
        if (response.ok) {
          const data = await response.json();
          setIsFirstUser(data.isFirstUser);
        }
      } catch (error) {
        console.error('Erro ao verificar primeiro usuário:', error);
      } finally {
        setCheckingFirstUser(false);
      }
    };

    checkFirstUser();
  }, []);

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: 'Mínimo 8 caracteres' },
    { met: /[A-Z]/.test(formData.password), text: 'Uma letra maiúscula' },
    { met: /[a-z]/.test(formData.password), text: 'Uma letra minúscula' },
    { met: /[0-9]/.test(formData.password), text: 'Um número' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    // Validate password requirements
    if (!passwordRequirements.every(req => req.met)) {
      setError('A senha não atende aos requisitos mínimos');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.password, formData.name);
      // Redirect to login with success message
      setLocation('/login?registered=true');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-xl shadow-lg mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">VentusHub</h1>
          <p className="text-gray-600 mt-2">Sistema Imobiliário Integrado</p>
        </div>

        {/* Register Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              {isFirstUser && <Crown className="h-6 w-6 text-yellow-600" />}
              Criar Conta
              {isFirstUser && <Crown className="h-6 w-6 text-yellow-600" />}
            </CardTitle>
            <CardDescription className="text-center">
              {isFirstUser ? (
                <span className="text-amber-700 font-medium">
                  🎉 Primeiro usuário - Será criado como MASTER ADMIN
                </span>
              ) : (
                'Preencha os dados abaixo para criar sua conta'
              )}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First User Alert */}
              {isFirstUser && (
                <Alert className="border-amber-200 bg-amber-50">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Primeiro Usuário Detectado!</strong><br />
                    Esta conta será criada como <strong>MASTER ADMIN</strong> com acesso completo ao sistema multi-tenant.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite seu nome..."
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="space-y-1 bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Requisitos da senha:</p>
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check
                        className={`h-3 w-3 ${req.met ? 'text-green-600' : 'text-gray-400'}`}
                      />
                      <span className={`text-xs ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">As senhas não coincidem</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Ou</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Já tem uma conta? </span>
              <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                Fazer Login
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; 2025 VentusHub. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
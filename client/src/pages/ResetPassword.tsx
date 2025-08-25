import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Eye, EyeOff, Loader2, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const token = new URLSearchParams(searchParams).get('token');

  const [step, setStep] = useState<'request' | 'reset'>(!token ? 'request' : 'reset');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements = [
    { met: password.length >= 8, text: 'Mínimo 8 caracteres' },
    { met: /[A-Z]/.test(password), text: 'Uma letra maiúscula' },
    { met: /[a-z]/.test(password), text: 'Uma letra minúscula' },
    { met: /[0-9]/.test(password), text: 'Um número' },
  ];

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao solicitar redefinição de senha');
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset request error:', err);
      setError(err.message || 'Erro ao solicitar redefinição de senha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao redefinir senha');
      }

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation('/login?password-reset=true');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
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

        {/* Reset Password Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {step === 'request' ? 'Recuperar Senha' : 'Nova Senha'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 'request'
                ? 'Digite seu email para receber o link de redefinição'
                : 'Digite sua nova senha abaixo'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success && step === 'request' ? (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Email enviado com sucesso! Verifique sua caixa de entrada.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-gray-600 text-center">
                  Enviamos um link de redefinição para o email {email}.
                  O link é válido por 1 hora.
                </p>
                <Button
                  onClick={() => setLocation('/login')}
                  className="w-full"
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Login
                </Button>
              </div>
            ) : success && step === 'reset' ? (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Senha redefinida com sucesso! Redirecionando...
                  </AlertDescription>
                </Alert>
              </div>
            ) : step === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
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
                      Enviando...
                    </>
                  ) : (
                    'Enviar Link de Redefinição'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {confirmPassword && password !== confirmPassword && (
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
                      Redefinindo...
                    </>
                  ) : (
                    'Redefinir Senha'
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter>
            <div className="w-full text-center">
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center">
                <ArrowLeft className="mr-1 h-3 w-3" />
                Voltar ao Login
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
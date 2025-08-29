import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Eye, EyeOff, Loader2, Mail, Lock, User, Check, Crown, Shield, CheckCircle } from 'lucide-react';
import { motion } from "framer-motion";
import { useSmoothtTransitions } from "@/hooks/useSmoothtTransitions";
import { useResponsive } from "@/hooks/useMediaQuery";
import bgAuth from '@/assets/bg-auth.jpg';
import logo from '@/assets/logo.png';

export default function Register() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const { getListVariants, getListItemVariants } = useSmoothtTransitions();
  const { isMobile } = useResponsive();
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
      const errorMessage = 'As senhas não coincidem';
      setError(errorMessage);
      
      toast({
        title: "Erro na validação",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // Validate password requirements
    if (!passwordRequirements.every(req => req.met)) {
      const errorMessage = 'A senha não atende aos requisitos mínimos';
      setError(errorMessage);
      
      toast({
        title: "Senha inválida",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.password, formData.name);
      
      // Toast de sucesso
      toast({
        title: "Conta criada com sucesso! ✨",
        description: `Bem-vindo(a), ${formData.name}! Redirecionando para o login...`,
        variant: "success" as any,
      });
      
      // Delay para mostrar o toast
      setTimeout(() => {
        setLocation('/login?registered=true');
      }, 1000);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.message || 'Erro ao criar conta. Tente novamente.';
      setError(errorMessage);
      
      toast({
        title: "Erro ao criar conta",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${bgAuth})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay duotone azul escuro para melhorar legibilidade */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          background: `linear-gradient(135deg, rgba(0, 31, 63, 0.85) 0%, rgba(0, 66, 134, 0.75) 50%, rgba(0, 31, 63, 0.9) 100%)`,
          mixBlendMode: 'multiply'
        }}
      />
      {/* Overlay adicional para contraste */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, rgba(0, 31, 63, 0.3) 0%, rgba(0, 31, 63, 0.7) 100%)`,
          mixBlendMode: 'overlay'
        }}
      />

      {/* Conteúdo */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="VentusHub Logo"
            className="h-16 w-auto mx-auto"
          />
        </div>

        {/* Register Card moderno */}
        <motion.div
          variants={getListItemVariants()}
          initial="hidden"
          animate="visible"
        >
          <Card className="bg-white rounded-3xl shadow-xl border-0 overflow-hidden">
          <CardHeader className="space-y-3 p-8 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center gap-2">
              {isFirstUser && <Crown className="h-6 w-6 text-yellow-600" />}
              Criar Conta
              {isFirstUser && <Crown className="h-6 w-6 text-yellow-600" />}
            </CardTitle>
            <CardDescription className="text-center text-gray-500 text-sm">
              {isFirstUser ? (
                <span className="text-amber-700 font-medium">
                  🎉 Primeiro usuário - Será criado como MASTER ADMIN
                </span>
              ) : (
                'Preencha os dados abaixo para criar sua conta'
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-7">
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
                <Input
                  id="name"
                  type="text"
                  placeholder="Nome Completo"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="h-14 px-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 bg-gray-50 text-gray-700 placeholder:text-gray-400"
                  required
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-14 px-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 bg-gray-50 text-gray-700 placeholder:text-gray-400"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="h-14 px-4 pr-12 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 bg-gray-50 text-gray-700 placeholder:text-gray-400"
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmar Password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="h-14 px-4 pr-12 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 bg-gray-50 text-gray-700 placeholder:text-gray-400"
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all duration-200 active:scale-[0.98]"
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

          <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-medium">Ou</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center text-sm">
              <span className="text-gray-500">Já tem uma conta? </span>
              <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-all duration-200">
                Fazer Login
              </Link>
            </div>
          </CardFooter>
        </Card>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-white/80 drop-shadow-md">
          <p>&copy; 2025 VentusHub. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
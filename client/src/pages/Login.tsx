import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { motion } from "framer-motion";
import { useSmoothtTransitions } from "@/hooks/useSmoothtTransitions";
import { useResponsive } from "@/hooks/useMediaQuery";
import bgAuth from '@/assets/bg-auth.jpg';
import logo from '@/assets/logo.png';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const { getListVariants, getListItemVariants } = useSmoothtTransitions();
  const { isMobile } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);

      // Salvar que o login foi feito via página padrão
      localStorage.setItem('loginSource', 'standard');

      // Toast de sucesso
      toast({
        title: "Login realizado com sucesso! 🎉",
        description: "Redirecionando para o dashboard...",
        variant: "success" as any,
      });

      // Pequeno delay para mostrar o toast antes do redirect
      setTimeout(() => {
        setLocation('/');
      }, 500);

    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Erro ao fazer login. Verifique suas credenciais.';

      // Manter o alert para erros críticos, mas adicionar toast também
      setError(errorMessage);

      // Toast de erro  
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

        {/* Login Card moderno */}
        <motion.div
          variants={getListItemVariants()}
          initial="hidden"
          animate="visible"
        >
          <Card className="bg-white rounded-3xl shadow-xl border-0 overflow-hidden">
            <CardHeader className="space-y-3 p-8 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-gray-800">
                Vamos começar
              </CardTitle>
              <CardDescription className="text-center text-gray-500 text-sm">
                Digite seu email e senha para acessar o sistema
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 px-4 pr-12 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 bg-gray-50 text-gray-700 placeholder:text-gray-400"
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
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

                {/* Remember Me and Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                    />
                    <div
                      className="ml-2 flex items-center"
                      style={{ height: '20px' }}
                      onClick={() => document.getElementById('remember').click()}
                      dangerouslySetInnerHTML={{
                        __html: `
                        <style>
                          #tiny-remember-text {
                            font-size: 14px !important;
                            color: #6b7280 !important;
                            cursor: pointer !important;
                            display: inline-block !important;
                            line-height: 20px !important;
                            vertical-align: middle !important;
                            font-family: system-ui !important;
                            font-weight: normal !important;
                            letter-spacing: normal !important;
                            text-transform: none !important;
                            margin: 0 !important;
                            padding: 0 !important;
                          }
                        </style>
                        <span id="tiny-remember-text">Lembrar senha</span>
                      `
                      }}
                    />
                  </div>
                  <Link href="/reset-password" className="text-sm text-blue-500 hover:text-blue-600 font-medium hover:underline transition-all duration-200">
                    Esqueceu sua senha?
                  </Link>
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
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
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

              {/* Register Link */}
              <div className="text-center text-sm">
                <span className="text-gray-500">Não tem uma conta? </span>
                <Link href="/register" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-all duration-200">
                  Cadastre-se
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
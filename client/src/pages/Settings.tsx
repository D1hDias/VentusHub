import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Save, 
  Camera,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  Info,
  Upload,
  Activity,
  Eye,
  EyeOff
} from "lucide-react";
import { NotificationSettings } from "@/components/NotificationSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useSmoothtTransitions } from "@/hooks/useSmoothtTransitions";
import { useResponsive } from "@/hooks/useMediaQuery";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequestLegacy as apiRequest } from "@/lib/queryClient";

const profileSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
  creci: z.string().min(1, "CRECI é obrigatório"),
  bio: z.string().max(500, "Bio deve ter no máximo 500 caracteres").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user, updateProfile, uploadAvatar, updateSettings } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { getListVariants, getListItemVariants } = useSmoothtTransitions();
  const { isMobile } = useResponsive();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      cpf: user?.cpf || "",
      creci: user?.creci || "",
      bio: user?.bio || "",
    },
  });

  // Query para buscar logs de atividade
  const { data: activityData } = useQuery({
    queryKey: ['profile', 'activity'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/profile/activity?limit=10');
      return await response.json();
    },
    enabled: activeTab === 'security',
  });

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      toast({
        title: "Sucesso!",
        description: "Perfil atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar perfil.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho do arquivo (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "Arquivo muito grande. Máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      await uploadAvatar(file);
      toast({
        title: "Sucesso!",
        description: "Avatar atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload do avatar.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSettingsUpdate = async (settingKey: string, value: any) => {
    try {
      await updateSettings({ [settingKey]: value });
      toast({
        title: "Sucesso!",
        description: "Configuração atualizada.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração.",
        variant: "destructive",
      });
    }
  };

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "security", label: "Segurança", icon: Shield },
    { id: "appearance", label: "Aparência", icon: Palette },
    { id: "about", label: "Sobre", icon: Info },
  ];

  const formatActionText = (action: string, entity: string) => {
    const actions: Record<string, string> = {
      'created': 'criou',
      'updated': 'atualizou',
      'deleted': 'deletou',
      'viewed': 'visualizou',
    };
    
    const entities: Record<string, string> = {
      'profile': 'perfil',
      'avatar': 'avatar',
      'settings': 'configurações',
      'property': 'propriedade',
      'contract': 'contrato',
      'document': 'documento',
    };
    
    return `${actions[action] || action} ${entities[entity] || entity}`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 scroll-elegant">
      {/* Header */}
      <div>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-4 gap-6"
        variants={getListVariants()}
        initial="hidden"
        animate="visible"
      >
        {/* Sidebar */}
        <motion.div variants={getListItemVariants()}>
          <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </Button>
                );
              })}
            </nav>
          </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div variants={getListItemVariants()}>
              <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais e profissionais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                    ) : null}
                    <AvatarFallback className="text-lg">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Alterar Foto
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPG, PNG, GIF ou WebP. Máximo 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Profile Form */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sobrenome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input {...field} className="pl-10" type="email" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pl-10" placeholder="(11) 99999-9999" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pl-10" placeholder="000.000.000-00" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="creci"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CRECI</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Número do CRECI" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Conte um pouco sobre você e sua experiência no mercado imobiliário..."
                              className="min-h-[100px] scroll-area"
                            />
                          </FormControl>
                          <FormDescription>
                            Máximo 500 caracteres
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full md:w-auto">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </form>
                </Form>
              </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <motion.div variants={getListItemVariants()}>
              <NotificationSettings />
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <motion.div variants={getListItemVariants()} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Segurança da Conta</CardTitle>
                  <CardDescription>
                    Gerencie as configurações de segurança da sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Autenticação</h4>
                      <p className="text-sm text-muted-foreground">
                        Conectado via sistema interno
                      </p>
                    </div>
                    <Badge variant="secondary">Ativo</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Alterar Senha</h4>
                      <p className="text-sm text-muted-foreground">
                        Última alteração há mais de 30 dias
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Alterar Senha
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Sessões Ativas</h4>
                      <p className="text-sm text-muted-foreground">
                        Gerencie dispositivos conectados
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver Sessões
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Log */}
              <Card>
                <CardHeader>
                  <CardTitle>Log de Atividades</CardTitle>
                  <CardDescription>
                    Últimas atividades realizadas na sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-60 overflow-y-auto dropdown-scroll">
                    {activityData?.activities?.map((activity: any) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {formatActionText(activity.action, activity.entity)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Privacidade</CardTitle>
                  <CardDescription>
                    Configure suas preferências de privacidade
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-medium">Perfil Público</Label>
                      <p className="text-sm text-muted-foreground">
                        Permitir que outros corretores vejam seu perfil
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-medium">Análise de Uso</Label>
                      <p className="text-sm text-muted-foreground">
                        Ajudar a melhorar o sistema com dados de uso anônimos
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <motion.div variants={getListItemVariants()}>
              <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                  Personalize a aparência do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="font-medium mb-3 block">Tema</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          theme === "light" ? "border-primary bg-primary/5" : "border-border"
                        }`}
                        onClick={() => theme === "dark" && toggleTheme()}
                      >
                        <div className="bg-white rounded border p-2 mb-2">
                          <div className="space-y-1">
                            <div className="h-2 bg-gray-200 rounded"></div>
                            <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                          </div>
                        </div>
                        <p className="font-medium">Claro</p>
                        <p className="text-sm text-muted-foreground">Tema padrão com fundo claro</p>
                      </div>

                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          theme === "dark" ? "border-primary bg-primary/5" : "border-border"
                        }`}
                        onClick={() => theme === "light" && toggleTheme()}
                      >
                        <div className="bg-gray-800 rounded border p-2 mb-2">
                          <div className="space-y-1">
                            <div className="h-2 bg-gray-600 rounded"></div>
                            <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                          </div>
                        </div>
                        <p className="font-medium">Escuro</p>
                        <p className="text-sm text-muted-foreground">Tema escuro para reduzir fadiga visual</p>
                      </div>
                    </div>
                  </div>

<Separator />

                  <div>
                    <Label className="font-medium mb-3 block">Fuso Horário</Label>
                    <Select defaultValue="America/Sao_Paulo" onValueChange={(value: any) => handleSettingsUpdate('timezone', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                        <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                        <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              </Card>
            </motion.div>
          )}

          {/* About Tab */}
          {activeTab === "about" && (
            <motion.div variants={getListItemVariants()}>
              <Card>
              <CardHeader>
                <CardTitle>Sobre o Sistema</CardTitle>
                <CardDescription>
                  Informações sobre o Ventus Hub
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">V</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Ventus Hub - Corretores</h3>
                    <p className="text-muted-foreground">Versão 1.0.0</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Funcionalidades</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Gestão completa de imóveis</li>
                      <li>• Automação de processos com IA</li>
                      <li>• Due diligence automatizada</li>
                      <li>• Geração de contratos</li>
                      <li>• Timeline de acompanhamento</li>
                      <li>• Notificações inteligentes</li>
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Suporte</h4>
                    <p className="text-sm text-muted-foreground">
                      Para dúvidas ou suporte técnico, entre em contato através do e-mail:
                    </p>
                    <p className="text-sm font-medium">suporte@ventushub.com</p>
                  </div>

                  <Separator />

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      © 2025 Ventus Hub. Todos os direitos reservados.
                    </p>
                  </div>
                </div>
              </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
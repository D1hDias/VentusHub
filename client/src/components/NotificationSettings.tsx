import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Volume2, 
  Vibrate,
  Clock,
  Filter,
  Settings2,
  Save,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
// Simple notification preferences hook for the simplified system
const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    globalEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    timezone: 'America/Sao_Paulo',
    digestFrequency: 'instant',
    maxNotificationsPerDay: 50,
    groupingEnabled: true,
    smartDeliveryEnabled: false,
    priorityFiltering: false,
    duplicateDetection: true,
    autoArchiveDays: 30,
    categoryPreferences: {}
  });
  
  const updatePreferences = async (newPreferences: any) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
    // In a real app, this would save to the server
    console.log('Preferences updated:', newPreferences);
  };
  
  return {
    preferences,
    isLoading: false,
    updatePreferences,
    isUpdating: false
  };
};

type NotificationPreferences = {
  globalEnabled?: boolean;
  emailEnabled?: boolean;  
  pushEnabled?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
  digestFrequency?: string;
  maxNotificationsPerDay?: number;
  groupingEnabled?: boolean;
  smartDeliveryEnabled?: boolean;
  priorityFiltering?: boolean;
  duplicateDetection?: boolean;
  autoArchiveDays?: number;
  categoryPreferences?: Record<string, any>;
};

// Category configuration
const notificationCategories = [
  { key: 'property', label: 'Imóveis', description: 'Criação, atualização e avanço de etapas', icon: '🏠' },
  { key: 'client', label: 'Clientes', description: 'Notas, lembretes e follow-ups', icon: '👥' },
  { key: 'contract', label: 'Contratos', description: 'Propostas, assinaturas e vencimentos', icon: '📄' },
  { key: 'financial', label: 'Financeiro', description: 'Comissões, pagamentos e vencimentos', icon: '💰' },
  { key: 'system', label: 'Sistema', description: 'Manutenção, atualizações e alertas', icon: '⚙️' },
  { key: 'workflow', label: 'Workflow', description: 'Aprovações, prazos e tarefas', icon: '🔄' },
];

// Channel configuration
const deliveryChannels = [
  { 
    key: 'email', 
    label: 'E-mail', 
    description: 'Receber notificações por e-mail',
    icon: Mail,
    defaultEnabled: true
  },
  { 
    key: 'push', 
    label: 'Push', 
    description: 'Notificações push no navegador',
    icon: Bell,
    defaultEnabled: true
  },
  { 
    key: 'sms', 
    label: 'SMS', 
    description: 'Mensagens de texto (apenas críticas)',
    icon: MessageSquare,
    defaultEnabled: false
  },
];

// Time zones for Brazil
const timeZones = [
  { value: 'America/Sao_Paulo', label: 'Brasília (UTC-3)' },
  { value: 'America/Manaus', label: 'Manaus (UTC-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (UTC-5)' },
];

interface CategoryPreferenceProps {
  category: typeof notificationCategories[0];
  preferences: any;
  onPreferenceChange: (category: string, field: string, value: any) => void;
}

const CategoryPreference: React.FC<CategoryPreferenceProps> = ({
  category,
  preferences,
  onPreferenceChange
}) => {
  const categoryPrefs = preferences[category.key] || {};
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{category.icon}</span>
            <div>
              <h4 className="font-medium">{category.label}</h4>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
          </div>
          <Switch
            checked={categoryPrefs.enabled !== false}
            onCheckedChange={(enabled) => 
              onPreferenceChange(category.key, 'enabled', enabled)
            }
          />
        </div>

        {categoryPrefs.enabled !== false && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-3 border-t"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Prioridade Mínima</Label>
                <Select
                  value={categoryPrefs.minSeverity || 'low'}
                  onValueChange={(value) => 
                    onPreferenceChange(category.key, 'minSeverity', value)
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium">Canais</Label>
                <div className="flex gap-1 mt-1">
                  {deliveryChannels.map((channel) => (
                    <Button
                      key={channel.key}
                      variant={
                        (categoryPrefs.channels || ['in_app', 'email']).includes(channel.key)
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => {
                        const currentChannels = categoryPrefs.channels || ['in_app', 'email'];
                        const newChannels = currentChannels.includes(channel.key)
                          ? currentChannels.filter((c: string) => c !== channel.key)
                          : [...currentChannels, channel.key];
                        onPreferenceChange(category.key, 'channels', newChannels);
                      }}
                    >
                      <channel.icon className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Timing preferences */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Frequência</Label>
              <Select
                value={categoryPrefs.frequency || 'instant'}
                onValueChange={(value) => 
                  onPreferenceChange(category.key, 'frequency', value)
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Imediato</SelectItem>
                  <SelectItem value="hourly">Por hora</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

interface NotificationSettingsProps {
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className
}) => {
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences();
  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferences>>(preferences || {});
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when preferences are loaded
  React.useEffect(() => {
    if (preferences && !hasChanges) {
      setLocalPreferences(preferences);
    }
  }, [preferences, hasChanges]);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleCategoryPreferenceChange = (category: string, field: string, value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      categoryPreferences: {
        ...prev.categoryPreferences,
        [category]: {
          ...(prev.categoryPreferences?.[category] || {}),
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updatePreferences(localPreferences);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleReset = () => {
    setLocalPreferences(preferences || {});
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings2 className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Configurações de Notificações</h2>
            <p className="text-muted-foreground">
              Personalize como e quando você recebe notificações
            </p>
          </div>
        </div>

        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={isUpdating}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Descartar
            </Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Master toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Ativar Notificações</Label>
                  <p className="text-sm text-muted-foreground">
                    Desativar irá pausar todas as notificações
                  </p>
                </div>
                <Switch
                  checked={localPreferences.globalEnabled !== false}
                  onCheckedChange={(checked) => handlePreferenceChange('globalEnabled', checked)}
                />
              </div>

              <Separator />

              {/* Quiet hours */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Label className="font-medium">Horário Silencioso</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Início</Label>
                    <Input
                      type="time"
                      value={localPreferences.quietHoursStart || ''}
                      onChange={(e) => handlePreferenceChange('quietHoursStart', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Fim</Label>
                    <Input
                      type="time"
                      value={localPreferences.quietHoursEnd || ''}
                      onChange={(e) => handlePreferenceChange('quietHoursEnd', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Timezone */}
              <div className="space-y-2">
                <Label className="font-medium">Fuso Horário</Label>
                <Select
                  value={localPreferences.timezone || 'America/Sao_Paulo'}
                  onValueChange={(value) => handlePreferenceChange('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeZones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Digest frequency */}
              <div className="space-y-2">
                <Label className="font-medium">Frequência de Resumo</Label>
                <Select
                  value={localPreferences.digestFrequency || 'instant'}
                  onValueChange={(value) => handlePreferenceChange('digestFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Imediato</SelectItem>
                    <SelectItem value="hourly">A cada hora</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Para frequências não imediatas, notificações críticas sempre são enviadas instantaneamente
                </p>
              </div>

              <Separator />

              {/* Daily limit */}
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">
                    Limite Diário: {localPreferences.maxNotificationsPerDay || 50} notificações
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Limite máximo de notificações por dia
                  </p>
                </div>
                <Slider
                  value={[localPreferences.maxNotificationsPerDay || 50]}
                  onValueChange={([value]) => handlePreferenceChange('maxNotificationsPerDay', value)}
                  max={200}
                  min={5}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Channels */}
        <TabsContent value="channels" className="space-y-6">
          <div className="grid gap-6">
            {deliveryChannels.map((channel) => (
              <Card key={channel.key}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <channel.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{channel.label}</h3>
                        <p className="text-sm text-muted-foreground">{channel.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={localPreferences[`${channel.key}Enabled` as keyof NotificationPreferences] !== false}
                      onCheckedChange={(checked) => 
                        handlePreferenceChange(`${channel.key}Enabled` as keyof NotificationPreferences, checked)
                      }
                    />
                  </div>

                  {channel.key === 'email' && localPreferences.emailEnabled !== false && (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <Label className="text-sm font-medium">Configurações de E-mail</Label>
                      <div className="flex items-center justify-between text-sm">
                        <span>Incluir em resumos diários</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>E-mails de marketing</span>
                        <Switch />
                      </div>
                    </div>
                  )}

                  {channel.key === 'push' && localPreferences.pushEnabled !== false && (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <Label className="text-sm font-medium">Configurações Push</Label>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4" />
                          <span>Som das notificações</span>
                        </div>
                        <Switch
                          checked={localPreferences.soundEnabled !== false}
                          onCheckedChange={(checked) => handlePreferenceChange('soundEnabled', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Vibrate className="h-4 w-4" />
                          <span>Vibração (mobile)</span>
                        </div>
                        <Switch
                          checked={localPreferences.vibrationEnabled !== false}
                          onCheckedChange={(checked) => handlePreferenceChange('vibrationEnabled', checked)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Category Preferences */}
        <TabsContent value="categories" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Preferências por Categoria</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Configure como receber notificações para cada tipo de evento
            </p>
          </div>

          <div className="grid gap-4">
            {notificationCategories.map((category) => (
              <CategoryPreference
                key={category.key}
                category={category}
                preferences={localPreferences.categoryPreferences || {}}
                onPreferenceChange={handleCategoryPreferenceChange}
              />
            ))}
          </div>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Configurações Avançadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Agrupamento Inteligente</Label>
                  <p className="text-sm text-muted-foreground">
                    Agrupar notificações relacionadas automaticamente
                  </p>
                </div>
                <Switch
                  checked={localPreferences.groupingEnabled !== false}
                  onCheckedChange={(checked) => handlePreferenceChange('groupingEnabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Entrega Inteligente</Label>
                  <p className="text-sm text-muted-foreground">
                    Usar IA para otimizar horários de entrega
                  </p>
                </div>
                <Switch
                  checked={localPreferences.smartDeliveryEnabled !== false}
                  onCheckedChange={(checked) => handlePreferenceChange('smartDeliveryEnabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Filtragem por Prioridade</Label>
                  <p className="text-sm text-muted-foreground">
                    Filtrar automaticamente notificações de baixa prioridade
                  </p>
                </div>
                <Switch
                  checked={localPreferences.priorityFiltering === true}
                  onCheckedChange={(checked) => handlePreferenceChange('priorityFiltering', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Detecção de Duplicatas</Label>
                  <p className="text-sm text-muted-foreground">
                    Evitar notificações duplicadas automaticamente
                  </p>
                </div>
                <Switch
                  checked={localPreferences.duplicateDetection !== false}
                  onCheckedChange={(checked) => handlePreferenceChange('duplicateDetection', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="font-medium">
                    Auto-arquivar após: {localPreferences.autoArchiveDays || 30} dias
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Arquivar automaticamente notificações antigas
                  </p>
                </div>
                <Slider
                  value={[localPreferences.autoArchiveDays || 30]}
                  onValueChange={([value]) => handlePreferenceChange('autoArchiveDays', value)}
                  max={365}
                  min={1}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationSettings;
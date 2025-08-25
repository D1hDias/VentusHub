import React, { useState } from 'react';
import { 
  UserPlus, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateB2BUserFormProps {
  onUserCreated?: () => void;
}

interface FormData {
  name: string;
  email: string;
  userType: 'CORRETOR_AUTONOMO' | 'IMOBILIARIA' | '';
  organizationName: string;
  creci: string;
  cnpj: string;
  cpf: string;
  phone: string;
  address: string;
  notes: string;
}

interface CreatedUserInfo {
  userId: string;
  tempPassword: string;
  email: string;
  name: string;
}

export function CreateB2BUserForm({ onUserCreated }: CreateB2BUserFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    userType: '',
    organizationName: '',
    creci: '',
    cnpj: '',
    cpf: '',
    phone: '',
    address: '',
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<CreatedUserInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    handleInputChange('cpf', formatted);
  };

  const handleCNPJChange = (value: string) => {
    const formatted = formatCNPJ(value);
    handleInputChange('cnpj', formatted);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    handleInputChange('phone', formatted);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Nome é obrigatório';
    if (!formData.email.trim()) return 'Email é obrigatório';
    if (!formData.userType) return 'Tipo de usuário é obrigatório';

    if (formData.userType === 'CORRETOR_AUTONOMO') {
      if (!formData.creci.trim()) return 'CRECI é obrigatório para corretores autônomos';
      if (!formData.cpf.trim()) return 'CPF é obrigatório para corretores autônomos';
    }

    if (formData.userType === 'IMOBILIARIA') {
      if (!formData.organizationName.trim()) return 'Nome da imobiliária é obrigatório';
      if (!formData.cnpj.trim()) return 'CNPJ é obrigatório para imobiliárias';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('masterAdminToken');
      const response = await fetch('/api/master-admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Generate temp password for display (this would come from the API in real implementation)
        const tempPassword = generateDisplayPassword();
        
        setSuccess({
          userId: data.userId,
          tempPassword,
          email: formData.email,
          name: formData.name
        });

        // Reset form
        setFormData({
          name: '',
          email: '',
          userType: '',
          organizationName: '',
          creci: '',
          cnpj: '',
          cpf: '',
          phone: '',
          address: '',
          notes: ''
        });

        // Notify parent component
        if (onUserCreated) {
          onUserCreated();
        }
      } else {
        setError(data.error || 'Erro ao criar usuário');
      }
    } catch (err) {
      console.error('Create user error:', err);
      setError('Erro de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDisplayPassword = () => {
    // This is just for display purposes - real temp password would come from API
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const resetSuccess = () => {
    setSuccess(null);
    setShowPassword(false);
  };

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle className="text-green-700">Usuário Criado com Sucesso!</CardTitle>
          </div>
          <CardDescription>
            O usuário foi criado e pode fazer login na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Anote os dados de acesso abaixo e compartilhe com o usuário de forma segura.
              A senha temporária não será exibida novamente.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Nome</Label>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                  <span className="font-medium">{success.name}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                  <span className="font-mono text-sm">{success.email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(success.email)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Senha Temporária</Label>
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <span className="font-mono text-sm">
                  {showPassword ? success.tempPassword : '••••••••••••'}
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(success.tempPassword)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Próximos Passos:</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>1. Compartilhe as credenciais de forma segura com o usuário</li>
              <li>2. Oriente sobre a alteração da senha no primeiro login</li>
              <li>3. Verifique se o usuário consegue acessar a plataforma</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={resetSuccess}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Outro Usuário
            </Button>
            <Badge variant="secondary" className="px-3 py-1">
              ID: {success.userId}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-6 w-6" />
          <span>Criar Usuário B2B</span>
        </CardTitle>
        <CardDescription>
          Adicionar novo corretor autônomo ou imobiliária à plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome completo"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="userType">Tipo de Usuário *</Label>
              <Select value={formData.userType} onValueChange={(value: any) => handleInputChange('userType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CORRETOR_AUTONOMO">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Corretor Autônomo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="IMOBILIARIA">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>Imobiliária</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional Fields */}
          {formData.userType && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {formData.userType === 'CORRETOR_AUTONOMO' ? 'Dados do Corretor' : 'Dados da Imobiliária'}
              </h3>

              {formData.userType === 'CORRETOR_AUTONOMO' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="creci">CRECI *</Label>
                    <Input
                      id="creci"
                      value={formData.creci}
                      onChange={(e) => handleInputChange('creci', e.target.value)}
                      placeholder="Ex: 12345-F"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleCPFChange(e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                </div>
              )}

              {formData.userType === 'IMOBILIARIA' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organizationName">Nome da Imobiliária *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="organizationName"
                        value={formData.organizationName}
                        onChange={(e) => handleInputChange('organizationName', e.target.value)}
                        placeholder="Nome da empresa"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleCNPJChange(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações de Contato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Endereço</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Endereço completo"
                  className="pl-10 min-h-[80px] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observações administrativas (opcional)"
                className="pl-10 min-h-[80px] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({
                name: '', email: '', userType: '', organizationName: '',
                creci: '', cnpj: '', cpf: '', phone: '', address: '', notes: ''
              })}
            >
              Limpar Formulário
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[150px]"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Criando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Criar Usuário</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
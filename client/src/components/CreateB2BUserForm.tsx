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
  Copy,
  Home,
  Hash,
  Banknote,
  CreditCard
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
  businessName: string;    // Campo híbrido: Nome Completo (PF) ou Razão Social (PJ)
  email: string;
  userType: 'CORRETOR_AUTONOMO' | 'IMOBILIARIA' | '';
  document: string;        // Campo híbrido: CPF (PF) ou CNPJ (PJ)
  creci: string;           // Universal: CRECI PF ou PJ
  tradeName: string;       // Específico: Nome Fantasia (só PJ)
  phone: string;
  // Informações Financeiras
  bank: string;
  agency: string;
  account: string;
  pixKey: string;
  // Campos de endereço modernos
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
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
    businessName: '',
    email: '',
    userType: '',
    document: '',
    creci: '',
    tradeName: '',
    phone: '',
    bank: '',
    agency: '',
    account: '',
    pixKey: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<CreatedUserInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Set<keyof FormData>>(new Set());

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError('');
    // Remove field from errors when user starts typing
    if (fieldErrors.has(field)) {
      setFieldErrors(prev => {
        const newErrors = new Set(prev);
        newErrors.delete(field);
        return newErrors;
      });
    }
  };

  // Máscara híbrida para CPF/CNPJ baseada no tipo de usuário
  const formatDocument = (value: string, userType: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (userType === 'CORRETOR_AUTONOMO') {
      // Formato CPF: XXX.XXX.XXX-XX
      if (numbers.length <= 11) {
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
    } else if (userType === 'IMOBILIARIA') {
      // Formato CNPJ: XX.XXX.XXX/XXXX-XX
      if (numbers.length <= 14) {
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
    } else {
      // Auto-detectar baseado no tamanho
      if (numbers.length <= 11) {
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else if (numbers.length <= 14) {
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
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

  const handleDocumentChange = (value: string) => {
    const formatted = formatDocument(value, formData.userType);
    handleInputChange('document', formatted);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    handleInputChange('phone', formatted);
  };

  // Formatação de CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  // Buscar endereço via CEP
  const fetchAddressByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }));
      } else {
        setError('CEP não encontrado');
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      setError('Erro ao buscar o endereço pelo CEP');
    } finally {
      setCepLoading(false);
    }
  };

  const handleCEPChange = (value: string) => {
    const formatted = formatCEP(value);
    handleInputChange('cep', formatted);
    
    // Auto-buscar quando CEP estiver completo
    const cleanCEP = formatted.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      fetchAddressByCEP(formatted);
    }
  };

  const validateForm = (): string | null => {
    const errors = new Set<keyof FormData>();
    let firstError: string | null = null;

    // Validações básicas
    if (!formData.userType) {
      errors.add('userType');
      if (!firstError) firstError = 'Tipo de usuário é obrigatório';
    }
    
    if (!formData.businessName.trim()) {
      errors.add('businessName');
      if (!firstError) firstError = 'Nome/Razão Social é obrigatório';
    }
    
    if (!formData.email.trim()) {
      errors.add('email');
      if (!firstError) firstError = 'Email é obrigatório';
    }
    
    if (!formData.document.trim()) {
      errors.add('document');
      if (!firstError) firstError = 'CPF/CNPJ é obrigatório';
    }

    // Validação específica do documento baseado no tipo
    if (formData.document.trim()) {
      const numbers = formData.document.replace(/\D/g, '');
      if (formData.userType === 'CORRETOR_AUTONOMO') {
        if (numbers.length !== 11) {
          errors.add('document');
          if (!firstError) firstError = 'CPF deve ter 11 dígitos';
        }
      } else if (formData.userType === 'IMOBILIARIA') {
        if (numbers.length !== 14) {
          errors.add('document');
          if (!firstError) firstError = 'CNPJ deve ter 14 dígitos';
        }
      }
    }

    if (!formData.creci.trim()) {
      errors.add('creci');
      if (!firstError) firstError = 'CRECI é obrigatório';
    }

    if (!formData.phone.trim()) {
      errors.add('phone');
      if (!firstError) firstError = 'Telefone é obrigatório';
    }

    // Validações de endereço - todos obrigatórios exceto complemento
    if (!formData.cep.trim()) {
      errors.add('cep');
      if (!firstError) firstError = 'CEP é obrigatório';
    } else {
      const cepNumbers = formData.cep.replace(/\D/g, '');
      if (cepNumbers.length !== 8) {
        errors.add('cep');
        if (!firstError) firstError = 'CEP deve ter 8 dígitos';
      }
    }
    
    if (!formData.street.trim()) {
      errors.add('street');
      if (!firstError) firstError = 'Logradouro é obrigatório';
    }
    
    if (!formData.number.trim()) {
      errors.add('number');
      if (!firstError) firstError = 'Número é obrigatório';
    }
    
    // Complemento é opcional - não validar
    
    if (!formData.neighborhood.trim()) {
      errors.add('neighborhood');
      if (!firstError) firstError = 'Bairro é obrigatório';
    }
    
    if (!formData.city.trim()) {
      errors.add('city');
      if (!firstError) firstError = 'Cidade é obrigatória';
    }
    
    if (!formData.state.trim()) {
      errors.add('state');
      if (!firstError) firstError = 'UF é obrigatória';
    }

    // Atualizar campos com erro
    setFieldErrors(errors);

    return firstError;
  };

  // Função para obter classes CSS dos campos com erro
  const getFieldClassName = (fieldName: keyof FormData, baseClassName: string = '') => {
    const hasError = fieldErrors.has(fieldName);
    const baseClasses = baseClassName || '';
    const errorClasses = hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
    return `${baseClasses} ${errorClasses}`.trim();
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
      // Token is now sent automatically via secure httpOnly cookie
      const response = await fetch('/api/master-admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include secure cookies
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
          name: formData.businessName
        });

        // Reset form
        setFormData({
          businessName: '',
          email: '',
          userType: '',
          document: '',
          creci: '',
          tradeName: '',
          phone: '',
          bank: '',
          agency: '',
          account: '',
          pixKey: '',
          cep: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          notes: ''
        });

        // Clear field errors
        setFieldErrors(new Set());

        // Notify parent component
        if (onUserCreated) {
          onUserCreated();
        }
      } else {
        // Se houver detalhes de validação, mostrar a primeira mensagem
        let errorMessage = data.error || 'Erro ao criar usuário';
        
        if (data.details && Array.isArray(data.details) && data.details.length > 0) {
          const firstDetail = data.details[0];
          errorMessage = `${firstDetail.path?.join('.')}: ${firstDetail.message}` || errorMessage;
        }
        
        setError(errorMessage);
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
            
            {/* Tipo de Usuário - Primeiro campo */}
            <div>
              <Label htmlFor="userType">Tipo de Usuário *</Label>
              <Select value={formData.userType} onValueChange={(value: any) => handleInputChange('userType', value)}>
                <SelectTrigger className={getFieldClassName('userType')}>
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

            <div>
              <Label htmlFor="businessName">
                {formData.userType === 'IMOBILIARIA' ? 'Razão Social *' : 'Nome Completo *'}
              </Label>
              <div className="relative">
                {formData.userType === 'IMOBILIARIA' ? (
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                ) : (
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                )}
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder={formData.userType === 'IMOBILIARIA' ? 'Razão social da empresa' : 'Nome completo'}
                  className={getFieldClassName('businessName', 'pl-10')}
                  required
                />
              </div>
            </div>
          </div>

          {/* Professional Data - Conditional Fields */}
          {formData.userType && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {formData.userType === 'CORRETOR_AUTONOMO' ? 'Dados Profissionais' : 'Dados da Imobiliária'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CRECI - Universal para ambos */}
                <div>
                  <Label htmlFor="creci">
                    CRECI {formData.userType === 'CORRETOR_AUTONOMO' ? '(PF) *' : '(PJ) *'}
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      id="creci"
                      value={formData.creci}
                      onChange={(e) => handleInputChange('creci', e.target.value)}
                      placeholder={formData.userType === 'CORRETOR_AUTONOMO' ? 'Ex: 12345-F' : 'Ex: 12345-J'}
                      className={getFieldClassName('creci', 'pl-10')}
                    />
                  </div>
                </div>

                {/* Nome Fantasia - Só para Imobiliária */}
                {formData.userType === 'IMOBILIARIA' && (
                  <div>
                    <Label htmlFor="tradeName">Nome Fantasia</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="tradeName"
                        value={formData.tradeName}
                        onChange={(e) => handleInputChange('tradeName', e.target.value)}
                        placeholder="Nome fantasia (opcional)"
                        className={getFieldClassName('tradeName', 'pl-10')}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações de Contato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={getFieldClassName('email', 'pl-10')}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="document">
                  {formData.userType === 'CORRETOR_AUTONOMO' ? 'CPF *' : 
                   formData.userType === 'IMOBILIARIA' ? 'CNPJ *' : 'CPF/CNPJ *'}
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="document"
                    value={formData.document}
                    onChange={(e) => handleDocumentChange(e.target.value)}
                    placeholder={
                      formData.userType === 'CORRETOR_AUTONOMO' ? '000.000.000-00' :
                      formData.userType === 'IMOBILIARIA' ? '00.000.000/0000-00' : 
                      'CPF ou CNPJ'
                    }
                    className={getFieldClassName('document', 'pl-10')}
                    maxLength={18}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className={getFieldClassName('phone', 'pl-10')}
                    maxLength={15}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Campos de Endereço Modernos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CEP */}
              <div>
                <Label htmlFor="cep">CEP *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleCEPChange(e.target.value)}
                    placeholder="00000-000"
                    className={getFieldClassName('cep', 'pl-10')}
                    maxLength={9}
                    required
                  />
                  {cepLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Logradouro */}
              <div className="md:col-span-2">
                <Label htmlFor="street">Logradouro *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    placeholder="Rua, Avenida, Estrada, etc."
                    className={getFieldClassName('street', 'pl-10')}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Número */}
              <div>
                <Label htmlFor="number">Número *</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    placeholder="123"
                    className={getFieldClassName('number', 'pl-10')}
                    required
                  />
                </div>
              </div>

              {/* Complemento */}
              <div>
                <Label htmlFor="complement">Complemento</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="complement"
                    value={formData.complement}
                    onChange={(e) => handleInputChange('complement', e.target.value)}
                    placeholder="Apt, Sala, Bloco..."
                    className={getFieldClassName('complement', 'pl-10')}
                  />
                </div>
              </div>

              {/* Bairro */}
              <div>
                <Label htmlFor="neighborhood">Bairro *</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    placeholder="Centro, Vila Nova..."
                    className={getFieldClassName('neighborhood', 'pl-10')}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Cidade */}
              <div className="md:col-span-3">
                <Label htmlFor="city">Cidade *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="São Paulo, Rio de Janeiro..."
                    className={getFieldClassName('city', 'pl-10')}
                    required
                  />
                </div>
              </div>

              {/* UF */}
              <div>
                <Label htmlFor="state">UF *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                    className={getFieldClassName('state', 'uppercase pl-10')}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Financeiras</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bank">Banco</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="bank"
                    value={formData.bank}
                    onChange={(e) => handleInputChange('bank', e.target.value)}
                    placeholder="Ex: Banco do Brasil, Itaú, Santander"
                    className={getFieldClassName('bank', 'pl-10')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="agency">Agência</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="agency"
                    value={formData.agency}
                    onChange={(e) => handleInputChange('agency', e.target.value)}
                    placeholder="Ex: 1234"
                    className={getFieldClassName('agency', 'pl-10')}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account">Conta</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="account"
                    value={formData.account}
                    onChange={(e) => handleInputChange('account', e.target.value)}
                    placeholder="Ex: 12345-6"
                    className={getFieldClassName('account', 'pl-10')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pixKey">Chave PIX</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="pixKey"
                    value={formData.pixKey}
                    onChange={(e) => handleInputChange('pixKey', e.target.value)}
                    placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
                    className={getFieldClassName('pixKey', 'pl-10')}
                  />
                </div>
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
              onClick={() => {
                setFormData({
                  businessName: '', email: '', userType: '', document: '',
                  creci: '', tradeName: '', phone: '', bank: '', agency: '',
                  account: '', pixKey: '', cep: '', street: '', number: '',
                  complement: '', neighborhood: '', city: '', state: '', notes: ''
                });
                setFieldErrors(new Set());
              }}
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
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit3,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  PhoneCall,
  Users,
  DollarSign,
  Briefcase,
  Upload,
  Eye,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClientModal } from "@/components/ClientModal";
import { ClientNoteModal } from "@/components/ClientNoteModal";

interface Client {
  id?: string;
  fullName: string;
  cpf: string;
  birthDate?: string;
  email: string;
  phonePrimary: string;
  phoneSecondary?: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  maritalStatus: 'Solteiro' | 'Casado' | 'Divorciado' | 'Viúvo';
  profession?: string;
  monthlyIncome?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ClientNote {
  id: number;
  clientId: number;
  userId: string;
  title: string;
  content: string;
  type: 'note' | 'reminder' | 'follow_up' | 'meeting' | 'call';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  reminderDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientDocument {
  id: number;
  clientId: number;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  storageUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface ClientDetailsResponse {
  client: Client;
  notes: ClientNote[];
  documents?: ClientDocument[];
  stats: {
    total: number;
    pending: number;
    completed: number;
    reminders: number;
    notes: number;
    meetings: number;
    calls: number;
  };
}

export default function ClientDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/client/:id");
  const clientId = params?.id;
  const [showClientModal, setShowClientModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteModalType, setNoteModalType] = useState<'note' | 'reminder' | 'call' | 'meeting'>('note');
  const [refreshKey, setRefreshKey] = useState(0);
  const [localClientData, setLocalClientData] = useState<Client | null>(null);
  
  // Document management state
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);

  const { data: clientDetails, isLoading, error } = useQuery({
    queryKey: [`/api/clients/${clientId}/details`, refreshKey],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/details`);

      if (!response.ok) {
        throw new Error(`Failed to fetch client: ${response.status}`);
      }

      const data = await response.json() as ClientDetailsResponse;
      
      // Update local documents state
      if (data.documents) {
        setDocuments(data.documents);
      }
      
      return data;
    },
    enabled: !!clientId,
    staleTime: 0,
    cacheTime: 0,
  });

  const formatCPF = (cpf: string): string => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  const handleOpenNoteModal = (type: 'note' | 'reminder' | 'call' | 'meeting') => {
    setNoteModalType(type);
    setShowNoteModal(true);
  };

  const handleClientUpdated = (updatedClient: Client) => {
    // Atualizar dados locais imediatamente
    setLocalClientData(updatedClient);

    // Forçar refresh dos dados completos
    setRefreshKey(prev => prev + 1);
  };

  // Document handling functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !clientId) return;

    setUploadingDocument(true);
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clientId', clientId);

        const response = await fetch('/api/clients/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          if (response.status === 503) {
            throw new Error('Serviço de upload não configurado. Entre em contato com o administrador.');
          }
          throw new Error('Falha no upload do documento');
        }

        const newDocument = await response.json();
        setDocuments(prev => [...prev, newDocument]);
      }

      // Clear the input
      event.target.value = '';
      
      // Show success message
      alert('Documento(s) enviado(s) com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao enviar documento. Tente novamente.');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleViewDocument = (index: number) => {
    setCurrentDocumentIndex(index);
    setShowDocumentViewer(true);
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm('Tem certeza que deseja deletar este documento?')) return;

    try {
      const response = await fetch(`/api/clients/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao deletar documento');
      }

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      alert('Documento deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar documento. Tente novamente.');
    }
  };

  const navigateDocument = (direction: 'prev' | 'next') => {
    setCurrentDocumentIndex(prev => {
      if (direction === 'prev') {
        return prev > 0 ? prev - 1 : documents.length - 1;
      } else {
        return prev < documents.length - 1 ? prev + 1 : 0;
      }
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Atualizar título do documento/header quando cliente carregar
  useEffect(() => {
    if (clientDetails?.client) {
      const pageTitle = `Cliente`;
      document.title = `${pageTitle} - VentusHub`;

      // Dispatchar evento customizado para atualizar o header do Layout
      window.dispatchEvent(new CustomEvent('updatePageTitle', {
        detail: { title: pageTitle }
      }));
    }
  }, [clientDetails?.client]);

  const getMaritalStatusBadge = (status: string) => {
    const statusMap = {
      'Solteiro': { color: 'blue', label: 'Solteiro' },
      'Casado': { color: 'green', label: 'Casado' },
      'Divorciado': { color: 'orange', label: 'Divorciado' },
      'Viúvo': { color: 'gray', label: 'Viúvo' }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'gray', label: status };

    return (
      <Badge
        variant="outline"
        className={`text-${statusInfo.color}-600 border-${statusInfo.color}-600`}
      >
        <User className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'note': return <FileText className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'call': return <PhoneCall className="h-4 w-4" />;
      case 'follow_up': return <MessageSquare className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getNoteTypeBadge = (type: string) => {
    const typeMap = {
      'note': { color: 'blue', label: 'Nota' },
      'reminder': { color: 'yellow', label: 'Lembrete' },
      'meeting': { color: 'green', label: 'Reunião' },
      'call': { color: 'purple', label: 'Ligação' },
      'follow_up': { color: 'orange', label: 'Follow-up' }
    };

    const typeInfo = typeMap[type as keyof typeof typeMap] || { color: 'gray', label: type };

    return (
      <Badge variant="outline" className={`text-${typeInfo.color}-600 border-${typeInfo.color}-600`}>
        {getNoteTypeIcon(type)}
        <span className="ml-1">{typeInfo.label}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      'low': { color: 'gray', label: 'Baixa' },
      'normal': { color: 'blue', label: 'Normal' },
      'high': { color: 'orange', label: 'Alta' },
      'urgent': { color: 'red', label: 'Urgente' }
    };

    const priorityInfo = priorityMap[priority as keyof typeof priorityMap] || { color: 'gray', label: priority };

    return (
      <Badge variant="outline" className={`text-${priorityInfo.color}-600 border-${priorityInfo.color}-600`}>
        {priorityInfo.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Erro ao carregar cliente</h2>
          <p className="text-gray-600 mb-4">Erro: {error.message}</p>
          <p className="text-sm text-gray-500 mb-4">Client ID: {clientId}</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!clientDetails && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cliente não encontrado</h2>
          <p className="text-gray-600 mb-4">O cliente solicitado não existe ou foi removido.</p>
          <p className="text-sm text-gray-500 mb-4">Client ID: {clientId}</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const { client, notes, stats } = clientDetails!;

  // Usar dados locais se disponível (após edição), senão usar dados da query
  const currentClient = localClientData || client;

  return (
    <div className="min-h-screen bg-gray-50 card-desktop-compact">
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="border-gray-300 btn-desktop-compact !text-xs"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <User className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentClient.fullName}
                </h1>
              </div>
              <p className="text-gray-600 mt-1">
                CPF: {formatCPF(currentClient.cpf)} • {currentClient.addressCity}, {currentClient.addressState}
              </p>
            </div>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-sm"
            onClick={() => setShowClientModal(true)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Editar Cliente
          </Button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado Civil
                    </label>
                    {getMaritalStatusBadge(currentClient.maritalStatus)}
                  </div>
                  {currentClient.profession && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profissão
                      </label>
                      <p className="text-gray-900">{currentClient.profession}</p>
                    </div>
                  )}
                  {currentClient.monthlyIncome && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Renda Mensal
                      </label>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(currentClient.monthlyIncome)}
                      </p>
                    </div>
                  )}
                  {currentClient.birthDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Nascimento
                      </label>
                      <p className="text-gray-900">{formatDate(currentClient.birthDate)}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Contact Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Informações de Contato
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{currentClient.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{formatPhone(currentClient.phonePrimary)}</span>
                      <span className="text-gray-500">(Principal)</span>
                    </div>
                    {currentClient.phoneSecondary && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{formatPhone(currentClient.phoneSecondary)}</span>
                        <span className="text-gray-500">(Secundário)</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Address Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço Completo
                  </label>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-900">
                        {currentClient.addressStreet}, {currentClient.addressNumber}
                        {currentClient.addressComplement && `, ${currentClient.addressComplement}`}
                      </p>
                      <p className="text-gray-600">
                        {currentClient.addressNeighborhood}, {currentClient.addressCity} - {currentClient.addressState}
                      </p>
                      <p className="text-gray-600">CEP: {currentClient.addressZip}</p>
                    </div>
                  </div>
                </div>

                {currentClient.notes && (
                  <>
                    <Separator />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observações Gerais
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{currentClient.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes & Interactions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Notas e Interações ({notes.length})
                  </CardTitle>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleOpenNoteModal('note')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Nota
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma nota ou interação registrada</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleOpenNoteModal('note')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeira Nota
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-4 rounded-lg border-2 transition-all ${note.isCompleted
                          ? 'border-green-200 bg-green-50'
                          : note.priority === 'urgent'
                            ? 'border-red-200 bg-red-50'
                            : note.priority === 'high'
                              ? 'border-orange-200 bg-orange-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getNoteTypeBadge(note.type)}
                            {getPriorityBadge(note.priority)}
                            {note.isCompleted && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Concluída
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">{note.title}</h4>
                        <p className="text-gray-600 text-sm mb-2">{note.content}</p>
                        {note.reminderDate && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            Lembrete: {formatDate(note.reminderDate)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Documentos ({documents.length})
                  </CardTitle>
                  <div>
                    <input
                      type="file"
                      id="document-upload"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingDocument}
                    />
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => document.getElementById('document-upload')?.click()}
                      disabled={uploadingDocument}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingDocument ? 'Enviando...' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum documento anexado</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => document.getElementById('document-upload')?.click()}
                      disabled={uploadingDocument}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Adicionar Primeiro Documento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc, index) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-100">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.originalName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(doc.fileSize)} • {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(index)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                            title="Ver documento"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="hover:bg-red-50 hover:text-red-600"
                            title="Deletar documento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  onClick={() => handleOpenNoteModal('note')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Nota
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOpenNoteModal('reminder')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Agendar Lembrete
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOpenNoteModal('call')}
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Registrar Ligação
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOpenNoteModal('meeting')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Agendar Reunião
                </Button>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas CRM</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de interações</span>
                  <span className="font-medium">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pendentes</span>
                  <span className="font-medium text-orange-600">{stats.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Concluídas</span>
                  <span className="font-medium text-green-600">{stats.completed}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Notas</span>
                  <span className="font-medium">{stats.notes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lembretes</span>
                  <span className="font-medium">{stats.reminders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Reuniões</span>
                  <span className="font-medium">{stats.meetings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ligações</span>
                  <span className="font-medium">{stats.calls}</span>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Cliente cadastrado</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(currentClient.createdAt)}
                      </p>
                    </div>
                  </div>
                  {currentClient.updatedAt && currentClient.updatedAt !== currentClient.createdAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Última atualização</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(currentClient.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                  {notes.length > 0 && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Última interação</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(notes[0].createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Client Edit Modal */}
      <ClientModal
        open={showClientModal}
        onOpenChange={setShowClientModal}
        client={currentClient}
        onClientUpdated={handleClientUpdated}
      />

      {/* Client Note Modal */}
      {clientId && (
        <ClientNoteModal
          open={showNoteModal}
          onOpenChange={setShowNoteModal}
          clientId={clientId}
          noteType={noteModalType}
        />
      )}

      {/* Document Viewer Modal */}
      {showDocumentViewer && documents.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold">
                  {documents[currentDocumentIndex]?.originalName}
                </h3>
                {documents.length > 1 && (
                  <span className="text-sm text-gray-500">
                    {currentDocumentIndex + 1} de {documents.length}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {documents.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDocument('prev')}
                      title="Documento anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDocument('next')}
                      title="Próximo documento"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = documents[currentDocumentIndex]?.storageUrl;
                    link.download = documents[currentDocumentIndex]?.originalName;
                    link.click();
                  }}
                  title="Baixar documento"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocumentViewer(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Document Content */}
            <div className="flex-1 p-4 overflow-auto">
              {documents[currentDocumentIndex]?.mimeType.startsWith('image/') ? (
                <img
                  src={documents[currentDocumentIndex]?.storageUrl}
                  alt={documents[currentDocumentIndex]?.originalName}
                  className="max-w-full h-auto mx-auto"
                />
              ) : documents[currentDocumentIndex]?.mimeType === 'application/pdf' ? (
                <iframe
                  src={documents[currentDocumentIndex]?.storageUrl}
                  className="w-full h-full min-h-[600px] border-0"
                  title={documents[currentDocumentIndex]?.originalName}
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    Visualização não disponível para este tipo de arquivo.
                  </p>
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = documents[currentDocumentIndex]?.storageUrl;
                      link.download = documents[currentDocumentIndex]?.originalName;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Arquivo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AnimatedModal } from "@/components/ui/animated-modal";
import { motion, AnimatePresence } from "framer-motion";
import { useResponsive } from "@/hooks/useMediaQuery";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequestLegacy as apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { Upload, X, CloudUpload, CheckCircle, Eye, Download, Plus, Trash2, Banknote } from "lucide-react";

const BRAZILIAN_STATES = [
  { value: "AC", label: "AC" },
  { value: "AL", label: "AL" },
  { value: "AP", label: "AP" },
  { value: "AM", label: "AM" },
  { value: "BA", label: "BA" },
  { value: "CE", label: "CE" },
  { value: "DF", label: "DF" },
  { value: "ES", label: "ES" },
  { value: "GO", label: "GO" },
  { value: "MA", label: "MA" },
  { value: "MT", label: "MT" },
  { value: "MS", label: "MS" },
  { value: "MG", label: "MG" },
  { value: "PA", label: "PA" },
  { value: "PB", label: "PB" },
  { value: "PR", label: "PR" },
  { value: "PE", label: "PE" },
  { value: "PI", label: "PI" },
  { value: "RJ", label: "RJ" },
  { value: "RN", label: "RN" },
  { value: "RS", label: "RS" },
  { value: "RO", label: "RO" },
  { value: "RR", label: "RR" },
  { value: "SC", label: "SC" },
  { value: "SP", label: "SP" },
  { value: "SE", label: "SE" },
  { value: "TO", label: "TO" }
];

const ownerSchema = z.object({
  id: z.string(),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  maritalStatus: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().refine((email) => {
    if (email === '') return true; // Permite vazio
    return /\S+@\S+\.\S+/.test(email); // Valida formato se não estiver vazio
  }, "E-mail inválido"),
});

const propertySchema = z.object({
  type: z.string().min(1, "Tipo é obrigatório"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  cep: z.string().min(8, "CEP deve ter 8 dígitos").max(9, "CEP inválido"),
  value: z.string().min(1, "Valor é obrigatório"),
  owners: z.array(ownerSchema).min(1, "Pelo menos um proprietário é obrigatório"),
  registrationNumber: z.string().optional(),
  municipalRegistration: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface Property {
  id?: string;
  sequenceNumber?: string;
  type: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  value: string | number;
  owners?: any[];
  registrationNumber?: string;
  municipalRegistration?: string;
}

interface PropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
}

// Estender File para incluir categoria
interface FileWithCategory extends File {
  category?: string;
  ownerIndex?: number;
}

async function fetchAddressByCep(cep: string) {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();

    if (data.erro) {
      return null;
    }

    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}

export function PropertyModal({ open, onOpenChange, property }: PropertyModalProps) {
  const [files, setFiles] = useState<FileWithCategory[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [propertyDocuments, setPropertyDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!property;


  const [owners, setOwners] = useState([{
    id: crypto.randomUUID(),
    fullName: '',
    cpf: '',
    rg: '',
    birthDate: '',
    maritalStatus: '',
    fatherName: '',
    motherName: '',
    phone: '',
    email: ''
  }]);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      cep: "",
      value: "",
      owners: [{
        id: crypto.randomUUID(),
        fullName: '',
        cpf: '',
        rg: '',
        birthDate: '',
        maritalStatus: '',
        fatherName: '',
        motherName: '',
        phone: '',
        email: ''
      }],
      registrationNumber: "",
      municipalRegistration: "",
    },
  });

  // Efeito para popular formulário quando editing
  useEffect(() => {
    if (property && open) {
      // Formatar valor para exibição
      const formatValue = (value: string | number) => {
        const numValue = Number(value);
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(numValue);
      };

      // Popular campos básicos
      form.reset({
        type: property.type || "",
        street: property.street || "",
        number: property.number || "",
        complement: property.complement || "",
        neighborhood: property.neighborhood || "",
        city: property.city || "",
        state: property.state || "",
        cep: property.cep || "",
        value: formatValue(property.value),
        registrationNumber: property.registrationNumber || "",
        municipalRegistration: property.municipalRegistration || "",
        owners: property.owners && property.owners.length > 0 ?
          property.owners.map(owner => ({
            id: owner.id || crypto.randomUUID(),
            fullName: owner.fullName || '',
            cpf: owner.cpf || '',
            rg: owner.rg || '',
            birthDate: owner.birthDate || '',
            maritalStatus: owner.maritalStatus || '',
            fatherName: owner.fatherName || '',
            motherName: owner.motherName || '',
            phone: owner.phone || '',
            email: owner.email || ''
          })) : [{
            id: crypto.randomUUID(),
            fullName: '',
            cpf: '',
            rg: '',
            birthDate: '',
            maritalStatus: '',
            fatherName: '',
            motherName: '',
            phone: '',
            email: ''
          }]
      });

      setOwners(property.owners || [{
        id: crypto.randomUUID(),
        fullName: '',
        cpf: '',
        rg: '',
        birthDate: '',
        maritalStatus: '',
        fatherName: '',
        motherName: '',
        phone: '',
        email: ''
      }]);
    } else if (!property && open) {
      // Reset para novo
      form.reset({
        type: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        cep: "",
        value: "",
        owners: [{
          id: crypto.randomUUID(),
          fullName: '',
          cpf: '',
          rg: '',
          birthDate: '',
          maritalStatus: '',
          fatherName: '',
          motherName: '',
          phone: '',
          email: ''
        }],
        registrationNumber: "",
        municipalRegistration: "",
      });
      setOwners([{
        id: crypto.randomUUID(),
        fullName: '',
        cpf: '',
        rg: '',
        birthDate: '',
        maritalStatus: '',
        fatherName: '',
        motherName: '',
        phone: '',
        email: ''
      }]);
    }
  }, [property, open, form]);

  const addOwner = () => {
    const newOwner = {
      id: crypto.randomUUID(),
      fullName: '',
      cpf: '',
      rg: '',
      birthDate: '',
      maritalStatus: '',
      fatherName: '',
      motherName: '',
      phone: '',
      email: ''
    };
    const currentOwners = form.getValues('owners');
    const updatedOwners = [...currentOwners, newOwner];
    form.setValue('owners', updatedOwners);
    setOwners(updatedOwners);
  };

  const removeOwner = (ownerId: string) => {
    const currentOwners = form.getValues('owners');
    if (currentOwners.length > 1) {
      const updatedOwners = currentOwners.filter(owner => owner.id !== ownerId);
      form.setValue('owners', updatedOwners);
      setOwners(updatedOwners);
    }
  };

  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const endpoint = isEditing ? `/api/properties/${property?.id}` : "/api/properties";
      const method = isEditing ? "PUT" : "POST";
      const response = await apiRequest(method, endpoint, data);
      return await response.json();
    },
    onSuccess: (createdProperty) => {
      // Upload arquivos se houver
      if (files.length > 0) {
        uploadFilesToSupabase(createdProperty.id || property?.id).catch(console.error);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent"] });

      toast({
        title: isEditing ? "Imóvel atualizado!" : "Imóvel cadastrado!",
        description: isEditing ? "Os dados foram atualizados com sucesso." : "Nova captação registrada no sistema.",
      });

      onOpenChange(false);
      form.reset();
      setFiles([]);
      setUploadedFiles([]);
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? "Erro ao atualizar" : "Erro ao cadastrar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const uploadFilesToSupabase = async (propertyId: string) => {
    setUploading(true);
    const uploadedUrls: string[] = [];


    try {
      for (const file of files) {
        let uploadSuccess = false;
        let fileUrl = '';

        // Tentar primeiro Supabase
        try {
          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `${propertyId}/${fileName}`;

          const { data, error } = await supabase.storage
            .from('property-documents')
            .upload(filePath, file);

          if (!error) {
            // Obter URL pública
            const { data: { publicUrl } } = supabase.storage
              .from('property-documents')
              .getPublicUrl(filePath);

            fileUrl = publicUrl;
            uploadSuccess = true;
            console.log("✅ Supabase upload bem-sucedido:", fileUrl);

            // Salvar metadata no banco via API (método antigo)
            const documentData = {
              propertyId: parseInt(propertyId),
              fileName: file.name,
              fileUrl: fileUrl,
              fileType: file.type,
            };

            await apiRequest('POST', '/api/property-documents', documentData);
          } else {
            throw error;
          }
        } catch (supabaseError) {
          console.warn("❌ Supabase falhou, tentando upload local:", supabaseError);

          // Fallback: usar upload local
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('propertyId', propertyId);
            formData.append('category', (file as FileWithCategory).category || 'OUTROS');

            const response = await fetch('/api/property-documents/upload', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const result = await response.json();
              fileUrl = result.document.fileUrl;
              uploadSuccess = true;
              console.log("✅ Upload local bem-sucedido:", fileUrl);
            } else {
              throw new Error(`Upload local falhou: ${response.statusText}`);
            }
          } catch (localError) {
            console.error("❌ Upload local também falhou:", localError);
            throw new Error(`Falha no upload: ${localError.message}`);
          }
        }

        if (uploadSuccess) {
          uploadedUrls.push(fileUrl);
        }
      }

      setUploadedFiles(uploadedUrls);

    } catch (error: any) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: PropertyFormData) => {
    // Converter valor brasileiro para formato numérico
    let cleanValue = data.value;
    if (typeof cleanValue === 'string') {
      // Remove R$, espaços e pontos (milhares), mantém apenas números e vírgula
      cleanValue = cleanValue
        .replace(/R\$|\s/g, '') // Remove R$ e espaços
        .replace(/\./g, '') // Remove pontos dos milhares
        .replace(',', '.'); // Troca vírgula por ponto decimal
    }

    const propertyData = {
      ...data,
      value: cleanValue,
    };


    createPropertyMutation.mutate(propertyData);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles) as FileWithCategory[]);
    }
  };

  // Buscar documentos quando abrir modal de edição
  useEffect(() => {
    if (open && property?.id) {
      fetchPropertyDocuments(property.id.toString());
    }
  }, [open, property?.id]);

  const fetchPropertyDocuments = async (propertyId: string) => {
    setLoadingDocuments(true);
    console.log("Fetching documents for property:", propertyId);

    try {
      const response = await apiRequest('GET', `/api/properties/${propertyId}/documents`);
      const documents = await response.json();
      console.log("Documents fetched:", documents);
      setPropertyDocuments(documents);
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Função para verificar se um documento específico foi enviado
  const getDocumentByType = (type: string) => {
    return propertyDocuments.find(doc => doc.type === type || doc.category === type);
  };

  // Componente para renderizar o quadrado de upload/documento - OTIMIZADO
  const DocumentUploadBox = ({
    type,
    inputId,
    onFileSelect
  }: {
    type: string;
    inputId: string;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => {
    const document = getDocumentByType(type);

    if (document) {
      // Documento já foi enviado - mostrar como quadrado verde COMPACTO
      return (
        <div className="border-2 border-green-500 bg-green-50 rounded-lg p-1.5">
          <div className="text-center">
            <CheckCircle className="mx-auto h-5 w-5 text-green-500 mb-1" />
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-green-700 block leading-tight truncate">
                {document.name || document.fileName || 'Documento enviado'}
              </span>
              <p className="text-xs text-green-600 leading-tight">
                {new Date(document.createdAt || Date.now()).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="mt-1.5 flex justify-center gap-3">
              {document.url && (
                <button
                  type="button"
                  onClick={() => window.open(document.url, '_blank')}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  <Eye className="h-2.5 w-2.5" />
                  Ver
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteDocument(document.id, document.name || 'documento')}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-0.5"
              >
                <Trash2 className="h-2.5 w-2.5" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Documento não foi enviado - mostrar quadrado de upload COMPACTO
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-1.5">
        <label htmlFor={inputId} className="cursor-pointer">
          <div className="text-center">
            <CloudUpload className="mx-auto h-5 w-5 text-gray-400 mb-1" />
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-gray-600 leading-tight">Clique para enviar</span>
              <p className="text-xs text-gray-400 leading-tight">PDF, JPG, PNG até 10MB</p>
            </div>
          </div>
          <input
            id={inputId}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={onFileSelect}
          />
        </label>
      </div>
    );
  };

  const handleDocumentUpload = async () => {
    if (!property?.id || files.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione arquivos para fazer upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadFilesToSupabase(property.id);
      setFiles([]);
      setUploadedFiles([]);

      // Recarregar lista de documentos
      await fetchPropertyDocuments(property.id.toString());

      toast({
        title: "Documentos atualizados!",
        description: "Os documentos foram enviados com sucesso.",
      });

      onOpenChange(false);

    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Erro ao enviar documentos.",
        variant: "destructive",
      });
    }
  };

  const deleteDocument = async (documentId: number, documentName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o documento "${documentName}"?`)) {
      return;
    }

    try {
      await apiRequest('DELETE', `/api/property-documents/${documentId}`);

      // REMOVER DA LISTA IMEDIATAMENTE (sem esperar o servidor)
      setPropertyDocuments(prev => prev.filter(doc => doc.id !== documentId));

      toast({
        title: "Documento deletado!",
        description: `${documentName} foi removido com sucesso.`,
      });

    } catch (error: any) {
      console.error("Error deleting document:", error);

      // Se der erro, recarregar para restaurar o estado correto
      if (property?.id) {
        await fetchPropertyDocuments(property.id.toString());
      }

      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o documento.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? `Editar Imóvel ${property?.sequenceNumber || '00000'}`
              : 'Nova Captação'
            }
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite as informações do imóvel e seus proprietários.'
              : 'Cadastre um novo imóvel e seus proprietários no sistema.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Two-column layout for desktop, single column for mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* LEFT COLUMN - Property Information */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="!text-[12px]">Tipo de Imóvel</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="apartamento">Apartamento</SelectItem>
                            <SelectItem value="casa">Casa</SelectItem>
                            <SelectItem value="cobertura">Cobertura</SelectItem>
                            <SelectItem value="terreno">Terreno</SelectItem>
                            <SelectItem value="sala">Sala</SelectItem>
                            <SelectItem value="loja">Loja</SelectItem>
                            <SelectItem value="galpao">Galpão</SelectItem>
                            <SelectItem value="chacara">Chácara</SelectItem>
                            <SelectItem value="fazenda">Fazenda</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="!text-[12px]">Valor do Imóvel</FormLabel>
                        <FormControl>
                          <Input
                            className="text-xs"
                            placeholder="R$ 500.000,00"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              const formattedValue = new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(Number(value) / 100);
                              field.onChange(formattedValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Endereço */}
                <div className="space-y-3">
                  <h3 className="!text-[16px]">Endereço</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="!text-[12px]">CEP</FormLabel>
                          <FormControl>
                            <Input
                              className="text-xs"
                              placeholder="00000-000"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                const formattedCep = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                                field.onChange(formattedCep);
                              }}
                              onBlur={async () => {
                                const cleanCep = field.value.replace(/\D/g, '');
                                if (cleanCep.length === 8) {
                                  const addressData = await fetchAddressByCep(cleanCep);
                                  if (addressData) {
                                    form.setValue('street', addressData.street);
                                    form.setValue('neighborhood', addressData.neighborhood);
                                    form.setValue('city', addressData.city);
                                    form.setValue('state', addressData.state);
                                  }
                                }
                              }}
                              maxLength={9}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="!text-[12px]">Estado</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-xs">
                                <SelectValue placeholder="UF" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BRAZILIAN_STATES.map((state) => (
                                <SelectItem key={state.value} value={state.value}>
                                  {state.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="!text-[12px]">Cidade</FormLabel>
                          <FormControl>
                            <Input className="text-xs" placeholder="Digite o nome da cidade..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="!text-[12px]">Rua/Avenida</FormLabel>
                        <FormControl>
                          <Input className="text-xs" placeholder="Digite a rua..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="!text-[12px]">Número</FormLabel>
                          <FormControl>
                            <Input className="text-xs" placeholder="Digite o número..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="complement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="!text-[12px]">Complemento</FormLabel>
                          <FormControl>
                            <Input className="text-xs" placeholder="Digite o complemento..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="!text-[12px]">Bairro</FormLabel>
                          <FormControl>
                            <Input className="text-xs" placeholder="Digite o bairro..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Proprietários */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="!text-[16px]">Proprietários</h3>
                  </div>

                  {form.watch('owners').map((owner, index) => (
                    <div key={owner.id} className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="!text-[14px]">
                          Proprietário {index + 1}
                          {index === 0 && (
                            <span className="text-xs text-muted-foreground ml-2">(Principal)</span>
                          )}
                        </h4>
                        {form.watch('owners').length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOwner(owner.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name={`owners.${index}.fullName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="!text-[12px]">Nome Completo</FormLabel>
                              <FormControl>
                                <Input className="text-xs" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`owners.${index}.cpf`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="!text-[12px]">CPF</FormLabel>
                                <FormControl>
                                  <Input
                                    className="text-xs"
                                    placeholder="000.000.000-00"
                                    {...field}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/\D/g, '');
                                      const formattedCpf = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                                      field.onChange(formattedCpf);
                                    }}
                                    maxLength={14}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`owners.${index}.phone`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="!text-[12px]">Telefone</FormLabel>
                                <FormControl>
                                  <Input
                                    className="text-xs"
                                    placeholder="(xx) xxxxx-xxxx"
                                    {...field}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/\D/g, '');
                                      const formattedPhone = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                                      field.onChange(formattedPhone);
                                    }}
                                    maxLength={15}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`owners.${index}.email`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="!text-[12px]">E-mail</FormLabel>
                              <FormControl>
                                <Input
                                  className="text-xs"
                                  type="email"
                                  placeholder="email@exemplo.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={addOwner}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Proprietário
                    </button>
                  </div>
                </div>

                {/* Documentação - Registration Numbers */}
                <div className="space-y-3">
                  <h3 className="!text-[16px]">Documentação</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="!text-[12px]">Número de Matrícula</FormLabel>
                          <FormControl>
                            <Input className="text-xs" placeholder="123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="municipalRegistration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="!text-[12px]">Inscrição Municipal</FormLabel>
                          <FormControl>
                            <Input className="text-xs" placeholder="789012-6" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Documents Upload */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 border-b pb-2">
                    <h3 className="!text-[16px]">Documentos Obrigatórios</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Envie cada documento na seção correspondente
                  </p>

                  {/* Vertical stack of documents */}
                  <div className="space-y-1.5">
                    {/* ÔNUS REAIS */}
                    <div className="border rounded-lg p-1.5 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">⚖️</span>
                        <h5 className="!text-[12px]">Ônus Reais</h5>
                      </div>
                      <DocumentUploadBox
                        type="ONUS_REAIS"
                        inputId="file-ONUS_REAIS"
                        onFileSelect={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fileWithCategory = Object.assign(file, { category: 'ONUS_REAIS' }) as FileWithCategory;
                            setFiles(prev => [...prev, fileWithCategory]);
                          }
                        }}
                      />
                      {files.filter(f => f.category === 'ONUS_REAIS').map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-1.5 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle className="h-3 w-3 text-blue-500" />
                            <span className="text-xs truncate">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFiles(files.filter(f => f !== file))}
                            disabled={uploading}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* ESPELHO DE IPTU */}
                    <div className="border rounded-lg p-1.5 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">🏠</span>
                        <h5 className="!text-[12px]">Espelho de IPTU</h5>
                      </div>
                      <DocumentUploadBox
                        type="ESPELHO_IPTU"
                        inputId="file-ESPELHO_IPTU"
                        onFileSelect={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fileWithCategory = Object.assign(file, { category: 'ESPELHO_IPTU' }) as FileWithCategory;
                            setFiles(prev => [...prev, fileWithCategory]);
                          }
                        }}
                      />
                      {files.filter(f => f.category === 'ESPELHO_IPTU').map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-1.5 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle className="h-3 w-3 text-blue-500" />
                            <span className="text-xs truncate">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFiles(files.filter(f => f !== file))}
                            disabled={uploading}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* RG/CNH - DINÂMICO BASEADO NA QUANTIDADE DE PROPRIETÁRIOS */}
                    {form.watch('owners').map((owner, ownerIndex) => (
                      <div key={`rg-${owner.id}-${ownerIndex}`} className="border rounded-lg p-1.5 space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-base">📄</span>
                          <h5 className="!text-[12px]">
                            RG/CNH - {owner.fullName || `Proprietário ${ownerIndex + 1}`}
                          </h5>
                        </div>
                        <DocumentUploadBox
                          type={`RG_CNH_${ownerIndex}`}
                          inputId={`file-RG_CNH_${ownerIndex}`}
                          onFileSelect={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const fileWithCategory = Object.assign(file, {
                                category: `RG_CNH_${ownerIndex}`,
                                ownerIndex: ownerIndex
                              }) as FileWithCategory;
                              setFiles(prev => [...prev, fileWithCategory]);
                            }
                          }}
                        />
                        {files.filter(f => f.category === `RG_CNH_${ownerIndex}`).map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-1.5 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex items-center space-x-1.5">
                              <CheckCircle className="h-3 w-3 text-blue-500" />
                              <span className="text-xs truncate">{file.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setFiles(files.filter(f => f !== file))}
                              disabled={uploading}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* CERTIDÃO DE ESTADO CIVIL */}
                    <div className="border rounded-lg p-1.5 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">💍</span>
                        <h5 className="!text-[12px]">Certidão de Estado Civil</h5>
                      </div>
                      <DocumentUploadBox
                        type="CERTIDAO_ESTADO_CIVIL"
                        inputId="file-CERTIDAO_ESTADO_CIVIL"
                        onFileSelect={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fileWithCategory = Object.assign(file, { category: 'CERTIDAO_ESTADO_CIVIL' }) as FileWithCategory;
                            setFiles(prev => [...prev, fileWithCategory]);
                          }
                        }}
                      />
                      {files.filter(f => f.category === 'CERTIDAO_ESTADO_CIVIL').map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-1.5 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle className="h-3 w-3 text-blue-500" />
                            <span className="text-xs truncate">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFiles(files.filter(f => f !== file))}
                            disabled={uploading}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* COMPROVANTE DE RESIDÊNCIA */}
                    <div className="border rounded-lg p-1.5 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">📮</span>
                        <h5 className="!text-[12px]">Comprovante de Residência</h5>
                      </div>
                      <DocumentUploadBox
                        type="COMPROVANTE_RESIDENCIA"
                        inputId="file-COMPROVANTE_RESIDENCIA"
                        onFileSelect={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fileWithCategory = Object.assign(file, { category: 'COMPROVANTE_RESIDENCIA' }) as FileWithCategory;
                            setFiles(prev => [...prev, fileWithCategory]);
                          }
                        }}
                      />
                      {files.filter(f => f.category === 'COMPROVANTE_RESIDENCIA').map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-1.5 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle className="h-3 w-3 text-blue-500" />
                            <span className="text-xs truncate">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFiles(files.filter(f => f !== file))}
                            disabled={uploading}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status do upload */}
                  {uploading && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Enviando arquivos...</span>
                    </div>
                  )}

                  {/* Arquivos enviados com sucesso */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-1.5">
                      <h5 className="text-xs font-medium text-green-600">Arquivos enviados:</h5>
                      {uploadedFiles.map((url, index) => (
                        <div key={index} className="flex items-center space-x-1.5 p-1.5 bg-green-50 border border-green-200 rounded">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-700">Arquivo {index + 1} enviado com sucesso</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>


            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>

              {/* Botão para upload independente de documentos */}
              {files.length > 0 && isEditing && (
                <Button
                  type="button"
                  onClick={handleDocumentUpload}
                  disabled={uploading}
                  className="mr-2"
                >
                  {uploading ? "Enviando..." : "Atualizar Documentos"}
                </Button>
              )}

              <Button
                type="submit"
                disabled={createPropertyMutation.isPending || uploading}
              >
                {uploading
                  ? "Enviando arquivos..."
                  : createPropertyMutation.isPending
                    ? (isEditing ? "Atualizando..." : "Cadastrando...")
                    : (isEditing ? "Atualizar" : "Cadastrar")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
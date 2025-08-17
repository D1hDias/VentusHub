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

    console.log("=== UPLOAD DEBUG ===");
    console.log("PropertyId:", propertyId);
    console.log("Files:", files);
    console.log("==================");

    try {
      for (const file of files) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${propertyId}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('property-documents')
          .upload(filePath, file);

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('property-documents')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);

        // Preparar dados para API
        const documentData = {
          propertyId: parseInt(propertyId),
          fileName: file.name,
          fileUrl: publicUrl,
          fileType: file.type,
        };

        console.log("Enviando para API:", documentData);

        // Salvar metadata no banco via API
        const response = await apiRequest('POST', '/api/property-documents', documentData);
        console.log("Resposta da API:", response);
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
    console.log("=== FETCH DOCUMENTS DEBUG ===");
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
              ? `Editar Imóvel #${property?.sequenceNumber || '00000'}` 
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Imóvel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>Valor do Imóvel</FormLabel>
                    <FormControl>
                      <Input
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
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Endereço</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input
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
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} />
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>Rua/Avenida</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua ABC" {...field} />
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
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
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
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto 45" {...field} />
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
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Proprietários */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Proprietários</h3>
              </div>

              {form.watch('owners').map((owner, index) => (
                <div key={owner.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Proprietário {index + 1}
                      {index === 0 && (
                        <span className="text-sm text-muted-foreground ml-2">(Principal)</span>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`owners.${index}.fullName`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`owners.${index}.cpf`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input 
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
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999" 
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

                    <FormField
                      control={form.control}
                      name={`owners.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input 
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

            {/* Documentação */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Documentação</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Matrícula</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} />
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
                      <FormLabel>Inscrição Municipal</FormLabel>
                      <FormControl>
                        <Input placeholder="789012" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Upload de Documentos Específicos - VERSÃO ATUALIZADA */}
              <div className="space-y-4">
                <h4 className="font-medium">Documentos Obrigatórios</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Envie cada documento na seção correspondente
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ÔNUS REAIS */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">⚖️</span>
                      <h5 className="font-medium text-sm">Ônus Reais</h5>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                      <label htmlFor="file-ONUS_REAIS" className="cursor-pointer">
                        <div className="text-center">
                          <CloudUpload className="mx-auto h-8 w-8 text-gray-400" />
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-600">Clique para enviar</span>
                            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG até 10MB</p>
                          </div>
                        </div>
                        <input
                          id="file-ONUS_REAIS"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const fileWithCategory = Object.assign(file, { category: 'ONUS_REAIS' }) as FileWithCategory;
                              setFiles(prev => [...prev, fileWithCategory]);
                            }
                          }}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    {files.filter(f => f.category === 'ONUS_REAIS').map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-xs truncate">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFiles(files.filter(f => f !== file))}
                          disabled={uploading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* ESPELHO DE IPTU */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🏠</span>
                      <h5 className="font-medium text-sm">Espelho de IPTU</h5>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                      <label htmlFor="file-ESPELHO_IPTU" className="cursor-pointer">
                        <div className="text-center">
                          <CloudUpload className="mx-auto h-8 w-8 text-gray-400" />
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-600">Clique para enviar</span>
                            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG até 10MB</p>
                          </div>
                        </div>
                        <input
                          id="file-ESPELHO_IPTU"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const fileWithCategory = Object.assign(file, { category: 'ESPELHO_IPTU' }) as FileWithCategory;
                              setFiles(prev => [...prev, fileWithCategory]);
                            }
                          }}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    {files.filter(f => f.category === 'ESPELHO_IPTU').map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-xs truncate">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFiles(files.filter(f => f !== file))}
                          disabled={uploading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* RG/CNH - DINÂMICO BASEADO NA QUANTIDADE DE PROPRIETÁRIOS */}
                  {form.watch('owners').map((owner, ownerIndex) => (
                    <div key={`rg-${owner.id}-${ownerIndex}`} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">📄</span>
                        <h5 className="font-medium text-sm">
                          RG/CNH - {owner.fullName || `Proprietário ${ownerIndex + 1}`}
                        </h5>
                      </div>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                        <label htmlFor={`file-RG_CNH_${ownerIndex}`} className="cursor-pointer">
                          <div className="text-center">
                            <CloudUpload className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-600">Clique para enviar</span>
                              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG até 10MB</p>
                            </div>
                          </div>
                          <input
                            id={`file-RG_CNH_${ownerIndex}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const fileWithCategory = Object.assign(file, { 
                                  category: `RG_CNH_${ownerIndex}`,
                                  ownerIndex: ownerIndex 
                                }) as FileWithCategory;
                                setFiles(prev => [...prev, fileWithCategory]);
                              }
                            }}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                      {files.filter(f => f.category === `RG_CNH_${ownerIndex}`).map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                            <span className="text-xs truncate">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFiles(files.filter(f => f !== file))}
                            disabled={uploading}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* CERTIDÃO DE ESTADO CIVIL */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">💍</span>
                      <h5 className="font-medium text-sm">Certidão de Estado Civil</h5>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                      <label htmlFor="file-CERTIDAO_ESTADO_CIVIL" className="cursor-pointer">
                        <div className="text-center">
                          <CloudUpload className="mx-auto h-8 w-8 text-gray-400" />
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-600">Clique para enviar</span>
                            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG até 10MB</p>
                          </div>
                        </div>
                        <input
                          id="file-CERTIDAO_ESTADO_CIVIL"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const fileWithCategory = Object.assign(file, { category: 'CERTIDAO_ESTADO_CIVIL' }) as FileWithCategory;
                              setFiles(prev => [...prev, fileWithCategory]);
                            }
                          }}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    {files.filter(f => f.category === 'CERTIDAO_ESTADO_CIVIL').map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-xs truncate">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFiles(files.filter(f => f !== file))}
                          disabled={uploading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* COMPROVANTE DE RESIDÊNCIA */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">📮</span>
                      <h5 className="font-medium text-sm">Comprovante de Residência</h5>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                      <label htmlFor="file-COMPROVANTE_RESIDENCIA" className="cursor-pointer">
                        <div className="text-center">
                          <CloudUpload className="mx-auto h-8 w-8 text-gray-400" />
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-600">Clique para enviar</span>
                            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG até 10MB</p>
                          </div>
                        </div>
                        <input
                          id="file-COMPROVANTE_RESIDENCIA"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const fileWithCategory = Object.assign(file, { category: 'COMPROVANTE_RESIDENCIA' }) as FileWithCategory;
                              setFiles(prev => [...prev, fileWithCategory]);
                            }
                          }}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    {files.filter(f => f.category === 'COMPROVANTE_RESIDENCIA').map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-xs truncate">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFiles(files.filter(f => f !== file))}
                          disabled={uploading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* FINANCIAMENTO */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">💰</span>
                      <h5 className="font-medium text-sm">Documentos de Financiamento</h5>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                      <label htmlFor="file-FINANCIAMENTO" className="cursor-pointer">
                        <div className="text-center">
                          <CloudUpload className="mx-auto h-8 w-8 text-gray-400" />
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-600">Clique para enviar</span>
                            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG até 10MB</p>
                          </div>
                        </div>
                        <input
                          id="file-FINANCIAMENTO"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const fileWithCategory = Object.assign(file, { category: 'FINANCIAMENTO' }) as FileWithCategory;
                              setFiles(prev => [...prev, fileWithCategory]);
                            }
                          }}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    {files.filter(f => f.category === 'FINANCIAMENTO').map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-xs truncate">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFiles(files.filter(f => f !== file))}
                          disabled={uploading}
                        >
                          <X className="h-3 w-3" />
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
              </div>

              {/* Arquivos enviados com sucesso */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-green-600">Arquivos enviados:</h5>
                  {uploadedFiles.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700">Arquivo {index + 1} enviado com sucesso</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documentos Enviados */}
            {(propertyDocuments.length > 0 || loadingDocuments) && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Documentos Enviados</h4>
                
                {loadingDocuments ? (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Carregando documentos...</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                  {propertyDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <span className="text-sm font-medium text-green-700">{doc.name}</span>
                          <div className="text-xs text-green-600">
                            Enviado em {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/documents/${doc.id}/view`, '_blank')}
                          className="text-blue-600 hover:text-blue-800"
                          title="Visualizar documento"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}
                          className="text-green-600 hover:text-green-800"
                          title="Baixar documento"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocument(doc.id, doc.name)}
                          className="text-red-600 hover:text-red-800"
                          title="Deletar documento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            )}

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
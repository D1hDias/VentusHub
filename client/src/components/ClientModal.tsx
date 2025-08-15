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
import { apiRequest } from "@/lib/queryClient";
import { X, User, Phone, Mail, MapPin, DollarSign, FileText } from "lucide-react";

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

const MARITAL_STATUSES = [
  { value: "Solteiro", label: "Solteiro" },
  { value: "Casado", label: "Casado" },
  { value: "Divorciado", label: "Divorciado" },
  { value: "Viúvo", label: "Viúvo" }
];

const clientSchema = z.object({
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  birthDate: z.string().optional(),
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  phonePrimary: z.string().min(1, "Telefone principal é obrigatório"),
  phoneSecondary: z.string().optional(),
  addressStreet: z.string().min(1, "Endereço é obrigatório"),
  addressNumber: z.string().min(1, "Número é obrigatório"),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().min(1, "Bairro é obrigatório"),
  addressCity: z.string().min(1, "Cidade é obrigatória"),
  addressState: z.string().min(1, "Estado é obrigatório"),
  addressZip: z.string().min(8, "CEP deve ter 8 dígitos").max(9, "CEP inválido"),
  maritalStatus: z.enum(["Solteiro", "Casado", "Divorciado", "Viúvo"]),
  profession: z.string().optional(),
  monthlyIncome: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

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

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
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

export function ClientModal({ open, onOpenChange, client }: ClientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!client;
  const { isMobile } = useResponsive();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      fullName: "",
      cpf: "",
      birthDate: "",
      email: "",
      phonePrimary: "",
      phoneSecondary: "",
      addressStreet: "",
      addressNumber: "",
      addressComplement: "",
      addressNeighborhood: "",
      addressCity: "",
      addressState: "",
      addressZip: "",
      maritalStatus: "Solteiro",
      profession: "",
      monthlyIncome: "",
      notes: "",
    },
  });

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    return formatted;
  };

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  // Função para formatar CEP
  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  // Função para formatar moeda
  const formatCurrency = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const number = parseFloat(cleaned) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(number || 0);
  };

  // Buscar endereço por CEP
  const handleCepChange = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length === 8) {
      const addressData = await fetchAddressByCep(cleanedCep);
      if (addressData) {
        form.setValue('addressStreet', addressData.street || '');
        form.setValue('addressNeighborhood', addressData.neighborhood || '');
        form.setValue('addressCity', addressData.city || '');
        form.setValue('addressState', addressData.state || '');
      }
    }
  };

  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      // Converter renda para número se informada
      const monthlyIncome = data.monthlyIncome 
        ? parseFloat(data.monthlyIncome.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
        : null;

      const clientData = {
        ...data,
        monthlyIncome,
        cpf: data.cpf.replace(/\D/g, ''),
        phonePrimary: data.phonePrimary.replace(/\D/g, ''),
        phoneSecondary: data.phoneSecondary ? data.phoneSecondary.replace(/\D/g, '') : null,
        addressZip: data.addressZip.replace(/\D/g, ''),
      };

      return apiRequest(`/api/clients${isEditing ? `/${client.id}` : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Sucesso!",
        description: `Cliente ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso.`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} cliente.`,
        variant: "destructive",
      });
    },
  });

  // Preencher formulário ao editar
  useEffect(() => {
    if (client && open) {
      form.reset({
        fullName: client.fullName || "",
        cpf: client.cpf || "",
        birthDate: client.birthDate || "",
        email: client.email || "",
        phonePrimary: client.phonePrimary || "",
        phoneSecondary: client.phoneSecondary || "",
        addressStreet: client.addressStreet || "",
        addressNumber: client.addressNumber || "",
        addressComplement: client.addressComplement || "",
        addressNeighborhood: client.addressNeighborhood || "",
        addressCity: client.addressCity || "",
        addressState: client.addressState || "",
        addressZip: client.addressZip || "",
        maritalStatus: client.maritalStatus || "Solteiro",
        profession: client.profession || "",
        monthlyIncome: client.monthlyIncome ? client.monthlyIncome.toString() : "",
        notes: client.notes || "",
      });
    } else if (open) {
      form.reset();
    }
  }, [client, open, form]);

  const onSubmit = (data: ClientFormData) => {
    createClientMutation.mutate(data);
  };

  const ModalComponent = isMobile ? AnimatedModal : Dialog;

  return (
    <ModalComponent open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            {isEditing ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {isEditing 
              ? "Atualize as informações do cliente" 
              : "Preencha os dados do novo cliente"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
              
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <User className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900">Dados Pessoais</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Nome Completo *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome completo do cliente"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
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
                        <FormLabel className="text-sm font-medium text-gray-700">
                          CPF *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000.000.000-00"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            value={formatCPF(field.value)}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              if (cleaned.length <= 11) {
                                field.onChange(cleaned);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Data de Nascimento
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Estado Civil *
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue placeholder="Selecione o estado civil" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MARITAL_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contato */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900">Contato</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          E-mail *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="email@exemplo.com"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phonePrimary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Telefone Principal *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(11) 99999-9999"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            value={formatPhone(field.value)}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              if (cleaned.length <= 11) {
                                field.onChange(cleaned);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneSecondary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Telefone Secundário
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(11) 99999-9999"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            value={formatPhone(field.value || '')}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              if (cleaned.length <= 11) {
                                field.onChange(cleaned || undefined);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900">Endereço</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="addressZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          CEP *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="00000-000"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            value={formatCEP(field.value)}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              if (cleaned.length <= 8) {
                                field.onChange(cleaned);
                                if (cleaned.length === 8) {
                                  handleCepChange(cleaned);
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressStreet"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Endereço *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Rua, Avenida, etc."
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Número *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressComplement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Complemento
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Apto, Bloco, etc."
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressNeighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Bairro *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome do bairro"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Cidade *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome da cidade"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Estado *
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                </div>
              </div>

              {/* Informações Profissionais */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900">Informações Profissionais</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="profession"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Profissão
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Engenheiro, Médico, etc."
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Renda Mensal
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="R$ 0,00"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            value={field.value ? formatCurrency(field.value) : ''}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              field.onChange(cleaned);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900">Observações</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Observações Gerais
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Informações adicionais sobre o cliente..."
                          rows={4}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={createClientMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white order-1 sm:order-2"
          >
            {createClientMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                {isEditing ? "Atualizando..." : "Cadastrando..."}
              </>
            ) : (
              <>{isEditing ? "Atualizar Cliente" : "Cadastrar Cliente"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </ModalComponent>
  );
}
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
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  StickyNote,
  Bell,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Users,
  Timer,
  CheckCircle2,
  ArrowRight,
  AlertCircle
} from "lucide-react";

// Schema de validação baseado no backend
const noteSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255, "Título muito longo"),
  content: z.string().min(1, "Conteúdo é obrigatório").max(5000, "Conteúdo muito longo"),
  type: z.enum(["note", "reminder", "call", "meeting"]).default("note"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),

  // Campos opcionais para diferentes tipos
  reminderDate: z.string().optional(),
  location: z.string().max(255, "Local muito longo").optional(),
  participants: z.string().max(1000, "Lista de participantes muito longa").optional(),

  // Campos específicos para ligações
  duration: z.number().min(0, "Duração não pode ser negativa").max(480, "Duração não pode exceder 8 horas").optional(),
  callResult: z.enum(["success", "no_answer", "busy", "callback_requested", "voicemail", "disconnected"]).optional(),
  nextSteps: z.string().max(1000, "Próximos passos muito longos").optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

type NoteType = "note" | "reminder" | "call" | "meeting";

interface ClientNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  noteType?: NoteType;
  onNoteCreated?: () => void;
}

const NOTE_TYPES = [
  {
    value: "note" as const,
    label: "Nova Nota",
    icon: StickyNote,
    description: "Registrar informação importante",
    color: "bg-blue-500"
  },
  {
    value: "reminder" as const,
    label: "Agendar Lembrete",
    icon: Bell,
    description: "Criar lembrete para o futuro",
    color: "bg-orange-500"
  },
  {
    value: "call" as const,
    label: "Registrar Ligação",
    icon: Phone,
    description: "Documentar resultado de ligação",
    color: "bg-green-500"
  },
  {
    value: "meeting" as const,
    label: "Agendar Reunião",
    icon: Calendar,
    description: "Agendar encontro presencial/virtual",
    color: "bg-purple-500"
  }
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Baixa", color: "bg-gray-500" },
  { value: "normal", label: "Normal", color: "bg-blue-500" },
  { value: "high", label: "Alta", color: "bg-orange-500" },
  { value: "urgent", label: "Urgente", color: "bg-red-500" }
];

const CALL_RESULTS = [
  { value: "success", label: "Sucesso - Conversei" },
  { value: "no_answer", label: "Não atendeu" },
  { value: "busy", label: "Linha ocupada" },
  { value: "callback_requested", label: "Solicitou retorno" },
  { value: "voicemail", label: "Caixa postal" },
  { value: "disconnected", label: "Chamada cortou" }
];

export function ClientNoteModal({
  open,
  onOpenChange,
  clientId,
  noteType = "note",
  onNoteCreated
}: ClientNoteModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<NoteType>(noteType);

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      content: "",
      type: selectedType,
      priority: "normal",
      reminderDate: "",
      location: "",
      participants: "",
      duration: undefined,
      callResult: undefined,
      nextSteps: "",
    },
  });

  // Atualizar tipo quando mudado externamente
  useEffect(() => {
    setSelectedType(noteType);
    form.setValue("type", noteType);
  }, [noteType, form]);

  // Resetar formulário quando modal abrir/fechar
  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        content: "",
        type: selectedType,
        priority: "normal",
        reminderDate: "",
        location: "",
        participants: "",
        duration: undefined,
        callResult: undefined,
        nextSteps: "",
      });
    }
  }, [open, selectedType, form]);

  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const noteData = {
        ...data,
        clientId: parseInt(clientId),
        // Converter strings vazias para undefined
        reminderDate: data.reminderDate && data.reminderDate.length > 0 ? data.reminderDate : undefined,
        location: data.location && data.location.length > 0 ? data.location : undefined,
        participants: data.participants && data.participants.length > 0 ? data.participants : undefined,
        nextSteps: data.nextSteps && data.nextSteps.length > 0 ? data.nextSteps : undefined,
        duration: data.duration || undefined,
        callResult: data.callResult || undefined,
      };

      return apiRequest(`/api/clients/${clientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/notes`] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Sucesso!",
        description: getNoteSuccessMessage(selectedType),
      });
      onNoteCreated?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar nota.",
        variant: "destructive",
      });
    },
  });

  const handleTypeChange = (type: NoteType) => {
    setSelectedType(type);
    form.setValue("type", type);

    // Limpar campos específicos quando mudar o tipo
    if (type !== "reminder" && type !== "meeting") {
      form.setValue("reminderDate", "");
    }
    if (type !== "meeting") {
      form.setValue("location", "");
      form.setValue("participants", "");
    }
    if (type !== "call") {
      form.setValue("duration", undefined);
      form.setValue("callResult", undefined);
      form.setValue("nextSteps", "");
    }
  };

  const onSubmit = (data: NoteFormData) => {
    createNoteMutation.mutate(data);
  };

  const getNoteSuccessMessage = (type: NoteType) => {
    switch (type) {
      case "note": return "Nota criada com sucesso!";
      case "reminder": return "Lembrete agendado com sucesso!";
      case "call": return "Ligação registrada com sucesso!";
      case "meeting": return "Reunião agendada com sucesso!";
      default: return "Nota criada com sucesso!";
    }
  };

  const currentTypeInfo = NOTE_TYPES.find(t => t.value === selectedType);
  const Icon = currentTypeInfo?.icon || StickyNote;

  // Função para formatar data/hora para input datetime-local
  const formatDateTimeLocal = (date?: string) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      return d.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Icon className="h-5 w-5 text-blue-600" />
            {currentTypeInfo?.label}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {currentTypeInfo?.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">

              {/* Seleção do Tipo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Icon className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900">Tipo de Atividade</h3>
                </div>

                <Tabs value={selectedType} onValueChange={handleTypeChange}>
                  <TabsList className="grid w-full grid-cols-4">
                    {NOTE_TYPES.map((type) => {
                      const TypeIcon = type.icon;
                      return (
                        <TabsTrigger
                          key={type.value}
                          value={type.value}
                          className="text-xs data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                        >
                          <TypeIcon className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">{type.label.split(' ')[0]}</span>
                          <span className="sm:hidden">{type.label.split(' ')[0]}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>
              </div>

              {/* Campos Básicos */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Título *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`Título da ${currentTypeInfo?.label.toLowerCase()}`}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            autoFocus
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Prioridade *
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((priority) => (
                              <SelectItem key={priority.value} value={priority.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${priority.color}`} />
                                  {priority.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Conteúdo *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={getContentPlaceholder(selectedType)}
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

              {/* Campos específicos por tipo */}
              {(selectedType === "reminder" || selectedType === "meeting") && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <h3 className="font-medium text-gray-900">Agendamento</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="reminderDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Data e Hora *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                            value={formatDateTimeLocal(field.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {selectedType === "meeting" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <h3 className="font-medium text-gray-900">Detalhes da Reunião</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Local
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Escritório, virtual, etc."
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
                      name="participants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Participantes
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome dos participantes"
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {selectedType === "call" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Phone className="h-4 w-4 text-green-600" />
                    <h3 className="font-medium text-gray-900">Detalhes da Ligação</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="callResult"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Resultado da Ligação
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Selecione o resultado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CALL_RESULTS.map((result) => (
                                <SelectItem key={result.value} value={result.value}>
                                  {result.label}
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
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Duração (minutos)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="480"
                              placeholder="Ex: 15"
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nextSteps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Próximos Passos
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="O que deve ser feito após esta ligação?"
                            rows={3}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </form>
          </Form>
        </div>

        {/* Footer com botões */}
        <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Badge variant="outline" className="text-xs">
              {currentTypeInfo?.label}
            </Badge>
            <span>•</span>
            <span>Cliente ID: {clientId}</span>
          </div>

          <div className="flex gap-2">
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
              disabled={createNoteMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white order-1 sm:order-2"
            >
              {createNoteMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Salvar {currentTypeInfo?.label}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Função helper para placeholder dinâmico
function getContentPlaceholder(type: NoteType): string {
  switch (type) {
    case "note":
      return "Descreva as informações importantes sobre o cliente...";
    case "reminder":
      return "Descreva o que deve ser lembrado nesta data...";
    case "call":
      return "Resuma o que foi conversado durante a ligação...";
    case "meeting":
      return "Defina a pauta e objetivos da reunião...";
    default:
      return "Digite o conteúdo da nota...";
  }
}
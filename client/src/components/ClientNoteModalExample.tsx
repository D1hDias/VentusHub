import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClientNoteModal } from "./ClientNoteModal";
import { 
  StickyNote, 
  Bell, 
  Phone, 
  Calendar,
  Plus
} from "lucide-react";

interface ClientNoteModalExampleProps {
  clientId: string;
  clientName?: string;
}

/**
 * Exemplo de integração do ClientNoteModal
 * 
 * COMO USAR NA PÁGINA DE CLIENTES:
 * 1. Import: import { ClientNoteModal } from "@/components/ClientNoteModal";
 * 2. Estado: const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
 * 3. Tipo: const [noteType, setNoteType] = useState<"note" | "reminder" | "call" | "meeting">("note");
 * 4. JSX: <ClientNoteModal 
 *           open={isNoteModalOpen} 
 *           onOpenChange={setIsNoteModalOpen}
 *           clientId={clientId}
 *           noteType={noteType}
 *           onNoteCreated={() => refetchNotes()}
 *         />
 */
export function ClientNoteModalExample({ clientId, clientName }: ClientNoteModalExampleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNoteType, setSelectedNoteType] = useState<"note" | "reminder" | "call" | "meeting">("note");

  const handleOpenModal = (type: "note" | "reminder" | "call" | "meeting") => {
    setSelectedNoteType(type);
    setIsModalOpen(true);
  };

  const handleNoteCreated = () => {
    // Aqui você pode atualizar a lista de notas do cliente
    console.log("Nova nota criada para cliente", clientId);
    // Ex: refetchClientNotes();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">
        CRM - {clientName || `Cliente ${clientId}`}
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Button
          variant="outline"
          onClick={() => handleOpenModal("note")}
          className="flex items-center gap-2 justify-start"
        >
          <StickyNote className="h-4 w-4 text-blue-600" />
          <span>Nova Nota</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleOpenModal("reminder")}
          className="flex items-center gap-2 justify-start"
        >
          <Bell className="h-4 w-4 text-orange-600" />
          <span>Lembrete</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleOpenModal("call")}
          className="flex items-center gap-2 justify-start"
        >
          <Phone className="h-4 w-4 text-green-600" />
          <span>Ligação</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleOpenModal("meeting")}
          className="flex items-center gap-2 justify-start"
        >
          <Calendar className="h-4 w-4 text-purple-600" />
          <span>Reunião</span>
        </Button>
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>Funcionalidades implementadas:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>✅ Modal unificado com 4 tipos de atividade CRM</li>
          <li>✅ Validação com Zod schemas seguindo o backend</li>
          <li>✅ Campos dinâmicos baseados no tipo selecionado</li>
          <li>✅ Design responsivo e mobile-first</li>
          <li>✅ Integração com TanStack Query</li>
          <li>✅ Auto-focus inteligente e UX otimizada</li>
          <li>✅ Feedback visual de sucesso/erro</li>
          <li>✅ Consistência com ClientModal existente</li>
        </ul>
      </div>

      {/* Modal CRM */}
      <ClientNoteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        clientId={clientId}
        noteType={selectedNoteType}
        onNoteCreated={handleNoteCreated}
      />
    </div>
  );
}

/**
 * INTEGRAÇÃO NA PÁGINA CLIENTES.tsx:
 * 
 * 1. Adicionar estado para o modal:
 * ```typescript
 * const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
 * const [selectedNoteType, setSelectedNoteType] = useState<"note" | "reminder" | "call" | "meeting">("note");
 * const [selectedClientId, setSelectedClientId] = useState<string>("");
 * ```
 * 
 * 2. Adicionar funções para abrir modal:
 * ```typescript
 * const handleOpenNoteModal = (clientId: string, type: "note" | "reminder" | "call" | "meeting") => {
 *   setSelectedClientId(clientId);
 *   setSelectedNoteType(type);
 *   setIsNoteModalOpen(true);
 * };
 * ```
 * 
 * 3. Adicionar botões na lista de clientes:
 * ```jsx
 * <div className="flex gap-1">
 *   <Button size="sm" variant="outline" onClick={() => handleOpenNoteModal(client.id, "note")}>
 *     <StickyNote className="h-3 w-3" />
 *   </Button>
 *   <Button size="sm" variant="outline" onClick={() => handleOpenNoteModal(client.id, "call")}>
 *     <Phone className="h-3 w-3" />
 *   </Button>
 * </div>
 * ```
 * 
 * 4. Adicionar o modal no final do componente:
 * ```jsx
 * <ClientNoteModal
 *   open={isNoteModalOpen}
 *   onOpenChange={setIsNoteModalOpen}
 *   clientId={selectedClientId}
 *   noteType={selectedNoteType}
 *   onNoteCreated={() => {
 *     // Atualizar lista de notas/clientes
 *     queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
 *   }}
 * />
 * ```
 */
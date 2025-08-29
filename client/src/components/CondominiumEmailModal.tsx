import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CondominiumEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyAddress: string;
  ownerData?: {
    fullName: string;
    phone?: string;
    email?: string;
    cpf?: string;
  };
  onEmailSent?: () => void;
}

export function CondominiumEmailModal({ open, onOpenChange, propertyAddress, ownerData, onEmailSent }: CondominiumEmailModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    administradoraNome: '',
    enderecoCompleto: propertyAddress || '',
    periodoReferencia: '',
    nomeRequerente: ownerData?.fullName || '',
    cpfRequerente: ownerData?.cpf || '',
    telefoneContato: ownerData?.phone || '',
    emailContato: ownerData?.email || ''
  });

  // Atualizar campos quando os dados do proprietário mudarem
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      enderecoCompleto: propertyAddress || '',
      nomeRequerente: ownerData?.fullName || '',
      cpfRequerente: ownerData?.cpf || '',
      telefoneContato: ownerData?.phone || '',
      emailContato: ownerData?.email || ''
    }));
  }, [propertyAddress, ownerData]);

  const generateEmailContent = () => {
    return `Assunto: Solicitação de Declaração de Quitação Condominial


Prezados(as) ${formData.administradoraNome || '[NOME DA ADMINISTRADORA DO CONDOMÍNIO]'},

Venho, por meio deste, na qualidade de proprietário(a) do imóvel localizado na ${formData.enderecoCompleto || '[ENDEREÇO COMPLETO DO IMÓVEL]'}, solicitar a gentileza de me encaminharem a declaração de quitação condominial referente ao período de ${formData.periodoReferencia || '[PERÍODO DE REFERÊNCIA]'}, em meu nome, ${formData.nomeRequerente || '[NOME DO REQUERENTE]'}, CPF ${formData.cpfRequerente || '[CPF DO REQUERENTE]'}.

A referida declaração é de suma importância para fins de comprovação de adimplência junto ao condomínio, bem como para eventuais necessidades administrativas e/ou negociais.

Fico à disposição para quaisquer esclarecimentos ou envio de documentação complementar, caso necessário.

Agradeço antecipadamente pela atenção e aguardo um retorno.

Atenciosamente,

${formData.nomeRequerente || '[NOME DO REQUERENTE]'}
${formData.telefoneContato || '[TELEFONE DE CONTATO]'}
${formData.emailContato || '[E-MAIL DE CONTATO]'}`;
  };

  const handleCopyToClipboard = () => {
    const emailContent = generateEmailContent();
    navigator.clipboard.writeText(emailContent);
    toast({
      title: "E-mail copiado!",
      description: "O conteúdo do e-mail foi copiado para a área de transferência.",
    });
    
    // Chamar callback para marcar como solicitado
    if (onEmailSent) {
      onEmailSent();
    }
    onOpenChange(false);
  };

  const handleOpenEmailClient = () => {
    const emailContent = generateEmailContent();
    const subject = encodeURIComponent("Solicitação de Declaração de Quitação Condominial");
    const body = encodeURIComponent(emailContent);
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    window.open(mailtoLink);
    
    // Chamar callback para marcar como solicitado
    if (onEmailSent) {
      onEmailSent();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Modelo de E-mail - Quitação Condominial
          </DialogTitle>
          {ownerData && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded-md">
              ✓ Dados do proprietário preenchidos automaticamente
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="administradoraNome">Nome da Administradora</Label>
              <Input
                id="administradoraNome"
                value={formData.administradoraNome}
                onChange={(e) => setFormData(prev => ({ ...prev, administradoraNome: e.target.value }))}
                placeholder="Ex: Administradora ABC Ltda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodoReferencia">Período de Referência</Label>
              <Input
                id="periodoReferencia"
                value={formData.periodoReferencia}
                onChange={(e) => setFormData(prev => ({ ...prev, periodoReferencia: e.target.value }))}
                placeholder="Ex: Janeiro/2024 a Dezembro/2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeRequerente">Nome do Requerente</Label>
              <Input
                id="nomeRequerente"
                value={formData.nomeRequerente}
                onChange={(e) => setFormData(prev => ({ ...prev, nomeRequerente: e.target.value }))}
                placeholder="Nome completo do proprietário"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpfRequerente">CPF</Label>
              <Input
                id="cpfRequerente"
                value={formData.cpfRequerente}
                onChange={(e) => setFormData(prev => ({ ...prev, cpfRequerente: e.target.value }))}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefoneContato">Telefone de Contato</Label>
              <Input
                id="telefoneContato"
                value={formData.telefoneContato}
                onChange={(e) => setFormData(prev => ({ ...prev, telefoneContato: e.target.value }))}
                placeholder="(21) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailContato">E-mail</Label>
              <Input
                id="emailContato"
                type="email"
                value={formData.emailContato}
                onChange={(e) => setFormData(prev => ({ ...prev, emailContato: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="enderecoCompleto">Endereço Completo do Imóvel</Label>
            <Input
              id="enderecoCompleto"
              value={formData.enderecoCompleto}
              onChange={(e) => setFormData(prev => ({ ...prev, enderecoCompleto: e.target.value }))}
              placeholder="Rua, número, apartamento, bairro, cidade, estado"
              className="w-full"
            />
          </div>

          {/* Email Preview */}
          <Card className="border-2 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Preview do E-mail</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleOpenEmailClient}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Abrir Cliente de E-mail
                  </Button>
                </div>
              </div>
              <Textarea
                readOnly
                value={generateEmailContent()}
                className="min-h-[300px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
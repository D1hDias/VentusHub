import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Calculator, DollarSign, MapPin, Info, AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingModal } from '@/components/LoadingModal';

// Estados e munic�pios dispon�veis na API
const ESTADOS_DISPONIVEIS = [
  { codigo: "AM", nome: "Amazonas" },
  { codigo: "BA", nome: "Bahia" },
  { codigo: "ES", nome: "Espírito Santo" },
  { codigo: "GO", nome: "Goiás" },
  { codigo: "MG", nome: "Minas Gerais" },
  { codigo: "MS", nome: "Mato Grosso do Sul" },
  { codigo: "PA", nome: "Pará" },
  { codigo: "PR", nome: "Paraná" },
  { codigo: "RJ", nome: "Rio de Janeiro" },
  { codigo: "RS", nome: "Rio Grande do Sul" },
  { codigo: "SP", nome: "São Paulo" }
];

// Municípios principais por estado (códigos IBGE)
const MUNICIPIOS_POR_ESTADO: { [key: string]: Array<{ codigo: string; nome: string }> } = {
  "AM": [
    { codigo: "1300029", nome: "Manaus" },
    { codigo: "1300060", nome: "Parintins" },
    { codigo: "1300102", nome: "Itacoatiara" },
    { codigo: "1300144", nome: "Manacapuru" },
    { codigo: "1300201", nome: "Coari" },
    { codigo: "1300300", nome: "Tefé" },
    { codigo: "1300409", nome: "Tabatinga" },
    { codigo: "1302603", nome: "Humaitá" },
    { codigo: "1301407", nome: "Lábrea" }
  ],
  "BA": [
    { codigo: "2927408", nome: "Salvador" },
    { codigo: "2919207", nome: "Feira de Santana" },
    { codigo: "2932505", nome: "Vitória da Conquista" },
    { codigo: "2905004", nome: "Camaçari" },
    { codigo: "2919926", nome: "Juazeiro" },
    { codigo: "2914802", nome: "Ilhéus" },
    { codigo: "2917508", nome: "Itabuna" },
    { codigo: "2930709", nome: "Lauro de Freitas" },
    { codigo: "2927309", nome: "Jequié" },
    { codigo: "2900504", nome: "Alagoinhas" }
  ],
  "ES": [
    { codigo: "3205309", nome: "Vitória" },
    { codigo: "3205200", nome: "Vila Velha" },
    { codigo: "3201308", nome: "Cariacica" },
    { codigo: "3200607", nome: "Serra" },
    { codigo: "3201209", nome: "Cachoeiro de Itapemirim" },
    { codigo: "3202405", nome: "Linhares" },
    { codigo: "3203205", nome: "São Mateus" },
    { codigo: "3201407", nome: "Colatina" },
    { codigo: "3202801", nome: "Nova Venécia" },
    { codigo: "3200805", nome: "Aracruz" }
  ],
  "GO": [
    { codigo: "5208707", nome: "Goiânia" },
    { codigo: "5200050", nome: "Aparecida de Goiânia" },
    { codigo: "5200258", nome: "Anápolis" },
    { codigo: "5218805", nome: "Rio Verde" },
    { codigo: "5202601", nome: "Luziânia" },
    { codigo: "5200829", nome: "Águas Lindas de Goiás" },
    { codigo: "5221858", nome: "Valparaíso de Goiás" },
    { codigo: "5209903", nome: "Trindade" },
    { codigo: "5205497", nome: "Formosa" },
    { codigo: "5205208", nome: "Novo Gama" }
  ],
  "MG": [
    { codigo: "3106200", nome: "Belo Horizonte" },
    { codigo: "3170206", nome: "Uberlândia" },
    { codigo: "3106705", nome: "Contagem" },
    { codigo: "3118601", nome: "Juiz de Fora" },
    { codigo: "3106309", nome: "Betim" },
    { codigo: "3136702", nome: "Montes Claros" },
    { codigo: "3162922", nome: "Ribeirão das Neves" },
    { codigo: "3171501", nome: "Uberaba" },
    { codigo: "3108701", nome: "Governador Valadares" },
    { codigo: "3118007", nome: "Ipatinga" }
  ],
  "MS": [
    { codigo: "5002704", nome: "Campo Grande" },
    { codigo: "5001102", nome: "Dourados" },
    { codigo: "5007109", nome: "Três Lagoas" },
    { codigo: "5002100", nome: "Corumbá" },
    { codigo: "5004304", nome: "Ponta Porã" },
    { codigo: "5003702", nome: "Naviraí" },
    { codigo: "5004007", nome: "Nova Andradina" },
    { codigo: "5006200", nome: "Sidrolândia" },
    { codigo: "5000203", nome: "Aquidauana" },
    { codigo: "5004106", nome: "Paranaíba" }
  ],
  "PA": [
    { codigo: "1501402", nome: "Belém" },
    { codigo: "1500800", nome: "Ananindeua" },
    { codigo: "1505502", nome: "Santarém" },
    { codigo: "1502152", nome: "Marabá" },
    { codigo: "1503606", nome: "Parauapebas" },
    { codigo: "1500453", nome: "Castanhal" },
    { codigo: "1500107", nome: "Abaetetuba" },
    { codigo: "1506807", nome: "Cametá" },
    { codigo: "1501576", nome: "Bragança" },
    { codigo: "1505908", nome: "Altamira" }
  ],
  "PR": [
    { codigo: "4106902", nome: "Curitiba" },
    { codigo: "4115200", nome: "Londrina" },
    { codigo: "4113700", nome: "Maringá" },
    { codigo: "4106777", nome: "Ponta Grossa" },
    { codigo: "4104808", nome: "Cascavel" },
    { codigo: "4125506", nome: "São José dos Pinhais" },
    { codigo: "4108304", nome: "Foz do Iguaçu" },
    { codigo: "4104303", nome: "Colombo" },
    { codigo: "4109401", nome: "Guarapuava" },
    { codigo: "4118204", nome: "Paranaguá" }
  ],
  "RJ": [
    { codigo: "3304557", nome: "Rio de Janeiro" },
    { codigo: "3301702", nome: "São Gonçalo" },
    { codigo: "3301009", nome: "Duque de Caxias" },
    { codigo: "3303500", nome: "Nova Iguaçu" },
    { codigo: "3303302", nome: "Niterói" },
    { codigo: "3300456", nome: "Belford Roxo" },
    { codigo: "3303609", nome: "São João de Meriti" },
    { codigo: "3303005", nome: "Campos dos Goytacazes" },
    { codigo: "3304904", nome: "Petrópolis" },
    { codigo: "3306107", nome: "Volta Redonda" }
  ],
  "RS": [
    { codigo: "4314902", nome: "Porto Alegre" },
    { codigo: "4304606", nome: "Caxias do Sul" },
    { codigo: "4309209", nome: "Pelotas" },
    { codigo: "4304705", nome: "Canoas" },
    { codigo: "4318705", nome: "Santa Maria" },
    { codigo: "4309050", nome: "Gravataí" },
    { codigo: "4321501", nome: "Viamão" },
    { codigo: "4313409", nome: "Novo Hamburgo" },
    { codigo: "4318408", nome: "São Leopoldo" },
    { codigo: "4314407", nome: "Rio Grande" }
  ],
  "SP": [
    { codigo: "3550308", nome: "São Paulo" },
    { codigo: "3509502", nome: "Guarulhos" },
    { codigo: "3505708", nome: "Campinas" },
    { codigo: "3547809", nome: "São Bernardo do Campo" },
    { codigo: "3548708", nome: "Santo André" },
    { codigo: "3543402", nome: "Osasco" },
    { codigo: "3518800", nome: "Ribeirão Preto" },
    { codigo: "3551009", nome: "Sorocaba" },
    { codigo: "3552205", nome: "São José dos Campos" },
    { codigo: "3506003", nome: "Carapicuíba" },
    { codigo: "3513009", nome: "Jundiaí" },
    { codigo: "3513801", nome: "Mauá" },
    { codigo: "3530607", nome: "Mogi das Cruzes" },
    { codigo: "3503208", nome: "Bauru" },
    { codigo: "3510609", nome: "Diadema" }
  ]
};

// Tipos de consulta
const TIPOS_CONSULTA = [
  { id: 1, nome: "Registro em Geral", descricao: "Registro padrão de imóvel" },
  { id: 2, nome: "Compra e Venda com Alienação Fiduciária", descricao: "Registro com financiamento" },
  { id: 3, nome: "Averbação com Valor Econômico", descricao: "Averbação que envolve valor econômico" }
];

// Códigos de desconto por estado
const DESCONTOS_POR_ESTADO: { [key: string]: Array<{ codigo: string; titulo: string; reducao: string }> } = {
  "AM": [
    { codigo: "SFH/AM", titulo: "1ª Aquisição SFH", reducao: "50%" },
    { codigo: "PCVA_MCMV/AM", titulo: "Minha Casa Minha Vida", reducao: "50%" },
    { codigo: "FAR_FDS/AM", titulo: "FAR e FDS", reducao: "75%" },
    { codigo: "HAP/AM", titulo: "Habitação Popular", reducao: "50%" }
  ],
  "BA": [
    { codigo: "SFH/BA", titulo: "1ª Aquisição SFH", reducao: "50%" },
    { codigo: "PCVA_MCMV/BA", titulo: "Minha Casa Minha Vida", reducao: "50%" },
    { codigo: "FAR_FDS/BA", titulo: "FAR e FDS", reducao: "75%" }
  ],
  "ES": [
    { codigo: "SFH/ES", titulo: "1ª Aquisição SFH", reducao: "50%" },
    { codigo: "PCVA_MCMV/ES", titulo: "Minha Casa Minha Vida", reducao: "50%" },
    { codigo: "FAR_FDS/ES", titulo: "FAR e FDS", reducao: "75%" }
  ],
  "GO": [
    { codigo: "SFH/GO", titulo: "1ª Aquisição SFH", reducao: "50%" },
    { codigo: "PCVA_MCMV/GO", titulo: "Minha Casa Minha Vida", reducao: "50%" },
    { codigo: "FAR_FDS/GO", titulo: "FAR e FDS", reducao: "75%" }
  ],
  "MG": [
    { codigo: "SFH/MG", titulo: "1ª Aquisição SFH", reducao: "50%" },
    { codigo: "PCVA_MCMV/MG", titulo: "Minha Casa Minha Vida", reducao: "50%" },
    { codigo: "FAR_FDS/MG", titulo: "FAR e FDS", reducao: "75%" }
  ],
  "MS": [
    { codigo: "SFH/MS", titulo: "1ª Aquisição SFH", reducao: "50%" },
    { codigo: "PCVA_MCMV/MS", titulo: "Minha Casa Minha Vida", reducao: "50%" },
    { codigo: "FAR_FDS/MS", titulo: "FAR e FDS", reducao: "75%" }
  ],
  "PA": [
    { codigo: "SFH/PA", titulo: "1ª Aquisição SFH", reducao: "50%" },
    { codigo: "PCVA_MCMV/PA", titulo: "Minha Casa Minha Vida", reducao: "50%" },
    { codigo: "FAR_FDS/PA", titulo: "FAR e FDS", reducao: "75%" }
  ],
  "PR": [
    { codigo: "SFH/PR", titulo: "1ª Aquisição SFH", reducao: "50%" },
    { codigo: "PCVA_MCMV/PR", titulo: "Minha Casa Minha Vida", reducao: "50%" },
    { codigo: "FAR_FDS/PR", titulo: "FAR e FDS", reducao: "75%" }
  ],
  "RJ": [
    { codigo: "SFH/RJ", titulo: "1ª Aquisição SFH", reducao: "50%" },
    { codigo: "EP/RJ", titulo: "1ª Aquisição - Escritura Pública", reducao: "20%" },
    { codigo: "PCVA_MCMV/RJ", titulo: "Minha Casa Minha Vida", reducao: "50%" },
    { codigo: "FAR_FDS/RJ", titulo: "FAR e FDS", reducao: "75%" }
  ],
  "RS": [
    { codigo: "SFH/RS", titulo: "1ª Aquisição SFH", reducao: "50%" },
    { codigo: "PCVA_MCMV/RS", titulo: "Minha Casa Minha Vida", reducao: "50%" },
    { codigo: "FAR_FDS/RS", titulo: "FAR e FDS", reducao: "75%" }
  ],
  "SP": [
    { codigo: "SFH/SP", titulo: "1ª Aquisição SFH", reducao: "50%" },
    { codigo: "PCVA_MCMV/SP", titulo: "Minha Casa Minha Vida", reducao: "50%" },
    { codigo: "FAR_FDS/SP", titulo: "FAR e FDS", reducao: "75%" }
  ]
};

interface FormData {
  codigo_municipio: string;
  nome_municipio: string;
  consulta_id: number;
  valor_imovel: string;
  valor_financiamento: string;
  desconto: string;
  estado_selecionado: string;
}

interface Ato {
  descricao: string;
  emolumento: number;
  taxa_de_fiscalizacao?: number; // Campo opcional para compatibilidade
  "lei6370/12-2%"?: number; // Novo campo da API real
  "tribunal_de_justica-20%"?: number; // Novo campo da API real
  "defensoria_publica-5%"?: number; // Novo campo da API real
  "procuradoria_do_estado-5%"?: number; // Novo campo da API real
  "registro_civil-6%": number;
  subtotal: number;
}

interface TaxaExtra {
  descricao: string;
  valor: number;
}

interface ResultadoRegistro {
  total: number;
  extra_information: string;
  atos: Ato[];
  taxas_extras: TaxaExtra[];
}

export default function SimuladorValorRegistro() {
  const [formData, setFormData] = useState<FormData>({
    codigo_municipio: '',
    nome_municipio: '',
    consulta_id: 1,
    valor_imovel: '',
    valor_financiamento: '',
    desconto: '',
    estado_selecionado: ''
  });

  const [resultado, setResultado] = useState<ResultadoRegistro | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'valor_imovel' || field === 'valor_financiamento') {
      const numericValue = value.replace(/[^\d]/g, '');
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(Number(numericValue) / 100);
      setFormData(prev => ({ ...prev, [field]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const parseMonetaryValue = (value: string): number => {
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const calcularRegistro = async () => {
    // Limpar estado anterior primeiro
    setError(null);
    setResultado(null);

    // Validações iniciais
    const valorImovel = parseMonetaryValue(formData.valor_imovel);
    if (!formData.codigo_municipio) {
      setError('Por favor, informe o código IBGE do município');
      return;
    }

    if (valorImovel <= 0) {
      setError('Por favor, informe um valor válido para o imóvel');
      return;
    }

    if (formData.consulta_id === 2) {
      const valorFinanciamento = parseMonetaryValue(formData.valor_financiamento);
      if (valorFinanciamento <= 0) {
        setError('Para Compra e Venda com Alienação Fiduciária, o valor do financiamento é obrigatório');
        return;
      }
      if (valorFinanciamento > valorImovel) {
        setError('O valor do financiamento não pode ser maior que o valor do imóvel');
        return;
      }
    }

    // Abrir modal e processar tudo junto
    setIsLoadingModalOpen(true);
    setLoading(true);

    try {
      // Preparar dados para API
      const formDataAPI = new FormData();
      formDataAPI.append('codigo_municipio', formData.codigo_municipio);
      formDataAPI.append('consulta_id', formData.consulta_id.toString());
      formDataAPI.append('valor_imovel', valorImovel.toString());

      if (formData.consulta_id === 2) {
        const valorFinanciamento = parseMonetaryValue(formData.valor_financiamento);
        formDataAPI.append('valor_financiamento', valorFinanciamento.toString());
      }

      if (formData.desconto && formData.desconto.trim()) {
        formDataAPI.append('desconto', formData.desconto);
      }

      // Fazer requisi��o para a API
      const response = await fetch('https://calculadora.registrodeimoveis.org.br/api/calculate', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer 87|KtbDAR2FtvLIHtVc0LVi8YPIXsDxz882T1HJNEA2'
        },
        body: formDataAPI
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Dados inválidos fornecidos');
        }
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data: any = await response.json();

      // A API retorna os dados dentro de um objeto "result"
      const resultado = data.result || data;

      // Validar se a resposta tem a estrutura esperada
      if (resultado && typeof resultado.total === 'number' && Array.isArray(resultado.atos)) {
        // Garantir que taxas_extras seja um array (pode ser undefined em algumas respostas)
        const resultadoValidado: ResultadoRegistro = {
          total: resultado.total,
          extra_information: resultado.extra_information || '',
          atos: resultado.atos || [],
          taxas_extras: Array.isArray(resultado.taxas_extras) ? resultado.taxas_extras : []
        };
        setResultado(resultadoValidado);
      } else {
        // API retornou formato inesperado
        throw new Error(`Formato de resposta inválido da API. Estrutura recebida: ${Object.keys(resultado).join(', ')}`);
      }

    } catch (error) {

      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          setError("Não foi possível conectar com a API. Verifique sua conexão com a internet.");
        } else if (error.message.includes('Formato de resposta inválido')) {
          setError(`Erro no formato da resposta da API: ${error.message}`);
        } else if (error.message.includes('Dados inválidos fornecidos')) {
          setError("Dados inválidos fornecidos pela API. Verifique se todos os campos estão corretos.");
        } else {
          setError(error.message);
        }
      } else {
        setError("Erro desconhecido ao calcular valor do registro");
      }
    } finally {
      setLoading(false);
      setIsLoadingModalOpen(false);
    }
  };

  const descontosDisponiveis = (formData.estado_selecionado && DESCONTOS_POR_ESTADO[formData.estado_selecionado]) || [];
  const municipiosDisponiveis = (formData.estado_selecionado && MUNICIPIOS_POR_ESTADO[formData.estado_selecionado]) || [];

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Calculadora de Registro de Imóveis
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Calcule os custos oficiais de registro de imóveis no Brasil
            </p>
          </div>
        </div>

        {/* Alerta informativo */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Estados disponíveis:</strong> AM, BA, ES, GO, MG, MS, PA, PR, RJ, RS, SP.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Dados do Imóvel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="estado_selecionado">Estado</Label>
                <Select
                  value={formData.estado_selecionado}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    estado_selecionado: value,
                    codigo_municipio: '', // Reset município quando mudar estado
                    nome_municipio: '', // Reset nome do município
                    desconto: '' // Reset desconto quando mudar estado
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_DISPONIVEIS && ESTADOS_DISPONIVEIS.map((estado) => (
                      <SelectItem key={estado.codigo} value={estado.codigo}>
                        {estado.nome} ({estado.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="municipio">Município</Label>
                <Select
                  value={formData.codigo_municipio}
                  onValueChange={(value) => {
                    const municipioSelecionado = municipiosDisponiveis.find(m => m.codigo === value);
                    setFormData(prev => ({
                      ...prev,
                      codigo_municipio: value,
                      nome_municipio: municipioSelecionado?.nome || ''
                    }));
                  }}
                  disabled={!formData.estado_selecionado}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.estado_selecionado ? "Selecione o município" : "Selecione um estado primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(municipiosDisponiveis) && municipiosDisponiveis.map((municipio) => (
                      <SelectItem key={municipio.codigo} value={municipio.codigo}>
                        {municipio.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="consulta_id">Tipo de Registro</Label>
                <Select
                  value={formData.consulta_id.toString()}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    consulta_id: Number(value),
                    valor_financiamento: Number(value) !== 2 ? '' : prev.valor_financiamento
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CONSULTA && TIPOS_CONSULTA.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        <div>
                          <div className="font-medium">{tipo.nome}</div>
                          <div className="text-xs text-muted-foreground">{tipo.descricao}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="valor_imovel">Valor do Imóvel (R$)</Label>
                <Input
                  id="valor_imovel"
                  type="text"
                  placeholder="R$ 0,00"
                  value={formData.valor_imovel}
                  onChange={(e) => handleInputChange('valor_imovel', e.target.value)}
                />
              </div>

              {formData.consulta_id === 2 && (
                <div>
                  <Label htmlFor="valor_financiamento">Valor do Financiamento (R$)</Label>
                  <Input
                    id="valor_financiamento"
                    type="text"
                    placeholder="R$ 0,00"
                    value={formData.valor_financiamento}
                    onChange={(e) => handleInputChange('valor_financiamento', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Obrigatório para Compra e Venda com Alienação Fiduciária
                  </p>
                </div>
              )}

              <Separator />

              {formData.estado_selecionado && (
                <div>
                  <Label htmlFor="desconto">Desconto Aplicável (opcional)</Label>
                  <Select
                    value={formData.desconto}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, desconto: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum desconto" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(descontosDisponiveis) && descontosDisponiveis.map((desconto) => (
                        <SelectItem key={desconto.codigo} value={desconto.codigo}>
                          <div>
                            <div className="font-medium">{desconto.titulo}</div>
                            <div className="text-xs text-muted-foreground">Redução: {desconto.reducao}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={calcularRegistro}
                disabled={loading || isLoadingModalOpen}
                className="w-full"
              >
                {(loading || isLoadingModalOpen) ? "Calculando..." : "Calcular Valor do Registro"}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2">
          {resultado && (
            <div className="space-y-6">
              {/* Card Principal */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total do Registro</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(resultado.total)}
                      </p>
                      <p className="text-xs text-gray-500">Custos oficiais calculados</p>
                    </div>
                    <Calculator className="w-12 h-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Detalhamento dos Atos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Detalhamento dos Atos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Ato</th>
                          <th className="text-right p-3 font-medium">Emolumento</th>
                          <th className="text-right p-3 font-medium">Taxa Fiscalização</th>
                          <th className="text-right p-3 font-medium">Registro Civil 6%</th>
                          <th className="text-right p-3 font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultado.atos && resultado.atos.map((ato, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3 font-medium">{ato.descricao}</td>
                            <td className="text-right p-3">{formatCurrency(ato.emolumento)}</td>
                            <td className="text-right p-3">{formatCurrency(ato.taxa_de_fiscalizacao || 0)}</td>
                            <td className="text-right p-3">{formatCurrency(ato["registro_civil-6%"])}</td>
                            <td className="text-right p-3 font-bold text-green-600">{formatCurrency(ato.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Taxas Extras */}
              {resultado.taxas_extras && resultado.taxas_extras.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Taxas Extras
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {resultado.taxas_extras && resultado.taxas_extras.map((taxa, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border-b last:border-b-0">
                        <span className="font-medium">{taxa.descricao}</span>
                        <span className="text-orange-600 font-bold">{formatCurrency(taxa.valor)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Informações Adicionais */}
              {resultado.extra_information && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      Informações Adicionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-sm text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: resultado.extra_information }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Resumo dos Dados Utilizados */}
              <Card>
                <CardHeader>
                  <CardTitle>Dados Utilizados no Cálculo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Estado:</span> {formData.estado_selecionado}
                    </div>
                    <div>
                      <span className="font-medium">Código IBGE:</span> {formData.codigo_municipio}
                    </div>
                    <div>
                      <span className="font-medium">Tipo de Registro:</span> {TIPOS_CONSULTA.find(t => t.id === formData.consulta_id)?.nome}
                    </div>
                    <div>
                      <span className="font-medium">Valor do Imóvel:</span> {formData.valor_imovel}
                    </div>
                    {formData.consulta_id === 2 && (
                      <div>
                        <span className="font-medium">Valor do Financiamento:</span> {formData.valor_financiamento}
                      </div>
                    )}
                    {formData.desconto && (
                      <div className="col-span-2">
                        <span className="font-medium">Desconto Aplicado:</span>
                        <Badge variant="secondary" className="ml-2">
                          {descontosDisponiveis.find(d => d.codigo === formData.desconto)?.titulo}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!resultado && !error && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Pronto para calcular?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Preencha os dados do imóvel e clique em "Calcular Valor do Registro" para obter os custos oficiais.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Carregamento */}
      <LoadingModal
        isOpen={isLoadingModalOpen}
        onClose={() => setIsLoadingModalOpen(false)}
        message="Consultando API de Registro de Imóveis..."
        selectedBanks={1}
        duration={3000}
      />
    </div>
  );
}
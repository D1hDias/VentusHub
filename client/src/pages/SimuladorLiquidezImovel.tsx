
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useSmoothtTransitions } from "@/hooks/useSmoothtTransitions";
import { useResponsive } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, TrendingUp, CheckCircle, AlertTriangle, BarChart, FileImage, Info } from 'lucide-react';
import { LiquidityIndexIn, LiquidityIndexOut } from "../../../shared/liquidity";

const BairrosMock = [
  { id: "SP_PINHEIROS", nome: "Pinheiros, São Paulo" },
  { id: "SP_JARDINS", nome: "Jardins, São Paulo" },
  { id: "RJ_COPACABANA", nome: "Copacabana, Rio de Janeiro" },
  { id: "RJ_LEBLON", nome: "Leblon, Rio de Janeiro" },
];

export default function SimuladorLiquidezImovel() {
  const { getListVariants, getListItemVariants } = useSmoothtTransitions();
  const { isMobile } = useResponsive();
  
  const [formData, setFormData] = useState<Partial<LiquidityIndexIn>>({
    preco_anuncio: 1,
    area_m2: 1,
    bairro_id: "SP_PINHEIROS",
    data_captura: new Date().toISOString().split('T')[0],
    horizonte_dias: 90,
    fotos_urls: [],
    texto_anuncio: "",
    toggle_analise_fotos: true,
    toggle_sugestoes_preco: true,
  });
  const [resultado, setResultado] = useState<LiquidityIndexOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof LiquidityIndexIn, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleMonetaryChange = (field: 'preco_anuncio', value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    handleInputChange(field, Number(numericValue) / 100);
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(numericValue) / 100);
    // This is a bit of a hack to display the formatted value
    (document.getElementById(field) as HTMLInputElement).value = formattedValue;
  };

  const simularLiquidez = async () => {
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const response = await fetch('/api/simulations/liquidity-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Erro na comunicação com o servidor');
      }

      const data: LiquidityIndexOut = await response.json();
      setResultado(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simulador-container p-6 space-y-6 bg-background min-h-screen">
      <motion.div
        variants={getListItemVariants()}
        initial="hidden"
        animate="visible"
      >
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-6 h-6 text-primary" />
            Simulador de Liquidez de Imóvel Anunciado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Estime a probabilidade de venda do seu imóvel e receba recomendações para aumentar a liquidez.
          </p>
        </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={getListVariants()}
        initial="hidden"
        animate="visible"
      >
        <div className="md:col-span-1 space-y-6">
          <motion.div variants={getListItemVariants()}>
            <Card>
            <CardHeader>
              <CardTitle>Dados do Anúncio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="preco_anuncio">Preço do Anúncio (R$)</Label>
                <Input id="preco_anuncio" type="text" placeholder="R$ 720.000,00" onChange={(e) => handleMonetaryChange('preco_anuncio', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="area_m2">Área (m²)</Label>
                <Input id="area_m2" type="number" placeholder="80" value={formData.area_m2} onChange={(e) => handleInputChange('area_m2', Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="bairro_id">Bairro</Label>
                <Select value={formData.bairro_id} onValueChange={(val) => handleInputChange('bairro_id', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BairrosMock.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="texto_anuncio">Texto do Anúncio</Label>
                <Textarea id="texto_anuncio" placeholder="Descreva os detalhes do imóvel..." value={formData.texto_anuncio} onChange={(e) => handleInputChange('texto_anuncio', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="fotos_urls">URLs das Fotos (separadas por vírgula)</Label>
                <Input id="fotos_urls" type="text" placeholder="https://.../1.jpg,https://.../2.jpg" onChange={(e) => handleInputChange('fotos_urls', e.target.value.split(',').map((url: any) => url.trim()))} />
              </div>
            </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={getListItemVariants()}>
            <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between">
                <Label htmlFor="toggle_sugestoes_preco">Sugerir Preço?</Label>
                <Switch id="toggle_sugestoes_preco" checked={formData.toggle_sugestoes_preco} onCheckedChange={(val) => handleInputChange('toggle_sugestoes_preco', val)} />
              </div>
            </CardContent>
            </Card>
          </motion.div>

          <Button onClick={simularLiquidez} disabled={loading} className="w-full">
            {loading ? 'Analisando...' : 'Calcular Liquidez'}
          </Button>
        </div>

        <div className="md:col-span-2">
          {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          {resultado && (
            <motion.div variants={getListItemVariants()}>
              <Card>
              <CardHeader>
                <CardTitle>Resultado da Análise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-muted-foreground">Score de Liquidez (0-100)</p>
                  <p className={`text-6xl font-bold ${(resultado as any).score_0_100 > 70 ? 'text-green-600' : (resultado as any).score_0_100 > 40 ? 'text-yellow-500' : 'text-red-600'}`}>
                    {(resultado as any).score_0_100}
                  </p>
                  <p className="text-muted-foreground">
                    Probabilidade de venda em {(resultado as any).horizonte_dias} dias: {((resultado as any).prob_venda_pct * 100).toFixed(0)}%
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2"><Lightbulb className="w-5 h-5 text-yellow-400" /> Recomendações</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {(resultado as any).recomendacoes.map((rec: any, i: any) => <li key={i}>{rec}</li>)}
                  </ul>
                </div>

                {(resultado as any).features_debug && (
                  <div>
                    <h3 className="font-semibold">Dados de Debug</h3>
                    <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                      {JSON.stringify((resultado as any).features_debug, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

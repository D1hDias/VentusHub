/**
 * Utilitários de formatação para VentusHub
 */

/**
 * Formata número sequencial de propriedades de forma consistente
 * @param sequenceNumber - Número sequencial que pode vir do banco
 * @returns Número formatado no padrão #00001
 */
export function formatSequenceNumber(sequenceNumber: string | undefined | null): string {
  if (!sequenceNumber) return '#00000';
  
  // Se já tem #, retorna como está
  if (sequenceNumber.startsWith('#')) {
    return sequenceNumber;
  }
  
  // Se é só número, adiciona # e padding
  const numericPart = sequenceNumber.replace(/\D/g, '');
  if (numericPart) {
    return '#' + numericPart.padStart(5, '0');
  }
  
  return '#00000';
}

/**
 * Formata valores monetários
 * @param value - Valor numérico ou string
 * @returns Valor formatado em R$
 */
export function formatCurrency(value: number | string): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue);
}

/**
 * Formata endereços de propriedades
 * @param property - Objeto da propriedade
 * @returns Endereço formatado
 */
export function formatPropertyAddress(property: {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}): string {
  const parts = [];
  
  if (property.street) parts.push(property.street);
  if (property.number) parts.push(property.number);
  if (property.complement) parts.push(property.complement);
  
  const streetPart = parts.join(', ');
  const locationParts = [];
  
  if (property.neighborhood) locationParts.push(property.neighborhood);
  if (property.city) locationParts.push(property.city);
  if (property.state) locationParts.push(property.state);
  
  const locationPart = locationParts.join(', ');
  
  return [streetPart, locationPart].filter(Boolean).join(' - ');
}

/**
 * Formata nomes de etapas baseado no número da etapa
 * @param stage - Número da etapa (1-8)
 * @returns Nome da etapa
 */
export function formatStageName(stage: number): string {
  const stageNames = {
    1: 'Captação',
    2: 'Due Diligence',
    3: 'Mercado',
    4: 'Propostas',
    5: 'Contratos',
    6: 'Financiamento',
    7: 'Instrumento',
    8: 'Concluído'
  };
  
  return stageNames[stage as keyof typeof stageNames] || 'Pendente';
}

/**
 * Formata classes CSS para badges de etapa
 * @param stage - Número da etapa (1-8)
 * @returns Classes CSS para o badge
 */
export function formatStageClasses(stage: number): string {
  const stageClasses = {
    1: 'bg-orange-100 text-orange-600 border-orange-200',
    2: 'bg-blue-100 text-blue-600 border-blue-200',
    3: 'bg-green-100 text-green-600 border-green-200',
    4: 'bg-purple-100 text-purple-600 border-purple-200',
    5: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    6: 'bg-teal-100 text-teal-600 border-teal-200',
    7: 'bg-green-100 text-green-600 border-green-200',
    8: 'bg-green-100 text-green-600 border-green-200'
  };
  
  return stageClasses[stage as keyof typeof stageClasses] || 'bg-gray-100 text-gray-600 border-gray-200';
}
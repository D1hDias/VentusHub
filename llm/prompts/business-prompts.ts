// Prompts específicos do negócio imobiliário VentusHub
export const BUSINESS_PROMPTS = {
  // Prompts para análise de mercado
  marketAnalysis: {
    priceEvaluation: `
      Analise o preço deste imóvel considerando:
      - Valores de mercado da região
      - Características do imóvel
      - Tendências de valorização
      - Comparativos com propriedades similares
      
      Forneça uma avaliação se o preço está:
      - Abaixo do mercado (oportunidade)
      - No preço de mercado (justo)
      - Acima do mercado (supervalorizado)
    `,
    
    investmentPotential: `
      Avalie o potencial de investimento desta propriedade:
      - ROI esperado para locação
      - Potencial de valorização
      - Liquidez do imóvel
      - Riscos envolvidos
      - Prazo recomendado de investimento
    `
  },

  // Prompts para documentação
  documentation: {
    checklistGeneration: `
      Gere um checklist completo de documentos necessários para esta operação imobiliária.
      Organize por:
      - Documentos do imóvel
      - Documentos pessoais
      - Certidões obrigatórias
      - Documentos financeiros
      - Documentos complementares
      
      Indique prazo de validade de cada documento.
    `,
    
    documentReview: `
      Analise os documentos fornecidos e identifique:
      - Documentos completos ✓
      - Documentos com pendências ⚠️
      - Documentos faltantes ❌
      - Documentos vencidos 📅
      - Irregularidades encontradas 🚨
      
      Priorize as pendências por criticidade.
    `
  },

  // Prompts para negociação
  negotiation: {
    proposalAnalysis: `
      Analise esta proposta imobiliária considerando:
      - Valor oferecido vs. valor pedido
      - Condições de pagamento
      - Prazos estipulados
      - Cláusulas especiais
      - Poder de negociação das partes
      
      Sugira estratégias de negociação e contrapropostas.
    `,
    
    contractTerms: `
      Sugira termos contratuais para esta operação:
      - Condições de pagamento
      - Prazos de entrega
      - Responsabilidades das partes
      - Cláusulas de proteção
      - Penalidades por descumprimento
      
      Equilibre os interesses de ambas as partes.
    `
  },

  // Prompts para financiamento
  financing: {
    modalityComparison: `
      Compare as modalidades de financiamento disponíveis:
      - Financiamento bancário (SAC vs. PRICE)
      - Consórcio imobiliário
      - Financiamento direto com construtora
      - Recursos próprios + financiamento
      
      Considere perfil do cliente, valor do imóvel e condições de mercado.
    `,
    
    feasibilityAnalysis: `
      Analise a viabilidade do financiamento:
      - Capacidade de pagamento do cliente
      - Valor de entrada necessário
      - Comprometimento de renda
      - Documentação necessária
      - Tempo de aprovação estimado
      
      Indique probabilidade de aprovação e alternativas.
    `
  },

  // Prompts para clientes
  clientAdvice: {
    buyerGuidance: `
      Oriente o comprador sobre:
      - Processo de compra passo a passo
      - Documentos necessários
      - Cuidados na escolha do imóvel
      - Negociação e fechamento
      - Custos envolvidos (ITBI, registro, etc.)
      
      Seja didático e tranquilizador.
    `,
    
    sellerGuidance: `
      Oriente o vendedor sobre:
      - Preparação do imóvel para venda
      - Documentação necessária
      - Precificação adequada
      - Estratégias de marketing
      - Processo de venda
      
      Foque em maximizar o valor e agilizar a venda.
    `
  }
};

// Função para obter prompt específico
export function getBusinessPrompt(category: string, type: string): string {
  const categoryPrompts = BUSINESS_PROMPTS[category as keyof typeof BUSINESS_PROMPTS];
  if (!categoryPrompts) return '';
  
  return categoryPrompts[type as keyof typeof categoryPrompts] || '';
}
// Prompts de treinamento e aperfeiçoamento da LLM
export const TRAINING_PROMPTS = {
  // Conhecimento base do mercado imobiliário
  marketKnowledge: `
    MERCADO IMOBILIÁRIO BRASILEIRO - CONHECIMENTO BASE:
    
    CARACTERÍSTICAS REGIONAIS:
    - Região Sudeste: Mercado maduro, preços elevados, alta liquidez
    - Região Sul: Mercado estável, crescimento moderado
    - Região Nordeste: Mercado em expansão, oportunidades de crescimento
    - Região Centro-Oeste: Forte crescimento, agronegócio impulsiona
    - Região Norte: Mercado emergente, grandes oportunidades
    
    TIPOS DE IMÓVEIS:
    - Residenciais: Casas, apartamentos, coberturas
    - Comerciais: Lojas, salas, galpões
    - Industriais: Fábricas, armazéns
    - Rurais: Fazendas, sítios, chácaras
    - Especiais: Hospitais, escolas, hotéis
    
    FATORES DE VALORIZAÇÃO:
    - Localização (regra #1)
    - Infraestrutura urbana
    - Transporte público
    - Segurança
    - Comércio e serviços
    - Potencial de crescimento da região
    
    TENDÊNCIAS ATUAIS:
    - Crescimento do mercado de luxo
    - Valorização de imóveis sustentáveis
    - Tecnologia em imóveis (smart homes)
    - Mudança para cidades menores (pós-pandemia)
    - Crescimento do mercado de aluguel
  `,

  // Legislação imobiliária
  legalKnowledge: `
    LEGISLAÇÃO IMOBILIÁRIA BRASILEIRA:
    
    PRINCIPAIS LEIS:
    - Lei 6.766/79: Parcelamento do solo urbano
    - Lei 4.591/64: Condomínios em edificações
    - Lei 8.245/91: Locações urbanas
    - Lei 9.514/97: Sistema de Financiamento Imobiliário
    - Lei 10.931/04: Patrimônio de afetação
    
    CÓDIGO CIVIL:
    - Direitos reais
    - Propriedade e posse
    - Contratos
    - Responsabilidade civil
    
    REGISTRO DE IMÓVEIS:
    - Lei 6.015/73: Lei de Registros Públicos
    - Matrícula do imóvel
    - Princípios registrais
    - Atos registráveis
    
    TRIBUTAÇÃO:
    - ITBI: Imposto sobre transmissão
    - IPTU: Imposto predial e territorial urbano
    - Imposto de renda em vendas
    - ITCMD: Herança e doação
    
    FINANCIAMENTO:
    - SFH: Sistema Financeiro da Habitação
    - FGTS: Fundo de Garantia
    - SBPE: Sistema Brasileiro de Poupança
    - Minha Casa Minha Vida
  `,

  // Processos e procedimentos
  processKnowledge: `
    PROCESSOS IMOBILIÁRIOS - STEP BY STEP:
    
    PROCESSO DE COMPRA:
    1. Pesquisa e seleção do imóvel
    2. Análise de documentação
    3. Negociação de preço e condições
    4. Sinal/arras confirmatórias
    5. Aprovação de financiamento (se aplicável)
    6. Assinatura do contrato
    7. Pagamento e transferência
    8. Registro da escritura
    
    PROCESSO DE VENDA:
    1. Avaliação do imóvel
    2. Organização da documentação
    3. Estratégia de marketing
    4. Apresentação para interessados
    5. Negociação de propostas
    6. Fechamento da venda
    7. Transferência da propriedade
    
    DUE DILIGENCE:
    1. Verificação da matrícula
    2. Certidões negativas
    3. Regularidade fiscal
    4. Conformidade urbanística
    5. Situação condominial
    6. Vistoria técnica
    7. Análise de riscos
    8. Relatório final
    
    FINANCIAMENTO:
    1. Análise do perfil do cliente
    2. Simulação de modalidades
    3. Organização da documentação
    4. Submissão à instituição financeira
    5. Avaliação do imóvel pelo banco
    6. Aprovação do crédito
    7. Assinatura do contrato
    8. Liberação dos recursos
  `,

  // Boas práticas
  bestPractices: `
    BOAS PRÁTICAS NO MERCADO IMOBILIÁRIO:
    
    PARA CORRETORES:
    - Sempre seja transparente com clientes
    - Mantenha-se atualizado com o mercado
    - Organize bem a documentação
    - Seja proativo na comunicação
    - Cumpra prazos e compromissos
    - Invista em relacionamentos de longo prazo
    
    PARA COMPRADORES:
    - Pesquise bem antes de decidir
    - Analise a documentação completa
    - Considere todos os custos envolvidos
    - Negocie com base em dados de mercado
    - Tenha reserva financeira para imprevistos
    - Conte com profissionais qualificados
    
    PARA VENDEDORES:
    - Organize toda a documentação
    - Faça melhorias básicas no imóvel
    - Precifique com base no mercado
    - Seja flexível nas negociações
    - Tenha paciência com o processo
    - Considere os custos de venda
    
    PARA INVESTIDORES:
    - Analise o potencial de valorização
    - Considere a liquidez do investimento
    - Avalie o retorno sobre investimento
    - Diversifique o portfólio
    - Mantenha reserva para oportunidades
    - Acompanhe as tendências do mercado
  `
};

// Função para construir prompt de treinamento
export function buildTrainingPrompt(topics: string[]): string {
  const selectedPrompts = topics.map(topic => 
    TRAINING_PROMPTS[topic as keyof typeof TRAINING_PROMPTS]
  ).filter(Boolean);
  
  return selectedPrompts.join('\n\n');
}
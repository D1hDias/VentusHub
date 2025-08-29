import { llmClient } from './client.js';
import { getDefaultConfig } from './config.js';

// Exemplo 1: Uso básico com configuração padrão
async function exemploBasico() {
  const config = getDefaultConfig(); // Já configurado com DeepSeek gratuito
  
  const response = await llmClient.chat(
    'Analise este imóvel de 3 quartos em Copacabana...',
    config,
    'property-analysis'
  );

  console.log(response.content);
}

// Exemplo 2: Uso com modelo customizado (ID direto)
async function exemploModeloCustomizado() {
  const config = createLLMConfig(
    'sua-api-key-aqui',
    'anthropic/claude-3.5-sonnet', // ID direto do OpenRouter
    {
      systemPrompt: 'Você é um especialista em contratos imobiliários.'
    }
  );

  const response = await llmClient.chat(
    'Gere um contrato de compra e venda...',
    config,
    'contract-generation'
  );

  console.log(response.content);
}

// Exemplo 3: Conversação com histórico
async function exemploConversa() {
  const config = createLLMConfig('sua-api-key-aqui', 'claude-3-haiku');
  
  const mensagens = [
    { role: 'user' as const, content: 'Quais documentos preciso para due diligence?' },
    { role: 'assistant' as const, content: 'Para due diligence você precisará de...' },
    { role: 'user' as const, content: 'E sobre a certidão negativa?' }
  ];

  const response = await llmClient.sendMessage(mensagens, config, 'due-diligence');
  console.log(response.content);
}

// Exemplo 4: Diferentes contextos
async function exemploContextos() {
  const config = createLLMConfig('sua-api-key-aqui', 'gpt-4o');

  // Análise de mercado
  const mercado = await llmClient.chat(
    'Como está o mercado imobiliário no Rio?',
    config,
    'market-analysis'
  );

  // Revisão de documentos
  const documentos = await llmClient.chat(
    'Revise esta escritura...',
    config,
    'document-review'
  );

  // Auxílio em propostas
  const proposta = await llmClient.chat(
    'Como negociar esta proposta?',
    config,
    'proposal-assistance'
  );
}
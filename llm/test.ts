import { llmClient } from './client.js';
import { getDefaultConfig } from './config.js';

// Teste simples da integração
async function testeBasico() {
  console.log('🚀 Testando integração com DeepSeek...');
  
  try {
    const config = getDefaultConfig();
    console.log('📋 Configuração:', {
      modelo: config.model,
      provider: config.provider,
      temperature: config.temperature
    });

    const response = await llmClient.chat(
      'Olá! Você pode me explicar brevemente o que é due diligence em transações imobiliárias?',
      config,
      'due-diligence'
    );

    console.log('✅ Resposta recebida:');
    console.log(response.content);
    console.log('\n📊 Uso de tokens:', response.usage);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Teste com análise de propriedade
async function testeAnalisePropriedade() {
  console.log('\n🏠 Testando análise de propriedade...');
  
  try {
    const config = getDefaultConfig();
    
    const response = await llmClient.chat(
      'Analise este imóvel: Apartamento de 2 quartos, 65m², em Copacabana, Rio de Janeiro, por R$ 850.000. Quais são os principais pontos de atenção?',
      config,
      'property-analysis'
    );

    console.log('✅ Análise da propriedade:');
    console.log(response.content);
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

// Executar testes
async function executarTestes() {
  await testeBasico();
  await testeAnalisePropriedade();
}

// Uncomment para executar: executarTestes();
export { testeBasico, testeAnalisePropriedade, executarTestes };
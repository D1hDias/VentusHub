
import { LLMClient } from './client';
import { models } from './models';

/**
 * A simple script to ask a question to the Gemini LLM from the command line.
 */
async function askGemini() {
  // Extract the question from command line arguments
  const question = process.argv.slice(2).join(' ');

  if (!question) {
    console.error('❌ Por favor, forneça uma pergunta.');
    console.log('Uso: npx ts-node llm/ask.ts "Sua pergunta aqui"');
    process.exit(1);
  }

  console.log('🤖 Pensando...');

  try {
    // Initialize the client with the Gemini model
    const client = new LLMClient({
      provider: 'gemini',
      model: models.gemini.pro, // Using the default Gemini Pro model
    });

    // Send the question to the LLM
    const response = await client.chat(question);

    // Print the response
    console.log('\n✅ Resposta do Gemini:\n');
    console.log(response);

  } catch (error) {
    console.error('\n🔥 Ocorreu um erro ao consultar a LLM:', error);
    process.exit(1);
  }
}

askGemini();

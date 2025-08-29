// Exporta todos os prompts para facilitar o uso
export * from './system-prompts.js';
export * from './business-prompts.js';
export * from './training-prompts.js';

// Função helper para criar prompt personalizado
export function createCustomPrompt(
  baseContext: string,
  businessCategory?: string,
  businessType?: string,
  additionalTraining?: string[]
): string {
  const { buildSystemPrompt } = require('./system-prompts.js');
  const { buildTrainingPrompt } = require('./training-prompts.js');
  const { getBusinessPrompt } = require('./business-prompts.js');
  
  let prompt = buildSystemPrompt(baseContext);
  
  if (businessCategory && businessType) {
    const businessPrompt = getBusinessPrompt(businessCategory, businessType);
    prompt += '\n\n' + businessPrompt;
  }
  
  if (additionalTraining?.length) {
    const trainingPrompt = buildTrainingPrompt(additionalTraining);
    prompt += '\n\n' + trainingPrompt;
  }
  
  return prompt;
}
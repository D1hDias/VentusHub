import { LLMContext } from './types.js';
import { buildSystemPrompt } from './prompts/system-prompts.js';
import { buildTrainingPrompt } from './prompts/training-prompts.js';

export function getContextPrompt(context: LLMContext): string {
  const contextMap = {
    'property-analysis': 'propertyAnalysis',
    'contract-generation': 'contractGeneration',
    'due-diligence': 'dueDiligence',
    'market-analysis': 'propertyAnalysis',
    'document-review': 'dueDiligence',
    'proposal-assistance': 'contractGeneration',
    'general': 'base'
  };

  const systemContext = contextMap[context] || 'base';
  
  // Combina prompt de sistema com conhecimento de treinamento
  const trainingKnowledge = buildTrainingPrompt([
    'marketKnowledge',
    'legalKnowledge',
    'processKnowledge'
  ]);
  
  return buildSystemPrompt(systemContext, trainingKnowledge);
}

export function validateLLMConfig(config: any): boolean {
  return (
    config &&
    typeof config.apiKey === 'string' &&
    typeof config.model === 'string' &&
    ['openai', 'anthropic', 'gemini'].includes(config.provider)
  );
}

export function formatMessages(messages: any[]): boolean {
  return messages.every(msg => 
    msg &&
    typeof msg.content === 'string' &&
    ['user', 'assistant', 'system'].includes(msg.role)
  );
}
import { createLLMConfig } from './models.js';
import { buildSystemPrompt, buildTrainingPrompt } from './prompts/index.js';

// Configuração padrão para desenvolvimento com prompts aprimorados
export const DEFAULT_LLM_CONFIG = createLLMConfig(
  process.env.OPENROUTER_API_KEY || '',
  'deepseek-chat',
  {
    temperature: 0.7,
    maxTokens: 2000, // Aumentado para comportar prompts mais complexos
    systemPrompt: buildSystemPrompt('base', buildTrainingPrompt([
      'marketKnowledge',
      'legalKnowledge',
      'processKnowledge',
      'bestPractices'
    ]))
  }
);

// Função para usar rapidamente
export function getDefaultConfig() {
  return DEFAULT_LLM_CONFIG;
}

// Função para criar configuração com contexto específico
export function getConfigWithContext(context: string) {
  const config = { ...DEFAULT_LLM_CONFIG };
  config.systemPrompt = buildSystemPrompt(context, buildTrainingPrompt([
    'marketKnowledge',
    'legalKnowledge',
    'processKnowledge'
  ]));
  return config;
}
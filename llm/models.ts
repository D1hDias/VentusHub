// Modelos populares disponíveis no OpenRouter
export const OPENROUTER_MODELS = {
  // Gratuitos
  'deepseek-chat': 'deepseek/deepseek-chat-v3-0324:free',
  
  // OpenAI
  'gpt-4o': 'openai/gpt-4o-2024-08-06',
  'gpt-4o-mini': 'openai/gpt-4o-mini-2024-07-18',
  'gpt-4-turbo': 'openai/gpt-4-turbo',
  'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
  
  // Anthropic
  'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
  'claude-3-opus': 'anthropic/claude-3-opus',
  'claude-3-haiku': 'anthropic/claude-3-haiku',
  
  // Google
  'gemini-pro': 'google/gemini-pro',
  'gemini-flash': 'google/gemini-flash-1.5',
  
  // Meta
  'llama-3.1-8b': 'meta-llama/llama-3.1-8b-instruct',
  'llama-3.1-70b': 'meta-llama/llama-3.1-70b-instruct',
  
  // Outros
  'mixtral-8x7b': 'mistralai/mixtral-8x7b-instruct',
  'qwen-72b': 'qwen/qwen-2-72b-instruct',
} as const;

export type ModelName = keyof typeof OPENROUTER_MODELS;

export function getModelId(modelName: ModelName): string {
  return OPENROUTER_MODELS[modelName];
}

// Função helper para criar configuração rapidamente
export function createLLMConfig(
  apiKey: string, 
  model: ModelName | string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
): LLMConfig {
  const modelId = typeof model === 'string' && model in OPENROUTER_MODELS 
    ? getModelId(model as ModelName)
    : model;

  return {
    apiKey,
    model: modelId,
    provider: 'openrouter',
    temperature: options?.temperature || 0.7,
    maxTokens: options?.maxTokens || 1000,
    systemPrompt: options?.systemPrompt,
  };
}

import { LLMConfig } from './types.js';
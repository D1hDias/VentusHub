export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  provider: string;
}

export interface LLMConfig {
  apiKey: string;
  model: string;
  provider: 'openrouter';
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  baseURL?: string;
}

export interface LLMProvider {
  name: string;
  sendMessage(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse>;
}

export type LLMContext = 
  | 'property-analysis'
  | 'contract-generation'
  | 'due-diligence'
  | 'market-analysis'
  | 'document-review'
  | 'proposal-assistance'
  | 'general';
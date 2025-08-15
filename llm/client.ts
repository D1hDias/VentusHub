import { LLMMessage, LLMResponse, LLMConfig, LLMContext } from './types.js';
import { OpenRouterProvider } from './providers/openrouter.js';
import { getContextPrompt } from './utils.js';

export class LLMClient {
  private providers = {
    openrouter: new OpenRouterProvider(),
  };

  async sendMessage(
    messages: LLMMessage[],
    config: LLMConfig,
    context?: LLMContext
  ): Promise<LLMResponse> {
    const provider = this.providers[config.provider];
    if (!provider) {
      throw new Error(`Provider ${config.provider} not supported`);
    }

    // Adiciona prompt de contexto se fornecido
    if (context && config.systemPrompt) {
      const contextPrompt = getContextPrompt(context);
      config.systemPrompt = `${config.systemPrompt}\n\n${contextPrompt}`;
    }

    return provider.sendMessage(messages, config);
  }

  async chat(
    userMessage: string,
    config: LLMConfig,
    context?: LLMContext,
    previousMessages?: LLMMessage[]
  ): Promise<LLMResponse> {
    const messages: LLMMessage[] = [
      ...(previousMessages || []),
      { role: 'user', content: userMessage }
    ];

    return this.sendMessage(messages, config, context);
  }
}

export const llmClient = new LLMClient();
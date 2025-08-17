import { LLMMessage, LLMResponse, LLMConfig, LLMProvider } from '../types.js';

export class AnthropicProvider implements LLMProvider {
  name = 'Anthropic';

  async sendMessage(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-haiku-20240307',
        messages: messages.filter(msg => msg.role !== 'system'),
        system: config.systemPrompt || messages.find(msg => msg.role === 'system')?.content,
        max_tokens: config.maxTokens || 1000,
        temperature: config.temperature || 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      usage: data.usage,
      model: data.model,
      provider: 'anthropic'
    };
  }
}
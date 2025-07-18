import { LLMMessage, LLMResponse, LLMConfig, LLMProvider } from '../types.js';

export class OpenRouterProvider implements LLMProvider {
  name = 'OpenRouter';

  async sendMessage(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    const apiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    if (config.systemPrompt) {
      apiMessages.unshift({
        role: 'system',
        content: config.systemPrompt
      });
    }

    const baseURL = config.baseURL || 'https://openrouter.ai/api/v1';
    
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://ventushub.com',
        'X-Title': 'VentusHub'
      },
      body: JSON.stringify({
        model: config.model,
        messages: apiMessages,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`OpenRouter API error: ${response.statusText}${errorData ? ` - ${errorData.error?.message || JSON.stringify(errorData)}` : ''}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
      provider: 'openrouter'
    };
  }
}
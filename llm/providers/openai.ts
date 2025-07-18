import { LLMMessage, LLMResponse, LLMConfig, LLMProvider } from '../types.js';

export class OpenAIProvider implements LLMProvider {
  name = 'OpenAI';

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages: apiMessages,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
      provider: 'openai'
    };
  }
}
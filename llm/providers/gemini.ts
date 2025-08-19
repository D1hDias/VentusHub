import { LLMMessage, LLMResponse, LLMConfig, LLMProvider } from '../types.js';

export class GeminiProvider implements LLMProvider {
  name = 'Gemini';

  async sendMessage(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxTokens || 1000
      }
    };

    if (config.systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: config.systemPrompt }]
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-pro'}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.candidates[0].content.parts[0].text,
      usage: data.usageMetadata,
      model: config.model || 'gemini-pro',
      provider: 'gemini'
    };
  }
}
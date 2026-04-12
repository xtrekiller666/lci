import OpenAI from 'openai';
import dotenv from 'dotenv';
import { Logger } from './Logger.js';

dotenv.config();

export class LLMClient {
  private openai: OpenAI;
  private model: string;

  constructor(settings?: { apiKey?: string; baseURL?: string; model?: string }) {
    const apiKey = settings?.apiKey || process.env.OPENAI_API_KEY || 'sk-dummy';
    const baseURL = settings?.baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = settings?.model || process.env.LLM_MODEL || 'gpt-4o';

    this.openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });
  }

  public updateSettings(settings: { apiKey: string; baseURL: string; model: string }) {
    this.model = settings.model;
    this.openai = new OpenAI({
      apiKey: settings.apiKey,
      baseURL: settings.baseURL,
    });
    Logger.log('LLMClient', 'Settings updated dynamically.');
  }

  public async complete(prompt: string, systemPrompt: string = "You are a helpful assistant."): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';
      return content;
    } catch (error) {
      Logger.error('LLMClient.complete', error);
      throw error;
    }
  }

  public async completeJson<T>(prompt: string, systemPrompt: string, maxRetries = 3): Promise<T> {
    let lastError: any;
    const jsonInstructions = `${systemPrompt}\n\nIMPORTANT: You must return ONLY raw, valid JSON. Do not include markdown backticks like \`\`\`json. Do not include any conversational text.`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: jsonInstructions },
            { role: 'user', content: prompt }
          ],
          temperature: 0,
        });

        let content = response.choices[0]?.message?.content || '{}';
        
        // Strip out accidental markdown formatting since local models often ignore instructions
        content = content.replace(/^```json/m, '').replace(/^```/m, '').trim();
        
        return JSON.parse(content) as T;
      } catch (error) {
        lastError = error;
        Logger.error('LLMClient.completeJson', `Attempt ${attempt}/${maxRetries} failed: ${error}`);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    Logger.error('LLMClient.completeJson', `All ${maxRetries} attempts exhausted.`);
    throw lastError;
  }

  public async *completeWithToolsStream(
    messages: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; name?: string; tool_call_id?: string; tool_calls?: any[] }[],
    tools: any[]
  ): AsyncGenerator<any, void, undefined> {
    try {
      const payload: any = {
        model: this.model,
        messages: messages,
        temperature: 0.7,
        stream: true,
      };

      if (tools && tools.length > 0) {
        payload.tools = tools;
        payload.tool_choice = 'auto';
      }

      const stream = await this.openai.chat.completions.create(payload);
      for await (const chunk of stream) {
        yield chunk.choices[0];
      }
    } catch (error) {
      Logger.error('LLMClient.completeWithToolsStream', error);
      throw error;
    }
  }
}

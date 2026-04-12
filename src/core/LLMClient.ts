import OpenAI from 'openai';
import dotenv from 'dotenv';
import { Logger } from './Logger.js';

dotenv.config();

export class LLMClient {
  private openai: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || 'sk-dummy';
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.LLM_MODEL || 'gpt-4o';

    this.openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });
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

  public async completeJson<T>(prompt: string, systemPrompt: string): Promise<T> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content) as T;
    } catch (error) {
      Logger.error('LLMClient.completeJson', error);
      throw error;
    }
  }

  public async completeWithTools(
    messages: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; name?: string; tool_call_id?: string; tool_calls?: any[] }[],
    tools: any[]
  ): Promise<any> {
    try {
      const payload: any = {
        model: this.model,
        messages: messages,
        temperature: 0.7,
      };

      if (tools && tools.length > 0) {
        payload.tools = tools;
        payload.tool_choice = 'auto';
      }

      const response = await this.openai.chat.completions.create(payload);
      return response.choices[0]?.message;
    } catch (error) {
      Logger.error('LLMClient.completeWithTools', error);
      throw error;
    }
  }
}

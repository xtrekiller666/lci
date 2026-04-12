import { LLMClient } from './LLMClient.js';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Anchor {
  category: string;
  value: string;
}

export class FrontalLobe {
  private llm: LLMClient;
  private db: Database.Database;

  constructor(llmClient: LLMClient) {
    this.llm = llmClient;
    const dbPath = path.join(__dirname, '../../data/lci_main.db');
    this.db = new Database(dbPath);
  }

  public async detectAnchors(message: string): Promise<void> {
    const prompt = `Analyze the user message for identity anchors: age, gender, belief system, or worldview. 
Respond ONLY with a JSON object in this format: { "anchors": [{ "category": string, "value": string }] }.
User Message: "${message}"`;

    const systemPrompt = "You are the Frontal Discovery system of a layered cognitive infrastructure. Your role is identifying user identity traits.";

    try {
      const result = await this.llm.completeJson<{ anchors: Anchor[] }>(prompt, systemPrompt);
      const anchors = result.anchors || [];
      
      Logger.log('FrontalLobe.detectAnchors', `Anchors found: ${JSON.stringify(anchors)}`);
      
      this.saveAnchorsToDB(anchors);
    } catch (error) {
      Logger.error('FrontalLobe.detectAnchors', error);
      throw error;
    }
  }

  private saveAnchorsToDB(anchors: Anchor[]): void {
    const insert = this.db.prepare('INSERT INTO user_anchors (category, value) VALUES (?, ?)');
    
    for (const anchor of anchors) {
      insert.run(anchor.category, anchor.value);
      Logger.log('FrontalLobe.DB_SAVE', `Saved anchor: ${anchor.category} = ${anchor.value}`);
    }
  }
}

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { Logger } from './Logger.js';
import { LLMClient } from './LLMClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Memory {
  id: number;
  type: string;
  content: string;
  importance: number;
  is_suppressed: boolean;
  associated_chemicals: string; // JSON string
  timestamp: string;
}

export class MemoryManager {
  private db: Database.Database;
  private llm: LLMClient;

  constructor(llmClient: LLMClient) {
    this.llm = llmClient;
    const dbPath = path.join(__dirname, '../../data/lci_main.db');
    // Using better-sqlite3 synchronously, but wrapping in async for usage
    this.db = new Database(dbPath);
  }

  /**
   * Reads current neurotransmitter values.
   */
  private getCurrentTransmitters(): Record<string, number> {
    const rows = this.db.prepare('SELECT name, value FROM transmitters').all() as Array<{ name: string; value: number }>;
    const chemicals: Record<string, number> = {};
    for (const row of rows) {
      chemicals[row.name] = row.value;
    }
    return chemicals;
  }

  /**
   * Saves a new memory with current chemical imprint.
   */
  public async saveMemory(type: 'episodic' | 'semantic', content: string, importance: number): Promise<void> {
    try {
      const chemicals = this.getCurrentTransmitters();
      const chemicalsJson = JSON.stringify(chemicals);

      const stmt = this.db.prepare(
        'INSERT INTO memories (type, content, importance, associated_chemicals) VALUES (?, ?, ?, ?)'
      );
      
      const result = stmt.run(type, content, importance, chemicalsJson);
      
      Logger.log('MemoryManager.saveMemory', `Memory saved. [Type: ${type}, Imp: ${importance}, Imprint: ${chemicalsJson}]`);
    } catch (error) {
      Logger.error('MemoryManager.saveMemory', error);
      throw error;
    }
  }

  /**
   * Consolidates a session into memories and writes to file.
   */
  public async consolidateSession(history: string): Promise<void> {
    const prompt = `Analyze the following session history and extract two types of information.
    1. Episodic: Chronological summary of the important events from this session.
    2. Semantic: New, permanent facts learned about the user, or life lessons deduced.
    Respond ONLY with a JSON object in this format: 
    {
      "episodic": "Detailed episodic summary...",
      "semantic": "Detailed semantic insights...",
      "episodicImportance": <int 1-10>,
      "semanticImportance": <int 1-10>
    }
    History: """${history}"""`;

    const systemPrompt = "You are the Memory Consolidation core of the Temporal Lobe.";

    try {
      const summary = await this.llm.completeJson<{
        episodic: string;
        semantic: string;
        episodicImportance: number;
        semanticImportance: number;
      }>(prompt, systemPrompt);

      if (summary.episodic) {
        await this.saveMemory('episodic', summary.episodic, summary.episodicImportance || 5);
        await this.writeToFile('episodic.md', summary.episodic);
      }

      if (summary.semantic) {
        await this.saveMemory('semantic', summary.semantic, summary.semanticImportance || 5);
        await this.writeToFile('semantic.md', summary.semantic);
      }

      Logger.log('MemoryManager.consolidateSession', 'Session consolidation complete.');
    } catch (error) {
      Logger.error('MemoryManager.consolidateSession', error);
      throw error;
    }
  }

  private async writeToFile(filename: string, content: string): Promise<void> {
    const dir = path.join(__dirname, '../../brain/temporal');
    await fs.mkdir(dir, { recursive: true });
    
    const filePath = path.join(dir, filename);
    const timestamp = new Date().toISOString();
    const entry = `\n### [${timestamp}]\n${content}\n---\n`;
    
    await fs.appendFile(filePath, entry);
  }
}

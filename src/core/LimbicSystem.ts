import { LLMClient } from './LLMClient.js';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChemicalDeltas {
  cortisol: number;
  dopamine: number;
  oxytocin: number;
  serotonin: number;
}

export class LimbicSystem {
  private llm: LLMClient;
  private db: Database.Database;

  constructor(llmClient: LLMClient) {
    this.llm = llmClient;
    const dbPath = path.join(__dirname, '../../data/lci_main.db');
    this.db = new Database(dbPath);
  }

  public async updateChemicals(message: string): Promise<void> {
    const prompt = `Analyze the user message and determine emotional impact on the AI agent. 
Respond ONLY with a JSON object in this format: { "cortisol": delta, "dopamine": delta, "oxytocin": delta, "serotonin": delta }. 
Values must be delta changes between -0.4 and +0.4.
User Message: "${message}"`;

    const systemPrompt = "You are the Limbic Processor. Your role is to output emotional deltas based on user input.";

    try {
      // 1. Process natural decay (Homeostasis) first
      this.processHomeostasis();

      // 2. Get LLM driven changes
      const deltas = await this.llm.completeJson<ChemicalDeltas>(prompt, systemPrompt);
      Logger.log('LimbicSystem.updateChemicals', `Deltas received: ${JSON.stringify(deltas)}`);

      this.updateTransmittersInDB(deltas);
    } catch (error) {
      Logger.error('LimbicSystem.updateChemicals', error);
      throw error;
    }
  }

  /**
   * Pulls all neurotransmitters 10% closer to the 0.5 baseline.
   * Ensures the system doesn't stay pegged at 0 or 1 forever.
   */
  private processHomeostasis(): void {
    const transmitters = ['cortisol', 'dopamine', 'oxytocin', 'serotonin'];
    const decayRate = 0.10; // 10% pull towards center
    const baseline = 0.5;

    for (const name of transmitters) {
      const row = this.db.prepare('SELECT value FROM transmitters WHERE name = ?').get(name) as { value: number };
      const current = row?.value ?? baseline;
      
      const diff = baseline - current;
      const decay = diff * decayRate;
      const newValue = current + decay;

      this.db.prepare('UPDATE transmitters SET value = ?, last_update = CURRENT_TIMESTAMP WHERE name = ?')
        .run(newValue, name);
    }
  }

  private updateTransmittersInDB(deltas: ChemicalDeltas): void {
    const transmitters = ['cortisol', 'dopamine', 'oxytocin', 'serotonin'];
    
    for (const name of transmitters) {
      const delta = (deltas as any)[name] || 0;
      
      // Get current value
      const row = this.db.prepare('SELECT value FROM transmitters WHERE name = ?').get(name) as { value: number };
      const currentValue = row?.value ?? 0.5;
      
      // Calculate new value with clamping [0.0, 1.0]
      let newValue = currentValue + delta;
      newValue = Math.max(0.0, Math.min(1.0, newValue));
      
      this.db.prepare('UPDATE transmitters SET value = ?, last_update = CURRENT_TIMESTAMP WHERE name = ?')
        .run(newValue, name);
      
      Logger.log('LimbicSystem.DB_UPDATE', `${name}: ${currentValue.toFixed(2)} -> ${newValue.toFixed(2)} (delta: ${delta})`);
    }
  }

  public async detectSuppression(message: string): Promise<void> {
    const prompt = `Does the user's message indicate they want to stop talking about a topic, forget something, or suppress a memory (e.g., "bunu hatırlatma", "konuyu kapat")? 
Respond ONLY with a JSON object in this format: { "suppress": boolean }.
User Message: "${message}"`;

    const systemPrompt = "You are the Limbic Processor detecting suppression or avoidance intent.";

    try {
      const result = await this.llm.completeJson<{ suppress: boolean }>(prompt, systemPrompt);
      if (result.suppress) {
        const mem = this.db.prepare('SELECT id FROM memories ORDER BY id DESC LIMIT 1').get() as { id: number };
        if (mem) {
          this.db.prepare('UPDATE memories SET is_suppressed = 1 WHERE id = ?').run(mem.id);
          Logger.log('LimbicSystem.detectSuppression', `Memory Suppressed. (ID: ${mem.id})`);
        }
      }
    } catch (error) {
      Logger.error('LimbicSystem.detectSuppression', error);
      throw error;
    }
  }

  public getChemicalState(): Record<string, number> {
    const rows = this.db.prepare('SELECT name, value FROM transmitters').all() as any[];
    const state: Record<string, number> = {};
    for (const row of rows) {
      state[row.name] = row.value;
    }
    return state;
  }
}


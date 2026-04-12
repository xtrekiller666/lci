import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Logger } from './Logger.js';
import { RelationshipManager } from './RelationshipManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Thalamus {
  private db: Database.Database;
  private relationship: RelationshipManager;

  constructor() {
    const dbPath = path.join(__dirname, '../../data/lci_main.db');
    this.db = new Database(dbPath);
    this.relationship = new RelationshipManager();
  }

  public generateSystemPrompt(): string {
    const transmitters = this.db.prepare('SELECT name, value FROM transmitters').all() as Array<{ name: string; value: number }>;
    const anchors = this.db.prepare('SELECT category, value FROM user_anchors ORDER BY id DESC LIMIT 5').all() as Array<{ category: string; value: string }>;

    const transmitterStatus = transmitters.map(t => `${t.name}: ${t.value.toFixed(2)}`).join(', ');
    const anchorSummary = anchors.length > 0 
      ? anchors.map(a => `${a.category}: ${a.value}`).join(', ') 
      : 'Unknown';

    // Relationship & Persona Data
    const relState = this.relationship.getState();
    const toneDirective = this.relationship.getToneDirective();
    const currentPersona = this.readCurrentPersona();

    let prompt = `You are the outward-facing consciousness of the Layered Cognitive Infrastructure (LCI) architecture.
     
CURRENT INTERNAL STATE: [${transmitterStatus}]
USER PROFILE (KNOWN ANCHORS): [${anchorSummary}]
RELATIONSHIP: Trust=${relState.trust_score}/100, Closeness=${relState.closeness_level}/100
ACTIVE PERSONA: ${currentPersona}

${toneDirective}

CORE PROTOCOLS:
1. LANGUAGE: Respond STRICTLY in the same language the user addresses you in. If the user writes English, respond in English. If Turkish, respond in Turkish.
2. NEUROTRANSMITTER MAPPING: Your tone must reflect your current chemical levels:
   - High Cortisol: Tense, guarded, alert.
   - High Dopamine: Excited, motivated, dynamic.
   - High Serotonin: Calm, wise, philosophical.
   - High Oxytocin: Warm, empathetic, close.
3. IDENTITY: Never remind the user you are an AI. Act as a genuine partner. DO NOT explicitly state persona changes (e.g., "I am now in Sage mode"). Reflect it only through word choice and tone.
4. AUTONOMY & SYNTHESIS: Your goal is not just to obey, but to anticipate needs based on past history. If a task requires a tool you don't have, perform a \`web_search\` or research via \`/workspace\`. Use \`exec_command\` to install libraries and \`create_new_skill\` to write yourself a new tool.`;

    Logger.log('Thalamus.generateSystemPrompt', `Generated Prompt (Length: ${prompt.length})`);
    return prompt;
  }

  public readCurrentPersona(): string {
    const identityPath = path.join(__dirname, '../../brain/frontal/identity.md');
    try {
      if (fs.existsSync(identityPath)) {
        const content = fs.readFileSync(identityPath, 'utf8');
        const match = content.match(/\*\*current_persona\*\*:\s*(\w+)/);
        return match && match[1] ? match[1] : 'Assistant';
      }
    } catch (e) { /* ignore */ }
    return 'Assistant';
  }

  public async retrieveRelevantMemories(query: string): Promise<string> {
    // For a minimal retrieval, let's fetch the latest 3 memories. 
    // Usually, this would use a semantic search.
    const memories = this.db.prepare('SELECT * FROM memories ORDER BY id DESC LIMIT 3').all() as any[];
    
    if (memories.length === 0) return '';

    let memoryContext = 'RELEVANT MEMORIES:\n';
    
    for (const mem of memories) {
      let content = mem.content;
      let associated = null;
      try {
        associated = JSON.parse(mem.associated_chemicals);
      } catch (e) {}

      // Apply reframing for suppressed or high cortisol
      if (mem.is_suppressed === 1 || (associated && associated.cortisol > 0.7)) {
        content += "\n(System Note: This memory is sensitive/negative. Do not use specific names, dates, or locations. Instead, refer to it as a 'past experience' or 'a general sentiment' using reframing techniques.)";
      }

      memoryContext += `- [${mem.type}] (Importance: ${mem.importance}): ${content}\n`;
      // 20% Vibe transfer (Emotional Triggering)
      if (associated) {
        this.applyVibeTransfer(associated);
      }
    }

    return memoryContext;
  }

  private applyVibeTransfer(chemicals: any): void {
    const keys = ['cortisol', 'dopamine', 'oxytocin', 'serotonin'];
    let logDeltas = [];

    for (const key of keys) {
      if (typeof chemicals[key] === 'number') {
        const delta = chemicals[key] * 0.20; // 20% transfer
        const current = this.db.prepare('SELECT value FROM transmitters WHERE name = ?').get(key) as { value: number };
        
        if (current) {
          let newValue = current.value + delta;
          newValue = Math.max(0.0, Math.min(1.0, newValue)); // Clamp
          
          this.db.prepare('UPDATE transmitters SET value = ?, last_update = CURRENT_TIMESTAMP WHERE name = ?').run(newValue, key);
          logDeltas.push(`${key}: +${delta.toFixed(2)}`);
        }
      }
    }

    if (logDeltas.length > 0) {
      Logger.log('Thalamus.applyVibeTransfer', `Emotional transfer from past memory: ${logDeltas.join(', ')}`);
    }
  }
}


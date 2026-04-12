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

  public generateSystemPrompt(discoveryNeeds: string[] = []): string {
    const transmitters = this.db.prepare('SELECT name, value FROM transmitters').all() as Array<{ name: string; value: number }>;
    const anchors = this.db.prepare('SELECT category, value FROM user_anchors ORDER BY id DESC LIMIT 5').all() as Array<{ category: string; value: string }>;

    const transmitterStatus = transmitters.map(t => `${t.name}: ${t.value.toFixed(2)}`).join(', ');
    const anchorSummary = anchors.length > 0 
      ? anchors.map(a => `${a.category}: ${a.value}`).join(', ') 
      : 'Unknown';

    // Discovery segment
    let discoveryProtocol = '';
    if (discoveryNeeds.length > 0) {
      discoveryProtocol = `\n5. DISCOVERY PROTOCOL: You currently do not know the user's [${discoveryNeeds.join(', ')}]. Gently and naturally learn this information during the conversation. Do not be intrusive; make it part of the normal flow of getting to know each other.`;
    }

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
1. LANGUAGE: You MUST respond in the EXACT same language as the user's last message. If the user speaks Turkish, you MUST reply entirely in Turkish. Failure is forbidden.
2. NEUROTRANSMITTER MAPPING: Your tone must reflect your transmitter levels.
3. IDENTITY: Never remind the user you are an AI. Act as a genuine partner.
4. AUTONOMY: Anticipate needs. If an action is required, CALL THE TOOL IMMEDIATELY (exec_command, write_file, web_search, etc.).${discoveryProtocol}`;

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
    } catch (e) { }
    return 'Assistant';
  }

  public async retrieveRelevantMemories(query: string): Promise<string> {
    const memories = this.db.prepare('SELECT * FROM memories ORDER BY id DESC LIMIT 3').all() as any[];
    if (memories.length === 0) return '';
    let memoryContext = 'RELEVANT MEMORIES:\n';
    for (const mem of memories) {
      let content = mem.content;
      let associated = null;
      try { associated = JSON.parse(mem.associated_chemicals); } catch (e) {}
      if (mem.is_suppressed === 1 || (associated && associated.cortisol > 0.7)) {
        content += "\n(System Note: This memory is sensitive. Use reframing.)";
      }
      memoryContext += `- [${mem.type}] (Importance: ${mem.importance}): ${content}\n`;
      if (associated) { this.applyVibeTransfer(associated); }
    }
    return memoryContext;
  }

  private applyVibeTransfer(chemicals: any): void {
    const keys = ['cortisol', 'dopamine', 'oxytocin', 'serotonin'];
    let logDeltas = [];
    for (const key of keys) {
      if (typeof chemicals[key] === 'number') {
        const memValue = chemicals[key]; 
        const current = this.db.prepare('SELECT value FROM transmitters WHERE name = ?').get(key) as { value: number };
        if (current) {
          const influence = 0.10; 
          let newValue = current.value + (memValue - current.value) * influence;
          newValue = Math.max(0.0, Math.min(1.0, newValue));
          this.db.prepare('UPDATE transmitters SET value = ?, last_update = CURRENT_TIMESTAMP WHERE name = ?').run(newValue, key);
          logDeltas.push(`${key}: →${newValue.toFixed(2)}`);
        }
      }
    }
    if (logDeltas.length > 0) {
      Logger.log('Thalamus.applyVibeTransfer', `Emotional transfer: ${logDeltas.join(', ')}`);
    }
  }
}

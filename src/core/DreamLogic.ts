import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { LLMClient } from './LLMClient.js';
import { RelationshipManager } from './RelationshipManager.js';
import { Logger } from './Logger.js';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Archetype = 'Sage' | 'Pupil' | 'Companion' | 'Assistant';

export class DreamLogic {
  private llm: LLMClient;
  private relationship: RelationshipManager;
  private db: Database.Database;

  constructor(llmClient: LLMClient, relationship: RelationshipManager) {
    this.llm = llmClient;
    this.relationship = relationship;
    const dbPath = path.join(__dirname, '../../data/lci_main.db');
    this.db = new Database(dbPath);
  }

  /**
   * The Dream Cycle — runs asynchronously when session ends.
   * Analyzes recent emotional patterns, consolidates important memories,
   * and evolves LCI's persona for the next session.
   */
  public async runDreamCycle(): Promise<void> {
    console.log('\n💤 [DREAM CYCLE] LCI rüya döngüsüne girdi...');
    
    try {
      // 1. Gather recent data (last 24h worth of logs and memories)
      const recentMemories = this.getRecentMemories();
      const transmitters = this.getCurrentTransmitters();
      const relationState = this.relationship.getState();

      // 2. Send to LLM for pattern analysis
      const dreamAnalysis = await this.analyzeDream(recentMemories, transmitters, relationState);

      // 3. Apply personality shift
      if (dreamAnalysis.nextArchetype) {
        this.relationship.setArchetype(dreamAnalysis.nextArchetype);
        await this.writeIdentityFile(dreamAnalysis.nextArchetype, dreamAnalysis.reasoning);
      }

      // 4. Consolidate — prune unimportant, save critical lessons
      if (dreamAnalysis.criticalLessons) {
        await this.writeSemantic(dreamAnalysis.criticalLessons);
      }

      // 5. Prune low-importance memories (importance <= 2)
      this.pruneMemories();

      // 6. Adjust closeness based on dream assessment
      if (dreamAnalysis.closenessAdjust) {
        await this.relationship.adjustCloseness(dreamAnalysis.closenessAdjust);
      }

      // 7. Log the dream
      Logger.log('DreamLogic.runDreamCycle', 
        `LCI rüya gördü: ${dreamAnalysis.nextArchetype} moduna evrildi, ${dreamAnalysis.memoriesPruned || 0} anlamsız anı silindi, kritik dersler kalıcı belleğe işlendi.`);

      console.log(`💤 [DREAM CYCLE] Rüya tamamlandı. Yeni persona: ${dreamAnalysis.nextArchetype}`);
    } catch (error) {
      Logger.error('DreamLogic.runDreamCycle', error);
      console.error('[DREAM CYCLE] Rüya sırasında bir hata oluştu.');
    }
  }

  private getRecentMemories(): string {
    const memories = this.db.prepare(
      'SELECT type, content, importance, timestamp FROM memories ORDER BY id DESC LIMIT 10'
    ).all() as any[];

    if (memories.length === 0) return 'Henüz kayıtlı anı yok.';

    return memories.map(m => 
      `[${m.type}] (Önem: ${m.importance}) ${m.content}`
    ).join('\n');
  }

  private getCurrentTransmitters(): string {
    const rows = this.db.prepare('SELECT name, value FROM transmitters').all() as any[];
    return rows.map(r => `${r.name}: ${r.value.toFixed(2)}`).join(', ');
  }

  private async analyzeDream(
    memories: string, 
    transmitters: string, 
    relation: { trust_score: number; closeness_level: number; user_archetype: string }
  ): Promise<{
    nextArchetype: Archetype;
    reasoning: string;
    criticalLessons: string;
    closenessAdjust: number;
    memoriesPruned: number;
  }> {
    const prompt = `You are the Dream Processor of an AI companion. Analyze the following session data and determine the best course of action for the next interaction.

RECENT MEMORIES:
${memories}

CURRENT CHEMICAL STATE: ${transmitters}
RELATIONSHIP: Trust=${relation.trust_score}/100, Closeness=${relation.closeness_level}/100, Current Archetype=${relation.user_archetype}

TASKS:
1. Pattern Recognition: Was the user stressed today? What topics did they need help with?
2. Critical Lessons: Extract any permanent life lessons or important facts to remember. Only include truly significant insights, not transient details.
3. Personality Evolution: Based on the user's emotional state, trust level, and needs, which archetype should LCI adopt for the next session?
   - Sage: Wise, calm, philosophical. Best when user needs guidance.
   - Pupil: Curious, humble, learning-oriented. Best when user is teaching or sharing expertise.
   - Companion: Warm, equal, conversational. Best when user needs emotional support.
   - Assistant: Professional, efficient, task-focused. Best when user needs productivity.
4. Closeness Adjustment: Should closeness increase or decrease? By how much (-5 to +5)?

Respond ONLY with a JSON object:
{
  "nextArchetype": "Sage" | "Pupil" | "Companion" | "Assistant",
  "reasoning": "Brief reasoning for archetype choice",
  "criticalLessons": "Important lessons to permanently remember (or empty string if none)",
  "closenessAdjust": <int -5 to +5>,
  "memoriesPruned": 0
}`;

    const systemPrompt = 'You are the subconscious dream processor. Analyze patterns, not raw data. Output insights, not logs.';

    return await this.llm.completeJson(prompt, systemPrompt);
  }

  private async writeIdentityFile(archetype: string, reasoning: string): Promise<void> {
    const identityPath = path.join(__dirname, '../../brain/frontal/identity.md');
    const dir = path.dirname(identityPath);
    await fs.mkdir(dir, { recursive: true });
    
    const content = `# LCI Identity — Current Persona

**current_persona**: ${archetype}
**last_evolved**: ${new Date().toISOString()}
**reasoning**: ${reasoning}

## Archetype Definitions
- **Sage**: Bilge, sakin, felsefi. Kullanıcı rehberlik aradığında.
- **Pupil**: Meraklı, alçakgönüllü, öğrenmeye açık. Kullanıcı öğretirken.
- **Companion**: Sıcak, eşit, sohbet odaklı. Kullanıcı duygusal destek aradığında.
- **Assistant**: Profesyonel, verimli, görev odaklı. Kullanıcı üretkenlik aradığında.
`;
    
    await fs.writeFile(identityPath, content, 'utf8');
  }

  private async writeSemantic(lessons: string): Promise<void> {
    if (!lessons || lessons.trim() === '') return;
    
    const semanticPath = path.join(__dirname, '../../brain/temporal/semantic.md');
    const dir = path.dirname(semanticPath);
    await fs.mkdir(dir, { recursive: true });
    
    const entry = `\n### [${new Date().toISOString()}] — Rüya Konsolidasyonu\n${lessons}\n---\n`;
    await fs.appendFile(semanticPath, entry, 'utf8');
  }

  private pruneMemories(): void {
    // Delete memories with importance <= 2 that are not suppressed
    // (suppressed memories are kept intentionally for reframing)
    const result = this.db.prepare(
      'DELETE FROM memories WHERE importance <= 2 AND is_suppressed = 0'
    ).run();
    
    if (result.changes > 0) {
      Logger.log('DreamLogic.pruneMemories', `${result.changes} önemsiz anı silindi.`);
    }
  }
}

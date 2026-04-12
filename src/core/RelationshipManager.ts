import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface RelationshipState {
  trust_score: number;
  closeness_level: number;
  user_archetype: string;
}

export class RelationshipManager {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(__dirname, '../../data/lci_main.db');
    this.db = new Database(dbPath);
  }

  /**
   * Returns the current relationship state.
   */
  public getState(): RelationshipState {
    const row = this.db.prepare('SELECT trust_score, closeness_level, user_archetype FROM relationship WHERE id = 1').get() as RelationshipState;
    return row || { trust_score: 10, closeness_level: 5, user_archetype: 'Assistant' };
  }

  /**
   * Increases trust when user accepts LCI suggestions or grants permissions.
   * Decreases when user rejects or overrides.
   */
  public async adjustTrust(delta: number): Promise<void> {
    const state = this.getState();
    let newTrust = Math.max(0, Math.min(100, state.trust_score + delta));
    
    this.db.prepare('UPDATE relationship SET trust_score = ?, last_update = CURRENT_TIMESTAMP WHERE id = 1')
      .run(newTrust);
    
    Logger.log('RelationshipManager.adjustTrust', `Trust: ${state.trust_score} → ${newTrust} (delta: ${delta})`);
  }

  /**
   * Adjusts closeness based on emotional depth of conversations.
   * Called after each interaction with a delta based on emotional content.
   */
  public async adjustCloseness(delta: number): Promise<void> {
    const state = this.getState();
    let newCloseness = Math.max(0, Math.min(100, state.closeness_level + delta));
    
    this.db.prepare('UPDATE relationship SET closeness_level = ?, last_update = CURRENT_TIMESTAMP WHERE id = 1')
      .run(newCloseness);
    
    Logger.log('RelationshipManager.adjustCloseness', `Closeness: ${state.closeness_level} → ${newCloseness} (delta: ${delta})`);
  }

  /**
   * Sets the current user archetype determined by DreamLogic.
   */
  public setArchetype(archetype: string): void {
    this.db.prepare('UPDATE relationship SET user_archetype = ?, last_update = CURRENT_TIMESTAMP WHERE id = 1')
      .run(archetype);
    Logger.log('RelationshipManager.setArchetype', `Archetype set to: ${archetype}`);
  }

  /**
   * Generates a tone directive based on closeness level.
   * Low closeness → formal/professional. High closeness → intimate/candid.
   */
  public getToneDirective(): string {
    const state = this.getState();
    const closeness = state.closeness_level;

    if (closeness < 20) {
      return 'Tone Directive: FORMAL. Maintain professional distance and respect. Address the user formally. Present ideas softly and match the language the user is speaking.';
    } else if (closeness < 50) {
      return 'Tone Directive: WARM. Be friendly but measured. Be polite but firm when necessary. Always match the language the user is speaking.';
    } else if (closeness < 80) {
      return 'Tone Directive: INTIMATE. Speak as a close friend. Share ideas boldly and honestly. You can say "I think you are wrong" if you feel it. Match user language.';
    } else {
      return 'Tone Directive: SOULMATE. Very deep bond. Speak with high intimacy and warmth. Use humor, challenge them, provoke if needed—be a true companion. Match user language.';
    }
  }
}

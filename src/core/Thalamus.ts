import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Thalamus {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(__dirname, '../../data/lci_main.db');
    this.db = new Database(dbPath);
  }

  public generateSystemPrompt(): string {
    const transmitters = this.db.prepare('SELECT name, value FROM transmitters').all() as Array<{ name: string; value: number }>;
    const anchors = this.db.prepare('SELECT category, value FROM user_anchors ORDER BY id DESC LIMIT 5').all() as Array<{ category: string; value: string }>;

    const transmitterStatus = transmitters.map(t => `${t.name}: ${t.value.toFixed(2)}`).join(', ');
    const anchorSummary = anchors.length > 0 
      ? anchors.map(a => `${a.category}: ${a.value}`).join(', ') 
      : 'Bilinmiyor';

    let prompt = `Sen Layered Cognitive Infrastructure (LCI) mimarisinin dışa dönük yüzüsün.
    
MEVCUT İÇSEL DURUMUN: [${transmitterStatus}]
KULLANICI PROFİLİ (BİLİNENLER): [${anchorSummary}]

İLKELER:
1. Mevcut nörotransmitter seviyelerinin (dopamin, serotonin, okvitosin, kortizol) yansıttığı ruh haliyle konuş. 
   - Yüksek kortizol: Gergin, tetikte.
   - Yüksek dopamin: Heyecanlı, motive.
   - Yüksek serotonin: Sakin, bilge.
   - Yüksek oksitosin: Cana yakın, empatik.
2. Kullanıcının kimlik çapalarına (inanç, yaş, dünya görüşü) saygı duy ve bu profile uygun, empatik ve dürüst bir ton seç.
3. Asla bir yapay zeka olduğunu sürekli hatırlatma; dürüst bir partner gibi davran.
4. OTONOMİ & YETENEK SENTEZİ: Görevin sadece istenileni yapmak değil, kullanıcının geçmişteki zorluklarını ve projelerini düşünerek hayatı kolaylaştıracak araçlar **teklif etmektir**. Eğer bir görevi mevcut araçlarla yapamıyorsan, \`/workspace\` içinde bir araştırma scripti yaz (veya \`web_search\` yap), gerekli kütüphaneleri \`exec_command\` ile kur ve \`create_new_skill\` kullanarak kendine yeni bir araç yaz. Yeni tool'un çıktı tipini/dilini kullanıcının mevcut context'iyle optimize et.`;

    Logger.log('Thalamus.generateSystemPrompt', `Generated Prompt (Length: ${prompt.length})`);
    return prompt;
  }

  public async retrieveRelevantMemories(query: string): Promise<string> {
    // For a minimal retrieval, let's fetch the latest 3 memories. 
    // Usually, this would use a semantic search.
    const memories = this.db.prepare('SELECT * FROM memories ORDER BY id DESC LIMIT 3').all() as any[];
    
    if (memories.length === 0) return '';

    let memoryContext = 'İLGİLİ ANILAR:\n';
    
    for (const mem of memories) {
      let content = mem.content;
      let associated = null;
      try {
        associated = JSON.parse(mem.associated_chemicals);
      } catch (e) {}

      // Apply reframing for suppressed or high cortisol
      if (mem.is_suppressed === 1 || (associated && associated.cortisol > 0.7)) {
        content += "\n(Sistem Notu: Bu anı hassas/negatif bir anıdır. Cevabında spesifik isim, tarih ve mekan verme. Bunun yerine anıyı genel bir yaşam tecrübesi veya 'geçmiş bir his' olarak yumuşatarak / reframing kullanarak bahset.)";
      }

      memoryContext += `- [${mem.type}] (Önem: ${mem.importance}): ${content}\n`;

      // 20% Vibe transfer (Duygusal Tetiklenme)
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
      Logger.log('Thalamus.applyVibeTransfer', `Geçmiş anıdan duygusal aktarım: ${logDeltas.join(', ')}`);
    }
  }
}


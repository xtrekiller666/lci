import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MirrorDB {
  private db: Database.Database;
  private readonly dbPath: string;
  private readonly exportPath: string;

  constructor() {
    this.dbPath = path.join(__dirname, '../../data/lci_main.db');
    this.exportPath = path.join(__dirname, '../../brain/limbic/neurotransmitters.md');
    this.db = new Database(this.dbPath);
  }

  public exportTransmitters(): void {
    const rows = this.db.prepare('SELECT name, value, last_update FROM transmitters').all() as Array<{
      name: string;
      value: number;
      last_update: string;
    }>;

    let markdown = '# Neurotransmitters Registry\n\n';
    markdown += '| Name | Value | Last Update |\n';
    markdown += '| :--- | :--- | :--- |\n';

    for (const row of rows) {
      markdown += `| ${row.name} | ${row.value.toFixed(2)} | ${row.last_update} |\n`;
    }

    markdown += `\n*Last mirrored at: ${new Date().toISOString()}*\n`;

    fs.writeFileSync(this.exportPath, markdown);
    console.log(`Transmitters exported to ${this.exportPath}`);
  }

  public close(): void {
    this.db.close();
  }
}

// Optional: Execute if run directly
if (process.argv[1] === __filename) {
  const mirror = new MirrorDB();
  mirror.exportTransmitters();
  mirror.close();
}

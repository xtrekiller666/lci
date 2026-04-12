import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/lci_main.db');
const db = new Database(dbPath);

console.log('Updating database schema...');

// Create user_anchors table
db.exec(`
  CREATE TABLE IF NOT EXISTS user_anchors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    value TEXT NOT NULL,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create memories table
db.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    importance INTEGER NOT NULL,
    is_suppressed BOOLEAN DEFAULT 0,
    associated_chemicals TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('Tables user_anchors and memories created or already exist.');

// Create relationship table
db.exec(`
  CREATE TABLE IF NOT EXISTS relationship (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    trust_score INTEGER DEFAULT 10,
    closeness_level INTEGER DEFAULT 5,
    user_archetype TEXT DEFAULT 'Assistant',
    last_update DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Ensure single relationship row exists
db.prepare('INSERT OR IGNORE INTO relationship (id) VALUES (1)').run();

console.log('Relationship table created or already exists.');
db.close();

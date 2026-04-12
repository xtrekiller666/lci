import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/lci_main.db');
const db = new Database(dbPath);

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS transmitters (
    name TEXT PRIMARY KEY,
    value REAL,
    last_update DATETIME DEFAULT CURRENT_TIMESTAMP
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

// Initial values
const initialTransmitters = [
  { name: 'dopamine', value: 0.5 },
  { name: 'serotonin', value: 0.5 },
  { name: 'oxytocin', value: 0.5 },
  { name: 'cortisol', value: 0.1 }
];

const insert = db.prepare('INSERT OR IGNORE INTO transmitters (name, value) VALUES (?, ?)');

const transaction = db.transaction((data) => {
  for (const item of data) {
    insert.run(item.name, item.value);
  }
});

transaction(initialTransmitters);

console.log('Database initialized with initial transmitters.');
db.close();

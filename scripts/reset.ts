/**
 * LCI Factory Reset Script
 * 
 * Deletes the runtime database and restores brain/ to its default
 * template state, effectively giving LCI a "fresh birth".
 * 
 * Usage: npx tsx scripts/reset.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

function deleteIfExists(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`  [DELETED] ${path.relative(projectRoot, filePath)}`);
  }
}

function copyDirRecursive(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;
  
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  [RESTORED] ${path.relative(projectRoot, destPath)}`);
    }
  }
}

function deleteDirContents(dirPath: string): void {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
  }
}

// ──────────────────────────────────────────
// FACTORY RESET
// ──────────────────────────────────────────

console.log('\n🧠 LCI FACTORY RESET');
console.log('═══════════════════════════════════════\n');

// 1. Delete database
console.log('[Phase 1] Clearing database...');
deleteIfExists(path.join(projectRoot, 'data', 'lci_main.db'));
deleteIfExists(path.join(projectRoot, 'data', 'lci_main.db-journal'));

// 2. Clear brain directory contents (keep the directories themselves)
console.log('\n[Phase 2] Clearing brain state...');
const brainSubdirs = ['brainstem', 'frontal', 'limbic', 'temporal', 'cerebellum'];
for (const sub of brainSubdirs) {
  deleteDirContents(path.join(projectRoot, 'brain', sub));
}
// Delete brain/README.md too
deleteIfExists(path.join(projectRoot, 'brain', 'README.md'));

// 3. Clear workspace
console.log('\n[Phase 3] Clearing workspace...');
deleteDirContents(path.join(projectRoot, 'workspace'));

// 4. Restore from templates
console.log('\n[Phase 4] Restoring from templates...');
copyDirRecursive(
  path.join(projectRoot, 'templates', 'brain'),
  path.join(projectRoot, 'brain')
);
// Ensure subdirectories exist
fs.mkdirSync(path.join(projectRoot, 'brain', 'cerebellum', 'skills'), { recursive: true });
fs.mkdirSync(path.join(projectRoot, 'brain', 'temporal'), { recursive: true });
fs.mkdirSync(path.join(projectRoot, 'workspace'), { recursive: true });
fs.mkdirSync(path.join(projectRoot, 'data'), { recursive: true });

// 5. Re-initialize database
console.log('\n[Phase 5] Re-initializing database...');
console.log('  Run: npx tsx src/initDb.ts\n');

console.log('═══════════════════════════════════════');
console.log('✅ Factory reset complete. LCI is reborn.');
console.log('   Run "npx tsx src/initDb.ts" to create a fresh database.');
console.log('   Then "npx tsx src/index.ts" to start.\n');

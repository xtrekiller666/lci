import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Logger {
  private static logPath = path.join(__dirname, '../../brain/brainstem/logging.md');

  public static log(step: string, details: string): void {
    const timestamp = new Date().toISOString();
    const entry = `\n### [${timestamp}] - ${step}\n${details}\n---\n`;
    
    // Ensure directory exists
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.appendFileSync(this.logPath, entry);
    console.log(`[LOG] ${step}: ${details.substring(0, 50)}...`);
  }

  public static error(step: string, error: any): void {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.stack || error.message : JSON.stringify(error);
    const entry = `\n### [${timestamp}] - ERROR during ${step}\n\`\`\`\n${errorMessage}\n\`\`\`\n---\n`;
    
    fs.appendFileSync(this.logPath, entry);
    console.error(`[ERROR] ${step}: ${error}`);
  }
}

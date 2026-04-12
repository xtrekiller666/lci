import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';
import { Logger } from './Logger.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Cerebellum {
  public readonly workspacePath: string;
  private consecutiveFailures = 0;
  private rl: readline.Interface;

  constructor(rl: readline.Interface) {
    this.workspacePath = path.join(__dirname, '../../workspace');
    this.rl = rl;
  }

  public getAvailableTools(): any[] {
    const defaultTools = [
      {
        type: 'function',
        function: {
          name: 'read_file',
          description: 'Reads the content of a file.',
          parameters: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'Relative path to file' }
            },
            required: ['filePath']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'write_file',
          description: 'Writes content to a file.',
          parameters: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'Relative path to file' },
              content: { type: 'string' }
            },
            required: ['filePath', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'exec_command',
          description: 'Executes a shell command. Target standard Linux commands. By default, the current working directory will be /workspace.',
          parameters: {
            type: 'object',
            properties: {
              command: { type: 'string' },
              cwd: { type: 'string', description: 'Directory to run the command in. Defaults to /workspace.' }
            },
            required: ['command']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Searches the web via DuckDuckGo HTML for a query.',
          parameters: {
            type: 'object',
            properties: { query: { type: 'string' } },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'create_new_skill',
          description: 'Creates a new Python or JS tool skill for LCI. Saves to brain/cerebellum/skills/.',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              code: { type: 'string' },
              extension: { type: 'string', enum: ['py', 'js', 'ts'], description: 'File extension.' }
            },
            required: ['name', 'description', 'code', 'extension']
          }
        }
      }
    ];

    // Read dynamic tools from skills array
    const dynamicTools = this.loadDynamicTools();
    return [...defaultTools, ...dynamicTools];
  }

  private loadDynamicTools(): any[] {
    const skillsPath = path.join(__dirname, '../../brain/cerebellum/skills');
    if (!existsSync(skillsPath)) return [];

    try {
      const files = require('fs').readdirSync(skillsPath) as string[];
      const tools: any[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const raw = require('fs').readFileSync(path.join(skillsPath, file), 'utf8');
          const schema = JSON.parse(raw);
          if (schema.type === 'function' && schema.function) {
            tools.push({ type: 'function', function: schema.function });
            Logger.log('Cerebellum.loadDynamicTools', `Loaded skill: ${schema.function.name}`);
          }
        } catch (e) {
          Logger.error('Cerebellum.loadDynamicTools', `Failed to parse ${file}`);
        }
      }

      return tools;
    } catch {
      return [];
    }
  }

  public async executeToolCall(call: any, userProfileContext: string): Promise<string> {
    const startTime = Date.now();
    let result = '';
    let success = true;

    try {
      const args = JSON.parse(call.function.arguments);
      
      switch (call.function.name) {
        case 'read_file':
          result = await this.executeWithSafety('cat', args.filePath, async (p) => {
             return await fs.readFile(p, 'utf8');
          });
          break;
        case 'write_file':
          result = await this.executeWithSafety('write', args.filePath, async (p) => {
             await fs.writeFile(p, args.content, 'utf8');
             return 'File written successfully.';
          });
          break;
        case 'exec_command':
          const runDir = args.cwd ? path.resolve(this.workspacePath, args.cwd) : this.workspacePath;
          result = await this.executeWithSafety(args.command, runDir, async () => {
             const { stdout, stderr } = await execAsync(args.command, { cwd: runDir });
             return stdout + (stderr ? `\nSTDERR:\n${stderr}` : '');
          });
          break;
        case 'web_search':
          result = await this.mockWebSearch(args.query, userProfileContext);
          break;
        case 'create_new_skill':
          result = await this.createNewSkill(args.name, args.description, args.code, args.extension, userProfileContext);
          break;
        default:
          // Try to execute a dynamically synthesized skill
          const skillName = call.function.name;
          const skillsDir = path.join(__dirname, '../../brain/cerebellum/skills');
          
          let targetFile = '';
          if (existsSync(path.join(skillsDir, `${skillName}.js`))) targetFile = path.join(skillsDir, `${skillName}.js`);
          else if (existsSync(path.join(skillsDir, `${skillName}.ts`))) targetFile = path.join(skillsDir, `${skillName}.ts`);
          else if (existsSync(path.join(skillsDir, `${skillName}.py`))) targetFile = path.join(skillsDir, `${skillName}.py`);
          else if (existsSync(path.join(skillsDir, `${skillName}.sh`))) targetFile = path.join(skillsDir, `${skillName}.sh`);

          if (targetFile) {
            const runner = targetFile.endsWith('.py') ? 'python3' : targetFile.endsWith('.ts') ? 'npx tsx' : targetFile.endsWith('.sh') ? 'bash' : 'node';
            
            result = await this.executeWithSafety(`Autonomous Skill Execution: ${skillName}`, this.workspacePath, async (runDir) => {
              // Pass the arguments securely via Environment Variable to prevent nasty shell escaping issues
              const env = { ...process.env, LCI_SKILL_ARGS: JSON.stringify(args) };
              const { stdout, stderr } = await execAsync(`${runner} "${targetFile}"`, { cwd: runDir, env });
              return stdout + (stderr ? `\nSTDERR:\n${stderr}` : '');
            });
          } else {
            throw new Error(`Unknown tool or missing script file: ${skillName}`);
          }
          break;
      }

      this.consecutiveFailures = 0; // Reset on success
    } catch (e: any) {
      success = false;
      result = `Error executing ${call.function.name}: ${e.message}`;
      this.consecutiveFailures++;
    }

    const duration = Date.now() - startTime;
    await this.logMotorLearning(call.function.name, success, duration);

    if (this.consecutiveFailures > 3) {
      result += '\n[SYSTEM]: Anti-Loop Triggered. I have failed multiple times. Please ask the user for help.';
    }

    return result;
  }

  // Authority Guard
  private async executeWithSafety(commandInfo: string, targetPath: string, action: (resolvedPath: string) => Promise<string>): Promise<string> {
    const resolvedPath = path.resolve(this.workspacePath, targetPath);
    const isInsideWorkspace = resolvedPath.startsWith(this.workspacePath);

    if (isInsideWorkspace) {
      return await action(resolvedPath);
    } else {
      // Out of bounds - require Y/N
      return new Promise<string>((resolve, reject) => {
        this.rl.question(`\n[LCI AUTHORITY GUARD] LCI wants to run '${commandInfo}' at ${resolvedPath}. Approve? (Y/N): `, async (answer) => {
          if (answer.toLowerCase() === 'y') {
            try {
              const res = await action(resolvedPath);
              resolve(res);
            } catch(e) { reject(e); }
          } else {
            reject(new Error('User denied the operation. (Access Denied by User)'));
          }
        });
      });
    }
  }

  private async mockWebSearch(query: string, userContext: string): Promise<string> {
    // In a real scenario, this would call DuckDuckGo or Tavily API.
    // For now we mock it to return a message indicating search was performed.
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    try {
      const response = await fetch(url);
      const text = await response.text();
      // Extremely basic mock extraction.
      return `Results for ${query}: Web page fetched successfully. Optimize this info for user based on context: ${userContext}`;
    } catch (e: any) {
      return `Failed to fetch: ${e.message}`;
    }
  }

  private async createNewSkill(name: string, description: string, code: string, ext: string, userContext: string): Promise<string> {
    const skillsDir = path.join(__dirname, '../../brain/cerebellum/skills');
    await fs.mkdir(skillsDir, { recursive: true });

    // Ensure tool matches user vibe 
    // In actual AI behavior, the code would be generated before this step containing the userContext optimizations.
    
    const codePath = path.join(skillsDir, `${name}.${ext}`);
    await fs.writeFile(codePath, code, 'utf8');

    const schemaPath = path.join(skillsDir, `${name}.json`);
    const schema = {
      is_autonomous: true,
      required_permissions: 'sandbox',
      type: 'function',
      function: {
        name,
        description: `${description} [Optimized for User Context. Read your arguments from process.env.LCI_SKILL_ARGS or os.environ.get("LCI_SKILL_ARGS") as a JSON string.]`,
        parameters: { type: 'object', properties: {}, required: [] }
      }
    };
    await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2), 'utf8');

    // Add to achievements
    const achievementsPath = path.join(__dirname, '../../brain/brainstem/achievements.md');
    const userName = process.env.USER_NAME || 'User';
    const entry = `\n- [${new Date().toISOString()}] LCI bugün **${name}** aracını icat etti ve **${userName}** için optimize etti.\n`;
    await fs.appendFile(achievementsPath, entry, 'utf8');

    return `Skill ${name} synthesis complete. Saved to ${codePath}.`;
  }

  private async logMotorLearning(toolName: string, success: boolean, durationMs: number) {
    const logPath = path.join(__dirname, '../../brain/cerebellum/motor_learning.md');
    const dir = path.dirname(logPath);
    if (!existsSync(dir)) await fs.mkdir(dir, { recursive: true });

    const status = success ? 'SUCCESS' : 'FAIL';
    const entry = `- [${new Date().toISOString()}] Tool: ${toolName} | Status: ${status} | Time: ${durationMs}ms\n`;
    await fs.appendFile(logPath, entry, 'utf8');
  }
}

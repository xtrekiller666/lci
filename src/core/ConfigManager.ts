import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface UserConfig {
  modelName: string;
  apiKey: string;
  endpoint: string;
  voiceEnabled?: boolean;
  voicePersonality?: string;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private configPath: string;
  private currentConfig: UserConfig;

  private constructor() {
    this.configPath = path.join(__dirname, '../../lci_config/user.json');
    this.currentConfig = this.loadInitialConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadInitialConfig(): UserConfig {
    const defaultConfig: UserConfig = {
      modelName: process.env.LLM_MODEL || 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY || '',
      endpoint: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      voiceEnabled: true,
      voicePersonality: 'organic',
    };

    try {
      if (!fs.existsSync(path.dirname(this.configPath))) {
        fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
      }

      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const saved = JSON.parse(data);
        Logger.log('ConfigManager', 'Custom configuration loaded from user.json');
        return { ...defaultConfig, ...saved };
      }
    } catch (error) {
      Logger.error('ConfigManager.loadInitialConfig', error);
    }

    return defaultConfig;
  }

  public getConfig(): UserConfig {
    return this.currentConfig;
  }

  public saveConfig(config: Partial<UserConfig>): void {
    this.currentConfig = { ...this.currentConfig, ...config };
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.currentConfig, null, 2));
      Logger.log('ConfigManager', 'Configuration saved to user.json');
    } catch (error) {
      Logger.error('ConfigManager.saveConfig', error);
    }
  }

  /**
   * Returns settings in a format compatible with LLMClient / OpenAI constructor
   */
  public getLLMSettings() {
    return {
      apiKey: this.currentConfig.apiKey || 'sk-placeholder',
      baseURL: this.currentConfig.endpoint,
      model: this.currentConfig.modelName,
    };
  }
}

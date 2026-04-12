import readline from 'readline';
import { LLMClient } from './core/LLMClient.js';
import { LimbicSystem } from './core/LimbicSystem.js';
import { FrontalLobe } from './core/FrontalLobe.js';
import { Thalamus } from './core/Thalamus.js';
import { Logger } from './core/Logger.js';
import { MirrorDB } from './core/MirrorDB.js';
import { MemoryManager } from './core/MemoryManager.js';
import { Cerebellum } from './core/Cerebellum.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const llm = new LLMClient();
const limbic = new LimbicSystem(llm);
const frontal = new FrontalLobe(llm);
const thalamus = new Thalamus();
const mirror = new MirrorDB();
const memory = new MemoryManager(llm);
const cerebellum = new Cerebellum(rl);

// Track conversation history for consolidation
const conversationHistory: string[] = [];

async function runLoop() {
  console.log('--- LCI INTERACTION LOOP STARTED ---');
  console.log('Type "/exit" to end session and consolidate memories.');

  while (true) {
    const userInput = await new Promise<string>((resolve) => {
      rl.question('\nYOU: ', (answer) => resolve(answer));
    });

    // /exit → consolidate session before quitting
    if (userInput.toLowerCase() === '/exit' || userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
      console.log('\n[TEMPORAL LOBE] Oturum kapatılıyor, anılar konsolide ediliyor...');
      try {
        if (conversationHistory.length > 0) {
          const fullHistory = conversationHistory.join('\n');
          await memory.consolidateSession(fullHistory);
          console.log('[TEMPORAL LOBE] Hafıza konsolidasyonu tamamlandı. (brain/temporal/)');
        }
      } catch (err) {
        Logger.error('SESSION_CONSOLIDATION', err);
      }
      rl.close();
      break;
    }

    try {
      Logger.log('INTERACTION_START', `User: ${userInput}`);
      conversationHistory.push(`USER: ${userInput}`);

      // 1. Suppression Detection — must run before other steps
      process.stdout.write('[0/5] Suppression Check... ');
      await limbic.detectSuppression(userInput);
      console.log('Done.');

      // 2. Update Limbic Chemicals
      process.stdout.write('[1/5] Limbic Analysis... ');
      await limbic.updateChemicals(userInput);
      console.log('Done.');

      // 3. Frontal Identity Detection
      process.stdout.write('[2/5] Frontal Analysis... ');
      await frontal.detectAnchors(userInput);
      console.log('Done.');

      // 4. Thalamus: System Prompt + Memory Retrieval (with Vibe Transfer)
      process.stdout.write('[3/5] Thalamus Synthesis + Memory Retrieval... ');
      const systemPrompt = thalamus.generateSystemPrompt();
      const memoryContext = await thalamus.retrieveRelevantMemories(userInput);
      const fullSystemPrompt = memoryContext
        ? `${systemPrompt}\n\n${memoryContext}`
        : systemPrompt;
      console.log('Done.');

      // 5. Final Completion with Cerebellum Tool Loop
      process.stdout.write('[4/5] Thinking & Motor Planning... ');
      
      let currentMessages: any[] = [
        { role: 'system', content: fullSystemPrompt },
        { role: 'user', content: userInput }
      ];
      const availableTools = cerebellum.getAvailableTools();
      let responseMessage: any;

      while (true) {
        responseMessage = await llm.completeWithTools(currentMessages, availableTools);
        
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          currentMessages.push(responseMessage); // Add assistant tool calls

          for (const toolCall of responseMessage.tool_calls) {
            console.log(`\n[CEREBELLUM] Otonom modül tetiklendi: ${toolCall.function.name}...`);
            const userContext = await thalamus.retrieveRelevantMemories("Kullanıcı kimlik çapaları ve genel profil");
            const toolResult = await cerebellum.executeToolCall(toolCall, userContext);
            console.log(`[CEREBELLUM] Sonuç alındı.`);
            
            currentMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: toolResult
            });
          }
        } else {
          break; // Final text response
        }
      }

      const finalResponse = responseMessage.content || '';
      console.log('\nLCI: ' + finalResponse);
      conversationHistory.push(`LCI: ${finalResponse}`);

      // 6. Save this exchange as a new episodic memory (importance 5 by default)
      process.stdout.write('[5/5] Memory Imprint... ');
      await memory.saveMemory('episodic', `Kullanıcı: "${userInput}" | LCI: "${finalResponse.substring(0, 200)}"`, 5);
      console.log('Done.');

      // 7. Mirror DB for inspection
      mirror.exportTransmitters();

      Logger.log('INTERACTION_END', `LCI Response: ${finalResponse.substring(0, 100)}...`);
    } catch (error) {
      Logger.error('MAIN_LOOP', error);
      console.error('\n[!] Hata oluştu. Detaylar: brainstem/logging.md');
    }
  }
}

runLoop().catch(err => {
  Logger.error('FATAL_CRASH', err);
  process.exit(1);
});

import readline from 'readline';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { LLMClient } from './core/LLMClient.js';
import { LimbicSystem } from './core/LimbicSystem.js';
import { FrontalLobe } from './core/FrontalLobe.js';
import { Thalamus } from './core/Thalamus.js';
import { Logger } from './core/Logger.js';
import { MirrorDB } from './core/MirrorDB.js';
import { MemoryManager } from './core/MemoryManager.js';
import { Cerebellum } from './core/Cerebellum.js';
import { RelationshipManager } from './core/RelationshipManager.js';
import { DreamLogic } from './core/DreamLogic.js';
import { ConfigManager } from './core/ConfigManager.js';
import axios from 'axios';

// --- Server Setup ---
const app = express();
app.use(cors());
app.use(express.json()); // Essential for parsing POST bodies
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const configManager = ConfigManager.getInstance();

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`\n[BRAINSTEM] Dashboard server running on port ${PORT}`);
});

// Reboot endpoint for Dashboard
app.post('/api/reboot', (req, res) => {
  console.log('[SYSTEM] Reboot requested via Dashboard.');
  res.json({ success: true, message: 'Rebooting via file watcher...' });
  import('fs/promises').then((fs) => {
    const __filename = import.meta.url ? new URL(import.meta.url).pathname : process.argv[1];
    const time = new Date();
    fs.utimes(__filename, time, time).catch(() => process.exit(1));
  });
});

// Update Config endpoint
app.post('/api/config', (req, res) => {
  const { modelName, apiKey, endpoint } = req.body;
  configManager.saveConfig({ modelName, apiKey, endpoint });
  llm.updateSettings(configManager.getLLMSettings()); // <-- Fix: Dynamically update LLM connection
  console.log('[SYSTEM] Config updated and saved.');
  res.json({ success: true, config: configManager.getConfig() });
});

// Proxy for Local Models (Ollama Bridge)
app.post('/api/proxyprompt', async (req, res) => {
  const { prompt, model, system } = req.body;
  const config = configManager.getConfig();
  
  try {
    // If it's an Ollama style endpoint (port 11434 usually)
    const url = config.endpoint.includes('11434') 
      ? `${config.endpoint}/api/generate` 
      : config.endpoint;

    const response = await axios.post(url, {
      model: model || config.modelName,
      prompt: system ? `${system}\n\n${prompt}` : prompt,
      stream: false
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('[PROXY ERROR]', error.message);
    res.status(500).json({ error: 'Local model bridge failed.', details: error.message });
  }
});

// --- LCI Core ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const llm = new LLMClient(configManager.getLLMSettings());
const limbic = new LimbicSystem(llm);
const frontal = new FrontalLobe(llm);
const thalamus = new Thalamus();
const mirror = new MirrorDB();
const memory = new MemoryManager(llm);
const cerebellum = new Cerebellum(rl);
const relationship = new RelationshipManager();
const dream = new DreamLogic(llm, relationship);

const conversationHistory: string[] = [];

// Broadcasting helpers
const broadcastChemicals = () => {
  const state = limbic.getChemicalState();
  io.emit('chemical_update', state);
};

const broadcastThought = (thought: string) => {
  io.emit('thought_stream', { thought });
};

const broadcastStatus = () => {
  const persona = thalamus['readCurrentPersona'](); // Accessing private for demo
  io.emit('status_update', { persona, status: 'Awake' });
  const rel = relationship.getState();
  io.emit('relationship_update', rel);
};

let interactionActive = false;

io.on('connection', (socket) => {
  console.log(`[NETWORK] Connection established: ${socket.id}`);
  broadcastChemicals();
  broadcastStatus();

  socket.on('user_message', async (data: { message: string }) => {
    if (interactionActive) {
      socket.emit('cerebellum_log', { entry: '[SYSTEM] Busy processing. Ignored message.' });
      return;
    }
    
    const userInput = data.message;
    if (!userInput.trim()) return;

    if (userInput.toLowerCase() === '/sleep' || userInput.toLowerCase() === '/exit') {
        io.emit('cerebellum_log', { entry: '[SYSTEM] Initiating sleep cycle & memory consolidation...' });
        io.emit('thought_stream', { thought: 'Entering dream state... compiling session memories.' });
        try {
            if (conversationHistory.length > 0) {
                await memory.consolidateSession(conversationHistory.join('\n'));
            }
            io.emit('status_update', { status: 'Dreaming' });
            await dream.runDreamCycle();
            conversationHistory.length = 0; // Clear memory buffer
            
            // Apply new relationship stats
            const rel = relationship.getState();
            // Read updated archetype/persona
            const newPersona = thalamus['readCurrentPersona']();
            
            io.emit('relationship_update', rel);
            io.emit('status_update', { status: 'Awake', persona: newPersona });
            io.emit('thought_stream', { thought: `Waking up as: ${newPersona}` });
            io.emit('cerebellum_log', { entry: '[SYSTEM] Sleep cycle complete. LCI is awake.' });
        } catch (e: any) {
            Logger.error('SLEEP_CYCLE', e);
            io.emit('cerebellum_log', { entry: `[ERROR] Dream cycle failed: ${e.message}` });
        }
        return; // Skip normal LLM processing
    }

    interactionActive = true;
    Logger.log('INTERACTION_START', `User: ${userInput}`);
    conversationHistory.push(`USER: ${userInput}`);

    try {
      // 1. Suppression Check
      broadcastThought('Checking for suppressed memories...');
      await limbic.detectSuppression(userInput);

      // 2. Limbic Analysis
      broadcastThought('Processing emotional impact...');
      await limbic.updateChemicals(userInput);
      broadcastChemicals();

      // 3. Frontal Analysis
      broadcastThought('Analyzing identity anchors...');
      await frontal.detectAnchors(userInput);

      // 4. Thalamus & Memory
      broadcastThought('Retrieving relevant memories...');
      const systemPrompt = thalamus.generateSystemPrompt();
      const memoryContext = await thalamus.retrieveRelevantMemories(userInput);
      const fullSystemPrompt = memoryContext ? `${systemPrompt}\n\n${memoryContext}` : systemPrompt;
      
      if (memoryContext) {
        io.emit('memory_spark', { id: Date.now().toString(), title: 'Recent Interaction', type: 'episodic' });
      }

      // 5. Motor Planning & Tool Loop
      broadcastThought('Thinking & Motor Planning...');
      
      let currentMessages: any[] = [
        { role: 'system', content: fullSystemPrompt },
        { role: 'user', content: userInput }
      ];
      const availableTools = cerebellum.getAvailableTools();
      let finalResponse = '';

      while (true) {
        let responseMessage: any = { role: 'assistant', content: '' };
        let toolCalls: any[] = [];

        const stream = llm.completeWithToolsStream(currentMessages, availableTools);
        
        for await (const chunk of stream) {
          if (chunk.delta?.content) {
            const token = chunk.delta.content;
            finalResponse += token;
            responseMessage.content += token;
            io.emit('llm_token', { token });
          }
          if (chunk.delta?.tool_calls) {
            for (const tc of chunk.delta.tool_calls) {
              if (!toolCalls[tc.index]) {
                toolCalls[tc.index] = { id: tc.id, type: 'function', function: { name: '', arguments: '' } };
              }
              if (tc.function?.name) toolCalls[tc.index].function.name += tc.function.name;
              if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
            }
          }
        }

        io.emit('llm_token', { done: true });

        const actualToolCalls = toolCalls.filter(Boolean);
        if (actualToolCalls.length > 0) {
          responseMessage.tool_calls = actualToolCalls;
          currentMessages.push(responseMessage);

          for (const toolCall of actualToolCalls) {
            broadcastThought(`Executing tool: ${toolCall.function.name}...`);
            io.emit('cerebellum_log', { entry: `[AUTONOMOUS] Triggering ${toolCall.function.name}...` });
            
            const userContext = await thalamus.retrieveRelevantMemories('User profile');
            const toolResult = await cerebellum.executeToolCall(toolCall, userContext);
            
            io.emit('cerebellum_log', { entry: `[RESULT] ${toolResult.substring(0, 100)}${toolResult.length > 100 ? '...' : ''}` });
            
            if (!toolResult.startsWith('Error')) {
              await relationship.adjustTrust(2);
              io.emit('relationship_update', relationship.getState());
            }

            // Strictly compliant OpenAI 'tool' role format (do NOT include 'name')
            currentMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: toolResult
            });
          }
        } else {
          break; // Done
        }
      }

      conversationHistory.push(`LCI: ${finalResponse}`);

      // 6. Memory Imprint
      broadcastThought('Imprinting episodic memory...');
      await memory.saveMemory('episodic', `User: "${userInput}" | LCI: "${finalResponse.substring(0, 200)}"`, 5);

      // 7. Housekeeping
      mirror.exportTransmitters();
      Logger.log('INTERACTION_END', `LCI Response: ${finalResponse.substring(0, 100)}...`);
      await relationship.adjustCloseness(1);
      
    } catch (error) {
      Logger.error('MAIN_LOOP', error);
      io.emit('cerebellum_log', { entry: `[ERROR] ${error}` });
    } finally {
      interactionActive = false;
      broadcastThought('Idle');
    }
  });
});


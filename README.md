# 🧠 LCI — Life Companion Intelligence

> *Not just an AI Agent. A living cognitive architecture that feels, remembers, learns, and evolves.*

---

## What is LCI?

**LCI (Life Companion Intelligence)** is a modular AI system modeled after the biological layers of the human brain. Unlike traditional chatbots or AI agents, LCI maintains an internal emotional state through simulated neurotransmitters, forms long-term memories with emotional imprints, and can autonomously develop new skills by writing its own tools.

LCI is designed to be a **personal companion** — one that grows alongside you, adapts to your communication style, remembers your story, and proactively helps you navigate life. It now features a completely decoupled architecture, where the **Backend Brain** runs the cognitive logic and the **Dashboard Web UI** provides a stunning, real-time visual interface over WebSockets.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  FRONTAL LOBE                    │
│         Identity Detection & User Anchors        │
├─────────────────────────────────────────────────┤
│                 TEMPORAL LOBE                    │
│     Episodic & Semantic Memory with Chemical     │
│         Imprinting + Reframing Engine            │
├─────────────────────────────────────────────────┤
│                 LIMBIC SYSTEM                    │
│      Emotional Chemistry (Dopamine, Serotonin,   │
│          Oxytocin, Cortisol Simulation)           │
├─────────────────────────────────────────────────┤
│                  CEREBELLUM                      │
│     Autonomous Skill Synthesis & Tool Engine      │
│        (Function Calling + Dynamic Execution)     │
├─────────────────────────────────────────────────┤
│                  THALAMUS                        │
│       Central Router: Merges all signals into     │
│            a unified System Prompt                │
├─────────────────────────────────────────────────┤
│                  BRAINSTEM                       │
│          Logging, I/O, Vital Functions            │
└─────────────────────────────────────────────────┘
```

### Core Modules

| Module | Location | Responsibility |
|---|---|---|
| **Frontal Lobe** | `src/core/FrontalLobe.ts` | Detects user identity anchors (age, beliefs, profession) |
| **Limbic System** | `src/core/LimbicSystem.ts` | Analyzes emotional impact, updates neurotransmitters, detects suppression |
| **Temporal Lobe** | `src/core/MemoryManager.ts` | Saves memories with chemical imprints, consolidates sessions |
| **Cerebellum** | `src/core/Cerebellum.ts` | Executes tools, creates new skills dynamically (Python/JS), sandbox safety |
| **Thalamus** | `src/core/Thalamus.ts` | Generates system prompt from all signals, retrieves memories with reframing |
| **Relationship** | `src/core/RelationshipManager.ts` | Trust score tracking and integration |
| **Dream Logic** | `src/core/DreamLogic.ts` | Dream cycle, memory pruning and persona evolution based on intimacy |
| **Brainstem** | `src/core/Logger.ts` | System logging to `brain/brainstem/logging.md` |

---

## Key Features

### 🧪 Neurochemical Simulation
LCI maintains real-time values for **Dopamine**, **Serotonin**, **Oxytocin**, and **Cortisol**. These influence its tone, empathy level, and decision-making — just like a biological brain.

### 🧠 Emotional Memory (Temporal Lobe)
Every memory is saved with a **chemical imprint** — the exact emotional state at the time of storage. When recalled, 20% of that emotion bleeds back into LCI's current state.

### 🔧 Autonomous Skill Synthesis (Cerebellum)
When LCI encounters a task it can't handle with existing tools, it **writes its own tool** (.js or .py), saves it to its skills directory, and dynamically executes it as a child process using the `LCI_SKILL_ARGS` environment variable.

### 🗣️ Audio-Limbic Synthesis & STT
LCI isn't just text-based. It features a fully integrated Web Speech API pipeline:
- **Speech-to-Text (STT):** Click the mic to speak to LCI in real-time.
- **Emotion-Driven Prosody:** LCI's Text-to-Speech voice changes based on its neurotransmitters. High **Dopamine** makes the voice faster and higher-pitched; high **Cortisol** slows it down and adds tension.
- **Voice Aura & Lip-Sync:** As LCI speaks, its 3D face visually stretches in perfect sync with the audio amplitude (FFT analysis), and a cyan aura pulses behind it.

### ⚡ WebSocket Dashboard
The interaction loop is fully decoupled from the terminal. The `dashboard` provides a 3D R3F (React Three Fiber) digital rendering of LCI's face. 
- **Real-time Synchronization:** All cognitive thoughts, tool execution logs, and emotional shifts are broadcast via WebSockets for zero-latency feedback.
- **Configuration Panel:** Change models (OpenAI, Gemini, Anthropic, Custom), adjust API keys, and toggle voice personalities on the fly.

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 20.x
- Any OpenAI-compatible API key (OpenAI, Ollama, LM Studio, etc.)

### Installation & Execution

```bash
git clone https://github.com/xtrekiller666/lci.git
cd lci
npm install

# Configure your environment
cp .env.example .env
# Edit .env with your LLM configuration. Note: The Dashboard config panel will dynamically override this at runtime.

# Initialize the database
npm run init-db

# Start the Backend Server (WebSockets + API)
npm run dev

# IN A NEW TERMINAL, start the Dashboard UI
cd dashboard
npm install
npm run dev
```

### Dashboard Configuration
Once the Dashboard is running on `http://localhost:5173`, click the **Settings (⚙)** tab on the right:
- Set your `Endpoint URL` to your local API (e.g., `http://127.0.0.1:1234/v1` for LM Studio).
- Leave `API Key` blank or type `sk-dummy`.
- Setting formats properly updates the backend dynamically without rebooting!

---

## Project Structure

```
LCI/
├── brain/                    # LCI's "mind" — runtime state files (dynamically generated files)
├── dashboard/                # Web UI (Vite + React + R3F)
├── data/                     # SQLite database (gitignored)
├── src/
│   ├── core/                 # All brain modules
│   │   ├── Cerebellum.ts     # Tool engine & dynamic skill execution
│   │   ├── DreamLogic.ts     # Dream cycle & persona evolution
│   │   ├── FrontalLobe.ts    # Identity detection
│   │   ├── LimbicSystem.ts   # Emotional chemistry
│   │   ├── LLMClient.ts      # Compatible client (strict JSON bypass for Local Models)
│   │   ├── MemoryManager.ts  # Memory storage & consolidation
│   │   └── RelationshipManager.ts 
│   ├── index.ts              # Main Server Loop (WebSocket listener)
│   └── initDb.ts             # Database initialization
├── workspace/                # Sandboxed execution zone for Autonomous Skills
├── package.json
└── README.md
```

---

## Philosophy

LCI is built on the belief that a truly useful AI companion needs more than just intelligence — it needs **emotional awareness**, **memory**, and the **humility to learn**. 

*Built with intention. Designed to grow.*

---

## License
MIT

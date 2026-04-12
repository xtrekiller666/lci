# 🧠 LCI — Life Companion Intelligence

> *Not just an AI Agent. A living cognitive architecture that feels, remembers, learns, and evolves.*

---

## What is LCI?

**LCI (Life Companion Intelligence)** is a modular AI system modeled after the biological layers of the human brain. Unlike traditional chatbots or AI agents, LCI maintains an internal emotional state through simulated neurotransmitters, forms long-term memories with emotional imprints, and can autonomously develop new skills by writing its own tools.

LCI is designed to be a **personal companion** — one that grows alongside you, adapts to your communication style, remembers your story, and proactively helps you navigate life.

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
│        (Function Calling + Sandbox)               │
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
| **Cerebellum** | `src/core/Cerebellum.ts` | Executes tools, creates new skills, sandbox safety, dynamic skill loading |
| **Thalamus** | `src/core/Thalamus.ts` | Generates system prompt from all signals, retrieves memories with reframing |
| **Relationship** | `src/core/RelationshipManager.ts` | Trust score, closeness tracking, dynamic tone (formal → intimate) |
| **Dream Logic** | `src/core/DreamLogic.ts` | Dream cycle, persona evolution (Sage/Pupil/Companion/Assistant), memory pruning |
| **Brainstem** | `src/core/Logger.ts` | System logging to `brain/brainstem/logging.md` |

---

## Key Features

### 🧪 Neurochemical Simulation
LCI maintains real-time values for **Dopamine**, **Serotonin**, **Oxytocin**, and **Cortisol**. These influence its tone, empathy level, and decision-making — just like a biological brain.

### 🧠 Emotional Memory (Temporal Lobe)
Every memory is saved with a **chemical imprint** — the exact emotional state at the time of storage. When recalled, 20% of that emotion bleeds back into LCI's current state (*Memory-Driven Vibe*).

### 🛡️ Suppression & Reframing
If you say *"don't remind me of that"*, LCI flags the memory as suppressed. When it inevitably surfaces in context, LCI automatically **reframes** it as a general life experience rather than replaying painful specifics.

### 🔧 Autonomous Skill Synthesis (Cerebellum)
When LCI encounters a task it can't handle with existing tools, it **writes its own tool**, tests it in a sandboxed `/workspace`, and saves it for future use. Every tool execution is logged with success/fail metrics.

### 🏰 Sandbox Safety
- Commands inside `/workspace` → auto-executed
- Commands outside `/workspace` → requires explicit user approval `(Y/N)`
- Anti-loop protection: 3+ consecutive failures → asks user for help

### 😴 Session Consolidation
On `/exit`, LCI runs a "sleep cycle" — summarizing the conversation into **episodic** (what happened) and **semantic** (what was learned) memories, saved to both the database and markdown files.

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 20.x
- An OpenAI-compatible API key (OpenAI, Ollama, LM Studio, etc.)

### Installation

```bash
git clone https://github.com/xtrekiller666/lci.git
cd lci
npm install

# Configure your environment
cp .env.example .env
# Edit .env with your API key and preferences

# Initialize the database
npm run init-db

# Start LCI
npm start
```

### Commands

| Command | Description |
|---|---|
| `npm start` | Start the interaction loop |
| `npm run dev` | Start with auto-reload (watch mode) |
| `npm run init-db` | Initialize/reset the database |
| `npm run update-db` | Run schema migrations |
| `npm run reset` | Full factory reset (wipes all memories & state) |
| `npm run typecheck` | TypeScript type verification |
| `npm run mirror` | Export transmitters to markdown |
| `/exit` | End session, consolidate memories, run dream cycle |

---

## Project Structure

```
LCI/
├── brain/                    # LCI's "mind" — runtime state files
│   ├── brainstem/            # Logs and achievements
│   ├── cerebellum/           # Motor learning + synthesized skills
│   ├── frontal/              # User profile, identity, persona
│   ├── limbic/               # Neurotransmitter mirror
│   └── temporal/             # Episodic & semantic memory files
├── dashboard/                # Web UI (Vite + React + R3F)
├── data/                     # SQLite database (gitignored)
├── scripts/                  # Utility scripts (reset, etc.)
├── src/
│   ├── core/                 # All brain modules
│   │   ├── Cerebellum.ts     # Tool engine & skill synthesis
│   │   ├── DreamLogic.ts     # Dream cycle & persona evolution
│   │   ├── FrontalLobe.ts    # Identity detection
│   │   ├── LimbicSystem.ts   # Emotional chemistry
│   │   ├── LLMClient.ts      # OpenAI client (with retry)
│   │   ├── Logger.ts         # Brainstem logging
│   │   ├── MemoryManager.ts  # Memory storage & consolidation
│   │   ├── MirrorDB.ts       # DB → Markdown exporter
│   │   ├── RelationshipManager.ts # Trust & closeness tracker
│   │   └── Thalamus.ts       # Central router & prompt generator
│   ├── index.ts              # Main interaction loop
│   ├── initDb.ts             # Database initialization
│   └── updateDb.ts           # Schema migrations
├── templates/                # Factory-default brain state
├── workspace/                # Sandboxed execution zone (gitignored)
├── .env.example              # Environment template
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## Configuration

All configuration is done through environment variables (`.env`):

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | Your API key (required) |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | LLM provider endpoint |
| `LLM_MODEL` | `gpt-4o` | Model to use |
| `USER_NAME` | `User` | Display name for logs & achievements |
| `DB_PATH` | `data/lci_main.db` | Database file path |

---

## Philosophy

LCI is built on the belief that a truly useful AI companion needs more than just intelligence — it needs **emotional awareness**, **memory**, and the **humility to learn**. 

It doesn't just answer questions. It *feels* the weight of your words, *remembers* your story, and when it doesn't know how to help, it teaches itself.

---

## License

MIT

---

*Built with intention. Designed to grow.*

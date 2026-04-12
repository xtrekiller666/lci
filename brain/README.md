# Layered Cognitive Infrastructure (LCI)

LCI is a modular AI Agent architecture inspired by the biological hierarchy of the human brain. This system separates high-level reasoning from emotional drives and low-level reflexes to create a more resilient and human-like intelligence.

## Architecture

### 1. Frontal Lobe (`/brain/frontal`)
Executive functions, complex planning, and conscious reasoning. This layer handles the "What should I do?" by processing goals and constraints.

### 2. Limbic System (`/brain/limbic`)
The emotional core. Manages "internal states" through numerical simulations of neurotransmitters (Dopamine, Serotonin, Oxytocin, Cortisol). It influences decision-making through drives and emotional biases.

### 3. Temporal Lobe (`/brain/temporal`)
Storage and retrieval of knowledge. Handles both semantic memory (facts) and episodic memory (past experiences/conversations).

### 4. Cerebellum (`/brain/cerebellum`)
Procedural memory and skill refinement. Manages the "How do I do it?" by storing tool-use patterns and optimizing physical or digital actions.

### 5. Brainstem (`/brain/brainstem`)
The foundation. Handles vital system functions, basic I/O (prompt/response cycles), and immediate reflexes that don't require higher-level processing.

---

## Neurochemical Mirroring
The system uses a SQLite database to maintain real-time values for neurotransmitters. These values are mirrored to `brain/limbic/neurotransmitters.md` for transparency and inspection.

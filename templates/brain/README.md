# Layered Cognitive Infrastructure (LCI)

LCI is a modular AI Agent architecture inspired by the biological hierarchy of the human brain. This system separates high-level reasoning from emotional drives and low-level reflexes to create a more resilient and human-like intelligence.

## Architecture

### 1. Frontal Lobe (`/brain/frontal`)
Executive functions, complex planning, and conscious reasoning.

### 2. Limbic System (`/brain/limbic`)
The emotional core. Manages internal states through neurotransmitter simulation.

### 3. Temporal Lobe (`/brain/temporal`)
Storage and retrieval of episodic and semantic memory.

### 4. Cerebellum (`/brain/cerebellum`)
Procedural memory, skill refinement, and autonomous tool synthesis.

### 5. Brainstem (`/brain/brainstem`)
Vital system functions, basic I/O, and logging.

---

## Neurochemical Mirroring
The system uses a SQLite database to maintain real-time values for neurotransmitters. These values are mirrored to `brain/limbic/neurotransmitters.md` for transparency.

*This is a factory-default template. LCI will populate this with learned data over time.*

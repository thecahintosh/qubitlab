# QubitLab

QubitLab is an AI-powered interactive quantum computing learning platform that combines a visual circuit builder, deterministic quantum simulation, adaptive tutoring, assessments, progress tracking, and cloud persistence.

The goal is to make quantum computing easier to learn by turning natural-language requests into executable quantum experiments while keeping the actual simulation deterministic and verifiable.

---

## Features

### Visual Quantum Circuit Builder

Build circuits using supported gates:

- H
- X
- Y
- Z
- S
- T
- RX
- RY
- RZ
- CX
- SWAP

QubitLab supports up to 6 qubits.

The internal qubit convention is:

```text
q0 = least significant bit
```

The circuit is represented using a custom JSON intermediate representation.

Example:

```json
{
  "qubits": 2,
  "gates": [
    {
      "type": "H",
      "target": 0
    },
    {
      "type": "CX",
      "control": 0,
      "target": 1
    }
  ]
}
```

The Circuit JSON IR is the source of truth for the application.

---

## Deterministic Quantum Simulator

QubitLab includes a client-side JavaScript statevector simulator.

Supported functionality includes:

- arbitrary statevector simulation
- single-qubit gates
- controlled NOT
- SWAP
- rotation gates
- probability calculation
- shot-based measurement simulation
- state evolution history

Example Bell-state pipeline:

```text
|00>
  |
 H(q0)
  |
 1/sqrt(2)(|00> + |01>)
  |
CX(q0 -> q1)
  |
1/sqrt(2)(|00> + |11>)
```

The simulator does not depend on the language model.

AI-generated circuits must pass deterministic validation before they are executed.

---

## AI Tutor

QubitLab integrates Groq for AI-assisted learning.

Supported AI modes include:

- conversational tutoring
- circuit explanation
- circuit debugging
- circuit generation
- knowledge-check generation
- assessment grading
- lesson recommendation

The AI receives contextual information such as:

- current circuit
- current statevector
- active lesson
- execution step
- learner mastery profile
- recent tutoring conversation

The simulator output is treated as authoritative.

The AI is instructed not to invent simulator states or measurement results.

---

## AI Circuit Generation

Users can describe a circuit in natural language.

Example:

```text
Create a Bell state using two qubits.
```

The AI may propose:

```json
{
  "qubits": 2,
  "gates": [
    {
      "type": "H",
      "target": 0
    },
    {
      "type": "CX",
      "control": 0,
      "target": 1
    }
  ]
}
```

The circuit then passes through QubitLab's deterministic validation layer.

```text
Natural-language request
        |
        v
       Groq
        |
        v
   Circuit JSON
        |
        v
 validateGate()
        |
        v
QubitLab simulator
        |
        v
verified quantum state
```

Unsupported gates cannot directly execute inside the simulator.

---

## Adaptive Learning

QubitLab maintains a learner profile across the following areas:

- qubits
- superposition
- gates
- measurement
- entanglement

The learner profile is updated using:

- circuit interaction
- assessment performance
- lesson completion

Assessment grading is AI-assisted, while mastery updates are performed deterministically by the application.

The platform can recommend the next lesson based on:

- weak mastery areas
- prerequisite gaps
- completed lessons
- current lesson

---

## Built-in Lessons

Current lessons include:

1. Superposition
2. Pauli-X
3. Phase
4. Bell State
5. GHZ State

Each lesson includes:

- learning objectives
- a prepared circuit
- simulation
- tutoring context
- optional assessment

---

## Visualization

QubitLab includes:

- visual circuit rendering
- statevector display
- basis-state probability cards
- measurement histogram
- state evolution timeline
- execution stepper
- single-qubit Bloch sphere visualization

AI responses support:

- Markdown
- mathematical notation
- LaTeX
- tables
- code blocks

KaTeX is used for mathematical rendering.

---

## SDK Export

Circuits can be exported to:

- Qiskit
- Cirq
- PennyLane
- OpenQASM 3

This allows learners to move from QubitLab's visual interface to real quantum-development SDKs.

---

## Projects

Authenticated users can save circuits as projects.

Projects are stored in Supabase and are available across browsers and devices after login.

Project operations include:

- create
- update
- load
- delete

---

## Authentication and Cloud Persistence

QubitLab uses Supabase for:

- authentication
- project persistence
- tutor conversation history
- learning profiles
- assessment history

Row Level Security is enabled so users can access only their own records.

The browser uses the Supabase publishable key.

Secret or service-role keys must never be exposed to the frontend.

---

## Architecture

```text
Browser
|
|-- Authentication UI
|-- Lessons
|-- Circuit Builder
|-- Circuit JSON IR
|-- Quantum Simulator
|-- Statevector / Shots
|-- Visualizations
|-- SDK Export
|-- Projects
|-- AI Tutor UI
|-- Assessments
|-- Learning Profile
|
+--> Supabase
|    |
|    |-- Authentication
|    |-- PostgreSQL
|    +-- Row Level Security
|
+--> Express API
     |
     |-- Authentication verification
     |-- AI request validation
     |-- Per-user rate limiting
     |-- Python worker timeout
     |-- Error normalization
     |
     +--> Python AI Worker
           |
           +--> Groq API
```

---

## Backend Safety and Reliability

The AI boundary includes:

- authenticated AI endpoints
- request payload limits
- per-user AI throttling
- Python worker timeout
- Groq timeout handling
- Groq rate-limit handling
- provider error categorization
- sanitized public errors
- internal request IDs
- server-side diagnostic logging

Stable error categories include:

```text
AUTH_ERROR
RATE_LIMIT
TIMEOUT
INVALID_REQUEST
PROVIDER_AUTH
PROVIDER_ERROR
INTERNAL_ERROR
```

Detailed provider errors remain in server logs instead of being exposed directly to the browser.

---

## Testing

QubitLab includes deterministic tests for the core quantum engine and circuit validation.

Current deterministic test result:

```text
23 / 23 passing
```

Covered behavior includes:

- zero state creation
- X gate
- Hadamard
- H² = I
- Bell state
- GHZ state
- CNOT
- SWAP
- RX
- RY
- RZ
- probability normalization
- shot counts
- invalid gate rejection
- invalid qubit indices
- invalid rotation values
- invalid CNOT configuration
- invalid SWAP configuration

Run tests using Docker:

```powershell
docker run `
  --rm `
  -v "${PWD}:/app" `
  -w /app `
  node:24-bookworm-slim `
  npm test
```

---

## AI Evaluation

QubitLab also includes an AI evaluation suite.

Current result:

```text
7 / 7 passing
100% pass rate
1.70 s average evaluation latency
```

Evaluation cases include:

- Bell-state generation
- GHZ-state generation
- single-qubit superposition
- X-gate generation
- unsupported-gate safety
- lesson recommendation schema
- assessment grading schema

Circuit-generation evals do not merely check whether valid-looking text was returned.

Generated circuits are:

1. parsed
2. validated using QubitLab's own circuit validator
3. executed using QubitLab's simulator
4. compared against expected quantum probabilities

Run the AI eval suite:

```powershell
docker run `
  --rm `
  --env-file .env `
  -v "${PWD}:/app" `
  -w /app `
  qubitlab:dev `
  python3 evals/ai-evals.py
```

---

## Technology Stack

### Frontend

- HTML
- CSS
- JavaScript ES modules
- KaTeX
- Marked
- DOMPurify

### Backend

- Node.js
- Express

### AI

- Python
- Groq API
- GPT-OSS model

### Data and Authentication

- Supabase Auth
- Supabase PostgreSQL
- Row Level Security

### Development

- Docker

---

## Project Structure

```text
qubitlab/
|
|-- ai/
|   +-- ai.py
|
|-- evals/
|   |-- ai-evals.py
|   +-- cases.json
|
|-- tests/
|   |-- circuit-tests.mjs
|   |-- quantum-tests.mjs
|   +-- run-tests.mjs
|
|-- public/
|   |-- index.html
|   |-- style.css
|   |-- app.js
|   |-- auth.js
|   |-- ai-renderer.js
|   |-- bloch.js
|   |-- circuit.js
|   |-- cloud-migration.js
|   |-- generators.js
|   |-- learning.js
|   |-- lessons.js
|   |-- pedagogy.js
|   |-- projects.js
|   |-- quantum.js
|   |-- renderer.js
|   +-- tutor-state.js
|
|-- server.js
|-- package.json
|-- requirements.txt
|-- Dockerfile.vercel
|-- .dockerignore
|-- .gitignore
+-- README.md
```

---

## Environment Variables

Create a `.env` file:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

GROQ_API_KEY=YOUR_GROQ_KEY
GROQ_MODEL=openai/gpt-oss-120b

AI_WORKER_TIMEOUT_MS=20000
AI_RATE_LIMIT_PER_MINUTE=12
```

Do not commit `.env`.

---

## Supabase Database

QubitLab currently uses the following tables:

```text
qubitlab_projects
qubitlab_tutor_messages
qubitlab_learning_profiles
qubitlab_assessments
```

All user-owned tables should have Row Level Security enabled.

Policies should restrict access using:

```sql
auth.uid() = user_id
```

or the equivalent policy for the table.

---

## Docker Setup

Build the development image:

```powershell
docker build `
  -f Dockerfile.vercel `
  -t qubitlab:dev .
```

Run it:

```powershell
docker run `
  --rm `
  --name qubitlab-dev `
  --env-file .env `
  -p 8000:8000 `
  qubitlab:dev
```

Open:

```text
http://localhost:8000
```

Health endpoint:

```text
http://localhost:8000/api/health
```

---

## Development Workflow

A typical validation cycle is:

```text
change code
   |
   v
run deterministic tests
   |
   v
run AI evals
   |
   v
build Docker image
   |
   v
run application
   |
   v
manual smoke test
```

This keeps AI functionality separated from deterministic simulator correctness.

---

## Security Notes

QubitLab follows several basic security principles:

- Groq API keys remain server-side.
- Supabase secret keys are not shipped to the browser.
- Supabase Row Level Security protects user data.
- AI endpoints require authentication.
- AI requests are rate-limited.
- Request payload size is bounded.
- AI workers have execution timeouts.
- provider errors are sanitized before being returned publicly.
- AI-rendered HTML is sanitized using DOMPurify.

---

## Current Limitations

QubitLab is currently an educational MVP.

Notable limitations include:

- simulation is limited to a small number of qubits
- no noisy quantum-device simulation
- no real quantum-hardware execution
- Bloch visualization currently targets single-qubit states
- rate limiting is stored in memory and is designed for a single-server deployment
- AI outputs can still vary despite structured evaluation and validation
- the lesson catalog is currently small

For a horizontally scaled production deployment, shared rate limiting such as Redis should replace the in-memory limiter.

---

## Future Improvements

Possible future work includes:

- larger lesson graph
- prerequisite-aware curriculum planning
- graph-based pedagogy visualization
- interactive 3D Bloch sphere
- circuit drag-and-drop editing
- noise models
- real hardware execution
- richer analytics
- classroom/instructor mode
- collaborative projects
- shared rate limiting
- additional automated eval cases
- continuous integration

---

## Design Philosophy

QubitLab intentionally separates AI reasoning from deterministic quantum execution.

The AI can:

```text
teach
explain
generate
recommend
grade
```

but it does not define physical truth.

The deterministic simulator remains the source of truth for circuit execution.

```text
AI proposes.
Validator checks.
Simulator decides.
```

That separation is the core engineering principle behind QubitLab.
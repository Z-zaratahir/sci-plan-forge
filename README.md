# WhiteCoat — AI Scientist

Turn a scientific hypothesis into a complete, runnable experiment plan in under 60 seconds.

## Architecture

### PDC Fork-Join Parallel Thread Model
WhiteCoat implements a parallel and distributed computing pattern for experiment planning:

- **Fork**: 5 threads start simultaneously (Literature, Protocol, Budget, Timeline, Validation)
- **Sequential dependency**: Materials thread waits for Protocol (data dependency)
- **Join barrier**: Recombiner thread starts only after all 6 threads complete
- **Critical path**: Computed via Kahn's topological sort on the task dependency DAG

### Tech Stack
- Frontend: React + TypeScript + TanStack Router
- Backend: Node.js HTTP server (zero external dependencies)
- AI: Groq (llama3-8b-8192) — all 7 LLM calls
- Search + RAG: Tavily — literature retrieval, protocol grounding, supplier lookup
- Visualization: D3.js (Gantt with critical path), Recharts (budget)
- Storage: localStorage (hypothesis, plan, scientist corrections)

## Setup (any machine)
1. Clone the repo
2. cp .env.example .env
3. Add your keys to .env (get Groq key free at console.groq.com, Tavily at tavily.com)
4. npm install
5. Open TWO terminals:
   - Terminal 1: node server.js
   - Terminal 2: npm run dev
6. Open http://localhost:5173

## Scientist Review Loop
After a plan is generated, visit /review to annotate sections.
Corrections are stored in localStorage and automatically injected as few-shot
examples when generating future plans of the same experiment type.

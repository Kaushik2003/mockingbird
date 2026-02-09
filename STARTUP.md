# Quick Start Guide

This guide will help you run the Mockingbird Treasury system locally.

## Prerequisites

- **Bun** (v1.0+)
- **Docker & Docker Compose** (for PostgreSQL)
- **Node.js** (v18+)

## 1. Setup Environment

Create a `.env` file in `backend/` based on `.env.example`:

```bash
cd backend
cp .env.example .env
```

Ensure `DATABASE_URL` is set:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/mockingbird
OPENAI_API_KEY=sk-... (Required for Agent Logic)
```

## 2. Start Database

```bash
cd backend
docker-compose up -d
```

## 3. Start Backend Services

Open a terminal and run:

```bash
cd backend
bun install
# Start API Server & Orchestrator
bun run src/api.ts & bun run src/orchestrator.ts
```
*Note: You can run them in separate terminals for cleaner logs.*

## 4. Start Frontend

Open a new terminal:

```bash
cd frontend
bun install
bun run dev
```

## 5. Usage Flow

1.  Open `http://localhost:5173`.
2.  **Login** with Anon Aadhaar (simulated locally).
3.  **Verify Identity**: Click "Verify" to generate a commitment and store it on the backend.
4.  **Create Agent**: Click to deploy an autonomous agent.
5.  **Fund Agent**: Send Base Sepolia ETH/USDC to the displayed address.
6.  **Watch Magic**:
    - The backend logs will show the agent detecting the balance/health factor.
    - If you borrow on Aave (manually or via tool), the agent will react to maintain health factor.

## Troubleshooting

- **DB Connection**: Ensure Docker is running and ports match.
- **Agent Not Acting**: Ensure `OPENAI_API_KEY` is valid.
- **CORS**: The API runs on port 3000, Frontend on 5173. CORS is enabled in `api.ts`.

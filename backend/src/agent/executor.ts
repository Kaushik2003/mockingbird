import { ChatOpenAI } from "@langchain/openai";
import { createReActAgent, ReActAgentExecutor } from "langchain/agents";
import { createTools } from "./tools";

// System prompt for the agent
const SYSTEM_PROMPT = `You are a risk-averse treasury manager responsible for an autonomous wallet.
Your primary goal is to maintain a safe Health Factor (HF) > 1.5 on Aave V3 (Base Sepolia).
Current Market Conditions:
- HF > 2.0: Safe to borrow USDC and bridge it to Arc Testnet for commerce opportunities.
- HF < 1.2: DANGER! Must bridge USDC back from Arc and repay debt immediately.
- HF between 1.2 and 2.0: Monitor closely.

You have access to tools to check risk metrics, supply/borrow/repay assets, and bridge funds.
Use these tools to execute your strategy. Always check risk metrics first.`;

export async function createAgentExecutor(walletAddress: string, privateKey: string) {
  // Initialize LLM
  // Use ChatOpenAI for better structured tool use if possible, but ReAct works with standard LLM too.
  const model = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4-turbo-preview" // or gpt-3.5-turbo
  });

  // Create tools bound to this wallet
  const tools = createTools(walletAddress, privateKey);

  // Create the agent using older ReAct pattern for compatibility if needed,
  // or use createReActAgent (LangChain 0.1+ style)
  // createReActAgent(llm, tools, prompt) returns a Runnable.
  // ReActAgentExecutor.fromAgentAndTools uses the older agent interface.

  // For safest bet with modern LangChain and ReAct:
  const { initializeAgentExecutorWithOptions } = await import("langchain/agents");

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "chat-zero-shot-react-description", // Chat variant for ChatOpenAI
    verbose: true,
    agentArgs: {
        prefix: SYSTEM_PROMPT
    }
  });

  return executor;
}

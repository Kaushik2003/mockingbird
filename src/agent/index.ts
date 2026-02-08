import { OpenAI } from "langchain/llms/openai";
import { createReActAgent, ReActAgentExecutor } from "langchain/agents";
import {
  getRiskMetricsTool,
  supplyTool,
  borrowTool,
  repayTool,
  bridgeToArcTool,
} from "./tools";

const model = new OpenAI({ temperature: 0 });
const tools = [
  getRiskMetricsTool,
  supplyTool,
  borrowTool,
  repayTool,
  bridgeToArcTool,
];

const systemPrompt = `You are a risk-averse treasury manager.
Your goal is to maintain a Health Factor > 1.5 on Base Sepolia.
If HF > 2.0, you may borrow USDC and bridge it to Arc for commerce.
If HF < 1.2, you must bridge USDC back from Arc and repay debt.`;

const agent = createReActAgent({
  llm: model,
  tools,
  prefix: systemPrompt,
});

const executor = ReActAgentExecutor.fromAgentAndTools({
  agent,
  tools,
  verbose: true,
});

export default executor;
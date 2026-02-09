import { describe, expect, test, mock } from "bun:test";

// Mock LangChain
mock.module("@langchain/openai", () => ({
  ChatOpenAI: class { constructor() {} }
}));

mock.module("langchain/agents", () => ({
  initializeAgentExecutorWithOptions: async () => ({
    invoke: async () => ({ output: "Agent success" })
  }),
  createReActAgent: () => {},
  ReActAgentExecutor: { fromAgentAndTools: () => {} }
}));

// Mock Tools
mock.module("../src/agent/tools", () => ({
  createTools: () => []
}));

// Mock Viem
mock.module("viem/accounts", () => ({
  generatePrivateKey: () => "0x123",
  privateKeyToAccount: () => ({ address: "0xAgentAddress" })
}));

test("Agent Executor Creation", async () => {
  const { createAgentExecutor } = await import("../src/agent/executor.ts");
  const executor = await createAgentExecutor("0xAddr", "0xKey");
  expect(executor).toBeDefined();

  const res = await executor.invoke({ input: "test" });
  expect(res.output).toBe("Agent success");
});

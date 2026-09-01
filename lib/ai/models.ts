export const DEFAULT_CHAT_MODEL = "openai/gpt-4o";

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
  capabilities: ModelCapabilities;
};

export const titleModel: ChatModel = {
  capabilities: { reasoning: false, tools: true, vision: true },
  description: "Fast model for title generation",
  id: "openai/gpt-4o-mini",
  name: "GPT-4o mini",
  provider: "openai",
};

export const chatModels: ChatModel[] = [
  {
    capabilities: { reasoning: false, tools: true, vision: true },
    description: "Strong general model with vision and tool use",
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openai",
  },
  {
    capabilities: { reasoning: false, tools: true, vision: true },
    description: "Fast and inexpensive model with tool use",
    id: "openai/gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "openai",
  },
  {
    capabilities: { reasoning: false, tools: true, vision: true },
    description: "Latest flagship model with strong coding and tools",
    id: "openai/gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
  },
  {
    capabilities: { reasoning: true, tools: true, vision: true },
    description: "Compact reasoning model",
    id: "openai/o4-mini",
    name: "o4-mini",
    provider: "openai",
    reasoningEffort: "low",
  },
];

export function getCapabilities(): Promise<Record<string, ModelCapabilities>> {
  return Promise.resolve(
    Object.fromEntries(
      chatModels.map((model) => [model.id, model.capabilities])
    )
  );
}

export type GatewayModelWithCapabilities = ChatModel & {
  capabilities: ModelCapabilities;
};

export function getAllGatewayModels(): Promise<GatewayModelWithCapabilities[]> {
  return Promise.resolve(
    chatModels.map((model) => ({
      ...model,
      capabilities: model.capabilities,
    }))
  );
}

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

export const allowedModelIds = new Set(chatModels.map((m) => m.id));

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);

export type ModelAvailability = "healthy" | "impacted" | "unknown";

export function getModelAvailability(
  modelId: string
): Promise<ModelAvailability> {
  return Promise.resolve(allowedModelIds.has(modelId) ? "healthy" : "unknown");
}

export const isDemo = process.env.IS_DEMO === "1";

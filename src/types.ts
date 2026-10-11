/**
 * Data structures persisted by AgentStateDO.
 *
 * The entire agent record is stored in Durable Object storage under a single
 * key (`state`), so every field below is durable across eviction and restart.
 */

/** Lifecycle status of an agent. */
export type AgentStatus = 'idle' | 'running' | 'waiting' | 'completed' | 'failed';

/** Who produced a transcript entry. */
export type AgentMessageRole = 'system' | 'user' | 'assistant' | 'tool';

/** A single entry in the agent's transcript. */
export interface AgentMessage {
  /** Monotonic sequence number within this agent's transcript. */
  seq: number;
  role: AgentMessageRole;
  content: string;
  /** Tool name; present when role is "tool". */
  toolName?: string;
  /** Epoch ms when the message was appended. */
  createdAt: number;
}

/** Cumulative token accounting for an agent. */
export interface AgentUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** The complete state tracked for one agent. */
export interface AgentState {
  /** Stable agent id — also the Durable Object name. */
  id: string;
  /** Current lifecycle status. */
  status: AgentStatus;
  /** Model identifier the agent runs on. */
  model: string;
  /** System prompt / operating instructions. */
  systemPrompt: string;
  /** Conversation transcript, oldest first. */
  messages: AgentMessage[];
  /** Names of tools the agent is allowed to call. */
  tools: string[];
  /** Free-form working memory read and written between steps. */
  memory: Record<string, unknown>;
  /** Number of reasoning steps executed so far. */
  stepCount: number;
  /** Cumulative token usage. */
  usage: AgentUsage;
  /** Last error message; cleared on the next successful step. */
  lastError: string | null;
  /** Epoch ms when the agent record was created. */
  createdAt: number;
  /** Epoch ms of the most recent mutation. */
  updatedAt: number;
}

/** Fields a caller may supply when creating an agent. */
export type AgentStateInit = Partial<Pick<AgentState, 'model' | 'systemPrompt' | 'tools'>>;

/** Build a fresh agent record with sensible defaults. */
export function createAgentState(id: string, init: AgentStateInit = {}): AgentState {
  const now = Date.now();
  return {
    id,
    status: 'idle',
    model: init.model ?? '',
    systemPrompt: init.systemPrompt ?? '',
    messages: [],
    tools: init.tools ?? [],
    memory: {},
    stepCount: 0,
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    lastError: null,
    createdAt: now,
    updatedAt: now,
  };
}

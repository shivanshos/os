import {
  createAgentState,
  type AgentMessage,
  type AgentMessageRole,
  type AgentState,
  type AgentStateInit,
  type AgentUsage,
} from './types';
import type { Env } from './env';

/** Single storage key holding the whole agent record. */
const STATE_KEY = 'state';

/**
 * Durable Object that owns one agent's state.
 *
 * All reads and writes for an agent are serialized through this object, which
 * makes it the single source of truth for that agent's transcript, memory and
 * usage counters.
 */
export class AgentStateDO implements DurableObject {
  private state: AgentState;

  constructor(
    private readonly ctx: DurableObjectState,
    _env: Env,
  ) {
    this.state = createAgentState(ctx.id.name ?? 'unknown');
    // Load (or create) the record before any request is handled.
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<AgentState>(STATE_KEY);
      if (stored) {
        this.state = stored;
      } else {
        await ctx.storage.put(STATE_KEY, this.state);
      }
    });
  }

  /** Persist a new record and stamp its `updatedAt`. */
  private async save(next: AgentState): Promise<AgentState> {
    this.state = { ...next, id: this.state.id, createdAt: this.state.createdAt, updatedAt: Date.now() };
    await this.ctx.storage.put(STATE_KEY, this.state);
    return this.state;
  }

  /** Current state, without touching storage. */
  getState(): AgentState {
    return this.state;
  }

  /** Merge a partial update into the state. */
  async patch(updates: Partial<AgentState>): Promise<AgentState> {
    return this.save({ ...this.state, ...updates });
  }

  /** Append a transcript entry. */
  async appendMessage(role: AgentMessageRole, content: string, toolName?: string): Promise<AgentState> {
    const message: AgentMessage = {
      seq: this.state.messages.length + 1,
      role,
      content,
      ...(toolName ? { toolName } : {}),
      createdAt: Date.now(),
    };
    return this.save({ ...this.state, messages: [...this.state.messages, message] });
  }

  /** Add token usage to the running totals. */
  async addUsage(usage: Partial<AgentUsage>): Promise<AgentState> {
    const current = this.state.usage;
    return this.save({
      ...this.state,
      usage: {
        promptTokens: current.promptTokens + (usage.promptTokens ?? 0),
        completionTokens: current.completionTokens + (usage.completionTokens ?? 0),
        totalTokens: current.totalTokens + (usage.totalTokens ?? 0),
      },
    });
  }

  /** Reset the record back to a fresh state. */
  async reset(init: AgentStateInit = {}): Promise<AgentState> {
    return this.save(createAgentState(this.state.id, init));
  }

  /** HTTP interface used by the Worker. */
  async fetch(request: Request): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'content-type': 'application/json' },
      });

    try {
      if (request.method === 'GET' && (pathname === '/' || pathname === '/state')) {
        return json(this.state);
      }
      if (request.method === 'POST' && pathname === '/state') {
        return json(await this.patch((await request.json()) as Partial<AgentState>));
      }
      if (request.method === 'POST' && pathname === '/messages') {
        const body = (await request.json()) as { role: AgentMessageRole; content: string; toolName?: string };
        return json(await this.appendMessage(body.role, body.content, body.toolName));
      }
      if (request.method === 'POST' && pathname === '/usage') {
        return json(await this.addUsage((await request.json()) as Partial<AgentUsage>));
      }
      if (request.method === 'POST' && pathname === '/reset') {
        return json(await this.reset());
      }
      return json({ error: 'not_found', pathname }, 404);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : String(error) }, 400);
    }
  }
}

/** Bindings available to the Worker at runtime. */
export interface Env {
  /** Durable Object namespace holding per-agent state. */
  AGENT_STATE_DO: DurableObjectNamespace;
}

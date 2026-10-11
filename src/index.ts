import { Hono } from 'hono';
import type { Env } from './env';

export { AgentStateDO } from './agent-state-do';

const app = new Hono<{ Bindings: Env }>();

/** Resolve the Durable Object stub that owns a given agent id. */
function agentStub(env: Env, id: string) {
  return env.AGENT_STATE_DO.get(env.AGENT_STATE_DO.idFromName(id));
}

app.get('/', (c) =>
  c.json({
    name: 'os',
    description: 'Hono Worker + AgentStateDO foundation',
    status: 'ok',
    routes: [
      'GET  /health',
      'GET  /agents/:id/state',
      'POST /agents/:id/state',
      'POST /agents/:id/messages',
      'POST /agents/:id/usage',
      'POST /agents/:id/reset',
    ],
  }),
);

app.get('/health', (c) => c.json({ status: 'ok', time: Date.now() }));

// Forward every /agents/:id/* request to that agent's Durable Object.
app.all('/agents/:id/*', async (c) => {
  const id = c.req.param('id');
  const path = new URL(c.req.url).pathname.replace(`/agents/${id}`, '');
  const stub = agentStub(c.env, id);
  return stub.fetch(new Request(`https://agent-state${path}`, c.req.raw));
});

export default app;

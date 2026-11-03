import type { AeonIdentity } from "./identity";
import type { TenantContext } from "./agent-memory";

export type ToolAccess = "READ" | "WRITE";
export type ToolRisk = "LOW" | "MEDIUM" | "HIGH";

export type GovernedTool = {
  name: string;
  description: string;
  access: ToolAccess;
  risk: ToolRisk;
  requiresApproval: boolean;
  roles?: string[];
  scopes?: string[];
  idempotent?: boolean;
  execute: (context: TenantContext, args: Record<string, unknown>) => Promise<unknown>;
};

function roleAllowed(identity: AeonIdentity, tool: GovernedTool) {
  if (!tool.roles?.length) return true;
  const roles = new Set(identity.roles.map((r) => r.toUpperCase()));
  return tool.roles.some((r) => roles.has(r.toUpperCase()));
}

export class ToolRegistry {
  private readonly tools = new Map<string, GovernedTool>();

  register(tool: GovernedTool) {
    if (this.tools.has(tool.name)) throw new Error(`tool already registered: ${tool.name}`);
    this.tools.set(tool.name, tool);
    return this;
  }

  get(name: string) {
    return this.tools.get(name);
  }

  list() {
    return [...this.tools.values()].map(({ execute: _execute, ...manifest }) => manifest);
  }

  authorize(identity: AeonIdentity, name: string) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`unknown tool: ${name}`);
    if (!roleAllowed(identity, tool)) throw new Error(`role not authorized for tool: ${name}`);
    return tool;
  }
}

export function createDefaultToolRegistry(handlers: Record<string, GovernedTool["execute"]>) {
  const registry = new ToolRegistry();
  const definitions: Array<Omit<GovernedTool, "execute">> = [
    { name: "dashboard.summary", description: "Read the tenant sales dashboard summary.", access: "READ", risk: "LOW", requiresApproval: false },
    { name: "companies.list", description: "List tenant companies.", access: "READ", risk: "LOW", requiresApproval: false },
    { name: "contacts.list", description: "List tenant contacts.", access: "READ", risk: "LOW", requiresApproval: false },
    { name: "deals.list", description: "List tenant deals.", access: "READ", risk: "LOW", requiresApproval: false },
    { name: "deals.findAttention", description: "Find open deals that need attention.", access: "READ", risk: "LOW", requiresApproval: false },
    { name: "companies.create", description: "Create a CRM company.", access: "WRITE", risk: "MEDIUM", requiresApproval: true, idempotent: false },
    { name: "tasks.create", description: "Create a CRM task.", access: "WRITE", risk: "MEDIUM", requiresApproval: true, idempotent: false },
    { name: "deals.updateStage", description: "Change a deal stage.", access: "WRITE", risk: "HIGH", requiresApproval: true, idempotent: true },
  ];
  for (const definition of definitions) {
    const execute = handlers[definition.name];
    if (!execute) throw new Error(`missing handler for tool: ${definition.name}`);
    registry.register({ ...definition, execute });
  }
  return registry;
}

import type { AeonIdentity } from "./identity";
import type { TenantContext } from "./agent-memory";

export type ToolAccess = "READ" | "WRITE";
export type ToolRisk = "LOW" | "MEDIUM" | "HIGH";
export type ToolScope = "crm:read" | "crm:write" | "crm:admin";
export type ToolArgumentValidator = (args: Record<string, unknown>) => void;

export type GovernedTool = {
  name: string;
  description: string;
  access: ToolAccess;
  risk: ToolRisk;
  requiresApproval: boolean;
  roles?: string[];
  scopes?: ToolScope[];
  idempotent?: boolean;
  validate?: ToolArgumentValidator;
  execute: (context: TenantContext, args: Record<string, unknown>) => Promise<unknown>;
};

const roleScopes: Record<string, ToolScope[]> = {
  OWNER: ["crm:read", "crm:write", "crm:admin"],
  ADMIN: ["crm:read", "crm:write", "crm:admin"],
  AGENT: ["crm:read", "crm:write"],
  MEMBER: ["crm:read"],
  SYSTEM: ["crm:read", "crm:write", "crm:admin"],
};

function normalizedRoles(identity: AeonIdentity) {
  return new Set(identity.roles.map((role) => role.trim().toUpperCase()).filter(Boolean));
}

function roleAllowed(identity: AeonIdentity, tool: GovernedTool) {
  if (!tool.roles?.length) return true;
  const roles = normalizedRoles(identity);
  return tool.roles.some((role) => roles.has(role.toUpperCase()));
}

function scopeAllowed(identity: AeonIdentity, tool: GovernedTool) {
  if (!tool.scopes?.length) return true;
  const roles = normalizedRoles(identity);
  const granted = new Set<ToolScope>();
  for (const role of roles) for (const scope of roleScopes[role] ?? []) granted.add(scope);
  return tool.scopes.every((scope) => granted.has(scope));
}

function validateCommon(tool: GovernedTool, args: Record<string, unknown>) {
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === "string" && value.length > 4096) throw new Error(`argument too long: ${key}`);
  }
  tool.validate?.(args);
}

export class ToolRegistry {
  private readonly tools = new Map<string, GovernedTool>();

  register(tool: GovernedTool) {
    if (!tool.name.trim()) throw new Error("tool name is required");
    if (this.tools.has(tool.name)) throw new Error(`tool already registered: ${tool.name}`);
    if (tool.access === "READ" && tool.requiresApproval) throw new Error(`read tool cannot require approval: ${tool.name}`);
    if (tool.access === "WRITE" && !tool.scopes?.length) throw new Error(`write tool must declare scopes: ${tool.name}`);
    this.tools.set(tool.name, tool);
    return this;
  }

  get(name: string) {
    return this.tools.get(name);
  }

  list() {
    return [...this.tools.values()].map(({ execute: _execute, validate: _validate, ...manifest }) => manifest);
  }

  authorize(identity: AeonIdentity, name: string, args: Record<string, unknown> = {}) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`unknown tool: ${name}`);
    if (!roleAllowed(identity, tool)) throw new Error(`role not authorized for tool: ${name}`);
    if (!scopeAllowed(identity, tool)) throw new Error(`scope not authorized for tool: ${name}`);
    validateCommon(tool, args);
    return tool;
  }
}

const nonEmptyString = (field: string): ToolArgumentValidator => (args) => {
  const value = args[field];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
};

export function createDefaultToolRegistry(handlers: Record<string, GovernedTool["execute"]>) {
  const registry = new ToolRegistry();
  const definitions: Array<Omit<GovernedTool, "execute">> = [
    { name: "dashboard.summary", description: "Read the tenant sales dashboard summary.", access: "READ", risk: "LOW", requiresApproval: false, scopes: ["crm:read"] },
    { name: "companies.list", description: "List tenant companies.", access: "READ", risk: "LOW", requiresApproval: false, scopes: ["crm:read"] },
    { name: "contacts.list", description: "List tenant contacts.", access: "READ", risk: "LOW", requiresApproval: false, scopes: ["crm:read"] },
    { name: "deals.list", description: "List tenant deals.", access: "READ", risk: "LOW", requiresApproval: false, scopes: ["crm:read"] },
    { name: "deals.findAttention", description: "Find open deals that need attention.", access: "READ", risk: "LOW", requiresApproval: false, scopes: ["crm:read"] },
    { name: "companies.create", description: "Create a CRM company.", access: "WRITE", risk: "MEDIUM", requiresApproval: true, scopes: ["crm:write"], idempotent: false, validate: nonEmptyString("name") },
    { name: "tasks.create", description: "Create a CRM task.", access: "WRITE", risk: "MEDIUM", requiresApproval: true, scopes: ["crm:write"], idempotent: false, validate: nonEmptyString("title") },
    { name: "deals.updateStage", description: "Change a deal stage.", access: "WRITE", risk: "HIGH", requiresApproval: true, scopes: ["crm:write"], idempotent: true, validate: nonEmptyString("dealQuery") },
  ];
  for (const definition of definitions) {
    const execute = handlers[definition.name];
    if (!execute) throw new Error(`missing handler for tool: ${definition.name}`);
    registry.register({ ...definition, execute });
  }
  return registry;
}

import { describe, expect, it, vi } from "vitest";
import { createDefaultToolRegistry, ToolRegistry, type GovernedTool } from "./tool-registry";

const identity = (roles: string[]) => ({ userId: "user-1", tenantId: "tenant-1", roles });

const handlers = {
  "dashboard.summary": vi.fn(async () => ({ ok: true })),
  "companies.list": vi.fn(async () => []),
  "contacts.list": vi.fn(async () => []),
  "deals.list": vi.fn(async () => []),
  "deals.findAttention": vi.fn(async () => []),
  "companies.create": vi.fn(async () => ({ id: "company-1" })),
  "tasks.create": vi.fn(async () => ({ id: "task-1" })),
  "deals.updateStage": vi.fn(async () => ({ count: 1 })),
};

describe("ToolRegistry", () => {
  it("allows reads for members but blocks writes", () => {
    const registry = createDefaultToolRegistry(handlers);
    expect(registry.authorize(identity(["MEMBER"]), "companies.list").name).toBe("companies.list");
    expect(() => registry.authorize(identity(["MEMBER"]), "companies.create", { name: "Acme" })).toThrow("scope not authorized");
  });

  it("requires approval and write scope for mutations", () => {
    const registry = createDefaultToolRegistry(handlers);
    const tool = registry.authorize(identity(["ADMIN"]), "companies.create", { name: "Acme" });
    expect(tool.access).toBe("WRITE");
    expect(tool.requiresApproval).toBe(true);
  });

  it("rejects malformed write arguments", () => {
    const registry = createDefaultToolRegistry(handlers);
    expect(() => registry.authorize(identity(["ADMIN"]), "companies.create", { name: "" })).toThrow("name is required");
    expect(() => registry.authorize(identity(["ADMIN"]), "companies.create", { name: "x".repeat(4097) })).toThrow("argument too long");
  });

  it("enforces registry invariants at registration time", () => {
    const registry = new ToolRegistry();
    const readWithApproval: GovernedTool = { name: "read.bad", description: "bad", access: "READ", risk: "LOW", requiresApproval: true, scopes: ["crm:read"], execute: async () => null };
    expect(() => registry.register(readWithApproval)).toThrow("read tool cannot require approval");

    const writeWithoutScope: GovernedTool = { name: "write.bad", description: "bad", access: "WRITE", risk: "HIGH", requiresApproval: true, execute: async () => null };
    expect(() => registry.register(writeWithoutScope)).toThrow("write tool must declare scopes");
  });
});

import { describe, expect, it } from "vitest";
import { agentAuditService } from "./agent-audit";
import { tenantCrm } from "./crm-tenant";

describe("tenant isolation guards", () => {
  const tenantA = { tenantId: "tenant-a", userId: "user-a" };
  const tenantB = { tenantId: "tenant-b", userId: "user-b" };

  it("requires a tenant context before CRM access", () => {
    expect(() => tenantCrm.tenant({ tenantId: "", userId: "user-a" })).toThrow("tenant context is required");
  });

  it("keeps tenant identifiers explicit in audit contexts", () => {
    expect(tenantCrm.tenant(tenantA)).toBe("tenant-a");
    expect(tenantCrm.tenant(tenantB)).toBe("tenant-b");
    expect(tenantA.tenantId).not.toBe(tenantB.tenantId);
  });

  it("does not expose an audit mutation API beyond append/list", () => {
    expect(typeof agentAuditService.append).toBe("function");
    expect(typeof agentAuditService.list).toBe("function");
    expect((agentAuditService as Record<string, unknown>).update).toBeUndefined();
    expect((agentAuditService as Record<string, unknown>).delete).toBeUndefined();
  });
});

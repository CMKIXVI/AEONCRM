import { describe, expect, it } from "vitest";
import { tenantCrm } from "./crm-tenant";

describe("tenant isolation boundaries", () => {
  const tenantA = { tenantId: "tenant-a" };
  const tenantB = { tenantId: "tenant-b" };

  it("requires a tenant context", () => {
    expect(() => tenantCrm.tenant(undefined as never)).toThrow("tenant context is required");
    expect(() => tenantCrm.tenant({ tenantId: "" })).toThrow("tenant context is required");
  });

  it("keeps tenant identifiers distinct", () => {
    expect(tenantCrm.tenant(tenantA)).toBe("tenant-a");
    expect(tenantCrm.tenant(tenantB)).toBe("tenant-b");
    expect(tenantCrm.tenant(tenantA)).not.toBe(tenantCrm.tenant(tenantB));
  });
});

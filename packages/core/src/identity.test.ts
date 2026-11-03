import { describe, expect, it } from "vitest";
import { assertIdentity, canApprove } from "./identity";

describe("AEON identity", () => {
  it("requires a user and tenant", () => {
    expect(() => assertIdentity({ userId: "", tenantId: "tenant-1", roles: ["MEMBER"] })).toThrow("identity.userId is required");
    expect(() => assertIdentity({ userId: "user-1", tenantId: "", roles: ["MEMBER"] })).toThrow("identity.tenantId is required");
  });

  it("allows approval only to privileged roles", () => {
    expect(canApprove({ userId: "u", tenantId: "t", roles: ["MEMBER"] })).toBe(false);
    expect(canApprove({ userId: "u", tenantId: "t", roles: ["AGENT"] })).toBe(false);
    expect(canApprove({ userId: "u", tenantId: "t", roles: ["SYSTEM"] })).toBe(false);
    expect(canApprove({ userId: "u", tenantId: "t", roles: ["OWNER"] })).toBe(true);
    expect(canApprove({ userId: "u", tenantId: "t", roles: ["ADMIN"] })).toBe(true);
    expect(canApprove({ userId: "u", tenantId: "t", roles: [" member "] })).toBe(false);
  });
});

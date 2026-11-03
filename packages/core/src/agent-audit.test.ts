import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

type AuditShape = {
  tenantId: string;
  userId: string;
  correlationId: string;
  event: string;
  tool?: string;
  outcome?: string;
  metadata?: unknown;
  previousHash?: string;
  createdAt: Date;
};

function hash(input: AuditShape) {
  return createHash("sha256").update(JSON.stringify({
    ...input,
    createdAt: input.createdAt.toISOString(),
    metadata: input.metadata ?? null,
    previousHash: input.previousHash ?? null,
    tool: input.tool ?? null,
    outcome: input.outcome ?? null,
  })).digest("hex");
}

describe("audit integrity invariants", () => {
  it("changes the hash when a prior event changes", () => {
    const base: AuditShape = {
      tenantId: "tenant-a",
      userId: "user-a",
      correlationId: "corr-1",
      event: "EXECUTED",
      tool: "companies.create",
      outcome: "completed",
      metadata: { recordId: "company-1" },
      createdAt: new Date("2026-11-03T12:00:00.000Z"),
    };
    const first = hash(base);
    const second = hash({ ...base, previousHash: first });
    const tampered = hash({ ...base, previousHash: "tampered" });
    expect(second).not.toBe(tampered);
  });

  it("binds audit hashes to tenant and correlation context", () => {
    const base: AuditShape = {
      tenantId: "tenant-a",
      userId: "user-a",
      correlationId: "corr-1",
      event: "PLANNED",
      createdAt: new Date("2026-11-03T12:00:00.000Z"),
    };
    expect(hash(base)).not.toBe(hash({ ...base, tenantId: "tenant-b" }));
    expect(hash(base)).not.toBe(hash({ ...base, correlationId: "corr-2" }));
  });
});

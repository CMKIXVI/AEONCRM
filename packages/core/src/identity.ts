export type AeonIdentity = {
  userId: string;
  tenantId: string;
  email?: string;
  name?: string;
  roles: string[];
};

const SYSTEM_ROLES = new Set(["SYSTEM", "OWNER", "ADMIN", "AGENT"]);

export function assertIdentity(identity: AeonIdentity): AeonIdentity {
  if (!identity.userId?.trim()) throw new Error("identity.userId is required");
  if (!identity.tenantId?.trim()) throw new Error("identity.tenantId is required");
  return identity;
}

export function canApprove(identity: AeonIdentity): boolean {
  return identity.roles.some((role) => SYSTEM_ROLES.has(role.toUpperCase()));
}

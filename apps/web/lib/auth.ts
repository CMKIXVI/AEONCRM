import type { AeonIdentity } from "@aeoncrm/core";

/**
 * Temporary identity adapter.
 *
 * Production deployments should replace this adapter with the application's
 * verified OIDC/session provider. It deliberately does not trust arbitrary
 * request headers for authorization decisions.
 */
export function getRequestIdentity(request: Request): AeonIdentity {
  const userId = process.env.AEON_SYSTEM_USER_ID;
  const tenantId = process.env.AEON_SYSTEM_TENANT_ID;

  if (!userId || !tenantId) {
    throw new Error("AEON identity provider is not configured");
  }

  return {
    userId,
    tenantId,
    roles: ["SYSTEM"],
    email: undefined,
    name: undefined,
  };
}

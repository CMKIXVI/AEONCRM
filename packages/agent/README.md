# AEON Agent

The agent layer is responsible for natural-language CRM operations.

## Initial responsibilities

1. Interpret user intent.
2. Select approved CRM tools.
3. Enforce permission and approval boundaries.
4. Execute operations through typed service interfaces.
5. Explain results and proposed next actions.

The agent must not access the database directly. All mutations go through governed CRM services/tools.

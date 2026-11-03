# AEONCRM Competitive AI-CRM Capability Model

## Purpose

AEONCRM uses the current AI-CRM market as a capability benchmark. The goal is not to copy Clarify, HubSpot, Attio, Zoho, folk or other vendors. The goal is to ensure AEONCRM does not stop at a conventional CRM plus a chat box.

## Benchmark observations

### Clarify

Clarify demonstrates an AI-native model in which email, calendar, calls and meetings continuously populate CRM context. Its Rep agent can update records, handle follow-up work, answer questions and run saved workflows. Clarify also exposes an MCP server for external AI assistants such as ChatGPT and Claude.

AEONCRM response:

- Build autonomous email/calendar/meeting capture.
- Extract structured CRM facts from conversations.
- Create follow-up tasks and recommended actions automatically.
- Support reusable agent skills and scheduled/event-triggered execution.
- Expose AEONCRM through MCP with scoped authorization.
- Also consume external MCP servers through a governed connector layer.

### HubSpot

HubSpot's ChatGPT connector demonstrates the importance of natural-language access to a broad CRM object graph. Current capabilities include contacts, companies, deals, tickets, products, line items, quotes, invoices, orders, carts, subscriptions, lists and engagement history, plus write actions and deep research over customer context.

AEONCRM response:

- Expand the domain model beyond sales records.
- Support arbitrary associations between CRM objects.
- Provide read/write agent tools for core and extended objects.
- Add tickets/service workflows and commercial objects.
- Add deep-research workflows with explicit source authorization.
- Preserve permission checks and audit attribution on every action.

### Attio

Attio demonstrates flexible CRM data modeling combined with MCP access, natural-language search/update, tasks, notes, email and meeting data.

AEONCRM response:

- Custom objects and custom fields.
- Generic association model.
- MCP tool discovery.
- Natural-language record operations.
- Flexible workspace-specific CRM schemas.

### Zoho CRM

Zoho demonstrates a broad MCP model with separate capability areas for data insights and data operations, including bulk operations, lead conversion and duplicate detection.

AEONCRM response:

- Separate read/analysis and write/mutation tool classes.
- Bulk operations with bounded batch sizes.
- Lead conversion as a first-class workflow.
- Duplicate detection and merge review.
- Explicit approval policies for high-impact bulk mutations.

### folk

folk demonstrates the value of relationship-centric CRM workflows and AI-assisted enrichment/custom fields for small teams.

AEONCRM response:

- Relationship intelligence.
- Contact/company enrichment.
- AI-populated custom fields.
- Lightweight founder/consultant workflows without requiring enterprise complexity.

### Pipedrive / Close / Salesflare / monday CRM

These products reinforce several practical capabilities: visual pipeline management, sales communications, call/email capture, AI summaries, automation and sales execution workflows.

AEONCRM response:

- Visual and configurable pipelines.
- Communication capture.
- Call and meeting summaries.
- Automated follow-up.
- Sequences/campaigns.
- Sales activity intelligence.

## AEONCRM target capability stack

```text
                    AEONCRM
                       |
        +--------------+--------------+
        |                             |
   Agent Operating System       CRM System of Record
        |                             |
  Planner / Skills / Memory     Objects / Associations
  Signals / Research            Companies / Contacts
  Schedules / Triggers          Leads / Deals / Tickets
  Approvals / Policies          Products / Quotes / Files
        |                        Custom Objects / Fields
        +--------------+--------------+
                       |
                Governed Tool Layer
                       |
       +---------------+----------------+
       |               |                |
      MCP             REST             A2A
       |               |                |
 External AI       Applications      Other Agents
 Assistants        & Integrations
       |
       +--------------------------------+
                       |
                Connector Fabric
                       |
 Email / Calendar / WhatsApp / Slack / GitHub
 HubSpot / Salesforce / Zoho / Attio / Clarify
 folk / Pipedrive / monday / Close / Salesflare
 OOPSCRM / Webhooks / Zapier / Make / n8n
```

## Non-negotiable AEONCRM differentiators

1. **Agent-first architecture** — agents are native operators of the CRM, not an accessory UI.
2. **Open interoperability** — MCP, REST/OpenAPI and A2A are first-class protocol surfaces.
3. **Bidirectional MCP** — AEONCRM both exposes tools and consumes authorized external tools.
4. **Autonomous data capture** — CRM records should update from business activity without manual logging.
5. **Governed autonomy** — permissions, tenant boundaries, approval policies, idempotency and audit trail surround every mutation.
6. **Composable CRM model** — custom objects, fields and relationships prevent vendor-specific rigidity.
7. **Cross-system intelligence** — agents can reason over CRM data and authorized external systems while keeping provenance.
8. **Human control** — users can inspect proposed changes, approve high-impact actions and understand why an agent acted.

## Capability priority

### P0 — must have

- Tenant isolation
- Authentication and authorization
- Agent read/write tools
- Approval and audit framework
- MCP server
- Email/calendar ingestion
- Companies, contacts, leads, deals, activities and tasks
- Search and natural-language command center
- Next-best-action and deal-risk signals

### P1 — competitive parity

- Tickets
- Products / line items / quotes / subscriptions
- Custom objects and fields
- Relationship intelligence
- Conversation transcription and extraction
- Duplicate detection
- Enrichment
- Sequences and campaigns
- Deep research
- External MCP client
- Generic REST connector

### P2 — advanced agentic CRM

- Autonomous sales agents
- Multi-agent delegation
- Trigger-based skills
- Scheduled workflows
- Prospecting agents
- Customer health/churn/expansion agents
- Cross-system business process agents
- A2A collaboration

## Security rule for competitive features

No competitive feature is considered complete if it bypasses AEONCRM governance. External connectors, MCP tools, deep research, bulk actions and autonomous agents must inherit tenant, user, role, scope, approval, rate-limit, retention and audit controls.

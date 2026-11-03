# AEONCRM Roadmap

AEONCRM is designed as an **agentic CRM operating system**, not merely a CRM with a chatbot. Competitive research across Clarify, HubSpot, Attio, Zoho, folk and other AI-native CRM products is treated as a capability input, while AEONCRM remains differentiated by its agent-first domain, governed tools, MCP/REST/A2A protocols, tenant isolation and open integration architecture.

## Phase 0 — Foundation

- [x] Repository initialized
- [x] Monorepo boundaries defined
- [x] Architecture documented
- [ ] CI and quality gates

## Phase 1 — CRM Core

- [x] Prisma schema foundation
- [x] Tenants and users foundation
- [x] Companies
- [x] Contacts
- [ ] Leads and lead conversion
- [ ] Deals and configurable pipelines
- [x] Activities and tasks
- [ ] Notes and files
- [ ] Relationship timeline
- [ ] Tickets / customer issues
- [ ] Products, line items, quotes and subscriptions
- [ ] Custom objects and custom fields
- [ ] Associations between arbitrary CRM objects

## Phase 2 — Web Application

- [x] Next.js application shell
- [ ] Authentication
- [x] Dashboard
- [x] Agent console
- [x] Company workspace
- [x] Contact workspace
- [x] Deal pipeline
- [x] Activities and tasks
- [ ] Reports and configurable dashboards
- [ ] Administration
- [ ] Global search and command center

## Phase 3 — Agent

- [x] Agent runtime abstraction
- [x] CRM read tools
- [x] CRM write tools foundation
- [x] Planning and tool selection foundation
- [x] Memory foundation
- [ ] Persistent semantic memory and retrieval
- [ ] Permission-aware tool execution
- [x] Approval workflow foundation
- [ ] Atomic/idempotent approval execution
- [ ] Audit trail
- [ ] Autonomous workflow/skill engine
- [ ] Scheduled and event-triggered agents
- [ ] Multi-agent delegation
- [ ] Human-in-the-loop checkpoints
- [ ] Agent-generated sales briefings

## Phase 4 — Protocols

- [ ] First-party MCP server
- [ ] External MCP client/connectors
- [ ] REST/OpenAPI
- [ ] A2A boundary
- [ ] API authentication and scopes
- [ ] OAuth/OIDC connector authorization
- [ ] Tool discovery and capability manifests

## Phase 5 — Intelligence

- [ ] Semantic CRM search
- [ ] Deep research over CRM + approved external sources
- [ ] Deal risk detection
- [ ] Engagement/signal detection
- [ ] Next-best-action
- [ ] Pipeline intelligence and forecasting
- [ ] Relationship intelligence
- [ ] ICP matching and lead scoring
- [ ] Duplicate detection and data quality agent
- [ ] Automatic enrichment from approved sources
- [ ] Conversation/email/meeting summarization
- [ ] Automatic CRM field extraction
- [ ] Automatic deal-stage recommendations
- [ ] Customer/account health
- [ ] Churn and expansion signals
- [ ] AI-generated reports and dashboards

## Phase 6 — Revenue & Engagement

- [ ] Email capture and sync
- [ ] Calendar sync and meeting capture
- [ ] Call/transcript ingestion
- [ ] Personalized outreach generation
- [ ] Follow-up automation
- [ ] Sequences/campaigns
- [ ] Marketing campaign analytics
- [ ] WhatsApp
- [ ] Customer support/ticket workflows
- [ ] Prospecting workspace
- [ ] Lead routing and assignment

## Phase 7 — Integrations

- [ ] OOPSCRM connector
- [ ] Gmail / Outlook
- [ ] Google Calendar / Microsoft Calendar
- [ ] Slack
- [ ] WhatsApp Business
- [ ] GitHub
- [ ] HubSpot import/export + connector
- [ ] Salesforce import/export + connector
- [ ] Zoho CRM connector
- [ ] Attio connector
- [ ] Clarify connector
- [ ] folk connector
- [ ] Pipedrive connector
- [ ] monday CRM connector
- [ ] Close connector
- [ ] Salesflare connector
- [ ] Generic REST connector
- [ ] Generic MCP connector
- [ ] Webhooks
- [ ] Zapier / Make / n8n compatibility

## Phase 8 — Production

- [ ] Docker Compose
- [ ] Database migrations and migration verification
- [ ] Automated tenant-isolation tests
- [ ] Unit/integration/end-to-end test suites
- [ ] Observability
- [ ] Audit/event logging
- [ ] Rate limiting
- [ ] Backup/restore
- [ ] Security hardening
- [ ] Data retention and deletion policies
- [ ] Secrets management
- [ ] Disaster recovery
- [ ] Coolify deployment
- [ ] Production documentation
- [ ] SLA/SLO and operational runbooks

## Competitive capability principles

AEONCRM should reach or exceed the useful capabilities demonstrated by modern AI-native CRMs without copying their product boundaries:

1. **AI-native capture** — email, calendar, meetings and conversations should update CRM context automatically rather than requiring manual logging.
2. **Natural-language read/write** — users and external AI assistants should be able to query and act on CRM data through governed tools.
3. **MCP interoperability** — AEONCRM should both expose its own MCP server and consume authorized external MCP servers.
4. **Signals and next actions** — the system should proactively identify stalled deals, buying signals, risks and recommended actions.
5. **Deep research** — agents should combine CRM context with explicitly authorized external research sources.
6. **Broad object model** — CRM must grow beyond contacts/companies/deals into leads, tickets, products, line items, quotes, subscriptions, campaigns, custom objects and associations.
7. **Agentic execution** — skills, schedules, triggers, approvals and multi-step workflows should allow agents to operate the CRM, not merely answer questions.
8. **Governed interoperability** — every connector and protocol must preserve tenant isolation, user permissions, scopes, approvals and auditability.

Competitive capabilities are inputs to the roadmap, not a requirement to reproduce another vendor's UI or implementation.

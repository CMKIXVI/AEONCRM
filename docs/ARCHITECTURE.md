# AEONCRM Architecture

## Product layers

### 1. Experience

The web application provides the dashboard, agent console, CRM records, pipeline, activities, reports, administration, and responsive mobile views.

### 2. Agent

The AEON Agent is a first-class application capability. It converts natural-language requests into validated plans and tool calls. Every write operation is subject to authorization and, where configured, approval policy.

### 3. Domain

The CRM domain owns companies, contacts, leads, deals, pipelines, activities, tasks, notes, files, relationships and timeline events. Domain services are independent of the web UI and external connectors.

### 4. Protocols

- MCP: tool interface for AI agents.
- REST/OpenAPI: conventional application and integration API.
- A2A: boundary for agent-to-agent collaboration.

### 5. Intelligence

PostgreSQL stores transactional state. pgvector supports semantic retrieval for CRM memory and knowledge. Agent memory must remain scoped by tenant, user, permissions and retention policy.

### 6. Governance

All sensitive actions pass through authorization. High-impact operations can require approval. Agent actions produce audit events containing actor, intent, tool, target, result and timestamp.

### 7. Integrations

External systems are adapters. OOPSCRM is an optional connector and must not be required for native AEONCRM operation.

## Design rules

1. The domain model is the source of truth for native CRM records.
2. Agents use tools; they do not receive unrestricted database access.
3. Reads and writes are permission-aware.
4. Destructive or high-impact actions are approval-aware.
5. Every agent write is auditable.
6. External connectors cannot silently bypass governance.
7. Protocol implementations call domain services rather than duplicating business rules.
8. The web UI and agents consume the same domain APIs.

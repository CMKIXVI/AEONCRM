# AEONCRM

**The Agentic CRM Operating System**

> Humans manage relationships. Agents operate the CRM.

AEONCRM is a unified, agent-first CRM platform combining CRM operations, AI agents, MCP, REST/OpenAPI, A2A, memory, intelligence, governance, and integrations in one deployable project.

## Vision

AEONCRM is not a chatbot added to a traditional CRM. The agent is a first-class interface and operator of the CRM, while the structured web application remains available for inspection, editing, reporting, and administration.

## Core capabilities

- Companies, contacts, leads, deals and pipelines
- Activities, tasks, notes, files and relationship timelines
- AI agent with planning, tools, memory and guardrails
- MCP tools for agent-to-CRM operations
- REST/OpenAPI API
- Agent-to-agent (A2A) integration boundary
- Approval workflows and audit trail
- Semantic search and CRM intelligence
- External integrations, including OOPSCRM
- Docker-first deployment

## Architecture

```text
                         AEONCRM
                            |
                 +----------+----------+
                 |                     |
             Human UI              AEON Agent
                 |                     |
                 +----------+----------+
                            |
                    Agent Runtime
                            |
          +-----------------+-----------------+
          |                 |                 |
         MCP              REST              A2A
          |                 |                 |
          +-----------------+-----------------+
                            |
                       CRM Core
                            |
             +--------------+--------------+
             |              |              |
        PostgreSQL       pgvector       Object Store
```

## Initial technology direction

- Next.js + TypeScript
- PostgreSQL + pgvector
- Prisma
- Redis
- OpenAI-powered agent runtime
- MCP + REST/OpenAPI + A2A
- Docker Compose
- Coolify-ready deployment

## Repository structure

```text
apps/web                 Web application
packages/core            CRM domain and business logic
packages/agent           Agent runtime, planning and memory
packages/mcp             MCP server and CRM tools
packages/api             REST/OpenAPI surface
packages/a2a             Agent-to-agent protocol boundary
packages/governance      Permissions, approvals and audit
packages/integrations    External systems and connectors
packages/ui              Shared UI components
packages/db              Prisma schema and database access
infra                    Docker and deployment configuration
docs                     Architecture and product documentation
```

## Development principle

AEONCRM owns its CRM domain model. External systems such as OOPSCRM are connectors rather than mandatory dependencies. This keeps the platform portable and allows the agent to operate against both native AEONCRM data and approved external CRM systems.

## Status

**Phase 0 — Foundation initialized.**

The next milestones are the monorepo scaffold, CRM schema, web shell, agent runtime, MCP tools, API, governance, integrations, tests, and production deployment.

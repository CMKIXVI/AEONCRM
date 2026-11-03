"use client";

import { FormEvent, useEffect, useState } from "react";

type Message = {
  id: string;
  role: "USER" | "ASSISTANT" | "TOOL" | "SYSTEM";
  content: string;
  intent?: string | null;
  tool?: string | null;
  requiresApproval?: boolean;
  approved?: boolean;
  metadata?: unknown;
  createdAt: string;
  approval?: Approval | null;
};

type Approval = {
  id: string;
  tool: string;
  arguments: Record<string, unknown>;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED";
  createdAt: string;
};

type Conversation = {
  id: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED";
  updatedAt: string;
  messages?: Message[];
  approvals?: Approval[];
};

type AgentResult = {
  message?: string;
  status?: string;
  conversationId?: string;
  approvalId?: string;
  plan?: { explanation?: string; tool?: string; arguments?: Record<string, unknown> };
  data?: unknown;
};

const commands = [
  "Show my sales",
  "Which opportunities need attention?",
  "List my companies",
  "List my deals",
  "Create THIRU'S BIRIYANI as a prospect",
];

export default function AgentPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<Conversation | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadConversations(selectFirst = true) {
    const response = await fetch("/api/agent/conversations", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load conversations");
    const items = body.conversations ?? [];
    setConversations(items);
    if (selectFirst && items.length && !activeId) setActiveId(items[0].id);
  }

  async function loadConversation(id: string) {
    const response = await fetch(`/api/agent/conversations/${id}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load conversation");
    setActive(body.conversation);
  }

  useEffect(() => {
    void (async () => {
      try {
        await loadConversations();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load conversations");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeId) {
      setActive(null);
      return;
    }
    void loadConversation(activeId).catch((e) => setError(e instanceof Error ? e.message : "Could not load conversation"));
  }, [activeId]);

  async function newConversation() {
    setError("");
    const response = await fetch("/api/agent/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New conversation" }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not create conversation");
    setConversations((items) => [body.conversation, ...items]);
    setActiveId(body.conversation.id);
    setQuery("");
  }

  async function run(message = query) {
    if (!message.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), conversationId: activeId ?? undefined }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Agent request failed");
      if (body.conversationId) setActiveId(body.conversationId);
      setQuery("");
      await loadConversations(false);
      if (body.conversationId) await loadConversation(body.conversationId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Agent request failed");
    } finally {
      setSending(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    await run();
  }

  async function approve(id: string, action: "approve" | "reject") {
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/agent/approvals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Approval action failed");
      if (activeId) await loadConversation(activeId);
      await loadConversations(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval action failed");
    } finally {
      setSending(false);
    }
  }

  const messages = active?.messages ?? [];
  const pending = active?.approvals?.filter((item) => item.status === "PENDING") ?? [];

  return (
    <main className="main" style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
      <header className="top">
        <div>
          <h1 className="title">AEON Agent</h1>
          <div className="subtitle">Your CRM, operated through persistent, governed agents.</div>
        </div>
        <a href="/">Dashboard</a>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: 16, marginTop: 20 }}>
        <aside className="panel" style={{ minHeight: 650 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Conversations</h3>
            <button onClick={() => void newConversation()} disabled={sending}>New</button>
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
            {loading && <div className="muted">Loading…</div>}
            {!loading && conversations.length === 0 && <div className="muted">No conversations yet.</div>}
            {conversations.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveId(item.id)}
                style={{ textAlign: "left", padding: 12, borderRadius: 10, border: item.id === activeId ? "2px solid currentColor" : "1px solid #ddd", background: item.id === activeId ? "rgba(127,127,127,.08)" : "transparent" }}
              >
                <div style={{ fontWeight: 650 }}>{item.title}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{new Date(item.updatedAt).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="agent" style={{ minHeight: 650, display: "flex", flexDirection: "column" }}>
          <div style={{ borderBottom: "1px solid #ddd", paddingBottom: 14 }}>
            <h2 style={{ margin: 0 }}>{active?.title || "AEON Agent"}</h2>
            <p className="muted" style={{ marginBottom: 0 }}>Ask questions, inspect CRM intelligence, or propose an action. Mutations require explicit approval.</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "18px 4px", display: "grid", gap: 12 }}>
            {!active && <div className="muted">Select a conversation or start a new one.</div>}
            {messages.map((message) => (
              <div key={message.id} style={{ padding: 14, borderRadius: 12, border: "1px solid #ddd", background: message.role === "USER" ? "rgba(127,127,127,.08)" : "transparent", marginLeft: message.role === "USER" ? "12%" : 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", opacity: .65 }}>{message.role}</div>
                <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{message.content}</div>
                {message.tool && <div className="muted" style={{ marginTop: 8 }}>Tool: {message.tool}</div>}
              </div>
            ))}
            {messages.length === 0 && active && <div className="muted">Start the conversation below.</div>}
          </div>

          {pending.length > 0 && (
            <div className="panel" style={{ marginBottom: 14, border: "1px solid currentColor" }}>
              <h3 style={{ marginTop: 0 }}>Pending approvals</h3>
              {pending.map((approval) => (
                <div key={approval.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "10px 0", borderTop: "1px solid #ddd" }}>
                  <div>
                    <strong>{approval.tool}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>{JSON.stringify(approval.arguments)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => void approve(approval.id, "reject")} disabled={sending}>Reject</button>
                    <button onClick={() => void approve(approval.id, "approve")} disabled={sending}>Approve &amp; Execute</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form className="agentbox" onSubmit={submit}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Show my sales pipeline" disabled={sending} />
            <button disabled={sending || !query.trim()}>{sending ? "Working…" : "Run Agent"}</button>
          </form>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {commands.map((command) => <button key={command} onClick={() => { setQuery(command); void run(command); }} disabled={sending}>{command}</button>)}
          </div>
          {error && <div className="agentmessage" style={{ marginTop: 12 }}>{error}</div>}
        </section>
      </div>
    </main>
  );
}

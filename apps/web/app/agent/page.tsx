"use client";

import { FormEvent, useState } from "react";

type AgentResult = {
  intent?: string;
  message?: string;
  requiresApproval?: boolean;
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
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState("");

  async function run(message = query, approval = false) {
    if (!message.trim()) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: message.trim(), approved: approval }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Agent request failed");
      setResult(body.data ?? body); setApproved(approval);
    } catch (e) { setError(e instanceof Error ? e.message : "Agent request failed"); }
    finally { setLoading(false); }
  }

  function submit(e: FormEvent) { e.preventDefault(); void run(); }

  return <main className="main" style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
    <header className="top"><div><h1 className="title">AEON Agent</h1><div className="subtitle">Your CRM, operated through governed agents.</div></div><a href="/">Dashboard</a></header>
    <section className="agent" style={{ marginTop: 24 }}>
      <h2>What should AEON do?</h2>
      <p>Ask questions, inspect CRM intelligence, or propose an action. Changes require explicit approval.</p>
      <form className="agentbox" onSubmit={submit}><input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. Show my sales pipeline" /><button disabled={loading}>{loading ? "Running…" : "Run Agent"}</button></form>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>{commands.map(c => <button key={c} onClick={() => { setQuery(c); void run(c); }} disabled={loading}>{c}</button>)}</div>
    </section>
    {error && <div className="agentmessage">{error}</div>}
    {result && <section className="grid" style={{ marginTop: 20 }}>
      <div className="panel"><h3>Agent response</h3><p>{result.message || "Execution completed."}</p>{result.intent && <div className="muted">Intent: {result.intent}</div>}{result.data != null && <pre style={{ whiteSpace: "pre-wrap", overflow: "auto", marginTop: 16 }}>{JSON.stringify(result.data, null, 2)}</pre>}</div>
      <div className="panel"><h3>{result.requiresApproval ? "Approval required" : "Execution trace"}</h3>{result.plan ? <><p>{result.plan.explanation || "AEON prepared an action."}</p><div className="muted">Tool: {result.plan.tool || "—"}</div>{result.requiresApproval && !approved && <button style={{ marginTop: 16 }} onClick={() => void run(query, true)} disabled={loading}>Approve &amp; Execute</button>}</> : <p className="muted">No pending mutation. The request completed within the current read-only boundary.</p>}</div>
    </section>}
  </main>;
}

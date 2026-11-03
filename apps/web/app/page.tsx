"use client";

import { useEffect, useState } from "react";

type Dashboard = { pipelineValue: number; wonRevenue: number; openDeals: number; followUps: number; companies: number; contacts: number };
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export default function Home() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((body) => setData(body.data ?? body)).catch(() => setMessage("Unable to load live CRM data.")).finally(() => setLoading(false));
  }, []);

  const askAgent = () => { if (query.trim()) setMessage(`AEON received: “${query.trim()}”. Agent execution will be connected next.`); };
  const stats = [["Pipeline", data ? money(data.pipelineValue) : "—"], ["Won revenue", data ? money(data.wonRevenue) : "—"], ["Open deals", data ? String(data.openDeals) : "—"], ["Follow-ups", data ? String(data.followUps) : "—"]];

  return <div className="shell">
    <aside className="sidebar"><div className="brand">AEONCRM</div><div className="tagline">Agentic CRM Operating System</div><nav className="nav">
      <a className="active" href="#"><span>⌂ Dashboard</span></a><a href="#agent"><span>◎ Agent</span></a><a href="#companies"><span>◈ Companies</span></a><a href="#contacts"><span>◉ Contacts</span></a><a href="#deals"><span>◆ Deals</span></a><a href="#tasks"><span>✓ Tasks</span></a><a href="#reports"><span>▣ Reports</span></a><a href="#settings"><span>⚙ Settings</span></a>
    </nav></aside>
    <main className="main"><header className="top"><div><h1 className="title">Good afternoon</h1><div className="subtitle">Your CRM, operated by agents.</div></div><strong>AE</strong></header>
      <section className="agent" id="agent"><h2>🤖 Ask AEON Agent</h2><p>Search your CRM, analyze sales, create records, and take approved actions using natural language.</p><div className="agentbox"><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askAgent()} placeholder={'Try “Show my sales pipeline”'} /><button onClick={askAgent}>Ask Agent</button></div>{message && <div className="agentmessage">{message}</div>}</section>
      <section className="cards">{stats.map(([label, value]) => <div className="card" key={label}><div className="label">{label}</div><div className="value">{loading ? "Loading…" : value}</div></div>)}</section>
      <section className="grid"><div className="panel"><h3>Live CRM snapshot</h3><div className="item"><strong>{data?.companies ?? "—"} companies</strong><div className="muted">Accounts currently stored in AEONCRM.</div></div><div className="item"><strong>{data?.contacts ?? "—"} contacts</strong><div className="muted">People connected to your CRM accounts.</div></div><div className="item"><strong>{data?.openDeals ?? "—"} open opportunities</strong><div className="muted">Pipeline requiring active sales attention.</div></div></div>
        <div className="panel"><h3>Priority actions</h3><div className="item"><strong>Review open opportunities</strong><div className="muted">Use AEON Agent to identify deals at risk.</div></div><div className="item"><strong>Complete follow-ups</strong><div className="muted">{data?.followUps ?? "—"} activities currently due.</div></div><div className="item"><strong>Prepare sales briefing</strong><div className="muted">Ask AEON to generate your next briefing.</div></div></div></section>
    </main></div>;
}

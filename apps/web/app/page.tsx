"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive, Bot, Check, ChevronDown, Command, Copy, FileText, Folder, Globe2, Menu,
  MoreHorizontal, Paperclip, PanelRight, Plus, Search, Send, Settings2, Sparkles,
  Star, ThumbsDown, ThumbsUp, Trash2, Upload, Users, WandSparkles, X, Zap
} from "lucide-react";

type Message = { id: string; role: "user" | "assistant"; text: string; status?: "working" | "done" };
type Conversation = { id: string; title: string; folder: string; pinned?: boolean; messages: Message[] };

type AgentResult = {
  intent?: string; requiresApproval?: boolean; explanation?: string; result?: unknown;
  plan?: { explanation?: string; arguments?: Record<string, unknown> }; error?: string;
};

const initialConversations: Conversation[] = [
  { id: "welcome", title: "Sales intelligence workspace", folder: "Today", pinned: true, messages: [
    { id: "m1", role: "assistant", text: "Welcome to AEONCRM. I can search your CRM, reason across business context, and execute governed actions. What would you like to accomplish?", status: "done" }
  ] },
  { id: "pipeline", title: "Pipeline review", folder: "Today", messages: [
    { id: "m2", role: "user", text: "Show me the biggest opportunities that need attention." },
    { id: "m3", role: "assistant", text: "I can analyze your open opportunities and surface stalled or high-value deals.", status: "done" }
  ] },
  { id: "account", title: "Enterprise account planning", folder: "Sales", messages: [] },
  { id: "briefing", title: "Executive sales briefing", folder: "Sales", messages: [] },
];

const agents = ["CRM Agent", "Sales Agent", "Executive Agent", "Research Agent", "Data Analyst"];
const models = ["Auto · Best for task", "GPT · Fast", "Claude · Reasoning", "Gemini · Long context"];

function resultText(result: unknown): string {
  if (!result) return "Done.";
  if (typeof result === "string") return result;
  if (Array.isArray(result)) return result.slice(0, 8).map((item: any) => item.name ?? item.title ?? JSON.stringify(item)).join("\n");
  const value = result as any;
  if (value.openPipelineValue !== undefined) return `Pipeline ${value.openPipelineValue} · Won ${value.wonRevenue} · ${value.openDeals} open deals · ${value.followUps} follow-ups`;
  return JSON.stringify(result, null, 2);
}

export default function Home() {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState("welcome");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [agent, setAgent] = useState("CRM Agent");
  const [model, setModel] = useState(models[0]);
  const [showContext, setShowContext] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [attachments, setAttachments] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const active = conversations.find((item) => item.id === activeId) ?? conversations[0];

  const visibleConversations = useMemo(() => conversations.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())), [conversations, search]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "k") { event.preventDefault(); document.getElementById("global-search")?.focus(); }
      if (mod && event.key.toLowerCase() === "n") { event.preventDefault(); newConversation(); }
      if (mod && event.key === "Enter") { event.preventDefault(); void sendMessage(); }
      if (event.key === "Escape") { setShowSidebar(false); setShowContext(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function newConversation() {
    const id = crypto.randomUUID();
    setConversations((items) => [{ id, title: "New conversation", folder: "Today", messages: [] }, ...items]);
    setActiveId(id); setResult(null); setQuery(""); inputRef.current?.focus();
  }

  function addMessage(message: Message) {
    setConversations((items) => items.map((item) => item.id === activeId ? { ...item, title: item.title === "New conversation" ? message.text.slice(0, 42) : item.title, messages: [...item.messages, message] } : item));
  }

  async function sendMessage() {
    const text = query.trim();
    if (!text || agentLoading) return;
    setQuery(""); setResult(null);
    addMessage({ id: crypto.randomUUID(), role: "user", text });
    const workingId = crypto.randomUUID();
    addMessage({ id: workingId, role: "assistant", text: "Working across your AEONCRM context…", status: "working" });
    setAgentLoading(true);
    try {
      const response = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      const body = await response.json();
      const data = body.data ?? body;
      setResult(data);
      setConversations((items) => items.map((item) => item.id === activeId ? { ...item, messages: item.messages.map((m) => m.id === workingId ? { ...m, text: data.error ?? data.explanation ?? resultText(data.result) || (data.requiresApproval ? data.plan?.explanation ?? "Approval required before execution." : "Completed."), status: "done" } : m) } : item));
    } catch {
      setConversations((items) => items.map((item) => item.id === activeId ? { ...item, messages: item.messages.map((m) => m.id === workingId ? { ...m, text: "I couldn't reach the AEON Agent runtime. Please retry.", status: "done" } : m) } : item));
    } finally { setAgentLoading(false); }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    setAttachments((items) => [...items, ...Array.from(files).map((file) => file.name)]);
  }

  return <div className="chat-shell">
    <aside className={`chat-sidebar ${showSidebar ? "open" : ""}`}>
      <div className="sidebar-head"><div className="aeon-mark"><Sparkles size={15}/></div><div><strong>AEONCRM</strong><span>AI operating system</span></div><button className="icon-btn mobile-only" onClick={() => setShowSidebar(false)}><X size={17}/></button></div>
      <button className="new-chat" onClick={newConversation}><Plus size={17}/> New conversation <span>⌘N</span></button>
      <div className="sidebar-search"><Search size={15}/><input id="global-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations"/><kbd>⌘K</kbd></div>
      <div className="sidebar-section"><div className="section-label">Workspace <ChevronDown size={13}/></div><button className="workspace-row"><div className="workspace-icon"><Users size={15}/></div><div><b>Enterprise Sales</b><span>CRM · Knowledge · Agents</span></div><MoreHorizontal size={15}/></button></div>
      <div className="sidebar-section conversation-list"><div className="section-label">Conversations <span>{visibleConversations.length}</span></div>{visibleConversations.map((item) => <button key={item.id} className={`conversation-row ${item.id === activeId ? "active" : ""}`} onClick={() => { setActiveId(item.id); setShowSidebar(false); }}><span className="conv-icon">{item.pinned ? <Star size={13}/> : <FileText size={13}/>}</span><span>{item.title}</span>{item.pinned && <span className="pin-dot"/>}</button>)}</div>
      <div className="sidebar-section folders"><div className="section-label">Workspace areas</div><button><Folder size={15}/> Sales</button><button><Folder size={15}/> Customer success</button><button><Folder size={15}/> Research</button></div>
      <div className="sidebar-foot"><button><Settings2 size={16}/> Settings</button><button><Archive size={16}/> Archived</button><div className="profile"><div>CM</div><span><b>Chandra</b><small>Administrator</small></span><MoreHorizontal size={16}/></div></div>
    </aside>

    <main className="chat-main">
      <header className="chat-header"><div className="header-left"><button className="icon-btn mobile-only" onClick={() => setShowSidebar(true)}><Menu size={20}/></button><div className="mobile-title"><span>Enterprise Sales</span><b>{active.title}</b></div><div className="desktop-title"><span>{active.title}</span><em>·</em><span>Enterprise Sales</span></div></div><div className="header-actions"><button className="model-select"><Bot size={15}/><select value={agent} onChange={(e) => setAgent(e.target.value)}>{agents.map((item) => <option key={item}>{item}</option>)}</select></button><button className="model-select model"><Zap size={14}/><select value={model} onChange={(e) => setModel(e.target.value)}>{models.map((item) => <option key={item}>{item}</option>)}</select></button><button className={`icon-btn ${showContext ? "selected" : ""}`} onClick={() => setShowContext((value) => !value)} title="CRM context"><PanelRight size={18}/></button></div></header>

      <section className="chat-canvas">
        <div className="conversation-content">
          {active.messages.length === 0 ? <div className="welcome"><div className="welcome-icon"><WandSparkles size={22}/></div><h1>What can we accomplish?</h1><p>Ask AEONCRM to understand, decide, and act across your business.</p><div className="suggestions"><button onClick={() => setQuery("Show me the biggest opportunities that haven’t moved in 30 days.")}>Pipeline risk <span>→</span></button><button onClick={() => setQuery("Give me an executive sales briefing for today.")}>Executive briefing <span>→</span></button><button onClick={() => setQuery("Find customers that need a follow-up.")}>Customer follow-up <span>→</span></button></div></div> : active.messages.map((message) => <article key={message.id} className={`message ${message.role}`}><div className={`avatar ${message.role}`}>{message.role === "assistant" ? <Sparkles size={15}/> : "CM"}</div><div className="message-body"><div className="message-meta"><b>{message.role === "assistant" ? "AEON" : "You"}</b>{message.role === "assistant" && <span>· {agent}</span>}{message.status === "working" && <span className="live-status"><i/> Working</span>}</div><div className="message-text">{message.text}</div>{message.role === "assistant" && message.status === "done" && <div className="message-tools"><button><ThumbsUp size={14}/></button><button><ThumbsDown size={14}/></button><button><Copy size={14}/></button><button onClick={() => setQuery(message.text)}><WandSparkles size={14}/></button></div>}</div></article>)}
          {result?.requiresApproval && <div className="action-card"><div className="action-head"><div className="action-icon"><Check size={16}/></div><div><b>Approval required</b><span>AEON is ready to execute this CRM action</span></div></div><div className="action-body"><strong>{result.plan?.explanation ?? "A governed action is waiting for your approval."}</strong><div className="action-meta"><span>Agent · {agent}</span><span>Scope · CRM write</span><span>Policy · Confirmation</span></div></div><div className="action-buttons"><button className="secondary">Cancel</button><button className="primary" onClick={() => setQuery("Approve and execute the proposed action")}>Confirm action</button></div></div>}
        </div>
      </section>

      <div className="composer-wrap"><div className="composer"><div className="composer-top">{attachments.map((name) => <span key={name} className="attachment"><FileText size={13}/>{name}<button onClick={() => setAttachments((items) => items.filter((item) => item !== name))}><X size={11}/></button></span>)}</div><textarea ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void sendMessage(); }} onPaste={(e) => { if (e.clipboardData.files.length) handleFiles(e.clipboardData.files); }} onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }} onDragOver={(e) => e.preventDefault()} placeholder="Ask AEONCRM anything…" rows={1}/><div className="composer-footer"><div className="composer-actions"><label className="icon-btn"><Paperclip size={17}/><input type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)}/></label><button className="composer-tool"><Globe2 size={15}/> Research</button><button className="composer-tool"><Command size={14}/> Commands</button><span className="context-chip"><span className="status-dot"/> CRM context on</span></div><div className="send-area"><span>⌘↵</span><button className="send-btn" onClick={() => void sendMessage()} disabled={agentLoading || !query.trim()}>{agentLoading ? <span className="spinner"/> : <Send size={17}/>}</button></div></div></div><div className="composer-hint">AEON can read authorized CRM, workspace and knowledge context. Actions are governed by your policies.</div></div>
    </main>

    {showContext && <aside className="context-panel"><div className="context-head"><div><span>CRM CONTEXT</span><b>Opportunity</b></div><button className="icon-btn" onClick={() => setShowContext(false)}><X size={17}/></button></div><div className="context-record"><div className="record-logo">AT</div><div><h3>Acme Technologies</h3><span>Enterprise account</span></div><button className="icon-btn"><MoreHorizontal size={17}/></button></div><div className="context-section"><div className="context-label">Opportunity</div><h2>SAP Transformation</h2><div className="stage"><span>Proposal</span><b>65%</b></div></div><div className="metric-grid"><div><span>Deal value</span><b>$240,000</b></div><div><span>Last activity</span><b>12 days ago</b></div><div><span>Owner</span><b>John Smith</b></div><div><span>Next action</span><b>Follow-up</b></div></div><div className="context-section"><div className="context-label">AI signals</div><div className="signal"><span className="signal-dot warning"/><div><b>Deal is cooling</b><p>No customer activity for 12 days.</p></div></div><div className="signal"><span className="signal-dot"/><div><b>High strategic value</b><p>Top 10% of current pipeline.</p></div></div></div><button className="record-button">Open opportunity <span>↗</span></button><div className="context-foot"><span className="status-dot"/> Context synced just now</div></aside>}
  </div>;
}

const stats = [
  ["Pipeline", "₹61.2M"],
  ["Won revenue", "₹8.4M"],
  ["Open deals", "42"],
  ["Follow-ups", "17"],
];

export default function Home() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">AEONCRM</div>
        <div className="tagline">Agentic CRM Operating System</div>
        <nav className="nav">
          <a className="active" href="#"><span>⌂ Dashboard</span></a>
          <a href="#"><span>◎ Agent</span></a>
          <a href="#"><span>◈ Companies</span></a>
          <a href="#"><span>◉ Contacts</span></a>
          <a href="#"><span>◆ Deals</span></a>
          <a href="#"><span>✓ Tasks</span></a>
          <a href="#"><span>▣ Reports</span></a>
          <a href="#"><span>⚙ Settings</span></a>
        </nav>
      </aside>
      <main className="main">
        <header className="top">
          <div><h1 className="title">Good afternoon</h1><div className="subtitle">Your CRM, operated by agents.</div></div>
          <strong>AE</strong>
        </header>
        <section className="agent">
          <h2>🤖 Ask AEON Agent</h2>
          <p>Search your CRM, analyze sales, create records, and take approved actions using natural language.</p>
          <div className="agentbox"><input placeholder={'Try “Show my sales pipeline”'} /><button>Ask Agent</button></div>
        </section>
        <section className="cards">{stats.map(([label,value]) => <div className="card" key={label}><div className="label">{label}</div><div className="value">{value}</div></div>)}</section>
        <section className="grid">
          <div className="panel"><h3>Agent insights</h3><div className="item"><strong>⚠ 4 deals need attention</strong><div className="muted">No stage movement for more than 7 days.</div></div><div className="item"><strong>↑ 3 high-value opportunities</strong><div className="muted">AEON recommends immediate follow-up.</div></div><div className="item"><strong>★ New prospect</strong><div className="muted">THIRU&apos;S BIRIYANI is ready for qualification.</div></div></div>
          <div className="panel"><h3>Priority actions</h3><div className="item"><strong>Review negotiation deals</strong><div className="muted">8 opportunities · ₹18.4M</div></div><div className="item"><strong>Complete follow-ups</strong><div className="muted">17 activities due</div></div><div className="item"><strong>Prepare sales briefing</strong><div className="muted">Ask AEON to generate it</div></div></div>
        </section>
      </main>
    </div>
  );
}

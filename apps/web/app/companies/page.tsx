"use client";

import { FormEvent, useEffect, useState } from "react";

type Company = { id: string; name: string; website?: string | null; industry?: string | null; description?: string | null; _count?: { contacts: number; deals: number } };

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => fetch("/api/companies").then(r => r.json()).then(b => setCompanies(b.data ?? [])).catch(() => setError("Unable to load companies.")).finally(() => setLoading(false));
  useEffect(load, []);

  async function createCompany(e: FormEvent) {
    e.preventDefault(); if (!name.trim()) return;
    setSaving(true); setError("");
    const res = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, industry: industry || undefined, website: website || undefined }) });
    const body = await res.json();
    if (!res.ok) setError(body.error ?? "Could not create company."); else { setName(""); setIndustry(""); setWebsite(""); await load(); }
    setSaving(false);
  }

  return <main className="recordPage"><header className="recordHeader"><div><a href="/">← Dashboard</a><h1>Companies</h1><p>Accounts owned by AEONCRM.</p></div><strong>{companies.length}</strong></header>
    <section className="recordForm"><h2>Add company</h2><form onSubmit={createCompany}><input value={name} onChange={e => setName(e.target.value)} placeholder="Company name" required /><input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Industry" /><input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website" /><button disabled={saving}>{saving ? "Creating…" : "Create company"}</button></form>{error && <p className="error">{error}</p>}</section>
    <section className="recordList">{loading ? <p>Loading…</p> : companies.length === 0 ? <p className="empty">No companies yet.</p> : companies.map(c => <article className="recordRow" key={c.id}><div><h3>{c.name}</h3><p>{c.industry || "Industry not set"}{c.website ? ` · ${c.website}` : ""}</p></div><span>{c._count?.contacts ?? 0} contacts · {c._count?.deals ?? 0} deals</span></article>)}</section>
  </main>;
}

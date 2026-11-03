"use client";
import { useEffect, useState } from "react";

type Task={id:string;title:string;notes?:string;status:string;dueAt?:string;company?:{name:string};contact?:{firstName:string;lastName:string};deal?:{title:string}};
type Activity={id:string;type:string;subject:string;notes?:string;occurredAt:string;company?:{name:string};contact?:{firstName:string;lastName:string};deal?:{title:string}};

export default function TasksPage(){
 const [tasks,setTasks]=useState<Task[]>([]); const [activities,setActivities]=useState<Activity[]>([]); const [title,setTitle]=useState(""); const [busy,setBusy]=useState(false);
 const load=async()=>{const [t,a]=await Promise.all([fetch('/api/tasks'),fetch('/api/activities?limit=30')]);setTasks(await t.json());setActivities(await a.json());};
 useEffect(()=>{load()},[]);
 const add=async()=>{if(!title.trim())return;setBusy(true);await fetch('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title})});setTitle('');setBusy(false);load();};
 const complete=async(id:string)=>{await fetch('/api/tasks/'+id,{method:'PATCH'});load();};
 return <main className="workspace"><header className="pageheader"><div><p className="eyebrow">AEONCRM / EXECUTION</p><h1>Tasks & Activities</h1><p>Turn CRM intelligence into action and keep the customer timeline alive.</p></div></header>
 <section className="panel"><div className="panelheader"><div><h2>Open tasks</h2><p>{tasks.length} active items</p></div><div className="inlineform"><input value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Add a task…"/><button onClick={add} disabled={busy}>Add task</button></div></div>
 {tasks.length===0?<div className="empty">No open tasks. Add the next action for your sales team.</div>:<div className="recordlist">{tasks.map(t=><div className="record" key={t.id}><div><strong>{t.title}</strong><small>{[t.company?.name,t.contact&&`${t.contact.firstName} ${t.contact.lastName}`,t.deal?.title].filter(Boolean).join(' · ')||'Unlinked task'}{t.dueAt?` · Due ${new Date(t.dueAt).toLocaleDateString()}`:''}</small></div><button className="secondary" onClick={()=>complete(t.id)}>Complete</button></div>)}</div>}</section>
 <section className="panel"><div className="panelheader"><div><h2>Recent activity</h2><p>Latest customer-facing and internal events</p></div></div><div className="recordlist">{activities.map(a=><div className="record" key={a.id}><div><span className="badge">{a.type}</span><strong>{a.subject}</strong><small>{[a.company?.name,a.contact&&`${a.contact.firstName} ${a.contact.lastName}`,a.deal?.title].filter(Boolean).join(' · ')||'General activity'} · {new Date(a.occurredAt).toLocaleString()}</small></div></div>)}</div></section>
 </main>;
}

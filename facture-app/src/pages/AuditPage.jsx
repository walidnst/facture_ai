import { useEffect, useState } from "react";
import api from "../services/api";
import { useRole } from "../hooks/useRole";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#06070d;--surface:#0d0f1a;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.13);
  --text:#f0f0f5;--muted:rgba(255,255,255,0.35);
  --indigo:#6366f1;--emerald:#10b981;--amber:#f59e0b;--rose:#f43f5e;--cyan:#06b6d4;--violet:#8b5cf6;
}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
.ap{background:var(--bg);min-height:100vh;padding:2rem 2.5rem;font-family:'Bricolage Grotesque',sans-serif;color:var(--text);}
.ap-blob{position:fixed;top:-300px;left:-200px;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 65%);pointer-events:none;z-index:0;}
.ap-inner{position:relative;z-index:1;max-width:1400px;margin:0 auto;}
.ap-hd{margin-bottom:2rem;animation:fadeUp .5s ease both;}
.ap-eyebrow{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--indigo);margin-bottom:8px;}
.ap-h1{font-size:32px;font-weight:800;letter-spacing:-.03em;}
.ap-h1 em{font-style:normal;background:linear-gradient(120deg,var(--indigo),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.ap-sub{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);margin-top:6px;}

/* ── FILTRES ── */
.ap-filters{
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  margin-bottom:1.5rem;animation:fadeUp .5s ease .1s both;
}
.ap-fi{
  height:36px;background:#0a0b15;border:1px solid var(--border2);
  border-radius:9px;color:var(--text);font-size:12px;padding:0 12px;
  outline:none;font-family:'JetBrains Mono',monospace;color-scheme:dark;
  transition:border-color .2s;
}
.ap-fi:focus{border-color:var(--indigo);}
.ap-fi option{background:#0d0f1a;}
.ap-fi-date{width:140px;}
.ap-reset{
  height:36px;padding:0 14px;background:none;
  border:1px solid var(--border2);border-radius:9px;
  color:var(--muted);font-size:12px;cursor:pointer;
  font-family:'JetBrains Mono',monospace;transition:all .2s;
}
.ap-reset:hover{border-color:rgba(255,255,255,.3);color:var(--text);}

/* ── STATS BAND ── */
.ap-stats{
  display:grid;grid-template-columns:repeat(5,1fr);gap:1rem;
  margin-bottom:1.5rem;animation:fadeUp .5s ease .15s both;
}
@media(max-width:900px){.ap-stats{grid-template-columns:repeat(2,1fr);}}
.ap-stat{
  background:var(--surface);border:1px solid var(--border);
  border-radius:14px;padding:1rem 1.25rem;
}
.ap-stat-val{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;margin-bottom:4px;}
.ap-stat-lbl{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-family:'JetBrains Mono',monospace;}

/* ── TIMELINE ── */
.ap-timeline{animation:fadeUp .5s ease .2s both;}
.ap-tl-item{
  display:flex;gap:1rem;padding:1rem 0;
  border-bottom:1px solid rgba(255,255,255,.04);
  transition:background .15s;
}
.ap-tl-item:last-child{border-bottom:none;}
.ap-tl-item:hover{background:rgba(255,255,255,.015);border-radius:10px;padding-left:8px;}
.ap-tl-dot-wrap{display:flex;flex-direction:column;align-items:center;gap:0;min-width:36px;}
.ap-tl-dot{
  width:32px;height:32px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;font-size:14px;
  flex-shrink:0;
}
.ap-tl-line{flex:1;width:1px;background:var(--border);margin-top:4px;}
.ap-tl-body{flex:1;min-width:0;}
.ap-tl-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;}
.ap-tl-action{
  font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;
  font-family:'JetBrains Mono',monospace;letter-spacing:.04em;
}
.ap-tl-ref{font-size:13px;font-weight:700;color:var(--text);}
.ap-tl-meta{
  font-family:'JetBrains Mono',monospace;font-size:11px;
  color:var(--muted);margin-bottom:4px;
}
.ap-tl-details{
  font-size:12px;color:rgba(255,255,255,.45);
  background:rgba(255,255,255,.03);border-radius:7px;
  padding:6px 10px;font-family:'JetBrains Mono',monospace;
  border-left:2px solid var(--border2);
}
.ap-tl-time{
  font-family:'JetBrains Mono',monospace;font-size:10px;
  color:var(--muted);white-space:nowrap;margin-left:auto;
}

/* ── DUPLICATE WARNING ── */
.ap-dup{
  display:inline-flex;align-items:center;gap:5px;
  background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);
  color:var(--amber);border-radius:6px;font-size:11px;
  font-family:'JetBrains Mono',monospace;padding:3px 8px;
}

.ap-empty{
  font-family:'JetBrains Mono',monospace;font-size:13px;
  color:var(--muted);padding:4rem;text-align:center;
}
.ap-spinner{
  width:32px;height:32px;border:3px solid rgba(99,102,241,.2);
  border-top-color:var(--indigo);border-radius:50%;
  animation:spin .7s linear infinite;margin:4rem auto;
}
.ap-card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:20px;padding:1.5rem;overflow:hidden;
}
`;

const ACTION_CONFIG = {
  CREATED:   { color: "#818cf8", bg: "rgba(99,102,241,.15)",  icon: "➕", label: "Créée"           },
  VALIDATED: { color: "#10b981", bg: "rgba(16,185,129,.15)",  icon: "✅", label: "Validée"          },
  REJECTED:  { color: "#f43f5e", bg: "rgba(244,63,94,.15)",   icon: "❌", label: "Rejetée"          },
  DELETED:   { color: "#f43f5e", bg: "rgba(244,63,94,.1)",    icon: "🗑",  label: "Supprimée"        },
  UPLOADED:  { color: "#06b6d4", bg: "rgba(6,182,212,.15)",   icon: "📤", label: "Uploadée"         },
  EXPORTED:  { color: "#8b5cf6", bg: "rgba(139,92,246,.15)",  icon: "📊", label: "Exportée"         },
  DUPLICATE: { color: "#f59e0b", bg: "rgba(245,158,11,.15)",  icon: "⚠️", label: "Doublon détecté"  },
};

const ACTIONS = Object.keys(ACTION_CONFIG);

function formatDate(dt) {
  const d = new Date(dt);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function AuditPage() {
  const { isSuperAdmin } = useRole();
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: "", from: "", to: "", user: "" });
  const [invoiceStats, setInvoiceStats] = useState(null);

  // Charger les stats des factures au montage
  useEffect(() => {
    api.get("/factures/stats/")
      .then(res => setInvoiceStats(res.data))
      .catch(err => {
        console.error("Erreur stats factures:", err);
        setInvoiceStats(null);
      });
  }, []);

  // Charger les logs d'audit
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.action) params.append("action", filters.action);
    if (filters.from)   params.append("from",   filters.from);
    if (filters.to)     params.append("to",     filters.to);
    if (filters.user)   params.append("user_id", filters.user);

    api.get(`/audit/?${params.toString()}`)
      .then(res => { setLogs(res.data.results ?? res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filters]);

  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v }));
  const resetFilters = () => setFilters({ action: "", from: "", to: "", user: "" });

  // Stats par action (basées sur les logs d'audit)
  const logStats = ACTIONS.reduce((acc, a) => {
    acc[a] = logs.filter(l => l.action === a).length;
    return acc;
  }, {});

  const STAT_DISPLAY = [
    { key: "VALIDATED", label: "Validations",  color: "#10b981", value: logStats.VALIDATED },
    { key: "CREATED",   label: "Créations",    color: "#818cf8", value: logStats.CREATED },
    { key: "DELETED",   label: "Suppressions", color: "#f43f5e", value: logStats.DELETED },
    { key: "EXPORTED",  label: "Exports",      color: "#8b5cf6", value: logStats.EXPORTED },
    { key: "DUPLICATE", label: "Doublons",     color: "#f59e0b", value: invoiceStats?.duplicates ?? 0 },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="ap">
        <div className="ap-blob" />
        <div className="ap-inner">

          {/* ── En-tête ── */}
          <div className="ap-hd">
            <div className="ap-eyebrow">Smart Facture · Sécurité</div>
            <div className="ap-h1">Journal d'<em>audit</em></div>
            <div className="ap-sub">Traçabilité complète de toutes les actions</div>
          </div>

          {/* ── Stats ── */}
          <div className="ap-stats">
            {STAT_DISPLAY.map(s => (
              <div className="ap-stat" key={s.key}>
                <div className="ap-stat-val" style={{ color: s.color }}>
                  {s.value ?? 0}
                </div>
                <div className="ap-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Filtres ── */}
          <div className="ap-filters">
            <select className="ap-fi" value={filters.action}
              onChange={e => setFilter("action", e.target.value)}>
              <option value="">Toutes les actions</option>
              {ACTIONS.map(a => (
                <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>
              ))}
            </select>

            <input type="date" className="ap-fi ap-fi-date"
              value={filters.from}
              onChange={e => setFilter("from", e.target.value)} />

            <input type="date" className="ap-fi ap-fi-date"
              value={filters.to}
              onChange={e => setFilter("to", e.target.value)} />

            {Object.values(filters).some(v => v !== "") && (
              <button className="ap-reset" onClick={resetFilters}>✕ Effacer</button>
            )}

            <span style={{
              marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11, color: "var(--muted)"
            }}>
              {logs.length} entrée{logs.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* ── Timeline ── */}
          <div className="ap-card">
            {loading ? (
              <div className="ap-spinner" />
            ) : logs.length === 0 ? (
              <div className="ap-empty">Aucune entrée dans le journal d'audit</div>
            ) : (
              <div className="ap-timeline">
                {logs.map((log, i) => {
                  const cfg = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.CREATED;
                  return (
                    <div className="ap-tl-item" key={log.id}>
                      <div className="ap-tl-dot-wrap">
                        <div className="ap-tl-dot" style={{ background: cfg.bg }}>
                          {cfg.icon}
                        </div>
                        {i < logs.length - 1 && <div className="ap-tl-line" />}
                      </div>
                      <div className="ap-tl-body">
                        <div className="ap-tl-top">
                          <span className="ap-tl-action"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <span className="ap-tl-ref">{log.invoice_ref}</span>
                          {log.action === "DUPLICATE" && (
                            <span className="ap-dup">⚠️ Doublon</span>
                          )}
                          <span className="ap-tl-time">{formatDate(log.created_at)}</span>
                        </div>
                        <div className="ap-tl-meta">
                          👤 {log.user_email}
                          {log.company_name && ` · 🏢 ${log.company_name}`}
                        </div>
                        {log.details && (
                          <div className="ap-tl-details">{log.details}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useRole } from "../hooks/useRole";
import { ShowForRole } from "../components/RoleGuard";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
);

const API = "http://127.0.0.1:8000/api";

/* ═══════════════════════════════════════
   STYLES
═══════════════════════════════════════ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#07080f;--s1:#0e1020;--s2:#141628;
  --border:rgba(255,255,255,0.06);--border2:rgba(255,255,255,0.12);
  --text:#eeeef5;--muted:rgba(255,255,255,0.38);
  --indigo:#818cf8;--emerald:#34d399;--amber:#fbbf24;
  --rose:#fb7185;--cyan:#22d3ee;--violet:#a78bfa;
  --font:'Syne',sans-serif;--mono:'Fira Code',monospace;
}

/* Layout */
.db{background:var(--bg);min-height:100vh;padding:2rem 2.5rem;font-family:var(--font);color:var(--text);position:relative;overflow-x:hidden;}
.db::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(129,140,248,.03)1px,transparent 1px),linear-gradient(90deg,rgba(129,140,248,.03)1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0;}
.db-orb{position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0;}
.db-orb-1{width:600px;height:600px;top:-200px;left:-150px;background:radial-gradient(circle,rgba(129,140,248,.08),transparent 70%);}
.db-orb-2{width:500px;height:500px;bottom:-100px;right:-100px;background:radial-gradient(circle,rgba(52,211,153,.06),transparent 70%);}
.db-inner{position:relative;z-index:1;max-width:1400px;margin:0 auto;}

/* Animations */
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes countIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
.f1{animation:fadeUp .5s ease .05s both}
.f2{animation:fadeUp .5s ease .12s both}
.f3{animation:fadeUp .5s ease .2s both}
.f4{animation:fadeUp .5s ease .28s both}
.f5{animation:fadeUp .5s ease .36s both}
.f6{animation:fadeUp .5s ease .44s both}

/* Header */
.db-hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2.5rem;gap:1rem;flex-wrap:wrap;}
.db-eyebrow{font-family:var(--mono);font-size:10px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--indigo);margin-bottom:8px;display:flex;align-items:center;gap:8px;}
.db-eyebrow::before{content:'';display:inline-block;width:20px;height:1px;background:var(--indigo);}
.db-h1{font-size:36px;font-weight:800;letter-spacing:-.04em;line-height:1.05;}
.db-h1 em{font-style:normal;background:linear-gradient(135deg,var(--indigo),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.db-hsub{font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:8px;}
.db-hright{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;}
.db-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:99px;font-family:var(--mono);font-size:11px;font-weight:500;border:1px solid;cursor:default;}
.db-chip-live{border-color:rgba(52,211,153,.25);color:var(--emerald);background:rgba(52,211,153,.07);}
.db-chip-date{border-color:var(--border2);color:var(--muted);background:rgba(255,255,255,.03);}
.live-dot{width:6px;height:6px;border-radius:50%;background:var(--emerald);animation:pulse 2s ease infinite;}
.btn-refresh{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:99px;border:1px solid var(--border2);background:rgba(129,140,248,.08);color:var(--indigo);font-family:var(--mono);font-size:11px;cursor:pointer;transition:all .2s;}
.btn-refresh:hover{background:rgba(129,140,248,.18);border-color:rgba(129,140,248,.4);}
.btn-refresh.spinning svg{animation:spin .7s linear infinite;}

/* Alert */
.db-alert{display:flex;align-items:center;gap:12px;padding:12px 18px;border-radius:14px;border:1px solid rgba(251,113,133,.3);background:rgba(251,113,133,.06);color:#fda4af;margin-bottom:1.5rem;font-size:13px;line-height:1.5;}
.db-alert-ico{font-size:16px;flex-shrink:0;}

/* KPIs */
.db-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:1rem;margin-bottom:1.5rem;}
@media(max-width:1100px){.db-kpis{grid-template-columns:repeat(3,1fr);}}
@media(max-width:640px){.db-kpis{grid-template-columns:repeat(2,1fr);}}
.kpi{background:var(--s1);border:1px solid var(--border);border-radius:20px;padding:1.25rem 1.4rem;position:relative;overflow:hidden;transition:transform .2s,box-shadow .2s,border-color .2s;cursor:default;}
.kpi:hover{transform:translateY(-4px);border-color:var(--border2);box-shadow:0 20px 60px rgba(0,0,0,.5);}
.kpi-accent{position:absolute;top:0;left:0;right:0;height:2px;border-radius:20px 20px 0 0;}
.kpi-corner{position:absolute;bottom:-20px;right:-20px;width:80px;height:80px;border-radius:50%;opacity:.12;filter:blur(24px);}
.kpi-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;}
.kpi-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;}
.kpi-badge{font-family:var(--mono);font-size:10px;font-weight:500;padding:3px 8px;border-radius:6px;}
.kpi-label{font-family:var(--mono);font-size:10px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px;}
.kpi-val{font-family:var(--mono);font-size:28px;font-weight:600;letter-spacing:-.04em;animation:countIn .6s ease both;}
.kpi-sub{font-family:var(--mono);font-size:10px;color:var(--muted);margin-top:4px;}

/* Insights */
.db-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;}
@media(max-width:800px){.db-insights{grid-template-columns:1fr;}}
.insight{background:var(--s1);border:1px solid var(--border);border-radius:16px;padding:1.1rem 1.25rem;display:flex;gap:12px;align-items:flex-start;transition:border-color .2s,transform .2s;}
.insight:hover{border-color:var(--border2);transform:translateY(-2px);}
.insight-ico{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.insight-title{font-size:12px;font-weight:700;margin-bottom:4px;}
.insight-text{font-size:11px;color:var(--muted);line-height:1.6;}

/* Grids */
.db-grid2{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem;}
.db-grid3{display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;margin-bottom:1.5rem;}
@media(max-width:900px){.db-grid2,.db-grid3{grid-template-columns:1fr;}}

/* Panel */
.panel{background:var(--s1);border:1px solid var(--border);border-radius:20px;padding:1.5rem;}
.panel-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;gap:.5rem;flex-wrap:wrap;}
.panel-title{font-size:14px;font-weight:700;letter-spacing:-.01em;}
.panel-badge{font-family:var(--mono);font-size:10px;color:var(--muted);background:rgba(255,255,255,.04);border:1px solid var(--border);padding:4px 10px;border-radius:8px;}

/* Tabs */
.tab-bar{display:flex;gap:4px;background:rgba(255,255,255,.04);border-radius:10px;padding:3px;margin-bottom:1rem;}
.tab-btn{flex:1;padding:6px 10px;font-family:var(--mono);font-size:10px;font-weight:500;color:var(--muted);background:transparent;border:none;border-radius:8px;cursor:pointer;transition:all .2s;text-transform:uppercase;letter-spacing:.08em;}
.tab-btn.active{background:var(--s2);color:var(--text);border:1px solid var(--border2);}
.tab-btn:hover:not(.active){color:var(--text);}
.chart-legend{display:flex;gap:16px;margin-top:12px;}
.chart-legend span{display:flex;align-items:center;gap:5px;font-size:11px;font-family:var(--mono);}
.chart-legend-dot{width:8px;height:8px;border-radius:2px;display:inline-block;}

/* Donut */
.donut-wrap{display:flex;align-items:center;gap:1.5rem;}
.d-legend{display:flex;flex-direction:column;gap:12px;flex:1;}
.d-row{display:flex;align-items:center;gap:10px;font-size:12px;}
.d-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0;}
.d-lbl{color:rgba(255,255,255,.55);flex:1;}
.d-cnt{font-family:var(--mono);font-size:12px;font-weight:600;}
.d-pct{font-family:var(--mono);font-size:10px;color:var(--muted);}

/* Activity */
.act-list{display:flex;flex-direction:column;gap:0;}
.act-item{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.03);}
.act-item:last-child{border-bottom:none;}
.act-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.act-info{flex:1;min-width:0;}
.act-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.act-meta{font-size:10px;color:var(--muted);font-family:var(--mono);margin-top:2px;}
.act-right{text-align:right;flex-shrink:0;}
.act-amt{font-family:var(--mono);font-size:12px;font-weight:600;color:var(--emerald);}
.act-badge{font-family:var(--mono);font-size:9px;font-weight:600;padding:2px 7px;border-radius:5px;margin-top:3px;display:inline-block;}

/* Health */
.health-card{background:linear-gradient(135deg,rgba(129,140,248,.1),rgba(34,211,238,.06));border:1px solid rgba(129,140,248,.18);border-radius:20px;padding:1.5rem;}
.health-title{font-size:13px;font-weight:700;color:var(--indigo);margin-bottom:1rem;}
.health-body{display:flex;align-items:center;gap:1.25rem;}
.health-items{display:flex;flex-direction:column;gap:8px;}
.health-item{display:flex;align-items:center;gap:8px;font-size:11px;}
.health-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.health-status{font-size:18px;font-weight:800;margin-bottom:6px;}

/* HBar */
.hbar-item{margin-bottom:16px;}
.hbar-item:last-child{margin-bottom:0;}
.hbar-head{display:flex;justify-content:space-between;margin-bottom:6px;}
.hbar-name{font-size:12px;font-weight:600;color:rgba(255,255,255,.75);}
.hbar-val{font-family:var(--mono);font-size:11px;font-weight:500;}
.track{height:6px;background:rgba(255,255,255,.05);border-radius:99px;overflow:hidden;}
.fill{height:100%;border-radius:99px;transition:width 1.4s cubic-bezier(.4,0,.2,1);}

/* Summary */
.summary-row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:9px;}
.summary-key{color:rgba(255,255,255,.4);}
.summary-val{font-family:var(--mono);font-weight:600;}

/* Stat bars */
.stat-item{margin-bottom:16px;}
.stat-item:last-child{margin-bottom:0;}
.stat-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.stat-name{font-size:12px;font-weight:500;color:rgba(255,255,255,.7);display:flex;align-items:center;gap:8px;}
.stat-nums{font-family:var(--mono);font-size:11px;display:flex;gap:8px;align-items:center;}

/* Table */
.tbl-wrap{overflow-x:auto;}
.tbl{width:100%;border-collapse:collapse;font-size:13px;}
.tbl th{padding:8px 14px;font-size:9px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.12em;font-family:var(--mono);border-bottom:1px solid var(--border);text-align:left;}
.tbl td{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.02);}
.tbl tbody tr:last-child td{border-bottom:none;}
.tbl tbody tr:hover td{background:rgba(255,255,255,.02);}
.tbl-co{display:flex;align-items:center;gap:10px;font-weight:600;}
.tbl-av{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;}
.tbl-mono{font-family:var(--mono);font-size:11px;color:rgba(255,255,255,.45);}
.tbl-green{font-family:var(--mono);font-size:12px;font-weight:700;color:var(--emerald);}

/* Loader */
.db-loader{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;gap:1rem;}
.db-spinner{width:36px;height:36px;border:2px solid rgba(129,140,248,.2);border-top-color:var(--indigo);border-radius:50%;animation:spin .7s linear infinite;}
.db-ltxt{font-family:var(--mono);font-size:12px;color:var(--muted);}
.db-empty{font-family:var(--mono);font-size:11px;color:var(--muted);padding:2rem;text-align:center;}
`;

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
const COLORS = ["#818cf8","#a78bfa","#22d3ee","#34d399","#fbbf24"];

const fmt = (n, dec = 2) =>
  parseFloat(n || 0).toLocaleString("fr-MA", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

const fmtK = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toString();

function statusColor(s) {
  if (!s) return "#fbbf24";
  const l = s.toLowerCase();
  if (["validée","validated","approved"].includes(l)) return "#34d399";
  if (["rejetée","rejected"].includes(l)) return "#fb7185";
  return "#fbbf24";
}

function statusLabel(s) {
  if (!s) return "En attente";
  const l = s.toLowerCase();
  if (["validated","approved"].includes(l)) return "Validée";
  if (["rejected"].includes(l)) return "Rejetée";
  if (["pending"].includes(l)) return "En attente";
  return s;
}

function scoreHealth(validRate, pending, rejectedCount, total) {
  let score = 0;
  score += validRate >= 80 ? 40 : validRate >= 60 ? 25 : 10;
  score += pending === 0 ? 30 : pending <= 2 ? 20 : pending <= 5 ? 10 : 0;
  score += total >= 20 ? 15 : total >= 10 ? 10 : 5;
  score += rejectedCount === 0 ? 10 : rejectedCount <= 2 ? 5 : 0;
  score += Math.min(5, Math.round(validRate / 20));
  return Math.min(100, score);
}

function buildMonthlyFromInvoices(invoices) {
  const monthNames = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const monthMap = {};
  invoices.forEach((inv) => {
    const d = new Date(inv.date_facture || inv.created_at);
    const k = d.getMonth();
    if (!monthMap[k]) monthMap[k] = { month: monthNames[k], total: 0, validated: 0, rejected: 0 };
    monthMap[k].total++;
    const sl = (inv.status || "").toLowerCase();
    if (["validée","validated","approved"].includes(sl)) monthMap[k].validated++;
    if (["rejetée","rejected"].includes(sl)) monthMap[k].rejected++;
  });
  const curMonth = new Date().getMonth();
  return Array.from({ length: curMonth + 1 }, (_, i) =>
    monthMap[i] || { month: monthNames[i], total: 0, validated: 0, rejected: 0 }
  );
}

/* ═══════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════ */

/* ── DONUT ── */
function Donut({ validated, pending, rejected, total }) {
  const S = 130, r = 48, cx = 65, cy = 65, C = 2 * Math.PI * r;
  const segs = [
    { v: validated, c: "#34d399" },
    { v: pending,   c: "#fbbf24" },
    { v: rejected,  c: "#fb7185" },
  ];
  let off = 0;
  const arcs = segs.map((s) => {
    const dash = total > 0 ? (s.v / total) * C : 0;
    const a = { ...s, dash, gap: C - dash, offset: off };
    off += dash;
    return a;
  });
  return (
    <div className="donut-wrap">
      <svg width={S} height={S} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="14" />
        {arcs.map((a, i) => (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={a.c} strokeWidth="14"
            strokeDasharray={`${a.dash} ${a.gap}`}
            strokeDashoffset={-(a.offset - C / 4)}
            style={{ transition: "stroke-dasharray 1.2s ease" }}
          />
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#eeeef5" fontSize="22"
          fontWeight="700" fontFamily="'Fira Code',monospace">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,.3)"
          fontSize="8" fontFamily="'Fira Code',monospace" letterSpacing="1.5">TOTAL</text>
      </svg>
      <div className="d-legend">
        {[["Validées",validated,"#34d399"],["En attente",pending,"#fbbf24"],["Rejetées",rejected,"#fb7185"]].map(([l, v, c]) => (
          <div key={l} className="d-row">
            <div className="d-dot" style={{ background: c }} />
            <span className="d-lbl">{l}</span>
            <span className="d-cnt">{v}</span>
            <span className="d-pct">{total > 0 ? Math.round((v / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── HEALTH SCORE ── */
function HealthScore({ score, validRate, pending, rejectedCount }) {
  const C = 2 * Math.PI * 40;
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#fb7185";
  const label = score >= 75 ? "Excellente" : score >= 50 ? "Correcte" : "À améliorer";
  const items = [
    { ok: validRate >= 70, txt: `Validation : ${validRate}%` },
    { ok: pending <= 3,    txt: `En attente : ${pending}` },
    { ok: rejectedCount === 0, txt: `Rejets récents : ${rejectedCount}` },
  ];
  return (
    <div className="health-card">
      <div className="health-title">🏥 Santé comptable</div>
      <div className="health-body">
        <svg width="90" height="90" style={{ flexShrink: 0 }}>
          <circle cx="45" cy="45" r="40" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8" />
          <circle cx="45" cy="45" r="40" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * C} ${C}`} strokeDashoffset={C / 4}
            style={{ transition: "stroke-dasharray 1.5s ease" }} />
          <text x="45" y="41" textAnchor="middle" fill={color} fontSize="16"
            fontWeight="700" fontFamily="'Fira Code',monospace">{score}</text>
          <text x="45" y="57" textAnchor="middle" fill="rgba(255,255,255,.3)"
            fontSize="7" fontFamily="'Fira Code',monospace" letterSpacing="1">/100</text>
        </svg>
        <div>
          <div className="health-status" style={{ color }}>{label}</div>
          <div className="health-items">
            {items.map((it, i) => (
              <div key={i} className="health-item" style={{ color: it.ok ? "rgba(255,255,255,.6)" : "#fbbf24" }}>
                <div className="health-dot" style={{ background: it.ok ? "#34d399" : "#fbbf24" }} />
                {it.txt}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ACTIVITY ── */
function RecentActivity({ invoices }) {
  if (!invoices?.length) return <div className="db-empty">Aucune activité récente.</div>;
  return (
    <div className="act-list">
      {invoices.slice(0, 6).map((inv, i) => {
        const sc = statusColor(inv.status);
        const sl = statusLabel(inv.status);
        const d = inv.date_facture || inv.created_at
          ? new Date(inv.date_facture || inv.created_at).toLocaleDateString("fr-MA", { day: "numeric", month: "short" })
          : "—";
        return (
          <div key={i} className="act-item">
            <div className="act-dot" style={{ background: sc }} />
            <div className="act-info">
              <div className="act-name">{inv.fournisseur || "Inconnu"}</div>
              <div className="act-meta">{d} · {inv.owner_email || inv.company_name || "—"}</div>
            </div>
            <div className="act-right">
              <div className="act-amt">{fmt(inv.total)} MAD</div>
              <div className="act-badge" style={{ background: `${sc}22`, color: sc }}>{sl}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── HBAR ── */
function HBar({ data }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  if (!data.length) return <div className="db-empty">Aucun fournisseur trouvé.</div>;
  return (
    <div>
      {data.map((d, i) => (
        <div key={i} className="hbar-item">
          <div className="hbar-head">
            <span className="hbar-name">{d.name}</span>
            <span className="hbar-val" style={{ color: COLORS[i % COLORS.length] }}>
              {fmt(d.amount, 0)} MAD · {d.count} fact.
            </span>
          </div>
          <div className="track">
            <div
              className="fill"
              style={{
                width: `${(d.amount / max) * 100}%`,
                background: `linear-gradient(90deg,${COLORS[i%COLORS.length]},${COLORS[i%COLORS.length]}88)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── CHART OPTIONS ── */
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(10,12,25,.97)",
      borderColor: "rgba(255,255,255,.12)",
      borderWidth: 1,
      titleColor: "rgba(255,255,255,.5)",
      bodyColor: "#eeeef5",
      padding: 10,
      cornerRadius: 10,
      mode: "index",
      intersect: false,
    },
  },
  scales: {
    x: {
      grid: { color: "rgba(255,255,255,.04)" },
      ticks: { color: "rgba(255,255,255,.35)", font: { family: "'Fira Code',monospace", size: 10 } },
    },
    y: {
      grid: { color: "rgba(255,255,255,.04)" },
      ticks: { color: "rgba(255,255,255,.35)", font: { family: "'Fira Code',monospace", size: 10 } },
      beginAtZero: true,
    },
  },
};

/* ── MONTHLY CHARTS ── */
function MonthlyCharts({ monthly }) {
  const [tab, setTab] = useState("bar");
  const labels = monthly.map((d) => d.month);
  const barData = {
    labels,
    datasets: [
      { label: "Total", data: monthly.map((d) => d.total), backgroundColor: "rgba(129,140,248,.7)", borderRadius: 6, borderSkipped: false, barPercentage: 0.5 },
      { label: "Validées", data: monthly.map((d) => d.validated), backgroundColor: "rgba(52,211,153,.7)", borderRadius: 6, borderSkipped: false, barPercentage: 0.5 },
    ],
  };
  const areaData = {
    labels,
    datasets: [
      { label: "Total", data: monthly.map((d) => d.total), borderColor: "#818cf8", backgroundColor: "rgba(129,140,248,.12)", fill: true, tension: 0.4, pointBackgroundColor: "#0e1020", pointBorderColor: "#818cf8", pointBorderWidth: 2, pointRadius: 4 },
      { label: "Validées", data: monthly.map((d) => d.validated), borderColor: "#34d399", backgroundColor: "rgba(52,211,153,.08)", fill: true, tension: 0.4, pointBackgroundColor: "#0e1020", pointBorderColor: "#34d399", pointBorderWidth: 2, pointRadius: 4 },
    ],
  };
  return (
    <>
      <div className="tab-bar">
        {["bar","area"].map((t) => (
          <button key={t} className={`tab-btn${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t === "bar" ? "Barres" : "Courbe"}
          </button>
        ))}
      </div>
      <div style={{ position: "relative", height: 160 }}>
        {tab === "bar" ? <Bar data={barData} options={chartOptions} /> : <Line data={areaData} options={chartOptions} />}
      </div>
      <div className="chart-legend">
        {[["#818cf8","Total"],["#34d399","Validées"]].map(([c, l]) => (
          <span key={l} style={{ color: c }}>
            <span className="chart-legend-dot" style={{ background: c }} />{l}
          </span>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   DASHBOARD PRINCIPAL
═══════════════════════════════════════ */
export default function Dashboard() {
  const { isSuperAdmin, isAdmin, companyName } = useRole();
  const [stats,      setStats]      = useState(null);
  const [companies,  setCompanies]  = useState([]);
  const [invoices,   setInvoices]   = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [monthly,    setMonthly]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now,        setNow]        = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [sRes, invRes] = await Promise.all([
        axios.get(`${API}/invoices/stats/`),
        axios.get(`${API}/invoices/?ordering=-created_at&limit=200`),
      ]);
      setStats(sRes.data);

      const allInvoices = invRes.data?.results || invRes.data || [];

      // Activité récente (6 dernières)
      setInvoices(allInvoices.slice(0, 6));

      // Données mensuelles depuis TOUTES les factures
      setMonthly(buildMonthlyFromInvoices(allInvoices));

      // Top fournisseurs depuis TOUTES les factures
      const suppMap = {};
      allInvoices.forEach((inv) => {
        const name = inv.fournisseur || "Inconnu";
        if (!suppMap[name]) suppMap[name] = { name, count: 0, amount: 0 };
        suppMap[name].count++;
        suppMap[name].amount += parseFloat(inv.total || 0);
      });
      setSuppliers(Object.values(suppMap).sort((a, b) => b.amount - a.amount).slice(0, 5));

      if (isSuperAdmin) {
        const cRes = await axios.get(`${API}/companies/global-stats/`);
        setCompanies(cRes.data.companies || []);
      }
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => { fetchData(false); }, [fetchData]);

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="db">
        <div className="db-inner">
          <div className="db-loader">
            <div className="db-spinner" />
            <div className="db-ltxt">Chargement des analytics...</div>
          </div>
        </div>
      </div>
    </>
  );

  /* ── Calculs ── */
  const total      = parseInt(stats?.total      || 0);
  const validated  = parseInt(stats?.validated  || 0);
  const pending    = parseInt(stats?.pending    || 0);
  const rejected   = parseInt(stats?.rejected   || 0);
  const amount     = parseFloat(stats?.amount   || 0);
  const pct        = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const validRate  = pct(validated);
  const avgAmount  = total > 0 ? Math.round(amount / total) : 0;

  // Rejets dans les 6 dernières factures (données réelles)
  const recentRejectedCount = invoices.filter((i) =>
    ["rejetée","rejected"].includes((i.status || "").toLowerCase())
  ).length;

  const health = scoreHealth(validRate, pending, recentRejectedCount, total);
  const pendingRiskColor = pending > 3 ? "#fb7185" : pending > 1 ? "#fbbf24" : "#34d399";
  const pendingRisk      = pending > 3 ? "Élevé"   : pending > 1 ? "Moyen"   : "Faible";

  const timeStr    = now.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" });
  const dateStr    = now.toLocaleDateString("fr-MA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const lastUpStr  = lastUpdate.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" });

  const totalAllCo = companies.reduce((a, c) => a + parseFloat(c.total_amount || 0), 0);

  const kpis = [
    { icon:"📋", lbl:"Total factures", val:total,          sub:"toutes périodes",          clr:"#818cf8", bg:"rgba(129,140,248,.12)", glow:"#6366f1", badge:`${total} docs`,    accent:"linear-gradient(90deg,#6366f1,#818cf8)" },
    { icon:"✅", lbl:"Validées",       val:validated,       sub:`taux ${validRate}%`,       clr:"#34d399", bg:"rgba(52,211,153,.12)",  glow:"#10b981", badge:`${validRate}%`,    accent:"linear-gradient(90deg,#10b981,#34d399)" },
    { icon:"⏳", lbl:"En attente",     val:pending,         sub:"à traiter",                clr:"#fbbf24", bg:"rgba(251,191,36,.12)",  glow:"#f59e0b", badge:pendingRisk,        accent:"linear-gradient(90deg,#f59e0b,#fbbf24)" },
    { icon:"❌", lbl:"Rejetées",       val:rejected,        sub:`${pct(rejected)}% total`,  clr:"#fb7185", bg:"rgba(251,113,133,.12)", glow:"#f43f5e", badge:`${pct(rejected)}%`,accent:"linear-gradient(90deg,#f43f5e,#fb7185)" },
    { icon:"💰", lbl:"Montant total",  val:fmtK(amount),   sub:`moy. ${fmt(avgAmount,0)} MAD`, clr:"#22d3ee", bg:"rgba(34,211,238,.12)",  glow:"#06b6d4", badge:"MAD",             accent:"linear-gradient(90deg,#06b6d4,#22d3ee)" },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="db">
        <div className="db-orb db-orb-1" />
        <div className="db-orb db-orb-2" />
        <div className="db-inner">

          {/* ── Header ── */}
          <div className="db-hd f1">
            <div>
              <div className="db-eyebrow">Smart Facture · Analytics</div>
              <div className="db-h1">Tableau de <em>bord</em></div>
              <div className="db-hsub">
                {isSuperAdmin ? "Vue globale — toutes les entreprises"
                  : isAdmin ? `Entreprise : ${companyName}`
                  : "Mes factures"}
              </div>
            </div>
            <div className="db-hright">
              <button
                className={`btn-refresh${refreshing ? " spinning" : ""}`}
                onClick={() => fetchData(true)}
                title={`Dernière MAJ : ${lastUpStr}`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                {refreshing ? "Actualisation..." : `MAJ ${lastUpStr}`}
              </button>
              <div className="db-chip db-chip-live"><div className="live-dot" />LIVE · {timeStr}</div>
              <div className="db-chip db-chip-date">{dateStr}</div>
            </div>
          </div>

          {/* ── Alerte ── */}
          {pending > 3 && (
            <div className="db-alert f1">
              <div className="db-alert-ico">🚨</div>
              <div>
                <strong>{pending} factures en attente</strong> — Risque comptable élevé.
                Traitez-les pour maintenir votre taux de validation.
              </div>
            </div>
          )}

          {/* ── KPIs ── */}
          <div className="db-kpis f2">
            {kpis.map((k, i) => (
              <div key={i} className="kpi">
                <div className="kpi-accent" style={{ background: k.accent }} />
                <div className="kpi-corner" style={{ background: k.glow }} />
                <div className="kpi-top">
                  <div className="kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
                  <span className="kpi-badge" style={{ background: k.bg, color: k.clr }}>{k.badge}</span>
                </div>
                <div className="kpi-label">{k.lbl}</div>
                <div className="kpi-val" style={{ color: k.clr }}>{k.val}</div>
                <div className="kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Insights ── */}
          <div className="db-insights f3">
            <div className="insight">
              <div className="insight-ico" style={{ background: "rgba(129,140,248,.12)" }}>📈</div>
              <div>
                <div className="insight-title">Taux de validation</div>
                <div className="insight-text">
                  {validRate >= 70
                    ? `Excellent ! ${validRate}% des factures sont validées. Continuez ainsi.`
                    : validRate >= 40
                    ? `${validRate}% validées — ${pending} factures attendent votre validation.`
                    : `Attention : seulement ${validRate}% validées. Traitez les ${pending} en attente.`}
                </div>
              </div>
            </div>
            <div className="insight">
              <div className="insight-ico" style={{ background: "rgba(34,211,238,.12)" }}>💡</div>
              <div>
                <div className="insight-title">Montant moyen par facture</div>
                <div className="insight-text">
                  Chaque facture représente{" "}
                  <strong style={{ color: "#22d3ee" }}>{fmt(avgAmount, 0)} MAD</strong> en moyenne.
                  {amount > 50000 ? " Volume financier significatif." : " Activité normale."}
                </div>
              </div>
            </div>
            <div className="insight">
              <div className="insight-ico" style={{ background: `${pendingRiskColor}18` }}>⚠️</div>
              <div>
                <div className="insight-title">Risque comptable</div>
                <div className="insight-text">
                  {pending === 0
                    ? "Aucune facture en attente — comptabilité à jour !"
                    : `${pending} facture${pending > 1 ? "s" : ""} non traitée${pending > 1 ? "s" : ""}. Risque `}
                  {pending > 0 && <strong style={{ color: pendingRiskColor }}>{pendingRisk}</strong>}
                  {pending > 0 && " de retard."}
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 1 : Graphique + Donut ── */}
          <div className="db-grid2 f4">
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-title">Évolution mensuelle des dépôts</div>
                <div className="panel-badge">{new Date().getFullYear()}</div>
              </div>
              <MonthlyCharts monthly={monthly} />
            </div>
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-title">Répartition par statut</div>
                <div className="panel-badge">{total} factures</div>
              </div>
              <Donut validated={validated} pending={pending} rejected={rejected} total={total} />
            </div>
          </div>

          {/* ── Row 2 : Activité + Santé / Résumé ── */}
          <div className="db-grid2 f5">
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-title">Activité récente</div>
                <div className="panel-badge">{invoices.length} dernières</div>
              </div>
              <RecentActivity invoices={invoices} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <HealthScore
                score={health}
                validRate={validRate}
                pending={pending}
                rejectedCount={recentRejectedCount}
              />
              <div className="panel" style={{ flex: 1 }}>
                <div className="panel-hd"><div className="panel-title">Résumé financier</div></div>
                {[
                  ["Montant TTC total", `${fmt(amount)} MAD`, "#fff"],
                  ["Moy. / facture",    `${fmt(avgAmount, 0)} MAD`, "#fff"],
                  ["Taux validation",   `${validRate}%`, validRate >= 70 ? "#34d399" : validRate >= 40 ? "#fbbf24" : "#fb7185"],
                  ["Factures / mois",   monthly.length > 0 ? `~${Math.round(total / monthly.length)}` : "—", "#fff"],
                  ["Score santé",       `${health}/100`, health >= 75 ? "#34d399" : health >= 50 ? "#fbbf24" : "#fb7185"],
                ].map(([k, v, c]) => (
                  <div key={k} className="summary-row">
                    <span className="summary-key">{k}</span>
                    <span className="summary-val" style={{ color: c }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Row 3 : Fournisseurs + Progression ── */}
          <div className="db-grid3 f6">
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-title">Top fournisseurs par montant</div>
                <div className="panel-badge">MAD · TTC · données réelles</div>
              </div>
              <HBar data={suppliers} />
            </div>
            <div className="panel">
              <div className="panel-hd"><div className="panel-title">Progression statuts</div></div>
              {[
                ["Validées",   validated, "#34d399"],
                ["En attente", pending,   "#fbbf24"],
                ["Rejetées",   rejected,  "#fb7185"],
              ].map(([l, v, c]) => (
                <div key={l} className="stat-item">
                  <div className="stat-head">
                    <div className="stat-name">
                      <div className="d-dot" style={{ background: c, width: 8, height: 8, borderRadius: 2 }} />{l}
                    </div>
                    <div className="stat-nums">
                      <span style={{ color: "#fff", fontWeight: 600 }}>{v}</span>
                      <span style={{ color: "var(--muted)" }}>{pct(v)}%</span>
                    </div>
                  </div>
                  <div className="track">
                    <div className="fill" style={{ width: `${pct(v)}%`, background: `linear-gradient(90deg,${c},${c}77)` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Companies (Super Admin) ── */}
          <ShowForRole roles={["SUPER_ADMIN"]}>
            <div className="panel f6" style={{ marginBottom: "1.5rem" }}>
              <div className="panel-hd">
                <div className="panel-title">Performance par entreprise</div>
                <div className="panel-badge">{companies.length} entreprises</div>
              </div>
              {companies.length === 0 ? (
                <div className="db-empty">Aucune entreprise enregistrée.</div>
              ) : (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Entreprise</th>
                        <th>Utilisateurs</th>
                        <th>Factures</th>
                        <th>Montant total</th>
                        <th>Part globale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((c, i) => {
                        const clr = COLORS[i % COLORS.length];
                        const share = totalAllCo > 0 ? Math.round((parseFloat(c.total_amount || 0) / totalAllCo) * 100) : 0;
                        const name  = c.nom || c.name || "Entreprise";
                        return (
                          <tr key={c.id || i}>
                            <td>
                              <div className="tbl-co">
                                <div className="tbl-av" style={{ background: `${clr}22`, color: clr }}>
                                  {name[0].toUpperCase()}
                                </div>
                                {name}
                              </div>
                            </td>
                            <td className="tbl-mono">{c.user_count}</td>
                            <td className="tbl-mono">{c.invoice_count}</td>
                            <td className="tbl-green">{fmt(c.total_amount || 0)} MAD</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div className="track" style={{ flex: 1 }}>
                                  <div className="fill" style={{ width: `${share}%`, background: `linear-gradient(90deg,${clr},${clr}77)` }} />
                                </div>
                                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: clr, width: 28 }}>{share}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </ShowForRole>

        </div>
      </div>
    </>
  );
}
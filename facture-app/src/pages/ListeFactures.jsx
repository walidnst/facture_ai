import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import { ShowForRole } from "../components/RoleGuard";
import { useRole } from "../hooks/useRole";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#06070d;--surface:#0d0f1a;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.13);
  --text:#f0f0f5;--muted:rgba(255,255,255,0.35);
  --indigo:#6366f1;--emerald:#10b981;--amber:#f59e0b;--rose:#f43f5e;--cyan:#06b6d4;--violet:#8b5cf6;
}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
.f1{animation:fadeUp .5s ease .05s both;}
.f2{animation:fadeUp .5s ease .12s both;}
.f3{animation:fadeUp .5s ease .20s both;}
.f4{animation:fadeUp .5s ease .28s both;}
.lf{background:var(--bg);min-height:100vh;padding:2rem 2.5rem;font-family:'Bricolage Grotesque',sans-serif;color:var(--text);}
.lf-blob1{position:fixed;top:-300px;left:-200px;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 65%);pointer-events:none;z-index:0;}
.lf-blob2{position:fixed;bottom:-200px;right:-100px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(16,185,129,0.07) 0%,transparent 65%);pointer-events:none;z-index:0;}
.lf-inner{position:relative;z-index:1;max-width:1600px;margin:0 auto;}
.lf-hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem;}
.lf-eyebrow{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--indigo);margin-bottom:8px;}
.lf-h1{font-size:34px;font-weight:800;letter-spacing:-.03em;line-height:1.1;}
.lf-h1 em{font-style:normal;background:linear-gradient(120deg,var(--indigo),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.lf-hsub{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);margin-top:6px;}
.lf-hright{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;}
.lf-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem;}
@media(max-width:1100px){.lf-kpis{grid-template-columns:repeat(2,1fr);}}
@media(max-width:680px){.lf-kpis{grid-template-columns:1fr;}}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:1.25rem 1.5rem;position:relative;overflow:hidden;transition:transform .2s,border-color .2s,box-shadow .2s;cursor:default;}
.kpi:hover{transform:translateY(-3px);border-color:var(--border2);box-shadow:0 12px 40px rgba(0,0,0,.4);}
.kpi-glow{position:absolute;bottom:-30px;right:-30px;width:110px;height:110px;border-radius:50%;opacity:.2;filter:blur(28px);}
.kpi-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;}
.kpi-icon{font-size:20px;}
.kpi-badge{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:3px 7px;border-radius:6px;}
.kpi-label{font-size:10px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-family:'JetBrains Mono',monospace;margin-bottom:4px;}
.kpi-val{font-size:30px;font-weight:800;letter-spacing:-.04em;font-family:'JetBrains Mono',monospace;}
.kpi-sub{font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:3px;}
.lf-btn{padding:10px 20px;border-radius:12px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Bricolage Grotesque',sans-serif;display:inline-flex;align-items:center;gap:8px;transition:all .2s ease;}
.lf-btn:disabled{opacity:.4;cursor:not-allowed;}
.lf-btn:not(:disabled):hover{transform:translateY(-2px);}
.lf-btn:not(:disabled):active{transform:translateY(0);}
.lf-btn-validate{background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;box-shadow:0 4px 16px rgba(99,102,241,.3);}
.lf-btn-validate:not(:disabled):hover{box-shadow:0 6px 24px rgba(99,102,241,.5);}
.lf-btn-delete{background:linear-gradient(135deg,var(--rose),#dc2626);color:#fff;box-shadow:0 4px 16px rgba(244,63,94,.3);}
.lf-btn-delete:not(:disabled):hover{box-shadow:0 6px 24px rgba(244,63,94,.5);}
.lf-btn-export{background:linear-gradient(135deg,var(--emerald),#059669);color:#fff;box-shadow:0 4px 16px rgba(16,185,129,.3);}
.lf-btn-export:not(:disabled):hover{box-shadow:0 6px 24px rgba(16,185,129,.5);}
.lf-btn-ec{background:linear-gradient(135deg,var(--amber),#d97706);color:#fff;box-shadow:0 4px 16px rgba(245,158,11,.3);}
.lf-btn-ec:not(:disabled):hover{box-shadow:0 6px 24px rgba(245,158,11,.5);}
.lf-btn-lines{background:rgba(6,182,212,.12);color:var(--cyan);border:1px solid rgba(6,182,212,.25);}
.lf-btn-lines:not(:disabled):hover{background:rgba(6,182,212,.2);border-color:rgba(6,182,212,.4);}
.lf-btn-sm{padding:6px 14px;font-size:11px;border-radius:8px;}
.lf-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;}
.lf-tbl-wrap{overflow-x:auto;}
.lf-tbl{width:100%;border-collapse:collapse;font-size:13px;}
.lf-tbl th{padding:1rem 1.25rem;font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-family:'JetBrains Mono',monospace;border-bottom:1px solid var(--border);text-align:left;background:rgba(255,255,255,.02);}
.lf-tbl td{padding:1rem 1.25rem;border-bottom:1px solid rgba(255,255,255,.03);vertical-align:middle;}
.lf-tbl tbody tr:last-child td{border-bottom:none;}
.lf-tbl tbody tr{transition:background .15s ease;}
.lf-tbl tbody tr:hover{background:rgba(255,255,255,.02);}
.lf-tbl tbody tr.clickable{cursor:pointer;}
.lf-tbl tbody tr.clickable:hover td{background:rgba(99,102,241,.06);}
.lf-tbl tbody tr.clickable:hover .lf-fournisseur{color:var(--indigo);}
.lf-row-hint{font-size:10px;color:rgba(99,102,241,.6);font-family:'JetBrains Mono',monospace;display:block;margin-top:2px;transition:color .2s;}
.lf-tbl tbody tr.clickable:hover .lf-row-hint{color:var(--indigo);}
.lf-id{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);font-weight:600;}
.lf-fournisseur{font-weight:700;color:var(--text);font-size:14px;transition:color .2s;}
.lf-date{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.5);}
.lf-total{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--emerald);}
.lf-tva{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);}
.lf-owner{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.45);}
.lf-company{font-size:11px;color:var(--text);background:rgba(99,102,241,.15);padding:4px 10px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-weight:600;display:inline-block;}
.lf-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:10px;font-size:11px;font-family:'JetBrains Mono',monospace;font-weight:600;letter-spacing:.03em;}
.lf-badge::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;animation:pulse 2s ease infinite;}
.lf-badge--ok{background:rgba(16,185,129,.15);color:var(--emerald);border:1px solid rgba(16,185,129,.3);}
.lf-badge--pending{background:rgba(245,158,11,.15);color:var(--amber);border:1px solid rgba(245,158,11,.3);}
.lf-filter{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:16px;padding:1.25rem 1.5rem;margin-bottom:1.5rem;}
.lf-filter-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:0;}
.lf-filter-toggle{display:flex;align-items:center;gap:8px;background:none;border:none;color:var(--muted);font-size:12px;font-weight:600;cursor:pointer;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;padding:0;transition:color .2s;}
.lf-filter-toggle:hover{color:var(--text);}
.lf-filter-toggle svg{transition:transform .25s ease;}
.lf-filter-toggle.open svg{transform:rotate(180deg);}
.lf-filter-badge{background:var(--indigo);color:#fff;border-radius:99px;font-size:10px;font-weight:700;padding:2px 7px;margin-left:4px;}
.lf-filter-reset{background:none;border:1px solid var(--border2);color:var(--muted);border-radius:7px;font-size:11px;cursor:pointer;padding:4px 10px;font-family:'JetBrains Mono',monospace;transition:all .2s;}
.lf-filter-reset:hover{color:var(--text);border-color:rgba(255,255,255,.3);}
.lf-filter-body{margin-top:1.25rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;}
.lf-fg{display:flex;flex-direction:column;gap:5px;}
.lf-fg label{font-size:11px;color:var(--muted);font-weight:600;font-family:'JetBrains Mono',monospace;letter-spacing:.05em;text-transform:uppercase;}
.lf-fi{height:36px;background:#0a0b15;border:1px solid var(--border2);border-radius:9px;color:var(--text);font-size:12px;padding:0 10px;outline:none;width:100%;font-family:'JetBrains Mono',monospace;color-scheme:dark;transition:border-color .2s,box-shadow .2s;}
.lf-fi:focus{border-color:var(--indigo);box-shadow:0 0 0 3px rgba(99,102,241,.2);}
.lf-fi option{background:#0d0f1a;}
.lf-filter-actions{display:flex;align-items:center;gap:10px;margin-top:14px;}
.lf-filter-apply{height:36px;padding:0 20px;background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:'JetBrains Mono',monospace;letter-spacing:.04em;box-shadow:0 4px 16px rgba(99,102,241,.3);transition:all .2s;}
.lf-filter-apply:hover{box-shadow:0 6px 24px rgba(99,102,241,.5);transform:translateY(-1px);}
.lf-filter-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;}
.lf-ftag{display:inline-flex;align-items:center;gap:6px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.35);color:#a5b4fc;border-radius:99px;font-size:11px;font-family:'JetBrains Mono',monospace;padding:3px 10px;}
.lf-ftag button{background:none;border:none;cursor:pointer;color:#a5b4fc;font-size:11px;padding:0;line-height:1;opacity:.7;transition:opacity .15s;}
.lf-ftag button:hover{opacity:1;}
.lf-result-count{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);margin-top:10px;}
.lf-result-count span{color:var(--indigo);font-weight:700;}
.lf-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:2000;padding:2rem;animation:fadeUp .3s ease;}
.lf-modal{background:var(--surface);border:1px solid var(--border2);border-radius:24px;padding:2rem;width:100%;max-width:900px;box-shadow:0 24px 80px rgba(0,0,0,.6);max-height:85vh;overflow-y:auto;animation:fadeUp .4s ease;}
.lf-modal-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid var(--border);}
.lf-modal-title{font-size:20px;font-weight:700;letter-spacing:-.02em;}
.lf-modal-subtitle{font-size:12px;color:var(--muted);margin-top:4px;font-family:'JetBrains Mono',monospace;}
.lf-modal-badge{background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;font-size:9px;font-family:'JetBrains Mono',monospace;padding:5px 10px;border-radius:6px;letter-spacing:.1em;font-weight:700;}
.lf-modal-badge-cyan{background:linear-gradient(135deg,var(--cyan),#0891b2);color:#fff;font-size:9px;font-family:'JetBrains Mono',monospace;padding:5px 10px;border-radius:6px;letter-spacing:.1em;font-weight:700;}
.lf-modal-close{background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:10px;width:36px;height:36px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:all .2s ease;color:var(--muted);font-weight:700;}
.lf-modal-close:hover{background:rgba(255,255,255,.08);border-color:var(--border2);color:var(--text);transform:rotate(90deg);}
.lf-lines-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;}
.lf-lines-stat{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:12px;padding:1rem 1.25rem;}
.lf-lines-stat-label{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;}
.lf-lines-stat-val{font-size:20px;font-weight:800;letter-spacing:-.03em;font-family:'JetBrains Mono',monospace;}
.lf-lines-tbl{width:100%;border-collapse:collapse;font-size:13px;}
.lf-lines-tbl th{padding:10px 14px;font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-family:'JetBrains Mono',monospace;border-bottom:1px solid var(--border);text-align:left;background:rgba(255,255,255,.02);}
.lf-lines-tbl th.right{text-align:right;}
.lf-lines-tbl td{padding:13px 14px;border-bottom:1px solid rgba(255,255,255,.03);vertical-align:middle;}
.lf-lines-tbl tbody tr:last-child td{border-bottom:none;}
.lf-lines-tbl tbody tr:hover td{background:rgba(255,255,255,.02);}
.lf-lines-num{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;text-align:right;}
.lf-lines-montant{color:var(--emerald);}
.lf-lines-idx{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:6px;padding:2px 7px;display:inline-block;}
.lf-lines-empty{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);padding:2.5rem;text-align:center;}
.lf-lines-footer{margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);display:flex;justify-content:flex-end;align-items:center;gap:1.5rem;}
.lf-lines-total-label{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;}
.lf-lines-total-val{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:800;color:var(--emerald);}
.lf-ec-tbl{width:100%;border-collapse:collapse;font-size:13px;}
.lf-ec-tbl th{padding:10px 12px;font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-family:'JetBrains Mono',monospace;border-bottom:1px solid var(--border);text-align:left;background:rgba(255,255,255,.02);}
.lf-ec-tbl th.right{text-align:right;}
.lf-ec-tbl td{padding:12px;border-bottom:1px solid rgba(255,255,255,.03);}
.lf-ec-tbl tbody tr:hover{background:rgba(255,255,255,.02);}
.lf-ec-compte{font-family:'JetBrains Mono',monospace;font-size:12px;background:rgba(99,102,241,.15);padding:5px 10px;border-radius:6px;display:inline-block;font-weight:700;color:var(--indigo);}
.lf-ec-num{font-family:'JetBrains Mono',monospace;text-align:right;font-size:13px;font-weight:600;}
.lf-ec-debit{color:var(--rose);}
.lf-ec-credit{color:var(--emerald);}
.lf-ec-zero{color:rgba(255,255,255,.15);}
.lf-ec-footer{padding:1rem 0 0;display:flex;justify-content:flex-end;gap:2.5rem;border-top:1px solid var(--border);margin-top:1rem;}
.lf-ec-total-item{font-family:'JetBrains Mono',monospace;font-size:12px;display:flex;gap:10px;align-items:center;}
.lf-ec-total-label{color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-size:10px;font-weight:600;}
.lf-ec-total-val{font-weight:700;font-size:15px;}
.lf-modal-exports{display:flex;gap:1rem;margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border);}
.lf-ec-empty{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);padding:2rem;text-align:center;}
.lf-confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:3000;padding:2rem;animation:fadeUp .3s ease;}
.lf-confirm-box{background:var(--surface);border:1px solid var(--border2);border-radius:20px;padding:2rem;width:100%;max-width:420px;box-shadow:0 24px 80px rgba(0,0,0,.6);animation:fadeUp .4s ease;}
.lf-confirm-title{font-size:18px;font-weight:700;margin-bottom:.75rem;}
.lf-confirm-text{font-size:13px;color:rgba(255,255,255,.6);margin-bottom:1.5rem;line-height:1.6;}
.lf-confirm-actions{display:flex;gap:1rem;justify-content:flex-end;}
.lf-confirm-cancel{padding:10px 20px;border-radius:10px;background:rgba(255,255,255,.05);color:var(--text);border:1px solid var(--border);cursor:pointer;font-size:13px;font-weight:700;font-family:'Bricolage Grotesque',sans-serif;transition:all .2s ease;}
.lf-confirm-cancel:hover{background:rgba(255,255,255,.08);border-color:var(--border2);}
.lf-confirm-ok{padding:10px 20px;border-radius:10px;background:linear-gradient(135deg,var(--rose),#dc2626);color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Bricolage Grotesque',sans-serif;transition:all .2s ease;box-shadow:0 4px 16px rgba(244,63,94,.4);}
.lf-confirm-ok:hover{box-shadow:0 6px 24px rgba(244,63,94,.6);transform:translateY(-2px);}
.lf-loader{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:1rem;}
.lf-spinner{width:36px;height:36px;border:3px solid rgba(99,102,241,.2);border-top-color:var(--indigo);border-radius:50%;animation:spin .7s linear infinite;}
.lf-ltxt{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);}
.lf-empty{font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--muted);padding:3rem;text-align:center;}

/* ════════════════════════════
   PAGINATION — NOUVEAU
════════════════════════════ */
.lf-pagination{
  display:flex;align-items:center;justify-content:center;
  gap:6px;padding:1.25rem 1.5rem;
  border-top:1px solid rgba(255,255,255,0.05);
  flex-wrap:wrap;
}
.lf-page-btn{
  min-width:36px;height:36px;padding:0 8px;
  border-radius:10px;border:1px solid rgba(255,255,255,0.08);
  background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.5);
  cursor:pointer;font-size:13px;font-family:'JetBrains Mono',monospace;
  display:inline-flex;align-items:center;justify-content:center;
  transition:all .2s ease;
}
.lf-page-btn:hover:not(:disabled){
  background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.18);
  color:var(--text);transform:translateY(-1px);
}
.lf-page-btn:disabled{opacity:.25;cursor:not-allowed;}
.lf-page-btn.active{
  background:linear-gradient(135deg,var(--indigo),var(--violet));
  border-color:var(--indigo);color:#fff;font-weight:700;
  box-shadow:0 4px 16px rgba(99,102,241,.4);
}
.lf-page-dots{
  font-family:'JetBrains Mono',monospace;font-size:13px;
  color:rgba(255,255,255,.25);padding:0 4px;
  display:inline-flex;align-items:center;height:36px;
}
.lf-page-info{
  font-family:'JetBrains Mono',monospace;font-size:11px;
  color:rgba(255,255,255,.3);margin-left:8px;white-space:nowrap;
}
.lf-per-page{
  display:flex;align-items:center;gap:8px;
  font-family:'JetBrains Mono',monospace;font-size:11px;
  color:var(--muted);margin-left:12px;
}
.lf-per-page select{
  height:30px;background:#0a0b15;border:1px solid var(--border2);
  border-radius:7px;color:var(--text);font-size:11px;padding:0 8px;
  outline:none;font-family:'JetBrains Mono',monospace;color-scheme:dark;cursor:pointer;
}

@media(max-width:768px){
  .lf{padding:1rem;}
  .lf-h1{font-size:26px;}
  .lf-kpis{gap:.75rem;}
  .kpi{padding:1rem;}
  .kpi-val{font-size:24px;}
  .lf-tbl{font-size:12px;}
  .lf-tbl th,.lf-tbl td{padding:.75rem;}
  .lf-modal{padding:1.5rem;}
  .lf-filter-body{grid-template-columns:1fr;}
  .lf-lines-summary{grid-template-columns:1fr;}
  .lf-pagination{gap:4px;padding:1rem;}
  .lf-per-page{display:none;}
}
`;

const EMPTY_FILTERS = { entreprise:"",statut:"",dateFrom:"",dateTo:"",montantMin:"",montantMax:"" };
const TAG_LABELS = {
  entreprise:(v)=>`Entreprise: ${v}`,
  statut:(v)=>`Statut: ${{VALIDATED:"Validée",PENDING:"En attente"}[v]??v}`,
  dateFrom:(v)=>`Depuis: ${v}`,
  dateTo:(v)=>`Jusqu'au: ${v}`,
  montantMin:(v)=>`Min: ${v} MAD`,
  montantMax:(v)=>`Max: ${v} MAD`,
};

// ════════════════════════════════════════════
// COMPOSANT PAGINATION — NOUVEAU
// ════════════════════════════════════════════
function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onPerPageChange }) {
  if (totalPages <= 1) return null;
  const from = (currentPage - 1) * itemsPerPage + 1;
  const to   = Math.min(currentPage * itemsPerPage, totalItems);

  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="lf-pagination">
      <button className="lf-page-btn" disabled={currentPage===1} onClick={()=>onPageChange(currentPage-1)}>←</button>
      {pages.map((p,idx) =>
        p==="..." ? (
          <span key={`d${idx}`} className="lf-page-dots">…</span>
        ) : (
          <button key={p} className={`lf-page-btn${p===currentPage?" active":""}`} onClick={()=>onPageChange(p)}>{p}</button>
        )
      )}
      <button className="lf-page-btn" disabled={currentPage===totalPages} onClick={()=>onPageChange(currentPage+1)}>→</button>
      <span className="lf-page-info">{from}–{to} / {totalItems}</span>
      <div className="lf-per-page">
        <span>Par page :</span>
        <select value={itemsPerPage} onChange={e=>onPerPageChange(Number(e.target.value))}>
          {[10,20,50,100].map(n=><option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════
export default function ListeFactures() {
  const { isSuperAdmin, isAdmin } = useRole();
  const location = useLocation();

  const [factures,      setFactures]      = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [validating,    setValidating]    = useState(null);
  const [deleting,      setDeleting]      = useState(null);
  const [validatingAll, setValidatingAll] = useState(false);
  const [loadingEc,     setLoadingEc]     = useState(false);
  const [ecritures,     setEcritures]     = useState([]);
  const [modal,         setModal]         = useState(false);
  const [modalFacture,  setModalFacture]  = useState(null);
  const [confirm,       setConfirm]       = useState(null);
  const [linesModal,    setLinesModal]    = useState(false);
  const [linesFacture,  setLinesFacture]  = useState(null);
  const [lignes,        setLignes]        = useState([]);
  const [loadingLines,  setLoadingLines]  = useState(false);
  const [filters,       setFilters]       = useState(EMPTY_FILTERS);
  const [filterOpen,    setFilterOpen]    = useState(true);

  // ── NOUVEAU : état pagination ──
  const [currentPage,  setCurrentPage]  = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ════════════════════════════════════════════
  // FETCH — IDENTIQUE À L'ANCIEN CODE
  // ════════════════════════════════════════════
  useEffect(() => {
  setLoading(true);

  const fetchAllInvoices = async () => {
    let all = [];
    let page = 1;
    while (true) {
      const res = await api.get(`/invoices/?page=${page}&page_size=20`);
      const data = res.data;
      all = [...all, ...(data.results ?? [])];
      if (!data.next || all.length >= data.count) break;
      page++;
    }
    return all;
  };

  Promise.all([fetchAllInvoices(), api.get("/invoices/stats/")])
    .then(([allFactures, statsRes]) => {
      setFactures(allFactures);
      setStats(statsRes.data);
      setLoading(false);
    })
    .catch(() => setLoading(false));
}, [location]);

// Reset page 1 quand filtre ou taille de page change  ← gardez ce 2ème useEffect intact
useEffect(() => { setCurrentPage(1); }, [filters, itemsPerPage]);

  const entreprisesUniques = useMemo(
    () => [...new Set(factures.map(f => f.company_name).filter(Boolean))].sort(),
    [factures]
  );

  // ════════════════════════════════════════════
  // FILTRES — IDENTIQUES À L'ANCIEN CODE
  // ════════════════════════════════════════════
  const facturesFiltrees = useMemo(() => {
    let result = [...factures];
    if (filters.entreprise) result = result.filter(f => f.company_name === filters.entreprise);
    if (filters.statut)     result = result.filter(f => f.status === filters.statut);
    if (filters.dateFrom)   result = result.filter(f => f.date_facture && f.date_facture >= filters.dateFrom);
    if (filters.dateTo)     result = result.filter(f => f.date_facture && f.date_facture <= filters.dateTo);
    if (filters.montantMin !== "") result = result.filter(f => parseFloat(f.total||0) >= parseFloat(filters.montantMin));
    if (filters.montantMax !== "") result = result.filter(f => parseFloat(f.total||0) <= parseFloat(filters.montantMax));
    return result;
  }, [factures, filters]);

  // ── NOUVEAU : calcul pagination ──
  const totalPages   = Math.ceil(facturesFiltrees.length / itemsPerPage);
  const facturesPage = facturesFiltrees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const setFilter     = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const removeFilter  = (key) => setFilters(prev => ({ ...prev, [key]: "" }));
  const resetFilters  = () => setFilters(EMPTY_FILTERS);
  const activeFilters = Object.entries(filters).filter(([, v]) => v !== "");
  const activeCount   = activeFilters.length;

  // ════════════════════════════════════════════
  // HANDLERS — IDENTIQUES À L'ANCIEN CODE
  // ════════════════════════════════════════════
  const handleOpenLines = async (facture, e) => {
    if (e.target.closest("button")) return;
    setLinesFacture(facture);
    setLignes([]);
    setLinesModal(true);
    setLoadingLines(true);
    try {
      const res = await api.get(`/invoices/${facture.id}/`);
      setLignes(res.data.lignes || res.data.lines || []);
    } catch { setLignes([]); }
    finally { setLoadingLines(false); }
  };

  const handleExport = async (url, filename) => {
    try {
      const res = await api.get(url, { responseType: "blob" });
      const contentType = res.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = await res.data.text();
        alert("Erreur serveur : " + text);
        return;
      }
      const blob = new Blob([res.data], { type: contentType });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      alert(`Erreur lors de l'export (${err.response?.status || "réseau"}) — vérifiez la console`);
    }
  };

  const handleValider = async (id) => {
    setValidating(id);
    try {
      const res = await api.post(`/invoices/${id}/valider/`);
      setFactures(prev => prev.map(f => f.id === id ? { ...f, status: "VALIDATED" } : f));
      setStats(prev => prev ? {
        ...prev,
        validated: (prev.validated || 0) + 1,
        pending:   Math.max(0, (prev.pending || 0) - 1),
      } : prev);
      setEcritures(res.data.ecritures || []);
      setModalFacture(factures.find(f => f.id === id));
      setModal(true);
    } catch { alert("Erreur lors de la validation"); }
    finally { setValidating(null); }
  };

  const handleVoirEcritures = async (facture) => {
    setLoadingEc(facture.id);
    setModalFacture(facture);
    setEcritures([]);
    setModal(true);
    try {
      const res = await api.get(`/invoices/${facture.id}/ecritures/`);
      setEcritures(res.data.ecritures || []);
    } catch {
      try {
        const res2 = await api.get(`/invoices/${facture.id}/`);
        setEcritures(res2.data.ecritures || []);
      } catch { setEcritures([]); }
    } finally { setLoadingEc(null); }
  };

  const handleValiderTous = async () => {
    setValidatingAll(true);
    try {
      await api.post("/invoices/valider-all/");
      setFactures(prev => prev.map(f => ({ ...f, status: "VALIDATED" })));
      api.get("/invoices/stats/").then(r => setStats(r.data)).catch(() => {});
    } catch { alert("Erreur lors de la validation groupée"); }
    finally { setValidatingAll(false); }
  };

  const handleEffacer = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/invoices/${id}/`);
      setFactures(prev => prev.filter(f => f.id !== id));
      setStats(prev => prev ? { ...prev, total: Math.max(0, (prev.total || 0) - 1) } : prev);
    } catch { alert("Erreur lors de la suppression"); }
    finally { setDeleting(null); }
  };

  const handleEffacerTous = async () => {
    try {
      await api.delete("/invoices/delete-all/");
      setFactures([]);
      setStats({ total:0, validated:0, pending:0, rejected:0, amount:0 });
    } catch { alert("Erreur lors de la suppression groupée"); }
  };

  const askConfirm = (message, onOk) => setConfirm({ message, onOk });

  // ════════════════════════════════════════════
  // KPIs — IDENTIQUES À L'ANCIEN CODE
  // ════════════════════════════════════════════
  const totalCount     = stats?.total     ?? factures.length;
  const validees       = stats?.validated ?? factures.filter(f => f.status === "VALIDATED").length;
  const enAttenteCount = stats?.pending   ?? factures.filter(f => f.status === "PENDING").length;
  const totalDepenses  = stats?.amount    ?? factures.reduce((s, f) => s + parseFloat(f.total || 0), 0);
  const validPct       = totalCount > 0 ? Math.round((validees / totalCount) * 100) : 0;
  const avgAmount      = totalCount > 0 ? Math.round(parseFloat(totalDepenses) / totalCount) : 0;

  const kpis = [
    {
      icon:"📋", lbl:"Total factures",
      val: totalCount, sub:"toutes périodes",
      clr:"#818cf8", bg:"rgba(99,102,241,.15)", glow:"#6366f1",
      badge:`${totalCount} docs`,
    },
    {
      icon:"✅", lbl:"Validées",
      val: validees, sub:`${validPct}% du total`,
      clr:"#34d399", bg:"rgba(16,185,129,.15)", glow:"#10b981",
      badge:`${validPct}%`,
    },
    {
      icon:"⏳", lbl:"En attente",
      val: enAttenteCount, sub:"à traiter",
      clr:"#fbbf24", bg:"rgba(245,158,11,.15)", glow:"#f59e0b",
      badge: enAttenteCount > 0 ? "URGENT" : "OK",
    },
    {
      icon:"💰", lbl:"Montant total",
      val: parseFloat(totalDepenses) >= 1000
        ? `${(parseFloat(totalDepenses)/1000).toFixed(1)}k`
        : parseFloat(totalDepenses).toFixed(0),
      sub:`${avgAmount.toLocaleString("fr-MA")} MAD/facture`,
      clr:"#22d3ee", bg:"rgba(6,182,212,.15)", glow:"#06b6d4",
      badge:"MAD",
    },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="lf">
        <div className="lf-blob1" /><div className="lf-blob2" />
        <div className="lf-inner">

          {/* En-tête */}
          <div className="lf-hd f1">
            <div>
              <div className="lf-eyebrow">Smart Facture · Gestion</div>
              <div className="lf-h1">Liste des <em>factures</em></div>
              <div className="lf-hsub">Cliquez sur une ligne pour voir les détails · Vue d'ensemble et contrôle total</div>
            </div>
            <div className="lf-hright">
              <ShowForRole roles={["ADMIN","SUPER_ADMIN"]}>
                {enAttenteCount > 0 && (
                  <button className="lf-btn lf-btn-validate" disabled={validatingAll}
                    onClick={() => askConfirm(`Valider les ${enAttenteCount} facture(s) en attente ?`, handleValiderTous)}>
                    <span>✓</span>{validatingAll ? "Validation..." : `Valider tout (${enAttenteCount})`}
                  </button>
                )}
              </ShowForRole>
              <ShowForRole roles={["ADMIN","SUPER_ADMIN"]}>
                {totalCount > 0 && (
                  <button className="lf-btn lf-btn-delete"
                    onClick={() => askConfirm(`Supprimer définitivement les ${totalCount} facture(s) ?`, handleEffacerTous)}>
                    <span>🗑</span>Effacer tout ({totalCount})
                  </button>
                )}
              </ShowForRole>
              <button className="lf-btn lf-btn-export"
                onClick={() => handleExport("/export/excel-all/","toutes_factures.xlsx")}>
                <span>↓</span>Exporter Excel
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="lf-kpis f2">
            {kpis.map((k, i) => (
              <div key={i} className="kpi">
                <div className="kpi-glow" style={{background:k.glow}}/>
                <div className="kpi-top">
                  <span className="kpi-icon">{k.icon}</span>
                  <span className="kpi-badge" style={{background:k.bg,color:k.clr}}>{k.badge}</span>
                </div>
                <div className="kpi-label">{k.lbl}</div>
                <div className="kpi-val" style={{color:k.clr}}>{k.val}</div>
                <div className="kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div className="lf-filter f3">
            <div className="lf-filter-hd">
              <button className={`lf-filter-toggle ${filterOpen?"open":""}`} onClick={()=>setFilterOpen(o=>!o)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Filtres
                {activeCount>0 && <span className="lf-filter-badge">{activeCount}</span>}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {activeCount>0 && <button className="lf-filter-reset" onClick={resetFilters}>Tout effacer</button>}
            </div>
            {filterOpen && (
              <>
                <div className="lf-filter-body">
                  {isSuperAdmin && (
                    <div className="lf-fg">
                      <label>Entreprise</label>
                      <select className="lf-fi" value={filters.entreprise} onChange={e=>setFilter("entreprise",e.target.value)}>
                        <option value="">Toutes</option>
                        {entreprisesUniques.map(e=><option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="lf-fg">
                    <label>Statut</label>
                    <select className="lf-fi" value={filters.statut} onChange={e=>setFilter("statut",e.target.value)}>
                      <option value="">Tous</option>
                      <option value="VALIDATED">Validée</option>
                      <option value="PENDING">En attente</option>
                    </select>
                  </div>
                  <div className="lf-fg">
                    <label>Date début</label>
                    <input type="date" className="lf-fi" value={filters.dateFrom} onChange={e=>setFilter("dateFrom",e.target.value)}/>
                  </div>
                  <div className="lf-fg">
                    <label>Date fin</label>
                    <input type="date" className="lf-fi" value={filters.dateTo} onChange={e=>setFilter("dateTo",e.target.value)}/>
                  </div>
                  <div className="lf-fg">
                    <label>Montant min (MAD)</label>
                    <input type="number" className="lf-fi" placeholder="0" min="0" step="100" value={filters.montantMin} onChange={e=>setFilter("montantMin",e.target.value)}/>
                  </div>
                  <div className="lf-fg">
                    <label>Montant max (MAD)</label>
                    <input type="number" className="lf-fi" placeholder="∞" min="0" step="100" value={filters.montantMax} onChange={e=>setFilter("montantMax",e.target.value)}/>
                  </div>
                </div>
                {activeCount>0 && (
                  <div className="lf-filter-actions">
                    <button className="lf-filter-apply" onClick={resetFilters}>↺ Réinitialiser</button>
                  </div>
                )}
              </>
            )}
            {activeCount>0 && (
              <>
                <div className="lf-filter-tags">
                  {activeFilters.map(([key,val])=>(
                    <span key={key} className="lf-ftag">
                      {TAG_LABELS[key]?.(val)??val}
                      <button onClick={()=>removeFilter(key)}>✕</button>
                    </span>
                  ))}
                </div>
                <div className="lf-result-count">
                  <span>{facturesFiltrees.length}</span> facture{facturesFiltrees.length!==1?"s":""} sur {totalCount}
                </div>
              </>
            )}
          </div>

          {/* Tableau */}
          <div className="lf-card f4">
            {loading ? (
              <div className="lf-loader"><div className="lf-spinner"/><div className="lf-ltxt">Chargement des factures...</div></div>
            ) : facturesFiltrees.length===0 ? (
              <div className="lf-empty">{activeCount>0?"Aucune facture ne correspond aux filtres":"Aucune facture disponible"}</div>
            ) : (
              <>
                <div className="lf-tbl-wrap">
                  <table className="lf-tbl">
                    <thead>
                      <tr>
                        <th>ID</th><th>Fournisseur</th>
                        {(isAdmin||isSuperAdmin) && <th>Déposé par</th>}
                        {isSuperAdmin && <th>Entreprise</th>}
                        <th>Date facture</th><th>Date upload</th><th>Date validation</th><th>Total TTC</th><th>TVA</th><th>Statut</th><th>Export</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* ✅ SEUL CHANGEMENT : facturesPage au lieu de facturesFiltrees */}
                      {facturesPage.map(f => (
                        <tr key={f.id} className="clickable" onClick={(e) => handleOpenLines(f, e)}
                          title="Cliquer pour voir les lignes de facture">
                          <td className="lf-id">#{f.id}</td>
                          <td>
                            <div className="lf-fournisseur">{f.fournisseur||"—"}</div>
                            <span className="lf-row-hint">↗ voir les lignes</span>
                          </td>
                          {(isAdmin||isSuperAdmin) && <td className="lf-owner">{f.owner_name||"—"}</td>}
                          {isSuperAdmin && <td><span className="lf-company">{f.company_name||"—"}</span></td>}
                          <td className="lf-date">{f.date_facture||"—"}</td>
<td className="lf-date">
  {f.created_at ? new Date(f.created_at).toLocaleDateString("fr-MA") : "—"}
</td>
<td className="lf-date">
  {f.validated_at ? new Date(f.validated_at).toLocaleDateString("fr-MA") : "—"}
</td>
<td className="lf-total">{parseFloat(f.total).toFixed(2)} {f.devise||"MAD"}</td>
                          <td className="lf-tva">{parseFloat(f.tva).toFixed(2)} {f.devise||"MAD"}</td>
                          <td>
                            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                              <span className={"lf-badge "+(f.status==="VALIDATED"?"lf-badge--ok":"lf-badge--pending")}>
                                {f.status==="VALIDATED"?"Validée":"En attente"}
                              </span>
                              {f.status!=="VALIDATED" && (
                                <ShowForRole roles={["ADMIN","SUPER_ADMIN"]}>
                                  <button className="lf-btn lf-btn-validate lf-btn-sm"
                                    onClick={()=>handleValider(f.id)} disabled={validating===f.id}>
                                    {validating===f.id?"⏳":"Valider"}
                                  </button>
                                </ShowForRole>
                              )}
                              {f.status==="VALIDATED" && (
                                <button className="lf-btn lf-btn-ec lf-btn-sm"
                                  onClick={()=>handleVoirEcritures(f)} disabled={loadingEc===f.id}>
                                  {loadingEc===f.id?"⏳":"📒 Écritures"}
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{display:"flex",gap:6}}>
                              <button className="lf-btn lf-btn-delete lf-btn-sm"
                                onClick={()=>handleExport(`/export/pdf/${f.id}/`,`facture_${f.id}.pdf`)}>PDF</button>
                              <button className="lf-btn lf-btn-export lf-btn-sm"
                                onClick={()=>handleExport(`/export/excel/${f.id}/`,`facture_${f.id}.xlsx`)}>Excel</button>
                            </div>
                          </td>
                          <td>
                            <ShowForRole roles={["ADMIN","SUPER_ADMIN"]}>
                              <button className="lf-btn lf-btn-delete lf-btn-sm" disabled={deleting===f.id}
                                onClick={()=>askConfirm(`Supprimer la facture #${f.id} (${f.fournisseur||"sans fournisseur"}) ?`,()=>handleEffacer(f.id))}>
                                {deleting===f.id?"⏳":"🗑 Effacer"}
                              </button>
                            </ShowForRole>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ✅ PAGINATION — NOUVEAU, juste après le tableau */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={facturesFiltrees.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onPerPageChange={setItemsPerPage}
                />
              </>
            )}
          </div>

        </div>
      </div>

      {/* Modal lignes */}
      {linesModal && (
        <div className="lf-modal-overlay" onClick={()=>setLinesModal(false)}>
          <div className="lf-modal" style={{maxWidth:800}} onClick={e=>e.stopPropagation()}>
            <div className="lf-modal-hd">
              <div>
                <div className="lf-modal-title">📋 Lignes de facture</div>
                <div className="lf-modal-subtitle">
                  {linesFacture?.fournisseur} · #{linesFacture?.id} · {linesFacture?.date_facture||"—"}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span className="lf-modal-badge-cyan">DÉTAIL FACTURE</span>
                <button className="lf-modal-close" onClick={()=>setLinesModal(false)}>×</button>
              </div>
            </div>
            <div className="lf-lines-summary">
              <div className="lf-lines-stat">
                <div className="lf-lines-stat-label">Total TTC</div>
                <div className="lf-lines-stat-val" style={{color:"var(--emerald)"}}>
                  {parseFloat(linesFacture?.total||0).toFixed(2)} <span style={{fontSize:13,color:"var(--muted)"}}>MAD</span>
                </div>
              </div>
              <div className="lf-lines-stat">
                <div className="lf-lines-stat-label">TVA</div>
                <div className="lf-lines-stat-val" style={{color:"var(--amber)"}}>
                  {parseFloat(linesFacture?.tva||0).toFixed(2)} <span style={{fontSize:13,color:"var(--muted)"}}>MAD</span>
                </div>
              </div>
              <div className="lf-lines-stat">
                <div className="lf-lines-stat-label">Lignes</div>
                <div className="lf-lines-stat-val" style={{color:"var(--cyan)"}}>
                  {loadingLines ? "..." : lignes.length}
                </div>
              </div>
            </div>
            {loadingLines ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"2.5rem"}}>
                <div className="lf-spinner"/>
                <div className="lf-ltxt">Chargement des lignes...</div>
              </div>
            ) : lignes.length === 0 ? (
              <div className="lf-lines-empty">Aucune ligne disponible pour cette facture</div>
            ) : (
              <>
                <table className="lf-lines-tbl">
                  <thead>
                    <tr>
                      <th style={{width:40}}>#</th>
                      <th>Désignation</th>
                      <th className="right" style={{width:80}}>Qté</th>
                      <th className="right" style={{width:120}}>Prix unitaire</th>
                      <th className="right" style={{width:130}}>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l, i) => (
                      <tr key={i}>
                        <td><span className="lf-lines-idx">{i+1}</span></td>
                        <td style={{fontWeight:600}}>{l.designation || l.description || "—"}</td>
                        <td className="lf-lines-num">{parseFloat(l.quantite||l.quantity||0).toFixed(0)}</td>
                        <td className="lf-lines-num">{parseFloat(l.prix_unitaire||l.prix||l.price||0).toFixed(2)}</td>
                        <td className="lf-lines-num lf-lines-montant">{parseFloat(l.montant||l.total||0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="lf-lines-footer">
                  <span className="lf-lines-total-label">Total TTC</span>
                  <span className="lf-lines-total-val">
                    {parseFloat(linesFacture?.total||0).toFixed(2)} {linesFacture?.devise||"MAD"}
                  </span>
                </div>
              </>
            )}
            <div className="lf-modal-exports">
              <button className="lf-btn lf-btn-delete"
                onClick={()=>handleExport(`/export/pdf/${linesFacture?.id}/`,`facture_${linesFacture?.id}.pdf`)}>
                📄 PDF
              </button>
              <button className="lf-btn lf-btn-export"
                onClick={()=>handleExport(`/export/excel/${linesFacture?.id}/`,`facture_${linesFacture?.id}.xlsx`)}>
                📊 Excel
              </button>
              {linesFacture?.status === "VALIDATED" && (
                <button className="lf-btn lf-btn-ec"
                  onClick={()=>{ setLinesModal(false); handleVoirEcritures(linesFacture); }}>
                  📒 Voir les écritures
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation */}
      {confirm && (
        <div className="lf-confirm-overlay" onClick={()=>setConfirm(null)}>
          <div className="lf-confirm-box" onClick={e=>e.stopPropagation()}>
            <div className="lf-confirm-title">Confirmation requise</div>
            <div className="lf-confirm-text">{confirm.message}</div>
            <div className="lf-confirm-actions">
              <button className="lf-confirm-cancel" onClick={()=>setConfirm(null)}>Annuler</button>
              <button className="lf-confirm-ok" onClick={()=>{confirm.onOk();setConfirm(null);}}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal écritures */}
      {modal && (
        <div className="lf-modal-overlay" onClick={()=>setModal(false)}>
          <div className="lf-modal" onClick={e=>e.stopPropagation()}>
            <div className="lf-modal-hd">
              <div>
                <div className="lf-modal-title">Écritures Comptables</div>
                <div className="lf-modal-subtitle">
                  Facture: {modalFacture?.fournisseur} • #{modalFacture?.id}
                  {modalFacture?.company_name && ` • ${modalFacture.company_name}`}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span className="lf-modal-badge">PLAN COMPTABLE MAROCAIN</span>
                <button className="lf-modal-close" onClick={()=>setModal(false)}>×</button>
              </div>
            </div>
            {loadingEc ? (
              <div className="lf-ec-empty">
                <div className="lf-spinner" style={{margin:"0 auto 8px"}}/>
                Chargement des écritures...
              </div>
            ) : ecritures.length===0 ? (
              <div className="lf-ec-empty">Aucune écriture comptable disponible</div>
            ) : (
              <>
                <table className="lf-ec-tbl">
                  <thead>
                    <tr><th>Compte</th><th>Libellé</th><th className="right">Débit</th><th className="right">Crédit</th></tr>
                  </thead>
                  <tbody>
                    {ecritures.map((e,i)=>(
                      <tr key={i}>
                        <td><span className="lf-ec-compte">{e.compte}</span></td>
                        <td>{e.libelle}</td>
                        <td className={"lf-ec-num "+(e.debit>0?"lf-ec-debit":"lf-ec-zero")}>
                          {e.debit>0?parseFloat(e.debit).toFixed(2):"—"}
                        </td>
                        <td className={"lf-ec-num "+(e.credit>0?"lf-ec-credit":"lf-ec-zero")}>
                          {e.credit>0?parseFloat(e.credit).toFixed(2):"—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="lf-ec-footer">
                  <div className="lf-ec-total-item">
                    <span className="lf-ec-total-label">Total Débit</span>
                    <span className="lf-ec-total-val lf-ec-debit">
                      {ecritures.reduce((s,e)=>s+parseFloat(e.debit||0),0).toFixed(2)} MAD
                    </span>
                  </div>
                  <div className="lf-ec-total-item">
                    <span className="lf-ec-total-label">Total Crédit</span>
                    <span className="lf-ec-total-val lf-ec-credit">
                      {ecritures.reduce((s,e)=>s+parseFloat(e.credit||0),0).toFixed(2)} MAD
                    </span>
                  </div>
                </div>
              </>
            )}
            {modalFacture && (
              <div className="lf-modal-exports">
                <button className="lf-btn lf-btn-delete"
                  onClick={()=>handleExport(`/export/pdf/${modalFacture.id}/`,`facture_${modalFacture.id}.pdf`)}>
                  📄 Télécharger PDF
                </button>
                <button className="lf-btn lf-btn-export"
                  onClick={()=>handleExport(`/export/excel/${modalFacture.id}/`,`facture_${modalFacture.id}.xlsx`)}>
                  📊 Télécharger Excel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
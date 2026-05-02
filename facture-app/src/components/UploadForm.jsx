import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

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
@keyframes sfLoad{0%{width:0%}50%{width:70%}100%{width:100%}}
@keyframes borderPulse{0%,100%{border-color:rgba(99,102,241,.3);}50%{border-color:rgba(99,102,241,.7);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}

.f1{animation:fadeUp .5s ease .05s both;}
.f2{animation:fadeUp .5s ease .12s both;}
.f3{animation:fadeUp .5s ease .20s both;}
.f4{animation:fadeUp .5s ease .28s both;}
.f5{animation:fadeUp .5s ease .36s both;}

.sf-shell{display:grid;grid-template-columns:360px 1fr;min-height:100vh;font-family:'Bricolage Grotesque',sans-serif;color:var(--text);background:var(--bg);position:relative;}
.sf-blob1{position:fixed;top:-300px;left:-200px;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 65%);pointer-events:none;z-index:0;}
.sf-blob2{position:fixed;bottom:-200px;right:-100px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(16,185,129,0.07) 0%,transparent 65%);pointer-events:none;z-index:0;}

.sf-left{background:var(--surface);border-right:1px solid var(--border);padding:2.5rem 2rem;display:flex;flex-direction:column;gap:1.5rem;position:relative;z-index:1;}
.sf-brand{display:flex;align-items:center;gap:10px;}
.sf-brand-icon{width:38px;height:38px;background:linear-gradient(135deg,var(--indigo),var(--violet));border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(99,102,241,.35);}
.sf-eyebrow{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--indigo);margin-bottom:3px;}
.sf-brand-name{font-size:15px;font-weight:800;letter-spacing:-.01em;}
.sf-divider{height:1px;background:var(--border);}
.sf-sec-label{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);margin-bottom:.75rem;}

.sf-drop-zone{border:1.5px dashed rgba(99,102,241,.35);border-radius:16px;padding:2rem 1.5rem;display:flex;flex-direction:column;align-items:center;gap:12px;cursor:pointer;transition:border-color .2s,background .2s,transform .15s;background:rgba(99,102,241,.03);position:relative;overflow:hidden;}
.sf-drop-zone::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(99,102,241,.08),transparent 70%);opacity:0;transition:opacity .2s;pointer-events:none;}
.sf-drop-zone:hover{border-color:rgba(99,102,241,.7);background:rgba(99,102,241,.06);transform:translateY(-1px);}
.sf-drop-zone:hover::before{opacity:1;}
.sf-drop-zone.dragging{border-color:var(--indigo);background:rgba(99,102,241,.1);animation:borderPulse 1.5s ease infinite;}
.sf-drop-icon{width:52px;height:52px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);border-radius:14px;display:flex;align-items:center;justify-content:center;transition:background .2s,transform .2s;}
.sf-drop-zone:hover .sf-drop-icon{background:rgba(99,102,241,.2);transform:translateY(-2px);}
.sf-drop-label{font-size:13px;color:rgba(255,255,255,.6);text-align:center;line-height:1.6;}
.sf-drop-label strong{background:linear-gradient(120deg,var(--indigo),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:700;}
.sf-drop-hint{font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;background:rgba(255,255,255,.04);border:1px solid var(--border);padding:4px 10px;border-radius:6px;letter-spacing:.06em;}

.sf-file-chip{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:10px;}
.sf-chip-name{font-size:12px;color:#34d399;font-family:'JetBrains Mono',monospace;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sf-chip-size{font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;}
.sf-chip-remove{background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;border-radius:4px;display:flex;align-items:center;transition:color .15s;}
.sf-chip-remove:hover{color:var(--rose);}

.sf-btn-upload{width:100%;padding:14px;background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;font-family:'Bricolage Grotesque',sans-serif;font-size:14px;font-weight:700;border:none;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity .2s,transform .1s,box-shadow .2s;box-shadow:0 4px 20px rgba(99,102,241,.35);letter-spacing:.01em;}
.sf-btn-upload:hover:not(:disabled){opacity:.9;box-shadow:0 6px 28px rgba(99,102,241,.5);}
.sf-btn-upload:active:not(:disabled){transform:scale(0.98);}
.sf-btn-upload:disabled{opacity:.3;cursor:not-allowed;box-shadow:none;}

.sf-progress-wrap{background:rgba(255,255,255,.05);border-radius:99px;height:4px;overflow:hidden;}
.sf-progress-fill{height:100%;background:linear-gradient(90deg,var(--indigo),var(--cyan));border-radius:99px;animation:sfLoad 1.5s ease infinite;}

.sf-status-row{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace;padding:10px 14px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;}
.sf-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.2);flex-shrink:0;}
.sf-dot--ok{background:var(--emerald);box-shadow:0 0 6px rgba(16,185,129,.5);}
.sf-dot--error{background:var(--rose);}
.sf-dot--loading{background:var(--indigo);animation:pulse 1s infinite;}

.sf-left-footer{margin-top:auto;padding:12px 14px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,.02);font-size:11px;color:var(--muted);line-height:1.7;font-family:'JetBrains Mono',monospace;}

/* ── RIGHT ── */
.sf-right{background:var(--bg);padding:2.5rem;overflow-y:auto;position:relative;z-index:1;}

/* ── TABS ── */
.sf-tabs{display:flex;gap:4px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:4px;margin-bottom:1.5rem;}
.sf-tab{flex:1;padding:9px 14px;border:none;background:transparent;color:var(--muted);font-family:'Bricolage Grotesque',sans-serif;font-size:13px;font-weight:600;border-radius:9px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px;}
.sf-tab.active{background:var(--surface);color:var(--text);box-shadow:0 2px 8px rgba(0,0,0,.3);}
.sf-tab:hover:not(.active){color:rgba(255,255,255,.6);}

/* ── FILE PREVIEW ── */
.sf-preview-wrap{background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;animation:fadeIn .3s ease;}
.sf-preview-header{padding:1rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.sf-preview-title{font-size:13px;font-weight:700;display:flex;align-items:center;gap:8px;}
.sf-preview-badge{font-family:'JetBrains Mono',monospace;font-size:10px;background:rgba(99,102,241,.12);color:var(--indigo);padding:3px 8px;border-radius:6px;border:1px solid rgba(99,102,241,.25);}
.sf-preview-body{padding:1.5rem;display:flex;align-items:center;justify-content:center;min-height:400px;background:rgba(0,0,0,.2);}
.sf-preview-img{max-width:100%;max-height:600px;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.5);object-fit:contain;}
.sf-preview-pdf{width:100%;height:600px;border:none;border-radius:10px;}
.sf-preview-empty{display:flex;flex-direction:column;align-items:center;gap:12px;color:var(--muted);}
.sf-preview-empty-icon{width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;}

/* ── RESULTS ── */
.sf-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:20px;}
.sf-empty-icon{width:90px;height:90px;border-radius:24px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;}
.sf-empty-title{font-size:18px;font-weight:700;color:rgba(255,255,255,.4);}
.sf-empty-sub{font-size:13px;color:var(--muted);font-family:'JetBrains Mono',monospace;text-align:center;line-height:1.7;}

.panel{background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;margin-bottom:1.5rem;}
.panel-hd{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:.5rem;}
.panel-title{font-size:15px;font-weight:700;letter-spacing:-.01em;}
.panel-badge{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted);background:rgba(255,255,255,.05);padding:4px 10px;border-radius:8px;border:1px solid var(--border);}
.panel-badge--green{color:var(--emerald);background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.25);}

.sf-total-banner{background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(6,182,212,.08));border-bottom:1px solid var(--border);padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between;}
.sf-total-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-family:'JetBrains Mono',monospace;margin-bottom:4px;}
.sf-total-amount{font-size:32px;font-weight:800;letter-spacing:-.04em;font-family:'JetBrains Mono',monospace;background:linear-gradient(120deg,var(--indigo),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.sf-total-currency{font-size:14px;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-left:6px;}
.sf-devise-badge{display:inline-flex;align-items:center;gap:5px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;margin-left:8px;vertical-align:middle;}
.sf-devise-EUR{background:rgba(99,102,241,.15);color:#818cf8;border:1px solid rgba(99,102,241,.25);}
.sf-devise-USD{background:rgba(16,185,129,.12);color:var(--emerald);border:1px solid rgba(16,185,129,.25);}
.sf-devise-GBP{background:rgba(245,158,11,.12);color:var(--amber);border:1px solid rgba(245,158,11,.25);}
.sf-devise-MAD{background:rgba(6,182,212,.12);color:var(--cyan);border:1px solid rgba(6,182,212,.25);}
.sf-devise-default{background:rgba(255,255,255,.05);color:var(--muted);border:1px solid var(--border);}

.sf-fournisseur-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-family:'JetBrains Mono',monospace;margin-bottom:4px;}
.sf-fournisseur-name{font-size:22px;font-weight:800;letter-spacing:-.02em;}
.sf-meta-id{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);margin-top:4px;}

.tbl-wrap{overflow-x:auto;padding:1.25rem 1.5rem;}
.tbl{width:100%;border-collapse:collapse;font-size:13px;}
.tbl th{padding:8px 12px;font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-family:'JetBrains Mono',monospace;border-bottom:1px solid var(--border);text-align:left;}
.tbl th.right{text-align:right;}
.tbl td{padding:12px;border-bottom:1px solid rgba(255,255,255,.03);vertical-align:middle;}
.tbl tbody tr:last-child td{border-bottom:none;}
.tbl tbody tr:hover td{background:rgba(255,255,255,.02);}
.tbl-input{width:100%;border:none;background:transparent;font-family:'Bricolage Grotesque',sans-serif;font-size:13px;color:var(--text);padding:6px 8px;border-radius:8px;transition:background .15s;}
.tbl-input:focus{outline:none;background:rgba(255,255,255,.05);}
.tbl-input.num{width:80px;font-family:'JetBrains Mono',monospace;text-align:right;}
.tbl-mono{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;text-align:right;color:var(--text);}

.sf-card-footer{padding:1.25rem 1.5rem;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.sf-lignes-count{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);}
.sf-btn-validate{padding:11px 22px;background:rgba(16,185,129,.12);color:var(--emerald);font-family:'Bricolage Grotesque',sans-serif;font-size:13px;font-weight:700;border:1.5px solid rgba(16,185,129,.3);border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background .15s,border-color .15s,box-shadow .2s;}
.sf-btn-validate:hover:not(:disabled){background:rgba(16,185,129,.2);border-color:rgba(16,185,129,.5);box-shadow:0 4px 16px rgba(16,185,129,.2);}
.sf-btn-validate:disabled{opacity:.5;cursor:not-allowed;}
.sf-btn-validate--done{background:rgba(16,185,129,.18);border-color:rgba(16,185,129,.4);}

.sf-ecritures-badge{font-family:'JetBrains Mono',monospace;font-size:10px;background:rgba(99,102,241,.12);color:var(--indigo);padding:4px 10px;border-radius:8px;border:1px solid rgba(99,102,241,.25);letter-spacing:.06em;}
.sf-ec-compte{font-family:'JetBrains Mono',monospace;font-size:12px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);padding:3px 8px;border-radius:6px;display:inline-block;font-weight:600;color:#818cf8;}
.sf-ec-num{font-family:'JetBrains Mono',monospace;text-align:right;font-size:13px;}
.sf-ec-debit{color:var(--rose);}
.sf-ec-credit{color:var(--emerald);}
.sf-ec-zero{color:rgba(255,255,255,.15);}
.sf-ec-footer{padding:1rem 1.5rem;background:rgba(255,255,255,.02);border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:2rem;}
.sf-ec-total-item{font-family:'JetBrains Mono',monospace;font-size:12px;display:flex;gap:8px;align-items:center;}
.sf-ec-total-label{color:var(--muted);}
.sf-ec-total-val{font-weight:700;}

@media(max-width:900px){
  .sf-shell{grid-template-columns:1fr;}
  .sf-left{border-right:none;border-bottom:1px solid var(--border);}
}
`;

function DeviseIcon({ devise }) {
  const icons = { EUR: "€", USD: "$", GBP: "£", MAD: "د", JPY: "¥", CHF: "₣", CAD: "C$" };
  const cls   = ["EUR","USD","GBP","MAD"].includes(devise)
    ? `sf-devise-badge sf-devise-${devise}`
    : "sf-devise-badge sf-devise-default";
  return <span className={cls}>{icons[devise] || devise} {devise}</span>;
}

export default function UploadForm() {
  const navigate = useNavigate();
  const [file,        setFile]        = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState(null);   // ← NEW
  const [isPdf,       setIsPdf]       = useState(false);  // ← NEW
  const [activeTab,   setActiveTab]   = useState("preview"); // ← NEW : "preview" | "results"
  const [data,        setData]        = useState(null);
  const [factureId,   setFactureId]   = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [validated,   setValidated]   = useState(false);
  const [ecritures,   setEcritures]   = useState([]);
  const [devise,      setDevise]      = useState("MAD");
  const [statusState, setStatusState] = useState("idle");
  const [dragging,    setDragging]    = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setStatusState("ok");
    setData(null);
    setValidated(false);
    setEcritures([]);
    setActiveTab("preview");

    // Générer l'URL de prévisualisation
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setIsPdf(f.type === "application/pdf");
  };

  const handleChange = (e) => handleFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true); setStatusState("loading");
      const res = await api.post("/upload/", formData);
      setData(res.data.data);
      setFactureId(res.data.facture_id);
      setDevise(res.data.data?.devise || res.data.devise || "MAD");
      setValidated(false); setEcritures([]);
      setStatusState("ok");
      setActiveTab("results"); // ← Basculer sur les résultats après analyse
    } catch { setStatusState("error"); }
    finally { setLoading(false); }
  };

  const handleEdit = (index, field, value) => {
    const updated = [...data.lignes];
    updated[index][field] = value;
    updated[index].montant = updated[index].quantite * updated[index].prix;
    setData({ ...data, lignes: updated, total: updated.reduce((s, l) => s + l.montant, 0) });
  };

  const handleValidate = async () => {
    try {
      const res = await api.post("/validate/", { ...data, facture_id: factureId });
      setValidated(true);
      setEcritures(res.data.ecritures || []);
      if (res.data.devise) setDevise(res.data.devise);
      setTimeout(() => navigate("/factures"), 1000);
    } catch { alert("Erreur validation ❌"); }
  };

  const dotClass = {
    idle: "sf-dot", ok: "sf-dot sf-dot--ok",
    loading: "sf-dot sf-dot--loading", error: "sf-dot sf-dot--error",
  }[statusState];

  const statusMsg = {
    idle: "En attente d'un fichier", ok: "Fichier prêt",
    loading: "Analyse en cours…", error: "Erreur — réessayez",
  }[statusState];

  return (
    <>
      <style>{styles}</style>
      <div className="sf-shell">
        <div className="sf-blob1" />
        <div className="sf-blob2" />

        {/* ── LEFT ── */}
        <div className="sf-left">
          <div className="sf-brand f1">
            <div className="sf-brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <div className="sf-eyebrow">Smart Facture · OCR</div>
              <div className="sf-brand-name">Import facture</div>
            </div>
          </div>

          <div className="sf-divider" />

          <div className="f2">
            <div className="sf-sec-label">Fichier source</div>
            <label
              className={`sf-drop-zone${dragging ? " dragging" : ""}`}
              htmlFor="sf-file-input"
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="sf-drop-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.8)" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div className="sf-drop-label">
                Glissez votre facture ou<br/><strong>cliquez pour choisir</strong>
              </div>
              <div className="sf-drop-hint">PDF · PNG · JPG · JPEG</div>
            </label>
            <input id="sf-file-input" type="file" accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleChange} style={{ display: "none" }} />
          </div>

          {file && (
            <div className="sf-file-chip f3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="sf-chip-name">{file.name}</span>
              <span className="sf-chip-size">{(file.size / 1024).toFixed(0)} KB</span>
              <button className="sf-chip-remove" onClick={() => {
                setFile(null); setPreviewUrl(null); setData(null);
                setStatusState("idle"); setActiveTab("preview");
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          <button className="sf-btn-upload f4" onClick={handleSubmit} disabled={!file || loading}>
            {loading ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: "spin .7s linear infinite" }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Traitement…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Analyser la facture
              </>
            )}
          </button>

          {loading && (
            <div className="sf-progress-wrap">
              <div className="sf-progress-fill" />
            </div>
          )}

          <div className="sf-status-row f4">
            <div className={dotClass} />
            <span>{statusMsg}</span>
          </div>

          <div className="sf-left-footer f5">
            🔒 Les données sont traitées localement.<br/>
            Aucune donnée n'est conservée après session.
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="sf-right">

          {/* Tabs — visibles seulement si un fichier est chargé */}
          {file && (
            <div className="sf-tabs f1">
              <button
                className={`sf-tab${activeTab === "preview" ? " active" : ""}`}
                onClick={() => setActiveTab("preview")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Aperçu
              </button>
              <button
                className={`sf-tab${activeTab === "results" ? " active" : ""}`}
                onClick={() => setActiveTab("results")}
                disabled={!data}
                style={{ opacity: data ? 1 : 0.4 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Résultats OCR
                {data && (
                  <span style={{
                    background: "var(--emerald)", color: "#000", fontSize: 9,
                    fontWeight: 800, padding: "1px 5px", borderRadius: 4,
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>✓</span>
                )}
              </button>
            </div>
          )}

          {/* ── TAB APERÇU ── */}
          {(!file || activeTab === "preview") && (
            !file ? (
              // Aucun fichier sélectionné
              <div className="sf-empty f1">
                <div className="sf-empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1.2">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div className="sf-empty-title">Aucune facture importée</div>
                <div className="sf-empty-sub">
                  Importez une facture PDF ou image<br/>pour démarrer l'analyse OCR
                </div>
              </div>
            ) : (
              // Aperçu du fichier
              <div className="sf-preview-wrap f1">
                <div className="sf-preview-header">
                  <div className="sf-preview-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    {file.name}
                  </div>
                  <span className="sf-preview-badge">
                    {isPdf ? "PDF" : "IMAGE"} · {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
                <div className="sf-preview-body">
                  {isPdf ? (
                    <iframe
                      src={previewUrl}
                      className="sf-preview-pdf"
                      title="Aperçu PDF"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Aperçu facture"
                      className="sf-preview-img"
                    />
                  )}
                </div>
              </div>
            )
          )}

          {/* ── TAB RÉSULTATS ── */}
          {file && activeTab === "results" && (
            !data ? (
              <div className="sf-empty f1">
                <div className="sf-empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1.2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <div className="sf-empty-title">Pas encore analysée</div>
                <div className="sf-empty-sub">
                  Cliquez sur "Analyser la facture"<br/>pour lancer l'OCR
                </div>
              </div>
            ) : (
              <>
                <div className="panel f1">
                  <div className="panel-hd">
                    <div>
                      <div className="sf-fournisseur-label">Fournisseur</div>
                      <div className="sf-fournisseur-name">{data.fournisseur}</div>
                      <div className="sf-meta-id">ID · {factureId}</div>
                    </div>
                    <span className="panel-badge panel-badge--green">✓ Analysée</span>
                  </div>

                  <div className="sf-total-banner">
                    <div>
                      <div className="sf-total-label">Montant total TTC</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
                        <span className="sf-total-amount">{parseFloat(data.total).toFixed(2)}</span>
                        <span className="sf-total-currency">{devise}</span>
                        <DeviseIcon devise={devise} />
                      </div>
                    </div>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.3)" strokeWidth="1">
                      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                    </svg>
                  </div>

                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th style={{ width: "40%" }}>Désignation</th>
                          <th className="right" style={{ width: "15%" }}>Qté</th>
                          <th className="right" style={{ width: "20%" }}>Prix unit.</th>
                          <th className="right" style={{ width: "25%" }}>Montant ({devise})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lignes.map((l, i) => (
                          <tr key={i}>
                            <td>
                              <input className="tbl-input" value={l.designation}
                                onChange={e => handleEdit(i, "designation", e.target.value)} />
                            </td>
                            <td>
                              <input className="tbl-input num" type="number" value={l.quantite}
                                onChange={e => handleEdit(i, "quantite", Number(e.target.value))} />
                            </td>
                            <td>
                              <input className="tbl-input num" type="number" value={l.prix}
                                onChange={e => handleEdit(i, "prix", Number(e.target.value))} />
                            </td>
                            <td className="tbl-mono">{l.montant.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="sf-card-footer">
                    <span className="sf-lignes-count">{data.lignes.length} ligne{data.lignes.length > 1 ? "s" : ""}</span>
                    <button className={`sf-btn-validate${validated ? " sf-btn-validate--done" : ""}`}
                      onClick={handleValidate} disabled={validated}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {validated ? "Facture validée ✓" : "Valider la facture"}
                    </button>
                  </div>
                </div>

                {validated && ecritures.length > 0 && (
                  <div className="panel f2">
                    <div className="panel-hd">
                      <div className="panel-title">Écritures comptables</div>
                      <span className="sf-ecritures-badge">PLAN COMPTABLE · {devise}</span>
                    </div>
                    <div className="tbl-wrap">
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Compte</th><th>Libellé</th>
                            <th className="right">Débit ({devise})</th>
                            <th className="right">Crédit ({devise})</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ecritures.map((e, i) => (
                            <tr key={i}>
                              <td><span className="sf-ec-compte">{e.compte}</span></td>
                              <td>{e.libelle}</td>
                              <td className={`sf-ec-num ${e.debit > 0 ? "sf-ec-debit" : "sf-ec-zero"}`}>
                                {e.debit > 0 ? e.debit.toFixed(2) : "—"}
                              </td>
                              <td className={`sf-ec-num ${e.credit > 0 ? "sf-ec-credit" : "sf-ec-zero"}`}>
                                {e.credit > 0 ? e.credit.toFixed(2) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="sf-ec-footer">
                      <div className="sf-ec-total-item">
                        <span className="sf-ec-total-label">Total débit</span>
                        <span className="sf-ec-total-val sf-ec-debit">
                          {ecritures.reduce((s, e) => s + e.debit, 0).toFixed(2)} {devise}
                        </span>
                      </div>
                      <div className="sf-ec-total-item">
                        <span className="sf-ec-total-label">Total crédit</span>
                        <span className="sf-ec-total-val sf-ec-credit">
                          {ecritures.reduce((s, e) => s + e.credit, 0).toFixed(2)} {devise}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>
    </>
  );
}
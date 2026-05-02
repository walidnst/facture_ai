import { useEffect, useState } from "react";
import api from "../services/api";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#06070d;--surface:#0d0f1a;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.13);
  --text:#f0f0f5;--muted:rgba(255,255,255,0.35);
  --indigo:#6366f1;--emerald:#10b981;--rose:#f43f5e;--violet:#8b5cf6;
}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
.f1{animation:fadeUp .4s ease .05s both;}
.f2{animation:fadeUp .4s ease .12s both;}
.f3{animation:fadeUp .4s ease .20s both;}

.cp-shell{background:var(--bg);min-height:100vh;padding:2rem;font-family:'Bricolage Grotesque',sans-serif;color:var(--text);position:relative;overflow:hidden;}
.sf-blob1{position:fixed;top:-250px;left:-150px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 65%);pointer-events:none;z-index:0;}
.sf-blob2{position:fixed;bottom:-200px;right:-100px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(16,185,129,0.07) 0%,transparent 65%);pointer-events:none;z-index:0;}

.cp-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.75rem;flex-wrap:wrap;gap:1rem;position:relative;z-index:1;}
.cp-eyebrow{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--indigo);margin-bottom:3px;}
.cp-title{font-size:22px;font-weight:800;letter-spacing:-.02em;}

.cp-btn-new{padding:11px 20px;background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;font-family:'Bricolage Grotesque',sans-serif;font-size:13px;font-weight:700;border:none;border-radius:11px;cursor:pointer;display:flex;align-items:center;gap:7px;box-shadow:0 4px 16px rgba(99,102,241,.35);transition:opacity .2s,box-shadow .2s;}
.cp-btn-new:hover{opacity:.9;box-shadow:0 6px 24px rgba(99,102,241,.5);}

.cp-card{background:var(--surface);border:1px solid var(--border2);border-radius:20px;overflow:hidden;position:relative;z-index:1;}

.cp-table{width:100%;border-collapse:collapse;font-size:13px;}
.cp-table th{padding:11px 16px;text-align:left;font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.12em;font-family:'JetBrains Mono',monospace;border-bottom:1px solid var(--border);background:rgba(255,255,255,.02);}
.cp-table td{padding:13px 16px;border-bottom:1px solid var(--border);vertical-align:middle;}
.cp-table tbody tr:last-child td{border-bottom:none;}
.cp-table tbody tr:hover td{background:rgba(255,255,255,.025);}
.cp-mono{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);}
.cp-name{font-weight:700;font-size:14px;letter-spacing:-.01em;}
.cp-empty{padding:3rem;text-align:center;color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:13px;}

.cp-badge-active{display:inline-flex;padding:3px 10px;border-radius:6px;font-size:10px;font-family:'JetBrains Mono',monospace;font-weight:600;background:rgba(16,185,129,.12);color:#34d399;border:1px solid rgba(16,185,129,.25);}
.cp-badge-inactive{display:inline-flex;padding:3px 10px;border-radius:6px;font-size:10px;font-family:'JetBrains Mono',monospace;font-weight:600;background:rgba(244,63,94,.1);color:#fb7185;border:1px solid rgba(244,63,94,.2);}

.cp-btn{padding:5px 12px;border-radius:7px;border:none;cursor:pointer;font-size:11px;font-weight:600;font-family:'Bricolage Grotesque',sans-serif;transition:background .15s;margin-left:4px;}
.cp-btn-edit{background:rgba(99,102,241,.12);color:#818cf8;border:1px solid rgba(99,102,241,.2);}
.cp-btn-edit:hover{background:rgba(99,102,241,.2);}
.cp-btn-delete{background:rgba(244,63,94,.1);color:#fb7185;border:1px solid rgba(244,63,94,.2);}
.cp-btn-delete:hover{background:rgba(244,63,94,.18);}

.cp-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:1000;padding:2rem;}
.cp-modal{background:var(--surface);border:1px solid var(--border2);border-radius:22px;padding:2rem;width:100%;max-width:440px;box-shadow:0 24px 80px rgba(0,0,0,.6);}
.cp-modal-title{font-size:16px;font-weight:800;letter-spacing:-.01em;margin-bottom:1.5rem;}
.cp-field{margin-bottom:1.1rem;}
.cp-label{display:block;font-size:10px;font-weight:600;color:var(--muted);margin-bottom:6px;letter-spacing:.12em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;}
.cp-input{width:100%;padding:11px 13px;border-radius:10px;border:1px solid var(--border2);font-size:13px;font-family:'Bricolage Grotesque',sans-serif;outline:none;background:rgba(255,255,255,.04);color:var(--text);transition:border-color .2s,background .2s;}
.cp-input:focus{border-color:var(--indigo);background:rgba(99,102,241,.06);}
.cp-textarea{width:100%;padding:11px 13px;border-radius:10px;border:1px solid var(--border2);font-size:13px;font-family:'Bricolage Grotesque',sans-serif;outline:none;background:rgba(255,255,255,.04);color:var(--text);resize:vertical;min-height:80px;transition:border-color .2s,background .2s;}
.cp-textarea:focus{border-color:var(--indigo);background:rgba(99,102,241,.06);}
.cp-checkbox-row{display:flex;align-items:center;gap:10px;font-size:13px;color:rgba(255,255,255,.7);}
.cp-checkbox-row input[type=checkbox]{accent-color:var(--indigo);width:15px;height:15px;cursor:pointer;}
.cp-modal-actions{display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border);}
.cp-modal-cancel{padding:10px 18px;border-radius:9px;background:rgba(255,255,255,.06);color:var(--text);border:1px solid var(--border2);cursor:pointer;font-size:13px;font-weight:600;font-family:'Bricolage Grotesque',sans-serif;transition:background .15s;}
.cp-modal-cancel:hover{background:rgba(255,255,255,.1);}
.cp-modal-save{padding:10px 18px;border-radius:9px;background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Bricolage Grotesque',sans-serif;box-shadow:0 4px 14px rgba(99,102,241,.35);transition:opacity .2s;}
.cp-modal-save:hover:not(:disabled){opacity:.9;}
.cp-modal-save:disabled{opacity:.35;cursor:not-allowed;box-shadow:none;}
.cp-error{background:rgba(244,63,94,.08);border:1px solid rgba(244,63,94,.2);color:#fb7185;border-radius:10px;padding:10px 13px;font-size:12px;font-family:'JetBrains Mono',monospace;margin-bottom:1rem;}

.cp-confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:2000;padding:2rem;}
.cp-confirm-box{background:var(--surface);border:1px solid var(--border2);border-radius:18px;padding:2rem;width:100%;max-width:370px;box-shadow:0 24px 80px rgba(0,0,0,.6);}
.cp-confirm-icon{width:42px;height:42px;background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.2);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;}
.cp-confirm-title{font-size:15px;font-weight:800;margin-bottom:6px;}
.cp-confirm-text{font-size:13px;color:rgba(255,255,255,.5);margin-bottom:1.5rem;line-height:1.7;font-family:'JetBrains Mono',monospace;}
.cp-confirm-actions{display:flex;gap:.75rem;justify-content:flex-end;}
.cp-confirm-cancel{padding:9px 18px;border-radius:9px;background:rgba(255,255,255,.06);color:var(--text);border:1px solid var(--border2);cursor:pointer;font-size:13px;font-weight:600;font-family:'Bricolage Grotesque',sans-serif;}
.cp-confirm-ok{padding:9px 18px;border-radius:9px;background:rgba(244,63,94,.15);color:#fb7185;border:1.5px solid rgba(244,63,94,.35);cursor:pointer;font-size:13px;font-weight:700;font-family:'Bricolage Grotesque',sans-serif;transition:background .15s;}
.cp-confirm-ok:hover{background:rgba(244,63,94,.25);}
`;

const EMPTY_FORM = { nom: "", adresse: "", is_active: true };

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");
  const [confirm,   setConfirm]   = useState(null);

  useEffect(() => {
    api.get("/companies/")
      .then(res => { setCompanies(res.data.results ?? res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ nom: c.nom || "", adresse: c.adresse || "", is_active: c.is_active });
    setFormError("");
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const res = await api.patch(`/companies/${editing.id}/`, form);
        setCompanies(prev => prev.map(c => c.id === editing.id ? res.data : c));
      } else {
        const res = await api.post("/companies/", form);
        setCompanies(prev => [res.data, ...prev]);
      }
      setModal(false);
    } catch (err) {
      const data = err.response?.data;
      setFormError(
        typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Erreur lors de la sauvegarde."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/companies/${id}/`);
      setCompanies(prev => prev.filter(c => c.id !== id));
    } catch {
      alert("Erreur lors de la suppression.");
    }
  };

  const askConfirm = (message, onOk) => setConfirm({ message, onOk });

  return (
    <>
      <style>{styles}</style>
      <div className="cp-shell">
        <div className="sf-blob1" />
        <div className="sf-blob2" />

        {/* ── TOPBAR ── */}
        <div className="cp-topbar f1">
          <div>
            <div className="cp-eyebrow">Smart Facture · Admin</div>
            <div className="cp-title">Entreprises</div>
          </div>
          <button className="cp-btn-new" onClick={openCreate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nouvelle entreprise
          </button>
        </div>

        {/* ── TABLE ── */}
        <div className="cp-card f2">
          {loading ? (
            <div className="cp-empty">Chargement…</div>
          ) : companies.length === 0 ? (
            <div className="cp-empty">Aucune entreprise.</div>
          ) : (
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Utilisateurs</th>
                  <th>Factures</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="cp-name">{c.nom}</div>
                      {c.adresse && (
                        <div className="cp-mono" style={{ marginTop: 2, fontSize: 11 }}>{c.adresse}</div>
                      )}
                    </td>
                    <td className="cp-mono">{c.user_count ?? "—"}</td>
                    <td className="cp-mono">{c.invoice_count ?? "—"}</td>
                    <td>
                      <span className={c.is_active ? "cp-badge-active" : "cp-badge-inactive"}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button className="cp-btn cp-btn-edit" onClick={() => openEdit(c)}>Modifier</button>
                      <button
                        className="cp-btn cp-btn-delete"
                        onClick={() => askConfirm(
                          `Supprimer l'entreprise "${c.nom}" ?`,
                          () => handleDelete(c.id)
                        )}
                      >Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── MODAL CRÉATION / ÉDITION ── */}
      {modal && (
        <div className="cp-modal-overlay" onClick={() => setModal(false)}>
          <div className="cp-modal" onClick={e => e.stopPropagation()}>
            <div className="cp-modal-title">
              {editing ? `Modifier : ${editing.nom}` : "Nouvelle entreprise"}
            </div>

            {formError && <div className="cp-error">{formError}</div>}

            <div className="cp-field">
              <label className="cp-label">Nom *</label>
              <input
                className="cp-input"
                value={form.nom}
                placeholder="Nom de l'entreprise"
                onChange={e => setForm({ ...form, nom: e.target.value })}
              />
            </div>
            <div className="cp-field">
              <label className="cp-label">Adresse</label>
              <textarea
                className="cp-textarea"
                value={form.adresse}
                placeholder="Adresse complète…"
                onChange={e => setForm({ ...form, adresse: e.target.value })}
              />
            </div>
            <div className="cp-field">
              <div className="cp-checkbox-row">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                />
                <label htmlFor="is_active">Entreprise active</label>
              </div>
            </div>

            <div className="cp-modal-actions">
              <button className="cp-modal-cancel" onClick={() => setModal(false)}>Annuler</button>
              <button className="cp-modal-save" onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM SUPPRESSION ── */}
      {confirm && (
        <div className="cp-confirm-overlay" onClick={() => setConfirm(null)}>
          <div className="cp-confirm-box" onClick={e => e.stopPropagation()}>
            <div className="cp-confirm-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="cp-confirm-title">Confirmation</div>
            <div className="cp-confirm-text">{confirm.message}</div>
            <div className="cp-confirm-actions">
              <button className="cp-confirm-cancel" onClick={() => setConfirm(null)}>Annuler</button>
              <button
                className="cp-confirm-ok"
                onClick={() => { confirm.onOk(); setConfirm(null); }}
              >Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
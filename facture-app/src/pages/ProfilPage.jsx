import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { useRole } from "../hooks/useRole";

const API = "http://127.0.0.1:8000/api";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#06070d;--surface:#0d0f1a;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.13);
  --text:#f0f0f5;--muted:rgba(255,255,255,0.35);
  --indigo:#6366f1;--emerald:#10b981;--rose:#f43f5e;--violet:#8b5cf6;--amber:#f59e0b;
}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
.f1{animation:fadeUp .4s ease .05s both;}
.f2{animation:fadeUp .4s ease .12s both;}
.f3{animation:fadeUp .4s ease .20s both;}
.f4{animation:fadeUp .4s ease .28s both;}
.pf-shell{background:var(--bg);min-height:100vh;padding:2rem;font-family:'Bricolage Grotesque',sans-serif;color:var(--text);display:flex;justify-content:center;position:relative;overflow:hidden;}
.sf-blob1{position:fixed;top:-250px;left:-150px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 65%);pointer-events:none;z-index:0;}
.sf-blob2{position:fixed;bottom:-200px;right:-100px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 65%);pointer-events:none;z-index:0;}
.pf-container{width:100%;max-width:560px;position:relative;z-index:1;}
.pf-eyebrow{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--indigo);margin-bottom:3px;}
.pf-title{font-size:22px;font-weight:800;letter-spacing:-.02em;margin-bottom:2rem;}
.pf-card{background:var(--surface);border:1px solid var(--border2);border-radius:20px;padding:1.75rem;margin-bottom:1.5rem;}
.pf-card-title{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);margin-bottom:1.25rem;padding-bottom:.75rem;border-bottom:1px solid var(--border);}
.pf-avatar-row{display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;}
.pf-avatar-wrapper{position:relative;width:64px;height:64px;flex-shrink:0;}
.pf-avatar{width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,var(--indigo),var(--violet));display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;box-shadow:0 4px 16px rgba(99,102,241,.35);font-family:'JetBrains Mono',monospace;overflow:hidden;cursor:pointer;}
.pf-avatar img{width:100%;height:100%;object-fit:cover;border-radius:16px;}
.pf-avatar-edit{position:absolute;bottom:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:var(--indigo);border:2px solid var(--bg);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s;}
.pf-avatar-edit:hover{background:var(--violet);}
.pf-avatar-upload-hint{font-size:10px;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:4px;cursor:pointer;transition:color .2s;}
.pf-avatar-upload-hint:hover{color:var(--indigo);}
.pf-username{font-size:16px;font-weight:800;letter-spacing:-.01em;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.pf-role-company{font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:4px;}
.pf-badge-role{display:inline-flex;padding:3px 10px;border-radius:6px;font-size:10px;font-family:'JetBrains Mono',monospace;font-weight:600;}
.pf-badge-sa{background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;}
.pf-badge-admin{background:rgba(99,102,241,.12);color:#818cf8;border:1px solid rgba(99,102,241,.25);}
.pf-badge-user{background:rgba(255,255,255,.07);color:var(--muted);border:1px solid var(--border2);}
.pf-info-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);}
.pf-info-row:last-child{border-bottom:none;}
.pf-info-label{font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace;}
.pf-info-value{font-weight:700;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;}
.pf-field{margin-bottom:1.1rem;}
.pf-label{display:block;font-size:10px;font-weight:600;color:var(--muted);margin-bottom:6px;letter-spacing:.12em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;}
.pf-input{width:100%;padding:11px 13px;border-radius:10px;border:1px solid var(--border2);font-size:13px;font-family:'Bricolage Grotesque',sans-serif;outline:none;background:rgba(255,255,255,.04);color:var(--text);transition:border-color .2s,background .2s;}
.pf-input:focus{border-color:var(--indigo);background:rgba(99,102,241,.06);}
.pf-input::placeholder{color:var(--muted);}
.pf-btn-save{padding:11px 24px;border-radius:11px;background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Bricolage Grotesque',sans-serif;box-shadow:0 4px 16px rgba(99,102,241,.35);transition:opacity .2s,box-shadow .2s;display:flex;align-items:center;gap:7px;}
.pf-btn-save:hover:not(:disabled){opacity:.9;box-shadow:0 6px 24px rgba(99,102,241,.5);}
.pf-btn-save:disabled{opacity:.35;cursor:not-allowed;}
.pf-success{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);color:#34d399;border-radius:10px;padding:10px 13px;font-size:12px;font-family:'JetBrains Mono',monospace;margin-bottom:1rem;display:flex;align-items:center;gap:8px;}
.pf-error{background:rgba(244,63,94,.08);border:1px solid rgba(244,63,94,.2);color:#fb7185;border-radius:10px;padding:10px 13px;font-size:12px;font-family:'JetBrains Mono',monospace;margin-bottom:1rem;display:flex;align-items:center;gap:8px;}
`;

const ROLE_LABELS      = { SUPER_ADMIN: "Super Admin", ADMIN: "Admin", USER: "Utilisateur" };
const ROLE_BADGE_CLASS = { SUPER_ADMIN: "pf-badge-role pf-badge-sa", ADMIN: "pf-badge-role pf-badge-admin", USER: "pf-badge-role pf-badge-user" };

function buildAvatarUrl(raw) {
  if (!raw) return null;
  if (raw.startsWith("blob:") || raw.startsWith("http")) return raw;
  return `http://127.0.0.1:8000${raw}`;
}

export default function ProfilPage() {
  const { user, updateUser, refreshMe } = useAuth();
  const { role } = useRole();

  // ✅ Supporte nom/prenom ET first_name/last_name
  const [form, setForm] = useState({
    nom:        user?.nom        || user?.last_name  || "",
    prenom:     user?.prenom     || user?.first_name || "",
    email:      user?.email      || "",
  });

  const [pwdForm,      setPwdForm]      = useState({ old_password: "", new_password: "", confirm: "" });
  const [saving,       setSaving]       = useState(false);
  const [pwdSaving,    setPwdSaving]    = useState(false);
  const [msg,          setMsg]          = useState("");
  const [pwdMsg,       setPwdMsg]       = useState("");
  const [error,        setError]        = useState("");
  const [pwdError,     setPwdError]     = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMsg,    setAvatarMsg]    = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // ✅ Recharge le profil complet au montage pour avoir les données fraîches
  useEffect(() => {
    if (refreshMe) refreshMe();
  }, []);

  // ✅ Met à jour le form quand user change
  useEffect(() => {
    if (user) {
      setForm({
        nom:    user.nom    || user.last_name  || "",
        prenom: user.prenom || user.first_name || "",
        email:  user.email  || "",
      });
    }
  }, [user]);

  const avatarUrl  = avatarPreview || buildAvatarUrl(user?.avatar);
  // ✅ Initiales depuis nom/prenom
  const initials   = (() => {
    const p = user?.prenom || user?.first_name || "";
    const n = user?.nom    || user?.last_name  || "";
    if (p && n) return (p[0] + n[0]).toUpperCase();
    if (p)      return p.slice(0, 2).toUpperCase();
    if (n)      return n.slice(0, 2).toUpperCase();
    return (user?.email || "U").slice(0, 2).toUpperCase();
  })();

  const displayName = [user?.prenom || user?.first_name, user?.nom || user?.last_name].filter(Boolean).join(" ") || user?.email || "Utilisateur";

  // ── UPLOAD AVATAR ──────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview immédiat
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setAvatarMsg("");
    setAvatarSaving(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axios.patch(`${API}/users/me/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // ✅ Sauvegarde l'URL serveur dans le contexte + localStorage
      if (res.data?.avatar) {
        updateUser({ avatar: res.data.avatar });
        setAvatarPreview(null); // on utilise maintenant l'URL serveur
      }
      setAvatarMsg("✅ Photo mise à jour.");
    } catch {
      setAvatarMsg("❌ Échec upload — réessayez.");
      setAvatarPreview(null);
    } finally {
      setAvatarSaving(false);
    }
  };

  // ── SAVE PROFIL ────────────────────────────────────────────────────────────
  const handleSaveProfil = async () => {
    setSaving(true); setMsg(""); setError("");
    try {
      const res = await axios.patch(`${API}/users/me/`, form);
      updateUser(res.data);
      setMsg("Profil mis à jour avec succès.");
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === "object" ? Object.values(data).flat().join(" ") : "Erreur.");
    } finally { setSaving(false); }
  };

  // ── CHANGE PASSWORD ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (pwdForm.new_password !== pwdForm.confirm) {
      setPwdError("Les mots de passe ne correspondent pas."); return;
    }
    setPwdSaving(true); setPwdMsg(""); setPwdError("");
    try {
      await axios.post(`${API}/auth/change-password/`, {
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      });
      setPwdMsg("Mot de passe modifié avec succès.");
      setPwdForm({ old_password: "", new_password: "", confirm: "" });
    } catch (err) {
      const data = err.response?.data;
      setPwdError(typeof data === "object" ? Object.values(data).flat().join(" ") : "Mot de passe actuel incorrect.");
    } finally { setPwdSaving(false); }
  };

  const SpinIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin .7s linear infinite" }}>
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="pf-shell">
        <div className="sf-blob1" /><div className="sf-blob2" />
        <div className="pf-container">

          <div className="f1">
            <div className="pf-eyebrow">Smart Facture · Compte</div>
            <div className="pf-title">Mon profil</div>
          </div>

          {/* Infos compte */}
          <div className="pf-card f2">
            <div className="pf-avatar-row">
              <div className="pf-avatar-wrapper">
                <div className="pf-avatar" onClick={() => fileInputRef.current?.click()}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" onError={() => setAvatarPreview(null)} />
                    : initials
                  }
                </div>
                <div className="pf-avatar-edit" onClick={() => fileInputRef.current?.click()}>
                  {avatarSaving
                    ? <SpinIcon />
                    : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  }
                </div>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                  style={{ display:"none" }} onChange={handleAvatarChange} />
              </div>
              <div>
                <div className="pf-username">
                  {displayName}
                  <span className={ROLE_BADGE_CLASS[role] || "pf-badge-role pf-badge-user"}>
                    {ROLE_LABELS[role] || role}
                  </span>
                </div>
                <div className="pf-role-company">{user?.company_name || "Aucune entreprise"}</div>
                <div className="pf-avatar-upload-hint" onClick={() => fileInputRef.current?.click()}>
                  {avatarSaving ? "Upload en cours…" : avatarMsg || "Changer la photo de profil"}
                </div>
              </div>
            </div>

            <div className="pf-card-title">Informations du compte</div>
            <div className="pf-info-row">
              <span className="pf-info-label">Nom complet</span>
              <span className="pf-info-value">{displayName}</span>
            </div>
            <div className="pf-info-row">
              <span className="pf-info-label">Email</span>
              <span className="pf-info-value">{user?.email || "—"}</span>
            </div>
            <div className="pf-info-row">
              <span className="pf-info-label">Rôle</span>
              <span className="pf-info-value">{ROLE_LABELS[role] || role}</span>
            </div>
            <div className="pf-info-row">
              <span className="pf-info-label">Entreprise</span>
              <span className="pf-info-value">{user?.company_name || "—"}</span>
            </div>
          </div>

          {/* Modifier profil */}
          <div className="pf-card f3">
            <div className="pf-card-title">Modifier mes informations</div>
            {msg   && <div className="pf-success"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{msg}</div>}
            {error && <div className="pf-error"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
              <div className="pf-field">
                <label className="pf-label">Prénom</label>
                <input className="pf-input" value={form.prenom} placeholder="Prénom" onChange={e => setForm({ ...form, prenom: e.target.value })} />
              </div>
              <div className="pf-field">
                <label className="pf-label">Nom</label>
                <input className="pf-input" value={form.nom} placeholder="Nom" onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>
            </div>
            <div className="pf-field">
              <label className="pf-label">Email</label>
              <input className="pf-input" type="email" value={form.email} placeholder="email@exemple.com" onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <button className="pf-btn-save" onClick={handleSaveProfil} disabled={saving}>
              {saving ? <><SpinIcon />Enregistrement…</> : <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Enregistrer
              </>}
            </button>
          </div>

          {/* Mot de passe */}
          <div className="pf-card f4">
            <div className="pf-card-title">Changer le mot de passe</div>
            {pwdMsg   && <div className="pf-success"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{pwdMsg}</div>}
            {pwdError && <div className="pf-error"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{pwdError}</div>}
            <div className="pf-field"><label className="pf-label">Mot de passe actuel</label><input className="pf-input" type="password" value={pwdForm.old_password} placeholder="••••••••" onChange={e=>setPwdForm({...pwdForm,old_password:e.target.value})}/></div>
            <div className="pf-field"><label className="pf-label">Nouveau mot de passe</label><input className="pf-input" type="password" value={pwdForm.new_password} placeholder="••••••••" onChange={e=>setPwdForm({...pwdForm,new_password:e.target.value})}/></div>
            <div className="pf-field"><label className="pf-label">Confirmer</label><input className="pf-input" type="password" value={pwdForm.confirm} placeholder="••••••••" onChange={e=>setPwdForm({...pwdForm,confirm:e.target.value})}/></div>
            <button className="pf-btn-save" onClick={handleChangePassword} disabled={pwdSaving}>
              {pwdSaving ? <><SpinIcon />Modification…</> : <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                Changer le mot de passe
              </>}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
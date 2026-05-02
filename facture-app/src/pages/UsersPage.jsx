import { useEffect, useState } from "react";
import api from "../services/api";
import { useRole } from "../hooks/useRole";
import { ShowForRole } from "../components/RoleGuard";

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

/* SHELL */
.up{background:var(--bg);min-height:100vh;padding:2rem 2.5rem;font-family:'Bricolage Grotesque',sans-serif;color:var(--text);}
.up-blob1{position:fixed;top:-300px;left:-200px;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 65%);pointer-events:none;z-index:0;}
.up-blob2{position:fixed;bottom:-200px;right:-100px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(6,182,212,0.07) 0%,transparent 65%);pointer-events:none;z-index:0;}
.up-inner{position:relative;z-index:1;max-width:1400px;margin:0 auto;}

/* HEADER */
.up-hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem;}
.up-eyebrow{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--violet);margin-bottom:8px;}
.up-h1{font-size:34px;font-weight:800;letter-spacing:-.03em;line-height:1.1;}
.up-h1 em{font-style:normal;background:linear-gradient(120deg,var(--violet),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.up-hsub{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);margin-top:6px;}

/* STATS BAR */
.up-stats{display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;}
.up-stat{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:.85rem 1.25rem;display:flex;align-items:center;gap:10px;flex:1;min-width:120px;}
.up-stat-icon{font-size:18px;}
.up-stat-val{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:800;}
.up-stat-lbl{font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;}

/* SEARCH */
.up-toolbar{display:flex;gap:.75rem;margin-bottom:1.25rem;flex-wrap:wrap;align-items:center;}
.up-search{flex:1;min-width:200px;padding:9px 13px;border-radius:10px;border:1px solid var(--border2);background:rgba(255,255,255,.04);color:var(--text);font-size:13px;font-family:'Bricolage Grotesque',sans-serif;outline:none;transition:border-color .2s;}
.up-search:focus{border-color:var(--violet);}
.up-search::placeholder{color:var(--muted);}
.up-filter{padding:9px 13px;border-radius:10px;border:1px solid var(--border2);background:rgba(255,255,255,.04);color:var(--text);font-size:12px;font-family:'JetBrains Mono',monospace;outline:none;cursor:pointer;}

/* BUTTON NEW */
.up-btn-new{padding:10px 20px;border-radius:12px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Bricolage Grotesque',sans-serif;display:inline-flex;align-items:center;gap:8px;transition:all .2s ease;background:linear-gradient(135deg,var(--violet),var(--indigo));color:#fff;box-shadow:0 4px 16px rgba(139,92,246,.3);}
.up-btn-new:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(139,92,246,.5);}
.up-btn-new:active{transform:translateY(0);}

/* TABLE CARD */
.up-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;}
.up-tbl-wrap{overflow-x:auto;}
.up-tbl{width:100%;border-collapse:collapse;font-size:13px;}
.up-tbl th{padding:1rem 1.25rem;font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-family:'JetBrains Mono',monospace;border-bottom:1px solid var(--border);text-align:left;background:rgba(255,255,255,.02);}
.up-tbl td{padding:1rem 1.25rem;border-bottom:1px solid rgba(255,255,255,.03);vertical-align:middle;}
.up-tbl tbody tr:last-child td{border-bottom:none;}
.up-tbl tbody tr{transition:background .15s ease;}
.up-tbl tbody tr:hover{background:rgba(255,255,255,.02);}

/* AVATAR */
.up-avatar{width:38px;height:38px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;flex-shrink:0;overflow:hidden;}
.up-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
.up-avatar-sa{background:rgba(139,92,246,.25);color:#a78bfa;}
.up-avatar-admin{background:rgba(99,102,241,.2);color:#818cf8;}
.up-avatar-user{background:rgba(255,255,255,.08);color:rgba(255,255,255,.45);}

/* TABLE CELLS */
.up-username{font-weight:700;font-size:14px;color:var(--text);}
.up-fullname{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);margin-top:2px;}
.up-email{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.45);}
.up-company-tag{font-size:11px;background:rgba(99,102,241,.15);color:#818cf8;padding:4px 10px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-weight:600;display:inline-block;}

/* BADGES */
.up-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:8px;font-size:10px;font-family:'JetBrains Mono',monospace;font-weight:700;letter-spacing:.05em;}
.up-badge::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor;animation:pulse 2s ease infinite;}
.up-badge-sa{background:rgba(139,92,246,.2);color:#a78bfa;border:1px solid rgba(139,92,246,.35);}
.up-badge-admin{background:rgba(99,102,241,.15);color:#818cf8;border:1px solid rgba(99,102,241,.3);}
.up-badge-user{background:rgba(255,255,255,.07);color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.1);}
.up-badge-active{background:rgba(16,185,129,.15);color:#34d399;border:1px solid rgba(16,185,129,.3);}
.up-badge-inactive{background:rgba(244,63,94,.12);color:#fb7185;border:1px solid rgba(244,63,94,.25);}

/* DATE */
.up-date{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);}

/* ACTION BUTTONS */
.up-btn{padding:5px 12px;border-radius:8px;border:1px solid transparent;cursor:pointer;font-size:11px;font-weight:700;font-family:'Bricolage Grotesque',sans-serif;transition:all .15s ease;margin-left:4px;}
.up-btn:hover{transform:translateY(-1px);}
.up-btn:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.up-btn-edit{background:rgba(99,102,241,.18);color:#818cf8;border-color:rgba(99,102,241,.3);}
.up-btn-edit:hover{background:rgba(99,102,241,.28);}
.up-btn-delete{background:rgba(244,63,94,.15);color:#fb7185;border-color:rgba(244,63,94,.28);}
.up-btn-delete:hover{background:rgba(244,63,94,.25);}
.up-btn-toggle{background:rgba(245,158,11,.13);color:#fbbf24;border-color:rgba(245,158,11,.28);}
.up-btn-toggle:hover{background:rgba(245,158,11,.22);}

/* LOADER & EMPTY */
.up-loader{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:40vh;gap:1rem;}
.up-spinner{width:32px;height:32px;border:3px solid rgba(139,92,246,.2);border-top-color:var(--violet);border-radius:50%;animation:spin .7s linear infinite;}
.up-ltxt{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);}
.up-empty{font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--muted);padding:3rem;text-align:center;}

/* MODAL */
.up-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:2000;padding:2rem;animation:fadeUp .3s ease;}
.up-modal{background:var(--surface);border:1px solid var(--border2);border-radius:24px;padding:2rem;width:100%;max-width:480px;box-shadow:0 24px 80px rgba(0,0,0,.6);animation:fadeUp .4s ease;}
.up-modal-title{font-size:19px;font-weight:700;letter-spacing:-.02em;margin-bottom:1.5rem;}
.up-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
.up-field{margin-bottom:1rem;}
.up-label{display:block;font-size:10px;font-weight:600;color:var(--muted);margin-bottom:5px;letter-spacing:.1em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;}
.up-input{width:100%;padding:10px 13px;border-radius:10px;border:1px solid var(--border2);font-size:13px;font-family:'Bricolage Grotesque',sans-serif;background:rgba(255,255,255,.04);color:var(--text);outline:none;transition:border-color .2s;}
.up-input:focus{border-color:var(--violet);}
.up-modal-actions{display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem;}
.up-modal-cancel{padding:10px 20px;border-radius:10px;background:rgba(255,255,255,.05);color:var(--text);border:1px solid var(--border);cursor:pointer;font-size:13px;font-weight:700;font-family:'Bricolage Grotesque',sans-serif;transition:all .2s ease;}
.up-modal-cancel:hover{background:rgba(255,255,255,.09);border-color:var(--border2);}
.up-modal-save{padding:10px 20px;border-radius:10px;background:linear-gradient(135deg,var(--violet),var(--indigo));color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Bricolage Grotesque',sans-serif;box-shadow:0 4px 14px rgba(99,102,241,.35);transition:all .2s ease;}
.up-modal-save:hover{box-shadow:0 6px 20px rgba(99,102,241,.55);transform:translateY(-1px);}
.up-modal-save:disabled{opacity:.5;cursor:not-allowed;transform:none;}
.up-error{background:rgba(244,63,94,.12);color:#fb7185;border:1px solid rgba(244,63,94,.25);border-radius:10px;padding:10px 13px;font-size:12px;margin-bottom:1rem;font-family:'JetBrains Mono',monospace;}

/* CONFIRM */
.up-confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:3000;padding:2rem;animation:fadeUp .3s ease;}
.up-confirm-box{background:var(--surface);border:1px solid var(--border2);border-radius:20px;padding:2rem;width:100%;max-width:400px;box-shadow:0 24px 80px rgba(0,0,0,.6);animation:fadeUp .4s ease;}
.up-confirm-title{font-size:17px;font-weight:700;margin-bottom:.5rem;}
.up-confirm-text{font-size:13px;color:rgba(255,255,255,.55);line-height:1.65;margin-bottom:1.5rem;}
.up-confirm-actions{display:flex;gap:.75rem;justify-content:flex-end;}
.up-confirm-cancel{padding:9px 20px;border-radius:10px;background:rgba(255,255,255,.05);color:var(--text);border:1px solid var(--border);cursor:pointer;font-size:13px;font-weight:700;font-family:'Bricolage Grotesque',sans-serif;transition:all .2s ease;}
.up-confirm-cancel:hover{background:rgba(255,255,255,.09);border-color:var(--border2);}
.up-confirm-ok{padding:9px 20px;border-radius:10px;background:linear-gradient(135deg,var(--rose),#dc2626);color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Bricolage Grotesque',sans-serif;box-shadow:0 4px 14px rgba(244,63,94,.35);transition:all .2s ease;}
.up-confirm-ok:hover{box-shadow:0 6px 20px rgba(244,63,94,.55);transform:translateY(-1px);}

@media(max-width:768px){
  .up{padding:1rem;}
  .up-h1{font-size:26px;}
  .up-tbl th,.up-tbl td{padding:.75rem;}
  .up-modal{padding:1.5rem;}
  .up-modal-grid{grid-template-columns:1fr;}
}
`;

const ROLE_LABELS  = { SUPER_ADMIN: "Super Admin", ADMIN: "Admin", USER: "Utilisateur" };
const ROLE_CLASS   = { SUPER_ADMIN: "up-badge up-badge-sa", ADMIN: "up-badge up-badge-admin", USER: "up-badge up-badge-user" };
const AVATAR_CLASS = { SUPER_ADMIN: "up-avatar up-avatar-sa", ADMIN: "up-avatar up-avatar-admin", USER: "up-avatar up-avatar-user" };

const EMPTY_FORM = { nom: "", prenom: "", email: "", password: "", role: "USER", company_id: "", is_active: true };

const BASE_URL = "http://127.0.0.1:8000";

function buildAvatarUrl(raw) {
  if (!raw) return null;
  if (raw.startsWith("blob:") || raw.startsWith("http")) return raw;
  return `${BASE_URL}${raw}`;
}

// ✅ FIX PRINCIPAL : supporte nom/prenom (Django custom) ET first_name/last_name (Django standard)
function getInitials(user) {
  const prenom = user.prenom || user.first_name || "";
  const nom    = user.nom    || user.last_name  || "";
  if (prenom && nom)    return (prenom[0] + nom[0]).toUpperCase();
  if (prenom)           return prenom.slice(0, 2).toUpperCase();
  if (nom)              return nom.slice(0, 2).toUpperCase();
  if (user.email)       return user.email.slice(0, 2).toUpperCase();
  return "??";
}

function getDisplayName(user) {
  const prenom = user.prenom || user.first_name || "";
  const nom    = user.nom    || user.last_name  || "";
  if (prenom || nom) return `${prenom} ${nom}`.trim();
  return user.email || "—";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-MA", { day: "numeric", month: "short", year: "numeric" });
}

export default function UsersPage() {
  const { isSuperAdmin, isAdmin } = useRole();

  const [users,     setUsers]     = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [roleFilter,setRoleFilter]= useState("ALL");
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");
  const [confirm,   setConfirm]   = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes] = await Promise.all([api.get("/users/")]);
        const data = usersRes.data.results ?? usersRes.data;
        setUsers(data);
        setFiltered(data);
        if (isSuperAdmin) {
          const compRes = await api.get("/companies/");
          setCompanies(compRes.data.results ?? compRes.data);
        }
      } catch { /* silencieux */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, [isSuperAdmin]);

  // Recherche + filtre rôle
  useEffect(() => {
    let result = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        (u.email || "").toLowerCase().includes(q) ||
        (u.nom   || u.last_name  || "").toLowerCase().includes(q) ||
        (u.prenom|| u.first_name || "").toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "ALL") {
      result = result.filter(u => u.role === roleFilter);
    }
    setFiltered(result);
  }, [search, roleFilter, users]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(""); setModal(true); };
  const openEdit   = (user) => {
    setEditing(user);
    setForm({
      nom:        user.nom        || user.last_name  || "",
      prenom:     user.prenom     || user.first_name || "",
      email:      user.email,
      password:   "",
      role:       user.role,
      company_id: user.company_id ?? "",
      is_active:  user.is_active,
    });
    setFormError("");
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setFormError("");
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    if (!payload.company_id) delete payload.company_id;
    try {
      if (editing) {
        const res = await api.patch(`/users/${editing.id}/`, payload);
        setUsers(prev => prev.map(u => u.id === editing.id ? res.data : u));
      } else {
        const res = await api.post("/auth/admin/users/create/", payload);
        setUsers(prev => [res.data.user ?? res.data, ...prev]);
      }
      setModal(false);
    } catch (err) {
      const data = err.response?.data;
      setFormError(typeof data === "object" ? Object.values(data).flat().join(" ") : "Erreur lors de la sauvegarde.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}/`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch { alert("Erreur lors de la suppression."); }
  };

  const handleToggleActive = async (user) => {
    try {
      const res = await api.patch(`/users/${user.id}/`, { is_active: !user.is_active });
      setUsers(prev => prev.map(u => u.id === user.id ? res.data : u));
    } catch { alert("Erreur."); }
  };

  const askConfirm = (message, onOk) => setConfirm({ message, onOk });

  // Stats rapides
  const totalUsers    = users.length;
  const activeUsers   = users.filter(u => u.is_active).length;
  const adminCount    = users.filter(u => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length;

  return (
    <>
      <style>{styles}</style>
      <div className="up">
        <div className="up-blob1" /><div className="up-blob2" />
        <div className="up-inner">

          {/* Header */}
          <div className="up-hd f1">
            <div>
              <div className="up-eyebrow">Smart Facture · Admin</div>
              <div className="up-h1">Gestion des <em>utilisateurs</em></div>
              <div className="up-hsub">Contrôle des accès et des rôles</div>
            </div>
            <button className="up-btn-new" onClick={openCreate}>
              <span>+</span> Nouvel utilisateur
            </button>
          </div>

          {/* Stats rapides */}
          <div className="up-stats f2">
            {[
              { icon: "👥", val: totalUsers,  lbl: "Total",   clr: "#818cf8" },
              { icon: "✅", val: activeUsers,  lbl: "Actifs",  clr: "#34d399" },
              { icon: "🔒", val: adminCount,   lbl: "Admins",  clr: "#a78bfa" },
              { icon: "💤", val: totalUsers - activeUsers, lbl: "Inactifs", clr: "#fb7185" },
            ].map((s, i) => (
              <div key={i} className="up-stat">
                <div className="up-stat-icon">{s.icon}</div>
                <div>
                  <div className="up-stat-val" style={{ color: s.clr }}>{s.val}</div>
                  <div className="up-stat-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Toolbar recherche + filtre */}
          <div className="up-toolbar f2">
            <input
              className="up-search"
              placeholder="🔍  Rechercher par nom, prénom, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="up-filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="ALL">Tous les rôles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">Utilisateur</option>
            </select>
          </div>

          {/* Table */}
          <div className="up-card f3">
            {loading ? (
              <div className="up-loader">
                <div className="up-spinner" />
                <div className="up-ltxt">Chargement des utilisateurs...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="up-empty">
                {search || roleFilter !== "ALL" ? "Aucun résultat pour cette recherche." : "Aucun utilisateur disponible."}
              </div>
            ) : (
              <div className="up-tbl-wrap">
                <table className="up-tbl">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      {isSuperAdmin && <th>Entreprise</th>}
                      <th>Statut</th>
                      <th>Créé le</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => {
                      const avatarUrl = buildAvatarUrl(u.avatar);
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              {/* ✅ FIX : avatar photo OU initiales correctes */}
                              <div className={AVATAR_CLASS[u.role] || "up-avatar up-avatar-user"}>
                                {avatarUrl
                                  ? <img src={avatarUrl} alt="avatar" />
                                  : getInitials(u)
                                }
                              </div>
                              <div>
                                <div className="up-username">{getDisplayName(u)}</div>
                                <div className="up-fullname">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="up-email">{u.email || "—"}</td>
                          <td>
                            <span className={ROLE_CLASS[u.role] || "up-badge"}>
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                          </td>
                          {isSuperAdmin && (
                            <td>
                              <span className="up-company-tag">
                                {u.company_name || u.company?.nom || "—"}
                              </span>
                            </td>
                          )}
                          <td>
                            <span className={"up-badge " + (u.is_active ? "up-badge-active" : "up-badge-inactive")}>
                              {u.is_active ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td className="up-date">{formatDate(u.created_at || u.date_joined)}</td>
                          <td style={{ whiteSpace:"nowrap" }}>
                            <button className="up-btn up-btn-edit" onClick={() => openEdit(u)}>Modifier</button>
                            <button
                              className="up-btn up-btn-toggle"
                              onClick={() => askConfirm(
                                `${u.is_active ? "Désactiver" : "Activer"} le compte de ${getDisplayName(u)} ?`,
                                () => handleToggleActive(u)
                              )}
                            >
                              {u.is_active ? "Désactiver" : "Activer"}
                            </button>
                            <ShowForRole roles={["SUPER_ADMIN"]}>
                              <button
                                className="up-btn up-btn-delete"
                                onClick={() => askConfirm(
                                  `Supprimer définitivement ${getDisplayName(u)} ?`,
                                  () => handleDelete(u.id)
                                )}
                              >
                                Effacer
                              </button>
                            </ShowForRole>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="up-modal-overlay" onClick={() => setModal(false)}>
          <div className="up-modal" onClick={e => e.stopPropagation()}>
            <div className="up-modal-title">
              {editing ? `Modifier ${getDisplayName(editing)}` : "Nouvel utilisateur"}
            </div>
            {formError && <div className="up-error">{formError}</div>}
            <div className="up-modal-grid">
              <div className="up-field">
                <label className="up-label">Prénom *</label>
                <input className="up-input" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Mohamed" />
              </div>
              <div className="up-field">
                <label className="up-label">Nom *</label>
                <input className="up-input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Alami" />
              </div>
            </div>
            <div className="up-field">
              <label className="up-label">Email</label>
              <input className="up-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="m.alami@entreprise.ma" />
            </div>
            <div className="up-field">
              <label className="up-label">Mot de passe {editing ? "(laisser vide = inchangé)" : "*"}</label>
              <input className="up-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="up-field">
              <label className="up-label">Rôle</label>
              <select className="up-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="USER">Utilisateur</option>
                {isSuperAdmin && <option value="ADMIN">Admin</option>}
                {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
              </select>
            </div>
            {isSuperAdmin && (
              <div className="up-field">
                <label className="up-label">Entreprise</label>
                <select className="up-input" value={form.company_id} onChange={e => setForm({ ...form, company_id: e.target.value })}>
                  <option value="">— Aucune —</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.nom || c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="up-modal-actions">
              <button className="up-modal-cancel" onClick={() => setModal(false)}>Annuler</button>
              <button className="up-modal-save" onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm */}
      {confirm && (
        <div className="up-confirm-overlay" onClick={() => setConfirm(null)}>
          <div className="up-confirm-box" onClick={e => e.stopPropagation()}>
            <div className="up-confirm-title">Confirmation requise</div>
            <div className="up-confirm-text">{confirm.message}</div>
            <div className="up-confirm-actions">
              <button className="up-confirm-cancel" onClick={() => setConfirm(null)}>Annuler</button>
              <button className="up-confirm-ok" onClick={() => { confirm.onOk(); setConfirm(null); }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
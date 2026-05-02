import { useEffect, useState } from "react";
import axios from "axios";

const API     = "http://127.0.0.1:8000/api/auth";
const ROLES   = ["USER", "ADMIN", "SUPER_ADMIN"];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700&display=swap');
  .ap-shell { background:#f4f3ef; min-height:100vh; padding:2rem; font-family:'Syne',sans-serif; }
  .ap-title { font-size:22px; font-weight:700; color:#0d0d0d; margin-bottom:0.25rem; }
  .ap-sub { font-size:13px; color:#9a9a9a; font-family:'DM Mono',monospace; margin-bottom:1.5rem; }
  .ap-tabs { display:flex; gap:0.5rem; margin-bottom:1.5rem; }
  .ap-tab { padding:8px 18px; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:600; font-family:'Syne',sans-serif; transition:all 0.2s; }
  .ap-tab--active { background:#1a1a2e; color:#e8ff47; }
  .ap-tab--idle { background:#fff; color:#5a5a5a; border:1px solid rgba(0,0,0,0.08); }
  .ap-card { background:#fff; border-radius:16px; border:1px solid rgba(0,0,0,0.06); overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .ap-table { width:100%; border-collapse:collapse; font-size:13px; }
  .ap-table th { padding:12px 16px; text-align:left; font-size:10px; font-weight:600; color:#9a9a9a; text-transform:uppercase; letter-spacing:0.1em; font-family:'DM Mono',monospace; border-bottom:1px solid rgba(0,0,0,0.08); background:#f4f3ef; }
  .ap-table td { padding:13px 16px; color:#0d0d0d; border-bottom:1px solid rgba(0,0,0,0.04); vertical-align:middle; }
  .ap-table tbody tr:hover { background:#fafaf8; }
  .ap-table tbody tr:last-child td { border-bottom:none; }
  .ap-mono { font-family:'DM Mono',monospace; font-size:12px; color:#5a5a5a; }
  .ap-role-badge { display:inline-block; padding:3px 8px; border-radius:4px; font-size:10px; font-family:'DM Mono',monospace; font-weight:600; letter-spacing:0.06em; }
  .ap-role--SUPER_ADMIN { background:#1a1a2e; color:#e8ff47; }
  .ap-role--ADMIN { background:#d4eddf; color:#0a7c3e; }
  .ap-role--USER { background:#f4f3ef; color:#5a5a5a; }
  .ap-select { padding:5px 10px; border-radius:6px; border:1px solid rgba(0,0,0,0.12); font-family:'Syne',sans-serif; font-size:12px; cursor:pointer; background:#fff; }
  .ap-btn-delete { padding:5px 12px; border-radius:6px; background:#fee2e2; color:#dc2626; border:none; cursor:pointer; font-size:11px; font-weight:600; font-family:'Syne',sans-serif; }
  .ap-btn-delete:hover { opacity:0.8; }
  .ap-empty { padding:3rem; text-align:center; color:#9a9a9a; font-family:'DM Mono',monospace; }
  .ap-status { width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:6px; }
  .ap-status--active { background:#4ade80; }
  .ap-status--inactive { background:#f87171; }
  .ap-form { display:flex; gap:0.75rem; margin-bottom:1.5rem; flex-wrap:wrap; }
  .ap-input { padding:10px 14px; border-radius:8px; border:1.5px solid rgba(0,0,0,0.12); font-family:'Syne',sans-serif; font-size:13px; outline:none; flex:1; min-width:160px; }
  .ap-input:focus { border-color:#1a1a2e; }
  .ap-btn-add { padding:10px 20px; border-radius:8px; background:#1a1a2e; color:#e8ff47; border:none; cursor:pointer; font-size:13px; font-weight:700; font-family:'Syne',sans-serif; }
  .ap-btn-add:hover { opacity:0.85; }
  .ap-alert { padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:1rem; }
  .ap-alert--ok { background:#d4eddf; color:#0a7c3e; }
  .ap-alert--err { background:#fee2e2; color:#dc2626; }
`;

export default function AdminPanel({ user, darkMode }) {
  const [tab, setTab]           = useState("users");
  const [users, setUsers]       = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [alert, setAlert]       = useState(null);
  const [newCompany, setNewCompany] = useState({ nom: "", email: "" });

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const token        = localStorage.getItem("access_token");
  const headers      = { Authorization: `Bearer ${token}` };

  const showAlert = (msg, type = "ok") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  // ── Charger les users ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSuperAdmin) return;
    setLoading(true);
    Promise.all([
      axios.get(`${API}/admin/users/`, { headers }),
      axios.get(`${API}/admin/companies/`, { headers }),
    ]).then(([uRes, cRes]) => {
      setUsers(uRes.data.users);
      setCompanies(cRes.data.companies);
    }).catch(() => showAlert("Erreur chargement", "err"))
      .finally(() => setLoading(false));
  }, []);

  // ── Changer le rôle d'un user ─────────────────────────────────────────────
  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(`${API}/admin/users/${userId}/`, { role: newRole }, { headers });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showAlert("Rôle mis à jour");
    } catch {
      showAlert("Erreur mise à jour", "err");
    }
  };

  // ── Changer la company d'un user ──────────────────────────────────────────
  const handleCompanyChange = async (userId, companyId) => {
    try {
      await axios.patch(`${API}/admin/users/${userId}/`,
        { company_id: companyId || null }, { headers });
      const company = companies.find(c => c.id === parseInt(companyId));
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, company_id: companyId, company: company?.nom || null } : u
      ));
      showAlert("Entreprise mise à jour");
    } catch {
      showAlert("Erreur mise à jour", "err");
    }
  };

  // ── Supprimer un user ─────────────────────────────────────────────────────
  const handleDeleteUser = async (userId, email) => {
    if (!confirm(`Supprimer ${email} ?`)) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}/delete/`, { headers });
      setUsers(prev => prev.filter(u => u.id !== userId));
      showAlert("Utilisateur supprimé");
    } catch {
      showAlert("Erreur suppression", "err");
    }
  };

  // ── Créer une company ─────────────────────────────────────────────────────
  const handleAddCompany = async () => {
    if (!newCompany.nom.trim()) return;
    try {
      const res = await axios.post(`${API}/admin/companies/`, newCompany, { headers });
      setCompanies(prev => [res.data, ...prev]);
      setNewCompany({ nom: "", email: "" });
      showAlert("Entreprise créée");
    } catch {
      showAlert("Erreur création", "err");
    }
  };

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#9a9a9a" }}>
        🔒 Accès réservé au SUPER_ADMIN
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="ap-shell">
        <div className="ap-title">🛡 Panel Administrateur</div>
        <div className="ap-sub">
          {users.length} utilisateurs · {companies.length} entreprises
        </div>

        {alert && (
          <div className={`ap-alert ap-alert--${alert.type}`}>{alert.msg}</div>
        )}

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="ap-tabs">
          <button
            className={`ap-tab ${tab === "users" ? "ap-tab--active" : "ap-tab--idle"}`}
            onClick={() => setTab("users")}
          >
            👥 Utilisateurs ({users.length})
          </button>
          <button
            className={`ap-tab ${tab === "companies" ? "ap-tab--active" : "ap-tab--idle"}`}
            onClick={() => setTab("companies")}
          >
            🏢 Entreprises ({companies.length})
          </button>
        </div>

        {/* ── Tab Users ───────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div className="ap-card">
            {loading ? (
              <div className="ap-empty">Chargement...</div>
            ) : users.length === 0 ? (
              <div className="ap-empty">Aucun utilisateur</div>
            ) : (
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Entreprise</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.prenom} {u.nom}</div>
                        <div className="ap-mono">#{u.id}</div>
                      </td>
                      <td className="ap-mono">{u.email}</td>
                      <td>
                        <select
                          className="ap-select"
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          disabled={u.id === user.id} // ne pas changer son propre rôle
                        >
                          {ROLES.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="ap-select"
                          value={u.company_id || ""}
                          onChange={e => handleCompanyChange(u.id, e.target.value)}
                        >
                          <option value="">— Aucune —</option>
                          {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.nom}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={`ap-status ${u.is_active ? "ap-status--active" : "ap-status--inactive"}`} />
                        {u.is_active ? "Actif" : "Inactif"}
                      </td>
                      <td>
                        {u.id !== user.id && (
                          <button
                            className="ap-btn-delete"
                            onClick={() => handleDeleteUser(u.id, u.email)}
                          >
                            🗑 Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab Companies ────────────────────────────────────────────────── */}
        {tab === "companies" && (
          <>
            {/* Formulaire ajout company */}
            <div className="ap-form">
              <input
                className="ap-input"
                placeholder="Nom de l'entreprise *"
                value={newCompany.nom}
                onChange={e => setNewCompany(f => ({ ...f, nom: e.target.value }))}
              />
              <input
                className="ap-input"
                placeholder="Email (optionnel)"
                value={newCompany.email}
                onChange={e => setNewCompany(f => ({ ...f, email: e.target.value }))}
              />
              <button className="ap-btn-add" onClick={handleAddCompany}>
                + Ajouter
              </button>
            </div>

            <div className="ap-card">
              {companies.length === 0 ? (
                <div className="ap-empty">Aucune entreprise</div>
              ) : (
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Utilisateurs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map(c => (
                      <tr key={c.id}>
                        <td className="ap-mono">#{c.id}</td>
                        <td style={{ fontWeight: 600 }}>{c.nom}</td>
                        <td className="ap-mono">{c.email || "—"}</td>
                        <td className="ap-mono">{c.users_count} utilisateur(s)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
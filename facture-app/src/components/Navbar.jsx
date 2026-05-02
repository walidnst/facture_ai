import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useRole } from "../hooks/useRole";
import { ShowForRole } from "./RoleGuard";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

:root {
  --bg:#06070d;--surface:#0d0f1a;
  --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);
  --text:#f0f0f5;--muted:rgba(255,255,255,0.32);--muted2:rgba(255,255,255,0.55);
  --indigo:#6366f1;--violet:#8b5cf6;--rose:#f43f5e;--amber:#f59e0b;
}

.nav {
  position:sticky; top:0; z-index:200;
  height:52px; padding:0 16px;
  display:flex; align-items:center; justify-content:space-between; gap:8px;
  font-family:'Bricolage Grotesque',sans-serif;
  background:rgba(13,15,26,0.9);
  border-bottom:1px solid var(--border2);
  backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
}
.nav::before {
  content:''; pointer-events:none;
  position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(99,102,241,.45) 40%,rgba(139,92,246,.45) 60%,transparent);
}

/* Brand */
.nav-brand { display:flex; align-items:center; gap:8px; text-decoration:none; flex-shrink:0; }
.nav-brand-icon {
  width:30px; height:30px; border-radius:8px; flex-shrink:0;
  background:linear-gradient(135deg,var(--indigo),var(--violet));
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 0 0 1px rgba(99,102,241,.3),0 3px 12px rgba(99,102,241,.28);
}
.nav-brand-name { font-size:13px; font-weight:800; color:var(--text); letter-spacing:-.02em; white-space:nowrap; }

/* Links */
.nav-links { display:flex; align-items:center; gap:1px; flex:1; justify-content:center; min-width:0; }
.nav-link {
  padding:5px 10px; border-radius:7px;
  font-size:12px; font-weight:600;
  color:var(--muted2); text-decoration:none;
  transition:color .15s,background .15s; white-space:nowrap;
}
.nav-link:hover { color:var(--text); background:rgba(255,255,255,.06); }
.nav-link.active { color:#fff; background:rgba(99,102,241,.18); box-shadow:0 0 0 1px rgba(99,102,241,.22); }
.nav-link-audit { color:var(--muted2); }
.nav-link-audit:hover { color:var(--amber); background:rgba(245,158,11,.08); }
.nav-link-audit.active { color:var(--amber); background:rgba(245,158,11,.12); box-shadow:0 0 0 1px rgba(245,158,11,.2); }
.nav-chat-dot {
  display:inline-block; width:5px; height:5px; border-radius:50%;
  background:var(--rose); box-shadow:0 0 5px var(--rose);
  margin-left:3px; vertical-align:middle;
}

/* Right */
.nav-right { display:flex; align-items:center; gap:6px; flex-shrink:0; height:100%; }

/* User chip */
.nav-user {
  display:flex; align-items:center; gap:7px;
  padding:3px 8px 3px 3px; border-radius:9px;
  border:1px solid var(--border2); background:rgba(255,255,255,.03);
  max-height:40px; overflow:hidden;
}
.nav-avatar {
  width:26px; height:26px; border-radius:7px; flex-shrink:0;
  background:linear-gradient(135deg,var(--indigo),var(--violet));
  display:flex; align-items:center; justify-content:center;
  font-size:9px; font-weight:800; color:#fff;
  font-family:'JetBrains Mono',monospace; overflow:hidden;
}
.nav-avatar img { width:100%; height:100%; object-fit:cover; }
.nav-username { font-size:12px; font-weight:700; color:var(--text); display:flex; align-items:center; gap:5px; white-space:nowrap; flex-wrap:nowrap; }
.nav-company { font-size:9.5px; color:var(--muted); font-family:'JetBrains Mono',monospace; white-space:nowrap; }

/* Role badges */
.nb { font-size:8px; padding:2px 6px; border-radius:4px; font-family:'JetBrains Mono',monospace; font-weight:700; }
.nb-sa    { background:linear-gradient(135deg,var(--indigo),var(--violet)); color:#fff; }
.nb-admin { background:rgba(99,102,241,.13); color:#818cf8; border:1px solid rgba(99,102,241,.2); }
.nb-user  { background:rgba(255,255,255,.07); color:var(--muted2); border:1px solid var(--border2); }

/* Logout icon-only */
.nav-logout {
  width:32px; height:32px; border-radius:8px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  background:transparent; border:1px solid var(--border2);
  color:var(--muted2); cursor:pointer; transition:all .15s;
}
.nav-logout:hover { background:rgba(244,63,94,.1); color:#fb7185; border-color:rgba(244,63,94,.28); }
`;

const ROLE_BADGE  = { SUPER_ADMIN:"nb nb-sa", ADMIN:"nb nb-admin", USER:"nb nb-user" };
const ROLE_LABELS = { SUPER_ADMIN:"Super Admin", ADMIN:"Admin", USER:"User" };

function buildAvatarUrl(raw) {
  if (!raw) return null;
  if (raw.startsWith("blob:") || raw.startsWith("http")) return raw;
  return `http://127.0.0.1:8000${raw}`;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const prenom      = user.prenom || user.first_name || "";
  const nom         = user.nom    || user.last_name  || "";
  const initials    = prenom && nom ? (prenom[0]+nom[0]).toUpperCase() : (user.username||user.email||"U").slice(0,2).toUpperCase();
  const displayName = [prenom,nom].filter(Boolean).join(" ") || user.username || user.email;
  const avatarUrl   = buildAvatarUrl(user.avatar);
  const handleLogout = () => { logout(); navigate("/login",{replace:true}); };

  const L = ({ to, children, audit }) => (
    <NavLink to={to} className={({ isActive }) =>
      (audit ? "nav-link nav-link-audit" : "nav-link") + (isActive ? " active" : "")
    }>
      {children}
    </NavLink>
  );

  return (
    <>
      <style>{styles}</style>
      <nav className="nav">

        <NavLink to="/" className="nav-brand">
          <div className="nav-brand-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <span className="nav-brand-name">Smart Facture</span>
        </NavLink>

        <div className="nav-links">
          <L to="/upload">Upload</L>
          <L to="/factures">Factures</L>
          <ShowForRole roles={["ADMIN","SUPER_ADMIN"]}><L to="/dashboard">Dashboard</L></ShowForRole>
          <ShowForRole roles={["ADMIN","SUPER_ADMIN"]}><L to="/users">Utilisateurs</L></ShowForRole>
          <ShowForRole roles={["SUPER_ADMIN"]}><L to="/companies">Entreprises</L></ShowForRole>
          <L to="/profil">Profil</L>
          <L to="/chat">Chat <span className="nav-chat-dot" /></L>
          <ShowForRole roles={["ADMIN","SUPER_ADMIN"]}><L to="/audit" audit>Audit</L></ShowForRole>
        </div>

        <div className="nav-right">
          <div className="nav-user">
            <div className="nav-avatar">
              {avatarUrl
                ? <img src={avatarUrl} alt="av" onError={e=>e.target.style.display='none'} />
                : initials}
            </div>
            <div>
              <div className="nav-username">
                {displayName}
                <span className={ROLE_BADGE[user.role]||"nb nb-user"}>{ROLE_LABELS[user.role]||user.role}</span>
              </div>
              {(user.company_name||user.company) && <div className="nav-company">{user.company_name||user.company}</div>}
            </div>
          </div>

          <button className="nav-logout" onClick={handleLogout} title="Déconnexion">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

      </nav>
    </>
  );
}
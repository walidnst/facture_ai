import { useNavigate } from "react-router-dom";
import { useAuth }     from "../hooks/useAuth";

export default function Page403() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  return (
    <div style={{
      minHeight: "100vh", background: "#f4f3ef",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Syne', sans-serif", padding: "2rem",
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 64, marginBottom: "1rem" }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0d0d0d", marginBottom: "0.5rem" }}>
          Accès non autorisé
        </h1>
        <p style={{ fontSize: 14, color: "#9a9a9a", marginBottom: "2rem", lineHeight: 1.6 }}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          {user && <><br />Rôle actuel : <strong>{user.role}</strong></>}
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "10px 24px", borderRadius: 10,
            background: "#1a1a2e", color: "#e8ff47",
            border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 700, fontFamily: "'Syne', sans-serif",
          }}
        >
          ← Retour
        </button>
      </div>
    </div>
  );
}
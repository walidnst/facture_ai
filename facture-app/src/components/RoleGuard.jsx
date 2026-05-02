import { Navigate, useLocation } from "react-router-dom";
import { useRole } from "../hooks/useRole";
import { useAuth } from "../hooks/useAuth";

/**
 * Garde de route basé sur le rôle.
 *
 * Props :
 *   roles    {string[]}    Rôles autorisés, ex: ["ADMIN", "SUPER_ADMIN"]
 *   children {ReactNode}   Composant à afficher si autorisé
 *   fallback {ReactNode}   Composant si non autorisé (défaut: redirect /403)
 *
 * Utilisation :
 *   <RoleGuard roles={["SUPER_ADMIN"]}>
 *     <AdminPanel />
 *   </RoleGuard>
 */
export function RoleGuard({ roles, children, fallback }) {
  const { user, loading } = useAuth();
  const { can }           = useRole();
  const location          = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        Chargement...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!can(roles)) {
    return fallback ?? <Navigate to="/403" replace />;
  }

  return children;
}

/**
 * Affichage conditionnel inline (pas de redirect).
 *
 * Utilisation :
 *   <ShowForRole roles={["SUPER_ADMIN", "ADMIN"]}>
 *     <button>Supprimer tout</button>
 *   </ShowForRole>
 */
export function ShowForRole({ roles, children }) {
  const { can } = useRole();
  return can(roles) ? children : null;
}
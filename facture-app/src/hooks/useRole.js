import { useAuth } from "./useAuth";

/**
 * Hook RBAC — fournit des helpers de rôle pour le frontend.
 *
 * Utilisation :
 *   const { isSuperAdmin, isAdmin, can } = useRole();
 *   if (can(["ADMIN", "SUPER_ADMIN"])) { ... }
 */
export function useRole() {
  const { user } = useAuth();

  return {
    role:         user?.role ?? null,
    isSuperAdmin: user?.role === "SUPER_ADMIN",
    isAdmin:      user?.role === "ADMIN",
    isUser:       user?.role === "USER",
    companyId:    user?.company_id ?? null,
    companyName:  user?.company_name ?? null,

    /**
     * Vérifie si l'utilisateur a l'un des rôles spécifiés.
     * @param {string[]} roles
     */
    can: (roles) => roles.includes(user?.role),

    /**
     * Vérifie si l'utilisateur peut accéder aux données d'une entreprise.
     * @param {number} companyId
     */
    canAccessCompany: (companyId) => {
      if (!user) return false;
      if (user.role === "SUPER_ADMIN") return true;
      return user.company_id === companyId;
    },
  };
}
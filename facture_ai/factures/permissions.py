from rest_framework.permissions import BasePermission, SAFE_METHODS


# ─────────────────────────────────────────────
#  Permissions de base par rôle
# ─────────────────────────────────────────────

class IsSuperAdmin(BasePermission):
    """Seul le SUPER_ADMIN est autorisé."""
    message = "Réservé au Super Admin."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.is_super_admin
        )


class IsAdminOrSuperAdmin(BasePermission):
    """ADMIN de son entreprise ou SUPER_ADMIN."""
    message = "Réservé aux Admins et Super Admins."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and (request.user.is_super_admin or request.user.is_admin)
        )


class IsAuthenticatedWithCompany(BasePermission):
    """
    Utilisateur authentifié ET lié à une entreprise
    (sauf SUPER_ADMIN qui n'en a pas besoin).
    """
    message = "Aucune entreprise associée à votre compte."

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.is_super_admin:
            return True
        return user.company is not None


# ─────────────────────────────────────────────
#  Permissions au niveau de l'objet
# ─────────────────────────────────────────────

class InvoiceObjectPermission(BasePermission):
    """
    Lecture / écriture sur une facture :
    - SUPER_ADMIN  → tout
    - ADMIN        → factures de son entreprise
    - USER         → ses propres factures uniquement
    """
    message = "Vous n'avez pas accès à cette facture."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_super_admin:
            return True
        if user.is_admin:
            return obj.company_id == user.company_id
        return obj.owner_id == user.id


class UserObjectPermission(BasePermission):
    """
    - SUPER_ADMIN  → peut modifier n'importe quel utilisateur
    - ADMIN        → peut modifier les users de son entreprise (pas les ADMINs)
    - USER         → peut modifier uniquement son propre profil
    """
    message = "Vous n'avez pas accès à cet utilisateur."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_super_admin:
            return True
        if user.is_admin:
            # L'admin ne peut pas toucher à un autre admin ou super_admin
            if obj.role in ("ADMIN", "SUPER_ADMIN") and obj.id != user.id:
                return False
            return obj.company_id == user.company_id
        # USER : uniquement lui-même, en lecture seule sur certains champs
        if obj.id == user.id:
            # Lecture toujours OK, écriture OK sauf changement de rôle
            return True
        return False


class CompanyObjectPermission(BasePermission):
    """
    - SUPER_ADMIN → accès total
    - ADMIN       → lecture seule sur sa propre entreprise
    """
    message = "Vous n'avez pas accès à cette entreprise."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_super_admin:
            return True
        if user.is_admin and obj.id == user.company_id:
            return request.method in SAFE_METHODS
        return False
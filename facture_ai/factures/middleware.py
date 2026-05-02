import logging
from django.http import JsonResponse

logger = logging.getLogger(__name__)


class RBACMiddleware:
    """
    Middleware de sécurité RBAC.
    Vérifie :
      1. Que le compte est actif
      2. Que les ADMIN/USER ont une entreprise associée
      3. Journalise les tentatives d'accès refusées
    """

    # Routes qui ne nécessitent pas de contrôle RBAC
    EXEMPT_PATHS = (
        "/api/auth/login/",
        "/api/auth/register/",
        "/api/auth/refresh/",
        "/api/auth/verify/",
        "/admin/",
        "/api/schema/",
        "/api/docs/",
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # ── Routes publiques ──────────────────────────────────────────────────
        if any(path.startswith(p) for p in self.EXEMPT_PATHS):
            return self.get_response(request)

        user = getattr(request, "user", None)

        if user and user.is_authenticated:

            # ── Compte désactivé ─────────────────────────────────────────────
            if not user.is_active:
                logger.warning(
                    "Compte désactivé — tentative d'accès : user_id=%s path=%s",
                    user.id, path
                )
                return JsonResponse(
                    {"error": "Compte désactivé. Contactez votre administrateur."},
                    status=403,
                )

            # ── ADMIN / USER sans entreprise ─────────────────────────────────
            if user.role in ("ADMIN", "USER") and user.company is None:
                logger.warning(
                    "Aucune entreprise — user_id=%s role=%s path=%s",
                    user.id, user.role, path
                )
                return JsonResponse(
                    {"error": "Aucune entreprise associée à votre compte."},
                    status=403,
                )

        return self.get_response(request)
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied
from .models import Invoice


class RBACInvoiceFilterMixin:
    """
    Filtre automatique selon le rôle.
    """
    def get_queryset(self):
        user = self.request.user
        qs   = Invoice.objects.select_related("owner", "company")

        if user.is_super_admin:
            return qs

        if user.is_admin and user.company:
            return qs.filter(company=user.company)

        # USER
        if user.company:
            return qs.filter(company=user.company, owner=user)

        return Invoice.objects.none()


class RBACUserFilterMixin:
    """
    Filtre automatique pour les utilisateurs selon le rôle.
    """
    def get_queryset(self):
        from authentication.models import User
        user = self.request.user
        qs   = User.objects.select_related("company")

        if user.is_super_admin:
            return qs

        if user.is_admin and user.company:
            return qs.filter(company=user.company)

        return User.objects.filter(id=user.id)


class RBACStatsFilterMixin:
    """
    Calcul des statistiques filtrées selon le rôle.
    """
    def compute_stats(self):
        qs = self.get_queryset()
        
        # Compter les factures ayant des doublons
        duplicates_count = 0
        counted_ids = set()
        
        for invoice in qs:
            if invoice.id in counted_ids:
                continue
            
            dups = invoice.get_duplicates()
            if dups.exists():
                # Ajouter cette facture et tous ses doublons au compteur
                duplicates_count += 1  # La facture actuelle
                counted_ids.add(invoice.id)
                
                # Ajouter les doublons trouvés
                for dup in dups:
                    if dup.id not in counted_ids:
                        duplicates_count += 1
                        counted_ids.add(dup.id)
        
        return {
            "total":        qs.count(),
            "pending":      qs.filter(status=Invoice.Status.PENDING).count(),
            "validated":    qs.filter(status=Invoice.Status.VALIDATED).count(),
            "rejected":     qs.filter(status=Invoice.Status.REJECTED).count(),
            "duplicates":   duplicates_count,
        }
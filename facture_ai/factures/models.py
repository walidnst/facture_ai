from django.db import models
from django.conf import settings
from authentication.models import Company


# ─────────────────────────────────────────────
#  Invoice
# ─────────────────────────────────────────────
class Invoice(models.Model):
    class Status(models.TextChoices):
        PENDING   = "PENDING",   "En attente"
        VALIDATED = "VALIDATED", "Validée"
        REJECTED  = "REJECTED",  "Rejetée"

    class Devise(models.TextChoices):
        MAD = "MAD", "Dirham marocain"
        EUR = "EUR", "Euro"
        USD = "USD", "Dollar américain"
        GBP = "GBP", "Livre sterling"
        AED = "AED", "Dirham émirati"
        SAR = "SAR", "Riyal saoudien"
        CHF = "CHF", "Franc suisse"
        CAD = "CAD", "Dollar canadien"
        JPY = "JPY", "Yen japonais"
        CNY = "CNY", "Yuan chinois"

    owner        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="invoices",
    )
    company      = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="invoices",
    )
    fournisseur  = models.CharField(max_length=255, blank=True, null=True)
    numero_facture = models.CharField(max_length=100, blank=True, null=True, help_text="Numéro de facture du fournisseur")  # ← NOUVEAU
    total        = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tva          = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    devise       = models.CharField(max_length=3, choices=Devise.choices, default=Devise.MAD)
    date_facture = models.DateField(null=True, blank=True)
    status       = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    file         = models.FileField(upload_to="invoices/%Y/%m/", null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    validated_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        verbose_name        = "Facture"
        verbose_name_plural = "Factures"
        ordering            = ["-created_at"]
        indexes = [
            models.Index(fields=['company', 'fournisseur', 'date_facture', 'total']),  # ← NOUVEAU (optimisation)
            models.Index(fields=['company', 'numero_facture']),  # ← NOUVEAU
        ]

    def __str__(self):
        return f"Facture #{self.id} – {self.fournisseur or 'Sans fournisseur'} ({self.devise})"

    def get_duplicates(self):
        """
        Détection intelligente de doublons avec stratégie hybride :
        
        PRIORITÉ 1 (le plus fiable) :
          - Même numéro de facture + même fournisseur
        
        PRIORITÉ 2 (si lignes existent) :
          - Même fournisseur (similarité 85%+)
          - Même date + montant
          - Mêmes articles (similarité 85%+)
        
        PRIORITÉ 3 (fallback strict) :
          - Fournisseur identique à 95%+
          - Même date + montant + TVA
        """
        if not self.fournisseur or not self.date_facture:
            return Invoice.objects.none()
        
        from difflib import SequenceMatcher
        
        # ═══════════════════════════════════════════════════════════
        # STRATÉGIE 1 : Numéro de facture (le plus fiable)
        # ═══════════════════════════════════════════════════════════
        if self.numero_facture:
            # Normaliser le numéro (retirer espaces, tirets)
            normalized_numero = self.numero_facture.replace(' ', '').replace('-', '').upper()
            
            candidates_by_numero = Invoice.objects.filter(
                company=self.company,
                numero_facture__isnull=False,
            ).exclude(id=self.id)
            
            duplicates_by_numero = []
            for candidate in candidates_by_numero:
                candidate_numero = candidate.numero_facture.replace(' ', '').replace('-', '').upper()
                
                # Si même numéro de facture
                if normalized_numero == candidate_numero:
                    # Vérifier que c'est bien le même fournisseur
                    fournisseur_similarity = SequenceMatcher(
                        None,
                        self.fournisseur.lower(),
                        candidate.fournisseur.lower() if candidate.fournisseur else ""
                    ).ratio()
                    
                    if fournisseur_similarity >= 0.7:  # Tolérance pour les typos
                        duplicates_by_numero.append(candidate.id)
            
            if duplicates_by_numero:
                return Invoice.objects.filter(id__in=duplicates_by_numero)
        
        # ═══════════════════════════════════════════════════════════
        # STRATÉGIE 2 : Comparaison par lignes (si disponibles)
        # ═══════════════════════════════════════════════════════════
        my_lignes = list(self.lignes.all())
        
        if len(my_lignes) > 0:
            # Chercher les factures avec même date + montant
            candidates = Invoice.objects.filter(
                company=self.company,
                date_facture=self.date_facture,
                total=self.total,
            ).exclude(id=self.id).prefetch_related('lignes')
            
            duplicates_by_lines = []
            
            for candidate in candidates:
                if not candidate.fournisseur:
                    continue
                
                # Vérifier similarité fournisseur
                fournisseur_similarity = SequenceMatcher(
                    None,
                    self.fournisseur.lower(),
                    candidate.fournisseur.lower()
                ).ratio()
                
                if fournisseur_similarity < 0.85:  # Plus strict pour cette méthode
                    continue
                
                # Comparer les lignes
                candidate_lignes = list(candidate.lignes.all())
                
                if self._compare_lignes(my_lignes, candidate_lignes):
                    duplicates_by_lines.append(candidate.id)
            
            if duplicates_by_lines:
                return Invoice.objects.filter(id__in=duplicates_by_lines)
        
        # ═══════════════════════════════════════════════════════════
        # STRATÉGIE 3 : Fallback strict (pas de lignes, pas de numéro)
        # ═══════════════════════════════════════════════════════════
        candidates = Invoice.objects.filter(
            company=self.company,
            date_facture=self.date_facture,
            total=self.total,
            tva=self.tva,  # Même TVA aussi
        ).exclude(id=self.id)
        
        duplicates_strict = []
        
        for candidate in candidates:
            if not candidate.fournisseur:
                continue
            
            # Fournisseur doit être quasi-identique (95%+)
            fournisseur_similarity = SequenceMatcher(
                None,
                self.fournisseur.lower(),
                candidate.fournisseur.lower()
            ).ratio()
            
            if fournisseur_similarity >= 0.95:
                duplicates_strict.append(candidate.id)
        
        return Invoice.objects.filter(id__in=duplicates_strict)

    def _compare_lignes(self, lignes1, lignes2):
        """
        Compare deux ensembles de lignes de facture.
        Retourne True si au moins 85% des lignes correspondent.
        """
        from difflib import SequenceMatcher
        
        if len(lignes1) != len(lignes2):
            return False
        
        if len(lignes1) == 0:
            return False
        
        # Créer des signatures pour chaque ligne
        def ligne_signature(ligne):
            return {
                'designation': ligne.designation.lower().strip() if ligne.designation else '',
                'quantite': float(ligne.quantite),
                'prix': float(ligne.prix_unitaire),
                'montant': float(ligne.montant),
            }
        
        sig1 = [ligne_signature(l) for l in lignes1]
        sig2 = [ligne_signature(l) for l in lignes2]
        
        # Trier par montant pour comparer indépendamment de l'ordre
        sig1.sort(key=lambda x: (x['montant'], x['designation']))
        sig2.sort(key=lambda x: (x['montant'], x['designation']))
        
        matches = 0
        
        for s1, s2 in zip(sig1, sig2):
            # Comparer les montants (doivent être identiques à 0.01 près)
            if abs(s1['montant'] - s2['montant']) > 0.01:
                continue
            
            # Comparer quantité et prix
            if abs(s1['quantite'] - s2['quantite']) > 0.01:
                continue
            
            if abs(s1['prix'] - s2['prix']) > 0.01:
                continue
            
            # Comparer les désignations (similarité texte)
            if s1['designation'] and s2['designation']:
                designation_similarity = SequenceMatcher(
                    None,
                    s1['designation'],
                    s2['designation']
                ).ratio()
                
                if designation_similarity >= 0.85:  # 85% de similarité
                    matches += 1
            elif not s1['designation'] and not s2['designation']:
                # Les deux sont vides, compter comme match si montant identique
                matches += 1
        
        # Au moins 85% des lignes doivent correspondre
        return (matches / len(sig1)) >= 0.85


# ─────────────────────────────────────────────
#  LigneFacture
# ─────────────────────────────────────────────
class LigneFacture(models.Model):
    facture       = models.ForeignKey(
        Invoice, on_delete=models.CASCADE,
        related_name="lignes", null=True, blank=True,
    )
    designation   = models.CharField(max_length=255)
    quantite      = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant       = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Ligne de facture"
        ordering     = ["id"]

    def __str__(self):
        return f"{self.designation} x{self.quantite}"


# ─────────────────────────────────────────────
#  EcritureComptable
# ─────────────────────────────────────────────
class EcritureComptable(models.Model):
    invoice    = models.ForeignKey(
        Invoice, on_delete=models.CASCADE, related_name="ecritures",
    )
    compte     = models.CharField(max_length=20)
    libelle    = models.CharField(max_length=255)
    debit      = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    credit     = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Écriture comptable"
        ordering     = ["id"]

    def __str__(self):
        return f"{self.compte} | D:{self.debit} C:{self.credit}"


# ─────────────────────────────────────────────
#   AuditLog
# ─────────────────────────────────────────────
class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATED   = "CREATED",   "Créée"
        VALIDATED = "VALIDATED", "Validée"
        REJECTED  = "REJECTED",  "Rejetée"
        DELETED   = "DELETED",   "Supprimée"
        UPLOADED  = "UPLOADED",  "Uploadée"
        EXPORTED  = "EXPORTED",  "Exportée"
        DUPLICATE = "DUPLICATE", "Doublon détecté"

    invoice     = models.ForeignKey(
        Invoice, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="audit_logs",
    )
    invoice_ref = models.CharField(
        max_length=100, blank=True,
        help_text="Référence conservée même si la facture est supprimée"
    )
    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="audit_logs",
    )
    user_email  = models.CharField(max_length=255, blank=True)
    company     = models.ForeignKey(
        Company, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="audit_logs",
    )
    action      = models.CharField(max_length=20, choices=Action.choices)
    details     = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Journal d'audit"
        verbose_name_plural = "Journal d'audit"
        ordering            = ["-created_at"]

    def __str__(self):
        return f"[{self.action}] {self.invoice_ref} par {self.user_email}"

    @classmethod
    def log(cls, action, invoice=None, user=None, details=""):
        """Helper pour créer une entrée d'audit facilement."""
        return cls.objects.create(
            invoice     = invoice,
            invoice_ref = f"#{invoice.id} – {invoice.fournisseur}" if invoice else "N/A",
            user        = user,
            user_email  = user.email if user else "Système",
            company     = invoice.company if invoice else None,
            action      = action,
            details     = details,
        )
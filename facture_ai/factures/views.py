from django.db import models as django_models
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status
from django.utils import timezone
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Invoice, LigneFacture, Company, EcritureComptable, AuditLog
from .serializers import (
    InvoiceSerializer, InvoiceListSerializer,
    UserSerializer, CompanySerializer, EcritureSerializer,
    LigneFactureSerializer, AuditLogSerializer,
)
from .permissions import (
    IsSuperAdmin, IsAdminOrSuperAdmin, IsAuthenticatedWithCompany,
    InvoiceObjectPermission, UserObjectPermission, CompanyObjectPermission,
)
from .mixins import RBACInvoiceFilterMixin, RBACUserFilterMixin, RBACStatsFilterMixin

User = get_user_model()


# ─────────────────────────────────────────────
#  Invoice ViewSet
# ─────────────────────────────────────────────
class InvoiceViewSet(RBACInvoiceFilterMixin, RBACStatsFilterMixin, viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in ("list", "retrieve", "create", "stats", "ecritures", "lignes", "check_duplicates"):
            return [IsAuthenticated(), IsAuthenticatedWithCompany()]
        return [IsAuthenticated(), IsAuthenticatedWithCompany(), InvoiceObjectPermission()]

    def get_serializer_class(self):
        return InvoiceListSerializer if self.action == "list" else InvoiceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.prefetch_related("lignes", "ecritures", "audit_logs")

    def perform_create(self, serializer):
        invoice = serializer.save(owner=self.request.user, company=self.request.user.company)
        AuditLog.log(
            action=AuditLog.Action.CREATED,
            invoice=invoice,
            user=self.request.user,
            details=f"Facture créée via interface web. Fournisseur: {invoice.fournisseur}, Total: {invoice.total} {invoice.devise}",
        )
        duplicates = invoice.get_duplicates()
        if duplicates.exists():
            AuditLog.log(
                action=AuditLog.Action.DUPLICATE,
                invoice=invoice,
                user=self.request.user,
                details=f"Doublon détecté avec facture(s) : {', '.join(['#' + str(d.id) for d in duplicates])}",
            )

    @action(detail=False, methods=["delete"],
            permission_classes=[IsAuthenticated, IsAdminOrSuperAdmin], url_path="delete-all")
    def delete_all(self, request):
        qs = self.get_queryset()
        for invoice in qs:
            AuditLog.log(action=AuditLog.Action.DELETED, invoice=invoice, user=request.user, details="Suppression groupée")
        count, _ = qs.delete()
        return Response({"message": f"{count} facture(s) supprimée(s)."}, status=200)

    @action(detail=True, methods=["post"],
            permission_classes=[IsAuthenticated, IsAuthenticatedWithCompany, InvoiceObjectPermission],
            url_path="valider")
    def valider(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == Invoice.Status.VALIDATED:
            return Response({"error": "Facture déjà validée."}, status=400)
        invoice.status = Invoice.Status.VALIDATED
        invoice.validated_at = timezone.now() 
        invoice.save()
        ecritures = _generate_ecritures(invoice)
        AuditLog.log(
            action=AuditLog.Action.VALIDATED, invoice=invoice, user=request.user,
            details=f"Validée par {request.user.email}. Écritures PCM générées.",
        )
        return Response({
            "message":   "Facture validée.",
            "devise":    invoice.devise,
            "ecritures": EcritureSerializer(ecritures, many=True).data,
        })

    @action(detail=False, methods=["post"],
            permission_classes=[IsAuthenticated, IsAdminOrSuperAdmin], url_path="valider-all")
    def valider_all(self, request):
        qs = self.get_queryset().filter(status=Invoice.Status.PENDING)
        count = qs.count()
        for invoice in qs:
            invoice.status = Invoice.Status.VALIDATED
            invoice.validated_at = timezone.now() 
            invoice.save()
            _generate_ecritures(invoice)
            AuditLog.log(
                action=AuditLog.Action.VALIDATED, invoice=invoice, user=request.user,
                details=f"Validation groupée par {request.user.email}",
            )
        return Response({"message": f"{count} facture(s) validée(s)."})

    def destroy(self, request, *args, **kwargs):
        invoice = self.get_object()
        AuditLog.log(
            action=AuditLog.Action.DELETED, invoice=invoice, user=request.user,
            details=f"Supprimée par {request.user.email}",
        )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["get"],
            permission_classes=[IsAuthenticated, IsAuthenticatedWithCompany], url_path="ecritures")
    def ecritures(self, request, pk=None):
        invoice = self.get_object()
        return Response({
            "devise":    invoice.devise,
            "ecritures": EcritureSerializer(invoice.ecritures.order_by("id"), many=True).data,
        })

    @action(detail=True, methods=["get"],
            permission_classes=[IsAuthenticated, IsAuthenticatedWithCompany], url_path="lignes")
    def lignes(self, request, pk=None):
        invoice = self.get_object()
        lignes  = invoice.lignes.order_by("id")
        return Response({
            "invoice_id":   invoice.id,
            "fournisseur":  invoice.fournisseur,
            "date":         invoice.date_facture,
            "total":        str(invoice.total),
            "tva":          str(invoice.tva),
            "devise":       invoice.devise,
            "lignes_count": lignes.count(),
            "lignes":       LigneFactureSerializer(lignes, many=True).data,
        })

    @action(detail=True, methods=["get"],
            permission_classes=[IsAuthenticated, IsAuthenticatedWithCompany], url_path="check-duplicates")
    def check_duplicates(self, request, pk=None):
        invoice    = self.get_object()
        duplicates = invoice.get_duplicates()
        return Response({
            "has_duplicates": duplicates.exists(),
            "count":          duplicates.count(),
            "duplicates": [
                {
                    "id":           d.id,
                    "fournisseur":  d.fournisseur,
                    "total":        str(d.total),
                    "date_facture": str(d.date_facture),
                    "status":       d.status,
                }
                for d in duplicates
            ],
        })

    @action(detail=False, methods=["get"],
            permission_classes=[IsAuthenticated, IsAuthenticatedWithCompany], url_path="stats")
    def stats(self, request):
        return Response(self.compute_stats())

    @action(detail=True, methods=["get"], url_path="export/pdf",
            permission_classes=[IsAuthenticated, IsAuthenticatedWithCompany, InvoiceObjectPermission])
    def export_pdf(self, request, pk=None):
        invoice = self.get_object()
        AuditLog.log(action=AuditLog.Action.EXPORTED, invoice=invoice, user=request.user, details="Export PDF")
        from django.http import HttpResponse
        return HttpResponse(f"PDF facture #{invoice.id}", content_type="application/pdf")


# ─────────────────────────────────────────────
#  AuditLog ViewSet
# ─────────────────────────────────────────────
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsAdminOrSuperAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs   = AuditLog.objects.select_related("invoice", "user", "company")
        if not user.is_super_admin and user.company:
            qs = qs.filter(company=user.company)
        action  = self.request.query_params.get("action")
        user_id = self.request.query_params.get("user_id")
        from_dt = self.request.query_params.get("from")
        to_dt   = self.request.query_params.get("to")
        if action:  qs = qs.filter(action=action)
        if user_id: qs = qs.filter(user_id=user_id)
        if from_dt: qs = qs.filter(created_at__date__gte=from_dt)
        if to_dt:   qs = qs.filter(created_at__date__lte=to_dt)
        return qs


# ─────────────────────────────────────────────
#  User ViewSet  ✅ CORRIGÉ
# ─────────────────────────────────────────────
class UserViewSet(RBACUserFilterMixin, viewsets.ModelViewSet):
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == "me":
            return [IsAuthenticated()]
        if self.action in ("list", "retrieve", "create"):
            return [IsAuthenticated(), IsAdminOrSuperAdmin()]
        return [IsAuthenticated(), IsAdminOrSuperAdmin(), UserObjectPermission()]

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(company=user.company, role="USER") if user.is_admin else serializer.save()

   
    @action(
        detail=False,
        methods=["get", "patch"],
        url_path="me",
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def me(self, request):
        if request.method == "GET":
            return Response(UserSerializer(request.user, context={"request": request}).data)

        s = UserSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        s.is_valid(raise_exception=True)
        s.validated_data.pop("role",    None)
        s.validated_data.pop("company", None)
        s.save()
        return Response(s.data)

    @action(detail=True, methods=["patch"], permission_classes=[IsSuperAdmin], url_path="set-role")
    def set_role(self, request, pk=None):
        user = self.get_object()
        role = request.data.get("role")
        if role not in [r[0] for r in User.Role.choices]:
            return Response({"error": "Rôle invalide."}, status=400)
        user.role = role
        user.save()
        return Response({"message": f"Rôle mis à jour : {role}"})


# ─────────────────────────────────────────────
#  Company ViewSet
# ─────────────────────────────────────────────
class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated(), IsAdminOrSuperAdmin(), CompanyObjectPermission()]
        return [IsAuthenticated(), IsSuperAdmin()]

    def get_queryset(self):
        user = self.request.user
        if user.is_super_admin:
            return Company.objects.all()
        if user.is_admin and user.company:
            return Company.objects.filter(id=user.company_id)
        return Company.objects.none()

    @action(detail=False, methods=["get"], permission_classes=[IsSuperAdmin], url_path="global-stats")
    def global_stats(self, request):
        companies = Company.objects.annotate(
            invoice_count=django_models.Count("invoices"),
            user_count=django_models.Count("users"),
            total_amount=django_models.Sum("invoices__total"),
        ).values("id", "nom", "invoice_count", "user_count", "total_amount")
        return Response({
            "total_companies": Company.objects.count(),
            "total_users":     User.objects.count(),
            "total_invoices":  Invoice.objects.count(),
            "companies":       list(companies),
        })


# ─────────────────────────────────────────────
#  Helper : génération des écritures comptables
# ─────────────────────────────────────────────
def _generate_ecritures(invoice):
    EcritureComptable.objects.filter(invoice=invoice).delete()
    ht     = float(invoice.total) - float(invoice.tva)
    tva    = float(invoice.tva)
    total  = float(invoice.total)
    devise = invoice.devise
    fourn  = invoice.fournisseur or "Fournisseur"
    rows = [
        {"compte": "61200", "libelle": f"Achat – {fourn}",                 "debit": ht,    "credit": 0},
        {"compte": "34550", "libelle": f"TVA récupérable ({devise})",       "debit": tva,   "credit": 0},
        {"compte": "44100", "libelle": f"Fournisseur – {fourn} [{devise}]", "debit": 0,     "credit": total},
    ]
    return [EcritureComptable.objects.create(invoice=invoice, **r) for r in rows]


# ─────────────────────────────────────────────
#  Auth me
# ─────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        "id":       user.id,
        "username": getattr(user, "username", user.email),
        "email":    user.email,
        "role":     user.role,
        "company":  user.company_id,
    })
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Invoice, LigneFacture, Company, EcritureComptable   # ✅ LigneFacture importé

User = get_user_model()


class CompanySerializer(serializers.ModelSerializer):
    user_count    = serializers.IntegerField(source="users.count",    read_only=True)
    invoice_count = serializers.IntegerField(source="invoices.count", read_only=True)

    class Meta:
        model  = Company
        fields = ["id", "nom", "email", "telephone", "adresse",
                  "is_active", "user_count", "invoice_count", "created_at"]
        read_only_fields = ["created_at"]


class CompanyMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Company
        fields = ["id", "nom"]


class UserSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.nom", read_only=True)
    password     = serializers.CharField(write_only=True, required=False)

    class Meta:
        model  = User
        fields = ["id", "email", "nom", "prenom", "role", "company",
                  "company_name", "is_active", "created_at", "password",
                  "avatar"] 
        read_only_fields = ["created_at"]

    def validate_role(self, value):
        request   = self.context.get("request")
        requester = request.user if request else None
        if not requester:
            return value
        if requester.role == "USER":
            raise serializers.ValidationError("Vous ne pouvez pas modifier votre rôle.")
        if requester.role == "ADMIN" and value in ("ADMIN", "SUPER_ADMIN"):
            raise serializers.ValidationError("Un Admin ne peut pas assigner Admin ou Super Admin.")
        return value

    def validate_company(self, value):
        request   = self.context.get("request")
        requester = request.user if request else None
        if requester and requester.role == "ADMIN" and value and value.id != requester.company_id:
            raise serializers.ValidationError("Vous ne pouvez créer des utilisateurs que dans votre entreprise.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ["id", "email", "nom", "prenom", "role"]


class EcritureSerializer(serializers.ModelSerializer):
    class Meta:
        model  = EcritureComptable
        fields = ["id", "compte", "libelle", "debit", "credit"]


class LigneFactureSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LigneFacture
        fields = ["id", "designation", "quantite", "prix_unitaire", "montant"]


class InvoiceSerializer(serializers.ModelSerializer):
    owner_name   = serializers.CharField(source="owner.nom",   read_only=True)
    company_name = serializers.CharField(source="company.nom", read_only=True)
    ecritures    = EcritureSerializer(many=True, read_only=True)
    lignes       = LigneFactureSerializer(many=True, read_only=True)   # ✅ AJOUTÉ

    class Meta:
        model  = Invoice
        fields = [
            "id", "fournisseur", "total", "tva", "devise",
            "date_facture", "status", "file",
            "owner", "owner_name", "company", "company_name",
            "lignes",      # ✅ AJOUTÉ
            "ecritures", "created_at", "updated_at","validated_at"
        ]
        read_only_fields = ["owner", "owner_name", "company", "company_name",
                           "lignes", "ecritures", "created_at", "updated_at", "validated_at",]


class InvoiceListSerializer(serializers.ModelSerializer):
    owner_name   = serializers.CharField(source="owner.nom",   read_only=True)
    company_name = serializers.CharField(source="company.nom", read_only=True)
    lignes_count = serializers.IntegerField(source="lignes.count", read_only=True)  # ✅ compteur pour la liste

    class Meta:
        model  = Invoice
        fields = [
            "id", "fournisseur", "total", "tva", "devise",
            "date_facture", "status",
            "owner_name", "company_name",
            "lignes_count",   # ✅ AJOUTÉ
            "created_at",
            "validated_at",
        ]

from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_email   = serializers.CharField(read_only=True)
    company_name = serializers.CharField(source="company.nom", read_only=True)
    action_label = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model  = AuditLog
        fields = [
            "id", "invoice", "invoice_ref",
            "user", "user_email",
            "company", "company_name",
            "action", "action_label",
            "details", "created_at",
        ]
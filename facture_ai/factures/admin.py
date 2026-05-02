# factures/admin.py
from django.contrib import admin
from authentication.models import Company  # remove User import
from factures.models import Invoice, LigneFacture, EcritureComptable


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display  = ("id", "nom", "email", "telephone", "is_active", "created_at")
    list_filter   = ("is_active",)
    search_fields = ("nom", "email")


class LigneInline(admin.TabularInline):
    model  = LigneFacture
    extra  = 0
    fields = ("designation", "quantite", "prix_unitaire", "montant")


class EcritureInline(admin.TabularInline):
    model  = EcritureComptable
    extra  = 0
    fields = ("compte", "libelle", "debit", "credit")


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display    = ("id", "fournisseur", "total", "tva", "status", "owner", "company", "created_at")
    list_filter     = ("status", "company")
    search_fields   = ("fournisseur", "owner__email")
    readonly_fields = ("created_at", "updated_at")
    inlines         = [LigneInline, EcritureInline]
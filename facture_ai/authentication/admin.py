from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Company



@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ["id", "email", "nom", "prenom", "role", "company", "is_active", "created_at"]
    list_filter   = ["role", "is_active", "company"]
    search_fields = ["email", "nom", "prenom"]
    ordering      = ["id"]

    fieldsets = (
        ("Identité", {
            "fields": ("email", "password", "nom", "prenom", "entreprise", "company")
        }),
        ("Rôle & Accès", {
            "fields": ("role", "is_active", "is_staff", "is_superuser")
        }),
        ("WhatsApp", {
            "fields": ("phone", "whatsapp_lid"),
            "description": "Renseignez le numéro ou le LID visible dans les logs du bot."
        }),
        ("Permissions", {
            "fields": ("groups", "user_permissions"),
            "classes": ("collapse",)
        }),
        ("Dates", {
            "fields": ("last_login",),
            "classes": ("collapse",)
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "nom", "prenom", "company", "role", "password1", "password2"),
        }),
    )
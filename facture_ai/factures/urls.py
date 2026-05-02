from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .views import InvoiceViewSet, UserViewSet, CompanyViewSet, AuditLogViewSet, me  # ✅ AuditLogViewSet ajouté

router = DefaultRouter()
router.register(r"invoices",  InvoiceViewSet,  basename="invoice")
router.register(r"users",     UserViewSet,     basename="user")
router.register(r"companies", CompanyViewSet,  basename="company")
router.register(r"audit",     AuditLogViewSet, basename="audit")  

urlpatterns = [
    # JWT
    path("api/auth/login/",   TokenObtainPairView.as_view(), name="token_obtain"),
    path("api/auth/refresh/", TokenRefreshView.as_view(),    name="token_refresh"),
    path("api/auth/verify/",  TokenVerifyView.as_view(),     name="token_verify"),

    path("", include(router.urls)),

    path("auth/me/", me, name="me"),
]
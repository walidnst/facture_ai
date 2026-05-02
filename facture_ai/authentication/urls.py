from django.urls import path
from . import views

urlpatterns = [
    path('register/',        views.register),
    path('login/',           views.login),
    path('forgot-password/', views.forgot_password),
    path('reset-password/',  views.reset_password),
    path('me/',              views.me),                        # ✅ GET + PATCH
    path('change-password/', views.change_password),           # ✅ NOUVEAU
    path('admin/users/create/',          views.admin_create_user),
    path('admin/users/',                 views.admin_liste_users),
    path('admin/users/<int:pk>/',        views.admin_update_user),
    path('admin/users/<int:pk>/delete/', views.admin_delete_user),
    path('admin/companies/',             views.admin_companies),
]
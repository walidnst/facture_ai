from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

def home(request):
    return HttpResponse("Backend is running 🚀")

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),

    # ✅ JWT — URL propre et directe
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # ✅ Apps
    path('api/', include('factures.urls')),
    path('api/', include('api.urls')),
    path('api/whatsapp/', include('whatsapp.urls')),
    path('api/auth/', include('authentication.urls')),
    path('api/chat/', include('chat.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
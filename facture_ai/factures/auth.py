from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Enrichit le token JWT avec :
    - role
    - company_id
    - company_name
    - user_id
    - username
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Claims personnalisés dans le JWT
        token["role"]         = user.role
        token["user_id"]      = user.id
        token["username"]     = user.username
        token["email"]        = user.email
        token["company_id"]   = user.company_id
        token["company_name"] = user.company.name if user.company else None

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Ajoute aussi les infos dans la réponse JSON (utile pour le frontend)
        user = self.user
        data["user"] = {
            "id":           user.id,
            "username":     user.username,
            "email":        user.email,
            "role":         user.role,
            "company_id":   user.company_id,
            "company_name": user.company.name if user.company else None,
            "is_active":    user.is_active,
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
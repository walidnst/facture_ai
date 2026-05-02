import random
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import User, Company, Role


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    refresh['role']       = user.role
    refresh['company_id'] = user.company_id
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


def user_data(user):
    """Sérialisation standard d'un user."""
    avatar_url = None
    if user.avatar:
        avatar_url = f"http://127.0.0.1:8000{user.avatar.url}"

    return {
        "id":         user.id,
        "email":      user.email,
        "nom":        user.nom,
        "prenom":     user.prenom,
        "entreprise": user.entreprise,
        "role":       user.role,
        "company_id": user.company_id,
        "company":    user.company.nom if user.company else None,
        "avatar":     avatar_url,   # ✅ AJOUTÉ
    }


# ── Register ──────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    data       = request.data
    email      = data.get('email', '').lower().strip()
    password   = data.get('password', '')
    nom        = data.get('nom', '')
    prenom     = data.get('prenom', '')
    entreprise = data.get('entreprise', '')

    if not email or not password or not nom or not prenom:
        return Response({"error": "Tous les champs sont obligatoires"}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Cet email est déjà utilisé"}, status=400)

    if len(password) < 6:
        return Response({"error": "Mot de passe trop court (6 caractères min)"}, status=400)

    company = None
    if entreprise:
        company, _ = Company.objects.get_or_create(nom=entreprise)

    user = User.objects.create_user(
        email=email, password=password,
        nom=nom, prenom=prenom,
        entreprise=entreprise,
        company=company,
        role=Role.USER,
    )

    return Response({
        "message": "Compte créé avec succès",
        "tokens":  get_tokens(user),
        "user":    user_data(user),
    })


# ── Login ─────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email    = request.data.get('email', '').lower().strip()
    password = request.data.get('password', '')

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Email ou mot de passe incorrect"}, status=401)

    if not user.check_password(password):
        return Response({"error": "Email ou mot de passe incorrect"}, status=401)

    return Response({
        "message": "Connexion réussie",
        "tokens":  get_tokens(user),
        "user":    user_data(user),
    })


# ── Forgot password ───────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email', '').lower().strip()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"message": "Si cet email existe, un code a été envoyé"})

    code            = str(random.randint(100000, 999999))
    user.reset_code = code
    user.save()

    try:
        send_mail(
            subject="Code de réinitialisation - Smart Facture",
            message=f"Votre code : {code}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )
    except Exception:
        pass

    return Response({"message": "Code envoyé", "dev_code": code})


# ── Reset password ────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    email    = request.data.get('email', '').lower().strip()
    code     = request.data.get('code', '')
    password = request.data.get('password', '')

    try:
        user = User.objects.get(email=email, reset_code=code)
    except User.DoesNotExist:
        return Response({"error": "Code invalide"}, status=400)

    if len(password) < 6:
        return Response({"error": "Mot de passe trop court"}, status=400)

    user.set_password(password)
    user.reset_code = None
    user.save()

    return Response({"message": "Mot de passe réinitialisé avec succès"})


# ── Me (GET + PATCH) ✅ CORRIGÉ ───────────────────────────────────────────────
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def me(request):
    user = request.user

    if request.method == 'GET':
        return Response(user_data(user))

    # ── PATCH : mise à jour profil + avatar ───────────────────────────────
    nom    = request.data.get('nom')
    prenom = request.data.get('prenom')
    email  = request.data.get('email', '').lower().strip()
    avatar = request.FILES.get('avatar')   # ✅ fichier image

    if nom:    user.nom    = nom
    if prenom: user.prenom = prenom
    if email and email != user.email:
        if User.objects.filter(email=email).exclude(pk=user.pk).exists():
            return Response({"error": "Cet email est déjà utilisé"}, status=400)
        user.email = email
    if avatar:
        user.avatar = avatar   # ✅ sauvegarde le fichier en base

    user.save()
    return Response(user_data(user))


# ── Change password ───────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user         = request.user
    old_password = request.data.get('old_password', '')
    new_password = request.data.get('new_password', '')

    if not user.check_password(old_password):
        return Response({"error": "Mot de passe actuel incorrect"}, status=400)

    if len(new_password) < 6:
        return Response({"error": "Nouveau mot de passe trop court"}, status=400)

    user.set_password(new_password)
    user.save()
    return Response({"message": "Mot de passe modifié avec succès"})


# ── Admin : liste tous les users ──────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_liste_users(request):
    if not request.user.is_super_admin:
        return Response({"error": "Accès refusé"}, status=403)

    users = User.objects.select_related('company').all().order_by('-created_at')
    return Response({"users": [user_data(u) for u in users]})


# ── Admin : modifier un user ──────────────────────────────────────────────────
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_user(request, pk):
    if not request.user.is_super_admin:
        return Response({"error": "Accès refusé"}, status=403)

    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur introuvable"}, status=404)

    new_role       = request.data.get('role')
    new_company_id = request.data.get('company_id')
    is_active      = request.data.get('is_active')

    if new_role and new_role in Role.values:
        user.role = new_role
    if new_company_id is not None:
        user.company_id = new_company_id or None
    if is_active is not None:
        user.is_active = is_active

    user.save()
    return Response({"message": "Utilisateur mis à jour", "user": user_data(user)})


# ── Admin : supprimer un user ─────────────────────────────────────────────────
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_user(request, pk):
    if not request.user.is_super_admin:
        return Response({"error": "Accès refusé"}, status=403)

    try:
        User.objects.get(pk=pk).delete()
        return Response({"ok": True})
    except User.DoesNotExist:
        return Response({"error": "Utilisateur introuvable"}, status=404)


# ── Admin : companies ─────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_companies(request):
    if not request.user.is_super_admin:
        return Response({"error": "Accès refusé"}, status=403)

    if request.method == 'GET':
        companies = Company.objects.all().order_by('-created_at')
        data = [{"id": c.id, "nom": c.nom, "email": c.email,
                 "users_count": c.users.count()} for c in companies]
        return Response({"companies": data})

    nom = request.data.get('nom', '').strip()
    if not nom:
        return Response({"error": "Nom obligatoire"}, status=400)
    company = Company.objects.create(
        nom=nom,
        email=request.data.get('email', ''),
        telephone=request.data.get('telephone', ''),
        adresse=request.data.get('adresse', ''),
    )
    return Response({"id": company.id, "nom": company.nom}, status=201)


# ── Admin : créer un user ─────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_user(request):
    if not request.user.is_super_admin and not request.user.is_admin:
        return Response({"error": "Accès refusé"}, status=403)

    data       = request.data
    email      = data.get('email', '').lower().strip()
    password   = data.get('password', '')
    nom        = data.get('nom', '')
    prenom     = data.get('prenom', '')
    role       = data.get('role', Role.USER)
    company_id = data.get('company_id')

    if not email or not password or not nom or not prenom:
        return Response({"error": "Tous les champs sont obligatoires"}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Cet email est déjà utilisé"}, status=400)

    if request.user.role == "ADMIN":
        role       = Role.USER
        company_id = request.user.company_id

    if role not in Role.values:
        return Response({"error": "Rôle invalide"}, status=400)

    user = User.objects.create_user(
        email=email, password=password,
        nom=nom, prenom=prenom,
        role=role,
        company_id=company_id or None,
    )

    return Response({"message": "Utilisateur créé avec succès", "user": user_data(user)}, status=201)
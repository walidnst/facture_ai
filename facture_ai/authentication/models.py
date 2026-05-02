from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class Role(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    ADMIN       = 'ADMIN',       'Admin'
    USER        = 'USER',        'User'


class Company(models.Model):
    nom        = models.CharField(max_length=200)
    email      = models.EmailField(blank=True)
    telephone  = models.CharField(max_length=20, blank=True)
    adresse    = models.TextField(blank=True)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email obligatoire")
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        extra.setdefault('role', Role.SUPER_ADMIN)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    email      = models.EmailField(unique=True)
    nom        = models.CharField(max_length=100)
    prenom     = models.CharField(max_length=100)
    entreprise = models.CharField(max_length=200, blank=True)
    company    = models.ForeignKey(
        Company, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='users'
    )
    role       = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)

    # ✅ NOUVEAU : photo de profil
    avatar = models.ImageField(
        upload_to="avatars/",
        null=True,
        blank=True,
        verbose_name="Photo de profil",
    )

    phone = models.CharField(
        max_length=20, blank=True, null=True, unique=True,
        verbose_name="Numéro WhatsApp",
        help_text="Format international sans + ni espaces. Ex: 212612345678",
    )

    whatsapp_lid = models.CharField(
        max_length=50, blank=True, null=True, unique=True,
        verbose_name="WhatsApp LID",
        help_text="Identifiant interne @lid. Visible dans les logs : [RESOLVE] numéro normalisé = XXXXXXX",
    )

    reset_code = models.CharField(max_length=6, blank=True, null=True)
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    groups = models.ManyToManyField(
        'auth.Group', blank=True,
        related_name='authentication_users',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission', blank=True,
        related_name='authentication_users',
        verbose_name='user permissions',
    )

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']

    objects = UserManager()

    @property
    def is_super_admin(self):
        return self.role == Role.SUPER_ADMIN

    @property
    def is_admin(self):
        return self.role in (Role.SUPER_ADMIN, Role.ADMIN)

    def __str__(self):
        return f"{self.email} [{self.role}]"
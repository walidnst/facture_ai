from django.db import models
from django.conf import settings
from authentication.models import Company


class Room(models.Model):
    """
    Un salon de chat par entreprise.
    - type 'general'  : canal global de l'entreprise (créé automatiquement)
    - type 'direct'   : conversation privée entre 2 utilisateurs
    """
    class RoomType(models.TextChoices):
        GENERAL = 'general', 'Général'
        DIRECT  = 'direct',  'Direct'

    company    = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='chat_rooms',
    )
    name       = models.CharField(max_length=100)          # ex: "général", "comptabilité"
    room_type  = models.CharField(
        max_length=10,
        choices=RoomType.choices,
        default=RoomType.GENERAL,
    )
    members    = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='chat_rooms',
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Salon'
        verbose_name_plural = 'Salons'
        # Un seul salon "général" par entreprise
        unique_together = [('company', 'name')]

    def __str__(self):
        return f"[{self.company.nom}] #{self.name}"


class Message(models.Model):
    room       = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_messages',
    )
    content    = models.TextField()
    # Pièce jointe optionnelle (facture PDF, image…)
    file       = models.FileField(upload_to='chat/files/%Y/%m/', null=True, blank=True)
    file_name  = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Message'
        ordering     = ['created_at']

    def __str__(self):
        return f"{self.sender.email} → #{self.room.name} : {self.content[:40]}"


class MessageRead(models.Model):
    """Garde la trace des messages lus par chaque utilisateur."""
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='reads',
    )
    user    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='message_reads',
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('message', 'user')]
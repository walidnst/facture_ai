from rest_framework import serializers
from .models import Room, Message, MessageRead
from django.conf import settings


class SenderSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    initials  = serializers.SerializerMethodField()

    class Meta:
        model  = settings.AUTH_USER_MODEL
        fields = ['id', 'email', 'full_name', 'initials', 'role']

    def get_full_name(self, obj):
        return f"{obj.prenom} {obj.nom}".strip()

    def get_initials(self, obj):
        p = obj.prenom[0].upper() if obj.prenom else ''
        n = obj.nom[0].upper()    if obj.nom    else ''
        return f"{p}{n}" or obj.email[0].upper()

    # Importer le vrai model dynamiquement pour éviter les imports circulaires
    def to_representation(self, instance):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.Meta.model = User
        return super().to_representation(instance)


class MessageSerializer(serializers.ModelSerializer):
    sender   = serializers.SerializerMethodField()
    read_by  = serializers.SerializerMethodField()
    has_file = serializers.SerializerMethodField()

    class Meta:
        model  = Message
        fields = [
            'id', 'room', 'sender', 'content',
            'file', 'file_name', 'has_file',
            'created_at', 'read_by',
        ]
        read_only_fields = ['id', 'sender', 'created_at', 'read_by']

    def get_sender(self, obj):
        u = obj.sender
        prenom = getattr(u, 'prenom', '') or ''
        nom    = getattr(u, 'nom', '')    or ''
        full   = f"{prenom} {nom}".strip() or u.email
        p = prenom[0].upper() if prenom else ''
        n = nom[0].upper()    if nom    else ''
        initials = f"{p}{n}" or u.email[0].upper()
        return {
            'id':        u.id,
            'email':     u.email,
            'full_name': full,
            'initials':  initials,
            'role':      getattr(u, 'role', ''),
        }

    def get_read_by(self, obj):
        return list(obj.reads.values_list('user_id', flat=True))

    def get_has_file(self, obj):
        return bool(obj.file)


class RoomSerializer(serializers.ModelSerializer):
    unread_count  = serializers.SerializerMethodField()
    last_message  = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()

    class Meta:
        model  = Room
        fields = [
            'id', 'name', 'room_type', 'company',
            'unread_count', 'last_message', 'members_count',
            'created_at',
        ]

    def get_unread_count(self, obj):
        user = self.context.get('request').user
        read_ids = MessageRead.objects.filter(
            user=user, message__room=obj
        ).values_list('message_id', flat=True)
        return obj.messages.exclude(id__in=read_ids).exclude(sender=user).count()

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if not msg:
            return None
        return {
            'content':    msg.content[:60],
            'sender':     msg.sender.email,
            'created_at': msg.created_at,
        }

    def get_members_count(self, obj):
        return obj.members.count()
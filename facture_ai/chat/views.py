from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from .models import Room, Message, MessageRead
from .serializers import RoomSerializer, MessageSerializer


# ─────────────────────────────────────────────
#  Rooms
# ─────────────────────────────────────────────

class RoomListView(APIView):
    """
    GET  /api/chat/rooms/  → liste des salons de l'entreprise de l'utilisateur
    POST /api/chat/rooms/  → créer un nouveau salon (admin seulement)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        if not company:
            return Response({'detail': 'Aucune entreprise associée.'}, status=400)

        rooms = Room.objects.filter(company=company).prefetch_related('members', 'messages')
        serializer = RoomSerializer(rooms, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_admin:
            return Response({'detail': 'Permission refusée.'}, status=403)

        company = request.user.company
        name    = request.data.get('name', '').strip().lower()

        if not name:
            return Response({'detail': 'Le nom du salon est requis.'}, status=400)

        room, created = Room.objects.get_or_create(
            company=company,
            name=name,
            defaults={'room_type': 'general'},
        )
        # Ajouter tous les membres de l'entreprise automatiquement
        if created:
            room.members.set(company.users.filter(is_active=True))

        serializer = RoomSerializer(room, context={'request': request})
        return Response(serializer.data, status=201 if created else 200)


class RoomDetailView(APIView):
    """
    GET /api/chat/rooms/<room_id>/  → détail d'un salon
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        room = get_object_or_404(
            Room,
            id=room_id,
            company=request.user.company,
        )
        serializer = RoomSerializer(room, context={'request': request})
        return Response(serializer.data)


# ─────────────────────────────────────────────
#  Messages
# ─────────────────────────────────────────────

class MessageListView(APIView):
    """
    GET  /api/chat/rooms/<room_id>/messages/   → historique (50 derniers)
    POST /api/chat/rooms/<room_id>/messages/   → envoyer un message
    """
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def _get_room(self, request, room_id):
        return get_object_or_404(
            Room,
            id=room_id,
            company=request.user.company,
        )

    def get(self, request, room_id):
        room     = self._get_room(request, room_id)
        # Pagination simple : ?before=<message_id> pour le scroll infini
        before   = request.query_params.get('before')
        messages = room.messages.select_related('sender').order_by('-created_at')

        if before:
            messages = messages.filter(id__lt=before)

        messages = list(reversed(messages[:50]))

        # Marquer tous les messages comme lus automatiquement
        unread_ids = [
            m.id for m in messages
            if m.sender_id != request.user.id
            and not m.reads.filter(user=request.user).exists()
        ]
        for mid in unread_ids:
            MessageRead.objects.get_or_create(message_id=mid, user=request.user)

        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, room_id):
        room    = self._get_room(request, room_id)
        content = request.data.get('content', '').strip()
        file    = request.FILES.get('file')

        if not content and not file:
            return Response({'detail': 'Message vide.'}, status=400)

        msg = Message.objects.create(
            room      = room,
            sender    = request.user,
            content   = content,
            file      = file,
            file_name = file.name if file else '',
        )
        # Marquer comme lu par l'expéditeur lui-même
        MessageRead.objects.create(message=msg, user=request.user)

        serializer = MessageSerializer(msg, context={'request': request})
        return Response(serializer.data, status=201)


class NewMessagesView(APIView):
    """
    GET /api/chat/rooms/<room_id>/new/?since=<message_id>
    Polling léger : retourne les messages avec id > since
    Le frontend appelle ça toutes les 3 secondes.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        room  = get_object_or_404(
            Room,
            id=room_id,
            company=request.user.company,
        )
        since = request.query_params.get('since', 0)

        try:
            since = int(since)
        except ValueError:
            since = 0

        messages = room.messages.filter(id__gt=since).select_related('sender').order_by('created_at')

        # Marquer comme lus
        unread_ids = [
            m.id for m in messages
            if m.sender_id != request.user.id
            and not m.reads.filter(user=request.user).exists()
        ]
        for mid in unread_ids:
            MessageRead.objects.get_or_create(message_id=mid, user=request.user)

        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)


# ─────────────────────────────────────────────
#  Salon général : auto-setup
# ─────────────────────────────────────────────

class SetupCompanyChatView(APIView):
    """
    POST /api/chat/setup/
    Crée le salon #général pour l'entreprise de l'utilisateur connecté.
    À appeler une fois à l'inscription ou au login de l'admin.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        company = request.user.company
        if not company:
            return Response({'detail': 'Aucune entreprise associée.'}, status=400)

        room, created = Room.objects.get_or_create(
            company=company,
            name='général',
            defaults={'room_type': 'general'},
        )
        room.members.set(company.users.filter(is_active=True))

        return Response({
            'room_id': room.id,
            'created': created,
            'name':    room.name,
        })
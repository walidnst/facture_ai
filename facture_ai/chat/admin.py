from django.contrib import admin
from .models import Room, Message, MessageRead


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display  = ['id', 'company', 'name', 'room_type', 'created_at']
    list_filter   = ['company', 'room_type']
    search_fields = ['name', 'company__nom']
    filter_horizontal = ['members']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display  = ['id', 'room', 'sender', 'content_preview', 'created_at']
    list_filter   = ['room__company', 'room']
    search_fields = ['content', 'sender__email']
    raw_id_fields = ['sender', 'room']

    def content_preview(self, obj):
        return obj.content[:50]
    content_preview.short_description = 'Message'


@admin.register(MessageRead)
class MessageReadAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'user', 'read_at']
    raw_id_fields = ['message', 'user']
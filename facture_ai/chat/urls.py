from django.urls import path
from .views import (
    RoomListView,
    RoomDetailView,
    MessageListView,
    NewMessagesView,
    SetupCompanyChatView,
)

urlpatterns = [
    # Setup initial
    path('setup/',                                    SetupCompanyChatView.as_view()),

    # Salons
    path('rooms/',                                    RoomListView.as_view()),
    path('rooms/<int:room_id>/',                      RoomDetailView.as_view()),

    # Messages
    path('rooms/<int:room_id>/messages/',             MessageListView.as_view()),
    path('rooms/<int:room_id>/new/',                  NewMessagesView.as_view()),
]
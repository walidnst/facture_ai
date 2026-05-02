import api from "./api";

const chatService = {

  // Setup le salon général de l'entreprise (appeler au login)
  setup: () =>
    api.post(`/chat/setup/`).then(r => r.data),

  // Liste des salons
  getRooms: () =>
    api.get(`/chat/rooms/`).then(r => r.data),

  // Créer un salon (admin)
  createRoom: (name) =>
    api.post(`/chat/rooms/`, { name }).then(r => r.data),

  // Historique messages (50 derniers)
  getMessages: (roomId, before = null) => {
    const params = before ? { before } : {};
    return api.get(`/chat/rooms/${roomId}/messages/`, { params }).then(r => r.data);
  },

  // Envoyer un message texte
  sendMessage: (roomId, content) =>
    api.post(`/chat/rooms/${roomId}/messages/`, { content }).then(r => r.data),

  // Envoyer un message avec fichier
  sendFile: (roomId, content, file) => {
    const fd = new FormData();
    fd.append("content", content || "");
    fd.append("file", file);
    return api.post(`/chat/rooms/${roomId}/messages/`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data);
  },

  // Polling : nouveaux messages depuis un id
  getNewMessages: (roomId, sinceId) =>
    api.get(`/chat/rooms/${roomId}/new/`, { params: { since: sinceId } }).then(r => r.data),
};

export default chatService;
import { useState, useEffect, useRef, useCallback } from "react";
import chatService from "../services/chatService";

const POLL_INTERVAL = 3000; // 3 secondes

export function useChat(roomId) {
  const [messages,  setMessages]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState(null);
  const lastIdRef   = useRef(0);
  const pollRef     = useRef(null);
  const bottomRef   = useRef(null);

  // Scroll automatique vers le bas
  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  // Charger l'historique initial
  const loadHistory = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await chatService.getMessages(roomId);
      setMessages(data);
      if (data.length > 0) {
        lastIdRef.current = data[data.length - 1].id;
      }
      scrollToBottom();
    } catch (e) {
      setError("Impossible de charger les messages.");
    } finally {
      setLoading(false);
    }
  }, [roomId, scrollToBottom]);

  // Polling : nouveaux messages
  const pollNewMessages = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await chatService.getNewMessages(roomId, lastIdRef.current);
      if (data.length > 0) {
        setMessages(prev => [...prev, ...data]);
        lastIdRef.current = data[data.length - 1].id;
        scrollToBottom();
      }
    } catch {
      // Silencieux — on réessaie au prochain tick
    }
  }, [roomId, scrollToBottom]);

  // Démarrer/arrêter le polling quand roomId change
  useEffect(() => {
    if (!roomId) return;
    loadHistory();

    pollRef.current = setInterval(pollNewMessages, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [roomId, loadHistory, pollNewMessages]);

  // Envoyer un message
  const sendMessage = useCallback(async (content, file = null) => {
    if ((!content?.trim() && !file) || sending) return;
    setSending(true);
    try {
      const msg = file
        ? await chatService.sendFile(roomId, content, file)
        : await chatService.sendMessage(roomId, content);

      setMessages(prev => [...prev, msg]);
      lastIdRef.current = msg.id;
      scrollToBottom();
    } catch {
      setError("Échec de l'envoi.");
    } finally {
      setSending(false);
    }
  }, [roomId, sending, scrollToBottom]);

  return { messages, loading, sending, error, sendMessage, bottomRef };
}
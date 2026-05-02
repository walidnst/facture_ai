import { useState, useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";
import chatService from "../services/chatService";
import "./ChatPage.css";

// ─── Helpers ───────────────────────────────────────────────
function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString())     return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function groupByDay(messages) {
  const groups = {};
  messages.forEach(m => {
    const day = new Date(m.created_at).toDateString();
    if (!groups[day]) groups[day] = [];
    groups[day].push(m);
  });
  return groups;
}

function getInitials(sender) {
  if (!sender) return "?";
  const full = sender.full_name || sender.email || "";
  const parts = full.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return full[0]?.toUpperCase() || "?";
}

const AVATAR_COLORS = [
  "#3d35a0", "#0f6e56", "#993c1d", "#993556",
  "#185fa5", "#639922", "#ba7517", "#a32d2d",
];
function avatarColor(id) {
  return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
}

// ─── Composants ────────────────────────────────────────────

function Avatar({ sender, size = 32 }) {
  const bg = avatarColor(sender?.id);
  return (
    <div
      className="chat-avatar"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.35 }}
    >
      {getInitials(sender)}
    </div>
  );
}

function FileBubble({ msg }) {
  const url = msg.file ? `http://127.0.0.1:8000${msg.file}` : null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="chat-file-bubble"
    >
      <div className="chat-file-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c6cf8" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div>
        <div className="chat-file-name">{msg.file_name || "Fichier"}</div>
        <div className="chat-file-dl">Cliquer pour télécharger</div>
      </div>
    </a>
  );
}

function MessageBubble({ msg, isMine }) {
  return (
    <div className={`chat-msg-row ${isMine ? "mine" : ""}`}>
      {!isMine && <Avatar sender={msg.sender} />}
      <div className="chat-msg-body">
        {!isMine && (
          <div className="chat-msg-sender">
            {msg.sender?.full_name || msg.sender?.email} · {formatTime(msg.created_at)}
          </div>
        )}
        {msg.content && (
          <div className="chat-bubble">{msg.content}</div>
        )}
        {msg.has_file && <FileBubble msg={msg} />}
        {isMine && (
          <div className="chat-msg-time">
            {formatTime(msg.created_at)}
            {msg.read_by?.length > 1 && (
              <span className="chat-read"> · Lu par {msg.read_by.length - 1}</span>
            )}
          </div>
        )}
      </div>
      {isMine && <Avatar sender={msg.sender} />}
    </div>
  );
}

function Composer({ onSend, sending }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  function handleSend() {
    if (!text.trim() && !file) return;
    onSend(text, file);
    setText("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-composer">
      {file && (
        <div className="chat-file-preview">
          <span>{file.name}</span>
          <button onClick={() => setFile(null)}>✕</button>
        </div>
      )}
      <div className="chat-composer-box">
        <button
          className="chat-comp-btn"
          title="Joindre un fichier"
          onClick={() => fileRef.current?.click()}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          style={{ display: "none" }}
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={e => setFile(e.target.files[0] || null)}
        />
        <textarea
          className="chat-composer-input"
          placeholder="Écrire un message…"
          value={text}
          rows={1}
          onChange={e => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
          }}
          onKeyDown={handleKey}
        />
        <button
          className={`chat-send-btn ${sending ? "sending" : ""}`}
          onClick={handleSend}
          disabled={sending}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────

export default function ChatPage() {
  const { user } = useAuth();
  const [rooms,          setRooms]          = useState([]);
  const [activeRoom,     setActiveRoom]     = useState(null);
  const [loadingRooms,   setLoadingRooms]   = useState(true);
  const [newRoomName,    setNewRoomName]    = useState("");
  const [showNewRoom,    setShowNewRoom]    = useState(false);

  const { messages, loading, sending, error, sendMessage, bottomRef } = useChat(activeRoom?.id);

  // Setup + charger les salons
  useEffect(() => {
    async function init() {
      try {
        await chatService.setup();
        const data = await chatService.getRooms();
        setRooms(data);
        if (data.length > 0) setActiveRoom(data[0]);
      } catch (e) {
        console.error("Chat init error", e);
      } finally {
        setLoadingRooms(false);
      }
    }
    init();
  }, []);

  // Rafraîchir les unread counts toutes les 5s
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const data = await chatService.getRooms();
        setRooms(data);
      } catch {}
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  async function handleCreateRoom(e) {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const room = await chatService.createRoom(newRoomName.trim());
      setRooms(prev => [...prev.filter(r => r.id !== room.id), room]);
      setActiveRoom(room);
      setNewRoomName("");
      setShowNewRoom(false);
    } catch {}
  }

  const groupedMessages = groupByDay(messages);

  return (
    <div className="chat-shell">
      {/* ── Sidebar ── */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c6cf8" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <div>
            <div className="chat-sidebar-title">Messages</div>
            <div className="chat-sidebar-sub">{user?.company_name || user?.entreprise || "Mon entreprise"}</div>
          </div>
        </div>

        <div className="chat-rooms-label">Salons</div>

        {loadingRooms ? (
          <div className="chat-rooms-loading">Chargement…</div>
        ) : (
          rooms.map(room => (
            <div
              key={room.id}
              className={`chat-room-item ${activeRoom?.id === room.id ? "active" : ""}`}
              onClick={() => setActiveRoom(room)}
            >
              <div className="chat-room-avatar">#</div>
              <div className="chat-room-meta">
                <div className="chat-room-name">{room.name}</div>
                {room.last_message && (
                  <div className="chat-room-preview">
                    {room.last_message.content || "Fichier joint"}
                  </div>
                )}
              </div>
              {room.unread_count > 0 && (
                <div className="chat-badge">{room.unread_count}</div>
              )}
            </div>
          ))
        )}

        {/* Créer un salon (admin) */}
        {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
          <div className="chat-new-room">
            {showNewRoom ? (
              <form onSubmit={handleCreateRoom} className="chat-new-room-form">
                <input
                  autoFocus
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  placeholder="Nom du salon…"
                />
                <button type="submit">+</button>
                <button type="button" onClick={() => setShowNewRoom(false)}>✕</button>
              </form>
            ) : (
              <button className="chat-add-room-btn" onClick={() => setShowNewRoom(true)}>
                + Nouveau salon
              </button>
            )}
          </div>
        )}
      </aside>

      {/* ── Zone principale ── */}
      <div className="chat-main">
        {activeRoom ? (
          <>
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-hash">#</div>
                <div>
                  <div className="chat-header-name">{activeRoom.name}</div>
                  <div className="chat-header-members">
                    {activeRoom.members_count ?? "–"} membres
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {loading ? (
                <div className="chat-loading">Chargement des messages…</div>
              ) : (
                Object.entries(groupedMessages).map(([day, msgs]) => (
                  <div key={day}>
                    <div className="chat-day-divider">
                      <div className="chat-day-line" />
                      <span>{formatDay(msgs[0].created_at)}</span>
                      <div className="chat-day-line" />
                    </div>
                    {msgs.map(msg => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isMine={msg.sender?.id === user?.id}
                      />
                    ))}
                  </div>
                ))
              )}
              {error && <div className="chat-error">{error}</div>}
              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <Composer onSend={sendMessage} sending={sending} />
          </>
        ) : (
          <div className="chat-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3a3a5a" strokeWidth="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <p>Sélectionnez un salon pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
}
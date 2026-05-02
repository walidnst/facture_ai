import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#06070d;--surface:#0d0f1a;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.13);
  --text:#f0f0f5;--muted:rgba(255,255,255,0.35);
  --indigo:#6366f1;--emerald:#10b981;--rose:#f43f5e;--cyan:#06b6d4;--violet:#8b5cf6;
}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes slideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
.f1{animation:fadeUp .5s ease .05s both;}
.f2{animation:fadeUp .5s ease .12s both;}
.f3{animation:fadeUp .5s ease .20s both;}
.f4{animation:fadeUp .5s ease .28s both;}

.login-shell{
  min-height:100vh;background:var(--bg);display:flex;align-items:center;justify-content:center;
  padding:2rem;font-family:'Bricolage Grotesque',sans-serif;color:var(--text);position:relative;overflow:hidden;
}
.blob1{position:fixed;top:-200px;left:-150px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 65%);pointer-events:none;z-index:0;}
.blob2{position:fixed;bottom:-150px;right:-100px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 65%);pointer-events:none;z-index:0;}

.login-card{
  background:var(--surface);border:1px solid var(--border2);border-radius:24px;padding:2.5rem;
  width:100%;max-width:400px;position:relative;z-index:1;
}
.login-brand{display:flex;align-items:center;gap:10px;margin-bottom:2rem;}
.login-brand-icon{width:40px;height:40px;background:linear-gradient(135deg,var(--indigo),var(--violet));border-radius:11px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(99,102,241,.35);}
.login-eyebrow{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--indigo);margin-bottom:2px;}
.login-brand-name{font-size:15px;font-weight:800;letter-spacing:-.01em;}
.login-divider{height:1px;background:var(--border);margin-bottom:1.75rem;}
.login-title{font-size:22px;font-weight:800;letter-spacing:-.02em;margin-bottom:4px;}
.login-sub{font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-bottom:1.75rem;letter-spacing:.04em;}
.login-error{background:rgba(244,63,94,.08);border:1px solid rgba(244,63,94,.25);color:#fb7185;border-radius:10px;padding:10px 14px;font-size:12px;font-family:'JetBrains Mono',monospace;margin-bottom:1.25rem;display:flex;align-items:center;gap:8px;}
.login-success{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);color:#34d399;border-radius:10px;padding:10px 14px;font-size:12px;font-family:'JetBrains Mono',monospace;margin-bottom:1.25rem;display:flex;align-items:center;gap:8px;}
.sf-sec-label{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);margin-bottom:.5rem;}
.login-field{margin-bottom:1.1rem;}
.login-input{width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--border2);font-size:14px;font-family:'Bricolage Grotesque',sans-serif;outline:none;background:rgba(255,255,255,.04);color:var(--text);transition:border-color .2s,background .2s;}
.login-input:focus{border-color:var(--indigo);background:rgba(99,102,241,.06);}
.login-input::placeholder{color:var(--muted);}

.forgot-link{
  display:inline-block;font-size:11px;color:var(--indigo);text-decoration:none;font-weight:600;
  font-family:'JetBrains Mono',monospace;letter-spacing:.03em;transition:all .2s ease;margin-top:.25rem;
}
.forgot-link:hover{color:#818cf8;text-decoration:underline;}

.login-btn{width:100%;padding:14px;background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;font-family:'Bricolage Grotesque',sans-serif;font-size:14px;font-weight:700;border:none;border-radius:12px;cursor:pointer;margin-top:.5rem;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity .2s,box-shadow .2s;box-shadow:0 4px 20px rgba(99,102,241,.35);letter-spacing:.01em;}
.login-btn:hover:not(:disabled){opacity:.9;box-shadow:0 6px 28px rgba(99,102,241,.5);}
.login-btn:disabled{opacity:.35;cursor:not-allowed;box-shadow:none;}
.login-footer{margin-top:1.5rem;padding:12px 14px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,.02);font-size:11px;color:var(--muted);line-height:1.7;font-family:'JetBrains Mono',monospace;text-align:center;}

/* MODAL */
.modal-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);
  display:flex;align-items:center;justify-content:center;z-index:2000;padding:2rem;animation:fadeIn .3s ease;
}
.modal{
  background:var(--surface);border:1px solid var(--border2);border-radius:20px;padding:2rem;
  width:100%;max-width:440px;box-shadow:0 24px 80px rgba(0,0,0,0.6);animation:slideUp .4s ease;
}
.modal-header{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--border);
}
.modal-title{font-size:18px;font-weight:700;letter-spacing:-.02em;}
.modal-close{
  background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;
  width:32px;height:32px;cursor:pointer;font-size:18px;display:flex;align-items:center;
  justify-content:center;transition:all 0.2s ease;color:var(--muted);font-weight:700;
}
.modal-close:hover{background:rgba(255,255,255,0.08);border-color:var(--border2);color:var(--text);transform:rotate(90deg);}
.modal-body{margin-bottom:1.5rem;}
.modal-text{font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:1.25rem;font-family:'JetBrains Mono',monospace;}
.modal-actions{display:flex;gap:0.75rem;margin-top:1.25rem;}
.modal-btn-cancel{
  flex:1;padding:12px;background:rgba(255,255,255,0.05);border:1px solid var(--border);
  border-radius:10px;color:var(--text);font-size:13px;font-weight:700;
  font-family:'Bricolage Grotesque',sans-serif;cursor:pointer;transition:all 0.2s ease;
}
.modal-btn-cancel:hover{background:rgba(255,255,255,0.08);border-color:var(--border2);}
.modal-btn-submit{
  flex:1;padding:12px;background:linear-gradient(135deg,var(--indigo),var(--violet));border:none;
  border-radius:10px;color:#fff;font-size:13px;font-weight:700;
  font-family:'Bricolage Grotesque',sans-serif;cursor:pointer;transition:all 0.2s ease;
  box-shadow:0 4px 16px rgba(99,102,241,0.4);display:flex;align-items:center;justify-content:center;gap:0.5rem;
}
.modal-btn-submit:hover:not(:disabled){box-shadow:0 6px 24px rgba(99,102,241,0.6);opacity:0.9;}
.modal-btn-submit:disabled{opacity:0.35;cursor:not-allowed;}

/* Step indicator */
.modal-steps{display:flex;align-items:center;gap:8px;margin-bottom:1.5rem;}
.modal-step{
  display:flex;align-items:center;justify-content:center;
  width:24px;height:24px;border-radius:50%;font-size:11px;font-weight:700;
  font-family:'JetBrains Mono',monospace;transition:all .3s ease;
}
.modal-step.active{background:var(--indigo);color:#fff;box-shadow:0 0 12px rgba(99,102,241,0.5);}
.modal-step.done{background:rgba(16,185,129,0.2);color:#34d399;border:1px solid rgba(16,185,129,0.3);}
.modal-step.inactive{background:rgba(255,255,255,0.05);color:var(--muted);border:1px solid var(--border);}
.modal-step-line{flex:1;height:1px;background:var(--border);}
.modal-step-line.done{background:rgba(16,185,129,0.3);}

/* Code input */
.code-input{
  width:100%;padding:14px;border-radius:12px;border:1px solid var(--border2);
  font-size:22px;font-family:'JetBrains Mono',monospace;font-weight:600;
  letter-spacing:0.3em;text-align:center;outline:none;
  background:rgba(99,102,241,0.05);color:var(--text);transition:border-color .2s;
}
.code-input:focus{border-color:var(--indigo);background:rgba(99,102,241,.08);}
.code-input::placeholder{color:var(--muted);letter-spacing:0.2em;font-size:16px;}

.modal-back-btn{
  background:none;border:none;color:var(--muted);font-size:12px;font-family:'JetBrains Mono',monospace;
  cursor:pointer;display:flex;align-items:center;gap:4px;padding:0;margin-bottom:1rem;
  transition:color .2s;
}
.modal-back-btn:hover{color:var(--text);}

@media(max-width:480px){
  .login-card{padding:2rem 1.5rem;}
  .modal{padding:1.5rem;}
}
`;

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // Modal récupération — 3 steps : 1=email, 2=code+newpass, 3=succès
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetStep,    setResetStep]    = useState(1);
  const [resetEmail,   setResetEmail]   = useState("");
  const [resetCode,    setResetCode]    = useState("");
  const [newPassword,  setNewPassword]  = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError,   setResetError]   = useState("");

  const { login }    = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const from         = location.state?.from?.pathname || "/factures";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(username, password);
      if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Identifiants incorrects. Vérifiez votre nom d'utilisateur et mot de passe."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 1 : envoyer le code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setResetError("");
    if (!resetEmail) { setResetError("Veuillez entrer votre adresse email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) { setResetError("Adresse email invalide"); return; }

    setResetLoading(true);
    try {
      await api.post("/auth/forgot-password/", { email: resetEmail });
      setResetStep(2);
    } catch (err) {
      setResetError(err.response?.data?.error || "Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2 : vérifier code + nouveau mot de passe
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    if (!resetCode) { setResetError("Entrez le code reçu par email"); return; }
    if (!newPassword || newPassword.length < 6) { setResetError("Le mot de passe doit contenir au moins 6 caractères"); return; }

    setResetLoading(true);
    try {
      await api.post("/auth/reset-password/", {
        email: resetEmail,
        code: resetCode,
        password: newPassword,
      });
      setResetStep(3);
    } catch (err) {
      setResetError(err.response?.data?.error || "Code invalide ou expiré.");
    } finally {
      setResetLoading(false);
    }
  };

  const openForgotModal = () => {
    setShowForgotModal(true);
    setResetStep(1);
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setResetError("");
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setResetStep(1);
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setResetError("");
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-shell">
        <div className="blob1" /><div className="blob2" />
        <div className="login-card">

          <div className="login-brand f1">
            <div className="login-brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <div className="login-eyebrow">Smart Facture · OCR</div>
              <div className="login-brand-name">Import facture</div>
            </div>
          </div>

          <div className="login-divider" />
          <div className="login-title f2">Connexion</div>
          <div className="login-sub f2">Accédez à votre espace de gestion</div>

          {error && (
            <div className="login-error f2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-field f3">
              <div className="sf-sec-label">Nom d'utilisateur</div>
              <input className="login-input" type="text" value={username}
                onChange={e => setUsername(e.target.value)} placeholder="votre_identifiant" autoFocus required />
            </div>
            <div className="login-field f3">
              <div className="sf-sec-label">Mot de passe</div>
              <input className="login-input" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); openForgotModal(); }}>
                Mot de passe oublié ?
              </a>
            </div>
            <button className="login-btn f4" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: "spin .7s linear infinite" }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Connexion...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Se connecter
                </>
              )}
            </button>
          </form>

          <div className="login-footer f4">
            🔒 Connexion sécurisée · Données chiffrées
          </div>
        </div>
      </div>

      {/* ── Modal Récupération mot de passe ── */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={closeForgotModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <div className="modal-title">
                {resetStep === 1 && "Mot de passe oublié"}
                {resetStep === 2 && "Vérification du code"}
                {resetStep === 3 && "Mot de passe réinitialisé"}
              </div>
              <button className="modal-close" onClick={closeForgotModal}>×</button>
            </div>

            {/* Indicateur de steps */}
            <div className="modal-steps">
              <div className={`modal-step ${resetStep === 1 ? "active" : "done"}`}>
                {resetStep > 1 ? "✓" : "1"}
              </div>
              <div className={`modal-step-line ${resetStep > 1 ? "done" : ""}`} />
              <div className={`modal-step ${resetStep === 2 ? "active" : resetStep > 2 ? "done" : "inactive"}`}>
                {resetStep > 2 ? "✓" : "2"}
              </div>
              <div className={`modal-step-line ${resetStep > 2 ? "done" : ""}`} />
              <div className={`modal-step ${resetStep === 3 ? "done" : "inactive"}`}>3</div>
            </div>

            <div className="modal-body">

              {/* ── Step 1 : Email ── */}
              {resetStep === 1 && (
                <>
                  <p className="modal-text">
                    Entrez votre adresse email. Vous recevrez un code à 6 chiffres pour réinitialiser votre mot de passe.
                  </p>
                  {resetError && (
                    <div className="login-error">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {resetError}
                    </div>
                  )}
                  <form onSubmit={handleSendCode}>
                    <div className="login-field">
                      <div className="sf-sec-label">Adresse email</div>
                      <input type="email" className="login-input" placeholder="votre.email@exemple.com"
                        value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                        disabled={resetLoading} autoFocus />
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="modal-btn-cancel" onClick={closeForgotModal} disabled={resetLoading}>
                        Annuler
                      </button>
                      <button type="submit" className="modal-btn-submit" disabled={resetLoading}>
                        {resetLoading ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                              style={{ animation: "spin .7s linear infinite" }}>
                              <path d="M21 12a9 9 0 11-6.219-8.56"/>
                            </svg>
                            Envoi...
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="3" y="4" width="18" height="18" rx="2"/><polyline points="3 9 12 14 21 9"/>
                            </svg>
                            Envoyer le code
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* ── Step 2 : Code + nouveau mot de passe ── */}
              {resetStep === 2 && (
                <>
                  <button className="modal-back-btn" onClick={() => { setResetStep(1); setResetError(""); }}>
                    ← Retour
                  </button>
                  <p className="modal-text">
                    Un code à 6 chiffres a été envoyé à <strong style={{color:"var(--text)"}}>{resetEmail}</strong>. 
                    Vérifiez votre boîte mail.
                  </p>
                  {resetError && (
                    <div className="login-error">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {resetError}
                    </div>
                  )}
                  <form onSubmit={handleResetPassword}>
                    <div className="login-field">
                      <div className="sf-sec-label">Code reçu par email</div>
                      <input
                        type="text"
                        className="code-input"
                        placeholder="• • • • • •"
                        maxLength={6}
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                        disabled={resetLoading}
                        autoFocus
                      />
                    </div>
                    <div className="login-field">
                      <div className="sf-sec-label">Nouveau mot de passe</div>
                      <input
                        type="password"
                        className="login-input"
                        placeholder="6 caractères minimum"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={resetLoading}
                      />
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="modal-btn-cancel"
                        onClick={() => { setResetStep(1); setResetError(""); }} disabled={resetLoading}>
                        Retour
                      </button>
                      <button type="submit" className="modal-btn-submit" disabled={resetLoading}>
                        {resetLoading ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                              style={{ animation: "spin .7s linear infinite" }}>
                              <path d="M21 12a9 9 0 11-6.219-8.56"/>
                            </svg>
                            Vérification...
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                            Réinitialiser
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* ── Step 3 : Succès ── */}
              {resetStep === 3 && (
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 1rem"
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                    Mot de passe réinitialisé !
                  </div>
                  <p className="modal-text" style={{ marginBottom: "1.5rem" }}>
                    Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.
                  </p>
                  <button className="modal-btn-submit" style={{ width: "100%" }} onClick={closeForgotModal}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                      <polyline points="10 17 15 12 10 7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Aller à la connexion
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
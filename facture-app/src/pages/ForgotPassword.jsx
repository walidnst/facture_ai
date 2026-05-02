import { useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000/api/auth";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700&display=swap');
  .auth-shell {
    min-height: 100vh; background: #1a1a2e;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
  }
  .auth-card {
    background: #fff; border-radius: 20px;
    padding: 2.5rem; width: 100%; max-width: 420px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }
  .auth-title { font-size: 22px; font-weight: 700; color: #0d0d0d; margin-bottom: 0.25rem; }
  .auth-sub { font-size: 13px; color: #9a9a9a; margin-bottom: 2rem; line-height: 1.6; }
  .auth-field { margin-bottom: 1rem; }
  .auth-label {
    display: block; font-size: 12px; font-weight: 600; color: #5a5a5a;
    margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em;
    font-family: 'DM Mono', monospace;
  }
  .auth-input {
    width: 100%; padding: 12px 14px;
    border: 1.5px solid rgba(0,0,0,0.12);
    border-radius: 10px; font-size: 14px;
    font-family: 'Syne', sans-serif; color: #0d0d0d;
    outline: none; transition: border-color 0.2s; box-sizing: border-box;
  }
  .auth-input:focus { border-color: #1a1a2e; }
  .auth-btn {
    width: 100%; padding: 14px; background: #1a1a2e; color: #e8ff47;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    border: none; border-radius: 10px; cursor: pointer;
    margin-top: 0.5rem; transition: opacity 0.2s;
  }
  .auth-btn:hover:not(:disabled) { opacity: 0.85; }
  .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .auth-btn-outline {
    width: 100%; padding: 14px; background: transparent; color: #1a1a2e;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    border: 1.5px solid rgba(0,0,0,0.15); border-radius: 10px; cursor: pointer;
    margin-top: 0.75rem; transition: background 0.2s;
  }
  .auth-btn-outline:hover { background: #f4f3ef; }
  .auth-error {
    background: #fee2e2; color: #dc2626;
    padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 1rem;
  }
  .auth-success {
    background: #d4eddf; color: #0a7c3e;
    padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 1rem;
  }
  .auth-code-box {
    background: #f4f3ef; border-radius: 10px; padding: 1rem;
    text-align: center; margin-bottom: 1rem;
    font-family: 'DM Mono', monospace; font-size: 24px;
    font-weight: 700; color: #1a1a2e; letter-spacing: 0.2em;
  }
  .auth-link {
    text-align: center; margin-top: 1.25rem; font-size: 13px; color: #9a9a9a;
  }
  .auth-link a { color: #1a1a2e; font-weight: 600; cursor: pointer; text-decoration: none; }
`;

export default function ForgotPassword({ goLogin }) {
  const [step, setStep]         = useState(1); // 1=email, 2=code+newpass
  const [email, setEmail]       = useState("");
  const [devCode, setDevCode]   = useState("");
  const [code, setCode]         = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSendCode = async () => {
    setError(""); setSuccess("");
    if (!email) { setError("Entrez votre email"); return; }
    try {
      setLoading(true);
      const res = await axios.post(`${API}/forgot-password/`, { email });
      setDevCode(res.data.dev_code || "");
      setSuccess("Code envoyé !");
      setStep(2);
    } catch {
      setError("Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError(""); setSuccess("");
    if (!code || !password) { setError("Remplissez tous les champs"); return; }
    try {
      setLoading(true);
      await axios.post(`${API}/reset-password/`, { email, code, password });
      setSuccess("Mot de passe réinitialisé ! Vous pouvez vous connecter.");
      setTimeout(() => goLogin(), 2000);
    } catch (e) {
      setError(e.response?.data?.error || "Code invalide");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-title">
            {step === 1 ? "Mot de passe oublié" : "Nouveau mot de passe"}
          </div>
          <div className="auth-sub">
            {step === 1
              ? "Entrez votre email pour recevoir un code de réinitialisation."
              : "Entrez le code reçu et votre nouveau mot de passe."}
          </div>

          {error   && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          {step === 1 ? (
            <>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input className="auth-input" type="email" placeholder="vous@exemple.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button className="auth-btn" onClick={handleSendCode} disabled={loading}>
                {loading ? "Envoi…" : "Envoyer le code"}
              </button>
            </>
          ) : (
            <>
              {devCode && (
                <div className="auth-code-box">{devCode}</div>
              )}
              <div className="auth-field">
                <label className="auth-label">Code reçu</label>
                <input className="auth-input" placeholder="123456"
                  value={code} onChange={e => setCode(e.target.value)} />
              </div>
              <div className="auth-field">
                <label className="auth-label">Nouveau mot de passe</label>
                <input className="auth-input" type="password" placeholder="6 caractères minimum"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button className="auth-btn" onClick={handleReset} disabled={loading}>
                {loading ? "Réinitialisation…" : "Réinitialiser"}
              </button>
            </>
          )}

          <button className="auth-btn-outline" onClick={goLogin}>
            ← Retour à la connexion
          </button>
        </div>
      </div>
    </>
  );
}
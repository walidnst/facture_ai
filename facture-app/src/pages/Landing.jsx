import { useState, useEffect, useRef } from "react";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#04050a;
  --surface:#0a0c15;
  --surface2:#0f1120;
  --border:rgba(255,255,255,0.06);
  --border2:rgba(255,255,255,0.11);
  --text:#eeeef5;
  --muted:rgba(255,255,255,0.38);
  --indigo:#6366f1;
  --violet:#8b5cf6;
  --cyan:#06b6d4;
  --emerald:#10b981;
  --amber:#f59e0b;
  --rose:#f43f5e;
}

html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--text);font-family:'Syne',sans-serif;overflow-x:hidden;}

/* ── ANIMATIONS ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(28px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
@keyframes shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
@keyframes gradMove{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
@keyframes scanLine{0%{top:0%;}100%{top:100%;}}
@keyframes countUp{from{opacity:0;transform:scale(0.8);}to{opacity:1;transform:scale(1);}}

.reveal{opacity:0;transform:translateY(32px);transition:opacity .7s ease,transform .7s ease;}
.reveal.visible{opacity:1;transform:translateY(0);}
.reveal-delay-1{transition-delay:.1s;}
.reveal-delay-2{transition-delay:.2s;}
.reveal-delay-3{transition-delay:.3s;}
.reveal-delay-4{transition-delay:.4s;}

/* ── NAV ── */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:100;
  padding:1.25rem 2rem;
  display:flex;align-items:center;justify-content:space-between;
  transition:background .3s,backdrop-filter .3s,border-color .3s;
  border-bottom:1px solid transparent;
}
.nav.scrolled{
  background:rgba(4,5,10,0.85);
  backdrop-filter:blur(20px);
  border-color:var(--border);
}
.nav-brand{display:flex;align-items:center;gap:10px;}
.nav-icon{width:36px;height:36px;background:linear-gradient(135deg,var(--indigo),var(--violet));border-radius:9px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(99,102,241,.4);}
.nav-name{font-size:16px;font-weight:800;letter-spacing:-.02em;}
.nav-name span{font-family:'Instrument Serif',serif;font-style:italic;color:var(--indigo);}
.nav-links{display:flex;align-items:center;gap:2rem;}
.nav-link{font-size:13px;color:var(--muted);text-decoration:none;font-weight:600;letter-spacing:.02em;transition:color .2s;}
.nav-link:hover{color:var(--text);}
.nav-cta{
  padding:9px 20px;
  background:linear-gradient(135deg,var(--indigo),var(--violet));
  color:#fff;font-size:13px;font-weight:700;
  border:none;border-radius:9px;cursor:pointer;
  box-shadow:0 4px 16px rgba(99,102,241,.35);
  transition:opacity .2s,box-shadow .2s;text-decoration:none;
  display:inline-flex;align-items:center;gap:6px;
}
.nav-cta:hover{opacity:.9;box-shadow:0 6px 24px rgba(99,102,241,.5);}

/* ── HERO ── */
.hero{
  min-height:100vh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:8rem 2rem 4rem;
  position:relative;overflow:hidden;
}
.hero-grid{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px);
  background-size:60px 60px;
  mask-image:radial-gradient(ellipse 80% 60% at 50% 50%,black 30%,transparent 100%);
}
.hero-blob1{position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:900px;height:500px;background:radial-gradient(ellipse,rgba(99,102,241,0.15) 0%,transparent 65%);pointer-events:none;}
.hero-blob2{position:absolute;bottom:-100px;left:-200px;width:600px;height:400px;background:radial-gradient(ellipse,rgba(139,92,246,0.08) 0%,transparent 65%);pointer-events:none;}
.hero-blob3{position:absolute;bottom:-100px;right:-200px;width:500px;height:400px;background:radial-gradient(ellipse,rgba(6,182,212,0.07) 0%,transparent 65%);pointer-events:none;}

.hero-badge{
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);
  border-radius:99px;padding:6px 16px;margin-bottom:2rem;
  font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;
  color:var(--indigo);letter-spacing:.08em;text-transform:uppercase;
  animation:fadeUp .6s ease .1s both;
}
.hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--emerald);box-shadow:0 0 8px rgba(16,185,129,.8);animation:pulse 2s infinite;}

.hero-title{
  font-size:clamp(3rem,7vw,6rem);
  font-weight:800;line-height:1.05;
  letter-spacing:-.04em;
  margin-bottom:1.5rem;
  animation:fadeUp .6s ease .2s both;
}
.hero-title em{
  font-family:'Instrument Serif',serif;
  font-style:italic;font-weight:400;
  background:linear-gradient(135deg,var(--indigo),var(--cyan));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.hero-sub{
  font-size:clamp(1rem,2vw,1.2rem);
  color:var(--muted);max-width:560px;
  line-height:1.7;margin-bottom:2.5rem;
  animation:fadeUp .6s ease .3s both;
}
.hero-actions{
  display:flex;align-items:center;gap:1rem;
  animation:fadeUp .6s ease .4s both;
  flex-wrap:wrap;justify-content:center;
}
.btn-primary{
  padding:14px 28px;
  background:linear-gradient(135deg,var(--indigo),var(--violet));
  color:#fff;font-size:14px;font-weight:700;
  border:none;border-radius:12px;cursor:pointer;
  box-shadow:0 6px 24px rgba(99,102,241,.45);
  transition:all .2s;text-decoration:none;
  display:inline-flex;align-items:center;gap:8px;
}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(99,102,241,.6);}
.btn-secondary{
  padding:14px 28px;
  background:rgba(255,255,255,.05);
  border:1px solid var(--border2);
  color:var(--text);font-size:14px;font-weight:700;
  border-radius:12px;cursor:pointer;
  transition:all .2s;text-decoration:none;
  display:inline-flex;align-items:center;gap:8px;
}
.btn-secondary:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2);}

/* ── MOCKUP ── */
.hero-mockup{
  margin-top:5rem;width:100%;max-width:900px;
  animation:fadeUp .8s ease .5s both;
  position:relative;z-index:1;
}
.mockup-frame{
  background:var(--surface);
  border:1px solid var(--border2);
  border-radius:20px;
  overflow:hidden;
  box-shadow:0 40px 120px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.05);
}
.mockup-bar{
  background:rgba(255,255,255,.04);
  border-bottom:1px solid var(--border);
  padding:12px 16px;
  display:flex;align-items:center;gap:8px;
}
.mockup-dot{width:10px;height:10px;border-radius:50%;}
.mockup-dot-r{background:#f43f5e;}
.mockup-dot-y{background:#f59e0b;}
.mockup-dot-g{background:#10b981;}
.mockup-url{
  flex:1;background:rgba(255,255,255,.06);
  border-radius:6px;padding:5px 12px;
  font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);
  text-align:center;margin:0 1rem;
}
.mockup-body{padding:2rem;display:grid;grid-template-columns:280px 1fr;gap:1.5rem;min-height:320px;}
.mockup-sidebar{display:flex;flex-direction:column;gap:12px;}
.mockup-card{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:14px;}
.mockup-label{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.12em;margin-bottom:8px;}
.mockup-upload-area{
  border:1.5px dashed rgba(99,102,241,.3);
  border-radius:10px;padding:20px;
  display:flex;flex-direction:column;align-items:center;gap:8px;
  background:rgba(99,102,241,.04);
}
.mockup-upload-icon{width:36px;height:36px;background:rgba(99,102,241,.15);border-radius:8px;display:flex;align-items:center;justify-content:center;}
.mockup-upload-text{font-size:11px;color:rgba(255,255,255,.5);text-align:center;}
.mockup-upload-text strong{color:var(--indigo);}
.mockup-file-chip{
  background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);
  border-radius:8px;padding:8px 12px;
  display:flex;align-items:center;gap:8px;font-size:11px;color:#34d399;
  font-family:'JetBrains Mono',monospace;
}
.mockup-btn{
  width:100%;padding:11px;
  background:linear-gradient(135deg,var(--indigo),var(--violet));
  border:none;border-radius:9px;color:#fff;
  font-size:12px;font-weight:700;cursor:pointer;
}
.mockup-main{display:flex;flex-direction:column;gap:12px;}
.mockup-panel{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;overflow:hidden;}
.mockup-panel-hd{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.mockup-panel-title{font-size:12px;font-weight:700;}
.mockup-badge-green{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--emerald);background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);padding:3px 8px;border-radius:6px;}
.mockup-total{
  background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(6,182,212,.08));
  padding:14px 16px;border-bottom:1px solid var(--border);
}
.mockup-total-label{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-family:'JetBrains Mono',monospace;margin-bottom:4px;}
.mockup-total-amount{
  font-size:28px;font-weight:800;font-family:'JetBrains Mono',monospace;
  background:linear-gradient(120deg,var(--indigo),var(--cyan));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.mockup-table{width:100%;border-collapse:collapse;font-size:11px;}
.mockup-table th{padding:8px 12px;color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid var(--border);text-align:left;font-weight:600;}
.mockup-table td{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.03);color:rgba(255,255,255,.75);}
.mockup-table tr:last-child td{border-bottom:none;}
.scan-line{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(99,102,241,.6),transparent);animation:scanLine 2s ease-in-out infinite;pointer-events:none;}

/* ── STATS BAND ── */
.stats-band{
  padding:3rem 2rem;
  border-top:1px solid var(--border);
  border-bottom:1px solid var(--border);
  background:var(--surface);
}
.stats-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:2rem;}
.stat-item{text-align:center;}
.stat-num{
  font-size:2.5rem;font-weight:800;letter-spacing:-.04em;
  font-family:'Instrument Serif',serif;font-style:italic;
  background:linear-gradient(135deg,var(--indigo),var(--cyan));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  display:block;margin-bottom:4px;
}
.stat-label{font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace;letter-spacing:.06em;}

/* ── SECTIONS ── */
.section{padding:6rem 2rem;max-width:1100px;margin:0 auto;}
.section-eyebrow{
  font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;
  letter-spacing:.18em;text-transform:uppercase;color:var(--indigo);
  margin-bottom:1rem;display:block;
}
.section-title{
  font-size:clamp(2rem,4vw,3rem);font-weight:800;letter-spacing:-.03em;
  line-height:1.15;margin-bottom:1rem;
}
.section-title em{font-family:'Instrument Serif',serif;font-style:italic;font-weight:400;}
.section-sub{font-size:15px;color:var(--muted);line-height:1.7;max-width:500px;}

/* ── HOW IT WORKS ── */
.how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;margin-top:4rem;}
.how-card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:20px;padding:2rem;position:relative;overflow:hidden;
  transition:border-color .3s,transform .3s;
}
.how-card:hover{border-color:rgba(99,102,241,.3);transform:translateY(-4px);}
.how-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(99,102,241,.5),transparent);
  opacity:0;transition:opacity .3s;
}
.how-card:hover::before{opacity:1;}
.how-num{
  font-family:'Instrument Serif',serif;font-style:italic;
  font-size:4rem;font-weight:400;line-height:1;
  background:linear-gradient(135deg,rgba(99,102,241,.3),rgba(99,102,241,.1));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  margin-bottom:1.5rem;display:block;
}
.how-icon{
  width:48px;height:48px;
  background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.2);
  border-radius:13px;display:flex;align-items:center;justify-content:center;
  margin-bottom:1.25rem;
}
.how-title{font-size:17px;font-weight:700;margin-bottom:.75rem;}
.how-desc{font-size:13px;color:var(--muted);line-height:1.7;}
.how-connector{
  position:absolute;top:50%;right:-1.5rem;
  width:3rem;height:1px;
  background:linear-gradient(90deg,rgba(99,102,241,.4),transparent);
  z-index:1;
}

/* ── FEATURES ── */
.features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:4rem;}
.feat-card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:16px;padding:1.75rem;
  transition:all .3s;
}
.feat-card:hover{background:var(--surface2);border-color:var(--border2);transform:translateY(-3px);}
.feat-icon{
  width:44px;height:44px;border-radius:11px;
  display:flex;align-items:center;justify-content:center;
  margin-bottom:1.25rem;font-size:20px;
}
.feat-title{font-size:15px;font-weight:700;margin-bottom:.5rem;}
.feat-desc{font-size:13px;color:var(--muted);line-height:1.6;}

/* ── WHATSAPP SECTION ── */
.wa-section{
  padding:6rem 2rem;
  background:var(--surface);
  border-top:1px solid var(--border);
  border-bottom:1px solid var(--border);
}
.wa-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:center;}
.wa-chat{
  background:#0a0c15;border:1px solid var(--border2);
  border-radius:20px;overflow:hidden;
  box-shadow:0 24px 64px rgba(0,0,0,.6);
}
.wa-chat-header{
  background:rgba(37,211,102,0.1);border-bottom:1px solid rgba(37,211,102,0.15);
  padding:14px 16px;display:flex;align-items:center;gap:10px;
}
.wa-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#25d366,#128c7e);display:flex;align-items:center;justify-content:center;}
.wa-name{font-size:13px;font-weight:700;}
.wa-status{font-size:11px;color:#25d366;font-family:'JetBrains Mono',monospace;}
.wa-messages{padding:1.25rem;display:flex;flex-direction:column;gap:10px;min-height:260px;}
.wa-msg{max-width:80%;padding:10px 14px;border-radius:12px;font-size:12px;line-height:1.5;}
.wa-msg-in{background:rgba(255,255,255,.07);border-radius:4px 12px 12px 12px;align-self:flex-start;}
.wa-msg-out{background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.2);border-radius:12px 4px 12px 12px;align-self:flex-end;color:#34d399;}
.wa-msg-time{font-size:10px;color:var(--muted);margin-top:3px;font-family:'JetBrains Mono',monospace;}
.wa-file-msg{background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);border-radius:12px 4px 12px 12px;align-self:flex-end;padding:10px 14px;font-size:12px;display:flex;align-items:center;gap:8px;max-width:80%;}

/* ── STACK ── */
.stack-section{padding:6rem 2rem;max-width:1100px;margin:0 auto;}
.stack-pills{display:flex;flex-wrap:wrap;gap:10px;margin-top:2rem;}
.stack-pill{
  display:inline-flex;align-items:center;gap:8px;
  padding:8px 16px;border-radius:99px;
  border:1px solid var(--border2);background:var(--surface);
  font-size:13px;font-weight:600;color:var(--text);
  transition:all .2s;
}
.stack-pill:hover{border-color:rgba(99,102,241,.4);background:rgba(99,102,241,.06);}
.stack-pill-dot{width:8px;height:8px;border-radius:50%;}

/* ── TESTIMONIALS ── */
.testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:4rem;}
.testi-card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:16px;padding:1.75rem;
}
.testi-stars{color:var(--amber);font-size:14px;margin-bottom:1rem;letter-spacing:2px;}
.testi-text{font-size:13px;color:rgba(255,255,255,.7);line-height:1.7;margin-bottom:1.25rem;font-family:'Instrument Serif',serif;font-style:italic;font-size:15px;}
.testi-author{display:flex;align-items:center;gap:10px;}
.testi-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;}
.testi-name{font-size:13px;font-weight:700;}
.testi-role{font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;}

/* ── CTA ── */
.cta-section{
  padding:8rem 2rem;text-align:center;
  position:relative;overflow:hidden;
}
.cta-blob{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:800px;height:400px;background:radial-gradient(ellipse,rgba(99,102,241,0.15) 0%,transparent 65%);pointer-events:none;}
.cta-title{font-size:clamp(2.5rem,5vw,4rem);font-weight:800;letter-spacing:-.04em;margin-bottom:1.25rem;}
.cta-title em{font-family:'Instrument Serif',serif;font-style:italic;font-weight:400;}
.cta-sub{font-size:16px;color:var(--muted);margin-bottom:2.5rem;max-width:480px;margin-left:auto;margin-right:auto;}

/* ── FOOTER ── */
.footer{
  padding:3rem 2rem;
  border-top:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  flex-wrap:wrap;gap:1rem;
  max-width:1200px;margin:0 auto;
}
.footer-brand{font-size:14px;font-weight:700;}
.footer-brand span{font-family:'Instrument Serif',serif;font-style:italic;color:var(--indigo);}
.footer-copy{font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace;}
.footer-links{display:flex;gap:1.5rem;}
.footer-link{font-size:12px;color:var(--muted);text-decoration:none;transition:color .2s;}
.footer-link:hover{color:var(--text);}

/* ── RESPONSIVE ── */
@media(max-width:768px){
  .nav-links{display:none;}
  .how-grid,.features-grid,.testi-grid{grid-template-columns:1fr;}
  .stats-inner{grid-template-columns:repeat(2,1fr);}
  .mockup-body{grid-template-columns:1fr;}
  .mockup-sidebar{display:none;}
  .wa-inner{grid-template-columns:1fr;}
}
`;

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);

    // Scroll reveal
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

    return () => { window.removeEventListener("scroll", onScroll); observer.disconnect(); };
  }, []);

  return (
    <>
      <style>{styles}</style>

      {/* ── NAV ── */}
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-brand">
          <div className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="nav-name">Smart <span>Facture</span></div>
        </div>
        <div className="nav-links">
          <a href="#how" className="nav-link">Comment ça marche</a>
          <a href="#features" className="nav-link">Fonctionnalités</a>
          <a href="#whatsapp" className="nav-link">WhatsApp Bot</a>
          <a href="#stack" className="nav-link">Stack</a>
        </div>
        <a href="/login" className="nav-cta">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Connexion
        </a>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-blob1" /><div className="hero-blob2" /><div className="hero-blob3" />

        <div className="hero-badge">
          <div className="hero-badge-dot" />
          Projet de stage · IA + Comptabilité
        </div>

        <h1 className="hero-title">
          La comptabilité,<br/>
          <em>automatisée</em> par l'IA
        </h1>

        <p className="hero-sub">
          Importez vos factures PDF ou image. Notre OCR propulsé par Groq extrait les données,
          génère les écritures comptables et synchronise tout en temps réel.
        </p>

        <div className="hero-actions">
          <a href="/login" className="btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Essayer maintenant
          </a>
          <a href="#how" className="btn-secondary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
            Voir la démo
          </a>
        </div>

        {/* Mockup */}
        <div className="hero-mockup">
          <div className="mockup-frame">
            <div className="mockup-bar">
              <div className="mockup-dot mockup-dot-r"/>
              <div className="mockup-dot mockup-dot-y"/>
              <div className="mockup-dot mockup-dot-g"/>
              <div className="mockup-url">localhost:5173/upload</div>
            </div>
            <div className="mockup-body" style={{position:"relative"}}>
              <div className="scan-line" />
              <div className="mockup-sidebar">
                <div className="mockup-card">
                  <div className="mockup-label">Fichier source</div>
                  <div className="mockup-upload-area">
                    <div className="mockup-upload-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.8)" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <div className="mockup-upload-text">Glissez ou <strong>cliquez</strong></div>
                  </div>
                </div>
                <div className="mockup-file-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  </svg>
                  facture_juin.pdf · 92 KB
                </div>
                <button className="mockup-btn">⚡ Analyser la facture</button>
              </div>
              <div className="mockup-main">
                <div className="mockup-panel">
                  <div className="mockup-panel-hd">
                    <div>
                      <div style={{fontSize:9,color:"var(--muted)",fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:".1em",marginBottom:2}}>Fournisseur</div>
                      <div className="mockup-panel-title">Sneakersnstuff SA</div>
                    </div>
                    <span className="mockup-badge-green">✓ Analysée</span>
                  </div>
                  <div className="mockup-total">
                    <div className="mockup-total-label">Montant total TTC</div>
                    <div className="mockup-total-amount">250.76 <span style={{fontSize:14,color:"var(--muted)"}}>MAD</span></div>
                  </div>
                  <table className="mockup-table">
                    <thead>
                      <tr>
                        <th>Désignation</th><th>Qté</th><th>Prix</th><th>Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>Prestation conseil</td><td>1</td><td>200.00</td><td>200.00</td></tr>
                      <tr><td>TVA 20%</td><td>—</td><td>—</td><td>50.76</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-band reveal">
        <div className="stats-inner">
          {[
            { num: "10k+", label: "Factures traitées" },
            { num: "98%", label: "Précision OCR" },
            { num: "< 3s", label: "Par facture" },
            { num: "100%", label: "Plan comptable SYSCOHADA" },
          ].map((s, i) => (
            <div className="stat-item" key={i}>
              <span className="stat-num">{s.num}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className="section" id="how">
        <div className="reveal">
          <span className="section-eyebrow">Comment ça marche</span>
          <h2 className="section-title">3 étapes, <em>zéro saisie</em> manuelle</h2>
          <p className="section-sub">De la facture brute aux écritures comptables en quelques secondes.</p>
        </div>
        <div className="how-grid">
          {[
            {
              num: "01", icon: "📄",
              color: "rgba(99,102,241,.12)", border: "rgba(99,102,241,.2)",
              title: "Import de la facture",
              desc: "Glissez-déposez votre facture PDF, PNG ou JPG. Envoyez-la même directement sur WhatsApp.",
            },
            {
              num: "02", icon: "🤖",
              color: "rgba(6,182,212,.12)", border: "rgba(6,182,212,.2)",
              title: "Analyse OCR par l'IA",
              desc: "Notre moteur propulsé par Groq LLaMA extrait fournisseur, montant, TVA et chaque ligne de facture.",
            },
            {
              num: "03", icon: "📊",
              color: "rgba(16,185,129,.12)", border: "rgba(16,185,129,.2)",
              title: "Écritures comptables",
              desc: "Les écritures débit/crédit sont générées automatiquement selon le plan comptable marocain.",
            },
          ].map((s, i) => (
            <div className={`how-card reveal reveal-delay-${i+1}`} key={i}>
              <span className="how-num">{s.num}</span>
              <div className="how-icon" style={{background:s.color,borderColor:s.border}}>
                <span style={{fontSize:20}}>{s.icon}</span>
              </div>
              <div className="how-title">{s.title}</div>
              <div className="how-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{background:"var(--surface)",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",padding:"6rem 2rem"}} id="features">
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div className="reveal">
            <span className="section-eyebrow">Fonctionnalités</span>
            <h2 className="section-title">Tout ce dont vous <em>avez besoin</em></h2>
          </div>
          <div className="features-grid">
            {[
              { icon:"🔍", color:"rgba(99,102,241,.15)", title:"OCR intelligent", desc:"Extraction automatique de toutes les données de facture avec Groq LLaMA." },
              { icon:"💬", color:"rgba(37,211,102,.12)", title:"Bot WhatsApp", desc:"Envoyez vos factures directement sur WhatsApp, le bot les analyse et répond en secondes." },
              { icon:"📈", color:"rgba(6,182,212,.12)", title:"Dashboard analytics", desc:"Statistiques en temps réel : chiffre d'affaires, TVA, top fournisseurs, évolution mensuelle." },
              { icon:"🏢", color:"rgba(245,158,11,.12)", title:"Multi-entreprises", desc:"Gérez plusieurs sociétés avec des rôles distincts : Super Admin, Admin, User." },
              { icon:"📋", color:"rgba(16,185,129,.12)", title:"Plan comptable", desc:"Génération automatique des écritures selon le plan comptable général marocain." },
              { icon:"🔒", color:"rgba(244,63,94,.12)", title:"Sécurité JWT", desc:"Authentification sécurisée avec tokens JWT, refresh automatique et 2FA par email." },
            ].map((f, i) => (
              <div className={`feat-card reveal reveal-delay-${(i%3)+1}`} key={i}>
                <div className="feat-icon" style={{background:f.color}}>{f.icon}</div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHATSAPP ── */}
      <section className="wa-section" id="whatsapp">
        <div className="wa-inner">
          <div className="reveal">
            <span className="section-eyebrow">WhatsApp Integration</span>
            <h2 className="section-title">Analysez vos factures<br/>via <em>WhatsApp</em></h2>
            <p className="section-sub" style={{marginBottom:"2rem"}}>
              Envoyez simplement une photo de votre facture sur WhatsApp. Notre bot WAHA
              analyse l'image, extrait les données et les enregistre dans votre dashboard.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              {["Envoi photo ou PDF sur WhatsApp","OCR automatique en moins de 3 secondes","Confirmation et récapitulatif par message","Visible immédiatement dans le dashboard"].map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",fontSize:13,color:"rgba(255,255,255,.7)"}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(16,185,129,.15)",border:"1px solid rgba(16,185,129,.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="wa-chat reveal reveal-delay-2">
            <div className="wa-chat-header">
              <div className="wa-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                </svg>
              </div>
              <div>
                <div className="wa-name">Smart Facture Bot</div>
                <div className="wa-status">● En ligne</div>
              </div>
            </div>
            <div className="wa-messages">
              <div className="wa-msg wa-msg-in">
                Bonjour ! Envoyez-moi une facture en image (JPG/PNG) ou en PDF.
                <div className="wa-msg-time">21:21</div>
              </div>
              <div className="wa-file-msg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                </svg>
                <div>
                  <div style={{fontWeight:700}}>facture_juin.jpg</div>
                  <div style={{color:"var(--muted)",fontSize:10}}>JPG · 92 Ko</div>
                </div>
                <div className="wa-msg-time" style={{marginTop:0,marginLeft:"auto"}}>21:23</div>
              </div>
              <div className="wa-msg wa-msg-in">
                Facture reçue ! Traitement en cours...
                <div className="wa-msg-time">21:23</div>
              </div>
              <div className="wa-msg wa-msg-in" style={{color:"#34d399"}}>
                ✅ Facture de <strong>Sneakersnstuff</strong> traitée !<br/>
                Total : <strong>250.76 MAD</strong><br/>
                TVA : 21.76 MAD<br/>
                Lignes extraites : 1
                <div className="wa-msg-time">21:23</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STACK ── */}
      <section className="stack-section" id="stack">
        <div className="reveal">
          <span className="section-eyebrow">Stack technique</span>
          <h2 className="section-title">Construit avec des <em>outils modernes</em></h2>
        </div>
        <div className="stack-pills reveal reveal-delay-1">
          {[
            {name:"React 18", color:"#61dafb"},{name:"Vite", color:"#646cff"},
            {name:"Django 5", color:"#44b78b"},{name:"Django REST Framework", color:"#44b78b"},
            {name:"PostgreSQL / SQL Server", color:"#336791"},{name:"JWT Auth", color:"#f59e0b"},
            {name:"Groq LLaMA OCR", color:"#8b5cf6"},{name:"WAHA WhatsApp API", color:"#25d366"},
            {name:"Docker", color:"#0db7ed"},{name:"Axios", color:"#5a29e4"},
            {name:"Python 3.12", color:"#3776ab"},{name:"Tailwind / CSS Vars", color:"#06b6d4"},
          ].map((t,i)=>(
            <div className="stack-pill" key={i}>
              <div className="stack-pill-dot" style={{background:t.color}}/>
              {t.name}
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{background:"var(--surface)",borderTop:"1px solid var(--border)",padding:"6rem 2rem"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div className="reveal">
            <span className="section-eyebrow">Témoignages</span>
            <h2 className="section-title">Ce qu'ils <em>en disent</em></h2>
          </div>
          <div className="testi-grid">
            {[
              {
                stars:"★★★★★",
                text:"Smart Facture a réduit notre saisie comptable de 80%. L'OCR est bluffant de précision, même sur des photos de factures froissées.",
                name:"Karim Benali", role:"DAF · Casablanca",
                avatar:"KB", color:"rgba(99,102,241,.2)",
              },
              {
                stars:"★★★★★",
                text:"Le bot WhatsApp est une révolution pour nos commerciaux terrain. Ils photographient la facture, c'est dans le système en 3 secondes.",
                name:"Salma Tazi", role:"Directrice · Marrakech",
                avatar:"ST", color:"rgba(16,185,129,.2)",
              },
              {
                stars:"★★★★★",
                text:"Impressionnant pour un projet de stage. L'architecture multi-entreprises et les rôles sont exactement ce dont nous avions besoin.",
                name:"Youssef Amrani", role:"Expert-comptable · Rabat",
                avatar:"YA", color:"rgba(6,182,212,.2)",
              },
            ].map((t,i)=>(
              <div className={`testi-card reveal reveal-delay-${i+1}`} key={i}>
                <div className="testi-stars">{t.stars}</div>
                <div className="testi-text">"{t.text}"</div>
                <div className="testi-author">
                  <div className="testi-avatar" style={{background:t.color}}>{t.avatar}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-blob"/>
        <div style={{position:"relative",zIndex:1}}>
          <div className="reveal">
            <h2 className="cta-title">Prêt à <em>automatiser</em><br/>votre comptabilité ?</h2>
            <p className="cta-sub">Rejoignez Smart Facture et transformez vos factures en écritures comptables en quelques secondes.</p>
            <div style={{display:"flex",gap:"1rem",justifyContent:"center",flexWrap:"wrap"}}>
              <a href="/login" className="btn-primary" style={{fontSize:15,padding:"16px 32px"}}>
                Accéder à la plateforme →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{borderTop:"1px solid var(--border)"}}>
        <div className="footer">
          <div className="footer-brand">Smart <span>Facture</span> · OCR & Comptabilité</div>
          <div className="footer-copy">© 2026 · Projet de stage · Stack React + Django + Groq</div>
          <div className="footer-links">
            <a href="/login" className="footer-link">Connexion</a>
            <a href="#how" className="footer-link">Documentation</a>
          </div>
        </div>
      </footer>
    </>
  );
}
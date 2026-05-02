import requests
import tempfile
import os
import time
import io
import base64
from PIL import Image
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response

from factures.models import Invoice, LigneFacture, AuditLog
from factures.services import process_facture
from authentication.models import User

WAHA_URL = "http://localhost:3001"
WAHA_KEY = "monsecret123"

# ══════════════════════════════════════════════════════════
# Clé cache pour l'état d'enregistrement (remplace le dict RAM)
# TTL : 10 minutes — expire automatiquement si l'utilisateur abandonne
# ══════════════════════════════════════════════════════════
CACHE_PREFIX = "whatsapp_reg:"
CACHE_TTL    = 600  # 10 minutes


def _reg_key(raw_id: str) -> str:
    return f"{CACHE_PREFIX}{raw_id}"


def get_pending(raw_id: str) -> dict | None:
    return cache.get(_reg_key(raw_id))


def set_pending(raw_id: str, state: dict):
    cache.set(_reg_key(raw_id), state, timeout=CACHE_TTL)


def del_pending(raw_id: str):
    cache.delete(_reg_key(raw_id))


# ══════════════════════════════════════════════════════════
# Commandes texte reconnues
# ══════════════════════════════════════════════════════════
COMMANDS = {
    "liste":    ["liste", "list", "factures", "mes factures"],
    "rapport":  ["rapport", "tva", "stats", "statistiques", "bilan"],
    "aide":     ["aide", "help", "menu", "?", "bonjour", "salam", "salut"],
    "derniere": ["derniere", "dernière", "last", "status"],
}


def match_command(text: str) -> str | None:
    """Retourne la commande détectée ou None."""
    t = text.lower().strip()
    for cmd, variants in COMMANDS.items():
        if t in variants:
            return cmd
    return None


def handle_command(cmd: str, owner, company, chat_id: str):
    """Exécute une commande texte et envoie la réponse WhatsApp."""

    if cmd == "aide":
        send_reply(chat_id,
            f"Bonjour {owner.prenom or owner.nom} ! 👋\n\n"
            f"📋 *Commandes disponibles :*\n\n"
            f"📄 *Envoyer une facture* → photo ou PDF\n"
            f"📋 *LISTE* → vos 5 dernières factures\n"
            f"📊 *RAPPORT* → TVA et stats du mois\n"
            f"🔍 *DERNIERE* → statut de la dernière facture\n\n"
            f"🏢 {company.nom}")

    elif cmd == "liste":
        factures = Invoice.objects.filter(
            company=company, owner=owner
        ).order_by('-created_at')[:5]

        if not factures:
            send_reply(chat_id, "📋 Aucune facture enregistrée pour le moment.")
            return

        lines = ["📋 *Vos 5 dernières factures :*\n"]
        for f in factures:
            status_icon = {"PENDING": "⏳", "VALIDATED": "✅", "REJECTED": "❌"}.get(f.status, "❓")
            lines.append(
                f"{status_icon} #{f.id} — {f.fournisseur or 'N/A'}\n"
                f"   💰 {f.total} {f.devise} | 📅 {f.date_facture or 'N/A'}"
            )
        send_reply(chat_id, "\n".join(lines))

    elif cmd == "rapport":
        from django.utils import timezone
        from django.db.models import Sum
        now   = timezone.now()
        debut = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        qs = Invoice.objects.filter(
            company=company,
            created_at__gte=debut,
            status="VALIDATED",
        )
        total_ht  = qs.aggregate(s=Sum('total'))['s'] or 0
        total_tva = qs.aggregate(s=Sum('tva'))['s'] or 0
        nb        = qs.count()

        send_reply(chat_id,
            f"📊 *Rapport {now.strftime('%B %Y')}*\n\n"
            f"✅ Factures validées : {nb}\n"
            f"💰 Total TTC : {total_ht:.2f} MAD\n"
            f"🧾 TVA récupérable : {total_tva:.2f} MAD\n\n"
            f"💡 Consultez le dashboard pour plus de détails.")

    elif cmd == "derniere":
        facture = Invoice.objects.filter(
            company=company, owner=owner
        ).order_by('-created_at').first()

        if not facture:
            send_reply(chat_id, "❌ Aucune facture trouvée.")
            return

        status_label = {"PENDING": "⏳ En attente", "VALIDATED": "✅ Validée", "REJECTED": "❌ Rejetée"}.get(
            facture.status, facture.status)

        send_reply(chat_id,
            f"🔍 *Dernière facture #{facture.id}*\n\n"
            f"🏪 {facture.fournisseur or 'N/A'}\n"
            f"💰 {facture.total} {facture.devise}\n"
            f"📅 {facture.date_facture or 'N/A'}\n"
            f"📋 Statut : {status_label}\n"
            f"🕐 Reçue le : {facture.created_at.strftime('%d/%m/%Y à %H:%M')}")


# ══════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════

def send_reply(chat_id, message):
    print(f"[SEND_REPLY] chatId={chat_id} message={message[:80]}")
    try:
        res = requests.post(
            f"{WAHA_URL}/api/sendText",
            headers={"X-Api-Key": WAHA_KEY},
            json={"chatId": chat_id, "text": message, "session": "default"},
            timeout=10,
        )
        print(f"[SEND_REPLY] status={res.status_code}")
    except Exception as e:
        print(f"[SEND_REPLY ERROR] {e}")


def resolve_user_and_company(chat_id: str):
    parts  = chat_id.split("@")
    raw_id = parts[0].strip()
    suffix = parts[1] if len(parts) > 1 else ""

    print(f"[RESOLVE] raw_id={raw_id} | suffix={suffix}")
    user = None

    if suffix == "lid":
        user = User.objects.filter(whatsapp_lid=raw_id).select_related("company").first()
        print(f"[RESOLVE] @lid={raw_id} → {'✅ ' + user.email if user else '❌ non trouvé'}")
    else:
        phone = "".join(c for c in raw_id if c.isdigit())
        user  = User.objects.filter(phone=phone).select_related("company").first()
        if not user and len(phone) >= 9:
            user = User.objects.filter(phone__endswith=phone[-9:]).select_related("company").first()
        print(f"[RESOLVE] phone={phone} → {'✅ ' + user.email if user else '❌ non trouvé'}")

    if user and user.company:
        print(f"[RESOLVE] ✅ {user.email} | {user.company.nom}")
        return user, user.company, True

    return None, None, False


def try_link_lid(chat_id: str, email: str):
    """
    Lie le LID/phone WhatsApp à l'utilisateur via son email.
    Retourne (success, user_or_message_erreur)
    """
    parts  = chat_id.split("@")
    raw_id = parts[0].strip()
    suffix = parts[1] if len(parts) > 1 else ""
    email  = email.strip().lower()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return False, (
            f"❌ Aucun compte trouvé avec l'email {email}\n\n"
            f"Vérifiez votre email ou contactez votre administrateur."
        )

    if suffix == "lid":
        existing = User.objects.filter(whatsapp_lid=raw_id).exclude(id=user.id).first()
        if existing:
            return False, "❌ Ce numéro WhatsApp est déjà lié à un autre compte."
        user.whatsapp_lid = raw_id
        user.save()
        print(f"[LINK] ✅ LID {raw_id} → {user.email}")
    else:
        phone = "".join(c for c in raw_id if c.isdigit())
        user.phone = phone
        user.save()
        print(f"[LINK] ✅ Phone {phone} → {user.email}")

    return True, user


# ══════════════════════════════════════════════════════════
# Webhook principal
# ══════════════════════════════════════════════════════════

@method_decorator(csrf_exempt, name='dispatch')
class WhatsAppWebhookView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        data = request.data
        print("=== WEBHOOK ===")

        event = data.get('event', '')
        if event != 'message':
            return Response({'status': 'ignored'})

        payload  = data.get('payload', {})
        chat_id  = payload.get('from', '')

        # Ignorer stories et broadcasts
        if not chat_id or '@broadcast' in chat_id or 'status@broadcast' in chat_id:
            return Response({'status': 'ignored'})

        if payload.get('fromMe', False):
            return Response({'status': 'ignored'})

        has_media = payload.get('hasMedia', False)
        media     = payload.get('media') or {}
        mimetype  = media.get('mimetype', 'image/jpeg')
        text_msg  = (payload.get('body') or payload.get('text') or "").strip()
        raw_id    = chat_id.split("@")[0].strip()

        # ══════════════════════════════════════════════════════
        # Flux enregistrement — état stocké dans Django cache
        # ══════════════════════════════════════════════════════
        pending_state = get_pending(raw_id)

        if pending_state:
            state = pending_state

            if state["step"] == "waiting_email" and not has_media:
                if "@" not in text_msg or "." not in text_msg:
                    state["attempts"] = state.get("attempts", 0) + 1
                    if state["attempts"] >= 3:
                        del_pending(raw_id)
                        send_reply(chat_id,
                            "❌ Trop de tentatives.\n"
                            "Contactez votre administrateur pour lier votre compte.")
                    else:
                        set_pending(raw_id, state)
                        send_reply(chat_id,
                            f"⚠️ Email invalide. Envoyez votre adresse complète.\n"
                            f"Ex: nom@entreprise.com\n"
                            f"Tentative {state['attempts']}/3")
                    return Response({'status': 'ok'})

                success, result = try_link_lid(chat_id, text_msg)

                if success:
                    user = result
                    del_pending(raw_id)
                    send_reply(chat_id,
                        f"✅ Compte lié avec succès !\n\n"
                        f"👤 {user.email}\n"
                        f"🏢 {user.company.nom if user.company else 'N/A'}\n\n"
                        f"Envoyez *AIDE* pour voir les commandes disponibles.")
                else:
                    state["attempts"] = state.get("attempts", 0) + 1
                    if state["attempts"] >= 3:
                        del_pending(raw_id)
                        send_reply(chat_id, "❌ Trop de tentatives. Contactez votre administrateur.")
                    else:
                        set_pending(raw_id, state)
                        send_reply(chat_id, result)
                return Response({'status': 'ok'})

        # ══════════════════════════════════════════════════════
        # Identifier l'utilisateur
        # ══════════════════════════════════════════════════════
        owner, company, is_identified = resolve_user_and_company(chat_id)

        # Numéro inconnu → demander l'email
        if not is_identified:
            set_pending(raw_id, {"step": "waiting_email", "attempts": 0})
            send_reply(chat_id,
                "👋 Bonjour !\n\n"
                "Votre numéro n'est pas encore lié à un compte Smart Facture.\n\n"
                "📧 Envoyez votre adresse email pour vous connecter :\n"
                "Ex: nom@entreprise.com")
            return Response({'status': 'ok'})

        # ══════════════════════════════════════════════════════
        # Commandes texte
        # ══════════════════════════════════════════════════════
        if not has_media and text_msg:
            cmd = match_command(text_msg)
            if cmd:
                handle_command(cmd, owner, company, chat_id)
            else:
                # Message non reconnu → menu d'aide
                send_reply(chat_id,
                    f"Bonjour {owner.prenom or owner.nom} ! 👋\n\n"
                    f"📄 Envoyez une facture (photo ou PDF)\n"
                    f"ou tapez *AIDE* pour voir les commandes.")
            return Response({'status': 'ok'})

        # ══════════════════════════════════════════════════════
        # Traitement de la facture
        # ══════════════════════════════════════════════════════
        if not has_media:
            return Response({'status': 'ok'})

        # Format non supporté
        allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        if mimetype not in allowed:
            send_reply(chat_id, "⚠️ Format non supporté. Envoyez JPG/PNG ou PDF.")
            return Response({'status': 'ok'})

        # Télécharger le fichier
        file_bytes = None
        media_url  = media.get('url', '').replace('localhost:3000', 'localhost:3001')
        print(f"[DOWNLOAD] url={media_url}")
        try:
            file_resp  = requests.get(media_url, headers={"X-Api-Key": WAHA_KEY}, timeout=30)
            file_bytes = file_resp.content
            print(f"[DOWNLOAD] taille={len(file_bytes)} bytes")
        except Exception as e:
            print(f"[DOWNLOAD ERROR] {e}")

        if not file_bytes or len(file_bytes) < 5000:
            print("[FALLBACK] tentative base64...")
            body_b64 = payload.get('_data', {}).get('body', '')
            if body_b64 and len(body_b64) > 100:
                try:
                    file_bytes = base64.b64decode(body_b64)
                    print(f"[BASE64] taille={len(file_bytes)} bytes")
                except Exception as e:
                    print(f"[BASE64 ERROR] {e}")

        if not file_bytes or len(file_bytes) < 500:
            send_reply(chat_id, "❌ Erreur de téléchargement. Réessayez.")
            return Response({'status': 'error'})

        # Convertir en JPEG si image
        is_pdf = 'pdf' in mimetype
        if not is_pdf:
            try:
                img = Image.open(io.BytesIO(file_bytes))
                if img.mode in ('RGBA', 'P', 'LA'):
                    img = img.convert('RGB')
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=95)
                file_bytes = buf.getvalue()
                mimetype   = 'image/jpeg'
                print(f"[CONVERT] JPEG taille={len(file_bytes)} bytes")
            except Exception as e:
                print(f"[CONVERT ERROR] {e}")
                send_reply(chat_id, "❌ Image illisible. Envoyez une image plus nette.")
                return Response({'status': 'error'})

        send_reply(chat_id,
            f"📄 Facture reçue ! Traitement en cours...\n"
            f"👤 {owner.email} · 🏢 {company.nom}")

        ext      = 'pdf' if is_pdf else 'jpg'
        tmp_path = None

        try:
            with tempfile.NamedTemporaryFile(suffix=f'.{ext}', delete=False) as f:
                f.write(file_bytes)
                tmp_path = f.name

            tmp_file = SimpleUploadedFile(
                name=f"facture_wa_{raw_id}.{ext}",
                content=file_bytes,
                content_type=mimetype,
            )

            text_brut, result = process_facture(tmp_file)

            from datetime import date, datetime
            date_facture = result.get('date_facture') or str(date.today())
            try:
                date_facture = datetime.strptime(date_facture, '%Y-%m-%d').date()
            except Exception:
                date_facture = date.today()

            # ── Recréer le fichier pour la sauvegarde (process_facture consomme le seek) ──
            file_to_save = SimpleUploadedFile(
                name=f"facture_wa_{raw_id}.{ext}",
                content=file_bytes,
                content_type=mimetype,
            )

            facture = Invoice.objects.create(
                fournisseur    = result.get('fournisseur', 'Inconnu'),
                numero_facture = result.get('numero_facture', None),  # ← NOUVEAU
                date_facture   = date_facture,
                total          = result.get('total', 0.0),
                tva            = result.get('tva', 0.0),
                devise         = result.get('devise', 'MAD'),
                owner          = owner,
                company        = company,
                file           = file_to_save,               # ← NOUVEAU
            )

            for ligne in result.get('lignes', []):
                qte  = ligne.get('quantite', 1)
                prix = ligne.get('prix', 0.0)
                LigneFacture.objects.create(
                    facture       = facture,
                    designation   = ligne.get('designation', ''),
                    quantite      = qte,
                    prix_unitaire = prix,
                    montant       = ligne.get('montant', qte * prix),
                )

            # Log d'audit
            AuditLog.log(
                action  = AuditLog.Action.UPLOADED,
                invoice = facture,
                user    = owner,
                details = f"Via WhatsApp — {nb_lignes} lignes extraites",
            )

            devise    = result.get('devise', 'MAD')
            nb_lignes = len(result.get('lignes', []))

            duplicates = facture.get_duplicates()
            dup_msg    = ""
            if duplicates.exists():
                ids = ", ".join([f"#{d.id}" for d in duplicates])
                dup_msg = f"\n⚠️ *Doublon détecté* avec : {ids}"
                AuditLog.log(
                    action  = AuditLog.Action.DUPLICATE,
                    invoice = facture,
                    user    = owner,
                    details = f"Doublons potentiels : {ids}",
                )

            # Numéro de facture dans le message si trouvé
            num_msg = f"\n🔢 N° facture : {facture.numero_facture}" if facture.numero_facture else ""

            send_reply(chat_id,
                f"✅ Facture enregistrée avec succès !\n\n"
                f"🏪 {facture.fournisseur}\n"
                f"💰 {facture.total} {devise}\n"
                f"🧾 TVA : {facture.tva} {devise}\n"
                f"📋 Lignes : {nb_lignes}"
                f"{num_msg}"
                f"\n🏢 {company.nom}\n"
                f"👤 {owner.email}"
                f"{dup_msg}\n\n"
                f"Consultez votre dashboard pour valider.\n"
                f"Tapez *LISTE* pour voir vos factures.")

        except Exception as e:
            print(f"[ERREUR WEBHOOK] {e}")
            import traceback
            traceback.print_exc()
            send_reply(chat_id, "❌ Erreur lors de l'analyse. Réessayez avec une image plus nette.")

        finally:
            if tmp_path:
                for _ in range(5):
                    try:
                        os.unlink(tmp_path)
                        break
                    except PermissionError:
                        time.sleep(0.5)
                    except Exception:
                        break

        return Response({'status': 'ok'})
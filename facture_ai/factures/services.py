import os
import base64
import json
import re
import io
import pdfplumber
import fitz  # PyMuPDF
from PIL import Image
import requests

from .utils import parse_invoice

# ─────────────────────────────────────────────────────────────────────────────
# Groq API - Vision
# ─────────────────────────────────────────────────────────────────────────────

GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

GROQ_PROMPT = """Tu es un assistant spécialisé dans l'extraction de données de factures multilingues (français, anglais, néerlandais, arabe...).
Analyse cette image de facture et retourne UNIQUEMENT un objet JSON valide, sans aucun texte avant ou après, sans balises markdown.

Format attendu :
{
  "fournisseur": "NOM DE LA MARQUE/SOCIÉTÉ",
  "numero_facture": "FAC-2024-001",
  "date_facture": "YYYY-MM-DD",
  "total": 0.00,
  "tva": 0.00,
  "devise": "EUR",
  "lignes": [
    {
      "designation": "Nom du produit ou service",
      "quantite": 1,
      "prix": 0.00,
      "montant": 0.00
    }
  ]
}

Règles CRITIQUES — lis attentivement :

1. FOURNISSEUR : le NOM DE LA MARQUE/SOCIÉTÉ émettrice visible en haut (logo, en-tête).

2. NUMERO DE FACTURE (NOUVEAU) :
   - Cherche les libellés : "N° Facture", "Facture N°", "Invoice No", "Invoice #", "Ref", "Référence", "Bon N°", "Nummer", "Numero", "رقم الفاتورة".
   - Retourne la valeur exacte telle qu'elle apparaît (ex: "FAC-2024-001", "INV-00123", "2024/456").
   - Si absent → null.

3. DATE : date d'émission au format YYYY-MM-DD (cherche "Date", "Datum", "Le", "Invoice date"...).

4. TOTAL TTC (CRITIQUE) :
   - C'est le montant FINAL à payer, TOUTES TAXES COMPRISES.
   - Cherche : "TOTAL T.T.C", "Total TTC", "Totaal", "Amount due", "Net à payer", "Grand Total", "VISA EURO", "VISA", montant de paiement final.
   - ATTENTION : NE PAS additionner HT + TVA. Lire directement le chiffre "TOTAL TTC" imprimé.
   - Exemple : si la facture affiche "TOTAL T.T.C  850,00" → total = 850.00
   - Les montants avec virgule (ex: 850,00) → convertir en float avec point (850.00).

5. TVA : montant en valeur (pas le taux %). Cherche "TVA", "BTW", "Tax", "VAT", "Montant TVA".
   - Exemple : "Montant  141,67" dans la section TVA → tva = 141.67
   - JAMAIS le taux : "20%" → ce n'est PAS la TVA, c'est le taux.

6. DEVISE (CRITIQUE) :
   - Lis TOUS les symboles et mots monétaires sur la facture.
   - "€", "EUR", "EURO", "VISA EURO" → "EUR"
   - "$", "USD" → "USD"
   - "£", "GBP" → "GBP"
   - "DH", "DHS", "MAD", "Dhs", "درهم" → "MAD"
   - "CHF" → "CHF"  |  "CAD" → "CAD"  |  "¥", "JPY" → "JPY"
   - Si aucune devise trouvée → "MAD" par défaut.
   - IMPORTANT : "VISA EURO" signifie que le paiement est en EUR → devise = "EUR".

7. LIGNES : tous les articles/produits avec désignation, quantité, prix unitaire, montant.

Règles de format :
- Virgule décimale (184,30) → point (184.30)
- Tous les montants sont des float, jamais des strings.
- Absent → 0.00 pour montants, "" pour textes, [] pour lignes, null pour numero_facture.
"""


def _extract_with_groq(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise ValueError("GROQ_API_KEY non définie.")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url  = f"data:{mime_type};base64,{image_b64}"

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": data_url}},
                    {"type": "text",      "text": GROQ_PROMPT}
                ]
            }
        ],
        "temperature": 0,
        "max_tokens":  1024,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type":  "application/json",
    }

    try:
        response = requests.post(GROQ_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        raise ValueError(f"Erreur API Groq ({response.status_code}): {response.text}") from e
    except requests.exceptions.Timeout:
        raise ValueError("Timeout : Groq n'a pas répondu dans les 30 secondes.")
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Erreur réseau : {e}") from e

    result = response.json()

    print("\n" + "=" * 60)
    print("GROQ RAW RESPONSE:")
    try:
        raw_debug = result["choices"][0]["message"]["content"]
        print(raw_debug[:1000])
    except Exception:
        print("Impossible de lire la réponse Groq")
    print("=" * 60 + "\n")

    try:
        raw = result["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError):
        raw = ""

    raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
    raw = re.sub(r'\s*```$',          '', raw, flags=re.MULTILINE)
    raw = raw.strip()

    print("GROQ PARSED JSON:")
    print(raw[:500])
    print("-" * 60 + "\n")

    try:
        parsed = json.loads(raw)
        # Normaliser la devise : toujours en majuscules, fallback MAD
        devise_raw = str(parsed.get("devise", "MAD")).strip().upper()
        parsed["devise"] = _normalise_devise(devise_raw)
        # Normaliser numero_facture : None si vide
        num = parsed.get("numero_facture")
        parsed["numero_facture"] = num if num and str(num).strip() else None
        print("GROQ DICT RESULT:", parsed)
        print("=" * 60 + "\n")
        return parsed
    except json.JSONDecodeError as e:
        print(f"JSON DECODE ERROR: {e}\nRaw: {raw}")
        return {
            "fournisseur": "Inconnu",
            "numero_facture": None,
            "date_facture": "",
            "total": 0.0,
            "tva": 0.0,
            "devise": "MAD",
            "lignes": [],
        }


def _normalise_devise(raw: str) -> str:
    """Convertit un symbole ou code brut en code ISO 4217."""
    mapping = {
        "$":   "USD", "USD": "USD",
        "€":   "EUR", "EUR": "EUR",
        "£":   "GBP", "GBP": "GBP",
        "¥":   "JPY", "JPY": "JPY", "CNY": "CNY",
        "CHF": "CHF", "CAD": "CAD",
        "AED": "AED", "SAR": "SAR",
        "MAD": "MAD", "DH":  "MAD", "DHS": "MAD", "درهم": "MAD",
    }
    return mapping.get(raw, "MAD")


# ─────────────────────────────────────────────────────────────────────────────
# PDF natif
# ─────────────────────────────────────────────────────────────────────────────

def extract_text_native_pdf(file) -> str:
    file.seek(0)
    text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
    return text


def is_native_pdf(file) -> bool:
    file.seek(0)
    try:
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t and len(t.strip()) > 50:
                    return True
    except Exception:
        pass
    return False


def _detect_devise_from_text(text: str) -> str:
    """Détecte la devise depuis le texte brut d'un PDF natif."""
    text_upper = text.upper()
    if "$" in text or "USD" in text_upper:
        return "USD"
    if "€" in text or "EUR" in text_upper:
        return "EUR"
    if "£" in text or "GBP" in text_upper:
        return "GBP"
    if "CHF" in text_upper:
        return "CHF"
    if "CAD" in text_upper:
        return "CAD"
    if "AED" in text_upper or "د.إ" in text:
        return "AED"
    if "SAR" in text_upper or "﷼" in text:
        return "SAR"
    if "JPY" in text_upper or "¥" in text:
        return "JPY"
    return "MAD"


def _extract_numero_from_text(text: str) -> str | None:
    """
    Extrait le numéro de facture depuis un texte de PDF natif.
    Cherche les patterns courants : 'N° Facture', 'Invoice No', etc.
    """
    patterns = [
        r'(?:N[°o]?\s*(?:de\s+)?[Ff]acture|[Ff]acture\s+N[°o]?|[Ii]nvoice\s*(?:No|#|Number|Num)?)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/_.]{1,30})',
        r'(?:[Rr][eé]f(?:[eé]rence)?|[Nn]um[eé]ro)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/_.]{1,30})',
        r'(?:رقم\s*الفاتورة)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/_.]{1,30})',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            val = match.group(1).strip()
            if val:
                return val
    return None


# ─────────────────────────────────────────────────────────────────────────────
# PDF scanné
# ─────────────────────────────────────────────────────────────────────────────

def _scanned_pdf_to_data(file) -> dict:
    file.seek(0)
    doc = fitz.open(stream=file.read(), filetype="pdf")

    combined = {
        "fournisseur": "Inconnu",
        "numero_facture": None,
        "date_facture": "",
        "total": 0.0,
        "tva": 0.0,
        "devise": "MAD",
        "lignes": [],
    }

    for page in doc:
        pix       = page.get_pixmap(dpi=200)
        img_bytes = pix.tobytes("png")
        page_data = _extract_with_groq(img_bytes, mime_type="image/png")

        if page_data.get("fournisseur") and page_data["fournisseur"] != "Inconnu":
            combined["fournisseur"] = page_data["fournisseur"]
        if page_data.get("date_facture"):
            combined["date_facture"] = page_data["date_facture"]
        if page_data.get("total", 0) > combined["total"]:
            combined["total"] = page_data["total"]
        if page_data.get("tva", 0) > combined["tva"]:
            combined["tva"] = page_data["tva"]
        if page_data.get("devise", "MAD") != "MAD" and combined["devise"] == "MAD":
            combined["devise"] = page_data["devise"]
        # Prendre le premier numéro de facture trouvé
        if page_data.get("numero_facture") and not combined["numero_facture"]:
            combined["numero_facture"] = page_data["numero_facture"]
        combined["lignes"].extend(page_data.get("lignes") or [])

    print("\nSCANNED PDF COMBINED RESULT:", combined)
    print("=" * 60 + "\n")
    return combined


# ─────────────────────────────────────────────────────────────────────────────
# Point d'entrée principal
# ─────────────────────────────────────────────────────────────────────────────

MIME_TYPES = {
    "jpg":  "image/jpeg",
    "jpeg": "image/jpeg",
    "png":  "image/png",
    "webp": "image/webp",
    "tiff": "image/png",
}


def process_facture(file) -> tuple:
    """
    Retourne (text_brut, data_dict).
    data_dict contient : fournisseur, numero_facture, date_facture,
                         total, tva, devise, lignes.
    """
    filename = file.name.lower()
    ext      = filename.rsplit(".", 1)[-1]

    print(f"\nPROCESS FACTURE: fichier={filename}, ext={ext}")

    if ext == "pdf":
        native = is_native_pdf(file)
        print(f"PDF natif: {native}")
        if native:
            text  = extract_text_native_pdf(file)
            print(f"TEXT EXTRAIT ({len(text)} chars):\n{text[:300]}\n---")
            data  = parse_invoice(text)
            data["devise"]         = _detect_devise_from_text(text)
            data["numero_facture"] = _extract_numero_from_text(text)  # ← NOUVEAU
            print(f"PARSE INVOICE RESULT: {data}")
            return text, data
        else:
            data = _scanned_pdf_to_data(file)
            return "", data

    elif ext in MIME_TYPES:
        mime_type = MIME_TYPES[ext]
        file.seek(0)
        if ext == "tiff":
            img = Image.open(file)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            image_bytes = buf.getvalue()
        else:
            image_bytes = file.read()
        print(f"IMAGE: mime_type={mime_type}, taille={len(image_bytes)} bytes")
        data = _extract_with_groq(image_bytes, mime_type=mime_type)
        return "", data

    else:
        raise ValueError(f"Format non supporté : {filename}")
import re
from datetime import datetime


# ─── Patterns de dates ────────────────────────────────────────────────────────
DATE_PATTERNS = [
    r'\b(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})\b',   # 07/04/2026 ou 07-04-2026
    r'\b(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})\b',   # 2026-04-07
    r'\b(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})\b',
    r'\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b',
]

MOIS_FR = {
    'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
    'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
    'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
}
MOIS_EN = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12'
}

# ─── Patterns de montants ─────────────────────────────────────────────────────
AMOUNT_PATTERN = r'(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{1,2})?|\d+[.,]\d{1,2})'

# ✅ CORRIGÉ : ajout de prix\s*total, prix\s*ttc, montant\s*ttc, TOTAL Rapris, VISA (paiement final)
TOTAL_KEYWORDS  = r'(total\s*(ttc|ht|général|facture|rapris)?|montant\s*(total|ttc|ht)?|net\s*à\s*payer|à\s*payer|prix\s*total|prix\s*ttc|visa)'
TVA_KEYWORDS    = r'(tva|t\.v\.a|taxe(?!\s*total))'
HT_KEYWORDS     = r'(total\s*h\.?t\.?|montant\s*ht|sous[\s\-]total|subtotal|prix\s*ht)'

# ─── Mots à ignorer pour détecter le fournisseur ─────────────────────────────
SKIP_LINES = re.compile(
    r'^\s*(facture|invoice|bon\s*de\s*commande|devis|date|n[°o]|ref|page|'
    r'adresse|tel|fax|email|siret|tva|iban|swift|www\.|http|'
    r'si[eè]ge|cap\.soc|c\.c\.t|téléphone|telephone|vendu|expédi|commande|'
    r'malletier|depuis)',
    re.IGNORECASE
)

# ✅ NOUVEAU : mots-clés qui indiquent un nom de société/marque en majuscules
COMPANY_INDICATORS = re.compile(
    r'\b(s\.p\.a|sarl|sas|sa\b|srl|ltd|gmbh|inc\.|llc|spa)\b',
    re.IGNORECASE
)


def _clean_amount(s: str) -> float:
    """Convertit '1 234,56' ou '1.234,56' ou '1234.56' en float."""
    s = s.strip()
    # Enlever les symboles monétaires
    s = re.sub(r'[€$£]', '', s).strip()
    # Format européen : 1.234,56
    if re.search(r'\d\.\d{3},', s):
        s = s.replace('.', '').replace(',', '.')
    # Format avec espace : 1 234,56
    elif re.search(r'\d\s\d{3}', s):
        s = s.replace(' ', '').replace(',', '.')
    # Format simple avec virgule : 1234,56
    else:
        s = s.replace(',', '.')
    # Enlever tout sauf chiffres et point
    s = re.sub(r'[^\d.]', '', s)
    try:
        return float(s)
    except ValueError:
        return 0.0


def _extract_date(text: str) -> str:
    """Cherche la première date valide dans le texte."""
    text_lower = text.lower()

    # Format avec mois en lettres FR/EN
    for pattern in DATE_PATTERNS[2:]:
        m = re.search(pattern, text_lower)
        if m:
            day = m.group(1).zfill(2)
            mois_str = m.group(2).lower()
            year = m.group(3)
            mois = MOIS_FR.get(mois_str) or MOIS_EN.get(mois_str, '01')
            return f"{year}-{mois}-{day}"

    # Format numérique — cherche près des mots-clés d'abord
    for keyword in ['date facture', 'date:', 'le', 'émis', 'issued', 'édité', 'edité']:
        idx = text_lower.find(keyword)
        if idx == -1:
            continue
        snippet = text[idx:idx + 40]
        for pattern in DATE_PATTERNS[:2]:
            m = re.search(pattern, snippet)
            if m:
                g = m.groups()
                if len(g[0]) == 4:  # YYYY-MM-DD
                    return f"{g[0]}-{g[1]}-{g[2]}"
                else:               # DD/MM/YYYY ou DD-MM-YYYY
                    return f"{g[2]}-{g[1]}-{g[0]}"

    # Fallback : première date trouvée n'importe où
    for pattern in DATE_PATTERNS[:2]:
        m = re.search(pattern, text)
        if m:
            g = m.groups()
            if len(g[0]) == 4:
                return f"{g[0]}-{g[1]}-{g[2]}"
            else:
                return f"{g[2]}-{g[1]}-{g[0]}"

    return datetime.today().strftime('%Y-%m-%d')


def _normalize_spaced_caps(line: str) -> str:
    """
    ✅ NOUVEAU : convertit 'G O Y A R D' → 'GOYARD'
    Détecte les lignes où chaque lettre est séparée par un espace (rendu OCR de logos).
    """
    # Pattern : lettres majuscules séparées par des espaces simples
    if re.match(r'^([A-Z]\s){2,}[A-Z]$', line.strip()):
        return line.replace(' ', '')
    return line


def _extract_fournisseur(lines: list) -> str:
    """
    ✅ CORRIGÉ : cherche le nom de la marque/société.
    Stratégie :
    1. Cherche une ligne courte entièrement en MAJUSCULES (nom de marque/logo)
       — supporte les lettres espacées type OCR : 'G O Y A R D' → 'GOYARD'
    2. Sinon prend le premier texte significatif non-skipé
    """
    candidates_upper = []  # lignes tout en majuscules (courtes = logo/marque)
    candidates_any   = []  # autres lignes valides

    for line in lines[:20]:
        line = line.strip()
        if not line or len(line) < 2:
            continue

        # ✅ Normaliser les logos avec lettres espacées (ex: "G O Y A R D")
        normalized = _normalize_spaced_caps(line)

        if SKIP_LINES.match(normalized):
            continue
        if re.match(r'^\d', normalized):
            continue
        # Ignorer les lignes avec email/url/numéros longs
        if re.search(r'[@/\\]|\d{5,}', normalized):
            continue

        # ✅ Priorité aux lignes courtes tout en majuscules (typique logo de marque)
        # On exclut les lignes trop longues (adresses, mentions légales)
        if normalized == normalized.upper() and 2 <= len(normalized) <= 30 and not COMPANY_INDICATORS.search(normalized):
            candidates_upper.append(normalized)
        elif not SKIP_LINES.match(line):
            candidates_any.append(normalized)

    # Retourner la meilleure candidate
    if candidates_upper:
        return candidates_upper[0]
    if candidates_any:
        return candidates_any[0]
    return "Inconnu"


def _extract_total(text: str) -> tuple:
    """
    ✅ CORRIGÉ : Retourne (total_ttc, tva, total_ht).
    - Gère 'TOTAL Rapris', 'VISA' comme indicateurs de total final
    - Ignore les taux TVA (ex: 20%) comme montant TVA
    - Prend le montant le plus élevé correspondant au total TTC
    """
    total = tva = ht = 0.0

    for line in text.split('\n'):
        line_lower = line.lower()
        amounts = re.findall(AMOUNT_PATTERN, line)
        if not amounts:
            continue
        last_amount = _clean_amount(amounts[-1])

        # ✅ Total TTC : prend le montant max trouvé sur une ligne "total"
        if re.search(TOTAL_KEYWORDS, line_lower) and last_amount > total:
            # Exclure "TOTAL H.T." qui sera traité séparément
            if not re.search(r'\bh\.?t\.?\b', line_lower):
                total = last_amount

        # TVA : éviter de capturer les taux (20%, 19%...)
        if re.search(TVA_KEYWORDS, line_lower) and tva == 0.0:
            # Un taux TVA seul (ex: 20.00) sans montant significatif → ignorer
            if last_amount > 5:
                tva = last_amount

        # Total HT
        if re.search(HT_KEYWORDS, line_lower) and ht == 0.0:
            ht = last_amount

    return total, tva, ht


def _extract_lignes(lines: list) -> list:
    """
    ✅ CORRIGÉ : supporte les colonnes PRIX HT. + PRIX TOTAL (format Moncler)
    et le format classique DÉSIGNATION + QTÉ + PRIX UNIT. + MONTANT
    Supporte aussi le format Goyard : DESIGNATION | QTE | Prix TVA | Prix TTC | PRIX NET
    """
    produits = []

    # Pattern principal : designation  qte  prix_unit  montant
    pattern_full = re.compile(
        r'^(.{3,60}?)\s{2,}'
        r'(\d+(?:[.,]\d+)?)\s+'
        r'(\d+(?:[.,\s]\d+)*\s*[€$]?)\s+'
        r'(\d+(?:[.,\s]\d+)*\s*[€$]?)$',
        re.IGNORECASE
    )

    # ✅ Pattern Goyard : designation  qte  prix_tva EUR  prix_ttc EUR  prix_net EUR
    pattern_goyard = re.compile(
        r'^(.{3,80}?)\s{2,}'
        r'(\d+)\s+'
        r'(\d+(?:[.,]\d+)*)\s*EUR\s+'
        r'(\d+(?:[.,]\d+)*)\s*EUR\s+'
        r'(\d+(?:[.,]\d+)*)\s*EUR\s*$',
        re.IGNORECASE
    )

    # ✅ Pattern Moncler : désignation + ref + qte + prix_ht + devise + taux + prix_total
    pattern_moncler = re.compile(
        r'^(.{3,60}?)\s{2,}'
        r'[A-Z0-9]{5,}\s+'
        r'(\d+)\s+'
        r'(\d+(?:[.,]\d+)*)\s*[€$]?\s+'
        r'\w+\s+'
        r'\d+[.,]\d+\s*%?\s+'
        r'(\d+(?:[.,]\d+)*)\s*[€$]?$',
        re.IGNORECASE
    )

    # Pattern simplifié : texte + montant
    pattern_simple = re.compile(
        r'^(.{5,60}?)\s{2,}'
        r'(\d+(?:[.,\s]\d{2,3})+)\s*[€$]?\s*$',
        re.IGNORECASE
    )

    in_table = False
    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Détecter le début du tableau
        if re.search(
            r'(désignation|designation|description\s*article|libellé|article|produit|référence)',
            line, re.I
        ):
            in_table = True
            continue

        # Stopper avant les totaux
        if re.search(r'(^total|sous.total|net\s*à\s*payer)', line, re.I):
            in_table = False

        if not in_table:
            continue

        # ✅ Pattern Goyard (designation + qte + prix_tva EUR + prix_ttc EUR + prix_net EUR)
        m = pattern_goyard.match(line)
        if m:
            try:
                produits.append({
                    "designation": m.group(1).strip(),
                    "quantite":    int(m.group(2)),
                    "prix":        _clean_amount(m.group(3)),   # Prix TVA = HT
                    "montant":     _clean_amount(m.group(4)),   # Prix TTC
                })
                continue
            except (ValueError, TypeError):
                pass

        # ✅ Pattern Moncler
        m = pattern_moncler.match(line)
        if m:
            try:
                produits.append({
                    "designation": m.group(1).strip(),
                    "quantite":    int(m.group(2)),
                    "prix":        _clean_amount(m.group(3)),
                    "montant":     _clean_amount(m.group(4)),
                })
                continue
            except (ValueError, TypeError):
                pass

        # Pattern complet classique
        m = pattern_full.match(line)
        if m:
            try:
                produits.append({
                    "designation": m.group(1).strip(),
                    "quantite":    int(float(_clean_amount(m.group(2)))),
                    "prix":        _clean_amount(m.group(3)),
                    "montant":     _clean_amount(m.group(4)),
                })
                continue
            except (ValueError, TypeError):
                pass

        # Pattern simplifié
        m2 = pattern_simple.match(line)
        if m2:
            montant = _clean_amount(m2.group(2))
            if montant > 0:
                produits.append({
                    "designation": m2.group(1).strip(),
                    "quantite":    1,
                    "prix":        montant,
                    "montant":     montant,
                })

    return produits


def parse_invoice(text: str) -> dict:
    """
    Point d'entrée principal.
    Retourne un dict avec fournisseur, date_facture, total, tva, lignes.
    """
    lines = text.split('\n')

    fournisseur  = _extract_fournisseur(lines)
    date_facture = _extract_date(text)
    total, tva, ht = _extract_total(text)
    lignes       = _extract_lignes(lines)

    # Si total toujours 0, calculer depuis les lignes
    if total == 0.0 and lignes:
        total = round(sum(p['montant'] for p in lignes), 2)

    return {
        "fournisseur":  fournisseur,
        "date_facture": date_facture,
        "total":        total,
        "tva":          tva,
        "lignes":       lignes,
    }
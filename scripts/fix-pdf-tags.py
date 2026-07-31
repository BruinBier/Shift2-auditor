"""PDF/UA-reparatie voor de Word-export van een Shift2-rapport.

Word geeft de kopregel-informatie van tabellen niet door aan de PDF-tags: alles
belandt in TBody met TD-cellen, zonder een enkele TH. Dit script herstelt dat en
vult de overige PDF/UA-vereisten aan.

  1. Koprijen: TD -> TH met Scope=Column, verplaatst naar een THead.
     Koprijen worden herkend op hun tekst, dus herhaalde koppen over een
     paginabreuk gaan automatisch mee.
  2. Rijkoppen: eerste cel van elke datarij -> TH met Scope=Row.
  3. Link-annotaties: /Contents en /Alt vullen (WCAG-links krijgen een
     leesbare titel in plaats van de kale URL).
  4. XMP: pdfuaid:part=1, titel en taal.

Gebruik:
    python scripts/fix-pdf-tags.py <invoer.pdf> [uitvoer.pdf]

Laat je de uitvoernaam weg, dan wordt dat "<invoer>-pdfua.pdf".

Vereist: pip install pikepdf pymupdf
"""
import os
import re
import sys

import fitz
import pikepdf

if len(sys.argv) < 2:
    sys.exit(__doc__)

INPUT = sys.argv[1]
if not os.path.exists(INPUT):
    sys.exit(f"Bestand niet gevonden: {INPUT}")

OUTPUT = (
    sys.argv[2]
    if len(sys.argv) > 2
    else re.sub(r"\.pdf$", "", INPUT, flags=re.I) + "-pdfua.pdf"
)

# Tabellen waarvan de eerste kolom een rijkop is (SC-nummer / principe).
# None = alle tabellen; anders een set met tabelindices (0-gebaseerd).
ROW_HEADER_TABLES = None

WAI_SLUG_ALT = {
    "non-text-content": "1.1.1 Niet-tekstuele content",
    "audio-description-or-media-alternative-prerecorded":
        "1.2.3 Audiodescriptie of media-alternatief (vooraf opgenomen)",
    "audio-description-prerecorded": "1.2.5 Audiodescriptie (vooraf opgenomen)",
    "info-and-relationships": "1.3.1 Info en relaties",
    "meaningful-sequence": "1.3.2 Betekenisvolle volgorde",
    "sensory-characteristics": "1.3.3 Zintuiglijke eigenschappen",
    "identify-input-purpose": "1.3.5 Identificeer het doel van de input",
    "use-of-color": "1.4.1 Gebruik van kleur",
    "contrast-minimum": "1.4.3 Contrast (minimum)",
    "images-of-text": "1.4.5 Afbeeldingen van tekst",
    "reflow": "1.4.10 Reflow",
    "non-text-contrast": "1.4.11 Contrast van niet-tekstuele content",
    "no-keyboard-trap": "2.1.2 Geen toetsenbordval",
    "page-titled": "2.4.2 Paginatitel",
    "link-purpose-in-context": "2.4.4 Linkdoel (in context)",
    "headings-and-labels": "2.4.6 Koppen en labels",
    "label-in-name": "2.5.3 Label in naam",
    "language-of-page": "3.1.1 Taal van de pagina",
    "language-of-parts": "3.1.2 Taal van onderdelen",
    "consistent-identification": "3.2.4 Consistente identificatie",
    "labels-or-instructions": "3.3.2 Labels of instructies",
    "name-role-value": "4.1.2 Naam, rol en waarde",
}

WAI_URL_ALT = {
    "https://www.w3.org/Translations/WCAG22-nl": "WCAG 2.2 (Nederlandse vertaling)",
    "https://www.w3.org/Translations/WCAG22-nl/": "WCAG 2.2 (Nederlandse vertaling)",
    "https://www.w3.org/WAI/test-evaluate/conformance/wcag-em":
        "WCAG-EM: methode voor toegankelijkheidsonderzoek",
    "https://www.digitoegankelijk.nl": "Digitoegankelijk.nl",
    "https://www.digitoegankelijk.nl/toegankelijkheidsverklaring/onderzoek":
        "Digitoegankelijk.nl: onderzoek voor de toegankelijkheidsverklaring",
}


def wcag_alt_for(uri):
    if uri in WAI_URL_ALT:
        return WAI_URL_ALT[uri]
    m = re.search(r"/Understanding/([a-z0-9-]+)\.html$", uri)
    if not m:
        m = re.search(r"/WCAG22-nl/?#([a-z0-9-]+)$", uri)
    return WAI_SLUG_ALT.get(m.group(1)) if m else None


# ─────────────────────────────────────────────
# Koprij-teksten bepalen met een tekstextractie
# ─────────────────────────────────────────────
print("Koprijen opsporen via tekstextractie...")

header_texts = set()
with fitz.open(INPUT) as fdoc:
    for page in fdoc:
        for tab in page.find_tables():
            rows = tab.extract()
            if rows and rows[0]:
                cells = tuple(
                    (c or "").strip() for c in rows[0]
                )
                if any(cells):
                    header_texts.add(cells)
for h in sorted(header_texts):
    print("  koprij:", list(h))

pdf = pikepdf.open(INPUT)
root = pdf.Root["/StructTreeRoot"]
raw = root["/K"]
doc = raw[0] if isinstance(raw, pikepdf.Array) else raw

# MCID -> tekst, om rijen te kunnen herkennen
page_text = {}
with fitz.open(INPUT) as fdoc:
    for pno, page in enumerate(fdoc):
        d = page.get_text("rawdict")
        # Tekst per MCID is niet direct beschikbaar; we gebruiken de
        # woordenlijst en koppelen later op positie via de tabelextractie.
        page_text[pno] = page.get_text("words")


def sp_of_page(pg):
    for page in pdf.pages:
        if page.objgen == pg.objgen:
            v = page.get("/StructParents")
            return int(str(v)) if v is not None else None
    return None


def page_index_of(pg):
    for i, page in enumerate(pdf.pages):
        if page.objgen == pg.objgen:
            return i
    return None


# Tekst per MCID uit de content streams (hex- en literal-strings)
mcid_text = {}
for page in pdf.pages:
    sp = page.get("/StructParents")
    if sp is None:
        continue
    contents = page.get("/Contents")
    data = (
        b"".join(bytes(s.read_bytes()) for s in contents)
        if isinstance(contents, pikepdf.Array)
        else bytes(contents.read_bytes())
    )
    text = data.decode("latin-1")
    # Tekst staat in TJ-arrays: [(Succescrit)-3(eri)-4(um)] TJ, of losse (..) Tj.
    # De inhoud van een cel zit vaak in een geneste /Span binnen de /P, dus we
    # lezen tot de EMC die bij deze BDC hoort (geneste BDC's meetellen).
    for m in re.finditer(r"<</MCID (\d+)[^>]*>>\s*BDC", text):
        mcid = int(m.group(1))
        pos = m.end()
        depth = 1
        while depth > 0:
            nxt = re.compile(r"\bBDC\b|\bBMC\b|\bEMC\b").search(text, pos)
            if not nxt:
                break
            depth += 1 if nxt.group(0) in ("BDC", "BMC") else -1
            pos = nxt.end()
        body = text[m.end():pos]
        chunks = []
        for tm in re.finditer(r"\(((?:[^()\\]|\\.)*)\)", body):
            chunks.append(re.sub(r"\\(.)", r"\1", tm.group(1)))
        value = "".join(chunks)
        if value.strip():
            mcid_text[(int(str(sp)), mcid)] = value


def node_text(node, depth=0):
    """Alle tekst onder een structuurknoop."""
    if not isinstance(node, pikepdf.Dictionary) or depth > 12:
        return ""
    pg = node.get("/Pg")
    sp = sp_of_page(pg) if pg is not None else None
    out = []
    k = node.get("/K")
    if isinstance(k, int):
        if sp is not None:
            out.append(mcid_text.get((sp, k), ""))
    elif isinstance(k, pikepdf.Array):
        for c in k:
            if isinstance(c, int):
                if sp is not None:
                    out.append(mcid_text.get((sp, c), ""))
            elif isinstance(c, pikepdf.Dictionary):
                if str(c.get("/Type", "")) == "/MCR":
                    mpg = c.get("/Pg")
                    msp = sp_of_page(mpg) if mpg is not None else sp
                    mid = c.get("/MCID")
                    if msp is not None and mid is not None:
                        out.append(mcid_text.get((msp, int(str(mid))), ""))
                else:
                    out.append(node_text(c, depth + 1))
    elif isinstance(k, pikepdf.Dictionary):
        out.append(node_text(k, depth + 1))
    return " ".join(x for x in out if x).strip()


tables = []


def collect_tables(n, d=0):
    if not isinstance(n, pikepdf.Dictionary) or d > 40:
        return
    if str(n.get("/S", "")) == "/Table":
        tables.append(n)
    k = n.get("/K")
    if isinstance(k, pikepdf.Array):
        for c in k:
            collect_tables(c, d + 1)
    elif isinstance(k, pikepdf.Dictionary):
        collect_tables(k, d + 1)


collect_tables(doc)
print(f"\n{len(tables)} tabellen in de tagstructuur")

norm = lambda s: re.sub(r"\s+", " ", s or "").strip().lower()
header_first_cells = {norm(h[0]) for h in header_texts}
header_full = {tuple(norm(c) for c in h) for h in header_texts}

n_th_col = 0
n_th_row = 0
n_thead = 0

for ti, table in enumerate(tables):
    groups = [c for c in (table.get("/K") or []) if isinstance(c, pikepdf.Dictionary)]
    tbody = next((g for g in groups if str(g.get("/S", "")) == "/TBody"), None)
    if tbody is None:
        continue

    rows = [c for c in (tbody.get("/K") or []) if isinstance(c, pikepdf.Dictionary)]
    header_rows = []
    data_rows = []

    for row in rows:
        cells = [c for c in (row.get("/K") or []) if isinstance(c, pikepdf.Dictionary)]
        texts = tuple(norm(node_text(c)) for c in cells)
        if texts in header_full or (texts and texts[0] in header_first_cells and texts[0]):
            header_rows.append(row)
        else:
            data_rows.append(row)

    if not header_rows:
        print(f"  Tabel {ti + 1}: geen koprij herkend, overgeslagen")
        continue

    # 1. Koprijen: cellen TD -> TH met Scope=Column
    for row in header_rows:
        for cell in [c for c in (row.get("/K") or []) if isinstance(c, pikepdf.Dictionary)]:
            cell["/S"] = pikepdf.Name("/TH")
            cell["/A"] = pikepdf.Array([
                pikepdf.Dictionary(O=pikepdf.Name("/Table"), Scope=pikepdf.Name("/Column"))
            ])
            n_th_col += 1

    # 2. Rijkoppen: eerste cel van elke datarij -> TH met Scope=Row
    if ROW_HEADER_TABLES is None or ti in ROW_HEADER_TABLES:
        for row in data_rows:
            cells = [c for c in (row.get("/K") or []) if isinstance(c, pikepdf.Dictionary)]
            if not cells:
                continue
            cells[0]["/S"] = pikepdf.Name("/TH")
            cells[0]["/A"] = pikepdf.Array([
                pikepdf.Dictionary(O=pikepdf.Name("/Table"), Scope=pikepdf.Name("/Row"))
            ])
            n_th_row += 1

    # 3. Koprijen in een eigen THead zetten
    thead = pdf.make_indirect(pikepdf.Dictionary(
        Type=pikepdf.Name("/StructElem"),
        S=pikepdf.Name("/THead"),
        P=table,
        K=pikepdf.Array(header_rows),
    ))
    for row in header_rows:
        row["/P"] = thead
    tbody["/K"] = pikepdf.Array(data_rows)

    table_kids = list(table["/K"])
    tbody_pos = next(
        (i for i, c in enumerate(table_kids)
         if isinstance(c, pikepdf.Dictionary) and c.objgen == tbody.objgen),
        0,
    )
    table_kids.insert(tbody_pos, thead)
    table["/K"] = pikepdf.Array(table_kids)
    n_thead += 1

    print(f"  Tabel {ti + 1}: {len(header_rows)} koprij(en) -> THead, "
          f"{len(data_rows)} datarijen")

print(f"\n  {n_thead} THead-groepen aangemaakt")
print(f"  {n_th_col} cellen TD -> TH Scope=Column")
print(f"  {n_th_row} cellen TD -> TH Scope=Row")

# ─────────────────────────────────────────────
# Link-annotaties
# ─────────────────────────────────────────────
print("\nLink-annotaties aanvullen...")

n_contents = 0
n_wai = 0
for page in pdf.pages:
    for ann in (page.get("/Annots") or []):
        if not isinstance(ann, pikepdf.Dictionary):
            continue
        if str(ann.get("/Subtype", "")) != "/Link":
            continue
        a = ann.get("/A")
        uri = str(a.get("/URI", "")) if isinstance(a, pikepdf.Dictionary) else ""
        if not uri:
            continue
        alt = wcag_alt_for(uri)
        if alt:
            ann["/Contents"] = pikepdf.String(alt)
            n_wai += 1
        elif ann.get("/Contents") is None:
            ann["/Contents"] = pikepdf.String(uri)
        n_contents += 1

sp_to_text = {}
for page in pdf.pages:
    for ann in (page.get("/Annots") or []):
        if not isinstance(ann, pikepdf.Dictionary):
            continue
        if str(ann.get("/Subtype", "")) != "/Link":
            continue
        sp = ann.get("/StructParent")
        contents = ann.get("/Contents")
        if sp is not None and contents is not None:
            sp_to_text[int(str(sp))] = str(contents)

n_alt = 0
n_objr = 0


def fix_links(node, depth=0):
    global n_alt, n_objr
    if not isinstance(node, pikepdf.Dictionary) or depth > 40:
        return
    if str(node.get("/S", "")) == "/Link":
        k = node.get("/K")
        sp_val = None
        if isinstance(k, pikepdf.Array):
            new_k = []
            changed = False
            for item in k:
                if isinstance(item, pikepdf.Dictionary) and str(item.get("/Type", "")) == "/OBJR":
                    if item.objgen == (0, 0):
                        item = pdf.make_indirect(item)
                        n_objr += 1
                        changed = True
                    new_k.append(item)
                    ann = item.get("/Obj")
                    if isinstance(ann, pikepdf.Dictionary):
                        sp = ann.get("/StructParent")
                        if sp is not None:
                            sp_val = int(str(sp))
                else:
                    new_k.append(item)
            if changed:
                node["/K"] = pikepdf.Array(new_k)
        # /Alt alleen als het iets toevoegt. Is de alternatieve tekst gelijk aan
        # wat er al staat (meestal doordat de linktekst zelf de URL is), dan
        # leest hulpsoftware het dubbel voor en meldt PAC dat als
        # "Juistheid van alternatieve teksten".
        if sp_val is not None and sp_val in sp_to_text:
            alt = sp_to_text[sp_val]
            zichtbaar = node_text(node)
            # Afsluitende slash en punt negeren; "example.nl/" en "example.nl"
            # zijn voor de voorlezer hetzelfde.
            kaal = lambda s: norm(s).rstrip("/.").strip()
            if kaal(alt) and kaal(alt) != kaal(zichtbaar):
                node["/Alt"] = pikepdf.String(alt)
                n_alt += 1
            elif "/Alt" in node.keys():
                del node["/Alt"]
        return
    k = node.get("/K")
    if isinstance(k, pikepdf.Array):
        for c in k:
            fix_links(c, depth + 1)
    elif isinstance(k, pikepdf.Dictionary):
        fix_links(k, depth + 1)


fix_links(doc)
print(f"  {n_contents} annotaties met /Contents (waarvan {n_wai} WCAG-titels)")
print(f"  {n_alt} Link-elementen met /Alt, {n_objr} OBJR's indirect gemaakt")

# ─────────────────────────────────────────────
# Getagde tekst die alleen uit witruimte bestaat
# ─────────────────────────────────────────────
# Word laat lege alinea's achter (bijvoorbeeld rond het logo). Die dragen niets
# bij aan de inhoud en horen als Artifact gemarkeerd te zijn, niet als tekst.
print("\nLege getagde alinea's opruimen...")

blank_nodes = []


def find_blank(node, parent=None, depth=0):
    if not isinstance(node, pikepdf.Dictionary) or depth > 40:
        return
    if str(node.get("/S", "")) == "/P":
        k = node.get("/K")
        mcids = []
        if isinstance(k, int):
            mcids = [k]
        elif isinstance(k, pikepdf.Array):
            mcids = [x for x in k if isinstance(x, int)]
        # Alleen losse MCID-kinderen; geneste elementen laten we met rust.
        if mcids and len(mcids) == (1 if isinstance(k, int) else len(list(k))):
            if not node_text(node).strip():
                blank_nodes.append((node, parent, mcids))
        return
    k = node.get("/K")
    if isinstance(k, pikepdf.Array):
        for c in k:
            find_blank(c, node, depth + 1)
    elif isinstance(k, pikepdf.Dictionary):
        find_blank(k, node, depth + 1)


find_blank(doc)

nums = root["/ParentTree"]["/Nums"]
n_blank = 0
for node, parent, mcids in blank_nodes:
    if parent is None:
        continue
    pg = node.get("/Pg")
    sp = sp_of_page(pg) if pg is not None else None

    # Uit de structuurboom halen
    pk = parent.get("/K")
    if isinstance(pk, pikepdf.Array):
        kept = [c for c in pk
                if not (isinstance(c, pikepdf.Dictionary) and c.objgen == node.objgen)]
        if len(kept) == len(list(pk)):
            continue
        parent["/K"] = pikepdf.Array(kept)
    else:
        continue

    # In de content stream de BDC vervangen door een Artifact-markering
    for page in pdf.pages:
        v = page.get("/StructParents")
        if v is None or int(str(v)) != sp:
            continue
        contents = page.get("/Contents")
        streams = contents if isinstance(contents, pikepdf.Array) else [contents]
        for stream in streams:
            data = bytes(stream.read_bytes()).decode("latin-1")
            changed = False
            for mcid in mcids:
                pattern = rf"/\w+\s*<</MCID {mcid}[^>]*>>\s*BDC"
                if re.search(pattern, data):
                    data = re.sub(pattern, "/Artifact BMC", data, count=1)
                    changed = True
            if changed:
                stream.write(data.encode("latin-1"))
                break

    # ParentTree-verwijzing leegmaken (lengte nooit wijzigen)
    for i in range(0, len(nums), 2):
        if int(str(nums[i])) != sp:
            continue
        arr = nums[i + 1]
        if isinstance(arr, pikepdf.Array):
            for mcid in mcids:
                if mcid < len(arr):
                    arr[mcid] = pikepdf.Dictionary(Type=pikepdf.Name("/StructElem"))
        break

    n_blank += 1

print(f"  {n_blank} lege alinea's als Artifact gemarkeerd")

# ─────────────────────────────────────────────
# XMP
# ─────────────────────────────────────────────
print("\nXMP-metadata bijwerken...")

# Titel uit het document zelf; Word zet hem in de documenteigenschappen.
titel = str(pdf.docinfo.get("/Title", "")).strip()
if not titel:
    existing = pdf.open_metadata()
    titel = str(existing.get("dc:title", "")).strip()
if not titel:
    titel = os.path.splitext(os.path.basename(INPUT))[0]

taal = str(pdf.Root.get("/Lang", "nl")) or "nl"
if "-" not in taal:
    taal = f"{taal}-NL"

with pdf.open_metadata(set_pikepdf_as_editor=False) as meta:
    meta["dc:title"] = titel
    meta["dc:language"] = [taal]
    meta["pdfuaid:part"] = "1"

pdf.docinfo["/Title"] = pikepdf.String(titel)

if "/ViewerPreferences" not in pdf.Root.keys():
    pdf.Root["/ViewerPreferences"] = pikepdf.Dictionary(
        Type=pikepdf.Name("/ViewerPreferences"), DisplayDocTitle=True)
else:
    pdf.Root["/ViewerPreferences"]["/DisplayDocTitle"] = True

if "/Lang" not in pdf.Root.keys():
    pdf.Root["/Lang"] = pikepdf.String(taal)

print(f"  Titel: {titel}")
print(f"  Taal:  {taal}")

pdf.save(OUTPUT)
print(f"\nKlaar. Opgeslagen als: {OUTPUT}")

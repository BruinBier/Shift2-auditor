#!/usr/bin/env python3
"""Audiodescriptie in een video mengen, en controleren dat hij niemand overstemt.

Gebruik
-------
    python scripts/video-inmengen.py <video.mp4> [--mp3-map audiodescriptie-mp3] [--droog]
                                     [--verleng 1.5] [--tekst-in-beeld]

--tekst-in-beeld zet de zinnen ook als tekst onder in beeld, op de tijden dat ze klinken
(zie schrijf_ass). Voor video's met ingebrande ondertiteling, waar een .srt overheen zou vallen.

Een zin mag in audiodescriptie.json ook "tot_ms" en "vasthouden_op_ms" hebben: dan blijft het
beeld op dat moment stilstaan tot de zin past (zie rek_dias). Voor tekstdia's die te kort in
beeld staan om voor te lezen. Met "beeld_van_ms" erbij staat tijdens die stilstand het beeld
van een ander moment, bijvoorbeeld als een tekst pas helemaal in beeld is als de stem al
spreekt. Tijdens een stilstand loopt de muziek door: een stuk zonder spraak uit de video zelf,
herhaald met zachte overgangen (zie muziekvenster).

Leest audiodescriptie.json naast de video (zie scripts/video-stem.py) en, als die er is,
analyse/analyse.json van scripts/video-analyse.py. Schrijft
"<videonaam> - met audiodescriptie.mp4" naast het origineel. Het beeld wordt niet opnieuw
gecodeerd.

Wat er gebeurt
--------------
Elke mp3 komt op zijn start_ms. Tijdens de stem duikt het oorspronkelijke geluid onder
(sidechaincompress): de muziek gaat zachter zolang er beschreven wordt en komt daarna vanzelf
terug. Zo deed Premiere het met de hand, met een volumecurve per fragment.

Vóór het mengen meet het script per mp3 waar de stem echt begint en eindigt (Azure en Narakeet
zetten er 0,15 tot 0,25 seconde stilte voor) en legt dat naast de gesproken zinnen uit de
analyse. Valt een stem over een spreker heen, dan meldt het dat met de seconden erbij en mengt
het niet, tenzij --toch. Een audiodescriptie die over de spreker praat is geen audiodescriptie.
"""
import argparse
import json
import re
import subprocess
import sys
import textwrap
from pathlib import Path


def stem_binnen_mp3(mp3: Path) -> tuple[float, float, float]:
    """Begin en einde van de stem in een mp3, plus de totale duur, in seconden."""
    duur = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)]
    ).decode().strip())
    log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(mp3), "-af",
                          "silencedetect=noise=-40dB:d=0.15", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    begin = ends[0] if starts and starts[0] < 0.05 and ends else 0.0
    eind = starts[-1] if starts and starts[-1] > begin else duur
    return begin, eind, duur


def stemmomenten(video: Path, spraak: list) -> list:
    """Alle momenten met een stem: de zinnen van Whisper plus wat een gevoelige stemdetectie hoort.

    Whisper geeft alleen momenten met verstaanbare woorden. Bij "Een tegen eenzaamheid" lag er
    op 6,5-8,0 s een stem zonder woord die Whisper miste; dat stuk werd als muziek herhaald en
    je hoorde de stem steeds terugkomen. Silero (de stemdetectie van faster-whisper) op drempel
    0,3 vangt zulke geluiden wel. Is faster-whisper er niet, dan alleen de zinnen.
    """
    try:
        import numpy as np
        from faster_whisper.vad import VadOptions, get_speech_timestamps
    except ImportError:
        return spraak
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(video), "-f", "s16le", "-ac", "1",
                          "-ar", "16000", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    vad = get_speech_timestamps(audio, VadOptions(threshold=0.3, min_silence_duration_ms=100,
                                                  speech_pad_ms=50, min_speech_duration_ms=50))
    return spraak + [{"start": t["start"] / 16000, "eind": t["end"] / 16000} for t in vad]


def muziekvensters(p: float, stemmen: list, video_duur: float) -> list:
    """Stukken origineel geluid zonder stem, om een stilstand op p mee te vullen.

    Tijdens een stilstand liep het geluid eerst niet door: de muziek viel weg terwijl de
    audiodescriptie sprak. Bij "Een tegen eenzaamheid" (okt 2026) viel dat op. Daarna werd één
    stuk herhaald, en dan hoor je het herhalen: een stem die Whisper miste kwam steeds terug,
    en een stuk van 1,3 s zes keer achter elkaar is een riedel. Daarom nu alle stemvrije stukken
    van minstens 0,6 s, in volgorde vanaf p: eerst het stuk vlak vóór p (dan klinkt het als een
    voortzetting), dan wat erna komt, en terug naar het begin als dat niet genoeg is. Zonder
    bekende stemmen blijft het stil.
    """
    if not stemmen:
        return []
    gaten, eind = [], 0.0
    for s in sorted(stemmen, key=lambda s: s["start"]) + [{"start": video_duur, "eind": video_duur}]:
        if s["start"] - eind >= 0.7:
            gaten.append((round(eind + 0.05, 3), round(s["start"] - 0.05, 3)))
        eind = max(eind, s["eind"])
    voor = [g for g in gaten if g[0] < p]
    if voor and voor[-1][1] > p:
        voor[-1] = (voor[-1][0], p)  # het stuk waarin p valt: alleen tot p
    na = [g for g in gaten if g[0] >= p]
    lang = lambda g: g[1] - g[0] >= 0.6  # korter past niet tussen twee overgangen
    if voor and voor[-1][1] >= p - 0.1 and lang(voor[-1]):
        return [voor[-1]] + [g for g in na + voor[:-1] if lang(g)]
    return [g for g in na + voor if lang(g)]


def vul_met_muziek(vensters: list, duur: float, i: int, volume: float = 0.35) -> str:
    """Filterketen [m{i}]: de vensters achter elkaar, met zachte overgangen, tot duur lang."""
    x, stukken, lengte = 0.2, [], 0.0
    while lengte < duur + 0.1:
        for a, b in vensters:
            stukken.append((a, b))
            lengte += (b - a) - (x if len(stukken) > 1 else 0)
            if lengte >= duur + 0.1:
                break
    keten = "".join(f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS[k{i}_{j}];"
                    for j, (a, b) in enumerate(stukken))
    vorige = f"k{i}_0"
    for j in range(1, len(stukken)):
        keten += f"[{vorige}][k{i}_{j}]acrossfade=d={x}[x{i}_{j}];"
        vorige = f"x{i}_{j}"
    # Zachter dan het origineel (Frits vond 0,6 nog te hard) en met een lange uitloop: bij "Een tegen eenzaamheid" kwam de
    # muziek na de laatste zin van een stilstand omhoog en sprong het origineel daarna nog eens
    # 4 dB hoger in. Het origineel komt nu met een korte fade terug (zie rek_dias).
    f, uit = min(0.15, duur / 4), min(0.6, duur / 3)
    keten += (f"[{vorige}]atrim=duration={duur},volume={volume},"
              f"afade=t=out:st={duur - uit}:d={uit}[m{i}];")
    return keten


def rek_dias(video: Path, zinnen: list, spraak: list, mp3_map: Path, werkmap: Path,
             muziek_volume: float = 0.35, ondertitels: list | None = None):
    """Laat het beeld stilstaan waar een zin langer is dan zijn dia in beeld staat.

    Een zin met "tot_ms" (tot wanneer zijn dia in het origineel te zien is) en
    "vasthouden_op_ms" (een moment waarop de dia volledig in beeld staat) krijgt zoveel
    stilstand als nodig is om de zin 0,3 s voor het einde van de dia af te ronden. Alles na
    zo'n punt schuift op; dat geldt ook voor de start_ms van latere zinnen en voor de spraak
    uit de analyse. Bedacht voor "Heeze-Leende duurzaam vooruit 2025": elf tekstdia's van
    ongeveer een seconde, zonder geluid, waarin een voice-over anders steeds verder achterliep.
    Geeft (nieuwe video, zinnen, spraak, ondertitels) terug; zonder vasthoudpunten verandert er
    niets. Een ondertitel die over een stilstand heen loopt, stopt waar het beeld stil gaat
    staan: anders staat hij tijdens de stilstand boven de tekst van de audiodescriptie.
    """
    ondertitels = ondertitels or []
    stops = []
    for z in zinnen:
        if "tot_ms" not in z or "vasthouden_op_ms" not in z:
            continue
        _, e, _ = stem_binnen_mp3(mp3_map / z["bestand"])
        # "pauze_ms": zoveel extra stilte vóór de zin, binnen de stilstand. Bij "Een tegen
        # eenzaamheid" begon "Het is avond" direct na "Ja!"; Frits wilde daar meer adem.
        nodig = z["start_ms"] / 1000 + z.get("pauze_ms", 0) / 1000 + e + 0.3 - z["tot_ms"] / 1000
        if nodig > 0:
            # "beeld_van_ms": toon tijdens de stilstand een ander moment. Bij "De Groote Heide -
            # Dommelland" verschijnt de openingstekst letter voor letter terwijl de voice-over al
            # spreekt; stilzetten vóór die stem bevroor "Deze anim", dus daar staat de hele tekst
            # van 4 s stil.
            beeld = z.get("beeld_van_ms")
            stops.append((z["vasthouden_op_ms"] / 1000, round(nodig, 3),
                          beeld / 1000 if beeld is not None else None))
    if not stops:
        return video, zinnen, spraak, ondertitels
    stops.sort()

    def schuif(t: float) -> float:
        return t + sum(d for p, d, _ in stops if p <= t)

    grenzen = [0.0] + [p for p, _, _ in stops] + [None]
    fc, labels, muziek = "", "", []
    stemmen = stemmomenten(video, spraak)
    duur = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)]
    ).decode().strip())
    for i in range(len(grenzen) - 1):
        van, tot = grenzen[i], grenzen[i + 1]
        bereik = f"start={van}" + (f":end={tot}" if tot is not None else "")
        stil = stops[i][1] if i < len(stops) else 0
        beeld = stops[i][2] if i < len(stops) else None
        if stil and beeld is not None:
            fc += (f"[0:v]trim={bereik},setpts=PTS-STARTPTS[d{i}];"
                   f"[0:v]trim=start={beeld}:duration=0.04,setpts=PTS-STARTPTS,"
                   f"tpad=stop_mode=clone:stop_duration={stil}[s{i}];"
                   f"[d{i}][s{i}]concat=n=2:v=1:a=0[v{i}];")
        else:
            fc += (f"[0:v]trim={bereik},setpts=PTS-STARTPTS"
                   + (f",tpad=stop_mode=clone:stop_duration={stil}" if stil else "") + f"[v{i}];")
        venster = muziekvensters(stops[i][0], stemmen, duur) if stil and muziek_volume > 0 else None
        # Na een opgevulde stilstand komt het origineel in 0,25 s op, in plaats van ineens.
        terug = ",afade=t=in:d=0.25" if i > 0 and muziek and muziek[-1] else ""
        if stil and venster:
            fc += (f"[0:a]atrim={bereik},asetpts=PTS-STARTPTS{terug}[g{i}];"
                   + vul_met_muziek(venster, stil + 0.15, i, muziek_volume))
            # Overvloeien in plaats van achter elkaar plakken: het origineel stopte abrupt en de
            # opvulmuziek kwam pas daarna op, wat als een hapering klonk. De opvulling is 0,15 s
            # langer, zodat de stilstand even lang blijft.
            fc += f"[g{i}][m{i}]acrossfade=d=0.15[a{i}];"
            muziek.append(venster)
        else:
            fc += (f"[0:a]atrim={bereik},asetpts=PTS-STARTPTS{terug}"
                   + (f",apad=pad_dur={stil}" if stil else "") + f"[a{i}];")
            if stil:
                muziek.append(None)
        labels += f"[v{i}][a{i}]"
    fc += f"{labels}concat=n={len(grenzen) - 1}:v=1:a=1[v][a]"
    gerekt = werkmap / f"{video.stem} - gerekt.mp4"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video),
                    "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264",
                    "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac",
                    "-b:a", "192k", str(gerekt)], check=True)
    for (p, d, b), m in zip(stops, muziek):
        # Een stilstand midden in een stem knipt het woord door; de rest klinkt na de stilstand
        # als een hapering ("Ja!" bij "Een tegen eenzaamheid", stilstand op 18,70 in 18,35-18,74).
        for s in stemmen:
            if s["start"] < p < s["eind"]:
                print(f"LET OP: stilstand op {p:.2f} valt in een stem ({s['start']:.2f}-{s['eind']:.2f}); "
                      f"zet vasthouden_op_ms na {s['eind']:.2f}")
                break
        print(f"stilstand {d:.2f} s op {p:.2f}"
              + (f", met het beeld van {b:.2f}" if b is not None else "")
              + (", muziek uit " + " ".join(f"{a:.1f}-{b:.1f}" for a, b in m) if m
                 else (", stil (zonder muziek)" if muziek_volume == 0 else ", stil (geen stuk zonder stem)")))
    zinnen = [{**z, "start_ms": int(round(schuif(z["start_ms"] / 1000) * 1000)) + z.get("pauze_ms", 0)}
              for z in zinnen]
    spraak = [{**s, "start": schuif(s["start"]), "eind": schuif(s["eind"])} for s in spraak]

    def tot_stilstand(s: dict) -> float:
        binnen = [p for p, _, _ in stops if s["start"] < p < s["eind"]]
        if not binnen:
            return schuif(s["eind"])
        return binnen[0] + sum(d for p, d, _ in stops if p < binnen[0])
    ondertitels = [{**s, "start": schuif(s["start"]), "eind": tot_stilstand(s)} for s in ondertitels]
    return gerekt, zinnen, spraak, ondertitels


def twee_regels(g: str, naam: str = "") -> list:
    """Hoogstens 44 tekens per regel, en twee regels zo even lang als het kan.

    Eerst brak hij liefst op een zinsgrens en anders zo smal mogelijk; dan kreeg je "In een
    woonkamer met" boven "kerstversiering heeft een kapster", en Frits wilde ze even lang.
    Nu wint het breekpunt met het kleinste verschil; na een punt of komma mag het 6 tekens
    schelen. Een naam vooraan (kleiner gezet) telt voor 70% van zijn lengte.
    """
    if len(g) <= 44:
        return [g]
    woorden = g.split()
    beste, score = None, None
    for k in range(1, len(woorden)):
        a, b = " ".join(woorden[:k]), " ".join(woorden[k:])
        if len(a) > 44 or len(b) > 44:
            continue
        breedte_a = len(a) - (0.3 * (len(naam) + 1) if naam and a.startswith(naam) else 0)
        s = abs(breedte_a - len(b)) - (6 if re.search(r"[.?!,]$", a) else 0)
        if score is None or s < score:
            beste, score = [a, b], s
    return beste or textwrap.wrap(g, 44)


def schrijf_ass(video: Path, klinkt: list, pad: Path, ondertitels: list | None = None) -> None:
    """Ondertitelbestand met de zinnen van de audiodescriptie, op de tijden dat ze klinken.

    Voor video's met ingebrande ondertiteling: een los .srt-bestand zou daar overheen vallen,
    dus de zinnen gaan in hetzelfde beeld. Wit op een dichte zwarte achtergrond onderaan, zodat
    een ingebrande regel die tijdens een stilstand blijft staan eronder wegvalt. Schuin, zoals
    een voice-over in ondertiteling meestal staat: zo is hij van de dialoog te onderscheiden.
    Bedacht bij "Een tegen eenzaamheid" (Valkenswaard, okt 2026). Een lange zin wordt per zin
    in stukken van hoogstens twee regels geknipt, met de tijd naar rato van het aantal tekens.

    Met ondertitels (uit ondertiteling.json) komt de hele ondertiteling opnieuw in beeld, met
    wie er spreekt ervoor: "SARAH: Mooi!", en de audiodescriptie als "VOICE-OVER: ...". De
    ingebrande regels hadden alleen een streepje bij een nieuwe spreker; Frits wilde de namen.
    Dialoog staat recht, alles van de VOICE-OVER schuin.
    """
    ondertitels = ondertitels or []
    ad_spreker = "VOICE-OVER" if ondertitels else ""
    b, h =(int(x) for x in subprocess.check_output(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
         "-of", "csv=p=0", str(video)]).decode().strip().split(","))
    def ts(x: float) -> str:
        cs = int(round(x * 100))
        return f"{cs // 360000}:{cs // 6000 % 60:02}:{cs // 100 % 60:02}.{cs % 100:02}"
    regels = []
    for van, tot, tekst in klinkt:
        groepen, g = [], ""
        for zin in re.split(r"(?<=[.?!])\s+", tekst.strip()):
            if g and len(g) + len(zin) + 1 > 80:
                groepen.append(g)
                g = zin
            else:
                g = f"{g} {zin}".strip()
        groepen.append(g)
        # Een zin die bij 44 tekens per regel meer dan twee regels wordt ("In een woonkamer met
        # kerstversiering heeft een kapster ...") gaat in even lange stukken van twee regels.
        verdeeld = []
        for g in groepen:
            stukken = -(-len(textwrap.wrap(g, 44)) // 2)
            woorden, doel, huidig = g.split(), len(g) / stukken, ""
            for w in woorden:
                if huidig and len(huidig) + len(w) + 1 > doel + 8 and len(verdeeld) < 1000:
                    verdeeld.append(huidig)
                    huidig = w
                else:
                    huidig = f"{huidig} {w}".strip()
            verdeeld.append(huidig)
        groepen = verdeeld
        totaal, t0 = sum(len(x) for x in groepen), van
        for i, g in enumerate(groepen):
            t1 = t0 + (tot - van) * len(g) / totaal
            eind = t1 + (0.3 if i == len(groepen) - 1 else 0)
            regels.append((t0, eind, "AD", ad_spreker, g))
            t0 = t1
    for o in ondertitels:
        stijl = "AD" if o["spreker"] == "VOICE-OVER" else "DIA"
        regels.append((o["start"], o["eind"], stijl, o["spreker"], o["tekst"]))
    # Nooit twee ondertitels tegelijk: elke stopt waar de volgende begint. Anders stond
    # "SARAH: Zo." boven de laatste zin van de audiodescriptie.
    regels.sort()
    regels = [(s, min(e, regels[i + 1][0] - 0.02) if i + 1 < len(regels) else e, st, sp, tk)
              for i, (s, e, st, sp, tk) in enumerate(regels)]
    # De naam alleen bij een nieuwe spreker, en kleiner dan de tekst (Frits: "de namen mogen
    # kleiner"; "VOICE-OVER" bij "Bekijk wat jij kan doen" was dubbel).
    grootte, marge = round(h * 0.052), round(h * 0.027)
    klein = round(grootte * 0.7)
    uit, vorige = [], None
    for s, e, st, sp, tk in regels:
        naam = sp if sp and sp != vorige else ""
        vorige = sp or vorige
        lijnen = twee_regels(f"{naam}: {tk}" if naam else tk, naam)
        if naam:
            lijnen[0] = "{\\fs" + str(klein) + "}" + naam + ":{\\fs" + str(grootte) + "}" + lijnen[0][len(naam) + 1:]
        uit.append(f"Dialogue: 0,{ts(s)},{ts(e)},{st},,0,0,0,," + "\\N".join(lijnen))
    regels = uit
    pad.write_text(
        "[Script Info]\nScriptType: v4.00+\n"
        f"PlayResX: {b}\nPlayResY: {h}\n\n"
        "[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, "
        "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, "
        "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"Style: AD,Arial,{grootte},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,1,0,0,"
        f"100,100,0,0,3,{round(grootte * 0.2)},0,2,40,40,{marge},1\n"
        f"Style: DIA,Arial,{grootte},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,"
        f"100,100,0,0,3,{round(grootte * 0.2)},0,2,40,40,{marge},1\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
        + "\n".join(regels) + "\n", encoding="utf-8")


def zonder_muziek(video: Path, werkmap: Path, vensters: list) -> Path:
    """De video met alleen de gesproken stemmen: muziek en zang eruit.

    Demucs (htdemucs, op de eigen computer) splitst het geluid in stemmen en de rest. Bij "Een
    tegen eenzaamheid" (okt 2026) zat er zang in de muziek, en die kwam in het stemmenspoor
    terecht: ook op momenten zonder dialoog stond daar -28 dB. Daarom telt het stemmenspoor
    alleen binnen de vensters waarin iemand spreekt (uit ondertiteling.json, anders de zinnen
    van Whisper), met korte overgangen; daarbuiten is het stil. Een zin die je weglaat uit
    ondertiteling.json, verdwijnt dus ook uit het geluid.
    """
    import numpy as np
    import soundfile as sf
    wav = werkmap / "origineel.wav"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(video), "-vn", "-ac", "2",
                    "-ar", "44100", str(wav)], check=True)
    stemmen = werkmap / "scheiding" / "htdemucs" / "origineel" / "vocals.wav"
    subprocess.run([sys.executable, "-m", "demucs", "--two-stems=vocals", "-n", "htdemucs",
                    "-o", str(werkmap / "scheiding"), str(wav)], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    audio, sr = sf.read(stemmen)
    hulle = np.zeros(len(audio))
    for a, b in vensters:
        hulle[max(0, int((a - 0.15) * sr)):min(len(audio), int((b + 0.25) * sr))] = 1.0
    k = int(0.04 * sr)  # 40 ms overgang, geen klik
    hulle = np.convolve(hulle, np.ones(k) / k, mode="same")
    sf.write(werkmap / "alleen-stemmen.wav", audio * hulle[:, None], sr)
    uit = werkmap / f"{video.stem} - zonder muziek.mp4"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(video),
                    "-i", str(werkmap / "alleen-stemmen.wav"), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(uit)], check=True)
    print(f"zonder muziek: stemmen alleen binnen {len(vensters)} vensters")
    return uit


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("video", type=Path)
    p.add_argument("--mp3-map", default="audiodescriptie-mp3")
    p.add_argument("--uit", type=Path)
    p.add_argument("--droog", action="store_true", help="alleen controleren, niets maken")
    p.add_argument("--toch", action="store_true", help="ook mengen als een stem overlapt")
    p.add_argument("--verleng", type=float, default=0.0,
                   help="seconden extra aan het eind, met het laatste beeld stil (codeert het beeld opnieuw)")
    p.add_argument("--muziek-volume", type=float, default=0.35,
                   help="sterkte van de muziek die een stilstand opvult, 1 = als het origineel (standaard 0.35)")
    p.add_argument("--tekst-in-beeld", action="store_true",
                   help="brandt de zinnen onder in beeld terwijl ze klinken (codeert het beeld opnieuw)")
    p.add_argument("--zonder-muziek", action="store_true",
                   help="haalt muziek en zang uit het origineel; alleen de sprekers blijven (Demucs)")
    a = p.parse_args()

    video = a.video.resolve()
    map_ = video.parent
    zinnen = json.loads((map_ / "audiodescriptie.json").read_text(encoding="utf-8"))
    analyse_pad = map_ / "analyse" / "analyse.json"
    spraak = json.loads(analyse_pad.read_text(encoding="utf-8"))["spraak"] if analyse_pad.exists() else []
    if not analyse_pad.exists():
        print("Let op: geen analyse/analyse.json, dus geen controle op overlap met sprekers.")
    origineel_naam = video.stem
    werkmap = map_ / "analyse"
    werkmap.mkdir(exist_ok=True)
    # ondertiteling.json naast de video: de dialoog met wie er spreekt, op de tijden van het
    # origineel. Met --tekst-in-beeld wordt de oude ondertitelbalk dan afgedekt en komt alles
    # opnieuw in beeld, met de namen erbij (zie schrijf_ass).
    ot_pad = map_ / "ondertiteling.json"
    ondertitels = [{"start": o["start_ms"] / 1000, "eind": o["eind_ms"] / 1000,
                    "spreker": o.get("spreker", ""), "tekst": o["tekst"]}
                   for o in json.loads(ot_pad.read_text(encoding="utf-8"))] if ot_pad.exists() else []
    if a.zonder_muziek:
        vensters = [(o["start"], o["eind"]) for o in (ondertitels or spraak)]
        video = zonder_muziek(video, werkmap, vensters)
        # Controleer op de echte spraak, maar alleen wat er nog klinkt: een weggelaten zin is
        # ook uit het geluid weg en botst nergens meer mee.
        spraak = [s for s in spraak if any(s["start"] < b and s["eind"] > a for a, b in vensters)]
        a.muziek_volume = 0  # een stilstand blijft stil
    video, zinnen, spraak, ondertitels = rek_dias(video, zinnen, spraak, map_ / a.mp3_map, werkmap,
                                                  a.muziek_volume, ondertitels)

    # Een video zonder gesproken tekst (alleen muziek) krijgt veel zinnen vlak achter elkaar;
    # dan is de botsing met de vorige zin het risico, niet die met een spreker.
    video_duur = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)]
    ).decode().strip()) + a.verleng
    problemen, vorige_eind, vorige_naam, klinkt = [], None, None, []
    for z in sorted(zinnen, key=lambda z: z["start_ms"]):
        mp3 = map_ / a.mp3_map / z["bestand"]
        if not mp3.exists():
            sys.exit(f"Ontbreekt: {mp3}")
        b, e, _ = stem_binnen_mp3(mp3)
        van, tot = z["start_ms"] / 1000 + b, z["start_ms"] / 1000 + e
        botsing = [s for s in spraak if s["start"] < tot and s["eind"] > van]
        marge = min((s["start"] - tot for s in spraak if s["start"] >= tot), default=None)
        regel = f"{z['bestand']:10s} stem {van:6.2f}-{tot:6.2f}"
        if vorige_eind is not None and van < vorige_eind + 0.2:
            regel += f"  OVERLAPT met {vorige_naam} (die eindigt op {vorige_eind:.2f})"
            problemen.append(z["bestand"])
        elif tot > video_duur - 0.2:
            regel += f"  LOOPT DOOR na het einde van de video ({video_duur:.2f}); gebruik --verleng"
            problemen.append(z["bestand"])
        elif botsing:
            s = botsing[0]
            regel += f"  OVERLAPT met spraak {s['start']:.2f}-{s['eind']:.2f}: {s['tekst'][:40]}"
            problemen.append(z["bestand"])
        elif marge is not None:
            regel += f"  vrij, {marge:.2f} s voor de volgende spreker"
        print(regel)
        vorige_eind, vorige_naam = tot, z["bestand"]
        klinkt.append((van, tot, z["tekst"].replace("*", "")))  # *klemtoon* niet in beeld

    if problemen and not a.toch:
        sys.exit(f"Niet gemengd: {', '.join(problemen)} overlapt. Schuif start_ms of kort de tekst in.")
    if a.droog:
        return

    uit = (a.uit or map_ / f"{origineel_naam} - met audiodescriptie.mp4").resolve()
    invoer, fc = ["-i", str(video)], ""
    for i, z in enumerate(zinnen, 1):
        invoer += ["-i", str(map_ / a.mp3_map / z["bestand"])]
        fc += f"[{i}:a]adelay={z['start_ms']}:all=1[a{i}];"
    n = len(zinnen)
    fc += "".join(f"[a{i}]" for i in range(1, n + 1))
    # Verlengen: de eindkaart (logo) blijft staan zodat de laatste zin erin past. Het
    # oorspronkelijke geluid krijgt stilte erachter, anders kapt amix af op zijn lengte.
    origineel = f"[0:a]apad=pad_dur={a.verleng}[orig];[orig]" if a.verleng else "[0:a]"
    fc += (f"amix=inputs={n}:normalize=0,apad[ad];[ad]asplit[ad1][ad2];"
           f"{origineel}[ad1]sidechaincompress=threshold=0.02:ratio=8:attack=50:release=600[duck];"
           "[duck][ad2]amix=inputs=2:normalize=0:duration=first[aout]")
    vfilters = []
    if a.verleng:
        vfilters.append(f"tpad=stop_mode=clone:stop_duration={a.verleng}")
    if a.tekst_in_beeld:
        schrijf_ass(video, klinkt, werkmap / "ad-tekst.ass", ondertitels)
        if ondertitels:
            # De ingebrande regels zonder namen verdwijnen onder een zwarte balk.
            vfilters.append("drawbox=x=0:y=ih*0.865:w=iw:h=ih*0.135:color=black:t=fill")
        vfilters.append("ass=ad-tekst.ass")  # relatief: ffmpeg draait in de werkmap
    if vfilters:
        fc += f";[0:v]{','.join(vfilters)}[vout]"
        beeld = ["-map", "[vout]", "-c:v", "libx264", "-crf", "18", "-preset", "medium",
                 "-pix_fmt", "yuv420p"]
    else:
        beeld = ["-map", "0:v", "-c:v", "copy"]
    # In de werkmap draaien: een Windows-pad met dubbele punt in het ass-filter vraagt om
    # ontsnappingen die per shell verschillen. Alle andere paden zijn absoluut.
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *invoer,
                    "-filter_complex", fc, *beeld, "-map", "[aout]",
                    "-c:a", "aac", "-b:a", "192k", str(uit)], check=True, cwd=werkmap)
    print(f"Klaar: {uit}")


if __name__ == "__main__":
    sys.exit(main())

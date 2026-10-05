#!/usr/bin/env python3
"""Audiodescriptie in een video mengen, en controleren dat hij niemand overstemt.

Gebruik
-------
    python scripts/video-inmengen.py <video.mp4> [--mp3-map audiodescriptie-mp3] [--droog]
                                     [--verleng 1.5]

Een zin mag in audiodescriptie.json ook "tot_ms" en "vasthouden_op_ms" hebben: dan blijft het
beeld op dat moment stilstaan tot de zin past (zie rek_dias). Voor tekstdia's die te kort in
beeld staan om voor te lezen.

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


def rek_dias(video: Path, zinnen: list, spraak: list, mp3_map: Path, werkmap: Path):
    """Laat het beeld stilstaan waar een zin langer is dan zijn dia in beeld staat.

    Een zin met "tot_ms" (tot wanneer zijn dia in het origineel te zien is) en
    "vasthouden_op_ms" (een moment waarop de dia volledig in beeld staat) krijgt zoveel
    stilstand als nodig is om de zin 0,3 s voor het einde van de dia af te ronden. Alles na
    zo'n punt schuift op; dat geldt ook voor de start_ms van latere zinnen en voor de spraak
    uit de analyse. Bedacht voor "Heeze-Leende duurzaam vooruit 2025": elf tekstdia's van
    ongeveer een seconde, zonder geluid, waarin een voice-over anders steeds verder achterliep.
    Geeft (nieuwe video, zinnen, spraak) terug; zonder vasthoudpunten verandert er niets.
    """
    stops = []
    for z in zinnen:
        if "tot_ms" not in z or "vasthouden_op_ms" not in z:
            continue
        _, e, _ = stem_binnen_mp3(mp3_map / z["bestand"])
        nodig = z["start_ms"] / 1000 + e + 0.3 - z["tot_ms"] / 1000
        if nodig > 0:
            stops.append((z["vasthouden_op_ms"] / 1000, round(nodig, 3)))
    if not stops:
        return video, zinnen, spraak
    stops.sort()

    def schuif(t: float) -> float:
        return t + sum(d for p, d in stops if p <= t)

    grenzen = [0.0] + [p for p, _ in stops] + [None]
    fc, labels = "", ""
    for i in range(len(grenzen) - 1):
        van, tot = grenzen[i], grenzen[i + 1]
        bereik = f"start={van}" + (f":end={tot}" if tot is not None else "")
        stil = stops[i][1] if i < len(stops) else 0
        fc += (f"[0:v]trim={bereik},setpts=PTS-STARTPTS"
               + (f",tpad=stop_mode=clone:stop_duration={stil}" if stil else "") + f"[v{i}];")
        fc += (f"[0:a]atrim={bereik},asetpts=PTS-STARTPTS"
               + (f",apad=pad_dur={stil}" if stil else "") + f"[a{i}];")
        labels += f"[v{i}][a{i}]"
    fc += f"{labels}concat=n={len(grenzen) - 1}:v=1:a=1[v][a]"
    gerekt = werkmap / f"{video.stem} - gerekt.mp4"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video),
                    "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264",
                    "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac",
                    "-b:a", "192k", str(gerekt)], check=True)
    for p, d in stops:
        print(f"stilstand {d:.2f} s op {p:.2f}")
    zinnen = [{**z, "start_ms": int(round(schuif(z["start_ms"] / 1000) * 1000))} for z in zinnen]
    spraak = [{**s, "start": schuif(s["start"]), "eind": schuif(s["eind"])} for s in spraak]
    return gerekt, zinnen, spraak


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("video", type=Path)
    p.add_argument("--mp3-map", default="audiodescriptie-mp3")
    p.add_argument("--uit", type=Path)
    p.add_argument("--droog", action="store_true", help="alleen controleren, niets maken")
    p.add_argument("--toch", action="store_true", help="ook mengen als een stem overlapt")
    p.add_argument("--verleng", type=float, default=0.0,
                   help="seconden extra aan het eind, met het laatste beeld stil (codeert het beeld opnieuw)")
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
    video, zinnen, spraak = rek_dias(video, zinnen, spraak, map_ / a.mp3_map, werkmap)

    # Een video zonder gesproken tekst (alleen muziek) krijgt veel zinnen vlak achter elkaar;
    # dan is de botsing met de vorige zin het risico, niet die met een spreker.
    video_duur = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)]
    ).decode().strip()) + a.verleng
    problemen, vorige_eind, vorige_naam = [], None, None
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

    if problemen and not a.toch:
        sys.exit(f"Niet gemengd: {', '.join(problemen)} overlapt. Schuif start_ms of kort de tekst in.")
    if a.droog:
        return

    uit = a.uit or map_ / f"{origineel_naam} - met audiodescriptie.mp4"
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
    if a.verleng:
        fc += f";[0:v]tpad=stop_mode=clone:stop_duration={a.verleng}[vout]"
        beeld = ["-map", "[vout]", "-c:v", "libx264", "-crf", "18", "-preset", "medium",
                 "-pix_fmt", "yuv420p"]
    else:
        beeld = ["-map", "0:v", "-c:v", "copy"]
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *invoer,
                    "-filter_complex", fc, *beeld, "-map", "[aout]",
                    "-c:a", "aac", "-b:a", "192k", str(uit)], check=True)
    print(f"Klaar: {uit}")


if __name__ == "__main__":
    sys.exit(main())

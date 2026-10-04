#!/usr/bin/env python3
"""Audiodescriptie in een video mengen, en controleren dat hij niemand overstemt.

Gebruik
-------
    python scripts/video-inmengen.py <video.mp4> [--mp3-map audiodescriptie-mp3] [--droog]

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


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("video", type=Path)
    p.add_argument("--mp3-map", default="audiodescriptie-mp3")
    p.add_argument("--uit", type=Path)
    p.add_argument("--droog", action="store_true", help="alleen controleren, niets maken")
    p.add_argument("--toch", action="store_true", help="ook mengen als een stem overlapt")
    a = p.parse_args()

    video = a.video.resolve()
    map_ = video.parent
    zinnen = json.loads((map_ / "audiodescriptie.json").read_text(encoding="utf-8"))
    analyse_pad = map_ / "analyse" / "analyse.json"
    spraak = json.loads(analyse_pad.read_text(encoding="utf-8"))["spraak"] if analyse_pad.exists() else []
    if not spraak:
        print("Let op: geen analyse/analyse.json, dus geen controle op overlap met sprekers.")

    problemen = []
    for z in zinnen:
        mp3 = map_ / a.mp3_map / z["bestand"]
        if not mp3.exists():
            sys.exit(f"Ontbreekt: {mp3}")
        b, e, _ = stem_binnen_mp3(mp3)
        van, tot = z["start_ms"] / 1000 + b, z["start_ms"] / 1000 + e
        botsing = [s for s in spraak if s["start"] < tot and s["eind"] > van]
        marge = min((s["start"] - tot for s in spraak if s["start"] >= tot), default=None)
        regel = f"{z['bestand']:10s} stem {van:6.2f}-{tot:6.2f}"
        if botsing:
            s = botsing[0]
            regel += f"  OVERLAPT met spraak {s['start']:.2f}-{s['eind']:.2f}: {s['tekst'][:40]}"
            problemen.append(z["bestand"])
        elif marge is not None:
            regel += f"  vrij, {marge:.2f} s voor de volgende spreker"
        print(regel)

    if problemen and not a.toch:
        sys.exit(f"Niet gemengd: {', '.join(problemen)} overlapt. Schuif start_ms of kort de tekst in.")
    if a.droog:
        return

    uit = a.uit or map_ / f"{video.stem} - met audiodescriptie.mp4"
    invoer, fc = ["-i", str(video)], ""
    for i, z in enumerate(zinnen, 1):
        invoer += ["-i", str(map_ / a.mp3_map / z["bestand"])]
        fc += f"[{i}:a]adelay={z['start_ms']}:all=1[a{i}];"
    n = len(zinnen)
    fc += "".join(f"[a{i}]" for i in range(1, n + 1))
    fc += (f"amix=inputs={n}:normalize=0,apad[ad];[ad]asplit[ad1][ad2];"
           "[0:a][ad1]sidechaincompress=threshold=0.02:ratio=8:attack=50:release=600[duck];"
           "[duck][ad2]amix=inputs=2:normalize=0:duration=first[aout]")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *invoer,
                    "-filter_complex", fc, "-map", "0:v", "-map", "[aout]",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", str(uit)], check=True)
    print(f"Klaar: {uit}")


if __name__ == "__main__":
    sys.exit(main())

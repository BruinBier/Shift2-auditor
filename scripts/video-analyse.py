#!/usr/bin/env python3
"""Een video voorbereiden op audiodescriptie, ondertiteling en transcript.

Gebruik
-------
    python scripts/video-analyse.py <video.mp4> [--hint "namen, vaktermen"] [--uit map]
                                    [--model large-v3] [--min-ruimte 1.5]

Schrijft naar <videomap>/analyse/ (of --uit):
- analyse.json            gesproken zinnen met tijden, de ruimtes ertussen, de scènes
- ondertiteling-concept.srt  eerste versie van de ondertiteling, om na te lopen
- overzicht_N.jpg         één beeldje per seconde met tijdstempel, 24 per vel

Waarom dit bestaat
------------------
Voor de A2-gemeenten (Cranendonck, Heeze-Leende, Valkenswaard) ging dit tot oktober 2026 met
de hand: de video bekijken, tekst in beeld noteren, stille momenten zoeken in Premiere. Drie
dingen bleken onderweg niet te werken en staan hier daarom anders:

1. Stilte meten (ffmpeg silencedetect) zegt niets: bijna elke video heeft muziek onder het
   beeld. Op het Energiefestival vond het alleen de laatste 3,5 seconde. "Ruimte" is daarom
   de tijd tussen twee gesproken zinnen, niet de tijd zonder geluid.
2. De begintijd van een zin zoals Whisper hem per segment geeft, plakt soms aan het einde van
   de vorige zin (0:33,5 waar de spreker pas op 0:36,5 begon). Daarom rekenen we met de
   tijden van het eerste en laatste woord.
3. Namen en vaktermen worden slecht verstaan ("IJspoede", "huisluisteraar", "Heesleen").
   Geef ze mee met --hint, uit de naambalkjes die je op de overzichtsvellen ziet. Draai dus
   eerst zonder hint, kijk naar de vellen, en draai dan nog eens mét.

Het geluid gaat via ffmpeg naar het model: de eigen decoder van faster-whisper (PyAV) brak
op deze computer met "unexpected keyword argument 'metadata_errors'".

Vereist: ffmpeg op het pad (winget install Gyan.FFmpeg) en de modules uit requirements.txt.
Het model draait lokaal; de video gaat nergens naartoe.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel
from scenedetect import ContentDetector, detect


def srt_tijd(s: float) -> str:
    ms = int(round(s * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    sec, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("video", type=Path)
    p.add_argument("--hint", default="", help="namen en vaktermen die in de video vallen")
    p.add_argument("--uit", type=Path)
    p.add_argument("--model", default="large-v3")
    p.add_argument("--min-ruimte", type=float, default=1.5, help="kleinste ruimte in seconden")
    a = p.parse_args()

    video = a.video.resolve()
    uit = (a.uit or video.parent / "analyse").resolve()
    uit.mkdir(parents=True, exist_ok=True)

    duur = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)]
    ).decode().strip())

    # 1. Spraak, met woordtijden
    pcm = subprocess.check_output(["ffmpeg", "-loglevel", "error", "-i", str(video), "-vn",
                                   "-ac", "1", "-ar", "16000", "-f", "s16le", "-"])
    geluid = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    segs, _ = model.transcribe(geluid, language="nl", vad_filter=True, word_timestamps=True,
                               beam_size=5, initial_prompt=a.hint or None)
    spraak = []
    for s in segs:
        woorden = [w for w in (s.words or []) if w.word.strip()]
        start = woorden[0].start if woorden else s.start
        eind = woorden[-1].end if woorden else s.end
        spraak.append({"start": round(start, 2), "eind": round(eind, 2), "tekst": s.text.strip()})

    with open(uit / "ondertiteling-concept.srt", "w", encoding="utf-8") as f:
        for i, s in enumerate(spraak, 1):
            f.write(f"{i}\n{srt_tijd(s['start'])} --> {srt_tijd(s['eind'])}\n{s['tekst']}\n\n")

    # 2. Ruimte tussen de zinnen
    ruimte, vorige = [], 0.0
    for s in spraak + [{"start": duur, "eind": duur}]:
        if s["start"] - vorige >= a.min_ruimte:
            ruimte.append({"start": round(vorige, 2), "eind": round(s["start"], 2),
                           "duur": round(s["start"] - vorige, 2)})
        vorige = max(vorige, s["eind"])

    # 3. Scènes
    scenes = [{"start": round(b.get_seconds(), 2), "eind": round(e.get_seconds(), 2)}
              for b, e in detect(str(video), ContentDetector(threshold=27))]

    # Eerst wegschrijven: de spraakherkenning duurt minuten, de vellen hieronder kunnen falen
    json.dump({"video": video.name, "duur": round(duur, 2), "hint": a.hint, "spraak": spraak,
               "ruimte": ruimte, "scenes": scenes},
              open(uit / "analyse.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    # 4. Overzichtsvellen: één beeldje per seconde met tijdstempel. De dubbele backslash voor
    # de dubbele punt in het lettertypepad is nodig: één voor de optie, één voor de filtergraaf.
    for oud in uit.glob("overzicht_*.jpg"):
        oud.unlink()
    vellen = int(duur // 24) + 1
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(video), "-vf",
                    "fps=1,scale=480:-1,drawtext=fontfile=C\\\\:/Windows/Fonts/arial.ttf:"
                    "text='%{pts\\:hms}':x=5:y=5:fontsize=22:fontcolor=yellow:box=1:boxcolor=black,"
                    "tile=4x6", "-frames:v", str(vellen), str(uit / "overzicht_%d.jpg")], check=True)

    print(json.dumps({"uit": str(uit), "duur": round(duur, 2), "zinnen": len(spraak),
                      "ruimtes": ruimte, "scenes": len(scenes), "vellen": vellen},
                     ensure_ascii=False, indent=1))


if __name__ == "__main__":
    sys.exit(main())

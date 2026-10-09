#!/usr/bin/env python3
"""De zinnen van een audiodescriptie inspreken met Azure Speech.

Gebruik
-------
    python scripts/video-stem.py <videomap> [--stem nl-NL-MaartenNeural] [--env pad/azure.env]

Leest <videomap>/audiodescriptie.json:

    [{"bestand": "0m18.mp3", "start_ms": 18300, "tekst": "Lars Boelen, Huisfluisteraar."}]

en schrijft elk bestand naar <videomap>/audiodescriptie-mp3/. Een woord tussen sterretjes
(*haar*) krijgt de klemtoon, zie klemtoon(). `start_ms` gebruikt dit script
niet; dat is voor scripts/video-inmengen.py.

Waarom Azure
------------
Tot oktober 2026 ging dit met Narakeet in de browser: per zin typen, op Create klikken,
downloaden. LuvVoice biedt dezelfde Microsoft-stemmen (Maarten, Fenna, Colette) maar zet er een
robotcontrole van Cloudflare voor, die een agent niet hoort in te vullen. Azure is de bron van
die stemmen, met een gratis tegoed van 500.000 tekens per maand (prijscategorie F0). De
resource heet shift2-spraak, regio North Europe; West Europe nam bij het aanmaken geen nieuwe
klanten aan.

De sleutel staat in azure.env (AZURE_SPEECH_KEY en AZURE_SPEECH_REGION), standaard in de
bovenmap van de videomap: Downloads/video A2-gemeenten/azure.env. Buiten de repo, dus nooit in
git. Dit script drukt de sleutel nergens af.
"""
import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape


def lees_env(pad: Path) -> dict:
    env = {}
    for regel in pad.read_text(encoding="utf-8-sig").splitlines():
        if "=" in regel and not regel.strip().startswith("#"):
            k, v = regel.split("=", 1)
            env[k.strip()] = v.strip().strip('"')
    return env


def klemtoon(tekst: str) -> str:
    """Een woord tussen sterretjes krijgt de klemtoon: *haar* wordt hoger, iets luider en trager.

    Azure kent <emphasis> alleen voor Engelse en Chinese stemmen; Maarten negeert het. In "heeft
    een kapster het haar gedaan" las hij "haar" als voornaamwoord ("Een tegen eenzaamheid",
    okt 2026). video-inmengen.py haalt de sterretjes weg voor de tekst in beeld.
    """
    return re.sub(r"\*([^*]+)\*", r"<prosody pitch='+12%' volume='+25%' rate='-8%'>\1</prosody>", tekst)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("videomap", type=Path)
    p.add_argument("--stem", default="nl-NL-MaartenNeural")
    p.add_argument("--env", type=Path)
    a = p.parse_args()

    map_ = a.videomap.resolve()
    env_pad = a.env or map_.parent / "azure.env"
    if not env_pad.exists():
        sys.exit(f"Geen azure.env gevonden op {env_pad}")
    env = lees_env(env_pad)
    sleutel, regio = env.get("AZURE_SPEECH_KEY"), env.get("AZURE_SPEECH_REGION")
    if not sleutel or not regio:
        sys.exit(f"{env_pad} mist AZURE_SPEECH_KEY of AZURE_SPEECH_REGION")

    zinnen = json.loads((map_ / "audiodescriptie.json").read_text(encoding="utf-8"))
    uit = map_ / "audiodescriptie-mp3"
    uit.mkdir(exist_ok=True)
    taal = "-".join(a.stem.split("-")[:2])

    for z in zinnen:
        ssml = (f"<speak version='1.0' xml:lang='{taal}'><voice name='{a.stem}'>"
                f"{klemtoon(escape(z['tekst']))}</voice></speak>")
        req = urllib.request.Request(
            f"https://{regio}.tts.speech.microsoft.com/cognitiveservices/v1",
            data=ssml.encode("utf-8"),
            headers={"Ocp-Apim-Subscription-Key": sleutel,
                     "Content-Type": "application/ssml+xml",
                     "X-Microsoft-OutputFormat": "audio-48khz-192kbitrate-mono-mp3",
                     "User-Agent": "shift2-video"})
        try:
            data = urllib.request.urlopen(req, timeout=30).read()
        except urllib.error.HTTPError as e:
            sys.exit(f"Azure gaf {e.code} bij {z['bestand']}: {e.read()[:200]!r}")
        (uit / z["bestand"]).write_bytes(data)
        print(f"{z['bestand']}  {len(data)} bytes  {z['tekst']}")


if __name__ == "__main__":
    sys.exit(main())

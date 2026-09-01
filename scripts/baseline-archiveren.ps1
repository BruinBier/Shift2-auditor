# Zet de oude migratiegeschiedenis opzij. Draai dit vanuit de projectmap.
#
# Waarom: de geschiedenis is niet meer na te spelen. De eerste migratie verwijst
# naar een tabel die pas twintig migraties later wordt aangemaakt, tien tabellen
# staan in geen enkele migratie, en `prisma migrate dev` zou daarop stuklopen en
# aanbieden de database te resetten. Dat wil je nooit per ongeluk beantwoorden.
#
# Wat er NIET gebeurt: dit raakt de database niet. Het verplaatst bestanden.
$ErrorActionPreference = 'Stop'

$houden = @('20260901000000_baseline', '20260901000001_baseline_seed')

New-Item -ItemType Directory -Force -Path 'docs/migraties-archief' | Out-Null

foreach ($map in Get-ChildItem -Directory 'prisma/migrations') {
    if ($houden -contains $map.Name) { continue }
    git mv $map.FullName "docs/migraties-archief/$($map.Name)"
}

# De losse handmatige patches uit januari gaan mee: ze zijn allemaal al in het
# schema verwerkt en worden nergens aangeroepen.
foreach ($bestand in Get-ChildItem -File '*.sql') {
    git mv $bestand.FullName "docs/migraties-archief/los-$($bestand.Name)"
}

Write-Output 'Klaar. Over in prisma/migrations:'
Get-ChildItem 'prisma/migrations' -Name

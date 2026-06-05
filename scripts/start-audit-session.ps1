# Audit-sessie starten - een-klik launcher voor de audit-CLI.
#
# Wat dit script doet:
#   1. Controleert of Chrome al draait op debug-poort 9222 (vorige sessie)
#   2. Zo niet: start Chrome met remote debugging in een aparte profiel-map
#   3. Wacht tot Chrome klaar is om verbinding te accepteren
#   4. Houdt het venster open zodat je het kunt minimaliseren tijdens je audit
#
# Sluit dit venster om de sessie te beeindigen.

$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectDir

Write-Host ""
Write-Host "  Shift2 Audit-sessie" -ForegroundColor Cyan
Write-Host "  ===================" -ForegroundColor Cyan
Write-Host ""

function Test-DebugChromeReady {
    try {
        $r = Invoke-WebRequest -Uri 'http://localhost:9222/json/version' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        return ($r.StatusCode -eq 200)
    } catch {
        return $false
    }
}

# Stap 1 - check of Chrome al op poort 9222 draait
$alreadyRunning = Test-DebugChromeReady

if ($alreadyRunning) {
    Write-Host "  [OK] Chrome draait al op poort 9222 - sessie hergebruikt." -ForegroundColor Green
} else {
    Write-Host "  [..] Chrome wordt gestart met debug-poort 9222..." -ForegroundColor Yellow
    Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','chrome:debug' -WindowStyle Hidden

    # Wacht tot Chrome de debug-poort heeft geopend (max 15s)
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-DebugChromeReady) {
            $ready = $true
            break
        }
    }
    if ($ready) {
        Write-Host "  [OK] Chrome staat klaar op http://localhost:9222" -ForegroundColor Green
    } else {
        Write-Host "  [!!] Chrome reageerde niet binnen 15 seconden - check handmatig." -ForegroundColor Red
        Write-Host ""
        Read-Host "Druk Enter om af te sluiten"
        exit 1
    }
}

Write-Host ""
Write-Host "  Audit-sessie is actief." -ForegroundColor Cyan
Write-Host ""
Write-Host "  - Het Chrome-venster mag je gebruiken om in te loggen op gemeentesites." -ForegroundColor Gray
Write-Host "  - Tijdens je gesprek met Claude haalt de CLI automatisch HTML en screenshots op." -ForegroundColor Gray
Write-Host "  - Dit venster mag je minimaliseren, maar laat het OPEN staan." -ForegroundColor Gray
Write-Host ""
Write-Host "  Sluiten? Druk Ctrl+C of sluit dit venster." -ForegroundColor DarkGray
Write-Host ""

# Houd het venster open zonder CPU te branden
while ($true) { Start-Sleep -Seconds 60 }

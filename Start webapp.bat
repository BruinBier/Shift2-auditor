@echo off
REM Dubbelklik dit bestand om de Shift2 Auditor webapp lokaal te starten.
REM Opent de Next.js dev server op http://localhost:3000
cd /d "%~dp0"
echo Shift2 Auditor wordt gestart...
echo Open straks in je browser: http://localhost:3000
echo (Dit venster open laten. Sluiten = server stoppen.)
echo.
call npm run dev
pause

@echo off
REM Dubbelklik dit bestand om een audit-sessie te starten.
REM Start Chrome met debug-poort zodat de audit-CLI er verbinding mee maakt.
cd /d "%~dp0"
powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0scripts\start-audit-session.ps1"

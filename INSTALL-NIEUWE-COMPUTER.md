# Shift2-auditor installeren op een nieuwe computer

Stappenplan voor Windows met PowerShell. Doorlopen op 1 augustus 2026.

## Belangrijk vooraf

De database draait bij **Neon** (cloud), niet lokaal. Je hoeft dus geen PostgreSQL
te installeren en geen data over te zetten. Alle computers werken in dezelfde
database: wat je op de een aanpast, zie je op de ander.

> Draai daarom nooit op twee computers tegelijk `npm run restore` — dat overschrijft data.

## 1. Node.js installeren

Controleer eerst of het er al op staat:

```powershell
node -v
```

Krijg je "is not recognized", installeer dan Node.js:

1. Ga naar https://nodejs.org
2. Kies de **LTS**-versie (niet "Latest Release")
3. Kies **Windows Installer (.msi)**, architectuur **x64**
4. Bij het scherm **"Tools for Native Modules"**: het vinkje *uit* laten staan.
   Dat installeert Python en Visual Studio Build Tools (enkele GB, half uur)
   en is voor dit project niet nodig.
5. Sluit PowerShell en **open een nieuw venster** — anders wordt `node` niet herkend

## 2. Git installeren

```powershell
git --version
```

Zo niet: https://git-scm.com/download/win → "Click here to download".

Alle schermen op de standaardinstelling laten staan. Twee waar je langskomt:

- **Default branch name**: "Let Git decide"
- **PATH environment**: de middelste optie, "Git from the command line and also from 3rd-party software"

Daarna weer een **nieuw PowerShell-venster** openen.

## 3. PowerShell scripts toestaan

Windows blokkeert standaard het uitvoeren van scripts, waardoor `npm` faalt met
*"running scripts is disabled on this system"*. Eenmalig oplossen:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Bevestig met `J` (of `Y`). Dit geldt alleen voor je eigen gebruikersaccount.

## 4. Project ophalen

```powershell
New-Item -ItemType Directory -Force $HOME\IdeaProjects
cd $HOME\IdeaProjects
git clone https://github.com/BruinBier/Shift2-auditor.git
cd Shift2-auditor
git checkout claude/audit-tool-mvp-J2LaR
```

## 5. Het .env-bestand overzetten

Dit is de enige handmatige stap. `.env` staat bewust niet in Git, want er staan
wachtwoorden en API-sleutels in.

Kopieer `.env` uit de projectmap van de andere computer naar de nieuwe projectmap
(USB-stick of beveiligde map in Drive).

**Let op twee valkuilen:**

- Windows Verkenner laat de punt aan het begin nogal eens vallen, waardoor het
  bestand `env` gaat heten in plaats van `.env`
- Kladblok plakt er soms `.txt` achter

Controleren:

```powershell
Get-ChildItem -Force *env*
```

Heet het verkeerd, dan hernoemen:

```powershell
Rename-Item env .env
```

Het bestand hoort zes instellingen te bevatten: `DATABASE_URL`, `OPENAI_API_KEY`,
`GITHUB_TOKEN`, `GITHUB_PROJECT_OWNER`, `GITHUB_PROJECT_OWNER_TYPE` en
`GITHUB_PROJECT_NUMBER`.

## 6. Installeren en starten

```powershell
npm install
```

Duurt een paar minuten; Puppeteer haalt een eigen Chrome binnen (~200 MB).
Waarschuwingen over `deprecated` en `vulnerabilities` kun je negeren.
`prisma generate` draait automatisch mee.

```powershell
npm run dev
```

Open http://localhost:3000

Migraties hoef je niet te draaien: de Neon-database bestaat al met alle tabellen
en data. Alleen na een wijziging in `prisma/schema.prisma` draai je
`npm run schema:update`.

## Dagelijks opstarten

```powershell
cd $HOME\IdeaProjects\Shift2-auditor
npm run dev
```

Stoppen met Ctrl+C. Laat het venster openstaan zolang je werkt; voor andere
commando's open je een tweede PowerShell-venster.

## Optioneel

- **Editor** — niet nodig om de tool te gebruiken. IntelliJ IDEA Community
  ondersteunt TypeScript niet goed; VS Code is gratis en werkt prima met
  Next.js en Prisma.
- **Claude Code** — apart installeren als je er ook met Claude wilt werken
- **Chrome** — nodig voor `npm run chrome:debug` bij de audit-CLI
- **Code bijwerken** — `git pull` om wijzigingen van de andere computer op te halen

## Bekende Windows-valkuil

Stop de dev-server (Ctrl+C) vóór je `npx prisma generate` draait, anders krijg
je een EPERM-fout.

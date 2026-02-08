# Workflow Gids - Shift2 Auditor

Deze gids legt uit hoe je veilig met de database en Prisma werkt, zodat je begrijpt wat er gebeurt en controle houdt.

## Wat is het probleem?

### Het Prisma Generate Probleem (Windows)

**Wat is Prisma?**
- Prisma is een tool die een "brug" maakt tussen je code en de database
- Het leest `prisma/schema.prisma` (je database structuur)
- Het genereert TypeScript code in `node_modules/.prisma/client`
- Deze code gebruik je in je app om met de database te praten

**Waarom gaat het vaak mis op Windows?**
```
1. Je draait "npm run dev" (dev server start)
2. De dev server gebruikt Prisma client bestanden
3. Windows "locked" deze bestanden (ze zijn in gebruik)
4. Je wijzigt schema.prisma
5. Je probeert "npx prisma generate"
6. ❌ EPERM error - Windows kan de bestanden niet vervangen (ze zijn nog locked)
```

**De oplossing:**
Stop de dev server → Genereer → Start opnieuw

## Jouw Dagelijkse Workflow

### Scenario 1: Gewoon werken (GEEN schema wijzigingen)

```bash
# In je terminal (of IntelliJ terminal)
npm run dev

# Werk in IntelliJ, sla op, test in browser
# Als je klaar bent:
git add .
git commit -m "beschrijving van wijzigingen"
git push
```

**Wat gebeurt er:**
- Next.js dev server draait op localhost:3000
- Hot reload werkt - wijzigingen worden direct zichtbaar
- Database blijft gewoon werken

### Scenario 2: Schema wijzigen (database structuur aanpassen)

**Belangrijk:** In 99% van de gevallen vraag JIJ Claude (in IntelliJ AI) om het schema te wijzigen.
Dan is het de **verantwoordelijkheid van Claude** om deze stappen correct te volgen!

#### Als JIJ Claude vraagt om schema te wijzigen:

**Wat jij zegt:**
> "Claude, voeg een nieuw veld `status` toe aan de Project model"

**Wat Claude moet doen:**
1. ✅ Eerst VRAGEN: "Is de dev server gestopt? Zo niet, stop hem met Ctrl+C"
2. ✅ Schema wijzigen (prisma/schema.prisma)
3. ✅ Migration maken
4. ✅ Zeggen: "Nu kun je `npm run schema:update` draaien, daarna `npm run dev`"

**Wat jij doet:**
```bash
# Als dev server nog draait:
Ctrl+C

# Dan:
npm run schema:update

# Wacht tot klaar, dan:
npm run dev
```

#### Als JIJ zelf het schema wilt wijzigen (zonder Claude):

**Stap 1: Stop de dev server**
```bash
# In de terminal waar npm run dev draait:
Ctrl+C

# Wacht tot je ziet: "Process terminated" of prompt terug is
```

**Waarom:** Anders krijg je file lock errors.

**Stap 2: Wijzig het schema**
```bash
# Open in IntelliJ: prisma/schema.prisma
# Maak je wijzigingen (bijvoorbeeld nieuw veld toevoegen)
# Sla op (Ctrl+S)
```

**Stap 3: Gebruik het helper script**
```bash
npm run schema:update
```

**Wat doet dit script:**
1. ✅ Past de database aan met migrations
2. ✅ Genereert nieuwe Prisma client
3. ✅ Geeft bericht wanneer klaar

**Stap 4: Start dev server opnieuw**
```bash
npm run dev
```

**Stap 5: Controleer dat het werkt**
```bash
# Open browser: localhost:3000
# Test je wijzigingen
# Check console voor errors
```

**Stap 6: Commit naar GitHub**
```bash
git add prisma/schema.prisma
git add prisma/migrations/*    # Nieuwe migration mee
git commit -m "feat: [beschrijf je schema wijziging]"
git push
```

### Scenario 3: Er gaat iets mis met de database

#### Probleem: "Prisma client not generated" error

**Symptomen:**
- App crasht met "Cannot find module '@prisma/client'"
- Of TypeScript errors over Prisma types

**Oplossing:**
```bash
npm run db:fix
```

**Wat doet dit:**
1. Stopt dev server
2. Regenereert Prisma client
3. Start dev server

#### Probleem: Migration errors

**Symptomen:**
- "Migration failed" bij schema update
- Database en schema komen niet overeen

**Oplossing:**
```bash
# Check status
npx prisma migrate status

# Als migrations niet toegepast:
npx prisma migrate deploy

# Als echt vastgelopen (LET OP: kan data verliezen!):
npx prisma migrate reset
npm run db:seed  # Zet WCAG criteria terug
```

**⚠️ WAARSCHUWING:** `migrate reset` verwijdert ALLE data!

#### Probleem: PostgreSQL draait niet

**Symptomen:**
- "Can't reach database server"
- Connection timeout errors

**Oplossing:**
```bash
# Check of PostgreSQL draait
npm run db:check

# Als PostgreSQL gestopt is:
# Windows: Start "Services" → zoek "postgresql" → Start
# Of herstart je computer
```

## Helper Scripts - Wat doet elk script?

### Development
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build           # Maak production build (voor deployment)
```

### Database Basics
```bash
npm run db:studio       # Open visuele database editor (Prisma Studio)
npm run db:seed         # Vul WCAG criteria en research types in
npm run db:check        # Check of database bereikbaar is
```

### Schema Updates (gebruik deze!)
```bash
npm run schema:update   # Veilig schema updaten (stopt server, migreert, genereert, start)
npm run db:fix          # Fix "client not generated" errors
```

### Backup & Restore
```bash
npm run backup          # Export alle data naar JSON (in data/backup/)
npm run restore         # Importeer data uit JSON backup
```

## Controle Checklist - Voor jij iets pusht naar GitHub

- [ ] Dev server draait zonder errors
- [ ] Browser toont app op localhost:3000
- [ ] Geen TypeScript errors in IntelliJ
- [ ] Geen console errors in browser DevTools
- [ ] Als je schema wijzigde: migration bestand bestaat in `prisma/migrations/`
- [ ] Test de functionaliteit die je wijzigde

## Begrippenlijst

**Schema:** De structuur van je database (tabellen, kolommen, relaties) - staat in `prisma/schema.prisma`

**Migration:** Een bestand met SQL commando's die de database aanpassen - in `prisma/migrations/`

**Prisma Client:** Gegenereerde TypeScript code om met database te praten - in `node_modules/.prisma/client`

**Dev Server:** Next.js ontwikkelserver die je app draait op localhost:3000

**File Lock:** Windows voorkomt dat bestanden worden aangepast terwijl een programma ze gebruikt

## Hulp nodig?

**Check eerst:**
1. Draait PostgreSQL? → `npm run db:check`
2. Is Prisma client gegenereerd? → `npm run db:fix`
3. Dev server errors? → Lees de terminal output zorgvuldig

**Als het nog niet werkt:**
- Stop ALLES (sluit alle terminals)
- Herstart IntelliJ
- Run: `npm run schema:update`

**Voor diepe problemen:**
- Vraag aan Claude in IntelliJ
- Check `CLAUDE.md` voor technische details
- Maak GitHub issue met error bericht
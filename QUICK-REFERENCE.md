# Quick Reference - Shift2 Auditor

**📌 Print dit uit en houd naast je scherm!**

## Dagelijks Werken (90% van de tijd)

```bash
npm run dev                    # Start de app
# Werk in IntelliJ, sla op, test
git add .
git commit -m "beschrijving"
git push
```

## Schema Wijzigen (database structuur aanpassen)

### Als je Claude vraagt om schema te wijzigen:

**Wat je zegt:**
> "Claude, voeg veld X toe aan model Y"

**Claude zorgt ervoor dat:**
- Je wordt gevraagd de dev server te stoppen
- Schema wordt gewijzigd
- Migration wordt gemaakt
- Je krijgt de juiste commando's

**Wat jij dan doet:**
```bash
# Stop dev server (Ctrl+C in terminal)
npm run schema:update
npm run dev
```

### Als je ZELF schema wijzigt (zonder Claude):

```bash
# 1. STOP EERST de dev server (Ctrl+C)
# 2. Wijzig prisma/schema.prisma
# 3. Dan:
npm run schema:update
npm run dev
```

**Onthoud:** Altijd STOP → WIJZIG → UPDATE → START

## Problemen Oplossen

### Error: "Cannot find module '@prisma/client'"
```bash
npm run db:fix
```

### Error: "Can't reach database server"
```bash
npm run db:check                # Check connectie
# Als het failed: start PostgreSQL service in Windows
```

### Error: "Migration failed"
```bash
npx prisma migrate status       # Bekijk status
npx prisma migrate deploy       # Probeer opnieuw
```

### Alles werkt niet meer
```bash
# Sluit alle terminals
# Herstart IntelliJ
# Dan:
npm run schema:update
npm run dev
```

## Handige Commands

```bash
npm run dev              # Start dev server
npm run db:studio        # Open database viewer
npm run db:seed          # Vul WCAG criteria in
npm run backup           # Backup alle data
```

## Voor je Push naar GitHub

✅ Dev server draait zonder errors
✅ Browser werkt (localhost:3000)
✅ Geen rode errors in IntelliJ
✅ Je hebt je wijziging getest

## Hulp Nodig?

1. Lees WORKFLOW.md voor uitgebreide uitleg
2. Check de terminal errors zorgvuldig
3. Vraag Claude in IntelliJ

---

**Gouden Regel:** Als je `prisma/schema.prisma` wijzigt → STOP dev server EERST!
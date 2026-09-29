# Controle sjabloonclusters, bo.zoetermeer.nl

Drempel 0.8, 10 pagina's, inventarisatie 75c2fc2a-36ad-4bed-a046-d378da93226a (28-9-2026, 21:09:22).
Deze clusters hebben nog geen invloed op de steekproef.

| Drempel | Clusters | Singletons | Grootste | Verschuift t.o.v. gekozen |
|---|---|---|---|---|
| 0.7 | 6 | 3 | 3, 2, 2, 1, 1 | 2 |
| 0.75 | 7 | 5 | 3, 2, 1, 1, 1 | 0 |
| 0.8 | 7 | 5 | 3, 2, 1, 1, 1 | 0 |
| 0.85 | 7 | 5 | 3, 2, 1, 1, 1 | 0 |
| 0.9 | 7 | 5 | 3, 2, 1, 1, 1 | 0 |

## Sjabloon A: 3 pagina's

- Representant: `/ontwerp-volkshuisvestingsprogramma-gemeente-zoetermeer`
- Inhoudstype: page; componenten: documents
- Overeenkomst binnen het cluster: laagste 1, gemiddeld 1
- Gedeelde structurele kenmerken: `comp:documents`, `volg:^>documents`, `volg:documents>$`
- Voorbeelden: `/ontwerp-volkshuisvestingsprogramma-gemeente-zoetermeer`, `/ontwerp-wijzigingsbesluit-omgevingsplan-gemeente-zoetermeer-eerste-fase`, `/vaststelling-volkshuisvestingsprogramma-gemeente-zoetermeer`

Oordeel: [ ] terecht samengevoegd  [ ] onterecht samengevoegd  [ ] onterecht gesplitst  [ ] twijfel

Toelichting:

## Sjabloon B: 2 pagina's

- Representant: `/omgevingsplan`
- Inhoudstype: overview_page; componenten: content_list
- Overeenkomst binnen het cluster: laagste 0.904, gemiddeld 0.904
- Gedeelde structurele kenmerken: `opmaak:content_list=columns--3-without-image-and-intro`, `type:overview_page`, `volg:^>content_list`
- Voorbeelden: `/omgevingsplan`, `/omgevingsprogrammas`

Oordeel: [ ] terecht samengevoegd  [ ] onterecht samengevoegd  [ ] onterecht gesplitst  [ ] twijfel

Toelichting:

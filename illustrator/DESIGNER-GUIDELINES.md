# Studio Twaalf — Illustrator Template Guidelines

Templates worden ontworpen in Adobe Illustrator en geëxporteerd via het script
`export-template.jsx` naar het interne `TemplateDesign` JSON-formaat.

Dit document beschrijft de regels die alle designers moeten volgen om consistente,
foutloze exports te garanderen.

---

## Artboards

| Artboard | Inhoud         | Volgorde |
|----------|----------------|----------|
| 1        | Voorkant       | altijd eerste |
| 2        | Achterkant     | altijd tweede |

- Gebruik altijd de **juiste volgorde** — het export script nummert artboards op index.
- Geef elk artboard een duidelijke naam in het Artboards-paneel: `Voorkant`, `Achterkant`.
- Gebruik **mm** als documenteenheid (Document > Document Setup > Units: Millimeters).
- Stel de afmetingen in op het gewenste kaartformaat, b.v. 105 × 148 mm (A6).

---

## Laagstructuur (verplicht)

Gebruik exact deze vier lagen, van boven naar onder in het Lagen-paneel:

```
┌──────────────────────────┐
│  tekst_editable          │  ← bewerkbare tekst (klant mag aanpassen)
│  tekst_static            │  ← vaste tekst (niet bewerkbaar)
│  illustratie_locked      │  ← decoraties, shapes, illustraties
│  achtergrond             │  ← achtergrondvlak(ken)
└──────────────────────────┘
```

### Laagnamen

Het export script detecteert bewerkbaarheid op basis van laagnaam:

- **`tekst_editable`** — alle tekstobjecten op deze laag krijgen `editable: true`
- **`tekst_static`** — vaste tekst, `editable: false`
- **`illustratie_locked`** — shapes en decoraties, `editable: false`
- **`achtergrond`** — achtergrondvlakken, `editable: false`

> Let op: naamgeving is hoofdlettergevoelig in sommige omgevingen.
> Gebruik exact de namen hierboven.

---

## Objectnamen (verplicht voor bewerkbare tekst)

Geef elk bewerkbaar tekstobject een beschrijvende naam via het Lagen-paneel of
Object > Naam. Het export script gebruikt deze naam als editor-label.

### Aanbevolen namen

| Veldnaam       | Inhoud                        |
|----------------|-------------------------------|
| `baby_name`    | Naam van het kind             |
| `subtitle`     | Ondertitel, b.v. "welkom lieve" |
| `birth_date`   | Geboortedatum                 |
| `weight`       | Gewicht, b.v. "3250 gram"     |
| `length`       | Lengte, b.v. "49 cm"          |
| `parents`      | Naam van de ouders            |
| `address`      | Adres (op achterkant)         |
| `tagline`      | Vrije tekstregel              |

Gebruik **geen spaties** in objectnamen — gebruik onderstrepingstekens.

---

## Tekstregels

### Gebruik altijd Live Text — geen outlines

Bewerkbare tekstobjecten **mogen nooit worden omgezet naar outlines** (Create Outlines).
Het export script kan uitgeschreven tekst niet uitlezen.

- Vaste decoratieve tekst die niet bewerkbaar hoeft te zijn: mag wel worden uitgeschreven,
  maar plaats die dan op de laag `illustratie_locked` (niet `tekst_editable`).

### Teksttype

Gebruik **Area Type** (tekstvak) voor alle bewerkbare tekst:
- Teken een tekstvak met het Type-gereedschap (niet klikken maar slepen).
- Het export script leest de bounds van het tekstvak als `width` en `height`.

Point Type mag alleen worden gebruikt voor vaste, niet-bewerkbare tekst.

### Lettertypen

- Gebruik alleen lettertypen die ook als **webfont** beschikbaar zijn (Google Fonts, Adobe Fonts).
- Controleer of het font geladen is in de Next.js app voordat je het gebruikt.
- Huidige webfonts in de app: **Manrope** (sans-serif), **Fraunces** (serif).
- Veilige fallbacks: Arial, Georgia.
- Gebruik **geen** lokale systeemfonts die niet als webfont beschikbaar zijn.

### Kleur

- Gebruik altijd **RGB-kleurmodus** (File > Document Color Mode > RGB Color).
- Geen CMYK, geen Pantone, geen Spot Colors in bewerkbare tekstlagen.
  Het script converteert CMYK naar RGB, maar RGB is altijd nauwkeuriger.

---

## Achtergrond

- De achtergrondkleur is een **gevuld rechthoekig pad** op de laag `achtergrond`.
- Het vlak moet het **volledige artboard bedekken** (exact of binnen 3% marge).
- Geef het object de naam `achtergrond` of `background`.
- De vulkleur wordt gedetecteerd door het export script als `fillColor`.

> Opmerking: `artboard.backgroundColor` (de artboard-kleur in Illustrator) is niet
> via scripting uitleesbaar. Gebruik altijd een expliciete shape voor de achtergrond.

---

## Shapes en illustraties

- Shapes op de laag `illustratie_locked` worden geëxporteerd als `type: "shape"`.
- Het export script exporteert de **bounding box** (x, y, width, height) als rechthoek.
  Complexe vectorpaden worden nog niet 1:1 geëxporteerd.
- Voor decoratieve elementen die exact moeten worden weergegeven:
  exporteer ze als **PNG/SVG** en gebruik als placed image.

---

## Placed images (afbeeldingen)

- Embed placed images via Object > Flatten Transparency of Link > Embed.
- Het export script exporteert de bounding box, maar `src` blijft leeg.
- Na de export: upload de afbeelding naar `/public/images/templates/` en vul het
  `src`-veld handmatig in het JSON in.

---

## Checklist voor export

Voor elke template, controleer:

- [ ] Documenteenheid is mm
- [ ] Artboard 1 = voorkant, Artboard 2 = achterkant
- [ ] Vier lagen aanwezig met exacte namen
- [ ] Bewerkbare tekst op laag `tekst_editable`
- [ ] Alle bewerkbare tekstobjecten hebben een naam
- [ ] Geen outlines op bewerkbare tekst
- [ ] Lettertypen zijn beschikbaar als webfont
- [ ] Kleurmodus is RGB
- [ ] Achtergrond is een expliciet vlak op laag `achtergrond`
- [ ] Geëxporteerde JSON past in het admin-veld zonder parse-fouten

---

## Export-workflow

1. Open het Illustrator-bestand.
2. Ga naar **File > Scripts > Browse…**
3. Selecteer `studio-twaalf/illustrator/export-template.jsx`.
4. Sla het JSON-bestand op (save dialog verschijnt automatisch).
5. Open de admin: `/admin/templates/{id}/edit`.
6. Plak de JSON in het veld **Default design JSON**.
7. Controleer de live preview rechts — de kaart moet zichtbaar correct zijn.
8. Vul ontbrekende `src`-velden in als er placed images zijn.
9. Klik **Save changes**.

---

## Voorbeeld-JSON output

```json
{
    "version": 1,
    "name": "Geboortekaartje Ella",
    "artboards": [
        {
            "id": "artboard_0",
            "name": "Voorkant",
            "width": 105,
            "height": 148,
            "unit": "mm"
        },
        {
            "id": "artboard_1",
            "name": "Achterkant",
            "width": 105,
            "height": 148,
            "unit": "mm"
        }
    ],
    "elements": [
        {
            "id": "baby_name",
            "type": "text",
            "artboardId": "artboard_0",
            "name": "baby_name",
            "editable": true,
            "content": "Ella",
            "x": 10.583,
            "y": 42.333,
            "width": 83.833,
            "height": 19.756,
            "style": {
                "fontFamily": "Fraunces",
                "fontSize": 19.756,
                "fontWeight": 700,
                "fontStyle": "normal",
                "color": "#FC6363",
                "textAlign": "center",
                "lineHeight": 1.2
            }
        },
        {
            "id": "subtitle",
            "type": "text",
            "artboardId": "artboard_0",
            "name": "subtitle",
            "editable": true,
            "content": "welkom lieve",
            "x": 10.583,
            "y": 37.186,
            "width": 83.833,
            "height": 3.175,
            "style": {
                "fontFamily": "Fraunces",
                "fontSize": 2.117,
                "fontWeight": 700,
                "fontStyle": "normal",
                "color": "#FC6363",
                "textAlign": "center",
                "lineHeight": 1.2
            }
        },
        {
            "id": "achtergrond_rect",
            "type": "shape",
            "artboardId": "artboard_0",
            "name": "achtergrond",
            "editable": false,
            "shapeType": "rect",
            "x": 0,
            "y": 0,
            "width": 105,
            "height": 148,
            "style": {
                "fill": "#FFCED3"
            }
        }
    ]
}
```

> **Opmerking backgroundColor:**
> Het export script kan `artboard.backgroundColor` niet uitlezen via Illustrator scripting.
> Na de export, voeg handmatig `"backgroundColor": "#FFCED3"` toe aan het artboard-object
> als de achtergrondkleur ook als artboard-kleur gebruikt moet worden.
> De TemplatePreview gebruikt `artboard.backgroundColor` als fallback als er geen
> achtergrond-shape aanwezig is.

---

## Veelvoorkomende fouten

| Fout | Oorzaak | Oplossing |
|------|---------|-----------|
| Tekst verschijnt niet in preview | Tekst is outline | Verwijder outlines, gebruik live tekst |
| Verkeerde kleur in preview | CMYK kleur | Zet document op RGB, pas kleur aan |
| Tekst op verkeerde positie | x/y verkeerd geïnterpreteerd | Controleer lagen-namen en artboard-grenzen |
| `editable: false` op alle tekst | Laagnaam klopt niet | Gebruik exact `tekst_editable` als laagnaam |
| `src: ""` bij afbeeldingen | Placed items hebben geen web-URL | Upload asset naar /public en vul src in |

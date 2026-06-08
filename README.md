# Aircombat Competition Manager – VSCode-peruspohja

Kevyt vanilla HTML/CSS/JS -pohja RC Aircombat -kilpailukäyttöön. Tämä on tarkoituksella tehty ilman raskasta frameworkia, jotta projektin saa nopeasti auki VSCodeen ja kehitystä voidaan jatkaa moduuli kerrallaan.

## Mitä tässä rungossa on

- Kisakalenteri
- Kilpailun avaaminen aktiiviseksi kisaksi
- Roolijako: Admin / Peruskäyttäjä
- Adminille kilpailukohtaiset osallistujat, pilotit, konekortit, heatien luonti, pisteiden syöttö ja asetukset
- Peruskäyttäjälle suppeampi julkinen näkymä: kilpailu, kalenteri, suppea osallistujalista, heat-aikataulu ja vain julkaistut kilpailutulokset
- Pilottirekisteri
- Konekortit / aircraft-rekisteri
- Kilpailukohtainen osallistujien syöttö: vanha pilotti/kone tai uusi pilotti/kone samalla lomakkeella
- Heat-ryhmien automaattinen luonti
- Heat-tulosten syöttö
- Uusin 5 kierroksen pilot score card / tuloskortti: Runde 1–5, Flugzeit, Cuts, Streamer O.K., Hasenfuß ja Safetyline
- Tuloskortin automaattinen pisteenlasku ja tulostusnäkymä
- Kilpailutulosten virallinen yhteenveto, podium, luokkakohtaiset tulokset ja julkaisu
- Pisteytys: lentoaika, cutit, ehjä streamer ja penaltyt
- JSON-vienti ja -tuonti
- Responsiivinen PC/tablet/phone UI-pohja
- PWA-manifestin alku

## Rooliajatus

### Admin

Admin hallitsee kilpailun varsinaista dataa:

- kisakalenterin muokkaus
- osallistujien ilmoittaminen aktiiviseen kilpailuun
- uuden pilotin ja koneen lisääminen suoraan osallistujalomakkeelta
- maksu-, check-in-, tekninen tarkastus-, kilpailunumero- ja admin-huomiot kisakohtaisesti
- pilotit ja konekortit
- heatien luonti
- heat-tulosten ja 5 kierroksen tuloskorttien syöttö
- tuloskorttien tulostus paperivarmistukseksi
- kilpailutulosten julkaisu/piilotus ja CSV-vienti
- asetukset, JSON-varmuuskopio ja datan palautus

### Peruskäyttäjä

Peruskäyttäjä näkee vain suppeamman julkisen näkymän:

- aktiivisen kilpailun perustiedot
- kisakalenteri
- suppea julkinen osallistujalista luokittain
- julkaistu heat-aikataulu
- vain adminin julkaisemat kilpailutulokset ja ranking

Peruskäyttäjä ei näe muokkauspainikkeita, pisteiden syöttöä, varmuuskopioita, osallistumismaksuja, check-in-tietoja, teknisen tarkastuksen sisäisiä merkintöjä, admin-huomioita, lisenssi-/puhelintietoja eikä admin-asetuksia.

Tässä prototyypissä roolia vaihdetaan yläpalkin valitsimesta. Oikeassa tuotantoversiossa tämä korvataan kirjautumisella ja käyttöoikeuksilla.

## Käynnistys VSCodeessa

Helpoin tapa:

1. Avaa tämä kansio VSCodeessa.
2. Asenna VSCode-laajennus **Live Server**.
3. Klikkaa `index.html` → **Open with Live Server**.

Vaihtoehtoisesti komentoriviltä:

```bash
python -m http.server 5173
```

Avaa selaimessa:

```text
http://localhost:5173
```

## Kansiorakenne

```text
aircombat-competition-manager/
├─ index.html
├─ manifest.webmanifest
├─ README.md
├─ TODO_NEXT.md
├─ .vscode/
│  ├─ extensions.json
│  └─ settings.json
└─ src/
   ├─ main.js
   ├─ router.js
   ├─ styles.css
   ├─ data/
   │  └─ defaultState.js
   ├─ logic/
   │  ├─ heatBuilder.js
   │  ├─ scoring.js
   │  ├─ participants.js
   │  ├─ scoreCards.js
   │  └─ competitionResults.js
   ├─ state/
   │  └─ store.js
   ├─ users/
   │  └─ roles.js
   ├─ utils/
   │  └─ html.js
   └─ views/
      ├─ dashboardView.js
      ├─ calendarView.js
      ├─ pilotsView.js
      ├─ aircraftView.js
      ├─ entriesView.js
      ├─ heatsView.js
      ├─ scoreCardsView.js
      ├─ resultsView.js
      └─ settingsView.js
```

## Kehityssuunta

Tämä pohja voidaan myöhemmin jakaa kolmeen käyttöön:

- **PC:** kilpailutoimisto ja pääkone
- **Tabletti:** tuomari / heat marshal
- **Puhelin:** pilottinäkymä, oma seuraava heat, ranking ja ilmoitukset

Seuraava iso tekninen askel olisi paikallinen palvelin + SQLite + WebSocket, jolloin PC toimii kilpailun pääkoneena ja tabletit/puhelimet liittyvät samaan paikalliseen WiFiin.

## Osallistujien syöttö kilpailukohtaisesti

Rungossa on nyt erotettu kaksi asiaa:

- **Pilotti** = pysyvä henkilö pilottirekisterissä.
- **Osallistuja / entry** = pilotin kilpailukohtainen ilmoittautuminen aktiiviseen kisaan.

Admin menee näin:

```text
Kisakalenteri → Avaa kilpailu aktiiviseksi → Osallistujat → Lisää osallistuja kilpailuun
```

Osallistujalomakkeella voi joko valita olemassa olevan pilotin ja koneen tai luoda uuden pilotin ja koneen samalla kertaa. Seuraavat tiedot tallentuvat nimenomaan aktiivisen kilpailun osallistujariville:

- luokka
- kilpailunumero
- maksu
- check-in
- tekninen tarkastus
- admin-huomiot

Peruskäyttäjän dashboard näyttää vain suppean julkisen osallistujalistan: nimi, maa, seura, luokka ja kilpailunumero. Maksut, puhelimet, lisenssit, check-in, tekninen tarkastus ja admin-huomiot pysyvät adminin puolella.


## Pilot score card / tuloskortit

Admin-näkymään on lisätty **Tuloskortit**-osio. Se perustuu uusimpaan 5 kierroksen score card -malliin:

```text
Startnummer, Vorname, Name, Frequenz, Du fliegst in Runde
Runde 1–5:
- Flugzeit min/sek
- Cuts
- Streamer O.K. ja/nein
- Hasenfuß ja/nein
- Safetyline überflogen ja/nein
- Summe

Alatiedot:
- 2,5 er Klasse
- Modellname
- V-Motor od. Akku
- Prop. Z.B. 9x4
- Drehzahl
- Unterschrift Pilot
- Unterschrift Richter
```

Tuloskortit ovat kilpailukohtaisia ja sidottu osallistujariviin. Kun tuloskortti tallennetaan, kilpailutulokset palautuvat luonnostilaan, jotta admin voi tarkistaa ja julkaista rankingin uudelleen. Julkinen käyttäjä näkee edelleen vain julkaistut kilpailutulokset, ei tuloskorttien muokkauslomakkeita.

## Päivitys 2026-06-04: WWI-tuloskortti

Tuloskortit-osiossa on nyt kaksi korttimallia:

- **Standard / WWII · 5 Runde**
- **WWI · 4 Runde + Finale**

WWI-kortti perustuu uuteen saksankieliseen WWI-taulukkoon. Kortissa on omat mallipisteet, lentopisteet ja rangaistukset:

- Modellpunkte: Viertaktmotor, Multiwing, Flügelstruktur/Rippen, Pilot an Bord, Waffen vorhanden, Verspannungen und Stiele
- Flugpunkte: Bodenstart, Flugzeit, Cuts, Bodenziele, Hasenfuß, Safetyline, Landefeld erreicht nach Endsignal, Streamer O.K.
- Oikean reunan Punkte-yhteenveto: Runde 1, Runde 2, Runde 3, Finale ja Gesamtpunkte

Osallistujan luokka **WWI** valitsee WWI-kortin automaattisesti. Admin voi vaihtaa korttimallin Tuloskortit-näkymän korttimallivalikosta ja tallentaa muutoksen.

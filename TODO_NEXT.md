# Seuraavat kehitysaskeleet

## 1. Roolijako tuotantokuntoon

Nykyinen Admin / Peruskäyttäjä -valitsin on prototyyppi. Tuotantoversiossa tarvitaan:

- kirjautuminen
- käyttäjäroolit tietokantaan
- admin, kilpailunjohtaja, tuomari, pilotti ja vieras
- oikeustarkistus myös backendissä, ei vain käyttöliittymässä

## 2. Sää ja turvallisuus

Lisää oma moduuli:

```text
src/modules/weather/
  weatherService.js
  weatherStore.js
  weatherRiskRules.js
  renderWeatherPanel.js
  renderWeatherAdminPanel.js
```

Peruskäyttäjälle näytetään vain yleinen säätila ja kilpailunjohdon päätös. Adminille näytetään lähdedata, päivitysaika, riskihuomiot ja mahdollisuus asettaa kilpailu tauolle.

## 3. Osallistujat admin-puolella

Peruskorjaus on tehty: osallistujarivit ovat kilpailukohtaisia ja admin voi lisätä vanhan pilotin/koneen tai uuden pilotin/koneen suoraan aktiiviseen kilpailuun. Seuraavaksi kannattaa lisätä:

- osallistujarivin muokkaus ilman poistoa
- massatuonti CSV:stä
- kilpailukohtainen maksuraportti
- teknisen tarkastuksen erillinen tablet-näkymä
- osallistujalistan PDF-tulostus
- varoitus, jos sama kilpailunumero on kahdella osallistujalla samassa luokassa

## 4. Peruskäyttäjän suppea näkymä

Jatka public-näkymää:

- oma selkeä mobiiliavaus
- suppea osallistujalista luokittain
- seuraava heat
- julkiset tiedotteet
- QR-koodi kisaan liittymiseen
- ei henkilötietoja tai ylläpitodataa

## 5. Paikallinen kilpailupalvelin

Kun frontti on selkeä:

- Node.js backend
- SQLite-tietokanta
- WebSocket-päivitykset
- PC pääkoneeksi
- tabletit ja puhelimet samaan paikalliseen WiFiin

## 6. Tuloskortit tuotantokuntoon

Peruspäivitys on tehty: 5 kierroksen score card löytyy adminin Tuloskortit-osiosta. Seuraavaksi kannattaa lisätä:

- yksittäisen osallistujan tuloskorttiin hyppääminen suoraan Osallistujat-taulukosta
- tablet-tuomarinäkymä, jossa näkyy vain yksi kierros ja yksi pilotti kerrallaan
- allekirjoituksen tallennus kosketusnäytöllä
- tuloskortin PDF-vienti selainprintin lisäksi
- loki tuloskortin muutoksille
- sääntöprofiilien eriyttäminen luokittain, jos WW2/EPA käyttävät eri pisteitä

## 7. Kilpailutulokset tuotantokuntoon

Nykyinen kilpailutulosmoduuli sisältää julkaisun, podiumin, luokkakohtaiset tulokset ja CSV-viennin. Seuraavaksi kannattaa lisätä:

- finaalikierroksen erillinen painotus, jos sääntöprofiili sitä vaatii
- tulosten lukitus, kun kilpailunjohtaja hyväksyy lopullisen tuloksen
- tuloskorjausten loki: kuka muutti mitä ja milloin
- PDF-tulostus viralliselle tuloslistalle
- protesti-/huomautusmerkinnät ennen lopullista julkaisua

## Seuraavat WWI-tuloskortin tarkennukset

- Varmista oikea virallinen tulkinta: onko WWI:n neljäs sarake aina Runde 4 vai käytetäänkö sitä finaalina.
- Lisää tarvittaessa erillinen manuaalinen Finale-pistekenttä, jos finaali ei ole sama kuin neljäs kierros.
- Tee tulostusnäkymän viilaus mahdollisimman lähelle paperilomaketta.
- Lisää myöhemmin kielivalinta: suomi / englanti / saksa.

# Aircombat Competition Manager: Suljetun Testauksen Suunnitelma

Tämä dokumentti määrittelee RC Aircombat Competition Manager -sovelluksen suljetun testauksen (Closed Beta) laajuuden, hyväksymiskriteerit ja pääalueet ennen sen jakamista testiryhmälle Google Playn kautta.

## 1. Testauksen Tavoite
Varmistaa, että sovelluksen koko "Full Cloud Mode" -arkkitehtuuri, paikallinen varajärjestelmä (fallback) ja offline/online -siirtymät toimivat odotetusti kaikissa päärooleissa (Admin, Pilot, Guest). Lisäksi varmistetaan sovelluksen asennettavuus ja responsiivisuus Android-alustalla.

## 2. Testauksen Pääalueet

Testaus jaetaan kahdeksaan ydinosa-alueeseen:

1. **Käynnistys ja kirjautuminen:** Roolipohjainen näkyvyys, reititys ja istuntojen hallinta.
2. **Supabase / Cloud Mode:** Datan haku, tallennus ja saumaton hybriditoimivuus (optimistinen UI & asynkroninen synkronointi).
3. **Admin-polku:** Kilpailujen ja osallistujien täysi elinkaaren hallinta (luonti, hyväksyminen, arvonta, tulokset).
4. **Peruskäyttäjän / Pilotin polku:** Omien tietojen, kaluston ja kilpailuun ilmoittautumisten hallinta.
5. **Tuloskortit:** Digitaalinen tuomarointi kentällä, vaihekohtainen arviointi.
6. **Asiakirjat ja tulostus:** PDF- tai paperitulostukseen optimoidut listat (tulokset, katsastus, heatit).
7. **UI ja käytettävyys:** Nykyaikainen, progressiivinen käyttöliittymä kaikilla laitteilla (mobiili/tabletti/PC).
8. **Android / Play Store:** Varsinaisen asennuspaketin tekninen toimivuus (orientaatio, oikeudet, tausta-ajo).

## 3. Roolit ja Laitteet

Testitapauksia suoritetaan seuraavilla kombinaatioilla:
- **Roolit:** 
  - `Guest` (kirjautumaton)
  - `Pilot` (peruskäyttäjä, rekisteröitynyt)
  - `Admin` (pääkäyttäjä, täydet oikeudet)
- **Laitteet:**
  - Pääasiassa testataan laitteilla **PC/Selain**, **Tabletti (Landscape/Portrait)** ja **Android-puhelin**. Play Store -osio keskittyy yksinomaan Android-puhelimeen/tablettiin.

## 4. Hyväksyntäkriteerit (Exit Criteria)

Suljettu testaus on läpäissyt laadunvarmistuksen ja sovellus voidaan siirtää avoimeen testiin tai tuotantoon, kun seuraavat ehdot täyttyvät:

1. Sovellus toimii `local mode` -tilassa vakaasti.
2. Sovellus toimii `cloud mode` -tilassa vakaasti.
3. Adminin pääpolku (kisan luonti -> arvonnat -> tulokset) on virheetön.
4. Pilotin pääpolku (ilmoittautuminen -> omat tiedot) on virheetön.
5. Ilmoittautumisprosessi toimii luotettavasti pilven kautta ilman duplikaatteja.
6. Tuloskortit tallentuvat oikein, pisteet lasketaan sääntöjen mukaisesti.
7. Tulokset voidaan julkaista ja ne näkyvät reaaliaikaisesti guest-käyttäjille.
8. Android build asennetaan onnistuneesti puhelimeen ja se läpäisee lokaalin "savutestin".
9. Kaikki `test-cases.md` -dokumentin kriittiset (P1) tapaukset ovat tilassa `pass`. Avoimet `needs fix` -löydökset eivät saa olla järjestelmän käyttöä estäviä.

## 5. Testauksen Toteutus
1. Manuaalinen testaaja käy läpi `test-cases.md` dokumentin listan.
2. Löydetyt viat tai parannusehdotukset merkitään `known-issues.md` -dokumenttiin.
3. Kun havaitut ongelmat on korjattu, vastaavat testitapaukset uudelleentestataan.

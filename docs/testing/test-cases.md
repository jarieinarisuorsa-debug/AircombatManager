# Test Cases: Suljettu Testaus

| ID | Alue | Testin Nimi | Rooli | Laite | Odotettu Tulos | Toteutunut Tulos | Status |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **1** | **Kirjautuminen** | Sovellus käynnistyy Androidilla | Guest | Android | Splash-screen näkyy, ohjelma latautuu ilman kaatumista | | `pending` |
| 2 | Kirjautuminen | Guest-näkymä toimii | Guest | PC/Android | Kisakalenteri ja julkiset tulokset näkyvät ilman kirjaantumista | | `pending` |
| 3 | Kirjautuminen | Sähköpostikirjautuminen | Pilot | PC/Android | Magic link / OTP kirjautuminen toimii ja ohjaa omiin tietoihin | | `pending` |
| 4 | Kirjautuminen | Admin-roolin tunnistus | Admin | PC | Oikeuksilla varustettu sähköposti avaa admin-valikot | | `pending` |
| 5 | Kirjautuminen | Suojatut reitit (Guest) | Guest | PC | `/myevent` tai `/admin` reitti ohjaa kirjautumissivulle | | `pending` |
| 6 | Kirjautuminen | Uloskirjautuminen | Pilot | Android | "Kirjaudu ulos" tyhjentää session ja ohjaa etusivulle | | `pending` |
| **7** | **Cloud Mode** | Kytkimen aktivointi | Admin | PC | `isCloudMode()` aktivoituna sovellus lataa datan pilvestä | | `pending` |
| 8 | Cloud Mode | Synkronointi pilveen | Admin | PC | Muutos paikallisesti (esim. kisan nimen vaihto) tallentuu Supabaseen välittömästi | | `pending` |
| 9 | Cloud Mode | Local Fallback toimii | Admin | PC | Jos yhteys/API-avain puuttuu, sovellus käyttää virheettä `localStoragea` | | `pending` |
| 10 | Cloud Mode | RLS Oikeudet | Pilot | PC | Pilotti ei pysty Supabase APIn kautta (RLS) manipuloimaan toisen pilotin tietoja | | `pending` |
| **11** | **Admin Polku** | Uuden kilpailun luonti | Admin | PC | Uusi tapahtuma syntyy ja näkyy kalenterissa, tilana `planned` | | `pending` |
| 12 | Admin Polku | Ilmoittautumisten käsittely | Admin | PC | Admin voi hyväksyä pending-pyynnön, jolloin pilotti lisätään entries-listalle | | `pending` |
| 13 | Admin Polku | Heatien arvonta | Admin | PC | Admin voi arpoa alkukierrokset ilmoittautuneista piloteista | | `pending` |
| 14 | Admin Polku | Tulosten julkaisu | Admin | PC | Finaalien jälkeen Admin klikkaa "Julkaise tulokset", tulokset näkyvät Guestille | | `pending` |
| **15** | **Pilotti Polku** | Omien tietojen ja avatarin lisäys | Pilot | Android | Kuvat ja yhteystiedot tallentuvat profiiliin / `pilots`-tauluun | | `pending` |
| 16 | Pilotti Polku | Konekortin lisäys | Pilot | Android | Uusi lentokone spesifikaatioineen tallentuu kalustorekisteriin | | `pending` |
| 17 | Pilotti Polku | Ilmoittautumispyyntö | Pilot | PC/Android | Pilotti valitsee kisat, luokat (WW2/WWI/EPA), maksutavan -> tila `pending` | | `pending` |
| 18 | Pilotti Polku | Omien heatien näkyvyys | Pilot | Android | "Oma kilpailu" -näkymässä näkyy arvonnan jälkeen omat heatit | | `pending` |
| **19** | **Tuloskortit** | Pisteiden syöttö | Admin/Judge | Tabletti | Kyllä/Ei valinnat ja kentät laskevat oikeat `total_points` automaattisesti | | `pending` |
| 20 | Tuloskortit | Tyhjien erien käsittely | Admin | PC | Lentämättömät erät tallentuvat odottavina tai nollina, ei virheitä | | `pending` |
| 21 | Tuloskortit | Ajan siirto kellosta | Pilot | Android | Sisäinen ajanottokello siirtää ajetun sekuntimäärän suoraan tuloskortille | | `pending` |
| **22** | **Tulostus** | Kisa-asiakirjat | Admin | PC | Tyhjät tuloskortit ja heat-listat avautuvat oikein tulostusnäkymään (A4) | | `pending` |
| **23** | **Käytettävyys** | Responsiivisuus | Kaikki | Tabletti/Android | Ei vaakasuuntaista scrollausta, napit ja fontit riittävän isoja | | `pending` |
| 24 | Käytettävyys | Modaalit ja palaute | Kaikki | PC | Poisto vahvistetaan aina modalilla, tallennuksesta tulee Toast/SnackBar | | `pending` |
| **25** | **Android / Play** | Kameran ja kuvien käyttö | Pilot | Android | Avatar/kone -kuvien lisäys aukaisee Androidin oman kuvanvalinnan/kameran | | `pending` |
| 26 | Android / Play | Tausta-ajo (Lifecycle) | Pilot | Android | Sovellus ei kaadu tai hukkaa syötettyä tuloskorttia, kun puhelin menee nukkumaan | | `pending` |

_Ohje: Testauksen edetessä muuta Status-sarakkeen arvoksi `pass`, `fail` tai `needs fix`. Kirjaa viat erilliseen `known-issues.md`-tiedostoon._

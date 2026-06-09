-- ==============================================================================
-- Aircombat Competition Manager
-- SECURITY UPDATE: RLS & Views for data minimization
-- Aja tämä skripti Supabasen SQL Editorissa päivittääksesi tietoturvan.
-- ==============================================================================

-- 1. Luodaan julkinen näkymä (view) piloteista, joka palauttaa vain turvalliset kentät.
-- Tämä näkymä ohittaa RLS:n oletuksena (mutta ei anna kirjoitusoikeuksia), joten 
-- kuka tahansa kirjautunut tai anonyymi käyttäjä voi nähdä nämä julkiset tiedot.
CREATE OR REPLACE VIEW public_pilots AS
SELECT 
    id, 
    name, 
    country, 
    club, 
    license, 
    "avatarData", 
    created_at
FROM pilots;

-- Annetaan lukuoikeus näkymään kaikille (anon = kirjautumaton, authenticated = kirjautunut)
GRANT SELECT ON public_pilots TO anon, authenticated;

-- 2. Poistetaan vanha, liian salliva RLS-sääntö pilots-taulusta.
DROP POLICY IF EXISTS "Kaikki voivat lukea pilotteja" ON pilots;

-- 3. Luodaan uusi, tiukempi sääntö: Käyttäjä saa lukea pilots-taulusta (ja sen piilotetuista
--    kentistä kuten email, phone, address) VAIN OMAT tietonsa, paitsi jos hän on admin.
CREATE POLICY "Pilotit näkevät vain omansa" 
    ON pilots FOR SELECT 
    USING (
        LOWER(email) = LOWER(auth.jwt()->>'email') 
        OR public.is_admin()
    );

-- Varmistetaan, että views ovat ajan tasalla ja käyttöoikeudet oikein
-- Valmis!

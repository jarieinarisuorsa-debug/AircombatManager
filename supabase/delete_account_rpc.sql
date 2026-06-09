-- ==============================================================================
-- Aircombat Competition Manager
-- SECURITY UPDATE: Delete Own Account RPC
-- Aja tämä skripti Supabasen SQL Editorissa salliaksesi tilien poiston.
-- ==============================================================================

-- Tämä funktio suoritetaan tietokannan ylläpitäjän oikeuksin (SECURITY DEFINER),
-- mutta se kohdistuu vain ja ainoastaan funktiota kutsuvan käyttäjän tietoihin.
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Poista käyttäjän pilottikortti, mikä kaskadoituu (ON DELETE CASCADE)
  -- kaikkialle muualle (ilmoittautumiset, kalusto, tulokset, tuloskortit jne.)
  DELETE FROM public.pilots 
  WHERE LOWER(email) = LOWER(auth.jwt()->>'email');

  -- 2. Poista käyttäjän profiili (jos olemassa)
  DELETE FROM public.profiles
  WHERE id = auth.uid();

  -- 3. Poista itse käyttäjätili auth-järjestelmästä
  DELETE FROM auth.users 
  WHERE id = auth.uid();
END;
$$;

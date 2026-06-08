    -- ==============================================================================
    -- Aircombat Competition Manager
    -- COMPLETE SUPABASE SCHEMA
    -- Varmistettu toimivuus tyhjässä tietokannassa.
    -- Aja tämä skripti kerralla Supabasen SQL Editorissa.
    -- ==============================================================================

    -- ==============================================================================
    -- 1. PERMISSIONS TABLE (Luodaan ensin, koska muut policyt viittaavat tähän)
    -- ==============================================================================
    CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

    -- Apufunktio estämään infinite recursion permissions-taulun RLS:ssä
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS BOOLEAN AS $$
    BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.permissions 
        WHERE LOWER(email) = LOWER(current_setting('request.jwt.claims', true)::json->>'email') 
        AND LOWER(role) = 'admin'
    );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE POLICY "Käyttäjä näkee omat oikeutensa" 
        ON permissions FOR SELECT 
        USING (LOWER(email) = LOWER(auth.jwt()->>'email'));

    CREATE POLICY "Admin näkee kaikki oikeudet" 
        ON permissions FOR SELECT 
        USING (public.is_admin());

    CREATE POLICY "Vain adminit voivat muokata oikeuksia" 
        ON permissions FOR ALL 
        USING (public.is_admin());


    -- ==============================================================================
    -- 2. PROFILES TABLE
    -- ==============================================================================
    CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Käyttäjät voivat lukea oman profiilinsa" 
        ON profiles FOR SELECT 
        USING (auth.uid() = id);

    CREATE POLICY "Käyttäjät voivat päivittää oman profiilinsa" 
        ON profiles FOR UPDATE 
        USING (auth.uid() = id);

    CREATE POLICY "Admins voivat lukea kaikki profiilit" 
        ON profiles FOR SELECT 
        USING (public.is_admin());


    -- ==============================================================================
    -- 3. PILOTS TABLE
    -- ==============================================================================
    CREATE TABLE IF NOT EXISTS pilots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        country TEXT,
        club TEXT,
        license TEXT,
        address TEXT,
        "avatarData" TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Admins voivat hallita pilotteja" 
        ON pilots FOR ALL 
        USING (public.is_admin());

    CREATE POLICY "Kaikki voivat lukea pilotteja" 
        ON pilots FOR SELECT 
        USING (true);

    CREATE POLICY "Pilotit voivat päivittää omaa korttiaan" 
        ON pilots FOR UPDATE 
        USING (LOWER(auth.jwt()->>'email') = LOWER(email));


    -- ==============================================================================
    -- 4. EVENTS TABLE
    -- ==============================================================================
    CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        date DATE,
        end_date DATE,
        status TEXT,
        classes JSONB,
        public_notice TEXT,
        safety_status TEXT,
        results_published BOOLEAN DEFAULT false,
        results_published_at TIMESTAMP WITH TIME ZONE,
        results_approved_by TEXT,
        rules JSONB,
        competition_format JSONB,
        class_formats JSONB,
        event_info JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE events ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Kaikki voivat lukea tapahtumia" 
        ON events FOR SELECT 
        USING (true);

    CREATE POLICY "Admins voivat muokata tapahtumia" 
        ON events FOR ALL 
        USING (public.is_admin());


    -- ==============================================================================
    -- 5. REGISTRATION REQUESTS TABLE
    -- ==============================================================================
    CREATE TABLE IF NOT EXISTS registration_requests (
        id TEXT PRIMARY KEY,
        event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
        pilot_id TEXT REFERENCES pilots(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        classes JSONB,
        payment_intent TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        handled_at TIMESTAMP WITH TIME ZONE,
        handled_by TEXT,
        admin_note TEXT
    );

    ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

    -- Estetään saman pilotin moninkertaiset pending-pyynnöt samaan tapahtumaan
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_unique_pending_request') THEN
            CREATE UNIQUE INDEX idx_unique_pending_request ON registration_requests (event_id, pilot_id) WHERE status = 'pending';
        END IF;
    END
    $$;

    CREATE POLICY "Admins ja omat pyynnöt SELECT" 
        ON registration_requests FOR SELECT 
        USING (
            LOWER(email) = LOWER(auth.jwt()->>'email') OR public.is_admin()
        );

    CREATE POLICY "Pilotit voivat luoda omia pyyntöjä" 
        ON registration_requests FOR INSERT 
        WITH CHECK (LOWER(email) = LOWER(auth.jwt()->>'email'));

    CREATE POLICY "Päivitysoikeus (Admin tai oma pending)" 
        ON registration_requests FOR UPDATE 
        USING (
            (LOWER(email) = LOWER(auth.jwt()->>'email') AND status = 'pending') OR public.is_admin()
        );

    CREATE POLICY "Vain admin voi poistaa pyyntöjä" 
        ON registration_requests FOR DELETE 
        USING (public.is_admin());


    -- ==============================================================================
    -- 6. ENTRIES TABLE
    -- ==============================================================================
    CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY,
        event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
        pilot_id TEXT REFERENCES pilots(id) ON DELETE CASCADE,
        aircraft_id TEXT,
        class_name TEXT NOT NULL,
        race_number TEXT,
        payment_status TEXT DEFAULT 'unpaid',
        check_in_status TEXT DEFAULT 'not_arrived',
        technical_inspection TEXT DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        
        CONSTRAINT uk_entry_event_pilot_class UNIQUE (event_id, pilot_id, class_name)
    );

    ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Kaikki voivat lukea osallistujia" 
        ON entries FOR SELECT 
        USING (true);

    CREATE POLICY "Admins voivat hallita osallistujia" 
        ON entries FOR ALL 
        USING (public.is_admin());


    -- ==============================================================================
    -- 7. HEATS TABLE
    -- ==============================================================================
    CREATE TABLE IF NOT EXISTS heats (
        id TEXT PRIMARY KEY,
        event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
        class_name TEXT NOT NULL,
        group_name TEXT,
        round INTEGER,
        phase TEXT,
        status TEXT DEFAULT 'pending',
        entry_ids JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE heats ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Kaikki voivat lukea heatteja" 
        ON heats FOR SELECT 
        USING (true);

    CREATE POLICY "Admins voivat muokata heatteja" 
        ON heats FOR ALL 
        USING (public.is_admin());


    -- ==============================================================================
    -- 8. SCORE_CARDS TABLE
    -- ==============================================================================
    CREATE TABLE IF NOT EXISTS score_cards (
        id TEXT PRIMARY KEY,
        event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
        heat_id TEXT REFERENCES heats(id) ON DELETE CASCADE,
        entry_id TEXT REFERENCES entries(id) ON DELETE CASCADE,
        pilot_id TEXT REFERENCES pilots(id) ON DELETE CASCADE,
        class_name TEXT NOT NULL,
        aircraft_id TEXT,
        frequency TEXT,
        flight_time_seconds INTEGER DEFAULT 0,
        points_flight INTEGER DEFAULT 0,
        cuts INTEGER DEFAULT 0,
        points_cuts INTEGER DEFAULT 0,
        intact_streamer BOOLEAN DEFAULT false,
        points_intact_streamer INTEGER DEFAULT 0,
        ground_target_hit BOOLEAN DEFAULT false,
        points_ground_target INTEGER DEFAULT 0,
        takeoff BOOLEAN DEFAULT true,
        points_takeoff INTEGER DEFAULT 0,
        landing_after_end_signal BOOLEAN DEFAULT false,
        points_landing_after_end_signal INTEGER DEFAULT 0,
        penalty_hasenfuss INTEGER DEFAULT 0,
        penalty_safetyline INTEGER DEFAULT 0,
        penalty_other INTEGER DEFAULT 0,
        notes TEXT,
        total_points INTEGER DEFAULT 0,
        position INTEGER,
        points_awarded INTEGER DEFAULT 0,
        is_approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE score_cards ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Kaikki voivat lukea tuloskortteja" 
        ON score_cards FOR SELECT 
        USING (true);

    CREATE POLICY "Admins voivat muokata tuloskortteja" 
        ON score_cards FOR ALL 
        USING (public.is_admin());


    -- ==============================================================================
    -- 9. AIRCRAFT TABLE
    -- ==============================================================================
    CREATE TABLE IF NOT EXISTS aircraft (
        id TEXT PRIMARY KEY,
        pilot_id TEXT REFERENCES pilots(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        class_name TEXT NOT NULL,
        engine TEXT,
        tech_status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Kaikki voivat lukea kalustoa" 
        ON aircraft FOR SELECT 
        USING (true);

    CREATE POLICY "Pilot voi hallita omaa kalustoaan" 
        ON aircraft FOR ALL 
        USING (
            pilot_id IN (SELECT id FROM pilots WHERE LOWER(email) = LOWER(auth.jwt()->>'email')) 
            OR public.is_admin()
        );


    -- ==============================================================================
    -- 10. AIRCRAFT_SPECS TABLE
    -- ==============================================================================
    CREATE TABLE IF NOT EXISTS aircraft_specs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        real_span_m NUMERIC,
        real_length_m NUMERIC,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE aircraft_specs ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Kaikki voivat lukea spesifikaatioita" 
        ON aircraft_specs FOR SELECT 
        USING (true);

    CREATE POLICY "Admins voivat muokata spesifikaatioita" 
        ON aircraft_specs FOR ALL 
        USING (public.is_admin());


    -- ==============================================================================
    -- 11. RESULTS TABLE
    -- ==============================================================================
    CREATE TABLE IF NOT EXISTS results (
        id TEXT PRIMARY KEY,
        event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
        class_name TEXT NOT NULL,
        pilot_id TEXT REFERENCES pilots(id) ON DELETE CASCADE,
        entry_id TEXT REFERENCES entries(id) ON DELETE CASCADE,
        position INTEGER,
        total_score INTEGER DEFAULT 0,
        rounds_played INTEGER DEFAULT 0,
        score_details JSONB,
        is_official BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE results ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Kaikki voivat lukea tuloksia" 
        ON results FOR SELECT 
        USING (true);

    CREATE POLICY "Admins voivat hallita tuloksia" 
        ON results FOR ALL 
        USING (public.is_admin());

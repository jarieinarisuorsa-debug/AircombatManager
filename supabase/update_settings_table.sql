-- ==============================================================================
-- Aircombat Competition Manager
-- ADD SETTINGS TABLE
-- Aja tämä skripti Supabasen SQL Editorissa luodaksesi settings-taulun.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kaikki voivat lukea asetuksia" 
    ON settings FOR SELECT 
    USING (true);

CREATE POLICY "Admins voivat muokata asetuksia" 
    ON settings FOR ALL 
    USING (public.is_admin());

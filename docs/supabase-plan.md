# Supabase Database Plan (Phase 1 & 2)

Tämä dokumentti kuvaa alustavan tietokantarakenteen (taulut) RC Aircombat Competition Managerin siirtoa varten Supabaseen.

## Suunnitellut taulut

### 1. `profiles`
Käyttäjien profiilit, kytketty Supabasin sisäiseen `auth.users` -tauluun.
- `id` (UUID, primary key, viittaa auth.users.id)
- `email` (String)
- `display_name` (String)
- `role` (String, esim. "admin", "jarjestaja", "peruskayttaja")
- `created_at` (Timestamp)

### 2. `pilots`
Pilottirekisteri. Peruskäyttäjä voi yhdistää oman profiilinsa pilottiin.
- `id` (UUID, primary key)
- `profile_id` (UUID, viittaa profiles.id, nullable)
- `name` (String)
- `country` (String)
- `club` (String)
- `avatar_url` (String)
- `created_at` (Timestamp)

### 3. `aircraft_cards`
Pilottien omat konekortit ja niiden katsastustiedot.
- `id` (UUID, primary key)
- `pilot_id` (UUID, viittaa pilots.id)
- `name` (String)
- `class_name` (String)
- `engine_type` (String)
- `status` (String)
- `created_at` (Timestamp)

### 4. `events`
Kilpailut ja tapahtumat.
- `id` (UUID, primary key)
- `name` (String)
- `date` (Date)
- `location` (String)
- `status` (String, esim. "draft", "registration_open", "active", "completed")
- `format_config` (JSONB)
- `created_at` (Timestamp)

### 5. `entries`
Kilpailukohtaiset ilmoittautumiset (pilotin osallistuminen tiettyyn kisaan).
- `id` (UUID, primary key)
- `event_id` (UUID, viittaa events.id)
- `pilot_id` (UUID, viittaa pilots.id)
- `classes` (JSONB / Array)
- `status` (String)
- `created_at` (Timestamp)

### 6. `registration_requests`
Jonotus- tai hyväksyntäpyynnöt ilmoittautumisille.
- `id` (UUID, primary key)
- `event_id` (UUID, viittaa events.id)
- `profile_id` (UUID, viittaa profiles.id)
- `request_data` (JSONB)
- `status` (String, esim. "pending", "approved", "rejected")
- `created_at` (Timestamp)

### 7. `heats`
Erät ja niiden aikataulutus.
- `id` (UUID, primary key)
- `event_id` (UUID, viittaa events.id)
- `round_number` (Integer)
- `heat_number` (Integer)
- `class_name` (String)
- `status` (String)
- `created_at` (Timestamp)

### 8. `score_cards`
Viralliset tuloskortit.
- `id` (UUID, primary key)
- `heat_id` (UUID, viittaa heats.id)
- `pilot_id` (UUID, viittaa pilots.id)
- `score_data` (JSONB)
- `status` (String)
- `created_at` (Timestamp)

### 9. `score_submissions`
Digitaaliset tulossyötöt (esim. peruskäyttäjän puhelimella syöttämät alustavat tulokset).
- `id` (UUID, primary key)
- `score_card_id` (UUID, viittaa score_cards.id)
- `submitted_by` (UUID, viittaa profiles.id)
- `submission_data` (JSONB)
- `status` (String, "pending_approval", "approved", "rejected")
- `created_at` (Timestamp)

### 10. `permissions`
Hienojakoiset oikeudet (Row Level Security -tuki), esim. tietyt järjestäjät kilpailuihin.
- `id` (UUID, primary key)
- `profile_id` (UUID, viittaa profiles.id)
- `resource_type` (String, esim. "event")
- `resource_id` (UUID)
- `permission_level` (String, esim. "owner", "editor", "viewer")
- `created_at` (Timestamp)

### 11. `documents`
Kilpailujen julkaisemat tai jaetut asiakirjat (briefing-materiaalit).
- `id` (UUID, primary key)
- `event_id` (UUID, viittaa events.id)
- `title` (String)
- `file_url` (String)
- `created_at` (Timestamp)

### 12. `sponsors`
Tapahtuman tai kauden sponsorit.
- `id` (UUID, primary key)
- `event_id` (UUID, nullable, viittaa events.id)
- `name` (String)
- `logo_url` (String)
- `tier` (String)
- `created_at` (Timestamp)

### 13. `audit_log`
Muutoshistoria ja lokitiedot turvallisuutta varten.
- `id` (UUID, primary key)
- `actor_id` (UUID, viittaa profiles.id)
- `action` (String, esim. "UPDATE_SCORE")
- `target_type` (String)
- `target_id` (UUID)
- `old_data` (JSONB)
- `new_data` (JSONB)
- `created_at` (Timestamp)

---
*Tämä suunnitelma toimii pohjana Supabase-siirtymän vaiheille 2 ja 3, jolloin nykyinen localStorage-toteutus korvataan osittain tai kokonaan tietokantapohjaisilla ratkaisuilla ja RLS-suojauksilla.*

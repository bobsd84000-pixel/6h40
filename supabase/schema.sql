-- 6h40 — tables Supabase. À coller une fois dans Supabase → SQL Editor → Run.

-- Un relevé par jour (sert à l'historique du gazole et au mail du matin)
create table if not exists public.h640_releves (
  jour date primary key,
  donnees jsonb not null,
  cree_le timestamptz not null default now()
);

-- Abonnés Pro, alimentés par le webhook Lemon Squeezy
create table if not exists public.h640_abonnes (
  email text primary key,
  statut text not null,
  fin timestamptz,
  portail text,
  abonnement_id text,
  maj timestamptz not null default now()
);

-- Sécurité : personne ne lit ces tables depuis le navigateur.
-- Seul le serveur (clé service_role) y accède.
alter table public.h640_releves enable row level security;
alter table public.h640_abonnes enable row level security;

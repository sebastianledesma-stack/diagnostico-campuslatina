-- Diagnóstico de Madurez · CampusLatina
-- Ejecutar una vez en Supabase → SQL Editor.

create table if not exists public.diagnosticos (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  universidad    text not null check (char_length(universidad) between 1 and 200),
  pais           text not null check (char_length(pais) between 1 and 60),
  nombre         text not null check (char_length(nombre) between 1 and 200),
  cargo          text check (char_length(cargo) <= 200),
  email          text not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' and char_length(email) <= 254),
  whatsapp       text not null check (char_length(whatsapp) between 4 and 40),
  respuestas     jsonb not null,
  scores         jsonb not null,
  score_global   float4 not null check (score_global between 0 and 5),
  nivel          text not null check (nivel in ('Inicial','En desarrollo','Consolidado','Avanzado')),
  mail_enviado   boolean not null default false,
  notif_enviada  boolean not null default false
);

create index if not exists diagnosticos_created_at_idx   on public.diagnosticos (created_at desc);
create index if not exists diagnosticos_pais_idx         on public.diagnosticos (pais);
create index if not exists diagnosticos_score_global_idx on public.diagnosticos (score_global);

-- ── Row Level Security ───────────────────────────────────────────
-- La app pública (rol anon) solo puede INSERTAR, nunca leer, actualizar ni borrar.
-- Las Netlify Functions usan la service role key, que saltea RLS.
alter table public.diagnosticos enable row level security;

drop policy if exists "anon puede insertar diagnosticos" on public.diagnosticos;
create policy "anon puede insertar diagnosticos"
  on public.diagnosticos
  for insert
  to anon
  with check (
    -- el cliente no puede marcar como enviados los flags de notificación
    mail_enviado = false
    and notif_enviada = false
    -- ni fijar una fecha arbitraria
    and created_at between now() - interval '5 minutes' and now() + interval '5 minutes'
  );

-- Sin policies de SELECT/UPDATE/DELETE: quedan denegadas para anon y authenticated.
revoke select, update, delete on public.diagnosticos from anon, authenticated;
grant insert on public.diagnosticos to anon;

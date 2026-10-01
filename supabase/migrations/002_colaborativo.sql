-- Diagnóstico colaborativo: se guarda por etapa, se comparte con colegas y el informe
-- se genera recién cuando las 7 etapas están completas. Agrega la calificación por tamaño.
-- Ejecutar una vez en Supabase → SQL Editor. Es idempotente (se puede correr dos veces).

alter table public.diagnosticos
  -- 'en_curso' mientras falten etapas; 'completo' cuando se generó el informe.
  -- Las filas anteriores (todas completas) quedan en 'completo' por el default.
  add column if not exists estado           text not null default 'completo',
  -- Hash SHA-256 del link secreto (/d/<clave>). La clave en claro nunca se guarda.
  add column if not exists clave_hash       text,
  add column if not exists actualizado_at   timestamptz not null default now(),
  -- Calificación: rangos de src/data/calificacion.js.
  add column if not exists alumnos_actuales text,
  add column if not exists alumnos_meta     text,
  add column if not exists target           boolean,
  -- Quién respondió cada etapa: { "<etapa>": { "nombre": "...", "at": "..." } }
  add column if not exists etapas_por       jsonb not null default '{}'::jsonb,
  -- Colegas invitados: [{ "id", "nombre", "email", "etapas": [...], "at" }]
  add column if not exists colaboradores    jsonb not null default '[]'::jsonb;

do $$ begin
  alter table public.diagnosticos add constraint diagnosticos_estado_chk check (estado in ('en_curso', 'completo'));
exception when duplicate_object then null; end $$;

-- Un diagnóstico en curso todavía no tiene puntajes.
alter table public.diagnosticos alter column scores       drop not null;
alter table public.diagnosticos alter column score_global drop not null;
alter table public.diagnosticos alter column nivel        drop not null;

create unique index if not exists diagnosticos_clave_hash_idx on public.diagnosticos (clave_hash);
create index        if not exists diagnosticos_estado_idx     on public.diagnosticos (estado);

-- El navegador ya no escribe directo: todo pasa por las Netlify Functions (service key).
-- La policy de INSERT anónimo se mantiene solo para pestañas abiertas con la versión anterior.

-- Guardado atómico de una etapa: fusiona las respuestas en lugar de reemplazarlas,
-- así dos colegas que guardan etapas distintas al mismo tiempo no se pisan.
create or replace function public.guardar_etapa(p_clave_hash text, p_respuestas jsonb, p_etapa text, p_por jsonb)
returns setof public.diagnosticos language sql as $$
  update public.diagnosticos
     set respuestas     = coalesce(respuestas, '{}'::jsonb) || p_respuestas,
         etapas_por     = etapas_por || jsonb_build_object(p_etapa, p_por),
         actualizado_at = now()
   where clave_hash = p_clave_hash and estado = 'en_curso'
  returning *;
$$;

-- Alta atómica de un colega invitado (máximo 10 por diagnóstico).
create or replace function public.agregar_colaborador(p_clave_hash text, p_colaborador jsonb)
returns setof public.diagnosticos language sql as $$
  update public.diagnosticos
     set colaboradores  = colaboradores || jsonb_build_array(p_colaborador),
         actualizado_at = now()
   where clave_hash = p_clave_hash and estado = 'en_curso' and jsonb_array_length(colaboradores) < 10
  returning *;
$$;

-- Solo el servidor (service role) puede usarlas.
revoke execute on function public.guardar_etapa(text, jsonb, text, jsonb) from public, anon, authenticated;
revoke execute on function public.agregar_colaborador(text, jsonb) from public, anon, authenticated;
grant execute on function public.guardar_etapa(text, jsonb, text, jsonb) to service_role;
grant execute on function public.agregar_colaborador(text, jsonb) to service_role;

-- Diagnóstico colectivo: versión en vivo del diagnóstico para talleres en sala (REALCUP 2026).
-- Ejecutar una vez en Supabase → SQL Editor. Es idempotente (se puede correr dos veces).
--
-- Flujo: cada asistente escanea el QR y responde en su teléfono la etapa abierta (sin login ni datos
-- previos). Los expositores muestran los resultados de la sala cuando lo deciden, en 3 pasos
-- (resultado, mapa de calor, ideas para subir) y eligen entre todos las ideas que mostrarían el
-- potencial de mejora. Al cierre, cada asistente puede pedir por email el PDF con su mirada y la de la sala.
--
-- Tablas propias, separadas de los diagnósticos. Nadie las lee ni escribe directo: el teléfono y la
-- pantalla del expositor usan solo las funciones taller_* de este archivo, que validan cada pedido.
-- Los emails nunca viajan a la pantalla: solo los ve la exportación del expositor.
-- Los ids de etapa repiten los de src/data/etapas.js: si cambian allá, cambiarlos acá.

-- ── Tablas ───────────────────────────────────────────────────────

create table if not exists public.taller_sesiones (
  id             uuid primary key default gen_random_uuid(),
  codigo         text not null unique check (codigo ~ '^[A-Z0-9]{4,8}$'),
  nombre         text not null check (char_length(nombre) between 1 and 120),
  -- SHA-256 de "<id>:<clave del expositor>". La clave en claro nunca se guarda.
  clave_hash     text not null,
  -- Sesión de prueba: habilita la simulación de respuestas.
  demo           boolean not null default false,
  -- espera: QR · abierta: se responde la etapa · resultados: se muestran los de la etapa · cierre: la sala completa
  fase           text not null default 'espera' check (fase in ('espera', 'abierta', 'resultados', 'cierre')),
  -- Etapa actual, de 1 a 7. 0 antes de abrir la primera.
  etapa          smallint not null default 0 check (etapa between 0 and 7),
  -- Etapas cuyos resultados ya se mostraron: solo esas llegan a los teléfonos.
  reveladas      smallint[] not null default '{}',
  -- Qué se proyecta. En resultados: 'resultado', 'mapa' o 'ideas'. En el cierre: 'resumen', 'mapa' o 'estadisticas'.
  vista          text not null default 'resultado' check (vista in ('resultado', 'mapa', 'ideas', 'resumen', 'estadisticas')),
  -- Ideas para subir que la sala eligió en cada etapa: { "<etapa>": ["r0", "n2", ...] }
  -- (r<i> = acción de arranque i de src/data/recs.js; n<q> = próximo nivel de la pregunta q).
  elegidas       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

create table if not exists public.taller_participantes (
  sesion_id  uuid not null references public.taller_sesiones (id) on delete cascade,
  -- Generado en el teléfono (localStorage) para retomar sin duplicar.
  id         uuid not null,
  orden      bigint generated always as identity,
  origen     text not null default 'movil' check (origen in ('movil', 'simulado')),
  creado_at  timestamptz not null default now(),
  -- Último pedido desde el teléfono: define quién cuenta como conectado.
  visto_at   timestamptz not null default now(),
  primary key (sesion_id, id)
);

create table if not exists public.taller_respuestas (
  sesion_id       uuid not null,
  participante_id uuid not null,
  -- Misma clave que el diagnóstico: "<etapa>_<índice de la pregunta>", por ejemplo "activacion_1".
  pregunta        text not null check (pregunta ~ '^[a-z]+_[0-3]$'),
  letra           text not null check (letra in ('A', 'B', 'C', 'D')),
  actualizado_at  timestamptz not null default now(),
  primary key (sesion_id, participante_id, pregunta),
  foreign key (sesion_id, participante_id)
    references public.taller_participantes (sesion_id, id) on delete cascade
);

-- Cada informe pedido por email: a quién, qué PDF (en Storage, bucket taller-informes) y cómo salió.
create table if not exists public.taller_envios (
  id              bigint generated always as identity primary key,
  sesion_id       uuid not null,
  participante_id uuid not null,
  email           text not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' and char_length(email) <= 254),
  archivo         text,
  creado_at       timestamptz not null default now(),
  enviado_at      timestamptz,
  error           text,
  foreign key (sesion_id, participante_id)
    references public.taller_participantes (sesion_id, id) on delete cascade
);
create index if not exists taller_envios_sesion_idx on public.taller_envios (sesion_id);

-- Sin policies: anon y authenticated no pueden tocar las tablas. Solo las funciones de abajo.
alter table public.taller_sesiones      enable row level security;
alter table public.taller_participantes enable row level security;
alter table public.taller_respuestas    enable row level security;
alter table public.taller_envios        enable row level security;
revoke all on public.taller_sesiones, public.taller_participantes, public.taller_respuestas, public.taller_envios from anon, authenticated;

-- Bucket privado para los PDF enviados (solo existe en Supabase; la base local no tiene Storage).
do $$ begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public) values ('taller-informes', 'taller-informes', false)
    on conflict (id) do nothing;
  end if;
end $$;

-- ── Funciones internas (no se exponen a la API) ───────────────────

-- Las 7 etapas en orden. La posición (1 a 7) es el número de etapa.
create or replace function public.taller_etapas()
returns text[] language sql immutable as $$
  select array['descubrimiento', 'exploracion', 'activacion', 'acompanamiento', 'decision', 'inscripcion', 'retencion']
$$;

create or replace function public.taller_hash(p_id uuid, p_clave text)
returns text language sql immutable as $$
  select encode(sha256(convert_to(p_id::text || ':' || coalesce(p_clave, ''), 'UTF8')), 'hex')
$$;

create or replace function public.taller_sesion(p_codigo text)
returns public.taller_sesiones language plpgsql stable set search_path = public, pg_temp as $$
declare s taller_sesiones;
begin
  select * into s from taller_sesiones where codigo = upper(btrim(coalesce(p_codigo, '')));
  if not found then raise exception 'sesion_no_encontrada'; end if;
  return s;
end $$;

create or replace function public.taller_sesion_admin(p_codigo text, p_clave text)
returns public.taller_sesiones language plpgsql stable set search_path = public, pg_temp as $$
declare s taller_sesiones;
begin
  s := taller_sesion(p_codigo);
  if s.clave_hash <> taller_hash(s.id, p_clave) then raise exception 'clave_incorrecta'; end if;
  return s;
end $$;

-- Ids de las etapas reveladas: lo único que ven los teléfonos.
create or replace function public.taller_ids(p_reveladas smallint[])
returns text[] language sql immutable set search_path = public, pg_temp as $$
  select coalesce(array_agg((taller_etapas())[n] order by n), '{}') from unnest(p_reveladas) n
$$;

create or replace function public.taller_elegidas_publicas(p_elegidas jsonb, p_ids text[])
returns jsonb language sql immutable as $$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from jsonb_each(p_elegidas) where key = any (p_ids)
$$;

-- Huella del estado para la pantalla del expositor: cambia con cualquier respuesta, alta o cambio
-- de fase. Es una huella del contenido (no una marca de tiempo) para no perder escrituras concurrentes.
create or replace function public.taller_version(p_sesion uuid)
returns text language sql stable set search_path = public, pg_temp as $$
  select md5(
    coalesce((select s.fase || s.etapa || s.reveladas::text || s.vista || s.elegidas::text
                from taller_sesiones s where s.id = p_sesion), '') || '|' ||
    coalesce((select string_agg(p.id::text, ',' order by p.orden)
                from taller_participantes p where p.sesion_id = p_sesion), '') || '|' ||
    coalesce((select string_agg(r.participante_id::text || r.pregunta || r.letra, ',' order by r.participante_id, r.pregunta)
                from taller_respuestas r where r.sesion_id = p_sesion), '')
  )
$$;

-- Huella de lo que ya se mostró: el teléfono vuelve a pedir los resultados solo si cambió.
create or replace function public.taller_huella_publica(p_sesion uuid, p_ids text[], p_elegidas jsonb)
returns text language sql stable set search_path = public, pg_temp as $$
  select case when cardinality(p_ids) = 0 then null else md5(
    p_ids::text || '|' || p_elegidas::text || '|' ||
    coalesce((select string_agg(r.participante_id::text || r.pregunta || r.letra, ',' order by r.participante_id, r.pregunta)
                from taller_respuestas r where r.sesion_id = p_sesion and split_part(r.pregunta, '_', 1) = any (p_ids)), '')
  ) end
$$;

-- Una fila por participante, sin su id (el id es lo que le permite responder: no se comparte).
-- n es el número correlativo por orden de llegada. p_etapas = null trae todas las respuestas.
create or replace function public.taller_filas(p_sesion uuid, p_etapas text[])
returns jsonb language sql stable set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object('n', f.n, 'origen', f.origen, 'r', f.r) order by f.n), '[]'::jsonb)
  from (
    select row_number() over (order by p.orden) as n, p.origen,
           coalesce((select jsonb_object_agg(r.pregunta, r.letra) from taller_respuestas r
                      where r.sesion_id = p.sesion_id and r.participante_id = p.id
                        and (p_etapas is null or split_part(r.pregunta, '_', 1) = any (p_etapas))), '{}'::jsonb) as r
      from taller_participantes p
     where p.sesion_id = p_sesion
  ) f
$$;

-- Alta del participante la primera vez que su teléfono consulta (sin datos: solo el id del teléfono).
create or replace function public.taller_alta(p_sesion uuid, p_participante uuid)
returns boolean language plpgsql set search_path = public, pg_temp as $$
begin
  if exists (select 1 from taller_participantes where sesion_id = p_sesion and id = p_participante) then return true; end if;
  if (select count(*) from taller_participantes where sesion_id = p_sesion) >= 300 then return false; end if;
  insert into taller_participantes (sesion_id, id) values (p_sesion, p_participante) on conflict do nothing;
  return true;
end $$;

-- ── API pública (rol anon): teléfonos ────────────────────────────

-- Crea una sesión. No hay login: cualquiera puede crearla, con un tope por hora contra abusos.
create or replace function public.taller_crear(p_nombre text, p_clave text, p_codigo text default null, p_demo boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id      uuid := gen_random_uuid();
  v_nombre  text := btrim(coalesce(p_nombre, ''));
  v_codigo  text := upper(btrim(coalesce(p_codigo, '')));
  -- Sin letras ni números que se confunden al leerlos en una pantalla (0/O, 1/I/L).
  v_letras  constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  if char_length(v_nombre) not between 1 and 120 then raise exception 'nombre_invalido'; end if;
  if char_length(coalesce(p_clave, '')) not between 6 and 100 then raise exception 'clave_corta'; end if;
  if (select count(*) from taller_sesiones where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'demasiadas_sesiones';
  end if;
  if v_codigo <> '' then
    if v_codigo !~ '^[A-Z0-9]{4,8}$' then raise exception 'codigo_invalido'; end if;
    if exists (select 1 from taller_sesiones where codigo = v_codigo) then raise exception 'codigo_en_uso'; end if;
  else
    loop
      select string_agg(substr(v_letras, 1 + floor(random() * length(v_letras))::int, 1), '')
        into v_codigo from generate_series(1, 4);
      exit when not exists (select 1 from taller_sesiones where codigo = v_codigo);
    end loop;
  end if;
  insert into taller_sesiones (id, codigo, nombre, clave_hash, demo)
  values (v_id, v_codigo, v_nombre, taller_hash(v_id, p_clave), coalesce(p_demo, false));
  return jsonb_build_object('codigo', v_codigo);
end $$;

-- Estado para el teléfono. Con p_participante lo da de alta (la primera vez), marca que sigue
-- conectado y devuelve sus respuestas, para retomar donde estaba si perdió la conexión o recargó.
create or replace function public.taller_estado(p_codigo text, p_participante uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s      taller_sesiones;
  v_ok   boolean := false;
  v_mias jsonb := '{}'::jsonb;
  v_ids  text[];
begin
  s := taller_sesion(p_codigo);
  v_ids := taller_ids(s.reveladas);
  if p_participante is not null then
    v_ok := taller_alta(s.id, p_participante);
    -- Se escribe como mucho cada 10 s por teléfono: alcanza para el contador de conectados.
    update taller_participantes set visto_at = now()
     where sesion_id = s.id and id = p_participante and visto_at < now() - interval '10 seconds';
    select coalesce(jsonb_object_agg(pregunta, letra), '{}'::jsonb) into v_mias
      from taller_respuestas where sesion_id = s.id and participante_id = p_participante;
  end if;
  return jsonb_build_object(
    'codigo', s.codigo, 'nombre', s.nombre, 'fase', s.fase, 'etapa', s.etapa,
    'reveladas', to_jsonb(s.reveladas), 'demo', s.demo, 'registrado', v_ok, 'mias', v_mias,
    'publico', taller_huella_publica(s.id, v_ids, taller_elegidas_publicas(s.elegidas, v_ids))
  );
end $$;

-- Guarda respuestas de la etapa abierta: { "activacion_0": "B", ... }. Reenviar no duplica.
-- Solo acepta preguntas de la etapa abierta; devuelve cuáles guardó para que el teléfono las saque de su cola.
create or replace function public.taller_responder(p_codigo text, p_participante uuid, p_respuestas jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s           taller_sesiones;
  v_etapa     text;
  v_aceptadas text[] := '{}';
  k           text;
  v           text;
begin
  s := taller_sesion(p_codigo);
  if p_participante is null or not taller_alta(s.id, p_participante) then raise exception 'sesion_llena'; end if;
  if s.fase <> 'abierta' then raise exception 'etapa_cerrada'; end if;
  if jsonb_typeof(p_respuestas) is distinct from 'object' then raise exception 'datos_invalidos'; end if;
  v_etapa := (taller_etapas())[s.etapa];
  for k, v in select key, value from jsonb_each_text(p_respuestas) loop
    if k ~ ('^' || v_etapa || '_[0-3]$') and v in ('A', 'B', 'C', 'D') then
      insert into taller_respuestas (sesion_id, participante_id, pregunta, letra)
      values (s.id, p_participante, k, v)
      on conflict (sesion_id, participante_id, pregunta) do update
        set letra = excluded.letra, actualizado_at = now()
        where taller_respuestas.letra is distinct from excluded.letra;
      v_aceptadas := v_aceptadas || k;
    end if;
  end loop;
  update taller_participantes set visto_at = now() where sesion_id = s.id and id = p_participante;
  return jsonb_build_object('ok', true, 'etapa', s.etapa, 'aceptadas', to_jsonb(v_aceptadas));
end $$;

-- Resultados para los teléfonos: solo las etapas que los expositores ya mostraron.
create or replace function public.taller_resultados(p_codigo text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s     taller_sesiones;
  v_ids text[];
begin
  s := taller_sesion(p_codigo);
  v_ids := taller_ids(s.reveladas);
  return jsonb_build_object(
    'nombre', s.nombre, 'fase', s.fase, 'etapa', s.etapa, 'reveladas', to_jsonb(s.reveladas),
    'elegidas', taller_elegidas_publicas(s.elegidas, v_ids),
    'publico', taller_huella_publica(s.id, v_ids, taller_elegidas_publicas(s.elegidas, v_ids)),
    'participantes', taller_filas(s.id, v_ids)
  );
end $$;

-- ── API del expositor (requiere la clave) ────────────────────────

-- Todo el estado para la pantalla del expositor. Con p_version igual a la huella actual solo
-- devuelve los contadores: así las consultas cada 2 s pesan casi nada.
create or replace function public.taller_panel(p_codigo text, p_clave text, p_version text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s            taller_sesiones;
  v_version    text;
  v_conectados int;
  v_envios     int;
begin
  s := taller_sesion_admin(p_codigo, p_clave);
  v_version := taller_version(s.id);
  -- Los sintéticos (sesiones de prueba) cuentan siempre como conectados.
  select count(*) into v_conectados from taller_participantes
   where sesion_id = s.id and (origen = 'simulado' or visto_at > now() - interval '45 seconds');
  select count(distinct participante_id) into v_envios from taller_envios where sesion_id = s.id and enviado_at is not null;
  if p_version is not distinct from v_version then
    return jsonb_build_object('version', v_version, 'sin_cambios', true, 'conectados', v_conectados, 'envios', v_envios);
  end if;
  return jsonb_build_object(
    'version', v_version, 'conectados', v_conectados, 'envios', v_envios,
    'codigo', s.codigo, 'nombre', s.nombre, 'fase', s.fase, 'etapa', s.etapa,
    'reveladas', to_jsonb(s.reveladas), 'demo', s.demo, 'vista', s.vista, 'elegidas', s.elegidas,
    'participantes', taller_filas(s.id, null)
  );
end $$;

-- Avance del taller. Acciones:
--   abrir <etapa>            abre (o reabre) una etapa; si se reabre, sus resultados vuelven a ocultarse
--   mostrar [etapa] [vista]  cierra la etapa y muestra sus resultados en pantalla y teléfonos
--   cierre [vista]           la sala completa, con todas las etapas
--   espera                   vuelve a la pantalla del QR
create or replace function public.taller_control(p_codigo text, p_clave text, p_accion text, p_etapa int default null, p_vista text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s       taller_sesiones;
  v_etapa int;
begin
  s := taller_sesion_admin(p_codigo, p_clave);
  v_etapa := coalesce(p_etapa, s.etapa);
  if p_accion in ('abrir', 'mostrar') and v_etapa not between 1 and 7 then raise exception 'etapa_invalida'; end if;
  if p_accion = 'mostrar' and coalesce(p_vista, 'resultado') not in ('resultado', 'mapa', 'ideas') then raise exception 'datos_invalidos'; end if;
  if p_accion = 'cierre' and coalesce(p_vista, 'resumen') not in ('resumen', 'mapa', 'estadisticas') then raise exception 'datos_invalidos'; end if;
  case p_accion
    when 'abrir' then
      update taller_sesiones
         set fase = 'abierta', etapa = v_etapa, reveladas = array_remove(reveladas, v_etapa::smallint), actualizado_at = now()
       where id = s.id;
    when 'mostrar' then
      update taller_sesiones
         set fase = 'resultados', etapa = v_etapa, vista = coalesce(p_vista, 'resultado'), actualizado_at = now(),
             reveladas = (select array_agg(distinct x order by x) from unnest(reveladas || v_etapa::smallint) x)
       where id = s.id;
    when 'cierre' then
      update taller_sesiones
         set fase = 'cierre', reveladas = '{1,2,3,4,5,6,7}', vista = coalesce(p_vista, 'resumen'), actualizado_at = now()
       where id = s.id;
    when 'espera' then
      update taller_sesiones set fase = 'espera', actualizado_at = now() where id = s.id;
    else
      raise exception 'accion_invalida';
  end case;
  return taller_panel(p_codigo, p_clave, null);
end $$;

-- Qué se proyecta dentro de los resultados de una etapa o del cierre.
create or replace function public.taller_vista(p_codigo text, p_clave text, p_vista text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare s taller_sesiones;
begin
  s := taller_sesion_admin(p_codigo, p_clave);
  if not ((s.fase = 'resultados' and p_vista in ('resultado', 'mapa', 'ideas'))
       or (s.fase = 'cierre' and p_vista in ('resumen', 'mapa', 'estadisticas'))) then
    raise exception 'datos_invalidos';
  end if;
  update taller_sesiones set vista = p_vista, actualizado_at = now() where id = s.id;
  return taller_panel(p_codigo, p_clave, null);
end $$;

-- Ideas que la sala eligió para una etapa (la lista completa: reemplaza la anterior).
create or replace function public.taller_elegir(p_codigo text, p_clave text, p_etapa int, p_claves jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s    taller_sesiones;
  v_id text;
begin
  s := taller_sesion_admin(p_codigo, p_clave);
  if coalesce(p_etapa, 0) not between 1 and 7 or jsonb_typeof(p_claves) is distinct from 'array'
     or exists (select 1 from jsonb_array_elements_text(p_claves) c where c !~ '^[rn][0-3]$') then
    raise exception 'datos_invalidos';
  end if;
  v_id := (taller_etapas())[p_etapa];
  update taller_sesiones
     set elegidas = case when jsonb_array_length(p_claves) = 0 then elegidas - v_id
                         else elegidas || jsonb_build_object(v_id, (select jsonb_agg(distinct c) from jsonb_array_elements_text(p_claves) c)) end,
         actualizado_at = now()
   where id = s.id;
  return taller_panel(p_codigo, p_clave, null);
end $$;

-- Exportación para los expositores: todas las respuestas y el último email de cada participante.
create or replace function public.taller_exportar(p_codigo text, p_clave text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare s taller_sesiones;
begin
  s := taller_sesion_admin(p_codigo, p_clave);
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
             'n', f.n, 'origen', f.origen, 'email', f.email, 'enviado', f.enviado, 'r', f.r) order by f.n), '[]'::jsonb)
    from (
      select row_number() over (order by p.orden) as n, p.origen,
             (select e.email from taller_envios e where e.sesion_id = p.sesion_id and e.participante_id = p.id order by e.creado_at desc limit 1) as email,
             exists (select 1 from taller_envios e where e.sesion_id = p.sesion_id and e.participante_id = p.id and e.enviado_at is not null) as enviado,
             coalesce((select jsonb_object_agg(r.pregunta, r.letra) from taller_respuestas r
                        where r.sesion_id = p.sesion_id and r.participante_id = p.id), '{}'::jsonb) as r
        from taller_participantes p
       where p.sesion_id = s.id
    ) f
  );
end $$;

-- ── Informe por email (solo el servidor, con la service key) ─────

-- Valida el pedido y devuelve todo lo que lleva el PDF: las respuestas de la persona y las de la sala.
-- Deja registrado el envío como pendiente; taller_envio_terminar lo completa.
create or replace function public.taller_envio_iniciar(p_codigo text, p_participante uuid, p_email text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s      taller_sesiones;
  v_id   bigint;
  v_mias jsonb;
  v_mail text := lower(btrim(coalesce(p_email, '')));
begin
  s := taller_sesion(p_codigo);
  if s.fase <> 'cierre' then raise exception 'todavia_no'; end if;
  if v_mail !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or char_length(v_mail) > 254 then raise exception 'email_invalido'; end if;
  if not exists (select 1 from taller_participantes where sesion_id = s.id and id = p_participante) then raise exception 'no_registrado'; end if;
  -- Topes contra el uso del formulario para mandar mails a terceros.
  if (select count(*) from taller_envios where sesion_id = s.id and participante_id = p_participante) >= 3 then raise exception 'demasiados_envios'; end if;
  if (select count(*) from taller_envios where sesion_id = s.id) >= 600 then raise exception 'demasiados_envios'; end if;
  insert into taller_envios (sesion_id, participante_id, email) values (s.id, p_participante, v_mail) returning id into v_id;
  select coalesce(jsonb_object_agg(pregunta, letra), '{}'::jsonb) into v_mias
    from taller_respuestas where sesion_id = s.id and participante_id = p_participante;
  return jsonb_build_object(
    'envio', v_id, 'codigo', s.codigo, 'nombre', s.nombre, 'email', v_mail,
    'mias', v_mias, 'elegidas', s.elegidas, 'participantes', taller_filas(s.id, null)
  );
end $$;

create or replace function public.taller_envio_terminar(p_envio bigint, p_archivo text, p_ok boolean, p_error text default null)
returns void language sql security definer set search_path = public, pg_temp as $$
  update taller_envios
     set archivo = p_archivo, enviado_at = case when p_ok then now() end, error = case when p_ok then null else left(p_error, 500) end
   where id = p_envio
$$;

-- ── Respuestas sintéticas (ensayo y demo) ─────────────────────────

-- Elige un valor de p_valores con las probabilidades de p_pesos (que suman 1).
create or replace function public.taller_al_azar(p_valores text[], p_pesos numeric[])
returns text language plpgsql volatile as $$
declare
  x numeric := random();
  i int;
begin
  for i in 1 .. array_length(p_valores, 1) loop
    x := x - p_pesos[i];
    if x < 0 then return p_valores[i]; end if;
  end loop;
  return p_valores[array_length(p_valores, 1)];
end $$;

-- Alta de un participante sintético. El id sale de random() (no de gen_random_uuid) para que la
-- siembra con setseed sea reproducible.
create or replace function public.taller_participante_sintetico(p_sesion uuid)
returns uuid language plpgsql volatile set search_path = public, pg_temp as $$
declare v_id uuid := md5(random()::text)::uuid;
begin
  insert into taller_participantes (sesion_id, id, origen) values (p_sesion, v_id, 'simulado');
  return v_id;
end $$;

-- Las 4 respuestas sintéticas de un participante en una etapa. Cada etapa tiene su propia
-- probabilidad de A o B (activación y retención temprana, las más flojas, para que se vea una fuga)
-- y cada participante es un poco más optimista o pesimista que el resto, para que el mapa de calor
-- no sea uniforme.
create or replace function public.taller_responder_sintetico(p_sesion uuid, p_participante uuid, p_etapa int)
returns void language plpgsql volatile set search_path = public, pg_temp as $$
declare
  v_id   text := (taller_etapas())[p_etapa];
  v_bajo numeric := (array[.45, .50, .70, .60, .50, .40, .78])[p_etapa]
                    + (abs(hashtext(p_participante::text)) % 1000) / 1000.0 * .4 - .2;
  q int;
begin
  v_bajo := least(.95, greatest(.05, v_bajo));
  for q in 0 .. 3 loop
    insert into taller_respuestas (sesion_id, participante_id, pregunta, letra)
    values (p_sesion, p_participante, v_id || '_' || q,
            taller_al_azar(array['A', 'B', 'C', 'D'], array[v_bajo * .35, v_bajo * .65, (1 - v_bajo) * .7, (1 - v_bajo) * .3]))
    on conflict (sesion_id, participante_id, pregunta) do nothing;
  end loop;
end $$;

-- "Simular respuestas" de la pantalla del expositor, solo en sesiones de prueba. Se llama cada
-- 1,5 s: en cada llamada se suman hasta p_cantidad participantes sintéticos (hasta p_total) y, si
-- hay una etapa abierta, hasta p_cantidad de ellos la responden. Así el contador sube de a poco.
create or replace function public.taller_simular(p_codigo text, p_clave text, p_cantidad int default 3, p_total int default 46)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s       taller_sesiones;
  v_hay   int;
  v_alta  int;
  v_resp  int := 0;
  v_id    uuid;
  v_etapa text;
begin
  s := taller_sesion_admin(p_codigo, p_clave);
  if not s.demo then raise exception 'no_es_prueba'; end if;
  p_cantidad := least(greatest(coalesce(p_cantidad, 3), 1), 20);
  p_total := least(greatest(coalesce(p_total, 46), 1), 120);
  select count(*) into v_hay from taller_participantes where sesion_id = s.id and origen = 'simulado';
  v_alta := least(p_cantidad, greatest(p_total - v_hay, 0));
  for i in 1 .. v_alta loop perform taller_participante_sintetico(s.id); end loop;
  if s.fase = 'abierta' then
    v_etapa := (taller_etapas())[s.etapa];
    for v_id in
      select p.id from taller_participantes p
       where p.sesion_id = s.id and p.origen = 'simulado'
         and (select count(*) from taller_respuestas r
               where r.sesion_id = s.id and r.participante_id = p.id and split_part(r.pregunta, '_', 1) = v_etapa) < 4
       order by random() limit p_cantidad
    loop
      perform taller_responder_sintetico(s.id, v_id, s.etapa);
      v_resp := v_resp + 1;
    end loop;
  end if;
  return jsonb_build_object('agregados', v_alta, 'respondieron', v_resp);
end $$;

-- Sesión de demo sembrada: 46 participantes sintéticos con las 28 respuestas, lista para mostrar
-- todo el flujo sin gente. Si ya existe una sesión con ese código, se borra y se vuelve a crear.
-- No se expone a la API: se corre desde el SQL Editor de Supabase (o la corre sola la base local):
--   select public.taller_sembrar('DEMO', 'una-clave-larga');
-- Con p_cierre = true queda directo en el cierre, con las acciones de arranque elegidas.
create or replace function public.taller_sembrar(p_codigo text, p_clave text, p_nombre text default 'REALCUP 2026 · Guayaquil (demo)',
                                                 p_total int default 46, p_cierre boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s    taller_sesiones;
  v_id uuid;
begin
  delete from taller_sesiones where codigo = upper(btrim(coalesce(p_codigo, '')));
  perform taller_crear(p_nombre, p_clave, p_codigo, true);
  s := taller_sesion(p_codigo);
  -- Misma semilla siempre: la demo muestra el mismo patrón cada vez que se siembra.
  perform setseed(0.2026);
  for i in 1 .. least(greatest(coalesce(p_total, 46), 1), 120) loop
    v_id := taller_participante_sintetico(s.id);
    for n in 1 .. 7 loop perform taller_responder_sintetico(s.id, v_id, n); end loop;
  end loop;
  if p_cierre then
    update taller_sesiones
       set elegidas = (select jsonb_object_agg(e, '["r0", "r1", "r2"]'::jsonb) from unnest(taller_etapas()) e)
     where id = s.id;
    perform taller_control(s.codigo, p_clave, 'cierre');
  end if;
  return jsonb_build_object('codigo', s.codigo, 'participantes', (select count(*) from taller_participantes where sesion_id = s.id));
end $$;

-- ── Permisos ─────────────────────────────────────────────────────

do $$
declare f text;
begin
  -- Internas: nadie desde la API.
  foreach f in array array[
    'taller_etapas()', 'taller_hash(uuid, text)', 'taller_sesion(text)', 'taller_sesion_admin(text, text)',
    'taller_ids(smallint[])', 'taller_elegidas_publicas(jsonb, text[])', 'taller_version(uuid)',
    'taller_huella_publica(uuid, text[], jsonb)', 'taller_filas(uuid, text[])', 'taller_alta(uuid, uuid)',
    'taller_al_azar(text[], numeric[])', 'taller_participante_sintetico(uuid)', 'taller_responder_sintetico(uuid, uuid, int)',
    'taller_sembrar(text, text, text, int, boolean)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
  -- Solo el servidor (service role): informe por email.
  foreach f in array array['taller_envio_iniciar(text, uuid, text)', 'taller_envio_terminar(bigint, text, boolean, text)'] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
  -- API: teléfonos y expositores (estos últimos validan la clave adentro).
  foreach f in array array[
    'taller_crear(text, text, text, boolean)', 'taller_estado(text, uuid)', 'taller_responder(text, uuid, jsonb)',
    'taller_resultados(text)', 'taller_panel(text, text, text)', 'taller_control(text, text, text, int, text)',
    'taller_vista(text, text, text)', 'taller_elegir(text, text, int, jsonb)', 'taller_exportar(text, text)',
    'taller_simular(text, text, int, int)'
  ] loop
    execute format('revoke execute on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;

-- Que la API de Supabase vea las funciones nuevas sin esperar.
notify pgrst, 'reload schema';

-- Taller: el cierre suma un paso, «El informe», que muestra en pantalla el PDF que recibe cada
-- asistente. Agrega la vista 'informe' a la tabla y a las funciones que avanzan el taller.
-- Ejecutar una vez en Supabase → SQL Editor, después de 003_taller.sql. Es idempotente.

alter table public.taller_sesiones drop constraint if exists taller_sesiones_vista_check;
alter table public.taller_sesiones add constraint taller_sesiones_vista_check
  check (vista in ('resultado', 'mapa', 'ideas', 'resumen', 'estadisticas', 'informe'));

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
  if p_accion = 'cierre' and coalesce(p_vista, 'resumen') not in ('resumen', 'mapa', 'estadisticas', 'informe') then raise exception 'datos_invalidos'; end if;
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
       or (s.fase = 'cierre' and p_vista in ('resumen', 'mapa', 'estadisticas', 'informe'))) then
    raise exception 'datos_invalidos';
  end if;
  update taller_sesiones set vista = p_vista, actualizado_at = now() where id = s.id;
  return taller_panel(p_codigo, p_clave, null);
end $$;

notify pgrst, 'reload schema';

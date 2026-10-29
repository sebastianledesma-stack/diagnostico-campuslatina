-- Taller: el primer paso es «Antes de empezar» (cómo funciona el ejercicio), antes de la pantalla del
-- QR. Las sesiones nuevas arrancan ahí; la acción 'espera' con p_vista = 'protocolo' vuelve a mostrarla.
-- Ejecutar una vez en Supabase → SQL Editor, después de 003 y 006. Es idempotente.

alter table public.taller_sesiones drop constraint if exists taller_sesiones_vista_check;
alter table public.taller_sesiones add constraint taller_sesiones_vista_check
  check (vista in ('resultado', 'mapa', 'ideas', 'resumen', 'estadisticas', 'informe', 'protocolo'));
alter table public.taller_sesiones alter column vista set default 'protocolo';

-- Avance del taller. Acciones:
--   abrir <etapa>            abre (o reabre) una etapa; si se reabre, sus resultados vuelven a ocultarse
--   mostrar [etapa] [vista]  cierra la etapa y muestra sus resultados en pantalla y teléfonos
--   cierre [vista]           la sala completa, con todas las etapas
--   espera [protocolo]       vuelve a la pantalla del QR (o, con 'protocolo', a «Antes de empezar»)
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
  if p_accion = 'espera' and coalesce(p_vista, 'protocolo') <> 'protocolo' then raise exception 'datos_invalidos'; end if;
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
      -- Con p_vista = 'protocolo', «Antes de empezar»; si no, la pantalla del QR.
      update taller_sesiones set fase = 'espera', vista = coalesce(p_vista, 'resultado'), actualizado_at = now() where id = s.id;
    else
      raise exception 'accion_invalida';
  end case;
  return taller_panel(p_codigo, p_clave, null);
end $$;

notify pgrst, 'reload schema';

-- Diagnósticos de prueba: el panel puede marcarlos como test para que no cuenten en las métricas,
-- el CSV ni el informe consolidado. Siguen guardados y se ven en la solapa Tests del panel.
-- Ejecutar una vez en Supabase → SQL Editor. Es idempotente (se puede correr dos veces).

alter table public.diagnosticos
  add column if not exists es_test boolean not null default false;

create index if not exists diagnosticos_es_test_idx on public.diagnosticos (es_test);

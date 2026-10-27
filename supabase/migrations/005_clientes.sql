-- Universidades que trabajan con Campus Latina: el panel las marca para diferenciarlas del resto
-- (posiblemente tengan mejores resultados). La marca va por institución: el panel la guarda en todos
-- sus diagnósticos y muestra «Cliente» en cualquiera de ellos.
-- Ejecutar una vez en Supabase → SQL Editor. Es idempotente (se puede correr dos veces).

alter table public.diagnosticos
  add column if not exists es_cliente boolean not null default false;

create index if not exists diagnosticos_es_cliente_idx on public.diagnosticos (es_cliente);

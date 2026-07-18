-- ============================================================
-- The Glam Room SZ — Esquema de base de datos para Supabase
-- ============================================================
-- Cómo usar este archivo:
-- 1. Entrá a tu proyecto en https://supabase.com
-- 2. En el menú de la izquierda, andá a "SQL Editor"
-- 3. Creá una consulta nueva, pegá TODO este archivo, y tocá "Run"
-- ============================================================

-- Una sola tabla que guarda cada "sección" de la app como un bloque
-- de datos (servicios, empleadas, turnos, finanzas, etc.), igual a
-- como funcionaba dentro de Claude. Esto simplifica todo el proyecto.
create table if not exists app_data (
  key text primary key,
  value jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Habilitamos "Row Level Security" (obligatorio en Supabase) pero con
-- una política abierta: cualquiera con el link de la app puede leer y
-- escribir. La seguridad real la sigue dando el PIN dentro de la app
-- (igual que funcionaba antes). Si en el futuro querés login real de
-- verdad por usuario, hay que rediseñar esta parte.
alter table app_data enable row level security;

drop policy if exists "Acceso público de lectura" on app_data;
create policy "Acceso público de lectura"
  on app_data for select
  to anon
  using (true);

drop policy if exists "Acceso público de escritura" on app_data;
create policy "Acceso público de escritura"
  on app_data for insert
  to anon
  with check (true);

drop policy if exists "Acceso público de actualización" on app_data;
create policy "Acceso público de actualización"
  on app_data for update
  to anon
  using (true)
  with check (true);

-- Habilitamos actualizaciones en tiempo real: si una empleada carga un
-- turno desde su celular, el dueño lo ve aparecer solo, sin recargar.
alter publication supabase_realtime add table app_data;

-- Fila inicial de ajustes (PINs por defecto, iguales a los de antes).
-- Cambialos apenas entres a la app, desde Panel → Ajustes.
insert into app_data (key, value)
values (
  'glamroom:settings',
  '{"adminPin":"1234","staffPin":"0000","paymentLink":"","depositNote":""}'::jsonb
)
on conflict (key) do nothing;

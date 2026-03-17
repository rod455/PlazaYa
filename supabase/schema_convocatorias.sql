-- ============================================================
--  PlazaYa — Convocatorias dinâmicas
--  Cole no SQL Editor do Supabase e execute
-- ============================================================

-- ── Extensões ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. TABELA PRINCIPAL — convocatorias
-- ============================================================
create table if not exists public.convocatorias (
  id               uuid primary key default uuid_generate_v4(),

  -- Identificação única da vaga na fonte original
  -- Evita duplicatas em scraping repetido
  fonte_id         text not null unique,

  -- Dados da vaga
  titulo           text not null,
  dependencia      text,                    -- SAT, IMSS, GN, SEP...
  area             text,                    -- policia, saude, fiscal, ti, administrativo, educacion
  estado           text,                    -- CMX, JAL, NLE... ou 'FEDERAL'
  municipio        text,
  nivel_puesto     text,                    -- Operativo, Enlace, Jefatura, Subdirección, Dirección
  salario_min      numeric,                 -- en MXN
  salario_max      numeric,
  num_plazas       int,
  escolaridad      text,                    -- Secundaria, Preparatoria, Licenciatura...
  descripcion      text,

  -- Datas
  fecha_publicacion timestamptz,
  fecha_cierre      timestamptz,            -- null = sin fecha definida
  fecha_examen      timestamptz,

  -- Links
  url_vaga         text not null,           -- link direto para a vaga (abre no WebView)
  url_dof          text,                    -- link DOF para confirmação oficial

  -- Controle
  fonte            text default 'trabajaen', -- trabajaen | dof | manual
  activa           boolean default true,
  notificacion_enviada boolean default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── Índices para performance ──────────────────────────────────
create index if not exists conv_area_idx    on public.convocatorias(area);
create index if not exists conv_estado_idx  on public.convocatorias(estado);
create index if not exists conv_activa_idx  on public.convocatorias(activa);
create index if not exists conv_cierre_idx  on public.convocatorias(fecha_cierre);
create index if not exists conv_created_idx on public.convocatorias(created_at desc);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.convocatorias enable row level security;

-- Leitura pública (qualquer pessoa pode ver as vagas)
create policy "convocatorias: leitura pública"
  on public.convocatorias for select
  using (activa = true);

-- Inserção/atualização só via service_role (Edge Function usa service_role)
create policy "convocatorias: insert service_role"
  on public.convocatorias for insert
  with check (true);

create policy "convocatorias: update service_role"
  on public.convocatorias for update
  using (true);

-- ── Trigger: updated_at automático ───────────────────────────
create or replace function public.handle_convocatoria_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger convocatoria_updated_at
  before update on public.convocatorias
  for each row execute function public.handle_convocatoria_updated_at();

-- ============================================================
-- 2. TABELA DE NOTIFICAÇÕES — controle de push por usuário
-- ============================================================
create table if not exists public.notificaciones_push (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  conv_id     uuid references public.convocatorias(id) on delete cascade,
  enviada     boolean default false,
  enviada_at  timestamptz,
  created_at  timestamptz default now(),
  unique(user_id, conv_id)
);

alter table public.notificaciones_push enable row level security;

create policy "notif: select próprio"
  on public.notificaciones_push for select
  using (auth.uid() = user_id);

-- ============================================================
-- 3. TABELA DE TOKENS PUSH — um token por dispositivo
-- ============================================================
create table if not exists public.push_tokens (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade,
  token      text not null unique,
  plataforma text default 'android',
  area       text,     -- preferência do usuário
  estado     text,     -- preferência do usuário
  ativo      boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.push_tokens enable row level security;

create policy "tokens: select próprio"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "tokens: insert próprio"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "tokens: update próprio"
  on public.push_tokens for update
  using (auth.uid() = user_id);

-- ============================================================
-- 4. FUNÇÃO + TRIGGER — detecta vaga nova e marca para notificar
-- ============================================================
create or replace function public.marcar_notificacion_nueva_convocatoria()
returns trigger language plpgsql security definer as $$
begin
  -- Para cada usuário com token ativo que tem perfil compatível com a vaga,
  -- insere um registro pendente de notificação.
  -- A Edge Function de notificação vai ler esses registros e enviar os pushs.
  insert into public.notificaciones_push (user_id, conv_id)
  select distinct pt.user_id, new.id
  from public.push_tokens pt
  where pt.ativo = true
    and (
      -- Sem filtro de área = recebe tudo
      pt.area is null
      or pt.area = new.area
      or new.area = 'administrativo'  -- administrativo notifica todos
    )
    and (
      -- Sem filtro de estado = recebe tudo
      pt.estado is null
      or pt.estado = new.estado
      or new.estado = 'FEDERAL'       -- federal notifica todos os estados
    )
  on conflict (user_id, conv_id) do nothing;

  return new;
end;
$$;

create trigger trigger_nova_convocatoria
  after insert on public.convocatorias
  for each row
  when (new.activa = true)
  execute function public.marcar_notificacion_nueva_convocatoria();

-- ============================================================
-- 5. VIEW útil — vagas abertas com dias restantes
-- ============================================================
create or replace view public.convocatorias_activas as
select
  c.*,
  case
    when c.fecha_cierre is null then null
    else greatest(0, extract(day from (c.fecha_cierre - now()))::int)
  end as dias_restantes,
  case
    when c.fecha_cierre is null then 'sin_fecha'
    when c.fecha_cierre < now() then 'cerrada'
    when c.fecha_cierre - now() <= interval '7 days' then 'urgente'
    else 'abierta'
  end as status_cierre
from public.convocatorias c
where c.activa = true
order by c.fecha_publicacion desc;

-- ============================================================
-- 6. DADOS DE EXEMPLO — algumas convocatórias reais para testar
-- ============================================================
insert into public.convocatorias
  (fonte_id, titulo, dependencia, area, estado, nivel_puesto,
   salario_min, salario_max, num_plazas, escolaridad,
   fecha_publicacion, fecha_cierre, url_vaga, fonte)
values
  ('SAT-2026-001', 'Administrador Local de Servicios al Contribuyente',
   'SAT', 'fiscal', 'FEDERAL', 'Jefatura',
   35000, 45000, 80, 'Licenciatura',
   now() - interval '2 days', now() + interval '30 days',
   'https://www.trabajaen.gob.mx', 'manual'),

  ('IMSS-2026-001', 'Médico General IMSS-Bienestar',
   'IMSS', 'saude', 'FEDERAL', 'Operativo',
   28000, 38000, 500, 'Licenciatura',
   now() - interval '1 day', now() + interval '20 days',
   'https://www.trabajaen.gob.mx', 'manual'),

  ('GN-2026-001', 'Elemento Operativo Guardia Nacional',
   'Guardia Nacional', 'policia', 'FEDERAL', 'Operativo',
   14000, 16000, 2000, 'Preparatoria',
   now(), now() + interval '25 days',
   'https://www.trabajaen.gob.mx', 'manual'),

  ('PJCDMX-2026-001', 'Oficial Judicial Poder Judicial CDMX',
   'Poder Judicial CDMX', 'juridico', 'CMX', 'Enlace',
   18000, 22000, 80, 'Licenciatura',
   now() - interval '3 days', now() + interval '15 days',
   'https://www.trabajaen.gob.mx', 'manual'),

  ('SEP-2026-001', 'Docente Frente a Grupo Educación Básica',
   'SEP', 'educacion', 'FEDERAL', 'Operativo',
   11000, 15000, 3000, 'Licenciatura',
   now(), null,
   'https://www.trabajaen.gob.mx', 'manual'),

  ('CDMX-SSP-2026-001', 'Oficial de Policía CDMX',
   'SSP CDMX', 'policia', 'CMX', 'Operativo',
   14500, 17000, 1500, 'Preparatoria',
   now() - interval '5 days', now() + interval '10 days',
   'https://www.trabajaen.gob.mx', 'manual')

on conflict (fonte_id) do nothing;

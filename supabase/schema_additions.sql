-- ============================================================
--  PlazaYa — Tabelas adicionais para funcionalidades ConcursosBrasil
--  Cole no SQL Editor do Supabase e execute
-- ============================================================

-- ── 1. Tabela de configuração do app (version check) ─────────────
create table if not exists public.config (
  id           text primary key default 'app',
  versao_minima text not null default '1.0.0',
  forcar       boolean default false,
  mensagem     text default 'Hay una nueva versión disponible. Actualiza para seguir usando la app.',
  updated_at   timestamptz default now()
);

-- Seed da config
insert into public.config (id, versao_minima, forcar, mensagem)
values ('app', '1.0.0', false, 'Hay una nueva versión disponible con mejoras importantes.')
on conflict (id) do nothing;

-- ── 2. Tabela de perfis (Auth) ────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nome          text,
  email         text,
  area          text,
  estado        text,
  escolaridade  text,
  salario_min   numeric,
  salario_max   numeric,
  preparacao    text,
  onboarding_ok boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- RLS para profiles
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ── 3. Tabela de sessões de estudo ────────────────────────────────
create table if not exists public.sessoes_estudo (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  area          text,
  tema          text,
  tipo          text default 'tema',  -- tema | simulado
  acertos       int not null default 0,
  total         int not null default 0,
  pontuacao     int default 0,        -- percentual 0-100
  tempo_total_seg int,
  created_at    timestamptz default now()
);

create index if not exists sessoes_user_idx on public.sessoes_estudo(user_id);
create index if not exists sessoes_created_idx on public.sessoes_estudo(created_at desc);

-- RLS para sessoes_estudo
alter table public.sessoes_estudo enable row level security;

create policy "Users can read own sessions"
  on public.sessoes_estudo for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessoes_estudo for insert
  with check (auth.uid() = user_id);

-- ── 4. Tabela de questões para quiz de estudo ─────────────────────
create table if not exists public.questoes (
  id              uuid primary key default gen_random_uuid(),
  enunciado       text not null,
  opcao_a         text not null,
  opcao_b         text not null,
  opcao_c         text,
  opcao_d         text,
  resposta_correta text not null,  -- 'a', 'b', 'c', 'd'
  explicacao      text,
  area            text,            -- policia, juridico, saude, fiscal, ti, administrativo, educacion
  tema            text,            -- subtema dentro da area
  dificuldade     text default 'medio',  -- facil, medio, dificil
  fonte           text,            -- ex: 'SPC 2024', 'Ley IMSS Art.5'
  ativa           boolean default true,
  created_at      timestamptz default now()
);

create index if not exists questoes_area_idx on public.questoes(area);
create index if not exists questoes_tema_idx on public.questoes(tema);
create index if not exists questoes_ativa_idx on public.questoes(ativa);

-- RLS: todos podem ler questões
alter table public.questoes enable row level security;

create policy "Anyone can read active questions"
  on public.questoes for select
  using (ativa = true);

-- ── 5. Tabela de usuarios (device tracking, sem auth) ─────────────
create table if not exists public.usuarios (
  device_id           text primary key,
  push_token          text,
  estado              text,
  areas               text[],
  salario_min         numeric,
  escolaridade        text,
  onboarding_completo boolean default false,
  versao_app          text,
  ultimo_acesso       timestamptz default now(),
  created_at          timestamptz default now()
);

-- ── 6. Seed de questões para México ───────────────────────────────
-- Questões sobre SPC, SAT, IMSS, Ley de Amparo, Guardia Nacional, USICAMM, Constitución

insert into public.questoes (enunciado, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta, explicacao, area, tema, dificuldade) values

-- SPC
('¿Cuál es el objetivo principal del Servicio Profesional de Carrera (SPC) en México?',
 'Crear empleos temporales', 'Garantizar la igualdad de oportunidades en el acceso a la función pública', 'Regular los salarios del sector privado', 'Administrar pensiones de jubilación',
 'b', 'El SPC busca garantizar la igualdad de oportunidades en el ingreso, desarrollo y permanencia en la Administración Pública Federal.', 'administrativo', 'SPC', 'facil'),

('¿Qué ley regula el Servicio Profesional de Carrera en la Administración Pública Federal?',
 'Ley Federal del Trabajo', 'Ley del Servicio Profesional de Carrera', 'Ley General de Salud', 'Ley del ISSSTE',
 'b', 'La Ley del Servicio Profesional de Carrera en la Administración Pública Federal fue publicada el 10 de abril de 2003.', 'administrativo', 'SPC', 'facil'),

('¿Cuál de los siguientes NO es un subsistema del SPC?',
 'Ingreso', 'Desarrollo Profesional', 'Capacitación y Certificación', 'Jubilación anticipada',
 'd', 'Los 7 subsistemas del SPC son: Planeación, Ingreso, Desarrollo Profesional, Capacitación, Certificación, Evaluación del Desempeño y Separación.', 'administrativo', 'SPC', 'medio'),

-- SAT / Fiscal
('¿Cuál es el porcentaje general del IVA en México?',
 '10%', '16%', '15%', '21%',
 'b', 'La tasa general del Impuesto al Valor Agregado (IVA) en México es del 16%.', 'fiscal', 'SAT e IVA', 'facil'),

('¿Qué artículo de la Constitución Mexicana establece la obligación de contribuir al gasto público?',
 'Artículo 27', 'Artículo 31 fracción IV', 'Artículo 123', 'Artículo 3',
 'b', 'El Artículo 31, fracción IV de la Constitución establece la obligación de los mexicanos de contribuir al gasto público de manera proporcional y equitativa.', 'fiscal', 'Constitución', 'medio'),

('¿Cuál es el plazo para presentar la declaración anual de personas físicas ante el SAT?',
 'Enero', 'Febrero', 'Marzo', 'Abril',
 'd', 'Las personas físicas deben presentar su declaración anual durante todo el mes de abril del año siguiente al ejercicio fiscal.', 'fiscal', 'SAT e IVA', 'facil'),

-- IMSS
('¿Cuántas ramas de seguro contempla la Ley del Seguro Social?',
 '3', '5', '7', '4',
 'b', 'La LSS contempla 5 ramos: Enfermedades y Maternidad, Riesgos de Trabajo, Invalidez y Vida, Retiro/Cesantía/Vejez, y Guarderías y Prestaciones Sociales.', 'saude', 'IMSS', 'medio'),

('¿Cuál es el órgano máximo de gobierno del IMSS?',
 'La Dirección General', 'La Asamblea General', 'El Consejo Técnico', 'La Secretaría de Salud',
 'b', 'La Asamblea General es la autoridad suprema del IMSS, integrada por representantes del gobierno, patrones y trabajadores.', 'saude', 'IMSS', 'medio'),

-- Guardia Nacional
('¿En qué año se creó la Guardia Nacional de México?',
 '2017', '2018', '2019', '2020',
 'c', 'La Guardia Nacional fue creada constitucionalmente en 2019 como institución de seguridad pública de carácter civil.', 'policia', 'Guardia Nacional', 'facil'),

('¿De cuál Secretaría depende la Guardia Nacional?',
 'Secretaría de Gobernación', 'Secretaría de la Defensa Nacional', 'Secretaría de Seguridad y Protección Ciudadana', 'Secretaría de Marina',
 'c', 'La Guardia Nacional está adscrita a la Secretaría de Seguridad y Protección Ciudadana (SSPC).', 'policia', 'Guardia Nacional', 'facil'),

-- Ley de Amparo
('¿Cuál es el objeto principal del juicio de amparo?',
 'Regular las elecciones', 'Proteger los derechos humanos y las garantías individuales', 'Administrar la hacienda pública', 'Regular las relaciones laborales',
 'b', 'El juicio de amparo protege a las personas frente a normas generales, actos u omisiones de autoridad que violen sus derechos humanos.', 'juridico', 'Ley de Amparo', 'facil'),

('¿Cuáles son las dos vías del juicio de amparo?',
 'Civil y penal', 'Directo e indirecto', 'Federal y estatal', 'Ordinario y extraordinario',
 'b', 'El amparo directo procede contra sentencias definitivas y el amparo indirecto contra actos de autoridad que no sean sentencias.', 'juridico', 'Ley de Amparo', 'medio'),

-- USICAMM / Educación
('¿Qué significa USICAMM?',
 'Unidad del Sistema para la Carrera de las Maestras y los Maestros', 'Universidad Superior de Ciencias Aplicadas de México', 'Unión Sindical de Instituciones de Capacitación', 'Unidad de Servicios de Capacitación Municipal',
 'a', 'La USICAMM es la unidad encargada de regular los procesos de admisión, promoción y reconocimiento del personal educativo.', 'educacion', 'USICAMM', 'facil'),

('¿Qué ley regula el sistema de carrera de los maestros en México?',
 'Ley General del Trabajo', 'Ley General del Sistema para la Carrera de las Maestras y los Maestros', 'Ley Federal de Educación', 'Ley del ISSSTE',
 'b', 'La Ley General del Sistema para la Carrera de las Maestras y los Maestros fue publicada el 30 de septiembre de 2019.', 'educacion', 'USICAMM', 'medio'),

-- Constitución
('¿Cuántos artículos tiene la Constitución Política de los Estados Unidos Mexicanos?',
 '120', '136', '150', '200',
 'b', 'La Constitución de 1917 tiene 136 artículos, más artículos transitorios.', 'juridico', 'Constitución', 'facil'),

('¿Qué artículo constitucional consagra el derecho a la educación?',
 'Artículo 1', 'Artículo 3', 'Artículo 27', 'Artículo 123',
 'b', 'El Artículo 3° establece que toda persona tiene derecho a la educación.', 'educacion', 'Constitución', 'facil'),

('¿Qué artículo constitucional regula las relaciones laborales?',
 'Artículo 3', 'Artículo 27', 'Artículo 115', 'Artículo 123',
 'd', 'El Artículo 123 es la base del derecho laboral mexicano, dividido en Apartado A (trabajadores en general) y Apartado B (trabajadores del Estado).', 'juridico', 'Constitución', 'medio'),

-- TI
('¿Qué institución mexicana se encarga de la estrategia digital nacional?',
 'INEGI', 'Coordinación de Estrategia Digital Nacional', 'CONACYT', 'SCT',
 'b', 'La Coordinación de Estrategia Digital Nacional, dependiente de la Presidencia, coordina la política de gobierno digital.', 'ti', 'Gobierno Digital', 'medio'),

('¿Qué ley regula la protección de datos personales en posesión de particulares?',
 'Ley Federal del Trabajo', 'Ley Federal de Protección de Datos Personales', 'Ley de Transparencia', 'Ley General de Salud',
 'b', 'La LFPDPPP regula el tratamiento legítimo de datos personales por parte de particulares.', 'ti', 'Protección de Datos', 'facil')

on conflict do nothing;

-- ── 7. View de convocatorias ativas (se não existe já) ────────────
create or replace view public.convocatorias_activas as
select
  c.*,
  case
    when c.fecha_cierre is not null
    then greatest(0, extract(day from c.fecha_cierre - now())::int)
    else null
  end as dias_restantes
from public.convocatorias c
where c.activa = true
order by c.created_at desc;

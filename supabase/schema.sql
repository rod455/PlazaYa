-- ============================================================
--  Concursos México — Supabase Schema
--  Execute no SQL Editor do Supabase (supabase.com)
-- ============================================================

-- ── Extensões ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES — dados do usuário (complementa auth.users)
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  nome          text,
  area          text,          -- área de interesse (policia, saude, juridico...)
  estado        text,          -- estado/UF selecionado
  escolaridade  text,
  salario_min   int,
  salario_max   int,
  preparacao    text,          -- imediato | breve | pesquisando
  onboarding_ok boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- RLS: cada usuário vê apenas seus próprios dados
alter table public.profiles enable row level security;

create policy "profiles: select próprio"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert próprio"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update próprio"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: atualiza updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Trigger: cria profile automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. QUESTIONS — banco de questões (híbrido banco + IA)
-- ============================================================
create table if not exists public.questions (
  id              uuid primary key default uuid_generate_v4(),
  area            text not null,       -- policia | saude | juridico | fiscal | ti | administrativo
  tema            text,                -- subtema (ex: "Direito Penal", "Matemática Financeira")
  dificuldade     text not null check (dificuldade in ('facil','medio','dificil')),
  enunciado       text not null,
  opcao_a         text not null,
  opcao_b         text not null,
  opcao_c         text not null,
  opcao_d         text not null,
  resposta_correta text not null check (resposta_correta in ('a','b','c','d')),
  explicacao      text,                -- explicação da resposta correta
  fonte           text default 'banco', -- 'banco' | 'ia'
  ativo           boolean default true,
  created_at      timestamptz default now()
);

-- Leitura pública (questões não têm dados sensíveis)
alter table public.questions enable row level security;

create policy "questions: leitura pública"
  on public.questions for select
  using (ativo = true);

-- Índices para performance
create index if not exists questions_area_idx        on public.questions(area);
create index if not exists questions_dificuldade_idx on public.questions(dificuldade);
create index if not exists questions_tema_idx        on public.questions(tema);

-- ============================================================
-- 3. STUDY_SESSIONS — sessões de estudo do usuário
-- ============================================================
create table if not exists public.study_sessions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  tipo         text not null check (tipo in ('quiz_tema','simulado')),
  area         text,
  tema         text,
  total        int  default 0,
  acertos      int  default 0,
  tempo_seg    int  default 0,       -- duração total em segundos
  concluida    boolean default false,
  created_at   timestamptz default now()
);

alter table public.study_sessions enable row level security;

create policy "sessions: select próprio"
  on public.study_sessions for select
  using (auth.uid() = user_id);

create policy "sessions: insert próprio"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

create policy "sessions: update próprio"
  on public.study_sessions for update
  using (auth.uid() = user_id);

-- ============================================================
-- 4. USER_ANSWERS — histórico de respostas por questão
-- ============================================================
create table if not exists public.user_answers (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  session_id  uuid references public.study_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  resposta    text check (resposta in ('a','b','c','d')),  -- null = tempo esgotado
  correta     boolean not null,
  tempo_seg   int,          -- tempo gasto nesta questão
  created_at  timestamptz default now()
);

alter table public.user_answers enable row level security;

create policy "answers: select próprio"
  on public.user_answers for select
  using (auth.uid() = user_id);

create policy "answers: insert próprio"
  on public.user_answers for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 5. APP_CONFIG — configurações remotas (versão, flags, etc.)
-- ============================================================
create table if not exists public.app_config (
  chave   text primary key,
  valor   text not null,
  updated_at timestamptz default now()
);

alter table public.app_config enable row level security;

create policy "app_config: leitura pública"
  on public.app_config for select
  using (true);

-- Dados iniciais
insert into public.app_config (chave, valor) values
  ('versao_minima',  '1.0.0'),
  ('versao_atual',   '1.0.0'),
  ('forcar_update',  'false'),
  ('msg_update',     'Nova versão disponível com melhorias!'),
  ('maintenance',    'false')
on conflict (chave) do nothing;

-- ============================================================
-- 6. QUESTÕES SEED — exemplos para México (ajuste conforme necessidade)
-- ============================================================
insert into public.questions
  (area, tema, dificuldade, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta, explicacao)
values
  -- POLICIA / SEGURANÇA
  ('policia','Derecho Penal','facil',
   'Según el Código Penal Federal de México, ¿cuál es la edad mínima para ser imputable penalmente?',
   '12 años','14 años','16 años','18 años',
   'd','En México, la imputabilidad penal plena comienza a los 18 años.'),

  ('policia','Derecho Constitucional','medio',
   '¿Qué artículo de la Constitución Política de México establece los derechos del detenido?',
   'Artículo 14','Artículo 16','Artículo 20','Artículo 22',
   'c','El artículo 20 establece los derechos de la víctima y del imputado en el proceso penal.'),

  ('policia','Seguridad Pública','dificil',
   '¿Cuál es la institución que coordina el Sistema Nacional de Seguridad Pública en México?',
   'CNDH','Secretaría de Gobernación','SESNSP','Guardia Nacional',
   'c','El SESNSP (Secretariado Ejecutivo del Sistema Nacional de Seguridad Pública) es el organismo coordinador.'),

  -- JURIDICO
  ('juridico','Derecho Civil','facil',
   '¿Cuál es el plazo general de prescripción de acciones personales en el Código Civil Federal de México?',
   '5 años','10 años','15 años','20 años',
   'b','El artículo 1159 del Código Civil Federal establece 10 años como plazo general.'),

  ('juridico','Amparo','medio',
   '¿Ante quién se interpone el amparo indirecto en México?',
   'Suprema Corte de Justicia','Tribunal Colegiado de Circuito','Juzgado de Distrito','Tribunal Unitario de Circuito',
   'c','El amparo indirecto se promueve ante el Juzgado de Distrito competente.'),

  ('juridico','Derecho Laboral','dificil',
   'Según la Ley Federal del Trabajo, ¿cuántos días de aguinaldo corresponden mínimo a un trabajador con 1 año de antigüedad?',
   '10 días','15 días','20 días','30 días',
   'b','El artículo 87 de la LFT establece mínimo 15 días de salario como aguinaldo.'),

  -- SAUDE
  ('saude','Salud Pública','facil',
   '¿Cuál es la institución que regula los medicamentos en México?',
   'IMSS','COFEPRIS','SSA','ISSSTE',
   'b','COFEPRIS (Comisión Federal para la Protección contra Riesgos Sanitarios) regula los medicamentos.'),

  ('saude','Epidemiología','medio',
   '¿Qué significa el término "tasa de incidencia" en epidemiología?',
   'Número total de casos existentes','Número de casos nuevos en un período','Proporción de fallecidos','Prevalencia acumulada',
   'b','La tasa de incidencia mide los casos NUEVOS de una enfermedad en un período y población definidos.'),

  -- TI
  ('ti','Redes','facil',
   '¿Cuál es el protocolo usado para asignar direcciones IP automáticamente?',
   'FTP','HTTP','DHCP','DNS',
   'c','DHCP (Dynamic Host Configuration Protocol) asigna IPs automáticamente a los dispositivos de la red.'),

  ('ti','Seguridad','dificil',
   '¿Qué tipo de ataque consiste en interceptar la comunicación entre dos partes sin que lo sepan?',
   'DDoS','Man-in-the-Middle','Phishing','Ransomware',
   'b','Man-in-the-Middle (MitM) es un ataque donde el atacante intercepta la comunicación sin que las partes lo noten.'),

  -- ADMINISTRATIVO / GERAL
  ('administrativo','Administración Pública','facil',
   '¿Cuál es el documento que regula la estructura y funcionamiento de la Administración Pública Federal en México?',
   'Ley Orgánica de la Administración Pública Federal','Constitución Política','Plan Nacional de Desarrollo','Ley Federal del Trabajo',
   'a','La Ley Orgánica de la Administración Pública Federal establece la estructura del Ejecutivo Federal.'),

  ('administrativo','Ética Pública','medio',
   'Según la Ley General de Responsabilidades Administrativas, ¿cuál NO es una falta administrativa grave?',
   'Cohecho','Peculado','Llegar tarde al trabajo','Tráfico de influencias',
   'c','Llegar tarde es una falta no grave. Cohecho, peculado y tráfico de influencias son faltas graves.'),

  -- FISCAL
  ('fiscal','Derecho Tributario','facil',
   '¿Cuál es la tasa general del IVA en México?',
   '10%','12%','15%','16%',
   'd','La tasa general del Impuesto al Valor Agregado (IVA) en México es del 16%.'),

  ('fiscal','SAT','dificil',
   '¿Cuál es el plazo para presentar la declaración anual de personas físicas con actividad empresarial en México?',
   'Enero','Febrero','Marzo','Abril',
   'd','Las personas físicas con actividades empresariales tienen hasta el 30 de abril para presentar su declaración anual.')
;

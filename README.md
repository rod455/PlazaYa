# Concursos México — App React Native

## Estrutura do repositório

```
concursos-mexico/
├── app/                  ← React Native (Expo)
├── web/                  ← Site estático → hospedado no Vercel
└── supabase/             ← Schema SQL do banco de dados
```

## Fluxo de telas

```
Splash
  → Quiz de Perfil (7 telas — área, estado, salário...)
  → Quiz de Conhecimentos (5 questões — híbrido banco + IA)
  → Resultado + CTA "Crie sua conta para estudar"
  → Auth (Cadastro / Login — Supabase Auth)
  → MainApp
       ├── Home      (concursos filtrados)
       ├── Estudar   (questões por tema + simulados)
       ├── Novidades
       └── Perfil
```

## Stack

| Camada       | Tecnologia                   |
|--------------|------------------------------|
| App mobile   | React Native + Expo          |
| Banco        | Supabase (Postgres + Auth)   |
| Site / web   | HTML estático → Vercel       |
| IA questões  | Claude API (Anthropic)       |
| Ads          | Google AdMob                 |

## Setup inicial

```bash
# 1. Entrar na pasta do app
cd app

# 2. Instalar dependências
npm install

# 3. Copiar variáveis de ambiente
cp .env.example .env
# Preencher SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY

# 4. Rodar
npx expo start --android
```

## Deploy web (Vercel)

```bash
cd web
# Conectar repositório no vercel.com → importar pasta /web
# Vercel detecta automaticamente HTML estático
```

## Banco de dados (Supabase)

```bash
# Rodar o schema no SQL Editor do Supabase
# Arquivo: supabase/schema.sql
```

## Build Play Store

```bash
cd app
npx eas build --platform android --profile production
```

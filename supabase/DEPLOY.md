# Deploy da Edge Function — PlazaYa Scraper

## 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

## 2. Login e link com seu projeto

```bash
supabase login
supabase link --project-ref urbvlzfafpdxwlvzexww
```

## 3. Configurar os secrets da Edge Function

No painel do Supabase:
Settings → Edge Functions → Secrets → Add secret

Adicione estes 2 secrets:
- SUPABASE_URL = https://urbvlzfafpdxwlvzexww.supabase.co
- SUPABASE_SERVICE_ROLE_KEY = (copiar de Settings > API > service_role key)

## 4. Deploy da função

```bash
supabase functions deploy scraper --project-ref urbvlzfafpdxwlvzexww
```

## 5. Agendar execução diária (cron)

No painel do Supabase:
Database → Extensions → habilitar "pg_cron"

Depois no SQL Editor:

```sql
select cron.schedule(
  'scraper-diario',
  '0 6 * * *',  -- todo dia às 06:00 UTC (00:00 CDMX)
  $$
  select net.http_post(
    url := 'https://urbvlzfafpdxwlvzexww.supabase.co/functions/v1/scraper',
    headers := '{"Authorization": "Bearer SEU_ANON_KEY"}'::jsonb
  )
  $$
);
```

## 6. Testar manualmente

```bash
supabase functions serve scraper --env-file .env.local
```

Ou via curl:
```bash
curl -X POST https://urbvlzfafpdxwlvzexww.supabase.co/functions/v1/scraper \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

## Estrutura dos arquivos

```
supabase/
├── schema_convocatorias.sql   ← rodar no SQL Editor primeiro
└── functions/
    └── scraper/
        └── index.ts           ← Edge Function de scraping
```

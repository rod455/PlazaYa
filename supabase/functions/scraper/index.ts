// supabase/functions/scraper/index.ts
// Edge Function — roda todo dia às 06:00 (configure no Dashboard do Supabase)
// Faz scraping do DOF vacantes, salva novas vagas e envia push notifications

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Credenciais (configuradas em Supabase > Settings > Edge Functions > Secrets)
const SUPABASE_URL        = Deno.env.get('DB_URL') ?? Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('DB_SERVICE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SCRAPER_API_KEY     = Deno.env.get('SCRAPER_API_KEY') ?? '10d2146c64b2996ee444f34212c7f05b'
const EXPO_PUSH_URL       = 'https://exp.host/--/api/v2/push/send'

// Monta URL do ScraperAPI — bypassa bloqueios do DOF e TrabajaEn
function scraperUrl(targetUrl: string): string {
  return `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=false`
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── Mapeamento de palavras-chave → área do app ────────────────────────────────
const AREA_KEYWORDS: Record<string, string[]> = {
  policia:       ['policía', 'policia', 'seguridad pública', 'guardia nacional', 'penitenciario', 'custodia'],
  juridico:      ['judicial', 'jurídico', 'juridico', 'magistrado', 'juez', 'actuario', 'notario', 'defensor'],
  saude:         ['médico', 'medico', 'enfermero', 'salud', 'imss', 'issste', 'hospital', 'clínica', 'farmacéutico'],
  fiscal:        ['sat', 'fiscal', 'tributario', 'auditor', 'hacienda', 'finanzas', 'contribuyente', 'recaudador'],
  ti:            ['tecnología', 'tecnologia', 'sistemas', 'informática', 'informatica', 'programador', 'desarrollador', 'redes', 'ciberseguridad'],
  educacion:     ['docente', 'profesor', 'maestro', 'sep', 'educación', 'educacion', 'enseñanza'],
  administrativo:['administrativo', 'administración', 'administracion', 'gestión', 'gestion', 'secretaria', 'archivo'],
}

function detectarArea(texto: string): string {
  const t = texto.toLowerCase()
  for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
    if (keywords.some(kw => t.includes(kw))) return area
  }
  return 'administrativo'
}

// ── Mapeamento de estados ─────────────────────────────────────────────────────
const ESTADO_KEYWORDS: Record<string, string[]> = {
  CMX:  ['ciudad de méxico', 'cdmx', 'distrito federal', 'd.f.'],
  JAL:  ['jalisco', 'guadalajara'],
  NLE:  ['nuevo león', 'nuevo leon', 'monterrey'],
  MEX:  ['estado de méxico', 'estado de mexico', 'edomex', 'toluca'],
  PUE:  ['puebla'],
  GTO:  ['guanajuato', 'león', 'leon'],
  VER:  ['veracruz'],
  COA:  ['coahuila'],
  CHH:  ['chihuahua'],
  SON:  ['sonora', 'hermosillo'],
  TAM:  ['tamaulipas'],
  SIN:  ['sinaloa', 'culiacán'],
  OAX:  ['oaxaca'],
  CHP:  ['chiapas'],
  YUC:  ['yucatán', 'yucatan', 'mérida', 'merida'],
}

function detectarEstado(texto: string): string {
  const t = texto.toLowerCase()
  for (const [estado, keywords] of Object.entries(ESTADO_KEYWORDS)) {
    if (keywords.some(kw => t.includes(kw))) return estado
  }
  return 'FEDERAL'
}

// ── Parsear salário ───────────────────────────────────────────────────────────
function parseSalario(texto: string): { min: number | null; max: number | null } {
  // Padrão: $12,345.67 ou 12345 ou $12,000 - $15,000
  const nums = texto.match(/[\d,]+(?:\.\d{2})?/g)
  if (!nums) return { min: null, max: null }
  const valores = nums.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => n > 1000)
  if (valores.length === 0) return { min: null, max: null }
  if (valores.length === 1) return { min: valores[0], max: null }
  return { min: Math.min(...valores), max: Math.max(...valores) }
}

// ── Parsear data no formato dd/mm/yyyy ou yyyy-mm-dd ─────────────────────────
function parseData(str: string | null): string | null {
  if (!str) return null
  // dd/mm/yyyy
  const m1 = str.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`
  // yyyy-mm-dd
  const m2 = str.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m2) return str
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRAPER 1 — DOF Vacantes (página HTML com lista de vagas)
// URL: https://www.dof.gob.mx/vacantes.php
// ─────────────────────────────────────────────────────────────────────────────
async function scrapeDOF(): Promise<any[]> {
  console.log('🔍 Iniciando scraping DOF...')
  const vagas: any[] = []

  try {
    const res = await fetch(scraperUrl('https://www.dof.gob.mx/vacantes.php'), {
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      console.warn(`DOF retornou status ${res.status}`)
      return []
    }

    const html = await res.text()

    // O DOF lista vagas em tabela — extraímos links de convocatórias
    // Padrão: href="/vacantes/NNNNN/NNNNNN.htm"
    const linkRegex = /href="(\/vacantes\/[\d]+\/[\d]+\.htm)"/g
    const linksEncontrados = new Set<string>()
    let match

    while ((match = linkRegex.exec(html)) !== null) {
      linksEncontrados.add(`https://www.dof.gob.mx${match[1]}`)
    }

    console.log(`📋 DOF: ${linksEncontrados.size} links encontrados`)

    // Processa até 30 vagas por execução (evita timeout da Edge Function)
    const links = [...linksEncontrados].slice(0, 30)

    for (const url of links) {
      try {
        const vaga = await scrapeVagaDOF(url)
        if (vaga) vagas.push(vaga)
        // Pausa entre requests para não sobrecarregar o servidor
        await new Promise(r => setTimeout(r, 800))
      } catch (e) {
        console.warn(`Erro ao processar ${url}:`, e)
      }
    }
  } catch (e) {
    console.error('Erro no scraping DOF:', e)
  }

  console.log(`✅ DOF: ${vagas.length} vagas extraídas`)
  return vagas
}

// Extrai dados de uma página individual de vaga do DOF
async function scrapeVagaDOF(url: string): Promise<any | null> {
  const res = await fetch(scraperUrl(url), {
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) return null

  const html = await res.text()

  // Remove tags HTML
  const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

  // Extrai título — geralmente entre "Puesto:" e "Dependencia:"
  const tituloMatch = texto.match(/(?:Puesto|Plaza|Cargo)[:\s]+([^\.]{10,100})/i)
  if (!tituloMatch) return null
  const titulo = tituloMatch[1].trim()

  // Extrai dependência
  const depMatch = texto.match(/(?:Dependencia|Institución|Adscripción)[:\s]+([^\.]{5,80})/i)
  const dependencia = depMatch ? depMatch[1].trim() : null

  // Extrai salário
  const salMatch = texto.match(/(?:Sueldo|Salario|Remuneración)[:\s]+([^\n\.]{5,50})/i)
  const { min: salarioMin, max: salarioMax } = salMatch
    ? parseSalario(salMatch[1])
    : { min: null, max: null }

  // Extrai data de cierre
  const cierreMatch = texto.match(/(?:Cierre|Vencimiento|Vigencia|Plazo)[:\s]+([\d\/\-]+)/i)
  const fechaCierre = cierreMatch ? parseData(cierreMatch[1]) : null

  // Extrai sede/estado
  const sedeMatch = texto.match(/(?:Sede|Ubicación|Estado)[:\s]+([^\.]{3,60})/i)
  const sedeTexto = sedeMatch ? sedeMatch[1] : texto.substring(0, 200)

  // Extrai escolaridade
  const escolaMatch = texto.match(/(?:Escolaridad|Educación)[:\s]+([^\.]{5,60})/i)
  const escolaridad = escolaMatch ? escolaMatch[1].trim() : null

  // Extrai número de plazas
  const plazasMatch = texto.match(/(?:Plazas?|Vacantes?)[:\s]+(\d+)/i)
  const numPlazas = plazasMatch ? parseInt(plazasMatch[1]) : null

  // ID único baseado na URL
  const fonteId = `dof-${url.split('/').slice(-2).join('-').replace('.htm', '')}`

  return {
    fonte_id:          fonteId,
    titulo,
    dependencia,
    area:              detectarArea(`${titulo} ${dependencia ?? ''}`),
    estado:            detectarEstado(sedeTexto),
    nivel_puesto:      null,
    salario_min:       salarioMin,
    salario_max:       salarioMax,
    num_plazas:        numPlazas,
    escolaridad,
    fecha_publicacion: new Date().toISOString(),
    fecha_cierre:      fechaCierre ? `${fechaCierre}T23:59:00Z` : null,
    url_vaga:          url,
    url_dof:           url,
    fonte:             'dof',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRAPER 2 — TrabajaEn (portal federal de vagas SPC)
// ─────────────────────────────────────────────────────────────────────────────
async function scrapeTrabajaEn(): Promise<any[]> {
  console.log('🔍 Iniciando scraping TrabajaEn...')
  const vagas: any[] = []

  try {
    // TrabajaEn tem uma página de busca pública de concursos
    const url = 'https://www.trabajaen.gob.mx/menuini/js_paginad.jsp'
    const res = await fetch(scraperUrl(url), {
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      console.warn(`TrabajaEn retornou status ${res.status}`)
      return []
    }

    const html = await res.text()

    // Extrai links de vagas individuais
    // Padrão: href="js_detalle.jsp?referencia=XXXX"
    const linkRegex = /href="(js_detalle\.jsp\?referencia=[\w\d]+)"/g
    let match
    const links: string[] = []

    while ((match = linkRegex.exec(html)) !== null) {
      links.push(`https://www.trabajaen.gob.mx/menuini/${match[1]}`)
    }

    // Também tenta extrair dados direto da listagem
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    while ((match = rowRegex.exec(html)) !== null) {
      const row = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (row.length < 20) continue

      // Tenta extrair título e dependência de cada linha da tabela
      const partes = row.split(/\s{2,}/).filter(p => p.length > 3)
      if (partes.length >= 2) {
        const titulo = partes[0]
        const dependencia = partes[1]

        // Filtra linhas que parecem ser cabeçalhos
        if (['puesto', 'institución', 'sede', 'sueldo'].some(h => titulo.toLowerCase().includes(h))) continue

        const fonteId = `trabajaen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        vagas.push({
          fonte_id:          fonteId,
          titulo,
          dependencia,
          area:              detectarArea(`${titulo} ${dependencia}`),
          estado:            detectarEstado(row),
          nivel_puesto:      null,
          salario_min:       null,
          salario_max:       null,
          num_plazas:        null,
          escolaridad:       null,
          fecha_publicacion: new Date().toISOString(),
          fecha_cierre:      null,
          url_vaga:          'https://www.trabajaen.gob.mx',
          url_dof:           null,
          fonte:             'trabajaen',
        })
      }
    }

    console.log(`✅ TrabajaEn: ${vagas.length} vagas extraídas`)
  } catch (e) {
    console.error('Erro no scraping TrabajaEn:', e)
  }

  return vagas
}

// ─────────────────────────────────────────────────────────────────────────────
// SALVAR NO SUPABASE
// Usa upsert para evitar duplicatas (fonte_id e unique)
// Retorna apenas as vagas que sao NOVAS (inseridas agora)
// ─────────────────────────────────────────────────────────────────────────────
async function salvarVagas(vagas: any[]): Promise<any[]> {
  if (vagas.length === 0) return []

  console.log(`💾 Salvando ${vagas.length} vagas no Supabase...`)

  // Busca fonte_ids já existentes para saber quais são novas
  const fonteIds = vagas.map(v => v.fonte_id)
  const { data: existentes } = await supabase
    .from('convocatorias')
    .select('fonte_id')
    .in('fonte_id', fonteIds)

  const existentesSet = new Set((existentes ?? []).map((e: any) => e.fonte_id))
  const novas = vagas.filter(v => !existentesSet.has(v.fonte_id))

  if (novas.length === 0) {
    console.log('ℹ️  Nenhuma vaga nova encontrada')
    return []
  }

  console.log(`🆕 ${novas.length} vagas novas para inserir`)

  const { data, error } = await supabase
    .from('convocatorias')
    .upsert(novas, { onConflict: 'fonte_id', ignoreDuplicates: true })
    .select()

  if (error) {
    console.error('Erro ao salvar vagas:', error)
    return []
  }

  console.log(`✅ ${data?.length ?? 0} vagas salvas com sucesso`)
  return data ?? []
}

// ─────────────────────────────────────────────────────────────────────────────
// ENVIAR PUSH NOTIFICATIONS — via Expo Push API
// ─────────────────────────────────────────────────────────────────────────────
async function enviarNotificacoes(): Promise<void> {
  console.log('🔔 Verificando notificações pendentes...')

  // Busca notificações não enviadas
  const { data: pendentes } = await supabase
    .from('notificaciones_push')
    .select(`
      id,
      user_id,
      conv_id,
      convocatorias (titulo, dependencia, area, estado, salario_min),
      profiles:user_id (id)
    `)
    .eq('enviada', false)
    .limit(100)

  if (!pendentes || pendentes.length === 0) {
    console.log('ℹ️  Nenhuma notificação pendente')
    return
  }

  console.log(`📤 ${pendentes.length} notificações para enviar`)

  // Busca tokens dos usuários
  const userIds = [...new Set(pendentes.map((p: any) => p.user_id))]
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('user_id, token')
    .in('user_id', userIds)
    .eq('ativo', true)

  const tokenMap: Record<string, string[]> = {}
  for (const t of (tokens ?? [])) {
    if (!tokenMap[t.user_id]) tokenMap[t.user_id] = []
    tokenMap[t.user_id].push(t.token)
  }

  // Monta mensagens para a Expo Push API
  const mensagens: any[] = []
  const ids: string[] = []

  for (const notif of pendentes) {
    const conv = (notif as any).convocatorias
    const userTokens = tokenMap[notif.user_id] ?? []

    for (const token of userTokens) {
      if (!token.startsWith('ExponentPushToken[')) continue

      const salario = conv?.salario_min
        ? `💰 $${Number(conv.salario_min).toLocaleString('es-MX')} MXN`
        : '💰 Salario a convenir'

      mensagens.push({
        to:    token,
        title: `🏛️ Nueva plaza — ${conv?.dependencia ?? 'Gobierno'}`,
        body:  `${conv?.titulo ?? 'Nueva convocatoria'}\n${salario}`,
        data:  { conv_id: notif.conv_id, screen: 'Convocatoria' },
        sound: 'default',
        badge: 1,
        priority: 'high',
      })
    }

    ids.push(notif.id)
  }

  if (mensagens.length > 0) {
    // Envia em lotes de 100 (limite da Expo)
    for (let i = 0; i < mensagens.length; i += 100) {
      const lote = mensagens.slice(i, i + 100)
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(lote),
      })
      console.log(`📱 Lote ${Math.floor(i / 100) + 1}: ${lote.length} notificações enviadas`)
    }
  }

  // Marca como enviadas
  if (ids.length > 0) {
    await supabase
      .from('notificaciones_push')
      .update({ enviada: true, enviada_at: new Date().toISOString() })
      .in('id', ids)
  }

  console.log(`✅ ${ids.length} notificações marcadas como enviadas`)
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
serve(async (req) => {
  // Aceita chamada via cron (GET) ou manual (POST)
  const inicio = Date.now()
  console.log(`\n🚀 Scraper iniciado — ${new Date().toISOString()}`)

  try {
    // 1. Scraping das fontes
    const [vagasDOF, vagasTrabajaEn] = await Promise.allSettled([
      scrapeDOF(),
      scrapeTrabajaEn(),
    ])

    const todasVagas = [
      ...(vagasDOF.status === 'fulfilled' ? vagasDOF.value : []),
      ...(vagasTrabajaEn.status === 'fulfilled' ? vagasTrabajaEn.value : []),
    ]

    // 2. Salvar no Supabase (trigger detecta novas e cria notif pendentes)
    await salvarVagas(todasVagas)

    // 3. Enviar push notifications
    await enviarNotificacoes()

    const duracao = ((Date.now() - inicio) / 1000).toFixed(1)
    const resultado = {
      sucesso: true,
      vagas_processadas: todasVagas.length,
      duracao_seg: duracao,
      timestamp: new Date().toISOString(),
    }

    console.log(`\n✅ Scraper finalizado em ${duracao}s`)
    return new Response(JSON.stringify(resultado), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    console.error('Erro fatal no scraper:', e)
    return new Response(JSON.stringify({ sucesso: false, erro: String(e) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

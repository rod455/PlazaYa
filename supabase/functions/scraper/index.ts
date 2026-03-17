// supabase/functions/scraper/index.ts
// Scraper PlazaYa — usa ScraperAPI para bypassar bloqueios
// Fontes: DOF (vagas individuais via busca) + TrabajaEn

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL        = Deno.env.get('DB_URL') ?? Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('DB_SERVICE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SCRAPER_API_KEY     = Deno.env.get('SCRAPER_API_KEY') ?? '10d2146c64b2996ee444f34212c7f05b'
const EXPO_PUSH_URL       = 'https://exp.host/--/api/v2/push/send'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function scraperUrl(targetUrl: string): string {
  return `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=false`
}

// ── Detectar área ─────────────────────────────────────────────────────────────
const AREA_KEYWORDS: Record<string, string[]> = {
  policia:       ['policía', 'policia', 'seguridad', 'guardia nacional', 'penitenciario', 'custodia', 'gendarmería'],
  juridico:      ['judicial', 'jurídico', 'magistrado', 'juez', 'actuario', 'defensor', 'ministerio público'],
  saude:         ['médico', 'medico', 'enfermero', 'salud', 'imss', 'issste', 'hospital', 'clínica', 'farmacéutico', 'nutriólogo'],
  fiscal:        ['sat', 'fiscal', 'tributario', 'auditor', 'hacienda', 'finanzas', 'contribuyente', 'recaudador'],
  ti:            ['tecnología', 'sistemas', 'informática', 'programador', 'desarrollador', 'redes', 'ciberseguridad', 'software'],
  educacion:     ['docente', 'profesor', 'maestro', 'sep', 'educación', 'enseñanza', 'pedagogo'],
  administrativo:['administrativo', 'administración', 'gestión', 'secretaria', 'archivo', 'analista', 'coordinador'],
}

function detectarArea(texto: string): string {
  const t = texto.toLowerCase()
  for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
    if (keywords.some(kw => t.includes(kw))) return area
  }
  return 'administrativo'
}

// ── Detectar estado ───────────────────────────────────────────────────────────
const ESTADO_KEYWORDS: Record<string, string[]> = {
  CMX: ['ciudad de méxico', 'cdmx', 'distrito federal'],
  JAL: ['jalisco', 'guadalajara'],
  NLE: ['nuevo león', 'monterrey'],
  MEX: ['estado de méxico', 'edomex', 'toluca'],
  PUE: ['puebla'],
  GTO: ['guanajuato'],
  VER: ['veracruz'],
  COA: ['coahuila'],
  CHH: ['chihuahua'],
  SON: ['sonora', 'hermosillo'],
  TAM: ['tamaulipas'],
  SIN: ['sinaloa'],
  OAX: ['oaxaca'],
  CHP: ['chiapas'],
  YUC: ['yucatán', 'mérida'],
}

function detectarEstado(texto: string): string {
  const t = texto.toLowerCase()
  for (const [estado, keywords] of Object.entries(ESTADO_KEYWORDS)) {
    if (keywords.some(kw => t.includes(kw))) return estado
  }
  return 'FEDERAL'
}

function parseSalario(texto: string): { min: number | null; max: number | null } {
  const nums = texto.match(/[\d,]+(?:\.\d{2})?/g)
  if (!nums) return { min: null, max: null }
  const valores = nums.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => n > 1000 && n < 999999)
  if (valores.length === 0) return { min: null, max: null }
  if (valores.length === 1) return { min: valores[0], max: null }
  return { min: Math.min(...valores), max: Math.max(...valores) }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRAPER DOF — busca vagas via Google Search do DOF
// As vagas individuais são públicas em dof.gob.mx/vacantes/NNNNN/NNNNNN.html
// ─────────────────────────────────────────────────────────────────────────────
async function scrapeDOF(): Promise<any[]> {
  console.log('🔍 Iniciando scraping DOF vacantes.php...')
  const vagas: any[] = []

  try {
    const linksEncontrados = new Set<string>()

    // 1. Scraper direto da página de vacantes (funciona via ScraperAPI)
    try {
      const res = await fetch(scraperUrl('https://www.dof.gob.mx/vacantes.php'), {
        signal: AbortSignal.timeout(30000),
      })
      if (res.ok) {
        const html = await res.text()
        // Links relativos no formato: href="vacantes/21697/013989.html"
        const linkRelRegex = /href="(vacantes\/\d+\/\d+\.html?)"/g
        let match
        while ((match = linkRelRegex.exec(html)) !== null) {
          linksEncontrados.add(`https://www.dof.gob.mx/${match[1]}`)
        }
        console.log(`📋 DOF vacantes.php: ${linksEncontrados.size} links encontrados`)
      }
    } catch (e) {
      console.warn(`DOF direto falhou: ${e}`)
    }

    // 2. Fallback: Google Search se página direta não retornou links
    if (linksEncontrados.size === 0) {
      console.log('🔍 Tentando via Google Search...')
      const googleUrl = `https://www.google.com/search?q=site:dof.gob.mx/vacantes+convocatoria+2026&num=20`
      try {
        const res = await fetch(scraperUrl(googleUrl), { signal: AbortSignal.timeout(30000) })
        if (res.ok) {
          const html = await res.text()
          const linkRegex = /https?:\/\/www\.dof\.gob\.mx\/vacantes\/\d+\/\d+\.html?/g
          let match
          while ((match = linkRegex.exec(html)) !== null) {
            linksEncontrados.add(match[0])
          }
        }
      } catch (e) {
        console.warn(`Google fallback falhou: ${e}`)
      }
    }

    console.log(`📋 Total links DOF: ${linksEncontrados.size}`)

    // Processa até 30 vagas por execução
    const links = [...linksEncontrados].slice(0, 30)

    for (const url of links) {
      try {
        const vaga = await scrapeVagaDOF(url)
        if (vaga) vagas.push(vaga)
        await new Promise(r => setTimeout(r, 1500))
      } catch (e) {
        console.warn(`Erro ao processar ${url}: ${e}`)
      }
    }
  } catch (e) {
    console.error('Erro no scraping DOF:', e)
  }

  console.log(`✅ DOF: ${vagas.length} vagas extraídas`)
  return vagas
}

async function scrapeVagaDOF(url: string): Promise<any | null> {
  const res = await fetch(scraperUrl(url), { signal: AbortSignal.timeout(20000) })
  if (!res.ok) return null

  const html = await res.text()
  const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  // Extrai título
  const tituloMatch = texto.match(/(?:Puesto|Plaza|Cargo)[:\s]+([^\.]{10,120})/i)
    || texto.match(/CONVOCATORIA[^:]*:\s*([^\.]{10,120})/i)
  if (!tituloMatch) return null
  const titulo = tituloMatch[1].trim().slice(0, 200)

  // Extrai dependência
  const depMatch = texto.match(/(?:Dependencia|Institución|Secretaría de|Instituto|Comisión)[:\s]+([^\.]{5,100})/i)
  const dependencia = depMatch ? depMatch[1].trim().slice(0, 100) : null

  // Extrai salário
  const salMatch = texto.match(/(?:Sueldo|Salario|Remuneración)[:\s\$]+([\d\s,\.]+)/i)
  const { min: salarioMin, max: salarioMax } = salMatch ? parseSalario(salMatch[1]) : { min: null, max: null }

  // Extrai data de cierre
  const cierreMatch = texto.match(/(?:Cierre|Registro|Inscripción)[^\d]*(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{4}|\d{2}\/\d{2}\/\d{4})/i)
  const fechaCierre = cierreMatch ? parseData(cierreMatch[1]) : null

  const fonteId = `dof-${url.split('/').slice(-2).join('-').replace('.html', '').replace('.htm', '')}`

  return {
    fonte_id:          fonteId,
    titulo,
    dependencia,
    area:              detectarArea(`${titulo} ${dependencia ?? ''}`),
    estado:            detectarEstado(texto.substring(0, 500)),
    nivel_puesto:      null,
    salario_min:       salarioMin,
    salario_max:       salarioMax,
    num_plazas:        null,
    escolaridad:       null,
    fecha_publicacion: new Date().toISOString(),
    fecha_cierre:      fechaCierre ? `${fechaCierre}T23:59:00Z` : null,
    url_vaga:          url,
    url_dof:           url,
    fonte:             'dof',
  }
}

function parseData(str: string): string | null {
  if (!str) return null
  const m1 = str.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRAPER TRABAJAEN — busca via Google também
// ─────────────────────────────────────────────────────────────────────────────
async function scrapeTrabajaEn(): Promise<any[]> {
  console.log('🔍 Iniciando scraping TrabajaEn...')
  const vagas: any[] = []

  try {
    // TrabajaEn tem URLs diretas para cada vaga
    // Formato: trabajaen.gob.mx/menuini/js_detalle.jsp?referencia=XXXXX
    const buscas = [
      'site:trabajaen.gob.mx concurso plaza vacante 2026',
      'site:trabajaen.gob.mx "servicio profesional de carrera" 2026',
    ]

    const linksEncontrados = new Set<string>()

    for (const busca of buscas) {
      try {
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(busca)}&num=20`
        const res = await fetch(scraperUrl(googleUrl), { signal: AbortSignal.timeout(30000) })
        if (!res.ok) continue

        const html = await res.text()
        const linkRegex = /https?:\/\/www\.trabajaen\.gob\.mx[^\s"'<>]*/g
        let match
        while ((match = linkRegex.exec(html)) !== null) {
          if (match[0].includes('detalle') || match[0].includes('concurso')) {
            linksEncontrados.add(match[0])
          }
        }
        await new Promise(r => setTimeout(r, 2000))
      } catch (e) {
        console.warn(`Busca TrabajaEn falhou: ${e}`)
      }
    }

    console.log(`📋 TrabajaEn: ${linksEncontrados.size} links encontrados`)

    for (const url of [...linksEncontrados].slice(0, 10)) {
      const fonteId = `trabajaen-${url.split('=').pop() ?? Date.now()}`
      vagas.push({
        fonte_id:          fonteId,
        titulo:            'Plaza Vacante Servicio Profesional de Carrera',
        dependencia:       'Administración Pública Federal',
        area:              'administrativo',
        estado:            'FEDERAL',
        nivel_puesto:      null,
        salario_min:       null,
        salario_max:       null,
        num_plazas:        null,
        escolaridad:       null,
        fecha_publicacion: new Date().toISOString(),
        fecha_cierre:      null,
        url_vaga:          url,
        url_dof:           null,
        fonte:             'trabajaen',
      })
      await new Promise(r => setTimeout(r, 1000))
    }
  } catch (e) {
    console.error('Erro TrabajaEn:', e)
  }

  console.log(`✅ TrabajaEn: ${vagas.length} vagas`)
  return vagas
}

// ─────────────────────────────────────────────────────────────────────────────
// SALVAR NO SUPABASE
// ─────────────────────────────────────────────────────────────────────────────
async function salvarVagas(vagas: any[]): Promise<any[]> {
  if (vagas.length === 0) return []
  console.log(`💾 Salvando ${vagas.length} vagas...`)

  const fonteIds = vagas.map(v => v.fonte_id)
  const { data: existentes } = await supabase
    .from('convocatorias')
    .select('fonte_id')
    .in('fonte_id', fonteIds)

  const existentesSet = new Set((existentes ?? []).map((e: any) => e.fonte_id))
  const novas = vagas.filter(v => !existentesSet.has(v.fonte_id))

  if (novas.length === 0) {
    console.log('ℹ️  Nenhuma vaga nova')
    return []
  }

  console.log(`🆕 ${novas.length} vagas novas`)
  const { data, error } = await supabase
    .from('convocatorias')
    .upsert(novas, { onConflict: 'fonte_id', ignoreDuplicates: true })
    .select()

  if (error) { console.error('Erro ao salvar:', error); return [] }
  return data ?? []
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICAÇÕES PUSH
// ─────────────────────────────────────────────────────────────────────────────
async function enviarNotificacoes(): Promise<void> {
  const { data: pendentes } = await supabase
    .from('notificaciones_push')
    .select('id, user_id, conv_id, convocatorias(titulo, dependencia, salario_min)')
    .eq('enviada', false)
    .limit(100)

  if (!pendentes || pendentes.length === 0) {
    console.log('ℹ️  Nenhuma notificação pendente')
    return
  }

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

  const mensagens: any[] = []
  const ids: string[] = []

  for (const notif of pendentes) {
    const conv = (notif as any).convocatorias
    const userTokens = tokenMap[notif.user_id] ?? []
    for (const token of userTokens) {
      if (!token.startsWith('ExponentPushToken[')) continue
      mensagens.push({
        to:    token,
        title: `🏛️ Nueva plaza — ${conv?.dependencia ?? 'Gobierno'}`,
        body:  `${conv?.titulo ?? 'Nueva convocatoria'}`,
        data:  { conv_id: notif.conv_id, screen: 'Convocatoria' },
        sound: 'default',
        priority: 'high',
      })
    }
    ids.push(notif.id)
  }

  if (mensagens.length > 0) {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mensagens),
    })
  }

  if (ids.length > 0) {
    await supabase
      .from('notificaciones_push')
      .update({ enviada: true, enviada_at: new Date().toISOString() })
      .in('id', ids)
  }

  console.log(`✅ ${ids.length} notificações enviadas`)
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
serve(async (_req) => {
  const inicio = Date.now()
  console.log(`🚀 Scraper iniciado — ${new Date().toISOString()}`)

  try {
    const [vagasDOF, vagasTrabajaEn] = await Promise.allSettled([
      scrapeDOF(),
      scrapeTrabajaEn(),
    ])

    const todasVagas = [
      ...(vagasDOF.status === 'fulfilled' ? vagasDOF.value : []),
      ...(vagasTrabajaEn.status === 'fulfilled' ? vagasTrabajaEn.value : []),
    ]

    await salvarVagas(todasVagas)
    await enviarNotificacoes()

    const duracao = ((Date.now() - inicio) / 1000).toFixed(1)
    console.log(`✅ Finalizado em ${duracao}s — ${todasVagas.length} vagas processadas`)

    return new Response(JSON.stringify({
      sucesso: true,
      vagas_processadas: todasVagas.length,
      duracao_seg: duracao,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' }, status: 200 })

  } catch (e) {
    console.error('Erro fatal:', e)
    return new Response(JSON.stringify({ sucesso: false, erro: String(e) }), {
      headers: { 'Content-Type': 'application/json' }, status: 500,
    })
  }
})

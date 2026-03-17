// supabase/functions/scraper/index.ts
// Estratégia: extrai dados direto da página de listagem do DOF
// sem precisar entrar em cada vaga individualmente (muito mais rápido)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL         = Deno.env.get('DB_URL') ?? Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('DB_SERVICE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SCRAPER_API_KEY      = Deno.env.get('SCRAPER_API_KEY') ?? '10d2146c64b2996ee444f34212c7f05b'
const EXPO_PUSH_URL        = 'https://exp.host/--/api/v2/push/send'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function scraperUrl(url: string): string {
  return `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=false`
}

// ── Detectar área ─────────────────────────────────────────────────────────────
const AREA_KEYWORDS: Record<string, string[]> = {
  policia:       ['policía', 'policia', 'seguridad', 'guardia nacional', 'penitenciario', 'custodia', 'gendarmería', 'sspc'],
  juridico:      ['judicial', 'jurídico', 'magistrado', 'juez', 'actuario', 'defensor', 'ministerio público', 'fiscalía', 'procurador'],
  saude:         ['médico', 'medico', 'enfermero', 'salud', 'imss', 'issste', 'hospital', 'clínica', 'conamed', 'farmacéutico', 'cofepris'],
  fiscal:        ['sat', 'fiscal', 'tributario', 'auditor', 'hacienda', 'shcp', 'finanzas', 'contribuyente', 'recaudador', 'economía'],
  ti:            ['tecnología', 'tecnologia', 'sistemas', 'informática', 'programador', 'desarrollador', 'redes', 'ciberseguridad', 'software', 'datos'],
  educacion:     ['docente', 'profesor', 'maestro', 'sep', 'educación', 'enseñanza', 'pedagogo', 'ipn', 'universidad', 'inba', 'cultura'],
  administrativo:['administrativo', 'administración', 'gestión', 'secretaria', 'archivo', 'analista', 'coordinador', 'gobernación', 'trabajo', 'energía', 'semarnat', 'infraestructura'],
}

function detectarArea(texto: string): string {
  const t = texto.toLowerCase()
  for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
    if (keywords.some(kw => t.includes(kw))) return area
  }
  return 'administrativo'
}

// ── Detectar estado ───────────────────────────────────────────────────────────
function detectarEstado(texto: string): string {
  const t = texto.toLowerCase()
  const estados: Record<string, string[]> = {
    CMX: ['ciudad de méxico', 'cdmx', 'distrito federal'],
    JAL: ['jalisco', 'guadalajara'],
    NLE: ['nuevo león', 'monterrey'],
    MEX: ['estado de méxico', 'edomex', 'toluca'],
    PUE: ['puebla'],
    GTO: ['guanajuato'],
    VER: ['veracruz'],
    COA: ['coahuila'],
    CHH: ['chihuahua'],
    SON: ['sonora'],
    TAM: ['tamaulipas'],
    SIN: ['sinaloa'],
    OAX: ['oaxaca'],
    CHP: ['chiapas'],
    YUC: ['yucatán', 'mérida'],
  }
  for (const [estado, kws] of Object.entries(estados)) {
    if (kws.some(kw => t.includes(kw))) return estado
  }
  return 'FEDERAL'
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRAPER DOF — extrai dados direto da página de listagem
// Muito mais rápido: 1 request para a lista, sem entrar em cada vaga
// ─────────────────────────────────────────────────────────────────────────────
async function scrapeDOF(): Promise<any[]> {
  console.log('🔍 Scraping DOF vacantes.php (extração da listagem)...')
  const vagas: any[] = []

  try {
    const res = await fetch(scraperUrl('https://www.dof.gob.mx/vacantes.php'), {
      signal: AbortSignal.timeout(45000),
    })

    if (!res.ok) {
      console.warn(`DOF retornou status ${res.status}`)
      return []
    }

    const html = await res.text()

    // Parse da tabela de vacantes
    // Estrutura do HTML:
    // <td>DATA</td> <td>DEPENDENCIA</td>
    // <td>href="vacantes/NNNNN/NNNNNN.html">link</td>
    // <div>TEXTO DA CONVOCATORIA</div>

    // Divide o HTML por blocos de convocatória
    const blocos = html.split('<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#e1eef8">')

    console.log(`📋 DOF: ${blocos.length - 1} blocos encontrados`)

    for (let i = 1; i < blocos.length; i++) {
      const bloco = blocos[i]

      // Extrai data
      const dataMatch = bloco.match(/<strong>(\d{2}\/\d{2}\/\d{4})<\/strong>/)
      const dataStr = dataMatch ? dataMatch[1] : null

      // Extrai dependência
      const depMatch = bloco.match(/txt_blanco99[^>]*>([^<]{5,200})<\/td>/)
      const dependencia = depMatch ? depMatch[1].trim().replace(/\s+/g, ' ') : null

      // Extrai link da vaga
      const linkMatch = bloco.match(/href="(vacantes\/\d+\/\d+\.html?)"/)
      if (!linkMatch) continue
      const urlVaga = `https://www.dof.gob.mx/${linkMatch[1]}`

      // Extrai trecho da convocatória (texto descritivo)
      const textoMatch = bloco.match(/<div[^>]*align="justify">([\s\S]*?)<\/div>/)
      const textoRaw = textoMatch ? textoMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''

      // ID único baseado no link
      const fonteId = `dof-${linkMatch[1].replace(/\//g, '-').replace('.html', '')}`

      // Detecta área e estado pelo texto
      const textoCompleto = `${dependencia ?? ''} ${textoRaw}`

      // Extrai número da convocatória como título mais limpo
      const numMatch = textoRaw.match(/CONVOCATORIA\s+(?:PUBLICA\s+Y\s+ABIERTA\s+)?(?:No\.?\s*)?([^\n]{3,60})(?=\n|El Comité|Los Comités|Con fund)/i)
      const titulo = numMatch
        ? `${dependencia?.split('.-')[0]?.trim() ?? 'Gobierno'} — ${numMatch[1].trim().slice(0, 100)}`
        : `Convocatoria ${dependencia?.split('.-')[0]?.trim() ?? 'Administración Pública Federal'}`

      // Converte data dd/mm/yyyy para ISO
      let fechaPublicacion = null
      if (dataStr) {
        const [d, m, a] = dataStr.split('/')
        fechaPublicacion = `${a}-${m}-${d}T00:00:00Z`
      }

      vagas.push({
        fonte_id:          fonteId,
        titulo:            titulo.slice(0, 250),
        dependencia:       dependencia?.split('.-')[0]?.trim().slice(0, 150) ?? null,
        area:              detectarArea(textoCompleto),
        estado:            detectarEstado(textoCompleto),
        nivel_puesto:      null,
        salario_min:       null,
        salario_max:       null,
        num_plazas:        null,
        escolaridad:       null,
        descripcion:       textoRaw.slice(0, 500),
        fecha_publicacion: fechaPublicacion,
        fecha_cierre:      null,
        url_vaga:          urlVaga,
        url_dof:           urlVaga,
        fonte:             'dof',
      })
    }

  } catch (e) {
    console.error('Erro no scraping DOF:', e)
  }

  console.log(`✅ DOF: ${vagas.length} vagas extraídas`)
  return vagas
}

// ─────────────────────────────────────────────────────────────────────────────
// SALVAR NO SUPABASE
// ─────────────────────────────────────────────────────────────────────────────
async function salvarVagas(vagas: any[]): Promise<number> {
  if (vagas.length === 0) return 0
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
    return 0
  }

  console.log(`🆕 ${novas.length} vagas novas para inserir`)

  const { error } = await supabase
    .from('convocatorias')
    .upsert(novas, { onConflict: 'fonte_id', ignoreDuplicates: true })

  if (error) {
    console.error('Erro ao salvar:', error)
    return 0
  }

  return novas.length
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICAÇÕES PUSH
// ─────────────────────────────────────────────────────────────────────────────
async function enviarNotificacoes(): Promise<void> {
  const { data: pendentes } = await supabase
    .from('notificaciones_push')
    .select('id, user_id, conv_id, convocatorias(titulo, dependencia)')
    .eq('enviada', false)
    .limit(50)

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
    for (const token of (tokenMap[notif.user_id] ?? [])) {
      if (!token.startsWith('ExponentPushToken[')) continue
      mensagens.push({
        to:       token,
        title:    `🏛️ ${conv?.dependencia ?? 'Nueva convocatoria'}`,
        body:     conv?.titulo ?? 'Nueva plaza disponible',
        data:     { conv_id: notif.conv_id, screen: 'Convocatoria' },
        sound:    'default',
        priority: 'high',
      })
    }
    ids.push(notif.id)
  }

  if (mensagens.length > 0) {
    await fetch(EXPO_PUSH_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(mensagens),
    })
  }

  if (ids.length > 0) {
    await supabase
      .from('notificaciones_push')
      .update({ enviada: true, enviada_at: new Date().toISOString() })
      .in('id', ids)
  }

  console.log(`✅ ${ids.length} notificações processadas`)
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
serve(async (_req) => {
  const inicio = Date.now()
  console.log(`🚀 Scraper iniciado — ${new Date().toISOString()}`)

  try {
    // 1. Scraping (apenas 1 request ao DOF agora — muito mais rápido)
    const vagas = await scrapeDOF()

    // 2. Salvar novas vagas
    const novas = await salvarVagas(vagas)

    // 3. Notificações
    await enviarNotificacoes()

    const duracao = ((Date.now() - inicio) / 1000).toFixed(1)
    console.log(`✅ Finalizado em ${duracao}s — ${vagas.length} processadas, ${novas} novas`)

    return new Response(JSON.stringify({
      sucesso:           true,
      vagas_processadas: vagas.length,
      vagas_novas:       novas,
      duracao_seg:       duracao,
      timestamp:         new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' }, status: 200 })

  } catch (e) {
    console.error('Erro fatal:', e)
    return new Response(JSON.stringify({ sucesso: false, erro: String(e) }), {
      headers: { 'Content-Type': 'application/json' }, status: 500,
    })
  }
})

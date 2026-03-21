// supabase/functions/scraper/index.ts
// PlazaYa — Scraper multi-fonte para convocatorias do governo mexicano
// Fontes:
//   1. DOF Vacantes (dof.gob.mx/vacantes.php) — página principal
//   2. DOF Búsqueda Avanzada (sidof.segob.gob.mx) — convocatorias históricas/recentes
//   3. gob.mx Secretarías — convocatorias publicadas nas páginas de cada secretaría
//   4. Guardia Nacional, CFE, USICAMM — fontes específicas

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
  educacion:     ['docente', 'profesor', 'maestro', 'sep', 'educación', 'enseñanza', 'pedagogo', 'ipn', 'universidad', 'inba', 'cultura', 'usicamm'],
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
    GTO: ['guanajuato', 'león'],
    VER: ['veracruz'],
    COA: ['coahuila', 'saltillo'],
    CHH: ['chihuahua'],
    SON: ['sonora', 'hermosillo'],
    TAM: ['tamaulipas', 'reynosa', 'matamoros'],
    SIN: ['sinaloa', 'culiacán', 'mazatlán'],
    OAX: ['oaxaca'],
    CHP: ['chiapas', 'tuxtla'],
    YUC: ['yucatán', 'mérida'],
    QRO: ['querétaro'],
    SLP: ['san luis potosí'],
    AGS: ['aguascalientes'],
    MIC: ['michoacán', 'morelia'],
    GRO: ['guerrero', 'acapulco'],
    HID: ['hidalgo', 'pachuca'],
    TAB: ['tabasco', 'villahermosa'],
    MOR: ['morelos', 'cuernavaca'],
    ZAC: ['zacatecas'],
    DUR: ['durango'],
    NAY: ['nayarit', 'tepic'],
    TLA: ['tlaxcala'],
    CAM: ['campeche'],
    COL: ['colima'],
    BCS: ['baja california sur', 'la paz'],
    BCN: ['baja california', 'tijuana', 'mexicali', 'ensenada'],
    ROO: ['quintana roo', 'cancún', 'chetumal'],
  }
  for (const [estado, kws] of Object.entries(estados)) {
    if (kws.some(kw => t.includes(kw))) return estado
  }
  return 'FEDERAL'
}

// ── Helper: extrair nível de puesto ───────────────────────────────────────────
function detectarNivel(texto: string): string | null {
  const t = texto.toLowerCase()
  if (t.includes('director general'))   return 'Director General'
  if (t.includes('director de área') || t.includes('director de area')) return 'Director de Área'
  if (t.includes('subdirector'))        return 'Subdirección'
  if (t.includes('jefe de departamento') || t.includes('jefatura')) return 'Jefatura de Departamento'
  if (t.includes('enlace'))             return 'Enlace'
  if (t.includes('operativo'))          return 'Operativo'
  if (t.includes('elemento'))           return 'Operativo'
  return null
}

// ── Helper: extrair escolaridad ───────────────────────────────────────────────
function detectarEscolaridad(texto: string): string | null {
  const t = texto.toLowerCase()
  if (t.includes('maestría') || t.includes('posgrado'))     return 'Maestría'
  if (t.includes('licenciatura') || t.includes('profesional')) return 'Licenciatura'
  if (t.includes('preparatoria') || t.includes('bachillerato')) return 'Preparatoria'
  if (t.includes('secundaria'))                              return 'Secundaria'
  if (t.includes('técnico'))                                 return 'Técnico'
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// FONTE 1: DOF VACANTES — página principal (já existente)
// ─────────────────────────────────────────────────────────────────────────────
async function scrapeDOF(): Promise<any[]> {
  console.log('🔍 [1/4] Scraping DOF vacantes.php...')
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
    const blocos = html.split('<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#e1eef8">')

    console.log(`📋 DOF: ${blocos.length - 1} blocos encontrados`)

    for (let i = 1; i < blocos.length; i++) {
      const bloco = blocos[i]

      const dataMatch = bloco.match(/<strong>(\d{2}\/\d{2}\/\d{4})<\/strong>/)
      const dataStr = dataMatch ? dataMatch[1] : null

      const depMatch = bloco.match(/txt_blanco99[^>]*>([^<]{5,200})<\/td>/)
      const dependencia = depMatch ? depMatch[1].trim().replace(/\s+/g, ' ') : null

      const linkMatch = bloco.match(/href="(vacantes\/\d+\/\d+\.html?)"/)
      if (!linkMatch) continue
      const urlVaga = `https://www.dof.gob.mx/${linkMatch[1]}`

      const textoMatch = bloco.match(/<div[^>]*align="justify">([\s\S]*?)<\/div>/)
      const textoRaw = textoMatch ? textoMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''

      const fonteId = `dof-${linkMatch[1].replace(/\//g, '-').replace('.html', '')}`
      const textoCompleto = `${dependencia ?? ''} ${textoRaw}`

      const numMatch = textoRaw.match(/CONVOCATORIA\s+(?:PUBLICA\s+Y\s+ABIERTA\s+)?(?:No\.?\s*)?([^\n]{3,60})(?=\n|El Comité|Los Comités|Con fund)/i)
      const titulo = numMatch
        ? `${dependencia?.split('.-')[0]?.trim() ?? 'Gobierno'} — ${numMatch[1].trim().slice(0, 100)}`
        : `Convocatoria ${dependencia?.split('.-')[0]?.trim() ?? 'Administración Pública Federal'}`

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
        nivel_puesto:      detectarNivel(textoCompleto),
        salario_min:       null,
        salario_max:       null,
        num_plazas:        null,
        escolaridad:       detectarEscolaridad(textoCompleto),
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

  console.log(`✅ DOF vacantes: ${vagas.length} vagas extraídas`)
  return vagas
}

// ─────────────────────────────────────────────────────────────────────────────
// FONTE 2: DOF BÚSQUEDA AVANZADA — busca por "convocatoria" nos últimos 30 dias
// Busca na seção de convocatorias do DOF que não aparece na página principal
// ─────────────────────────────────────────────────────────────────────────────
async function scrapeDOFBusqueda(): Promise<any[]> {
  console.log('🔍 [2/4] Scraping DOF búsqueda avanzada...')
  const vagas: any[] = []

  try {
    // Datas dos últimos 30 dias
    const hoy = new Date()
    const hace30 = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
    const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`

    const url = `https://www.dof.gob.mx/busqueda_detalle.php` +
      `?vienede=avanzada&busqueda_cuerpo=C&BUSCAR_EN=C` +
      `&textobusqueda=convocatoria+servicio+profesional+carrera` +
      `&TIPO_TEXTO=Y&choosePeriodDate=P&periodoFecha=Y` +
      `&fechaInicio=${fmtDate(hace30)}&fechaFin=${fmtDate(hoy)}`

    const res = await fetch(scraperUrl(url), {
      signal: AbortSignal.timeout(45000),
    })

    if (!res.ok) {
      console.warn(`DOF búsqueda retornou status ${res.status}`)
      return []
    }

    const html = await res.text()

    // Extrair links de resultados — padrão: <a href="nota_detalle.php?codigo=XXXXXXX"...>
    const resultados = html.matchAll(/<a[^>]+href="(nota_detalle\.php\?codigo=(\d+))"[^>]*>([\s\S]*?)<\/a>/gi)

    for (const match of resultados) {
      const urlNota = `https://www.dof.gob.mx/${match[1]}`
      const codigo = match[2]
      const textoLink = match[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

      // Filtrar: só interessa se menciona concurso/convocatoria/plaza/vacante
      const textoLow = textoLink.toLowerCase()
      if (!textoLow.includes('convocatoria') && !textoLow.includes('concurso') &&
          !textoLow.includes('plaza') && !textoLow.includes('vacante')) continue

      const fonteId = `dof-busq-${codigo}`

      // Extrair dependencia do texto
      const depMatch = textoLink.match(/^([A-ZÁÉÍÓÚÑ\s]{5,80})(?:\.|—|-|:)/i)
      const dependencia = depMatch ? depMatch[1].trim() : null

      vagas.push({
        fonte_id:          fonteId,
        titulo:            textoLink.slice(0, 250) || `Convocatoria DOF ${codigo}`,
        dependencia:       dependencia?.slice(0, 150) ?? null,
        area:              detectarArea(textoLink),
        estado:            detectarEstado(textoLink),
        nivel_puesto:      detectarNivel(textoLink),
        salario_min:       null,
        salario_max:       null,
        num_plazas:        null,
        escolaridad:       detectarEscolaridad(textoLink),
        descripcion:       textoLink.slice(0, 500),
        fecha_publicacion: new Date().toISOString(),
        fecha_cierre:      null,
        url_vaga:          urlNota,
        url_dof:           urlNota,
        fonte:             'dof_busqueda',
      })
    }
  } catch (e) {
    console.error('Erro no scraping DOF búsqueda:', e)
  }

  console.log(`✅ DOF búsqueda: ${vagas.length} vagas extraídas`)
  return vagas
}

// ─────────────────────────────────────────────────────────────────────────────
// FONTE 3: GOB.MX — Secretarías que publicam convocatorias diretamente
// Scraping das páginas de convocatorias das secretarías mais relevantes
// ─────────────────────────────────────────────────────────────────────────────

interface SecretariaConfig {
  nombre: string
  url: string
  area: string
}

const SECRETARIAS: SecretariaConfig[] = [
  { nombre: 'Secretaría de Salud',               url: 'https://www.gob.mx/salud/acciones-y-programas/convocatorias-servicio-profesional-de-carrera', area: 'saude' },
  { nombre: 'Secretaría de Educación Pública',    url: 'https://www.gob.mx/sep/acciones-y-programas/convocatorias-servicio-profesional-de-carrera-2025', area: 'educacion' },
  { nombre: 'STPS',                               url: 'https://www.gob.mx/stps/acciones-y-programas/servicio-profesional-de-carrera-702', area: 'administrativo' },
  { nombre: 'Secretaría de Economía',             url: 'https://www.gob.mx/se/acciones-y-programas/servicio-profesional-de-carrera', area: 'fiscal' },
  { nombre: 'SEMARNAT',                           url: 'https://www.gob.mx/semarnat/acciones-y-programas/servicio-profesional-de-carrera-semarnat', area: 'administrativo' },
  { nombre: 'Secretaría de Turismo',              url: 'https://www.gob.mx/sectur/documentos/convocatorias-del-servicio-profesional-de-carrera-bolsa-de-trabajo', area: 'administrativo' },
  { nombre: 'SRE',                                url: 'https://www.gob.mx/sre/acciones-y-programas/concurso-de-ingreso-al-servicio-exterior-mexicano', area: 'administrativo' },
  { nombre: 'SHCP',                               url: 'https://www.gob.mx/shcp/acciones-y-programas/servicio-profesional-de-carrera-shcp', area: 'fiscal' },
]

async function scrapeGobMxSecretarias(): Promise<any[]> {
  console.log('🔍 [3/4] Scraping gob.mx secretarías...')
  const vagas: any[] = []

  for (const sec of SECRETARIAS) {
    try {
      const res = await fetch(scraperUrl(sec.url), {
        signal: AbortSignal.timeout(30000),
      })

      if (!res.ok) {
        console.warn(`  ⚠️ ${sec.nombre}: status ${res.status}`)
        continue
      }

      const html = await res.text()

      // gob.mx usa vários padrões de links. Buscamos links para convocatorias/documentos
      // Padrão 1: links para PDFs de convocatorias
      const pdfLinks = html.matchAll(/href="([^"]*(?:convocatoria|concurso)[^"]*\.pdf)"/gi)
      for (const m of pdfLinks) {
        const pdfUrl = m[1].startsWith('http') ? m[1] : `https://www.gob.mx${m[1]}`
        const fonteId = `gobmx-${sec.nombre.slice(0,10).replace(/\s/g,'')}-${pdfUrl.replace(/[^a-zA-Z0-9]/g, '').slice(-30)}`

        // Extrair título do nome do arquivo PDF
        const filename = pdfUrl.split('/').pop()?.replace('.pdf', '').replace(/[-_]/g, ' ') ?? ''

        vagas.push({
          fonte_id:          fonteId,
          titulo:            `${sec.nombre} — ${filename}`.slice(0, 250),
          dependencia:       sec.nombre.slice(0, 150),
          area:              sec.area,
          estado:            'FEDERAL',
          nivel_puesto:      null,
          salario_min:       null,
          salario_max:       null,
          num_plazas:        null,
          escolaridad:       null,
          descripcion:       `Convocatoria publicada por ${sec.nombre}`,
          fecha_publicacion: new Date().toISOString(),
          fecha_cierre:      null,
          url_vaga:          pdfUrl,
          url_dof:           null,
          fonte:             'gob_mx',
        })
      }

      // Padrão 2: links internos para notas/documentos de convocatorias
      const docLinks = html.matchAll(/<a[^>]+href="(\/[^"]*(?:convocatoria|concurso|spc)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)
      for (const m of docLinks) {
        const docUrl = `https://www.gob.mx${m[1]}`
        const textoLink = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        if (textoLink.length < 10) continue

        const fonteId = `gobmx-doc-${m[1].replace(/[^a-zA-Z0-9]/g, '').slice(-30)}`

        vagas.push({
          fonte_id:          fonteId,
          titulo:            `${sec.nombre} — ${textoLink}`.slice(0, 250),
          dependencia:       sec.nombre.slice(0, 150),
          area:              sec.area,
          estado:            detectarEstado(textoLink),
          nivel_puesto:      detectarNivel(textoLink),
          salario_min:       null,
          salario_max:       null,
          num_plazas:        null,
          escolaridad:       detectarEscolaridad(textoLink),
          descripcion:       textoLink.slice(0, 500),
          fecha_publicacion: new Date().toISOString(),
          fecha_cierre:      null,
          url_vaga:          docUrl,
          url_dof:           null,
          fonte:             'gob_mx',
        })
      }

      console.log(`  ✅ ${sec.nombre}: ${vagas.length} vagas acumuladas`)
    } catch (e) {
      console.warn(`  ❌ ${sec.nombre}: ${e}`)
    }
  }

  console.log(`✅ gob.mx secretarías: ${vagas.length} vagas totais`)
  return vagas
}

// ─────────────────────────────────────────────────────────────────────────────
// FONTE 4: FONTES ESPECÍFICAS — GN, CFE, USICAMM, INEGI
// ─────────────────────────────────────────────────────────────────────────────

interface FonteEspecifica {
  nombre: string
  url: string
  area: string
  parseFunc: (html: string, nombre: string, url: string, area: string) => any[]
}

function parseGenericoConvocatorias(html: string, nombre: string, baseUrl: string, area: string): any[] {
  const vagas: any[] = []

  // Busca links para convocatorias/concursos em qualquer formato
  const allLinks = html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)

  for (const m of allLinks) {
    const href = m[1]
    const texto = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const textoLow = texto.toLowerCase()

    // Filtrar só o que é relevante
    if (texto.length < 15) continue
    if (!textoLow.includes('convocatoria') && !textoLow.includes('concurso') &&
        !textoLow.includes('plaza') && !textoLow.includes('vacante') &&
        !textoLow.includes('ingreso') && !textoLow.includes('proceso de selección')) continue

    const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`
    const fonteId = `esp-${nombre.slice(0,8).replace(/\s/g,'')}-${href.replace(/[^a-zA-Z0-9]/g, '').slice(-25)}`

    vagas.push({
      fonte_id:          fonteId,
      titulo:            `${nombre} — ${texto}`.slice(0, 250),
      dependencia:       nombre.slice(0, 150),
      area:              area,
      estado:            detectarEstado(texto),
      nivel_puesto:      detectarNivel(texto),
      salario_min:       null,
      salario_max:       null,
      num_plazas:        null,
      escolaridad:       detectarEscolaridad(texto),
      descripcion:       texto.slice(0, 500),
      fecha_publicacion: new Date().toISOString(),
      fecha_cierre:      null,
      url_vaga:          fullUrl,
      url_dof:           null,
      fonte:             'especifica',
    })
  }

  return vagas
}

const FONTES_ESPECIFICAS: FonteEspecifica[] = [
  {
    nombre: 'Guardia Nacional',
    url: 'https://www.gob.mx/guardianacional/acciones-y-programas/convocatorias-702',
    area: 'policia',
    parseFunc: parseGenericoConvocatorias,
  },
  {
    nombre: 'CFE',
    url: 'https://apps.cfe.mx/solicitudesempleo/Convocatoria/Inicio',
    area: 'administrativo',
    parseFunc: parseGenericoConvocatorias,
  },
  {
    nombre: 'INEGI SPC',
    url: 'https://www.inegi.org.mx/app/spc/',
    area: 'administrativo',
    parseFunc: parseGenericoConvocatorias,
  },
]

async function scrapeFontesEspecificas(): Promise<any[]> {
  console.log('🔍 [4/4] Scraping fontes específicas...')
  const vagas: any[] = []

  for (const fonte of FONTES_ESPECIFICAS) {
    try {
      const res = await fetch(scraperUrl(fonte.url), {
        signal: AbortSignal.timeout(30000),
      })

      if (!res.ok) {
        console.warn(`  ⚠️ ${fonte.nombre}: status ${res.status}`)
        continue
      }

      const html = await res.text()
      const novas = fonte.parseFunc(html, fonte.nombre, fonte.url, fonte.area)
      vagas.push(...novas)
      console.log(`  ✅ ${fonte.nombre}: ${novas.length} vagas`)
    } catch (e) {
      console.warn(`  ❌ ${fonte.nombre}: ${e}`)
    }
  }

  console.log(`✅ Fontes específicas: ${vagas.length} vagas totais`)
  return vagas
}

// ─────────────────────────────────────────────────────────────────────────────
// SALVAR NO SUPABASE (sem alterações)
// ─────────────────────────────────────────────────────────────────────────────
async function salvarVagas(vagas: any[]): Promise<number> {
  if (vagas.length === 0) return 0
  console.log(`💾 Salvando ${vagas.length} vagas...`)

  // Deduplica por fonte_id dentro do próprio batch
  const map = new Map<string, any>()
  for (const v of vagas) {
    if (!map.has(v.fonte_id)) map.set(v.fonte_id, v)
  }
  const unicas = [...map.values()]

  const fonteIds = unicas.map(v => v.fonte_id)

  // Supabase .in() aceita max ~300 items, dividir em chunks
  const chunkSize = 200
  const existentesSet = new Set<string>()

  for (let i = 0; i < fonteIds.length; i += chunkSize) {
    const chunk = fonteIds.slice(i, i + chunkSize)
    const { data: existentes } = await supabase
      .from('convocatorias')
      .select('fonte_id')
      .in('fonte_id', chunk)

    for (const e of (existentes ?? [])) {
      existentesSet.add(e.fonte_id)
    }
  }

  const novas = unicas.filter(v => !existentesSet.has(v.fonte_id))

  if (novas.length === 0) {
    console.log('ℹ️  Nenhuma vaga nova')
    return 0
  }

  console.log(`🆕 ${novas.length} vagas novas para inserir`)

  // Inserir em chunks para evitar payload muito grande
  let inseridas = 0
  for (let i = 0; i < novas.length; i += 50) {
    const batch = novas.slice(i, i + 50)
    const { error } = await supabase
      .from('convocatorias')
      .upsert(batch, { onConflict: 'fonte_id', ignoreDuplicates: true })

    if (error) {
      console.error(`Erro ao salvar batch ${i}:`, error)
    } else {
      inseridas += batch.length
    }
  }

  return inseridas
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICAÇÕES PUSH (sem alterações)
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
// ENTRY POINT — agora com 4 fontes
// ─────────────────────────────────────────────────────────────────────────────
serve(async (_req) => {
  const inicio = Date.now()
  console.log(`🚀 Scraper PlazaYa iniciado — ${new Date().toISOString()}`)

  try {
    // Rodar todas as fontes em paralelo para performance
    const [vagasDOF, vagasBusqueda, vagasGobMx, vagasEspecificas] = await Promise.allSettled([
      scrapeDOF(),
      scrapeDOFBusqueda(),
      scrapeGobMxSecretarias(),
      scrapeFontesEspecificas(),
    ])

    // Coletar resultados (ignorar fontes que falharam)
    const todasVagas: any[] = []
    const resumo: Record<string, number> = {}

    for (const [nome, resultado] of [
      ['dof_vacantes',   vagasDOF],
      ['dof_busqueda',   vagasBusqueda],
      ['gob_mx',         vagasGobMx],
      ['especificas',    vagasEspecificas],
    ] as [string, PromiseSettledResult<any[]>][]) {
      if (resultado.status === 'fulfilled') {
        todasVagas.push(...resultado.value)
        resumo[nome] = resultado.value.length
      } else {
        console.error(`❌ Fonte ${nome} falhou:`, resultado.reason)
        resumo[nome] = -1  // indica falha
      }
    }

    console.log(`📊 Total coletado: ${todasVagas.length} vagas de ${Object.keys(resumo).length} fontes`)

    // Salvar novas vagas
    const novas = await salvarVagas(todasVagas)

    // Notificações
    await enviarNotificacoes()

    const duracao = ((Date.now() - inicio) / 1000).toFixed(1)
    console.log(`✅ Finalizado em ${duracao}s — ${todasVagas.length} processadas, ${novas} novas`)

    return new Response(JSON.stringify({
      sucesso:           true,
      vagas_processadas: todasVagas.length,
      vagas_novas:       novas,
      fontes:            resumo,
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

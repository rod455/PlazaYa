// functions/index.js
// Cloud Functions — feeds RSS de concursos mexicanos + push automático

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const Parser = require("rss-parser");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
const parser = new Parser({ timeout: 15000 });

// ── UTILIDADES ────────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").slice(0, 80);
}

function detectarArea(titulo) {
  const t = titulo.toLowerCase();
  if (/polic|guardia|seguridad|penitenciar|custod/.test(t)) return "policia";
  if (/judicial|juez|magistrad|defensor|fiscal|procurad/.test(t)) return "juridico";
  if (/médico|medico|enferm|salud|imss|issste|hospital/.test(t)) return "saude";
  if (/sat|fiscal|tributar|auditor|hacienda|finanz/.test(t)) return "fiscal";
  if (/tecnolog|sistema|informát|programad|desarroll/.test(t)) return "ti";
  if (/docente|profesor|maestr|sep|educac|usicamm/.test(t)) return "educacion";
  return "administrativo";
}

function detectarEstado(texto) {
  const t = texto.toLowerCase();
  const estados = {
    CMX: ['ciudad de méxico', 'cdmx'], JAL: ['jalisco', 'guadalajara'],
    NLE: ['nuevo león', 'monterrey'], MEX: ['estado de méxico', 'toluca'],
    PUE: ['puebla'], GTO: ['guanajuato'], VER: ['veracruz'],
    CHH: ['chihuahua'], SON: ['sonora'], YUC: ['yucatán', 'mérida'],
    OAX: ['oaxaca'], CHP: ['chiapas'], TAM: ['tamaulipas'],
    SIN: ['sinaloa'], COA: ['coahuila'],
  };
  for (const [estado, kws] of Object.entries(estados)) {
    if (kws.some(kw => t.includes(kw))) return estado;
  }
  return 'FEDERAL';
}

async function enviarNotificacion(concurso) {
  try {
    const topico = `convocatoria_${concurso.area}`;
    const message = {
      notification: {
        title: `🏛️ ${concurso.orgao || 'Nueva convocatoria'}`,
        body: concurso.titulo?.slice(0, 100) || 'Nueva plaza disponible',
      },
      data: {
        tipo: "nueva_convocatoria",
        area: concurso.area || "",
        url: concurso.url || "",
        screen: "Novedades",
      },
      topic: topico,
    };
    await messaging.send(message);

    // También al tópico general
    const msgGeneral = { ...message, topic: "nuevas_convocatorias" };
    await messaging.send(msgGeneral);

    console.log(`Push enviado: ${concurso.titulo}`);
  } catch (err) {
    console.error("Error push:", err.message);
  }
}

// ── FEEDS MEXICANOS ───────────────────────────────────────────────────────────
const FEEDS = [
  {
    nombre: "DOF - Convocatorias",
    url: "https://www.dof.gob.mx/rss.php",
    tipo: "rss",
  },
  {
    nombre: "Gobierno MX - Empleos",
    url: "https://www.gob.mx/busqueda.rss?utf8=%E2%9C%93&q=convocatoria+empleo",
    tipo: "rss",
  },
];

exports.buscarFeedsConvocatorias = functions
  .runWith({ timeoutSeconds: 300, memory: "512MB" })
  .pubsub.schedule("every 6 hours")
  .onRun(async () => {
    console.log("Buscando feeds de convocatorias...");
    let novos = 0;

    for (const feed of FEEDS) {
      try {
        console.log(`Procesando: ${feed.nombre}`);
        const resultado = await parser.parseURL(feed.url);

        for (const item of resultado.items || []) {
          const titulo = item.title || "";
          const url = item.link || "";
          const descricao = item.contentSnippet || item.content || "";

          // Filtra: solo convocatorias / empleos públicos
          const textoCompleto = `${titulo} ${descricao}`.toLowerCase();
          const esConvocatoria = /convocatoria|plaza|vacante|concurso|empleo|servidor público|spc|ingreso/.test(textoCompleto);
          if (!esConvocatoria) continue;

          const id = slugify(titulo + '-' + (item.isoDate || ''));
          const docRef = db.collection("noticias_concursos").doc(id);
          const exists = await docRef.get();
          if (exists.exists) continue;

          const area = detectarArea(textoCompleto);
          const estado = detectarEstado(textoCompleto);

          const data = {
            id,
            titulo: titulo.slice(0, 250),
            descripcion: descricao.slice(0, 500),
            url,
            fuente: feed.nombre,
            area,
            estado,
            dataPublicacao: item.isoDate ? new Date(item.isoDate) : new Date(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          await docRef.set(data);
          novos++;

          // Push notification
          await enviarNotificacion({ titulo, area, url, orgao: feed.nombre });
        }
      } catch (err) {
        console.error(`Error en ${feed.nombre}:`, err.message);
      }
    }

    // Stats
    await db.collection("stats").doc("feeds").set({
      ultimaEjecucion: admin.firestore.FieldValue.serverTimestamp(),
      nuevasNoticias: admin.firestore.FieldValue.increment(novos),
    }, { merge: true });

    console.log(`Feeds finalizados. Nuevos: ${novos}`);
    return null;
  });

// ── CLEANUP DE NOTICIAS ANTIGAS ───────────────────────────────────────────────
exports.limpiarNoticiasAntiguas = functions
  .runWith({ timeoutSeconds: 120 })
  .pubsub.schedule("every 7 days")
  .onRun(async () => {
    const limite = new Date();
    limite.setDate(limite.getDate() - 90); // 90 días

    const snapshot = await db.collection("noticias_concursos")
      .where("createdAt", "<", limite)
      .limit(200)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    console.log(`Limpieza: ${snapshot.size} noticias eliminadas`);
    return null;
  });

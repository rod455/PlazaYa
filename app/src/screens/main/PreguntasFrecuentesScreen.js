// PreguntasFrecuentesScreen.js
// Pantalla de Preguntas Frecuentes - PlazaYa
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useVoltarComAdENPS } from '../../hooks/useVoltarComNPS';

const CORES = {
  primary: '#1a5c2a',
  primaryDark: '#0e3d1a',
  primaryLight: '#2d8a42',
  background: '#f5f9f6',
  card: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#555555',
  border: '#e0e8e2',
  accent: '#d4edda',
};

const PREGUNTAS = [
  {
    id: 1,
    pregunta: '¿Cómo funciona una convocatoria de empleo público?',
    respuesta:
      'En México, las convocatorias de empleo público son procesos de selección abiertos para ingresar al servicio gubernamental. Los principales sistemas son:\n\n' +
      '• Servicio Profesional de Carrera (SPC): Para puestos en la Administración Pública Federal, desde enlace hasta director general. Se publican en trabajaen.gob.mx.\n\n' +
      '• USICAMM: La Unidad del Sistema para la Carrera de las Maestras y los Maestros administra los concursos de oposición para plazas docentes en educación básica y media superior.\n\n' +
      '• Poder Judicial de la Federación: Realiza concursos de oposición para jueces, magistrados y personal jurisdiccional a través del Consejo de la Judicatura Federal.\n\n' +
      '• Organismos autónomos: El INE, Banxico, INEGI y otros organismos tienen sus propios procesos de selección con convocatorias específicas.\n\n' +
      'Cada convocatoria establece requisitos, etapas de evaluación, fechas y el número de plazas disponibles. Es fundamental leer completa la convocatoria antes de postularse.',
  },
  {
    id: 2,
    pregunta: '¿Qué es el Servicio Profesional de Carrera?',
    respuesta:
      'El Servicio Profesional de Carrera (SPC) es el sistema de mérito que rige el ingreso, desarrollo y permanencia del personal en la Administración Pública Federal centralizada.\n\n' +
      'Características principales:\n\n' +
      '• Se basa en la Ley del Servicio Profesional de Carrera en la Administración Pública Federal.\n\n' +
      '• Aplica para puestos de enlace, jefe de departamento, subdirector, director de área, director general adjunto y director general.\n\n' +
      '• El proceso incluye evaluaciones gerenciales, técnicas, de visión del servicio público y assessment center (según el nivel).\n\n' +
      '• Las vacantes se publican en el portal trabajaen.gob.mx y cualquier persona que cumpla los requisitos puede participar.\n\n' +
      '• El sistema busca garantizar la igualdad de oportunidades y la selección por mérito, independientemente de afiliaciones políticas.\n\n' +
      '• Al ser seleccionado, se obtiene un nombramiento con estabilidad laboral y prestaciones del gobierno federal.',
  },
  {
    id: 3,
    pregunta: '¿Cuánto tiempo necesito estudiar?',
    respuesta:
      'El tiempo de preparación varía según el tipo de convocatoria y tu nivel actual de conocimientos:\n\n' +
      '• Enlace y Jefe de Departamento (SPC): De 2 a 4 semanas de estudio enfocado en los temarios publicados y las evaluaciones gerenciales.\n\n' +
      '• Subdirector y Director de Área (SPC): De 1 a 2 meses. Las evaluaciones técnicas son más especializadas y el assessment center requiere práctica.\n\n' +
      '• Concursos de oposición docente (USICAMM): De 2 a 3 meses. Los exámenes cubren conocimientos pedagógicos, disciplinares y del marco normativo educativo.\n\n' +
      '• Poder Judicial: De 3 a 6 meses o más. Los concursos de oposición para jueces y magistrados son los más demandantes, con exámenes teóricos, prácticos y orales.\n\n' +
      '• SAT y organismos fiscales: De 1 a 2 meses en temas tributarios, contables y legales.\n\n' +
      'Recomendamos crear un plan de estudio diario de al menos 1 a 2 horas, usar los quizzes de PlazaYa para practicar, y estudiar los temarios oficiales de cada convocatoria.',
  },
  {
    id: 4,
    pregunta: '¿Cuáles convocatorias pagan mejor?',
    respuesta:
      'Los salarios en el gobierno mexicano varían ampliamente según la institución, el nivel del puesto y la zona de adscripción. Las convocatorias mejor remuneradas suelen ser:\n\n' +
      '• Poder Judicial de la Federación: Los jueces de distrito ganan entre $90,000 y $130,000 MXN mensuales brutos. Los secretarios de juzgado entre $50,000 y $70,000 MXN.\n\n' +
      '• Banco de México (Banxico): Puestos técnicos y analistas con salarios de $40,000 a $80,000 MXN mensuales, más prestaciones superiores.\n\n' +
      '• SAT (Servicio de Administración Tributaria): Administradores y auditores con salarios de $35,000 a $70,000 MXN, más estímulos por productividad.\n\n' +
      '• INE (Instituto Nacional Electoral): Puestos del Servicio Profesional Electoral con salarios competitivos de $30,000 a $60,000 MXN.\n\n' +
      '• INEGI: Puestos técnicos y de investigación con salarios de $25,000 a $55,000 MXN.\n\n' +
      '• SPC Federal (Directores de Área y superiores): De $50,000 a $100,000+ MXN mensuales.\n\n' +
      'Nota: Además del salario base, los empleados del gobierno federal reciben prestaciones como aguinaldo de 40 días, seguro de gastos médicos mayores, fondo de ahorro, y seguridad social (ISSSTE).',
  },
  {
    id: 5,
    pregunta: '¿Qué son las evaluaciones de ingreso?',
    respuesta:
      'Las evaluaciones de ingreso son los exámenes y pruebas que debes aprobar para obtener una plaza pública. Los tipos más comunes son:\n\n' +
      '• Evaluaciones gerenciales: Miden habilidades como liderazgo, trabajo en equipo, orientación a resultados y negociación. Se aplican en el SPC y usan herramientas estandarizadas.\n\n' +
      '• Evaluaciones técnicas: Exámenes de conocimientos específicos del puesto. Cada dependencia diseña los suyos con base en el temario publicado en la convocatoria.\n\n' +
      '• Evaluación de aptitud para el servicio público: Mide valores como ética, integridad y compromiso institucional.\n\n' +
      '• Assessment center: Simulación de casos prácticos donde se evalúa la toma de decisiones. Se usa para puestos de subdirector en adelante.\n\n' +
      '• Exámenes de oposición: Pruebas teóricas y prácticas usadas en el Poder Judicial y USICAMM. Pueden incluir elaboración de sentencias o proyectos.\n\n' +
      '• Evaluación de experiencia y mérito: Revisión documental de tu trayectoria profesional, certificaciones, publicaciones y antigüedad.\n\n' +
      '• Entrevista: El Comité Técnico de Selección entrevista a los finalistas. Es la etapa final del proceso del SPC.',
  },
  {
    id: 6,
    pregunta: '¿Cómo elegir la convocatoria correcta para mí?',
    respuesta:
      'Elegir bien tu convocatoria es clave para aumentar tus probabilidades de éxito. Considera estos factores:\n\n' +
      '• Tu formación académica: Cada puesto tiene requisitos de escolaridad. Revisa que tu título o cédula profesional corresponda al área solicitada.\n\n' +
      '• Experiencia laboral: Muchos puestos requieren años de experiencia en áreas específicas. Los puestos de enlace generalmente no piden experiencia.\n\n' +
      '• Ubicación geográfica: Las plazas pueden estar en CDMX o en cualquier estado. Verifica si estás dispuesto a reubicarte.\n\n' +
      '• Nivel salarial vs. competencia: Los puestos mejor pagados tienen más aspirantes. Comenzar por un nivel inferior puede ser una estrategia más efectiva para ingresar al sistema.\n\n' +
      '• Tipo de institución: ¿Prefieres estabilidad (Poder Judicial), impacto social (educación), o desarrollo técnico (Banxico, INEGI)?\n\n' +
      '• Tus fortalezas: Si eres bueno en exámenes teóricos, los concursos de oposición son ideales. Si destacas en habilidades interpersonales, el SPC con su assessment center puede favorecerte.\n\n' +
      'En PlazaYa puedes filtrar convocatorias por área, nivel, salario y ubicación para encontrar las que mejor se ajusten a tu perfil.',
  },
  {
    id: 7,
    pregunta: '¿Necesito un curso preparatorio?',
    respuesta:
      'No es obligatorio, pero una buena preparación aumenta significativamente tus posibilidades de éxito. Aquí tus opciones:\n\n' +
      '• Autoestudio con temarios oficiales: Cada convocatoria publica sus temarios y bibliografía. Estudiar directamente de estas fuentes es gratuito y efectivo.\n\n' +
      '• PlazaYa: Nuestra app ofrece quizzes de práctica basados en temas reales de convocatorias, para que practiques desde tu celular en cualquier momento.\n\n' +
      '• Cursos en línea especializados: Existen plataformas que ofrecen preparación para evaluaciones gerenciales del SPC, concursos de oposición judicial y exámenes docentes.\n\n' +
      '• Grupos de estudio: Muchos aspirantes forman grupos en redes sociales para compartir materiales, experiencias y motivarse mutuamente.\n\n' +
      '• Cursos presenciales: Algunas academias ofrecen preparación intensiva, especialmente para concursos del Poder Judicial y USICAMM. Pueden ser costosos ($5,000 a $20,000 MXN).\n\n' +
      'Nuestra recomendación: Comienza con el autoestudio y los quizzes de PlazaYa. Si sientes que necesitas más estructura, complementa con un curso específico para el tipo de evaluación que presentarás.',
  },
  {
    id: 8,
    pregunta: '¿Qué es la estabilidad laboral en el servicio público?',
    respuesta:
      'La estabilidad laboral es una de las mayores ventajas de trabajar en el gobierno. Esto es lo que debes saber:\n\n' +
      '• Nombramiento: Al ganar un concurso, recibes un nombramiento que te protege legalmente. En el SPC, los nombramientos pueden ser titulares (permanentes) o eventuales.\n\n' +
      '• Inamovilidad: En el Poder Judicial, después de cierto tiempo y evaluaciones, los servidores públicos pueden obtener inamovilidad, lo que significa que no pueden ser removidos sin causa justificada.\n\n' +
      '• Prestaciones garantizadas: ISSSTE (seguridad social), aguinaldo de 40 días, prima vacacional, fondo de ahorro, seguro de vida y, en muchas dependencias, seguro de gastos médicos mayores.\n\n' +
      '• Pensión: Los trabajadores del gobierno cotizan en el ISSSTE y tienen derecho a pensión por jubilación, lo que brinda seguridad financiera a largo plazo.\n\n' +
      '• Desarrollo profesional: El SPC ofrece capacitación continua y la posibilidad de ascender a puestos de mayor nivel mediante concursos internos.\n\n' +
      '• Protección legal: Los trabajadores del gobierno están protegidos por la Ley Federal de los Trabajadores al Servicio del Estado, que establece derechos laborales específicos.\n\n' +
      'En tiempos de incertidumbre económica, el servicio público ofrece una estabilidad que pocos empleos en el sector privado pueden igualar.',
  },
];

export default function PreguntasFrecuentesScreen() {
  const [expandida, setExpandida] = useState(null);
  const { voltar: voltarComAd } = useVoltarComAdENPS();

  const togglePregunta = (id) => {
    setExpandida(expandida === id ? null : id);
  };

  return (
    <SafeAreaView style={estilos.container}>
      <StatusBar barStyle="light-content" backgroundColor={CORES.primary} />

      {/* Encabezado */}
      <View style={estilos.header}>
        <TouchableOpacity onPress={voltarComAd} style={estilos.botonVolver}>
          <Text style={{ fontSize: 20, color: '#fff' }}>← </Text>
        </TouchableOpacity>
        <Text style={estilos.headerTitulo}>Preguntas Frecuentes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={estilos.scrollView}
        contentContainerStyle={estilos.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introducción */}
        <View style={estilos.introContainer}>
          <Text style={{ fontSize: 36 }}>❓</Text>
          <Text style={estilos.introTitulo}>
            Todo lo que necesitas saber sobre empleo público en México
          </Text>
          <Text style={estilos.introTexto}>
            Resolvemos las dudas más comunes sobre convocatorias, evaluaciones y
            el proceso de ingreso al servicio público mexicano.
          </Text>
        </View>

        {/* Lista de preguntas */}
        {PREGUNTAS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              estilos.preguntaCard,
              expandida === item.id && estilos.preguntaCardActiva,
            ]}
            onPress={() => togglePregunta(item.id)}
            activeOpacity={0.7}
          >
            <View style={estilos.preguntaHeader}>
              <View style={estilos.preguntaNumero}>
                <Text style={estilos.preguntaNumeroTexto}>{item.id}</Text>
              </View>
              <Text style={estilos.preguntaTexto}>{item.pregunta}</Text>
              <Text style={{ fontSize: 14, color: CORES.primary }}>{expandida === item.id ? '▲' : '▼'}</Text>
            </View>

            {expandida === item.id && (
              <View style={estilos.respuestaContainer}>
                <View style={estilos.separador} />
                <Text style={estilos.respuestaTexto}>{item.respuesta}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* CTA final */}
        <View style={estilos.ctaContainer}>
          <Text style={estilos.ctaTitulo}>¿Tienes otra duda?</Text>
          <Text style={estilos.ctaTexto}>
            Escríbenos a soporte@plazaya.com.mx y te responderemos lo antes
            posible.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.background,
  },
  header: {
    backgroundColor: CORES.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  botonVolver: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  introContainer: {
    backgroundColor: CORES.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: CORES.border,
  },
  introTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: CORES.text,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  introTexto: {
    fontSize: 14,
    color: CORES.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  preguntaCard: {
    backgroundColor: CORES.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CORES.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  preguntaCardActiva: {
    borderColor: CORES.primary,
    borderWidth: 1.5,
  },
  preguntaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preguntaNumero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CORES.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  preguntaNumeroTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: CORES.primary,
  },
  preguntaTexto: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: CORES.text,
    marginRight: 8,
  },
  respuestaContainer: {
    marginTop: 12,
  },
  separador: {
    height: 1,
    backgroundColor: CORES.border,
    marginBottom: 12,
  },
  respuestaTexto: {
    fontSize: 14,
    color: CORES.textSecondary,
    lineHeight: 22,
  },
  ctaContainer: {
    backgroundColor: CORES.accent,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: CORES.primary,
  },
  ctaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: CORES.primary,
    marginBottom: 8,
  },
  ctaTexto: {
    fontSize: 14,
    color: CORES.primaryDark,
    textAlign: 'center',
    lineHeight: 20,
  },
});

import { useState, useRef, useEffect } from "react";

const NAVY = "#1A1F5E";
const NAVY_DK = "#0E1240";
const EMERALD = "#00C896";
const SLATE = "#8B94C8";
const CREAM = "#F5F4F0";
const ORANGE = "#E8833A";
const WHITE = "#FFFFFF";

const PAISES_LATAM = [
  "Argentina","Bolivia","Brasil","Chile","Colombia","Costa Rica","Cuba","Ecuador",
  "El Salvador","Guatemala","Honduras","México","Nicaragua","Panamá","Paraguay",
  "Perú","Puerto Rico","República Dominicana","Uruguay","Venezuela",
  "——————","Resto del mundo"
];

const ETAPAS_DATA = [
  {
    id:"descubrimiento", name:"Descubrimiento", num:1, emoji:"🔭",
    resumen:"El aspirante todavía no te conoce. Está buscando opciones en Google, redes sociales o le pregunta a alguien de confianza.",
    contexto:"Evaluamos si tu universidad aparece en ese momento, si lo que ve le genera ganas de saber más, y si hay un paso siguiente claro para avanzar.",
    preguntas:[
      {
        texto:"¿Cómo llega la mayoría de tus aspirantes a conocer tu universidad, y qué tan activa es tu presencia en los canales donde están buscando — tanto los que ya conocés como los que todavía no aprovechás (publicidad digital, embajadores, alianzas con colegios o empresas)?",
        opciones:[
          {letra:"A",texto:"Nos llegan principalmente por recomendación espontánea o ferias. No invertimos en publicidad digital ni tenemos alianzas o embajadores activos. No sabemos bien de dónde viene cada aspirante.",valor:1},
          {letra:"B",texto:"Hacemos algo de publicidad digital en temporada, tenemos alguna alianza con colegios y algunos estudiantes recomiendan, pero cada acción funciona por separado y sin coordinación ni medición.",valor:2},
          {letra:"C",texto:"Combinamos canales propios, pauta digital planificada y alianzas o embajadores activos. Sabemos cuáles son nuestros canales principales y los gestionamos con responsables definidos.",valor:4},
          {letra:"D",texto:"Operamos una estrategia integrada: pauta optimizada por datos, red de alianzas y embajadores con métricas propias, y trazabilidad completa de qué canal, campaña o referido generó cada aspirante.",valor:5},
        ]
      },
      {
        texto:"¿Tu universidad trabaja activamente para aparecer cuando alguien busca opciones educativas en Google, YouTube, o le pregunta a una inteligencia artificial como ChatGPT o Gemini?",
        opciones:[
          {letra:"A",texto:"Tenemos un sitio web, pero nadie trabaja el posicionamiento en buscadores ni nos preocupa cómo aparecemos en respuestas de IA.",valor:1},
          {letra:"B",texto:"Hacemos algo de SEO básico, pero no hay estrategia definida ni medimos si estamos apareciendo donde nuestros aspirantes realmente buscan.",valor:2},
          {letra:"C",texto:"Tenemos una estrategia activa de SEO con contenidos planificados, palabras clave definidas y seguimiento de posicionamiento en buscadores.",valor:4},
          {letra:"D",texto:"Además del SEO trabajamos el GEO (posicionamiento en respuestas de IA) y medimos nuestra visibilidad en ambos entornos para capturar al aspirante antes de que llegue a la competencia.",valor:5},
        ]
      },
      {
        texto:"¿Tu universidad sabe con precisión de dónde viene cada aspirante que llega a consultar o inscribirse, y usa esa información para mejorar sus canales?",
        opciones:[
          {letra:"A",texto:"No tenemos esa información de forma sistemática. A veces preguntamos pero no lo registramos ni lo analizamos.",valor:1},
          {letra:"B",texto:"Tenemos una pregunta de '¿cómo nos conociste?' en algún formulario, pero los datos quedan dispersos y nadie los usa para tomar decisiones.",valor:2},
          {letra:"C",texto:"Registramos el origen de cada aspirante en un sistema centralizado y usamos esa información para ajustar la inversión en canales.",valor:4},
          {letra:"D",texto:"Contamos con trazabilidad completa desde el primer contacto hasta la inscripción: qué canal, qué campaña, qué embajador o alianza generó cada aspirante, y optimizamos en base a eso.",valor:5},
        ]
      },
      {
        texto:"Cuando un aspirante te encuentra en redes, buscadores o cualquier canal, ¿hay un paso siguiente claro, fácil y específico que lo invite a avanzar?",
        opciones:[
          {letra:"A",texto:"No hay una llamada a la acción clara. El aspirante llega a un perfil o página y tiene que descubrir por su cuenta qué hacer después.",valor:1},
          {letra:"B",texto:"Hay botones genéricos ('conocé más', 'contactanos'), pero no están diseñados según el canal ni el perfil del aspirante, y no medimos cuántos hacen clic.",valor:2},
          {letra:"C",texto:"Cada canal tiene una llamada a la acción definida que lleva a un paso concreto: completar un formulario, ver un programa específico o agendar una charla.",valor:4},
          {letra:"D",texto:"Las llamadas a la acción están personalizadas por canal y perfil, con destinos específicos y seguimiento de cuántos aspirantes avanzan desde cada punto de contacto.",valor:5},
        ]
      },
    ]
  },
  {
    id:"exploracion", name:"Exploración", num:2, emoji:"🔎",
    resumen:"El aspirante ya sabe que existís y empieza a investigarte. Entra a tu web, mira tus redes, busca opiniones, compara con otras opciones.",
    contexto:"Evaluamos si lo que encuentra le ayuda a decidir, si puede compararte con otras opciones, y si hay algo que lo oriente activamente hacia el siguiente paso.",
    preguntas:[
      {
        texto:"¿Qué tan fácil es para un aspirante entender qué programas ofrecés, a quién están dirigidos, qué los diferencia de otras instituciones, y comparar opciones dentro de tu propia oferta?",
        opciones:[
          {letra:"A",texto:"La información existe pero está dispersa o es técnica. No hay forma de comparar programas y el diferencial institucional no está claro.",valor:1},
          {letra:"B",texto:"Tenemos descripciones de cada programa, pero son similares entre sí y no explican con claridad por qué elegir uno u otro ni por qué elegirnos a nosotros.",valor:2},
          {letra:"C",texto:"Cada programa tiene una página clara con duración, modalidad, salida laboral y diferencial. El aspirante puede entender la oferta sin necesidad de consultar.",valor:4},
          {letra:"D",texto:"La oferta está segmentada por perfil de aspirante y tiene herramientas interactivas para comparar programas, con información actualizada y relevante para tomar una decisión.",valor:5},
        ]
      },
      {
        texto:"Cuando un aspirante llega a tu sitio web o redes para investigarte, ¿qué tan buena es la experiencia — incluyendo cómo estás presente en los lugares donde los aspirantes comparan opciones, como Google, portales educativos o foros?",
        opciones:[
          {letra:"A",texto:"El sitio tiene mucha información pero es difícil de navegar. No monitoreamos reseñas ni estamos presentes en espacios de comparación.",valor:1},
          {letra:"B",texto:"Tenemos un sitio funcional y algo de presencia en portales, pero no hay landings específicas por programa ni gestionamos activamente lo que dicen de nosotros en espacios externos.",valor:2},
          {letra:"C",texto:"Contamos con landings por programa, gestionamos nuestro perfil en Google y portales educativos, y respondemos reseñas. La experiencia digital está pensada para el aspirante.",valor:4},
          {letra:"D",texto:"La experiencia digital es integral: landings optimizadas, reputación activamente gestionada en todos los canales de comparación, y posicionamiento en respuestas de IA donde los aspirantes consultan.",valor:5},
        ]
      },
      {
        texto:"¿Tu universidad muestra evidencia concreta — testimonios reales, datos de inserción laboral, rankings, casos de egresados — que ayude al aspirante a confiar en que es una buena decisión estudiar ahí?",
        opciones:[
          {letra:"A",texto:"No contamos con testimonios actualizados ni datos de empleabilidad. La credibilidad descansa en la trayectoria o el nombre de la institución.",valor:1},
          {letra:"B",texto:"Tenemos algunos testimonios, pero son genéricos o están desactualizados, y no están ubicados donde el aspirante toma decisiones.",valor:2},
          {letra:"C",texto:"Mostramos testimonios reales y datos de inserción laboral en las páginas de los programas, de forma actualizada y verificable.",valor:4},
          {letra:"D",texto:"Tenemos una estrategia activa de prueba social: casos de éxito por carrera, datos de empleabilidad verificables, eventos presenciales y virtuales para aspirantes, y reseñas en todos los espacios de comparación.",valor:5},
        ]
      },
      {
        texto:"Mientras un aspirante navega tu sitio, redes o materiales, ¿hay algo que lo oriente activamente hacia dar el próximo paso, o lo dejás explorar solo?",
        opciones:[
          {letra:"A",texto:"No hay ninguna guía activa. El aspirante navega solo y si no encuentra lo que busca, se va sin dejar rastro.",valor:1},
          {letra:"B",texto:"Hay elementos de navegación básicos, pero no están diseñados para guiar al aspirante hacia una acción concreta ni para capturar su interés.",valor:2},
          {letra:"C",texto:"Contamos con chat de consulta visible, botones de contacto en páginas clave y formularios de interés que orientan al aspirante hacia el siguiente paso.",valor:4},
          {letra:"D",texto:"La experiencia tiene guía activa e inteligente: el sistema detecta el comportamiento del aspirante y le ofrece el paso más relevante según su recorrido y perfil.",valor:5},
        ]
      },
    ]
  },
  {
    id:"activacion", name:"Activación", num:3, emoji:"⚡",
    resumen:"El aspirante da el primer paso: escribe, llama, completa un formulario. Este es el momento más crítico de todo el proceso.",
    contexto:"Si no hay respuesta rápida, relevante y que genere motivación, el interés se enfría en minutos y el aspirante elige otra opción. Evaluamos si tu universidad está lista para ese momento.",
    preguntas:[
      {
        texto:"¿Qué tan fácil es para un aspirante contactarte — desde cualquier dispositivo y por el canal que él prefiera — y cuántos canales activos y gestionados tenés disponibles?",
        opciones:[
          {letra:"A",texto:"Solo tenemos formulario web y teléfono, no siempre activos fuera del horario de oficina. El proceso no está pensado para quien llega desde el celular.",valor:1},
          {letra:"B",texto:"Tenemos formulario, correo y algún canal adicional, pero no todos están activos de forma consistente ni son fáciles de encontrar desde redes sociales.",valor:2},
          {letra:"C",texto:"Ofrecemos al menos tres canales activos y visibles (WhatsApp, formulario, teléfono o chat), con confirmación inmediata de que el mensaje fue recibido.",valor:4},
          {letra:"D",texto:"El primer contacto es fluido desde cualquier canal o dispositivo. Todos los canales están integrados en un mismo sistema y tienen tiempos de respuesta garantizados.",valor:5},
        ]
      },
      {
        texto:"Cuando un aspirante hace una consulta o deja sus datos, ¿cuánto tarda tu universidad en responderle, y esa respuesta llega por el canal que él usó?",
        opciones:[
          {letra:"A",texto:"La respuesta puede tardar horas o días, depende de quién esté disponible. No hay protocolo de tiempos ni seguimiento de consultas sin respuesta.",valor:1},
          {letra:"B",texto:"Intentamos responder el mismo día, pero los tiempos varían según el canal, la carga del equipo o el horario en que llegó la consulta.",valor:2},
          {letra:"C",texto:"Tenemos tiempos máximos de respuesta definidos por canal (ej: menos de 2 horas por WhatsApp) y un protocolo que se cumple de forma consistente.",valor:4},
          {letra:"D",texto:"La primera respuesta es inmediata o en minutos, con automatización que activa el contacto al instante y deriva a un asesor cuando la consulta lo requiere.",valor:5},
        ]
      },
      {
        texto:"Cuando tu universidad responde el primer contacto, ¿qué tan relevante, personalizada y motivadora es esa respuesta — en relación al programa consultado y al perfil del aspirante?",
        opciones:[
          {letra:"A",texto:"La respuesta es un mensaje genérico o un PDF con toda la oferta, sin importar qué preguntó el aspirante ni qué programa consultó.",valor:1},
          {letra:"B",texto:"La respuesta intenta ser relevante, pero depende del criterio de quien responde. No hay guía ni plantilla por programa ni componente que genere entusiasmo.",valor:2},
          {letra:"C",texto:"Contamos con plantillas de respuesta por programa que incluyen el programa consultado, un elemento motivacional y un paso siguiente concreto.",valor:4},
          {letra:"D",texto:"La primera respuesta está automatizada y personalizada por programa y canal: celebra el contacto, genera anticipación y activa inmediatamente el deseo de continuar.",valor:5},
        ]
      },
      {
        texto:"Cuando un aspirante se contacta por primera vez, ¿ese contacto queda registrado en un sistema que permite hacer seguimiento, ver el historial y garantizar que nadie se pierda?",
        opciones:[
          {letra:"A",texto:"Los contactos llegan a distintos lugares (bandeja de correo, celular del asesor, planilla) y no hay un sistema centralizado ni forma de saber si alguien no fue respondido.",valor:1},
          {letra:"B",texto:"Registramos contactos en alguna herramienta, pero el registro no es completo ni sistemático — depende de que cada asesor lo cargue manualmente.",valor:2},
          {letra:"C",texto:"Contamos con un CRM o sistema centralizado donde se registra cada contacto con sus datos, el programa de interés, el canal de origen y el estado del seguimiento.",valor:4},
          {letra:"D",texto:"Cada contacto se registra automáticamente con historial completo de interacciones, canal, programa y estado. Ningún aspirante puede perderse sin que el sistema genere una alerta.",valor:5},
        ]
      },
    ]
  },
  {
    id:"acompanamiento", name:"Acompañamiento", num:4, emoji:"🧭",
    resumen:"Entre el primer contacto y la decisión puede pasar mucho tiempo. El aspirante sigue comparando, duda, consulta con su familia.",
    contexto:"Evaluamos si tu universidad lo sostiene durante ese proceso con contenido relevante y personalizado, o lo deja solo hasta que decide — o se va.",
    preguntas:[
      {
        texto:"Después del primer contacto, ¿tu universidad tiene una secuencia de seguimiento definida — con cadencia, contenido y canales planificados — o el seguimiento depende de la iniciativa de cada asesor?",
        opciones:[
          {letra:"A",texto:"No hay proceso definido. Si el aspirante no vuelve a escribir, no se lo contacta. El seguimiento depende de que el asesor se acuerde.",valor:1},
          {letra:"B",texto:"Hay una práctica general de hacer uno o dos contactos adicionales, pero sin secuencia, sin contenido planificado y sin criterio de cuándo insistir o dejar de contactar.",valor:2},
          {letra:"C",texto:"Contamos con una secuencia de seguimiento definida: se sabe cuántos contactos hacer, en qué momento, por qué canal y con qué contenido en cada paso.",valor:4},
          {letra:"D",texto:"El seguimiento está automatizado y se adapta según el comportamiento del aspirante: si abrió un correo, visitó una página o no respondió, el sistema ajusta el próximo contacto.",valor:5},
        ]
      },
      {
        texto:"¿Qué recibe el aspirante durante el período de acompañamiento: información útil y progresiva para avanzar en su decisión, o mensajes genéricos que no aportan nada nuevo?",
        opciones:[
          {letra:"A",texto:"Recibe mensajes del tipo '¿pudiste revisar la información?' o 'las inscripciones están abiertas', sin contenido que lo ayude a decidir ni que reactive su interés.",valor:1},
          {letra:"B",texto:"Recibe algo de información sobre el programa de interés, pero los mensajes son iguales para todos sin importar en qué momento del proceso están ni si ya se enfrió.",valor:2},
          {letra:"C",texto:"Los mensajes incluyen contenido relevante según el programa y el momento: testimonios, fechas clave, becas, respuestas a dudas frecuentes y argumentos nuevos para quien se enfrió.",valor:4},
          {letra:"D",texto:"El contenido se adapta según el perfil, el momento del proceso y el comportamiento previo. Quien se enfrió recibe algo distinto a quien sigue activo.",valor:5},
        ]
      },
      {
        texto:"¿El acompañamiento que recibe un joven de primer ingreso es diferente al que recibe un adulto que trabaja o un profesional que busca un posgrado?",
        opciones:[
          {letra:"A",texto:"No. Todos los aspirantes reciben el mismo proceso y los mismos mensajes, sin importar su perfil, programa o situación personal.",valor:1},
          {letra:"B",texto:"Los asesores intentan adaptar el tono según la conversación, pero por intuición propia. No hay materiales ni protocolos diferenciados por tipo de aspirante.",valor:2},
          {letra:"C",texto:"Tenemos al menos dos perfiles de acompañamiento diferenciados — como ingreso directo vs adulto que trabaja — con mensajes y argumentos distintos para cada uno.",valor:4},
          {letra:"D",texto:"El acompañamiento está segmentado por perfil, programa y momento del proceso, con rutas de comunicación distintas que se activan de forma automática.",valor:5},
        ]
      },
      {
        texto:"¿Los asesores que acompañan a los aspirantes tienen herramientas, métricas y supervisión para hacer bien su trabajo — y existe algún mecanismo para detectar y reactivar a quienes dejan de responder?",
        opciones:[
          {letra:"A",texto:"Cada asesor trabaja a su manera, sin herramientas compartidas, sin métricas y sin supervisión. Si un aspirante se enfría, simplemente desaparece sin que nadie lo note.",valor:1},
          {letra:"B",texto:"Hay reuniones periódicas y alguna herramienta básica, pero no hay métricas claras por asesor ni un proceso para detectar y reactivar aspirantes que dejan de responder.",valor:2},
          {letra:"C",texto:"Los asesores trabajan con un sistema centralizado y metas definidas. Hay un protocolo de reactivación para aspirantes inactivos con contenido diferente al habitual.",valor:4},
          {letra:"D",texto:"El equipo opera con dashboards en tiempo real, metas individuales y grupales, y un sistema que detecta automáticamente cuando un aspirante se enfría y activa la reactivación.",valor:5},
        ]
      },
    ]
  },
  {
    id:"decision", name:"Decisión", num:5, emoji:"⚖️",
    resumen:"El aspirante está listo para decidir, o casi. Aparecen las dudas finales: ¿puedo pagarlo?, ¿y si me arrepiento?, ¿es mejor que la otra opción?",
    contexto:"Evaluamos si tu universidad ayuda a resolver esas dudas con información clara, argumentos de cierre y mecanismos que reduzcan el miedo a equivocarse.",
    preguntas:[
      {
        texto:"¿El aspirante puede conocer con claridad el costo del programa, las formas de pago, las opciones de becas y los diferenciales frente a otras instituciones — sin tener que preguntar y esperar?",
        opciones:[
          {letra:"A",texto:"El costo no está publicado y los diferenciales no están sistematizados. Para saber cualquiera de las dos cosas, el aspirante tiene que consultar y esperar días.",valor:1},
          {letra:"B",texto:"El costo general está disponible, pero las condiciones de pago, becas y los argumentos frente a la competencia requieren una consulta adicional y no siempre se responden con claridad.",valor:2},
          {letra:"C",texto:"El costo, las cuotas, las becas y los principales diferenciales frente a otras opciones están publicados de forma clara. El aspirante puede comparar sin necesidad de contactar.",valor:4},
          {letra:"D",texto:"El aspirante puede simular costos, calcular cuotas y conocer los diferenciales con análisis actualizado de la competencia, de forma autónoma y desde cualquier dispositivo.",valor:5},
        ]
      },
      {
        texto:"¿Tu universidad ofrece algún mecanismo concreto que reduzca el miedo del aspirante a equivocarse en su decisión — como garantías, pruebas gratuitas, opciones de cambio o testimonios de perfiles similares?",
        opciones:[
          {letra:"A",texto:"No hay ningún mecanismo formal. El aspirante decide asumiendo toda la incertidumbre y el riesgo por su cuenta.",valor:1},
          {letra:"B",texto:"Se mencionan informalmente algunas flexibilidades o garantías, pero no están comunicadas de forma clara ni forman parte del proceso de cierre.",valor:2},
          {letra:"C",texto:"Contamos con mecanismos concretos y comunicados: clases de prueba, período de adaptación, opciones de cambio de programa o testimonios de egresados con perfiles similares.",valor:4},
          {letra:"D",texto:"La reducción del riesgo es parte activa de la estrategia de cierre: cada perfil recibe argumentos y garantías específicas respaldados por datos reales de experiencia de estudiantes anteriores.",valor:5},
        ]
      },
      {
        texto:"Una vez que el aspirante decide inscribirse, ¿sabe exactamente qué tiene que hacer, en qué plazo y con qué documentos — o tiene que preguntarlo?",
        opciones:[
          {letra:"A",texto:"El proceso siguiente no está claro. El aspirante tiene que preguntar qué hacer después de decidir y las respuestas no siempre son consistentes entre asesores.",valor:1},
          {letra:"B",texto:"El asesor explica los pasos en la conversación, pero no hay un material de apoyo claro que el aspirante pueda consultar después por su cuenta.",valor:2},
          {letra:"C",texto:"Existe un resumen claro del proceso de inscripción — pasos, documentos, plazos, fecha de inicio — que se comparte en el momento en que el aspirante manifiesta su decisión.",valor:4},
          {letra:"D",texto:"El aspirante recibe automáticamente un resumen personalizado del proceso según su programa y modalidad, con recordatorios de cada paso hasta completar la inscripción.",valor:5},
        ]
      },
      {
        texto:"¿Tu universidad tiene un proceso diferenciado para el aspirante que está listo para inscribirse hoy y para el que necesita más tiempo o quiere hacerlo en el próximo ciclo?",
        opciones:[
          {letra:"A",texto:"Si el aspirante no se inscribe en el momento, se lo da por perdido. No hay proceso para mantener el vínculo con quienes difieren su decisión.",valor:1},
          {letra:"B",texto:"Algunos asesores hacen seguimiento esporádico de aspirantes que no se inscribieron, pero sin proceso sistematizado ni criterio de cuándo y cómo retomarlos.",valor:2},
          {letra:"C",texto:"Tenemos un proceso diferenciado para aspirantes con decisión diferida: se los clasifica, se mantiene contacto espaciado con contenido útil y se los reactiva antes del próximo período.",valor:4},
          {letra:"D",texto:"Los aspirantes diferidos entran a una ruta de largo plazo con mensajes adaptados a su momento y reactivación automática antes de cada nuevo ciclo, retomando desde donde quedó la conversación.",valor:5},
        ]
      },
    ]
  },
  {
    id:"inscripcion", name:"Inscripción", num:6, emoji:"📝",
    resumen:"El aspirante ya decidió. Ahora tiene que completar el trámite. Este es el momento más paradójico: la decisión está tomada, pero la burocracia puede tirar todo abajo.",
    contexto:"Evaluamos si el proceso está diseñado para ser fácil y claro, o si las fricciones administrativas hacen caer una decisión que ya estaba tomada.",
    preguntas:[
      {
        texto:"¿Cuántos pasos requiere inscribirse, qué tan digitalizados están, y puede el aspirante completar todo desde su celular o computadora sin necesidad de ir de forma presencial ni imprimir documentos?",
        opciones:[
          {letra:"A",texto:"El proceso tiene muchos pasos, requiere documentación extensa y al menos una instancia presencial sin alternativa digital.",valor:1},
          {letra:"B",texto:"La mayoría es digital, pero hay al menos un paso que requiere presencia física, impresión de documentos o validación manual que no puede hacerse de otra forma.",valor:2},
          {letra:"C",texto:"El proceso es mayormente digital y se puede completar desde cualquier dispositivo. Solo quedan excepciones puntuales justificadas.",valor:4},
          {letra:"D",texto:"Inscribirse es 100% digital desde cualquier dispositivo, con carga de documentos en línea, validación automática y confirmación inmediata de cada paso.",valor:5},
        ]
      },
      {
        texto:"Durante la inscripción, ¿el aspirante sabe en todo momento en qué paso está, qué le falta completar, cuánto tiempo tiene para hacerlo, y qué pasó con su trámite una vez que lo envió?",
        opciones:[
          {letra:"A",texto:"No hay visibilidad del estado. El aspirante tiene que llamar o escribir para saber si su trámite avanzó o si falta algo.",valor:1},
          {letra:"B",texto:"Recibe alguna notificación por correo, pero no hay una vista clara del estado del proceso ni alertas cuando hay algo pendiente o cuando los plazos se acercan.",valor:2},
          {letra:"C",texto:"El aspirante puede consultar el estado de su inscripción y recibe notificaciones cuando hay algo pendiente o cuando se completa un paso. Los tiempos de procesamiento están comunicados.",valor:4},
          {letra:"D",texto:"Trazabilidad completa en tiempo real: el aspirante ve exactamente en qué paso está, qué falta y recibe recordatorios automáticos antes de que venzan los plazos.",valor:5},
        ]
      },
      {
        texto:"Si el aspirante tiene un problema durante la inscripción — un error, un documento rechazado, una duda de último momento — ¿tiene a quién recurrir de forma rápida y efectiva?",
        opciones:[
          {letra:"A",texto:"No hay canal específico de soporte. El aspirante tiene que llamar al número general, esperar que lo deriven, y el equipo no siempre tiene la información para resolver.",valor:1},
          {letra:"B",texto:"Hay un canal de soporte disponible, pero los tiempos son lentos o el equipo no siempre puede resolver los problemas más frecuentes del proceso.",valor:2},
          {letra:"C",texto:"Contamos con un canal dedicado para inscripciones con tiempos de respuesta rápidos y personas capacitadas. El sistema detecta cuando alguien lleva tiempo sin avanzar.",valor:4},
          {letra:"D",texto:"El soporte es proactivo: el sistema detecta cuando un aspirante lleva tiempo sin avanzar y lo contacta antes de que abandone. Ningún aspirante queda trabado sin intervención.",valor:5},
        ]
      },
      {
        texto:"Durante el proceso de inscripción, ¿tu universidad hace algo para que el aspirante sienta que está tomando la mejor decisión de su vida, o el trámite es puramente administrativo y burocrático?",
        opciones:[
          {letra:"A",texto:"El proceso es 100% administrativo. No hay ningún mensaje, gesto ni contenido que refuerce la decisión o genere anticipación positiva por lo que viene.",valor:1},
          {letra:"B",texto:"Hay algún mensaje de bienvenida al inicio, pero desaparece rápido y el resto es puro trámite sin elementos que sostengan el entusiasmo.",valor:2},
          {letra:"C",texto:"Durante el proceso incluimos al menos un elemento que refuerza la decisión: un mensaje motivador, un testimonio o una vista previa de lo que viene después.",valor:4},
          {letra:"D",texto:"La experiencia de inscripción está diseñada para ser eficiente y emocionalmente positiva: cada paso celebra el avance y construye anticipación hacia el inicio.",valor:5},
        ]
      },
    ]
  },
  {
    id:"retencion", name:"Retención temprana", num:7, emoji:"🌱",
    resumen:"El estudiante ya se inscribió pero aún no empezó. Entre la inscripción y el primer día, muchos se arrepienten o simplemente no aparecen.",
    contexto:"Es la etapa más crítica y la menos atendida. Evaluamos si tu universidad acompaña ese período con intención o desaparece después de recibir el pago.",
    preguntas:[
      {
        texto:"¿Qué hace tu universidad en las horas y días inmediatos después de confirmar una inscripción — y esa respuesta incluye algo que celebre la decisión y genere anticipación por lo que viene?",
        opciones:[
          {letra:"A",texto:"Después de confirmar la inscripción hay silencio. El estudiante recibe quizás un correo de confirmación técnico y nada más hasta que empieza el ciclo.",valor:1},
          {letra:"B",texto:"Enviamos un correo de bienvenida genérico, pero no hay secuencia planificada ni ningún gesto que refuerce que tomaron la mejor decisión.",valor:2},
          {letra:"C",texto:"Contamos con una comunicación de bienvenida personalizada por programa que se envía de forma inmediata, celebra la decisión y anticipa los próximos pasos con entusiasmo.",valor:4},
          {letra:"D",texto:"La bienvenida es una experiencia diseñada: mensaje personalizado, presentación del equipo docente, acceso anticipado a la plataforma y un contacto humano que refuerza el vínculo antes del primer día.",valor:5},
        ]
      },
      {
        texto:"Entre la inscripción y el primer día de clases, ¿el estudiante recibe información clara, progresiva y útil sobre todo lo que necesita saber para arrancar con confianza?",
        opciones:[
          {letra:"A",texto:"No hay comunicación estructurada pre-inicio. El estudiante tiene que buscar por su cuenta los horarios, los accesos a plataformas o los materiales necesarios.",valor:1},
          {letra:"B",texto:"Enviamos uno o dos correos generales antes del inicio, pero sin secuencia planificada ni contenido diferenciado por programa, modalidad o perfil del estudiante.",valor:2},
          {letra:"C",texto:"Tenemos una secuencia de comunicaciones pre-inicio con contenido progresivo: accesos a la plataforma, presentación de docentes, horarios confirmados y respuestas a las dudas más frecuentes.",valor:4},
          {letra:"D",texto:"La comunicación pre-inicio está automatizada y personalizada por programa, modalidad y perfil. Incluye guía práctica del primer día, checklist personalizado y contacto proactivo 24 horas antes del inicio.",valor:5},
        ]
      },
      {
        texto:"¿Tu universidad tiene algún mecanismo para detectar a los estudiantes inscriptos que se están enfriando antes de que empiece el ciclo, y actuar antes de que desaparezcan?",
        opciones:[
          {letra:"A",texto:"No. Solo nos enteramos de que alguien no va a empezar cuando no aparece el primer día. No hay sistema de alerta ni seguimiento pre-inicio.",valor:1},
          {letra:"B",texto:"Algunos asesores notan cuando un inscripto no responde, pero no hay un proceso sistemático para identificar señales de riesgo ni un protocolo de acción.",valor:2},
          {letra:"C",texto:"Monitoreamos indicadores básicos de compromiso pre-inicio (apertura de correos, acceso a plataforma) y tenemos un protocolo para contactar a quienes no muestran actividad.",valor:4},
          {letra:"D",texto:"Contamos con un sistema automatizado que detecta señales de enfriamiento y activa alertas para que un asesor intervenga con argumentos preparados antes de que el estudiante desaparezca.",valor:5},
        ]
      },
      {
        texto:"¿Tu universidad le da al estudiante inscripto todo lo que necesita — de forma práctica, clara y personalizada — para llegar al primer día sin sorpresas, sin confusión y con ganas de empezar?",
        opciones:[
          {letra:"A",texto:"El estudiante tiene que descubrir por su cuenta cómo llegar, dónde ir, cómo acceder a los sistemas y qué traer. No hay preparación práctica previa al inicio.",valor:1},
          {letra:"B",texto:"Se comparte alguna información antes del inicio (horarios, link o aula), pero de forma parcial y sin anticipar las dudas más frecuentes del primer día.",valor:2},
          {letra:"C",texto:"El estudiante recibe antes del inicio todo lo necesario: accesos a plataformas, presentación de docentes, guía del primer día y un canal activo para resolver dudas de último momento.",valor:4},
          {letra:"D",texto:"La preparación pre-inicio elimina toda fricción del primer día: simulacros de acceso, video de bienvenida del docente, checklist personalizado y contacto proactivo la noche anterior.",valor:5},
        ]
      },
    ]
  },
];

const SCORE_POTENTIALS = {descubrimiento:4.3,exploracion:4.8,activacion:3.8,acompanamiento:3.6,decision:4.0,inscripcion:4.0,retencion:3.8};
const FRICCIONES = {
  descubrimiento:[{icon:"📣",texto:"Aparecés en algunos canales pero sin mensaje claro ni paso siguiente para el aspirante."},{icon:"🔍",texto:"No sabés de dónde vienen tus aspirantes, así que no podés mejorar lo que funciona."},{icon:"👥",texto:"Tenés potencial de recomendación dormido: sin sistema que active a estudiantes o egresados."}],
  exploracion:[{icon:"📄",texto:"Mucha información disponible pero dispersa y difícil de comparar con otras opciones."},{icon:"💬",texto:"Los testimonios son genéricos o viejos. No hay evidencia concreta de qué pasa después de estudiar ahí."},{icon:"🧭",texto:"El aspirante navega solo y si no encuentra lo que busca, se va sin dejar rastro."}],
  activacion:[{icon:"⏱",texto:"La respuesta tarda horas o días. Cuando llega, el aspirante ya eligió otra opción."},{icon:"📋",texto:"El formulario tiene demasiados campos y no está pensado para quien llega desde el celular."},{icon:"😐",texto:"La primera respuesta es genérica y no genera ganas de seguir. No celebra el contacto."}],
  acompanamiento:[{icon:"🔄",texto:"No hay secuencia de seguimiento. Cuando alguien deja de responder, desaparece."},{icon:"📬",texto:"El joven de primer ingreso recibe lo mismo que el profesional que busca un posgrado."},{icon:"📊",texto:"Los asesores no tienen métricas ni herramientas compartidas."}],
  decision:[{icon:"💰",texto:"El costo no está publicado. El aspirante tiene que preguntar y esperar."},{icon:"⚖️",texto:"No hay materiales que expliquen por qué elegir esta universidad sobre las otras."},{icon:"🗓",texto:"Los aspirantes que no deciden ahora se pierden. No hay proceso para mantener el vínculo."}],
  inscripcion:[{icon:"🏛",texto:"Al menos un paso requiere presencia física o impresión de documentos."},{icon:"❓",texto:"El aspirante no sabe en qué paso está ni si su trámite avanzó."},{icon:"🔇",texto:"Si hay un problema durante la inscripción, no hay canal rápido para resolverlo."}],
  retencion:[{icon:"🔕",texto:"Después de confirmar la inscripción, el silencio es total. El estudiante queda solo con sus dudas."},{icon:"👻",texto:"No hay manera de saber si un inscripto se está enfriando antes del primer día."},{icon:"🗺",texto:"El estudiante llega al primer día sin saber cómo acceder a la plataforma ni qué traer."}],
};
const RECS = {
  descubrimiento:[{texto:"Definir una acción clara por canal: qué querés que haga el aspirante cuando te encuentra.",impacto:0.5,accion:"Reduce fricción de llegada"},{texto:"Implementar seguimiento básico de origen con UTMs para saber qué canal trae más aspirantes.",impacto:0.3,accion:"Mejora la toma de decisiones"},{texto:"Lanzar un programa básico de embajadores con 5 estudiantes activos y materiales de apoyo.",impacto:0.3,accion:"Amplía el alcance orgánico"}],
  exploracion:[{texto:"Agregar chat de consulta visible en las páginas de cada programa para capturar el interés.",impacto:0.4,accion:"Captura interés en el momento"},{texto:"Crear un comparador interno de programas para aspirantes indecisos.",impacto:0.3,accion:"Reduce la carga de decisión"},{texto:"Actualizar testimonios con datos concretos: inserción laboral, tiempo para conseguir trabajo.",impacto:0.3,accion:"Genera confianza real"}],
  activacion:[{texto:"Activar WhatsApp Business con respuesta automática en menos de 5 minutos.",impacto:0.8,accion:"Elimina la espera crítica"},{texto:"Rediseñar formulario a máximo 3 campos: nombre, teléfono y programa de interés.",impacto:0.7,accion:"Baja la barrera de entrada"},{texto:"Crear plantillas de respuesta por programa con elemento motivacional y paso siguiente.",impacto:0.6,accion:"Reactiva el interés del aspirante"}],
  acompanamiento:[{texto:"Diseñar una secuencia de 5 contactos con contenido diferente en cada paso.",impacto:0.6,accion:"Sostiene el interés con ritmo"},{texto:"Crear protocolo de reactivación: mensaje distinto, argumento nuevo, no el mismo recordatorio.",impacto:0.5,accion:"Recupera aspirantes enfriados"},{texto:"Implementar dos perfiles de acompañamiento diferenciados: joven de primer ingreso vs adulto.",impacto:0.4,accion:"Personaliza el proceso"}],
  decision:[{texto:"Publicar tabla de costos, cuotas y becas en la página de cada programa.",impacto:0.6,accion:"Elimina la incertidumbre económica"},{texto:"Crear kit de argumentos de cierre por programa con 3 diferenciales clave.",impacto:0.5,accion:"Da herramientas al asesor"},{texto:"Implementar clasificación de aspirantes que postergan y reactivarlos antes de cada ciclo.",impacto:0.4,accion:"Recupera decisiones diferidas"}],
  inscripcion:[{texto:"Mapear el proceso e identificar el paso más burocrático para digitalizarlo primero.",impacto:0.7,accion:"Elimina el cuello de botella"},{texto:"Implementar notificaciones automáticas del estado en cada paso completado.",impacto:0.5,accion:"Reduce la ansiedad del proceso"},{texto:"Activar canal dedicado de soporte con respuesta máxima de 2 horas.",impacto:0.4,accion:"Evita abandonos por fricción"}],
  retencion:[{texto:"Diseñar secuencia de bienvenida de 3 mensajes en los 3 días post-inscripción.",impacto:0.7,accion:"Sostiene la motivación post-inscripción"},{texto:"Detectar inscriptos que no abren correos ni acceden a la plataforma en 7 días.",impacto:0.6,accion:"Previene el abandono silencioso"},{texto:"Crear guía práctica del primer día: accesos, horarios y checklist personalizado.",impacto:0.5,accion:"Elimina la fricción del primer día"}],
};

function getNivel(score){
  if(score<=1.9) return {label:"Inicial",color:"#CC3333",bg:"#FFF0F0"};
  if(score<=3.0) return {label:"En desarrollo",color:ORANGE,bg:"#FFF8F0"};
  if(score<=4.0) return {label:"Consolidado",color:"#2E7D32",bg:"#F0FBF4"};
  return {label:"Avanzado",color:"#185FA5",bg:"#EEF2FF"};
}
function calcScore(respuestas,etapaId){
  const e=ETAPAS_DATA.find(x=>x.id===etapaId);
  if(!e) return 0;
  const vals=e.preguntas.map((p,i)=>{const r=respuestas[`${etapaId}_${i}`];const op=p.opciones.find(o=>o.letra===r);return op?op.valor:0;}).filter(v=>v>0);
  if(!vals.length) return 0;
  return parseFloat((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2));
}
function isValidEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}

function Mono({children,color=SLATE,size=9}){
  return <span style={{fontFamily:"'Space Mono',monospace",fontSize:size,letterSpacing:".12em",textTransform:"uppercase",color}}>{children}</span>;
}
function NivelPill({score}){
  const n=getNivel(score);
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:n.bg,borderRadius:6,padding:"3px 9px"}}>
    <span style={{fontFamily:"'DM Serif Display',serif",fontSize:15,color:n.color,lineHeight:1}}>{score.toFixed(1)}</span>
    <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:n.color,letterSpacing:".07em",textTransform:"uppercase"}}>{n.label}</span>
  </span>;
}

function RadarChart({scores}){
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const W=280,H=260,cx=140,cy=130,R=95;
    const labels=ETAPAS_DATA.map(e=>e.name);
    const vals=ETAPAS_DATA.map(e=>scores[e.id]||0);
    const N=labels.length;
    const angle=i=>(i/N)*2*Math.PI-Math.PI/2;
    ctx.clearRect(0,0,W,H);
    for(let lv=1;lv<=5;lv++){ctx.beginPath();for(let i=0;i<N;i++){const r=(lv/5)*R,x=cx+r*Math.cos(angle(i)),y=cy+r*Math.sin(angle(i));i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.closePath();ctx.strokeStyle="rgba(139,148,200,.18)";ctx.lineWidth=1;ctx.stroke();}
    for(let i=0;i<N;i++){ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+R*Math.cos(angle(i)),cy+R*Math.sin(angle(i)));ctx.strokeStyle="rgba(139,148,200,.2)";ctx.lineWidth=1;ctx.stroke();}
    ctx.beginPath();vals.forEach((v,i)=>{const r=(v/5)*R,x=cx+r*Math.cos(angle(i)),y=cy+r*Math.sin(angle(i));i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.closePath();ctx.fillStyle="rgba(0,200,150,.15)";ctx.fill();ctx.strokeStyle=EMERALD;ctx.lineWidth=2.5;ctx.stroke();
    vals.forEach((v,i)=>{const r=(v/5)*R,x=cx+r*Math.cos(angle(i)),y=cy+r*Math.sin(angle(i));ctx.beginPath();ctx.arc(x,y,4,0,2*Math.PI);ctx.fillStyle=EMERALD;ctx.fill();ctx.strokeStyle=WHITE;ctx.lineWidth=1.5;ctx.stroke();});
    ctx.font="bold 8px monospace";ctx.textAlign="center";ctx.textBaseline="middle";
    labels.forEach((label,i)=>{const r=R+17,x=cx+r*Math.cos(angle(i)),y=cy+r*Math.sin(angle(i));ctx.fillStyle="#3A4070";const words=label.split(" ");if(words.length>1){ctx.fillText(words[0],x,y-6);ctx.fillText(words.slice(1).join(" "),x,y+6);}else ctx.fillText(label,x,y);});
  },[scores]);
  return <canvas ref={ref} width={280} height={260}/>;
}

// ── WELCOME ──────────────────────────────────────────────
function Welcome({onStart}){
  return(
    <div style={{minHeight:"100vh",background:NAVY_DK,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(139,148,200,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(139,148,200,.06) 1px,transparent 1px)`,backgroundSize:"60px 60px"}}/>
      <div style={{position:"absolute",right:-80,top:"15%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle, rgba(0,200,150,.08) 0%, transparent 70%)"}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"60px 28px 40px",position:"relative",maxWidth:680,margin:"0 auto",width:"100%"}}>
        <Mono color={SLATE}>CampusLatina & CIeLatam · 2025</Mono>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(28px,5vw,48px)",color:WHITE,lineHeight:1.05,margin:"12px 0 16px"}}>
          Diagnóstico de Madurez del<br/><em style={{color:EMERALD}}>Proceso de Atracción</em><br/>Universitaria
        </h1>
        <p style={{fontSize:15,color:"rgba(255,255,255,.6)",lineHeight:1.7,marginBottom:28,maxWidth:480}}>
          Un autodiagnóstico que evalúa las 7 etapas del recorrido de un aspirante — desde que te descubre hasta que llega al primer día de clases.
        </p>

        {/* WHAT YOU'LL GET */}
        <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"20px 20px",marginBottom:24}}>
          <Mono color={EMERALD} size={8}>Qué vas a recibir al finalizar</Mono>
          <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:10}}>
            {[
              ["🗺","Mapa visual de tu proceso de atracción","Un radar que muestra de un vistazo dónde estás fuerte y dónde perdés aspirantes."],
              ["🔬","Diagnóstico etapa por etapa","Las fricciones concretas que frenan a los aspirantes en cada momento del recorrido."],
              ["📈","Calculadora de impacto","Elegís las acciones que estás dispuesto a implementar y ves en tiempo real cuánto sube tu puntaje."],
              ["🎯","Plan de acción priorizado","Las 3 mejoras más importantes por etapa, ordenadas por impacto potencial."],
            ].map(([icon,title,desc])=>(
              <div key={title} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <span style={{fontSize:18,flexShrink:0}}>{icon}</span>
                <div>
                  <div style={{fontSize:13,color:WHITE,fontWeight:500}}>{title}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.5}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* METHODOLOGY NOTE */}
        <div style={{background:"rgba(0,200,150,.08)",border:"1px solid rgba(0,200,150,.2)",borderRadius:10,padding:"14px 16px",marginBottom:28}}>
          <Mono color={EMERALD} size={8}>Metodología de análisis</Mono>
          <p style={{fontSize:13,color:"rgba(255,255,255,.65)",lineHeight:1.65,margin:"6px 0 0"}}>
            Este diagnóstico analiza cada etapa del journey a través de tres dimensiones: qué tan motivado está el aspirante, qué tan fácil es para él avanzar, y si tu universidad le da el estímulo correcto en el momento justo. Es el mismo modelo que usan empresas como Instagram, Duolingo y Airbnb para diseñar sus procesos de conversión.
          </p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:28}}>
          {[["28","preguntas"],["7","etapas"],["~10 min","duración"]].map(([val,label])=>(
            <div key={label} style={{background:"rgba(255,255,255,.05)",borderRadius:10,padding:"14px 12px",textAlign:"center",border:"1px solid rgba(255,255,255,.08)"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:EMERALD,lineHeight:1}}>{val}</div>
              <Mono color={SLATE} size={8}>{label}</Mono>
            </div>
          ))}
        </div>
        <button onClick={onStart} style={{alignSelf:"flex-start",background:EMERALD,color:NAVY_DK,border:"none",borderRadius:10,padding:"15px 32px",fontSize:15,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
          Comenzar diagnóstico →
        </button>
      </div>
    </div>
  );
}

// ── REGISTER ─────────────────────────────────────────────
function Register({onNext}){
  const [form,setForm]=useState({universidad:"",pais:"",nombre:"",cargo:"",email:"",whatsapp:""});
  const [emailError,setEmailError]=useState(false);
  const valid=form.universidad&&form.nombre&&form.email&&isValidEmail(form.email)&&form.pais&&form.whatsapp;

  const handleEmailBlur=()=>setEmailError(form.email.length>0&&!isValidEmail(form.email));
  const set=(k,v)=>{setForm(p=>({...p,[k]:v}));if(k==="email") setEmailError(false);};

  const LabelField=({label,required})=>(
    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
      <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:NAVY,fontWeight:700}}>{label}</span>
      {required&&<span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:EMERALD,fontWeight:700}}>*</span>}
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:CREAM,display:"flex",flexDirection:"column"}}>
      <div style={{background:NAVY_DK,padding:"14px 20px"}}>
        <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:".12em",textTransform:"uppercase",color:"rgba(255,255,255,.5)"}}>Paso 1 de 2 — Datos institucionales</span>
      </div>
      <div style={{flex:1,maxWidth:540,margin:"0 auto",padding:"36px 20px",width:"100%"}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:NAVY,marginBottom:6}}>Antes de empezar,<br/><em style={{color:EMERALD}}>contanos sobre tu institución</em></div>
        <p style={{fontSize:14,color:"#3A4070",marginBottom:28,lineHeight:1.65}}>Esta información personaliza el informe y permite el benchmark regional cuando más universidades completen el diagnóstico.</p>

        <div style={{background:WHITE,border:"1px solid #D4D2CC",borderRadius:14,padding:"22px 20px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #E8E6DF"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:EMERALD,flexShrink:0}}/>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:".12em",textTransform:"uppercase",color:NAVY,fontWeight:700}}>Datos de la institución</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <LabelField label="Nombre de la universidad o institución" required/>
              <input value={form.universidad} onChange={e=>set("universidad",e.target.value)} placeholder="Ej: Universidad Nacional de Córdoba"
                style={{display:"block",width:"100%",padding:"11px 14px",border:"1.5px solid #D4D2CC",borderRadius:8,fontSize:14,fontFamily:"'DM Sans',sans-serif",color:NAVY,background:CREAM,outline:"none"}}/>
            </div>
            <div>
              <LabelField label="País" required/>
              <div style={{position:"relative"}}>
                <select value={form.pais} onChange={e=>set("pais",e.target.value)}
                  style={{display:"block",width:"100%",padding:"11px 14px",border:"1.5px solid #D4D2CC",borderRadius:8,fontSize:14,fontFamily:"'DM Sans',sans-serif",color:form.pais?NAVY:"#999",background:CREAM,appearance:"none",cursor:"pointer"}}>
                  <option value="">Seleccioná tu país</option>
                  {PAISES_LATAM.map(p=><option key={p} value={p} disabled={p.startsWith("—")}>{p}</option>)}
                </select>
                <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",color:NAVY,pointerEvents:"none",fontSize:12}}>▾</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{background:WHITE,border:"1px solid #D4D2CC",borderRadius:14,padding:"22px 20px",marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #E8E6DF"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:SLATE,flexShrink:0}}/>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:".12em",textTransform:"uppercase",color:NAVY,fontWeight:700}}>Datos del directivo que responde</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {[
              {key:"nombre",label:"Nombre completo",required:true,placeholder:"Ej: María González",type:"text"},
              {key:"cargo",label:"Cargo",required:false,placeholder:"Ej: Vicerrectora de Desarrollo Institucional",type:"text"},
            ].map(f=>(
              <div key={f.key}>
                <LabelField label={f.label} required={f.required}/>
                <input type={f.type} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder}
                  style={{display:"block",width:"100%",padding:"11px 14px",border:"1.5px solid #D4D2CC",borderRadius:8,fontSize:14,fontFamily:"'DM Sans',sans-serif",color:NAVY,background:CREAM,outline:"none"}}/>
              </div>
            ))}
            <div>
              <LabelField label="Correo electrónico" required/>
              <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} onBlur={handleEmailBlur} placeholder="Ej: maria@universidad.edu"
                style={{display:"block",width:"100%",padding:"11px 14px",border:`1.5px solid ${emailError?"#CC3333":"#D4D2CC"}`,borderRadius:8,fontSize:14,fontFamily:"'DM Sans',sans-serif",color:NAVY,background:CREAM,outline:"none"}}/>
              {emailError&&<p style={{fontSize:12,color:"#CC3333",margin:"5px 0 0",fontWeight:500}}>Ingresá un correo electrónico válido (ej: nombre@universidad.edu)</p>}
            </div>
            <div>
              <LabelField label="WhatsApp" required/>
              <input type="tel" value={form.whatsapp} onChange={e=>set("whatsapp",e.target.value)} placeholder="Ej: +54 9 11 1234-5678"
                style={{display:"block",width:"100%",padding:"11px 14px",border:"1.5px solid #D4D2CC",borderRadius:8,fontSize:14,fontFamily:"'DM Sans',sans-serif",color:NAVY,background:CREAM,outline:"none"}}/>
              <p style={{fontSize:12,color:"#6A7090",margin:"5px 0 0"}}>Incluí el código de país (ej: +54 para Argentina, +52 para México)</p>
            </div>
          </div>
        </div>

        <button onClick={()=>valid&&onNext(form)}
          style={{width:"100%",padding:"16px 0",borderRadius:10,border:"none",
            background:valid?NAVY:"#8B94B8",
            color:WHITE,fontSize:15,fontFamily:"'DM Sans',sans-serif",fontWeight:600,
            cursor:valid?"pointer":"not-allowed",
            opacity:valid?1:0.6,
            transition:"opacity .2s,background .2s"
          }}>
          Empezar el diagnóstico →
        </button>
        {!valid&&<p style={{textAlign:"center",fontSize:12,color:"#3A4070",marginTop:10,fontWeight:500}}>Completá los campos obligatorios (*) para continuar</p>}
      </div>
    </div>
  );
}

// ── STAGE INTRO ───────────────────────────────────────────
function StageIntro({etapa,onStart,etapasScores}){
  const prev=ETAPAS_DATA.filter(e=>e.num<etapa.num);
  return(
    <div style={{minHeight:"100vh",background:CREAM,display:"flex",flexDirection:"column"}}>
      {/* Timeline header */}
      <div style={{background:NAVY_DK,padding:"14px 16px 16px"}}>
        <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:10}}>
          {ETAPAS_DATA.map(e=>{
            const done=etapasScores&&etapasScores[e.id]>0;
            const current=e.num===etapa.num;
            return(
              <div key={e.id} style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:current?EMERALD:done?"rgba(0,200,150,.3)":"rgba(255,255,255,.1)",border:`2px solid ${current?EMERALD:done?"rgba(0,200,150,.5)":"rgba(255,255,255,.15)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontFamily:"'Space Mono',monospace",color:current?NAVY_DK:done?"rgba(0,200,150,.8)":"rgba(255,255,255,.3)",fontWeight:700,flexShrink:0}}>
                  {done&&!current?"✓":e.num}
                </div>
                {e.num<7&&<div style={{width:12,height:2,background:done?"rgba(0,200,150,.4)":"rgba(255,255,255,.08)",borderRadius:1}}/>}
              </div>
            );
          })}
        </div>
        <div style={{textAlign:"center"}}><Mono color={SLATE} size={8}>Etapa {etapa.num} de 7</Mono></div>
      </div>

      <div style={{flex:1,maxWidth:580,margin:"0 auto",padding:"40px 24px",width:"100%",display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{fontSize:48,textAlign:"center",marginBottom:16}}>{etapa.emoji}</div>
        <div style={{textAlign:"center",marginBottom:8}}><Mono color={EMERALD} size={8}>Etapa {etapa.num}</Mono></div>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(26px,5vw,36px)",color:NAVY,textAlign:"center",lineHeight:1.15,marginBottom:20}}>{etapa.name}</div>
        <div style={{background:WHITE,border:"1px solid #E8E6DF",borderRadius:14,padding:"20px 22px",marginBottom:24}}>
          <p style={{fontSize:15,color:NAVY,lineHeight:1.7,margin:0,fontWeight:500}}>{etapa.resumen}</p>
          <p style={{fontSize:14,color:"#6A7090",lineHeight:1.65,margin:"10px 0 0"}}>{etapa.contexto}</p>
        </div>
        <div style={{background:CREAM,border:"1px solid #E8E6DF",borderRadius:10,padding:"12px 16px",marginBottom:28,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:22,color:SLATE}}>4</span>
          <p style={{fontSize:13,color:"#6A7090",margin:0,lineHeight:1.5}}>preguntas en esta etapa · cada una con 4 opciones — elegí la que mejor describe cómo está tu institución <em>hoy</em>, no cómo te gustaría que estuviera.</p>
        </div>
        <button onClick={onStart} style={{width:"100%",padding:"15px 0",borderRadius:10,border:"none",background:EMERALD,color:NAVY_DK,fontSize:15,fontFamily:"'DM Sans',sans-serif",fontWeight:700,cursor:"pointer"}}>
          Empezar etapa {etapa.num} →
        </button>
      </div>
    </div>
  );
}

// ── QUESTION ─────────────────────────────────────────────
function Question({etapaIdx,preguntaIdx,etapa,pregunta,selected,onSelect,onNext,onBack,isLast,etapasScores}){
  const globalIdx=etapaIdx*4+preguntaIdx;
  const TOTAL=28;
  const pct=Math.round((globalIdx/TOTAL)*100);
  return(
    <div style={{minHeight:"100vh",background:CREAM,display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{background:NAVY_DK}}>
        <div style={{height:3,background:EMERALD,width:`${pct}%`,transition:"width .4s"}}/>
        {/* Timeline mini */}
        <div style={{padding:"10px 16px 8px"}}>
          <div style={{display:"flex",gap:3,justifyContent:"center",marginBottom:8}}>
            {ETAPAS_DATA.map(e=>{
              const done=e.num<etapa.num||(e.num===etapa.num&&etapasScores&&etapasScores[e.id]>0);
              const current=e.num===etapa.num;
              return(
                <div key={e.id} style={{display:"flex",alignItems:"center",gap:3}}>
                  <div style={{
                    width:current?32:22,height:current?32:22,borderRadius:"50%",
                    background:current?EMERALD:done?"rgba(0,200,150,.25)":"rgba(255,255,255,.08)",
                    border:`2px solid ${current?EMERALD:done?"rgba(0,200,150,.4)":"rgba(255,255,255,.12)"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:current?13:10,fontFamily:"'Space Mono',monospace",
                    color:current?NAVY_DK:done?"rgba(0,200,150,.8)":"rgba(255,255,255,.25)",
                    fontWeight:700,flexShrink:0,transition:"all .3s"
                  }}>
                    {done&&!current?"✓":current?e.emoji:e.num}
                  </div>
                  {e.num<7&&<div style={{width:8,height:2,background:done?"rgba(0,200,150,.3)":"rgba(255,255,255,.06)",borderRadius:1}}/>}
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:EMERALD,letterSpacing:".1em",textTransform:"uppercase"}}>{etapa.emoji} {etapa.name}</span>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:SLATE,marginLeft:8}}>· Pregunta {preguntaIdx+1}/4</span>
            </div>
            <Mono color={SLATE}>{globalIdx+1}/{TOTAL}</Mono>
          </div>
        </div>
        {/* Context bar */}
        <div style={{background:"rgba(255,255,255,.04)",borderTop:"1px solid rgba(255,255,255,.06)",padding:"10px 16px"}}>
          <p style={{fontSize:12,color:"rgba(255,255,255,.5)",margin:0,lineHeight:1.6}}>{etapa.resumen}</p>
        </div>
      </div>

      {/* Question */}
      <div style={{flex:1,maxWidth:640,margin:"0 auto",padding:"24px 18px 16px",width:"100%"}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:19,color:NAVY,lineHeight:1.4,marginBottom:22}}>{pregunta.texto}</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {pregunta.opciones.map(op=>{
            const isSel=selected===op.letra;
            return(
              <div key={op.letra} onClick={()=>onSelect(op.letra)}
                style={{display:"flex",gap:12,alignItems:"flex-start",padding:"13px 15px",background:isSel?"rgba(0,200,150,.09)":WHITE,border:`1.5px solid ${isSel?EMERALD:"#E8E6DF"}`,borderRadius:12,cursor:"pointer",transition:"all .15s"}}>
                <div style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${isSel?EMERALD:"#C0BEB7"}`,background:isSel?EMERALD:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'Space Mono',monospace",fontSize:9,color:isSel?WHITE:"#6A7090",fontWeight:700,transition:"all .15s"}}>
                  {isSel?"✓":op.letra}
                </div>
                <p style={{fontSize:13,color:isSel?NAVY:"#3A4070",lineHeight:1.6,margin:0}}>{op.texto}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nav */}
      <div style={{maxWidth:640,margin:"0 auto",padding:"10px 18px 28px",width:"100%",display:"flex",gap:10}}>
        <button onClick={onBack} style={{padding:"11px 20px",borderRadius:8,border:"1px solid #E8E6DF",background:WHITE,color:"#6A7090",cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>← Atrás</button>
        <button onClick={()=>selected&&onNext()} disabled={!selected}
          style={{flex:1,padding:"11px 0",borderRadius:8,border:"none",background:selected?NAVY:"#C0BEB7",color:WHITE,cursor:selected?"pointer":"not-allowed",fontSize:14,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
          {isLast?"Ver mi diagnóstico →":"Siguiente →"}
        </button>
      </div>
    </div>
  );
}

// ── PROCESSING ────────────────────────────────────────────
function Processing(){
  const [step,setStep]=useState(0);
  const steps=["Analizando las 7 etapas del journey...","Calculando niveles de madurez...","Identificando fricciones en cada etapa...","Generando recomendaciones personalizadas...","Preparando tu informe..."];
  useEffect(()=>{if(step<steps.length-1){const t=setTimeout(()=>setStep(s=>s+1),750);return()=>clearTimeout(t);}},[step]);
  const pct=Math.round(((step+1)/steps.length)*100);
  return(
    <div style={{minHeight:"100vh",background:NAVY_DK,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",padding:32,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(139,148,200,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(139,148,200,.06) 1px,transparent 1px)`,backgroundSize:"60px 60px"}}/>
      <div style={{position:"relative",textAlign:"center",maxWidth:400}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:52,color:EMERALD,marginBottom:8}}>{pct}%</div>
        <div style={{height:4,background:"rgba(255,255,255,.1)",borderRadius:2,marginBottom:20,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:EMERALD,borderRadius:2,transition:"width .6s"}}/>
        </div>
        <p style={{fontSize:15,color:"rgba(255,255,255,.6)",lineHeight:1.7}}>{steps[step]}</p>
      </div>
    </div>
  );
}

// ── REPORT ────────────────────────────────────────────────
function Report({registroData,respuestas}){
  const [tab,setTab]=useState(0);
  const [checked,setChecked]=useState({});

  const scores={};
  ETAPAS_DATA.forEach(e=>{scores[e.id]=calcScore(respuestas,e.id);});
  const etapaScores=ETAPAS_DATA.map(e=>({...e,score:scores[e.id],nivel:getNivel(scores[e.id])}));
  const globalScore=parseFloat((Object.values(scores).reduce((a,b)=>a+b,0)/ETAPAS_DATA.length).toFixed(2));
  const globalNivel=getNivel(globalScore);
  const globalPotential=parseFloat((ETAPAS_DATA.reduce((a,e)=>a+SCORE_POTENTIALS[e.id],0)/ETAPAS_DATA.length).toFixed(2));
  const bottleneck=etapaScores.reduce((a,e)=>e.score<a.score?e:a);
  const best=etapaScores.reduce((a,e)=>e.score>a.score?e:a);

  // UNIFIED scoring: same function for both Recs and Recibir
  const calcEtapaProjected=(eid)=>{
    const recs=RECS[eid]||[];
    const extra=recs.reduce((sum,r,ri)=>checked[`${eid}-${ri}`]?sum+r.impacto:sum,0);
    return Math.min(5,parseFloat((scores[eid]+extra).toFixed(2)));
  };
  const projGlobal=parseFloat((ETAPAS_DATA.reduce((s,e)=>s+calcEtapaProjected(e.id),0)/ETAPAS_DATA.length).toFixed(2));
  const totalChecked=Object.values(checked).filter(Boolean).length;

  const TABS=["Resumen","Radar","Etapas","Recomendaciones","Descargar PDF"];

  // ── TAB: RESUMEN
  const TabResumen=()=>(
    <div>
      <div style={{background:NAVY_DK,padding:"26px 20px 20px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(139,148,200,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(139,148,200,.06) 1px,transparent 1px)`,backgroundSize:"56px 56px"}}/>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:16}}>
            <div>
              <Mono color={SLATE}>{new Date().toLocaleDateString("es-AR",{month:"long",year:"numeric"})}</Mono>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:WHITE,marginTop:5,lineHeight:1.2}}>{registroData.universidad||"Tu institución"}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginTop:2}}>{registroData.nombre}{registroData.cargo?` · ${registroData.cargo}`:""}{registroData.pais?` · ${registroData.pais}`:""}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:40,color:EMERALD,lineHeight:1}}>{globalScore.toFixed(1)}</div>
              <Mono color={SLATE}>de 5 · {globalNivel.label}</Mono>
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,.06)",borderRadius:10,padding:"13px 16px",borderLeft:`3px solid ${EMERALD}`,marginBottom:14}}>
            <Mono color={EMERALD} size={8}>Lectura del diagnóstico</Mono>
            <p style={{fontSize:13,color:"rgba(255,255,255,.7)",lineHeight:1.7,margin:"6px 0 0"}}>
              {globalScore<=2?`El sistema de atracción funciona de forma reactiva y depende más de personas que de procesos. La mayor oportunidad de mejora está en ${bottleneck.name}, que es el cuello de botella principal del journey.`
               :globalScore<=3?`Hay estructura básica pero con brechas importantes. El journey pierde valor especialmente en ${bottleneck.name}. Con procesos más sistemáticos, el puntaje puede crecer significativamente.`
               :`Tenés una base sólida. El foco de mejora está en ${bottleneck.name} y en automatizar lo que hoy depende de iniciativa individual.`}
            </p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{background:"rgba(255,255,255,.05)",borderRadius:8,padding:"11px 13px"}}>
              <Mono color={SLATE} size={8}>Punto más fuerte</Mono>
              <div style={{fontSize:13,color:WHITE,fontWeight:500,marginTop:4}}>{best.name}</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:EMERALD}}>{best.score.toFixed(1)}/5</div>
            </div>
            <div style={{background:"rgba(255,255,255,.05)",borderRadius:8,padding:"11px 13px",borderLeft:`3px solid ${ORANGE}`}}>
              <Mono color={SLATE} size={8}>Punto más débil</Mono>
              <div style={{fontSize:13,color:WHITE,fontWeight:500,marginTop:4}}>{bottleneck.name}</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:ORANGE}}>{bottleneck.score.toFixed(1)}/5</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{padding:"16px 18px"}}>
        <Mono color={SLATE}>Journey secuencial — 7 etapas</Mono>
        <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:7}}>
          {etapaScores.map((e,i)=>(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:NAVY,color:EMERALD,fontFamily:"'Space Mono',monospace",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{e.emoji}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:12,color:NAVY,fontWeight:500}}>{e.name}</span>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:e.nivel.color}}>{e.score.toFixed(1)} · {e.nivel.label}</span>
                </div>
                <div style={{height:5,background:"#E8E6DF",borderRadius:3}}>
                  <div style={{height:"100%",width:`${(e.score/5)*100}%`,background:e.nivel.color,borderRadius:3}}/>
                </div>
              </div>
              {i<etapaScores.length-1&&<span style={{color:SLATE,fontSize:10}}>↓</span>}
            </div>
          ))}
        </div>
        <div style={{marginTop:16,background:CREAM,border:"1px solid #E8E6DF",borderRadius:10,padding:"13px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <Mono color={SLATE} size={8}>Puntaje potencial con todas las mejoras</Mono>
              <p style={{fontSize:12,color:"#3A4070",marginTop:3}}>Si implementás todas las recomendaciones</p>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:"#2E7D32"}}>{globalPotential.toFixed(1)}</div>
              <Mono color="#2E7D32" size={8}>{getNivel(globalPotential).label}</Mono>
            </div>
          </div>
          <div style={{marginTop:8,height:5,background:"#E8E6DF",borderRadius:3,position:"relative"}}>
            <div style={{height:"100%",width:`${(globalScore/5)*100}%`,background:ORANGE,borderRadius:3}}/>
            <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${(globalPotential/5)*100}%`,background:"rgba(0,200,150,.3)",borderRadius:3,border:`1px dashed ${EMERALD}`}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
            <span style={{fontSize:11,color:ORANGE}}>Hoy: {globalScore.toFixed(1)}</span>
            <span style={{fontSize:11,color:EMERALD}}>Potencial: {globalPotential.toFixed(1)} (+{(globalPotential-globalScore).toFixed(1)} pts)</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── TAB: RADAR
  const TabRadar=()=>{
    const matrix=[
      {nivel:"Avanzado",rango:"4.1–5.0",color:"#185FA5",desc:"Sistema automatizado, personalizado y en mejora continua."},
      {nivel:"Consolidado",rango:"3.1–4.0",color:"#2E7D32",desc:"Proceso definido, predecible y con métricas básicas."},
      {nivel:"En desarrollo",rango:"2.0–3.0",color:ORANGE,desc:"Hay intención pero sin sistema ni consistencia."},
      {nivel:"Inicial",rango:"1.0–1.9",color:"#CC3333",desc:"Sin proceso. Depende de personas y del azar."},
    ];
    return(
      <div style={{padding:18}}>
        <Mono color={EMERALD}>Visualización</Mono>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:NAVY,margin:"5px 0 16px"}}>Perfil de <em style={{color:EMERALD}}>madurez</em></div>
        <div style={{background:WHITE,border:"1px solid #E8E6DF",borderRadius:14,padding:18,marginBottom:14,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <RadarChart scores={scores}/>
        </div>
        {/* MATRIX */}
        <div style={{background:WHITE,border:"1px solid #E8E6DF",borderRadius:14,padding:"16px 18px"}}>
          <Mono color={SLATE} size={8}>Matriz de niveles — dónde está cada etapa</Mono>
          <div style={{marginTop:12,overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr>
                  <td style={{padding:"6px 8px",borderBottom:"1px solid #E8E6DF",fontFamily:"'Space Mono',monospace",fontSize:8,color:SLATE,textTransform:"uppercase",letterSpacing:".08em",minWidth:90}}>Nivel</td>
                  <td style={{padding:"6px 8px",borderBottom:"1px solid #E8E6DF",fontFamily:"'Space Mono',monospace",fontSize:8,color:SLATE,textTransform:"uppercase",letterSpacing:".08em",minWidth:60}}>Rango</td>
                  <td style={{padding:"6px 8px",borderBottom:"1px solid #E8E6DF",fontFamily:"'Space Mono',monospace",fontSize:8,color:SLATE,textTransform:"uppercase",letterSpacing:".08em"}}>Etapas en este nivel</td>
                </tr>
              </thead>
              <tbody>
                {matrix.map(m=>{
                  const etapasEnNivel=etapaScores.filter(e=>e.nivel.label===m.nivel);
                  return(
                    <tr key={m.nivel} style={{borderBottom:"1px solid #F0EEEA"}}>
                      <td style={{padding:"10px 8px"}}>
                        <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:m.color,flexShrink:0}}/>
                          <span style={{fontSize:12,fontWeight:600,color:m.color}}>{m.nivel}</span>
                        </span>
                      </td>
                      <td style={{padding:"10px 8px",fontFamily:"'Space Mono',monospace",fontSize:9,color:"#6A7090"}}>{m.rango}</td>
                      <td style={{padding:"10px 8px"}}>
                        {etapasEnNivel.length===0
                          ?<span style={{fontSize:12,color:"#C0BEB7",fontStyle:"italic"}}>—</span>
                          :<div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                            {etapasEnNivel.map(e=>(
                              <span key={e.id} style={{display:"inline-flex",alignItems:"center",gap:3,background:m.color+"15",borderRadius:5,padding:"2px 7px"}}>
                                <span style={{fontSize:11}}>{e.emoji}</span>
                                <span style={{fontSize:11,color:m.color,fontWeight:500}}>{e.name} {e.score.toFixed(1)}</span>
                              </span>
                            ))}
                          </div>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ── TAB: ETAPAS
  const TabEtapas=()=>{
    const [open,setOpen]=useState(null);
    return(
      <div style={{padding:18}}>
        <Mono color={EMERALD}>Diagnóstico detallado</Mono>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:NAVY,margin:"5px 0 6px"}}>Las 7 <em style={{color:EMERALD}}>etapas</em></div>
        <p style={{fontSize:13,color:"#6A7090",marginBottom:14,lineHeight:1.6}}>Un cuello de botella en cualquier etapa afecta todo lo que viene después.</p>
        {etapaScores.map((e,i)=>{
          const isOpen=open===i;
          const fricc=FRICCIONES[e.id]||[];
          return(
            <div key={e.id} style={{background:WHITE,border:`1px solid ${isOpen?e.nivel.color+"66":"#E8E6DF"}`,borderRadius:12,marginBottom:10,overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",cursor:"pointer"}} onClick={()=>setOpen(isOpen?null:i)}>
                <div style={{width:32,height:32,borderRadius:"50%",background:e.nivel.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{e.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:500,color:NAVY}}>{e.name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
                    <div style={{height:4,width:48,background:"#E8E6DF",borderRadius:2}}>
                      <div style={{height:"100%",width:`${(e.score/5)*100}%`,background:e.nivel.color,borderRadius:2}}/>
                    </div>
                    <Mono color={e.nivel.color} size={9}>{e.score.toFixed(1)} · {e.nivel.label}</Mono>
                  </div>
                </div>
                <span style={{color:"#6A7090",transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
              </div>
              {isOpen&&(
                <div style={{padding:"0 16px 16px",borderTop:`1px solid ${e.nivel.color}22`}}>
                  <p style={{fontSize:13,color:"#3A4070",lineHeight:1.7,paddingTop:12,marginBottom:14}}>{e.resumen} {e.contexto}</p>
                  <Mono color={SLATE} size={8}>Dónde se pierde valor</Mono>
                  <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
                    {fricc.map((f,fi)=>(
                      <div key={fi} style={{display:"flex",gap:10,padding:"10px 13px",background:CREAM,borderRadius:8}}>
                        <span style={{fontSize:16,flexShrink:0}}>{f.icon}</span>
                        <p style={{fontSize:13,color:"#3A4070",lineHeight:1.55,margin:0}}>{f.texto}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:14,padding:"10px 14px",background:e.nivel.bg,borderRadius:8,borderLeft:`3px solid ${e.nivel.color}`,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                    <div>
                      <Mono color={e.nivel.color} size={8}>Puntaje actual</Mono>
                      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:e.nivel.color,marginTop:2}}>{e.score.toFixed(1)}/5 · {e.nivel.label}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <Mono color="#2E7D32" size={8}>Potencial alcanzable</Mono>
                      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#2E7D32",marginTop:2}}>{SCORE_POTENTIALS[e.id]}/5 · {getNivel(SCORE_POTENTIALS[e.id]).label}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── TAB: RECOMENDACIONES
  const TabRecs=()=>(
    <div style={{padding:18}}>
      <Mono color={EMERALD}>Plan de acción</Mono>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:NAVY,margin:"5px 0 6px"}}>Para <em style={{color:EMERALD}}>subir de nivel</em></div>
      <p style={{fontSize:13,color:"#6A7090",marginBottom:14,lineHeight:1.6}}>Marcá las acciones que estás dispuesto a implementar y mirá cómo sube tu puntaje en tiempo real.</p>

      <div style={{background:NAVY,borderRadius:14,padding:"16px 18px",marginBottom:16}}>
        <Mono color={SLATE} size={8}>Tu puntaje proyectado</Mono>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:8,flexWrap:"wrap"}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:36,color:ORANGE,lineHeight:1}}>{globalScore.toFixed(1)}</div>
          <span style={{color:SLATE,fontSize:18}}>→</span>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:36,color:projGlobal>globalScore?EMERALD:ORANGE,lineHeight:1}}>{projGlobal.toFixed(1)}</div>
          <div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:ORANGE,background:"rgba(232,131,58,.15)",padding:"2px 8px",borderRadius:8,letterSpacing:".07em",textTransform:"uppercase"}}>{globalNivel.label}</span>
              {projGlobal>globalScore&&<>
                <span style={{color:SLATE,fontSize:10}}>→</span>
                <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:EMERALD,background:"rgba(0,200,150,.15)",padding:"2px 8px",borderRadius:8,letterSpacing:".07em",textTransform:"uppercase"}}>{getNivel(projGlobal).label}</span>
              </>}
            </div>
            <Mono color={EMERALD} size={8}>{totalChecked} acción{totalChecked!==1?"es":""} seleccionada{totalChecked!==1?"s":""}{projGlobal>globalScore?` · +${(projGlobal-globalScore).toFixed(2)} pts`:""}</Mono>
          </div>
        </div>
        <div style={{marginTop:12,height:7,background:"rgba(255,255,255,.1)",borderRadius:4,overflow:"hidden"}}>
          <div style={{height:"100%",display:"flex"}}>
            <div style={{width:`${(globalScore/5)*100}%`,background:ORANGE}}/>
            {projGlobal>globalScore&&<div style={{width:`${((projGlobal-globalScore)/5)*100}%`,background:EMERALD}}/>}
          </div>
        </div>
      </div>

      {etapaScores.map((e,ei)=>{
        const recs=RECS[e.id]||[];
        const newScore=calcEtapaProjected(e.id);
        const changed=newScore>e.score;
        return(
          <div key={e.id} style={{background:WHITE,border:"1px solid #E8E6DF",borderRadius:12,marginBottom:12}}>
            <div style={{padding:"12px 15px",borderBottom:"1px solid #F0EEEA",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>{e.emoji}</span>
                <span style={{fontSize:14,fontWeight:500,color:NAVY}}>{e.name}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <NivelPill score={e.score}/>
                {changed&&<><span style={{color:EMERALD,fontSize:12}}>→</span><NivelPill score={newScore}/><span style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:EMERALD,background:"rgba(0,200,150,.1)",padding:"2px 6px",borderRadius:6}}>+{(newScore-e.score).toFixed(2)}</span></>}
              </div>
            </div>
            <div style={{padding:"10px 15px",display:"flex",flexDirection:"column",gap:8}}>
              {recs.map((r,ri)=>{
                const key=`${e.id}-${ri}`;
                const isCh=checked[key];
                return(
                  <div key={ri} onClick={()=>setChecked(prev=>({...prev,[key]:!prev[key]}))}
                    style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 13px",background:isCh?"rgba(0,200,150,.08)":CREAM,borderRadius:8,cursor:"pointer",border:`1px solid ${isCh?EMERALD+"55":"transparent"}`,transition:"all .15s"}}>
                    <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${isCh?EMERALD:"#C0BEB7"}`,background:isCh?EMERALD:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .15s"}}>
                      {isCh&&<span style={{color:WHITE,fontSize:10}}>✓</span>}
                    </div>
                    <div style={{flex:1}}>
                      <p style={{fontSize:13,color:"#3A4070",lineHeight:1.55,margin:0}}>{r.texto}</p>
                      <p style={{fontSize:10,color:isCh?EMERALD:"#6A7090",fontFamily:"'Space Mono',monospace",margin:"4px 0 0"}}>+{r.impacto.toFixed(1)} pts · {r.accion}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── TAB: INFORME PDF
  const TabRecibir=()=>{
    const [generating,setGenerating]=useState(false);
    const [done,setDone]=useState(false);
    const nivelColor=(s)=>{if(s<=1.9)return"#CC3333";if(s<=3.0)return"#E8833A";if(s<=4.0)return"#2E7D32";return"#185FA5";};
    const nivelLabel=(s)=>{if(s<=1.9)return"Inicial";if(s<=3.0)return"En desarrollo";if(s<=4.0)return"Consolidado";return"Avanzado";};

    const generatePDF=()=>{
      setGenerating(true);
      const etapasRows=etapaScores.map(e=>`
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #E8E6DF;font-size:13px;color:#1A1F5E;font-weight:500;">${e.emoji} ${e.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E8E6DF;font-size:13px;color:${nivelColor(e.score)};font-weight:700;text-align:center;">${e.score.toFixed(1)}/5</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E8E6DF;font-size:12px;color:${nivelColor(e.score)};">${nivelLabel(e.score)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E8E6DF;font-size:12px;color:#2E7D32;">${SCORE_POTENTIALS[e.id]}/5</td>
        </tr>
      `).join("");
      const etapasDetalle=etapaScores.map(e=>{
        const fricc=(FRICCIONES[e.id]||[]).map(f=>`<li style="margin-bottom:6px;color:#3A4070;font-size:13px;">${f.icon} ${f.texto}</li>`).join("");
        const recs=(RECS[e.id]||[]).map((r,i)=>`<li style="margin-bottom:8px;color:#3A4070;font-size:13px;"><strong>${i+1}.</strong> ${r.texto} <span style="color:#00C896;">(+${r.impacto.toFixed(1)} pts)</span></li>`).join("");
        return`<div style="margin-bottom:28px;page-break-inside:avoid;"><div style="border-left:4px solid ${nivelColor(e.score)};padding-left:14px;margin-bottom:10px;"><div style="font-size:16px;font-weight:bold;color:#1A1F5E;">${e.emoji} ${e.num}. ${e.name}</div><div style="font-size:12px;color:${nivelColor(e.score)};margin-top:2px;">${e.score.toFixed(1)}/5 · ${nivelLabel(e.score)} → Potencial: ${SCORE_POTENTIALS[e.id]}/5 · ${nivelLabel(SCORE_POTENTIALS[e.id])}</div></div><p style="font-size:13px;color:#3A4070;line-height:1.65;margin-bottom:10px;">${e.resumen}</p><div style="margin-bottom:10px;"><div style="font-size:10px;font-weight:700;color:#8B94C8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px;">Dónde se pierde valor</div><ul style="margin:0;padding-left:16px;">${fricc}</ul></div><div><div style="font-size:10px;font-weight:700;color:#8B94C8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px;">Recomendaciones</div><ul style="margin:0;padding-left:16px;">${recs}</ul></div></div>`;
      }).join("");
      const fechaStr=new Date().toLocaleDateString("es-AR",{month:"long",year:"numeric"});
      const html=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Diagnóstico — ${registroData.universidad||"Mi institución"}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,Helvetica,sans-serif;color:#1A1F5E;background:white;font-size:14px;line-height:1.6;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}.header{background:#0E1240;color:white;padding:28px 44px;}.content{padding:32px 44px;}table{width:100%;border-collapse:collapse;}th{background:#1A1F5E;color:white;padding:9px 12px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;text-align:left;}.section-title{font-size:20px;font-weight:bold;color:#1A1F5E;margin:28px 0 14px;padding-bottom:6px;border-bottom:2px solid #00C896;}.footer{background:#F5F4F0;padding:16px 44px;font-size:11px;color:#6A7090;text-align:center;border-top:1px solid #E8E6DF;margin-top:32px;}</style></head><body><div class="header"><div style="display:flex;justify-content:space-between;align-items:flex-start;"><div><div style="font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#8B94C8;margin-bottom:8px;">CampusLatina & CIeLatam & Salesforce · ${fechaStr}</div><div style="font-size:24px;font-weight:bold;color:white;line-height:1.1;margin-bottom:6px;">Diagnóstico de Madurez del<br/>Proceso de Atracción Universitaria</div><div style="font-size:12px;color:rgba(255,255,255,.5);">${registroData.universidad||"Mi institución"}${registroData.nombre?" · "+registroData.nombre:""}${registroData.cargo?" · "+registroData.cargo:""}${registroData.pais?" · "+registroData.pais:""}</div></div><div style="text-align:right;"><div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#8B94C8;margin-bottom:4px;">Puntaje global</div><div style="font-size:48px;color:#00C896;line-height:1;font-weight:bold;">${globalScore.toFixed(1)}</div><div style="font-size:11px;color:#00C896;text-transform:uppercase;">${globalNivel.label} · de 5</div></div></div></div><div class="content"><div style="background:#F0FBF7;border-left:4px solid #00C896;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:28px;"><div style="font-size:10px;font-weight:700;color:#00C896;letter-spacing:.12em;text-transform:uppercase;margin-bottom:5px;">Lectura del diagnóstico</div><p style="font-size:13px;color:#1A1F5E;line-height:1.7;">${globalScore<=2?"El sistema de atracción funciona de forma reactiva y depende más de personas que de procesos. La mayor oportunidad de mejora está en "+bottleneck.name+".":globalScore<=3?"Hay estructura básica pero con brechas importantes. El journey pierde valor especialmente en "+bottleneck.name+".":"Tenés una base sólida. El foco de mejora está en "+bottleneck.name+" y en automatizar lo que hoy depende de iniciativa individual."}</p></div><div class="section-title">Resumen por etapa</div><table><thead><tr><th>Etapa</th><th style="text-align:center;">Puntaje actual</th><th>Nivel actual</th><th>Potencial</th></tr></thead><tbody>${etapasRows}</tbody></table><div style="margin-top:10px;font-size:12px;color:#6A7090;">Puntaje global hoy: <strong style="color:#E8833A;">${globalScore.toFixed(1)}/5</strong> &nbsp;·&nbsp; Potencial: <strong style="color:#2E7D32;">${globalPotential.toFixed(1)}/5 (+${(globalPotential-globalScore).toFixed(1)} pts)</strong></div><div class="section-title">Análisis detallado por etapa</div>${etapasDetalle}</div><div class="footer">Framework de Madurez del Proceso de Atracción Universitaria · CampusLatina & CIeLatam & Salesforce · v1.0</div><script>window.onload=function(){setTimeout(function(){window.print();},400);}<\/script></body></html>`;
      const win=window.open("","_blank");
      if(win){win.document.write(html);win.document.close();}
      setTimeout(()=>{setGenerating(false);setDone(true);},800);
    };

    return(
      <div style={{padding:18}}>
        <Mono color={EMERALD}>Tu diagnóstico</Mono>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:NAVY,margin:"5px 0 16px"}}>Descargá el <em style={{color:EMERALD}}>informe completo</em></div>

        <div style={{background:NAVY,borderRadius:14,padding:"20px 18px",marginBottom:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:8}}>
            <div style={{textAlign:"center"}}>
              <Mono color={SLATE} size={8}>Hoy</Mono>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:40,color:ORANGE,lineHeight:1,marginTop:4}}>{globalScore.toFixed(1)}</div>
              <Mono color={ORANGE} size={8}>{globalNivel.label}</Mono>
            </div>
            <span style={{color:SLATE,fontSize:20}}>→</span>
            <div style={{textAlign:"center"}}>
              <Mono color={EMERALD} size={8}>Potencial</Mono>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:40,color:EMERALD,lineHeight:1,marginTop:4}}>{globalPotential.toFixed(1)}</div>
              <Mono color={EMERALD} size={8}>{getNivel(globalPotential).label}</Mono>
            </div>
          </div>
          <p style={{fontSize:13,color:"rgba(255,255,255,.55)",textAlign:"center",marginTop:12,lineHeight:1.6}}>
            Implementando todas las recomendaciones podés sumar <span style={{color:EMERALD}}>+{(globalPotential-globalScore).toFixed(1)} puntos</span>.
          </p>
          <div style={{marginTop:10,height:6,background:"rgba(255,255,255,.1)",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",display:"flex"}}>
              <div style={{width:`${(globalScore/5)*100}%`,background:ORANGE}}/>
              <div style={{width:`${((globalPotential-globalScore)/5)*100}%`,background:"rgba(0,200,150,.5)"}}/>
            </div>
          </div>
        </div>

        <div style={{background:WHITE,border:"1px solid #E8E6DF",borderRadius:14,padding:"16px 18px",marginBottom:14}}>
          <Mono color={SLATE} size={8}>Mejora proyectada por etapa</Mono>
          <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:7}}>
            {[...etapaScores].sort((a,b)=>(SCORE_POTENTIALS[b.id]-b.score)-(SCORE_POTENTIALS[a.id]-a.score)).map(e=>{
              const gain=(SCORE_POTENTIALS[e.id]-e.score).toFixed(1);
              const n=getNivel(e.score);
              return(
                <div key={e.id} style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14,flexShrink:0}}>{e.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:12,color:NAVY}}>{e.name}</span>
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:EMERALD}}>+{gain} pts</span>
                    </div>
                    <div style={{height:5,background:"#E8E6DF",borderRadius:3,position:"relative"}}>
                      <div style={{height:"100%",width:`${(e.score/5)*100}%`,background:n.color,borderRadius:3}}/>
                      <div style={{position:"absolute",top:0,left:`${(e.score/5)*100}%`,height:"100%",width:`${((SCORE_POTENTIALS[e.id]-e.score)/5)*100}%`,background:EMERALD+"99",borderRadius:"0 3px 3px 0"}}/>
                    </div>
                  </div>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:EMERALD,flexShrink:0,width:28}}>{SCORE_POTENTIALS[e.id]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{background:WHITE,border:"1px solid #E8E6DF",borderRadius:14,padding:"20px 18px",marginBottom:14}}>
          <Mono color={SLATE} size={8}>Informe completo en PDF</Mono>
          <p style={{fontSize:14,color:"#3A4070",marginTop:8,marginBottom:6,lineHeight:1.65}}>El PDF incluye el diagnóstico completo de cada etapa, las fricciones detectadas, el plan de acción y el puntaje potencial. Listo para imprimir o compartir con tu equipo directivo.</p>
          <div style={{fontSize:12,color:"#6A7090",marginBottom:18,display:"flex",gap:16,flexWrap:"wrap"}}>
            <span>📄 7 etapas analizadas</span>
            <span>🎯 Recomendaciones por etapa</span>
            <span>🖨 Listo para imprimir</span>
          </div>
          {done?(
            <div style={{textAlign:"center",padding:"16px 0",background:"rgba(0,200,150,.06)",borderRadius:10,border:"1px solid rgba(0,200,150,.2)"}}>
              <div style={{fontSize:24,marginBottom:6}}>✅</div>
              <div style={{fontSize:14,color:EMERALD,fontWeight:600,marginBottom:4}}>¡PDF generado!</div>
              <p style={{fontSize:13,color:"#3A4070"}}>Se abrió en una nueva pestaña listo para imprimir o guardar.</p>
              <button onClick={()=>setDone(false)} style={{marginTop:12,padding:"8px 18px",borderRadius:8,border:"1px solid #E8E6DF",background:WHITE,color:"#6A7090",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>Generar de nuevo</button>
            </div>
          ):(
            <button onClick={generatePDF} disabled={generating}
              style={{width:"100%",padding:"16px 0",borderRadius:10,border:"none",cursor:generating?"not-allowed":"pointer",background:generating?"#C0BEB7":NAVY,color:WHITE,fontSize:15,fontFamily:"'DM Sans',sans-serif",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              {generating?<><span>⏳</span> Generando PDF...</>:<><span>📥</span> Descargar informe en PDF</>}
            </button>
          )}
        </div>

        <div style={{background:CREAM,border:"1px solid #E8E6DF",borderRadius:10,padding:"14px 16px",textAlign:"center",marginBottom:14}}>
          <Mono color={SLATE} size={8}>Benchmark regional — próximamente</Mono>
          <p style={{fontSize:13,color:"#3A4070",lineHeight:1.65,marginTop:6}}>Cuando 10 o más universidades completen el diagnóstico, podrás ver cómo estás parado frente a otras instituciones de LATAM.</p>
        </div>
        <div style={{textAlign:"center",paddingTop:4}}><Mono color="#6A7090">CampusLatina × CIeLatam × Salesforce · v1.0</Mono></div>
      </div>
    );
  };

  const TAB_COMPONENTS=[TabResumen,TabRadar,TabEtapas,TabRecs,TabRecibir];
  const CurrentTab=TAB_COMPONENTS[tab];

  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:CREAM,minHeight:"100vh"}}>
      <div style={{position:"sticky",top:0,zIndex:100,background:NAVY_DK,display:"flex",padding:"0 8px",overflowX:"auto"}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:".1em",textTransform:"uppercase",color:tab===i?EMERALD:"rgba(255,255,255,.38)",background:"none",border:"none",borderBottom:tab===i?`2px solid ${EMERALD}`:"2px solid transparent",cursor:"pointer",padding:"12px 10px",whiteSpace:"nowrap"}}>{t}</button>
        ))}
      </div>
      <div style={{maxWidth:680,margin:"0 auto"}}><CurrentTab/></div>
      <div style={{maxWidth:680,margin:"0 auto",padding:"0 18px 44px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={()=>setTab(Math.max(0,tab-1))} disabled={tab===0} style={{padding:"9px 16px",borderRadius:8,border:"1px solid #E8E6DF",background:WHITE,color:tab===0?"#ccc":NAVY,cursor:tab===0?"default":"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>← Anterior</button>
        <Mono color="#6A7090">{tab+1} / {TABS.length}</Mono>
        <button onClick={()=>setTab(Math.min(TABS.length-1,tab+1))} disabled={tab===TABS.length-1} style={{padding:"9px 16px",borderRadius:8,border:"none",background:tab===TABS.length-1?"#ccc":NAVY,color:WHITE,cursor:tab===TABS.length-1?"default":"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>Siguiente →</button>
      </div>
    </div>
  );
}

// ── APP MAIN ─────────────────────────────────────────────
export default function App(){
  const [phase,setPhase]=useState("welcome");
  const [registroData,setRegistroData]=useState({});
  const [respuestas,setRespuestas]=useState({});
  const [quizPos,setQuizPos]=useState({etapa:0,pregunta:0,showIntro:true});
  const [etapasScores,setEtapasScores]=useState({});

  const handleRegister=(data)=>{setRegistroData(data);setPhase("quiz");setQuizPos({etapa:0,pregunta:0,showIntro:true});};

  const handleSelect=(valor)=>{
    const e=ETAPAS_DATA[quizPos.etapa];
    const key=`${e.id}_${quizPos.pregunta}`;
    setRespuestas(prev=>({...prev,[key]:valor}));
  };

  const handleNext=()=>{
    const e=ETAPAS_DATA[quizPos.etapa];
    const isLastP=quizPos.pregunta>=e.preguntas.length-1;
    const isLastE=quizPos.etapa>=ETAPAS_DATA.length-1;
    if(isLastP&&isLastE){
      // calc final scores
      const finalScores={};
      ETAPAS_DATA.forEach(et=>{finalScores[et.id]=calcScore(respuestas,et.id);});
      setEtapasScores(finalScores);
      setPhase("processing");
      setTimeout(()=>setPhase("report"),4000);
    } else if(isLastP){
      // calc score for completed etapa
      const scores={...etapasScores,[e.id]:calcScore(respuestas,e.id)};
      setEtapasScores(scores);
      setQuizPos({etapa:quizPos.etapa+1,pregunta:0,showIntro:true});
    } else {
      setQuizPos({...quizPos,pregunta:quizPos.pregunta+1,showIntro:false});
    }
  };

  const handleBack=()=>{
    if(quizPos.showIntro&&quizPos.etapa===0){setPhase("register");return;}
    if(quizPos.showIntro&&quizPos.etapa>0){
      const prevE=ETAPAS_DATA[quizPos.etapa-1];
      setQuizPos({etapa:quizPos.etapa-1,pregunta:prevE.preguntas.length-1,showIntro:false});
      return;
    }
    if(quizPos.pregunta>0){setQuizPos({...quizPos,pregunta:quizPos.pregunta-1,showIntro:false});return;}
    setQuizPos({...quizPos,showIntro:true});
  };

  if(phase==="welcome") return <Welcome onStart={()=>setPhase("register")}/>;
  if(phase==="register") return <Register onNext={handleRegister}/>;
  if(phase==="processing") return <Processing/>;
  if(phase==="report") return <Report registroData={registroData} respuestas={respuestas}/>;

  const etapa=ETAPAS_DATA[quizPos.etapa];
  if(quizPos.showIntro) return <StageIntro etapa={etapa} onStart={()=>setQuizPos({...quizPos,showIntro:false})} etapasScores={etapasScores}/>;

  const pregunta=etapa.preguntas[quizPos.pregunta];
  const key=`${etapa.id}_${quizPos.pregunta}`;
  const selected=respuestas[key]||null;
  const isLast=quizPos.etapa===ETAPAS_DATA.length-1&&quizPos.pregunta===etapa.preguntas.length-1;

  return(
    <Question
      etapaIdx={quizPos.etapa} preguntaIdx={quizPos.pregunta}
      etapa={etapa} pregunta={pregunta}
      selected={selected} onSelect={handleSelect}
      onNext={handleNext} onBack={handleBack}
      isLast={isLast} etapasScores={etapasScores}
    />
  );
}

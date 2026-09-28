// 7 etapas × 4 preguntas. Contenido original de app_diagnostico_v3.jsx — no editar valores.
export const ETAPAS_DATA = [
  {
    id:"descubrimiento", name:"Descubrimiento", num:1, emoji:"🔭", pregunta:"¿Lo encuentran?",
    resumen:"El aspirante todavía no conoce su universidad. Está buscando opciones en Google, redes sociales o le pregunta a alguien de confianza.",
    contexto:"Evaluamos si su universidad aparece en ese momento, si lo que ve le genera ganas de saber más, y si hay un paso siguiente claro para avanzar.",
    preguntas:[
      {
        texto:"¿Cómo llegan sus aspirantes a conocer su universidad?",
        ayuda:"Piense en qué tan activa es su presencia en los canales donde buscan: los que ya usa y los que todavía no aprovecha (publicidad digital, embajadores, alianzas con colegios o empresas).",
        opciones:[
          {letra:"A",texto:"Nos llegan principalmente por recomendación espontánea o ferias. No invertimos en publicidad digital ni tenemos alianzas o embajadores activos. No sabemos bien de dónde viene cada aspirante.",valor:1},
          {letra:"B",texto:"Hacemos algo de publicidad digital en temporada, tenemos alguna alianza con colegios y algunos estudiantes recomiendan, pero cada acción funciona por separado y sin coordinación ni medición.",valor:2},
          {letra:"C",texto:"Combinamos canales propios, pauta digital planificada y alianzas o embajadores activos. Sabemos cuáles son nuestros canales principales y los gestionamos con responsables definidos.",valor:4},
          {letra:"D",texto:"Operamos una estrategia integrada: pauta optimizada por datos, red de alianzas y embajadores con métricas propias, y trazabilidad completa de qué canal, campaña o referido generó cada aspirante.",valor:5},
        ]
      },
      {
        texto:"¿Su universidad trabaja para aparecer cuando alguien busca dónde estudiar?",
        ayuda:"En Google, en YouTube o cuando le pregunta a una inteligencia artificial como ChatGPT o Gemini.",
        opciones:[
          {letra:"A",texto:"Tenemos un sitio web, pero nadie trabaja el posicionamiento en buscadores ni nos preocupa cómo aparecemos en respuestas de IA.",valor:1},
          {letra:"B",texto:"Hacemos algo de SEO básico, pero no hay estrategia definida ni medimos si estamos apareciendo donde nuestros aspirantes realmente buscan.",valor:2},
          {letra:"C",texto:"Tenemos una estrategia activa de SEO con contenidos planificados, palabras clave definidas y seguimiento de posicionamiento en buscadores.",valor:4},
          {letra:"D",texto:"Además del SEO trabajamos el GEO (posicionamiento en respuestas de IA) y medimos nuestra visibilidad en ambos entornos para capturar al aspirante antes de que llegue a la competencia.",valor:5},
        ]
      },
      {
        texto:"¿Sabe de dónde viene cada aspirante?",
        ayuda:"Con precisión, para cada persona que consulta o se inscribe, y si usa esa información para mejorar sus canales.",
        opciones:[
          {letra:"A",texto:"No tenemos esa información de forma sistemática. A veces preguntamos pero no lo registramos ni lo analizamos.",valor:1},
          {letra:"B",texto:"Tenemos una pregunta de '¿cómo nos conociste?' en algún formulario, pero los datos quedan dispersos y nadie los usa para tomar decisiones.",valor:2},
          {letra:"C",texto:"Registramos el origen de cada aspirante en un sistema centralizado y usamos esa información para ajustar la inversión en canales.",valor:4},
          {letra:"D",texto:"Contamos con trazabilidad completa desde el primer contacto hasta la inscripción: qué canal, qué campaña, qué embajador o alianza generó cada aspirante, y optimizamos en base a eso.",valor:5},
        ]
      },
      {
        texto:"Cuando un aspirante encuentra a su universidad, ¿tiene claro cuál es el paso siguiente?",
        ayuda:"En redes, buscadores o cualquier canal: un paso claro, fácil y específico que lo invite a avanzar.",
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
    id:"exploracion", name:"Exploración", num:2, emoji:"🔎", pregunta:"¿Entienden qué ofrece?",
    resumen:"El aspirante ya sabe que su universidad existe y empieza a investigarla. Entra a su web, mira sus redes, busca opiniones, compara con otras opciones.",
    contexto:"Evaluamos si lo que encuentra le ayuda a decidir, si puede compararte con otras opciones, y si hay algo que lo oriente activamente hacia el siguiente paso.",
    preguntas:[
      {
        texto:"¿Qué tan fácil es entender y comparar su oferta?",
        ayuda:"Qué programas ofrece, a quién están dirigidos, qué los diferencia de otras instituciones y cómo se comparan entre sí.",
        opciones:[
          {letra:"A",texto:"La información existe pero está dispersa o es técnica. No hay forma de comparar programas y el diferencial institucional no está claro.",valor:1},
          {letra:"B",texto:"Tenemos descripciones de cada programa, pero son similares entre sí y no explican con claridad por qué elegir uno u otro ni por qué elegirnos a nosotros.",valor:2},
          {letra:"C",texto:"Cada programa tiene una página clara con duración, modalidad, salida laboral y diferencial. El aspirante puede entender la oferta sin necesidad de consultar.",valor:4},
          {letra:"D",texto:"La oferta está segmentada por perfil de aspirante y tiene herramientas interactivas para comparar programas, con información actualizada y relevante para tomar una decisión.",valor:5},
        ]
      },
      {
        texto:"¿Qué tan buena es la experiencia cuando un aspirante investiga su universidad?",
        ayuda:"En su sitio web y redes, y también en los lugares donde se comparan opciones: Google, portales educativos o foros.",
        opciones:[
          {letra:"A",texto:"El sitio tiene mucha información pero es difícil de navegar. No monitoreamos reseñas ni estamos presentes en espacios de comparación.",valor:1},
          {letra:"B",texto:"Tenemos un sitio funcional y algo de presencia en portales, pero no hay landings específicas por programa ni gestionamos activamente lo que dicen de nosotros en espacios externos.",valor:2},
          {letra:"C",texto:"Contamos con landings por programa, gestionamos nuestro perfil en Google y portales educativos, y respondemos reseñas. La experiencia digital está pensada para el aspirante.",valor:4},
          {letra:"D",texto:"La experiencia digital es integral: landings optimizadas, reputación activamente gestionada en todos los canales de comparación, y posicionamiento en respuestas de IA donde los aspirantes consultan.",valor:5},
        ]
      },
      {
        texto:"¿Muestra evidencia concreta de que estudiar ahí es una buena decisión?",
        ayuda:"Testimonios reales, datos de inserción laboral, rankings o casos de egresados que ayuden al aspirante a confiar.",
        opciones:[
          {letra:"A",texto:"No contamos con testimonios actualizados ni datos de empleabilidad. La credibilidad descansa en la trayectoria o el nombre de la institución.",valor:1},
          {letra:"B",texto:"Tenemos algunos testimonios, pero son genéricos o están desactualizados, y no están ubicados donde el aspirante toma decisiones.",valor:2},
          {letra:"C",texto:"Mostramos testimonios reales y datos de inserción laboral en las páginas de los programas, de forma actualizada y verificable.",valor:4},
          {letra:"D",texto:"Tenemos una estrategia activa de prueba social: casos de éxito por carrera, datos de empleabilidad verificables, eventos presenciales y virtuales para aspirantes, y reseñas en todos los espacios de comparación.",valor:5},
        ]
      },
      {
        texto:"Mientras el aspirante explora, ¿algo lo orienta hacia el próximo paso?",
        ayuda:"En su sitio, redes o materiales: algo que lo guíe activamente, o si lo deja explorar solo.",
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
    id:"activacion", name:"Activación", num:3, emoji:"⚡", pregunta:"¿Responde a tiempo?",
    resumen:"El aspirante da el primer paso: escribe, llama, completa un formulario. Es el momento en el que más rápido se enfría el interés.",
    contexto:"Si no hay respuesta rápida, relevante y que genere motivación, el interés se enfría en minutos y el aspirante elige otra opción. Evaluamos si su universidad está lista para ese momento.",
    preguntas:[
      {
        texto:"¿Qué tan fácil es contactar a su universidad?",
        ayuda:"Desde cualquier dispositivo y por el canal que el aspirante prefiera. Considere también cuántos canales activos y gestionados tiene.",
        opciones:[
          {letra:"A",texto:"Solo tenemos formulario web y teléfono, no siempre activos fuera del horario de oficina. El proceso no está pensado para quien llega desde el celular.",valor:1},
          {letra:"B",texto:"Tenemos formulario, correo y algún canal adicional, pero no todos están activos de forma consistente ni son fáciles de encontrar desde redes sociales.",valor:2},
          {letra:"C",texto:"Ofrecemos al menos tres canales activos y visibles (WhatsApp, formulario, teléfono o chat), con confirmación inmediata de que el mensaje fue recibido.",valor:4},
          {letra:"D",texto:"El primer contacto es fluido desde cualquier canal o dispositivo. Todos los canales están integrados en un mismo sistema y tienen tiempos de respuesta garantizados.",valor:5},
        ]
      },
      {
        texto:"¿Cuánto tarda su universidad en responder una consulta?",
        ayuda:"Desde que el aspirante consulta o deja sus datos, y si la respuesta llega por el mismo canal que usó.",
        opciones:[
          {letra:"A",texto:"La respuesta puede tardar horas o días, depende de quién esté disponible. No hay protocolo de tiempos ni seguimiento de consultas sin respuesta.",valor:1},
          {letra:"B",texto:"Intentamos responder el mismo día, pero los tiempos varían según el canal, la carga del equipo o el horario en que llegó la consulta.",valor:2},
          {letra:"C",texto:"Tenemos tiempos máximos de respuesta definidos por canal (ej: menos de 2 horas por WhatsApp) y un protocolo que se cumple de forma consistente.",valor:4},
          {letra:"D",texto:"La primera respuesta es inmediata o en minutos, con automatización que activa el contacto al instante y deriva a un asesor cuando la consulta lo requiere.",valor:5},
        ]
      },
      {
        texto:"¿Qué tan buena es la primera respuesta que recibe el aspirante?",
        ayuda:"Si es relevante, personalizada y motivadora según el programa consultado y el perfil del aspirante.",
        opciones:[
          {letra:"A",texto:"La respuesta es un mensaje genérico o un PDF con toda la oferta, sin importar qué preguntó el aspirante ni qué programa consultó.",valor:1},
          {letra:"B",texto:"La respuesta intenta ser relevante, pero depende del criterio de quien responde. No hay guía ni plantilla por programa ni componente que genere entusiasmo.",valor:2},
          {letra:"C",texto:"Contamos con plantillas de respuesta por programa que incluyen el programa consultado, un elemento motivacional y un paso siguiente concreto.",valor:4},
          {letra:"D",texto:"La primera respuesta está automatizada y personalizada por programa y canal: celebra el contacto, genera anticipación y activa inmediatamente el deseo de continuar.",valor:5},
        ]
      },
      {
        texto:"¿Cada primer contacto queda registrado para hacerle seguimiento?",
        ayuda:"En un sistema que permita ver el historial y garantizar que nadie se pierda.",
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
    id:"acompanamiento", name:"Acompañamiento", num:4, emoji:"🧭", pregunta:"¿Los acompaña mientras deciden?",
    resumen:"Entre el primer contacto y la decisión puede pasar mucho tiempo. El aspirante sigue comparando, duda, consulta con su familia.",
    contexto:"Evaluamos si su universidad lo sostiene durante ese proceso con contenido relevante y personalizado, o lo deja solo hasta que decide — o se va.",
    preguntas:[
      {
        texto:"Después del primer contacto, ¿hay una secuencia de seguimiento definida?",
        ayuda:"Con cadencia, contenido y canales planificados, o si depende de la iniciativa de cada asesor.",
        opciones:[
          {letra:"A",texto:"No hay proceso definido. Si el aspirante no vuelve a escribir, no se lo contacta. El seguimiento depende de que el asesor se acuerde.",valor:1},
          {letra:"B",texto:"Hay una práctica general de hacer uno o dos contactos adicionales, pero sin secuencia, sin contenido planificado y sin criterio de cuándo insistir o dejar de contactar.",valor:2},
          {letra:"C",texto:"Contamos con una secuencia de seguimiento definida: se sabe cuántos contactos hacer, en qué momento, por qué canal y con qué contenido en cada paso.",valor:4},
          {letra:"D",texto:"El seguimiento está automatizado y se adapta según el comportamiento del aspirante: si abrió un correo, visitó una página o no respondió, el sistema ajusta el próximo contacto.",valor:5},
        ]
      },
      {
        texto:"¿Qué recibe el aspirante mientras decide?",
        ayuda:"Información útil y progresiva que lo ayude a avanzar, o mensajes genéricos que no aportan nada nuevo.",
        opciones:[
          {letra:"A",texto:"Recibe mensajes del tipo '¿pudiste revisar la información?' o 'las inscripciones están abiertas', sin contenido que lo ayude a decidir ni que reactive su interés.",valor:1},
          {letra:"B",texto:"Recibe algo de información sobre el programa de interés, pero los mensajes son iguales para todos sin importar en qué momento del proceso están ni si ya se enfrió.",valor:2},
          {letra:"C",texto:"Los mensajes incluyen contenido relevante según el programa y el momento: testimonios, fechas clave, becas, respuestas a dudas frecuentes y argumentos nuevos para quien se enfrió.",valor:4},
          {letra:"D",texto:"El contenido se adapta según el perfil, el momento del proceso y el comportamiento previo. Quien se enfrió recibe algo distinto a quien sigue activo.",valor:5},
        ]
      },
      {
        texto:"¿El acompañamiento cambia según el perfil del aspirante?",
        ayuda:"Por ejemplo, si es distinto para un joven de primer ingreso, un adulto que trabaja o un profesional que busca un posgrado.",
        opciones:[
          {letra:"A",texto:"No. Todos los aspirantes reciben el mismo proceso y los mismos mensajes, sin importar su perfil, programa o situación personal.",valor:1},
          {letra:"B",texto:"Los asesores intentan adaptar el tono según la conversación, pero por intuición propia. No hay materiales ni protocolos diferenciados por tipo de aspirante.",valor:2},
          {letra:"C",texto:"Tenemos al menos dos perfiles de acompañamiento diferenciados — como ingreso directo vs adulto que trabaja — con mensajes y argumentos distintos para cada uno.",valor:4},
          {letra:"D",texto:"El acompañamiento está segmentado por perfil, programa y momento del proceso, con rutas de comunicación distintas que se activan de forma automática.",valor:5},
        ]
      },
      {
        texto:"¿Los asesores tienen lo necesario para hacer bien su trabajo?",
        ayuda:"Herramientas, métricas y supervisión, y algún mecanismo para detectar y reactivar a quienes dejan de responder.",
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
    id:"decision", name:"Decisión", num:5, emoji:"⚖️", pregunta:"¿Les resuelve las dudas finales?",
    resumen:"El aspirante está listo para decidir, o casi. Aparecen las dudas finales: ¿puedo pagarlo?, ¿y si me arrepiento?, ¿es mejor que la otra opción?",
    contexto:"Evaluamos si su universidad ayuda a resolver esas dudas con información clara, argumentos de cierre y mecanismos que reduzcan el miedo a equivocarse.",
    preguntas:[
      {
        texto:"¿El aspirante puede conocer costos y beneficios sin tener que preguntar?",
        ayuda:"El costo del programa, las formas de pago, las becas y los diferenciales frente a otras instituciones, sin preguntar y esperar.",
        opciones:[
          {letra:"A",texto:"El costo no está publicado y los diferenciales no están sistematizados. Para saber cualquiera de las dos cosas, el aspirante tiene que consultar y esperar días.",valor:1},
          {letra:"B",texto:"El costo general está disponible, pero las condiciones de pago, becas y los argumentos frente a la competencia requieren una consulta adicional y no siempre se responden con claridad.",valor:2},
          {letra:"C",texto:"El costo, las cuotas, las becas y los principales diferenciales frente a otras opciones están publicados de forma clara. El aspirante puede comparar sin necesidad de contactar.",valor:4},
          {letra:"D",texto:"El aspirante puede simular costos, calcular cuotas y conocer los diferenciales con análisis actualizado de la competencia, de forma autónoma y desde cualquier dispositivo.",valor:5},
        ]
      },
      {
        texto:"¿Hay algo que reduzca el miedo del aspirante a equivocarse?",
        ayuda:"Mecanismos concretos como garantías, pruebas gratuitas, opciones de cambio o testimonios de perfiles similares.",
        opciones:[
          {letra:"A",texto:"No hay ningún mecanismo formal. El aspirante decide asumiendo toda la incertidumbre y el riesgo por su cuenta.",valor:1},
          {letra:"B",texto:"Se mencionan informalmente algunas flexibilidades o garantías, pero no están comunicadas de forma clara ni forman parte del proceso de cierre.",valor:2},
          {letra:"C",texto:"Contamos con mecanismos concretos y comunicados: clases de prueba, período de adaptación, opciones de cambio de programa o testimonios de egresados con perfiles similares.",valor:4},
          {letra:"D",texto:"La reducción del riesgo es parte activa de la estrategia de cierre: cada perfil recibe argumentos y garantías específicas respaldados por datos reales de experiencia de estudiantes anteriores.",valor:5},
        ]
      },
      {
        texto:"Cuando el aspirante decide inscribirse, ¿sabe exactamente qué hacer?",
        ayuda:"Qué pasos seguir, en qué plazo y con qué documentos, o si tiene que preguntarlo.",
        opciones:[
          {letra:"A",texto:"El proceso siguiente no está claro. El aspirante tiene que preguntar qué hacer después de decidir y las respuestas no siempre son consistentes entre asesores.",valor:1},
          {letra:"B",texto:"El asesor explica los pasos en la conversación, pero no hay un material de apoyo claro que el aspirante pueda consultar después por su cuenta.",valor:2},
          {letra:"C",texto:"Existe un resumen claro del proceso de inscripción — pasos, documentos, plazos, fecha de inicio — que se comparte en el momento en que el aspirante manifiesta su decisión.",valor:4},
          {letra:"D",texto:"El aspirante recibe automáticamente un resumen personalizado del proceso según su programa y modalidad, con recordatorios de cada paso hasta completar la inscripción.",valor:5},
        ]
      },
      {
        texto:"¿Hay un proceso distinto para quien decide hoy y para quien necesita más tiempo?",
        ayuda:"Por ejemplo, para quien está listo para inscribirse ahora y para quien prefiere hacerlo en el próximo ciclo.",
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
    id:"inscripcion", name:"Inscripción", num:6, emoji:"📝", pregunta:"¿Es fácil inscribirse?",
    resumen:"El aspirante ya decidió. Ahora tiene que completar el trámite. Este es el momento más paradójico: la decisión está tomada, pero la burocracia puede tirar todo abajo.",
    contexto:"Evaluamos si el proceso está diseñado para ser fácil y claro, o si las fricciones administrativas hacen caer una decisión que ya estaba tomada.",
    preguntas:[
      {
        texto:"¿Se puede completar la inscripción sin trámites presenciales?",
        ayuda:"Cuántos pasos requiere, qué tan digitalizados están y si se puede hacer todo desde el celular o la computadora, sin ir en persona ni imprimir documentos.",
        opciones:[
          {letra:"A",texto:"El proceso tiene muchos pasos, requiere documentación extensa y al menos una instancia presencial sin alternativa digital.",valor:1},
          {letra:"B",texto:"La mayoría es digital, pero hay al menos un paso que requiere presencia física, impresión de documentos o validación manual que no puede hacerse de otra forma.",valor:2},
          {letra:"C",texto:"El proceso es mayormente digital y se puede completar desde cualquier dispositivo. Solo quedan excepciones puntuales justificadas.",valor:4},
          {letra:"D",texto:"Inscribirse es 100% digital desde cualquier dispositivo, con carga de documentos en línea, validación automática y confirmación inmediata de cada paso.",valor:5},
        ]
      },
      {
        texto:"Durante la inscripción, ¿el aspirante sabe en qué punto está?",
        ayuda:"En qué paso está, qué le falta completar, cuánto tiempo tiene y qué pasó con su trámite una vez enviado.",
        opciones:[
          {letra:"A",texto:"No hay visibilidad del estado. El aspirante tiene que llamar o escribir para saber si su trámite avanzó o si falta algo.",valor:1},
          {letra:"B",texto:"Recibe alguna notificación por correo, pero no hay una vista clara del estado del proceso ni alertas cuando hay algo pendiente o cuando los plazos se acercan.",valor:2},
          {letra:"C",texto:"El aspirante puede consultar el estado de su inscripción y recibe notificaciones cuando hay algo pendiente o cuando se completa un paso. Los tiempos de procesamiento están comunicados.",valor:4},
          {letra:"D",texto:"Trazabilidad completa en tiempo real: el aspirante ve exactamente en qué paso está, qué falta y recibe recordatorios automáticos antes de que venzan los plazos.",valor:5},
        ]
      },
      {
        texto:"Si surge un problema en la inscripción, ¿el aspirante tiene a quién recurrir?",
        ayuda:"Un error, un documento rechazado o una duda de último momento, y si la ayuda llega de forma rápida y efectiva.",
        opciones:[
          {letra:"A",texto:"No hay canal específico de soporte. El aspirante tiene que llamar al número general, esperar que lo deriven, y el equipo no siempre tiene la información para resolver.",valor:1},
          {letra:"B",texto:"Hay un canal de soporte disponible, pero los tiempos son lentos o el equipo no siempre puede resolver los problemas más frecuentes del proceso.",valor:2},
          {letra:"C",texto:"Contamos con un canal dedicado para inscripciones con tiempos de respuesta rápidos y personas capacitadas. El sistema detecta cuando alguien lleva tiempo sin avanzar.",valor:4},
          {letra:"D",texto:"El soporte es proactivo: el sistema detecta cuando un aspirante lleva tiempo sin avanzar y lo contacta antes de que abandone. Ningún aspirante queda trabado sin intervención.",valor:5},
        ]
      },
      {
        texto:"¿La inscripción hace sentir al aspirante que está tomando una gran decisión?",
        ayuda:"Si su universidad hace algo para que sienta que es la mejor decisión de su vida, o si el trámite es puramente administrativo y burocrático.",
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
    id:"retencion", name:"Retención temprana", num:7, emoji:"🌱", pregunta:"¿Llegan al primer día?",
    resumen:"El estudiante ya se inscribió pero aún no empezó. Entre la inscripción y el primer día, muchos se arrepienten o simplemente no aparecen.",
    contexto:"Es la etapa menos atendida de todo el proceso. Evaluamos si su universidad acompaña ese período con intención o desaparece después de recibir el pago.",
    preguntas:[
      {
        texto:"¿Qué pasa en las horas y días después de confirmar la inscripción?",
        ayuda:"Si su universidad celebra la decisión y genera anticipación por lo que viene.",
        opciones:[
          {letra:"A",texto:"Después de confirmar la inscripción hay silencio. El estudiante recibe quizás un correo de confirmación técnico y nada más hasta que empieza el ciclo.",valor:1},
          {letra:"B",texto:"Enviamos un correo de bienvenida genérico, pero no hay secuencia planificada ni ningún gesto que refuerce que tomaron la mejor decisión.",valor:2},
          {letra:"C",texto:"Contamos con una comunicación de bienvenida personalizada por programa que se envía de forma inmediata, celebra la decisión y anticipa los próximos pasos con entusiasmo.",valor:4},
          {letra:"D",texto:"La bienvenida es una experiencia diseñada: mensaje personalizado, presentación del equipo docente, acceso anticipado a la plataforma y un contacto humano que refuerza el vínculo antes del primer día.",valor:5},
        ]
      },
      {
        texto:"Antes del primer día, ¿el estudiante recibe todo lo que necesita saber?",
        ayuda:"Información clara, progresiva y útil entre la inscripción y el inicio de clases, para arrancar con confianza.",
        opciones:[
          {letra:"A",texto:"No hay comunicación estructurada pre-inicio. El estudiante tiene que buscar por su cuenta los horarios, los accesos a plataformas o los materiales necesarios.",valor:1},
          {letra:"B",texto:"Enviamos uno o dos correos generales antes del inicio, pero sin secuencia planificada ni contenido diferenciado por programa, modalidad o perfil del estudiante.",valor:2},
          {letra:"C",texto:"Tenemos una secuencia de comunicaciones pre-inicio con contenido progresivo: accesos a la plataforma, presentación de docentes, horarios confirmados y respuestas a las dudas más frecuentes.",valor:4},
          {letra:"D",texto:"La comunicación pre-inicio está automatizada y personalizada por programa, modalidad y perfil. Incluye guía práctica del primer día, checklist personalizado y contacto proactivo 24 horas antes del inicio.",valor:5},
        ]
      },
      {
        texto:"¿Detecta a los inscriptos que se están enfriando antes de que empiece el ciclo?",
        ayuda:"Algún mecanismo para identificarlos y actuar antes de que desaparezcan.",
        opciones:[
          {letra:"A",texto:"No. Solo nos enteramos de que alguien no va a empezar cuando no aparece el primer día. No hay sistema de alerta ni seguimiento pre-inicio.",valor:1},
          {letra:"B",texto:"Algunos asesores notan cuando un inscripto no responde, pero no hay un proceso sistemático para identificar señales de riesgo ni un protocolo de acción.",valor:2},
          {letra:"C",texto:"Monitoreamos indicadores básicos de compromiso pre-inicio (apertura de correos, acceso a plataforma) y tenemos un protocolo para contactar a quienes no muestran actividad.",valor:4},
          {letra:"D",texto:"Contamos con un sistema automatizado que detecta señales de enfriamiento y activa alertas para que un asesor intervenga con argumentos preparados antes de que el estudiante desaparezca.",valor:5},
        ]
      },
      {
        texto:"¿El estudiante llega al primer día preparado y con ganas de empezar?",
        ayuda:"Si recibe todo lo que necesita, de forma práctica, clara y personalizada, para empezar sin sorpresas ni confusión.",
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

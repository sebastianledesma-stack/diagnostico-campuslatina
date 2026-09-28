// 7 etapas × 4 preguntas. Contenido original de app_diagnostico_v3.jsx — no editar valores.
export const ETAPAS_DATA = [
  {
    id:"descubrimiento", name:"Descubrimiento", num:1, emoji:"🔭", pregunta:"¿Lo encuentran?",
    resumen:"El aspirante todavía no conoce su universidad. Está buscando opciones en Google, redes sociales o le pregunta a alguien de confianza.",
    contexto:"Evaluamos si su universidad aparece en ese momento, si lo que ve le genera ganas de saber más, y si hay un paso siguiente claro para avanzar.",
    preguntas:[
      {
        texto:"¿Cómo llega la mayoría de sus aspirantes a conocer su universidad, y qué tan activa es su presencia en los canales donde están buscando — tanto los que ya conoce como los que todavía no aprovecha (publicidad digital, embajadores, alianzas con colegios o empresas)?",
        opciones:[
          {letra:"A",texto:"Nos llegan principalmente por recomendación espontánea o ferias. No invertimos en publicidad digital ni tenemos alianzas o embajadores activos. No sabemos bien de dónde viene cada aspirante.",valor:1},
          {letra:"B",texto:"Hacemos algo de publicidad digital en temporada, tenemos alguna alianza con colegios y algunos estudiantes recomiendan, pero cada acción funciona por separado y sin coordinación ni medición.",valor:2},
          {letra:"C",texto:"Combinamos canales propios, pauta digital planificada y alianzas o embajadores activos. Sabemos cuáles son nuestros canales principales y los gestionamos con responsables definidos.",valor:4},
          {letra:"D",texto:"Operamos una estrategia integrada: pauta optimizada por datos, red de alianzas y embajadores con métricas propias, y trazabilidad completa de qué canal, campaña o referido generó cada aspirante.",valor:5},
        ]
      },
      {
        texto:"¿Su universidad trabaja activamente para aparecer cuando alguien busca opciones educativas en Google, YouTube, o le pregunta a una inteligencia artificial como ChatGPT o Gemini?",
        opciones:[
          {letra:"A",texto:"Tenemos un sitio web, pero nadie trabaja el posicionamiento en buscadores ni nos preocupa cómo aparecemos en respuestas de IA.",valor:1},
          {letra:"B",texto:"Hacemos algo de SEO básico, pero no hay estrategia definida ni medimos si estamos apareciendo donde nuestros aspirantes realmente buscan.",valor:2},
          {letra:"C",texto:"Tenemos una estrategia activa de SEO con contenidos planificados, palabras clave definidas y seguimiento de posicionamiento en buscadores.",valor:4},
          {letra:"D",texto:"Además del SEO trabajamos el GEO (posicionamiento en respuestas de IA) y medimos nuestra visibilidad en ambos entornos para capturar al aspirante antes de que llegue a la competencia.",valor:5},
        ]
      },
      {
        texto:"¿Su universidad sabe con precisión de dónde viene cada aspirante que llega a consultar o inscribirse, y usa esa información para mejorar sus canales?",
        opciones:[
          {letra:"A",texto:"No tenemos esa información de forma sistemática. A veces preguntamos pero no lo registramos ni lo analizamos.",valor:1},
          {letra:"B",texto:"Tenemos una pregunta de '¿cómo nos conociste?' en algún formulario, pero los datos quedan dispersos y nadie los usa para tomar decisiones.",valor:2},
          {letra:"C",texto:"Registramos el origen de cada aspirante en un sistema centralizado y usamos esa información para ajustar la inversión en canales.",valor:4},
          {letra:"D",texto:"Contamos con trazabilidad completa desde el primer contacto hasta la inscripción: qué canal, qué campaña, qué embajador o alianza generó cada aspirante, y optimizamos en base a eso.",valor:5},
        ]
      },
      {
        texto:"Cuando un aspirante encuentra a su universidad en redes, buscadores o cualquier canal, ¿hay un paso siguiente claro, fácil y específico que lo invite a avanzar?",
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
        texto:"¿Qué tan fácil es para un aspirante entender qué programas ofrece, a quién están dirigidos, qué los diferencia de otras instituciones, y comparar opciones dentro de su propia oferta?",
        opciones:[
          {letra:"A",texto:"La información existe pero está dispersa o es técnica. No hay forma de comparar programas y el diferencial institucional no está claro.",valor:1},
          {letra:"B",texto:"Tenemos descripciones de cada programa, pero son similares entre sí y no explican con claridad por qué elegir uno u otro ni por qué elegirnos a nosotros.",valor:2},
          {letra:"C",texto:"Cada programa tiene una página clara con duración, modalidad, salida laboral y diferencial. El aspirante puede entender la oferta sin necesidad de consultar.",valor:4},
          {letra:"D",texto:"La oferta está segmentada por perfil de aspirante y tiene herramientas interactivas para comparar programas, con información actualizada y relevante para tomar una decisión.",valor:5},
        ]
      },
      {
        texto:"Cuando un aspirante llega a su sitio web o redes para investigar, ¿qué tan buena es la experiencia — incluyendo cómo está presente en los lugares donde los aspirantes comparan opciones, como Google, portales educativos o foros?",
        opciones:[
          {letra:"A",texto:"El sitio tiene mucha información pero es difícil de navegar. No monitoreamos reseñas ni estamos presentes en espacios de comparación.",valor:1},
          {letra:"B",texto:"Tenemos un sitio funcional y algo de presencia en portales, pero no hay landings específicas por programa ni gestionamos activamente lo que dicen de nosotros en espacios externos.",valor:2},
          {letra:"C",texto:"Contamos con landings por programa, gestionamos nuestro perfil en Google y portales educativos, y respondemos reseñas. La experiencia digital está pensada para el aspirante.",valor:4},
          {letra:"D",texto:"La experiencia digital es integral: landings optimizadas, reputación activamente gestionada en todos los canales de comparación, y posicionamiento en respuestas de IA donde los aspirantes consultan.",valor:5},
        ]
      },
      {
        texto:"¿Su universidad muestra evidencia concreta — testimonios reales, datos de inserción laboral, rankings, casos de egresados — que ayude al aspirante a confiar en que es una buena decisión estudiar ahí?",
        opciones:[
          {letra:"A",texto:"No contamos con testimonios actualizados ni datos de empleabilidad. La credibilidad descansa en la trayectoria o el nombre de la institución.",valor:1},
          {letra:"B",texto:"Tenemos algunos testimonios, pero son genéricos o están desactualizados, y no están ubicados donde el aspirante toma decisiones.",valor:2},
          {letra:"C",texto:"Mostramos testimonios reales y datos de inserción laboral en las páginas de los programas, de forma actualizada y verificable.",valor:4},
          {letra:"D",texto:"Tenemos una estrategia activa de prueba social: casos de éxito por carrera, datos de empleabilidad verificables, eventos presenciales y virtuales para aspirantes, y reseñas en todos los espacios de comparación.",valor:5},
        ]
      },
      {
        texto:"Mientras un aspirante navega su sitio, redes o materiales, ¿hay algo que lo oriente activamente hacia dar el próximo paso, o lo deja explorar solo?",
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
        texto:"¿Qué tan fácil es para un aspirante contactarte — desde cualquier dispositivo y por el canal que él prefiera — y cuántos canales activos y gestionados tiene disponibles?",
        opciones:[
          {letra:"A",texto:"Solo tenemos formulario web y teléfono, no siempre activos fuera del horario de oficina. El proceso no está pensado para quien llega desde el celular.",valor:1},
          {letra:"B",texto:"Tenemos formulario, correo y algún canal adicional, pero no todos están activos de forma consistente ni son fáciles de encontrar desde redes sociales.",valor:2},
          {letra:"C",texto:"Ofrecemos al menos tres canales activos y visibles (WhatsApp, formulario, teléfono o chat), con confirmación inmediata de que el mensaje fue recibido.",valor:4},
          {letra:"D",texto:"El primer contacto es fluido desde cualquier canal o dispositivo. Todos los canales están integrados en un mismo sistema y tienen tiempos de respuesta garantizados.",valor:5},
        ]
      },
      {
        texto:"Cuando un aspirante hace una consulta o deja sus datos, ¿cuánto tarda su universidad en responderle, y esa respuesta llega por el canal que él usó?",
        opciones:[
          {letra:"A",texto:"La respuesta puede tardar horas o días, depende de quién esté disponible. No hay protocolo de tiempos ni seguimiento de consultas sin respuesta.",valor:1},
          {letra:"B",texto:"Intentamos responder el mismo día, pero los tiempos varían según el canal, la carga del equipo o el horario en que llegó la consulta.",valor:2},
          {letra:"C",texto:"Tenemos tiempos máximos de respuesta definidos por canal (ej: menos de 2 horas por WhatsApp) y un protocolo que se cumple de forma consistente.",valor:4},
          {letra:"D",texto:"La primera respuesta es inmediata o en minutos, con automatización que activa el contacto al instante y deriva a un asesor cuando la consulta lo requiere.",valor:5},
        ]
      },
      {
        texto:"Cuando su universidad responde el primer contacto, ¿qué tan relevante, personalizada y motivadora es esa respuesta — en relación al programa consultado y al perfil del aspirante?",
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
    id:"acompanamiento", name:"Acompañamiento", num:4, emoji:"🧭", pregunta:"¿Los acompaña mientras deciden?",
    resumen:"Entre el primer contacto y la decisión puede pasar mucho tiempo. El aspirante sigue comparando, duda, consulta con su familia.",
    contexto:"Evaluamos si su universidad lo sostiene durante ese proceso con contenido relevante y personalizado, o lo deja solo hasta que decide — o se va.",
    preguntas:[
      {
        texto:"Después del primer contacto, ¿su universidad tiene una secuencia de seguimiento definida — con cadencia, contenido y canales planificados — o el seguimiento depende de la iniciativa de cada asesor?",
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
    id:"decision", name:"Decisión", num:5, emoji:"⚖️", pregunta:"¿Les resuelve las dudas finales?",
    resumen:"El aspirante está listo para decidir, o casi. Aparecen las dudas finales: ¿puedo pagarlo?, ¿y si me arrepiento?, ¿es mejor que la otra opción?",
    contexto:"Evaluamos si su universidad ayuda a resolver esas dudas con información clara, argumentos de cierre y mecanismos que reduzcan el miedo a equivocarse.",
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
        texto:"¿Su universidad ofrece algún mecanismo concreto que reduzca el miedo del aspirante a equivocarse en su decisión — como garantías, pruebas gratuitas, opciones de cambio o testimonios de perfiles similares?",
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
        texto:"¿Su universidad tiene un proceso diferenciado para el aspirante que está listo para inscribirse hoy y para el que necesita más tiempo o quiere hacerlo en el próximo ciclo?",
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
        texto:"Durante el proceso de inscripción, ¿su universidad hace algo para que el aspirante sienta que está tomando la mejor decisión de su vida, o el trámite es puramente administrativo y burocrático?",
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
        texto:"¿Qué hace su universidad en las horas y días inmediatos después de confirmar una inscripción — y esa respuesta incluye algo que celebre la decisión y genere anticipación por lo que viene?",
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
        texto:"¿Su universidad tiene algún mecanismo para detectar a los estudiantes inscriptos que se están enfriando antes de que empiece el ciclo, y actuar antes de que desaparezcan?",
        opciones:[
          {letra:"A",texto:"No. Solo nos enteramos de que alguien no va a empezar cuando no aparece el primer día. No hay sistema de alerta ni seguimiento pre-inicio.",valor:1},
          {letra:"B",texto:"Algunos asesores notan cuando un inscripto no responde, pero no hay un proceso sistemático para identificar señales de riesgo ni un protocolo de acción.",valor:2},
          {letra:"C",texto:"Monitoreamos indicadores básicos de compromiso pre-inicio (apertura de correos, acceso a plataforma) y tenemos un protocolo para contactar a quienes no muestran actividad.",valor:4},
          {letra:"D",texto:"Contamos con un sistema automatizado que detecta señales de enfriamiento y activa alertas para que un asesor intervenga con argumentos preparados antes de que el estudiante desaparezca.",valor:5},
        ]
      },
      {
        texto:"¿Su universidad le da al estudiante inscripto todo lo que necesita — de forma práctica, clara y personalizada — para llegar al primer día sin sorpresas, sin confusión y con ganas de empezar?",
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

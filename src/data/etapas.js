// 7 etapas × 4 preguntas. Contenido original de app_diagnostico_v3.jsx — no editar valores.
export const ETAPAS_DATA = [
  {
    id:"descubrimiento", name:"Descubrimiento", num:1, emoji:"🔭", pregunta:"¿Lo encuentran?",
    resumen:"El aspirante todavía no conoce su universidad. Está buscando opciones en Google, redes sociales o le pregunta a alguien de confianza.",
    contexto:"Evaluamos si su universidad aparece en ese momento, si lo que ve le genera ganas de saber más, y si hay un paso siguiente claro para avanzar.",
    preguntas:[
      {
        texto:"¿Cómo llegan sus aspirantes a conocer su universidad?",
        ayuda:"Publicidad, alianzas con colegios, embajadores y recomendaciones.",
        opciones:[
          {letra:"A",etiqueta:"Solo boca a boca y ferias.",texto:"Sin publicidad digital, alianzas ni embajadores.",valor:1},
          {letra:"B",etiqueta:"Acciones sueltas.",texto:"Algo de publicidad y alianzas, sin coordinación ni medición.",valor:2},
          {letra:"C",etiqueta:"Canales planificados.",texto:"Pauta, alianzas y embajadores, cada canal con un responsable.",valor:4},
          {letra:"D",etiqueta:"Estrategia integrada y medida.",texto:"El presupuesto de cada canal se ajusta según los aspirantes que trae.",valor:5},
        ]
      },
      {
        texto:"¿Su universidad trabaja para aparecer cuando alguien busca dónde estudiar?",
        ayuda:"En Google y en las respuestas de asistentes de IA como ChatGPT.",
        opciones:[
          {letra:"A",etiqueta:"Nadie se ocupa.",texto:"Hay sitio web, pero no se trabaja el posicionamiento.",valor:1},
          {letra:"B",etiqueta:"SEO básico, sin estrategia.",texto:"No medimos si aparecemos donde buscan los aspirantes.",valor:2},
          {letra:"C",etiqueta:"Estrategia de SEO activa.",texto:"Contenidos planificados, palabras clave y seguimiento de posiciones.",valor:4},
          {letra:"D",etiqueta:"SEO y presencia en IA.",texto:"Medimos la visibilidad en buscadores y en respuestas de IA.",valor:5},
        ]
      },
      {
        texto:"¿Sabe de dónde viene cada aspirante?",
        ayuda:"Qué canal, campaña o persona lo trajo.",
        opciones:[
          {letra:"A",etiqueta:"No lo sabemos.",texto:"A veces se pregunta, pero no se registra.",valor:1},
          {letra:"B",etiqueta:"Datos sueltos.",texto:"Hay un \"¿cómo nos conoció?\", pero nadie usa esos datos.",valor:2},
          {letra:"C",etiqueta:"Registrado y usado.",texto:"El origen queda en un sistema y guía la inversión en canales.",valor:4},
          {letra:"D",etiqueta:"Trazabilidad completa.",texto:"Del primer contacto a la inscripción, y se optimiza con eso.",valor:5},
        ]
      },
      {
        texto:"Cuando un aspirante encuentra a su universidad, ¿tiene claro cuál es el paso siguiente?",
        ayuda:"En redes, el sitio web o cualquier otro punto de contacto.",
        opciones:[
          {letra:"A",etiqueta:"No hay un paso claro.",texto:"Tiene que descubrir solo qué hacer después.",valor:1},
          {letra:"B",etiqueta:"Botones genéricos.",texto:"\"Más información\" o \"Contacto\", sin medir quién avanza.",valor:2},
          {letra:"C",etiqueta:"Un paso concreto por canal.",texto:"Formulario, programa o charla, según dónde llegó.",valor:4},
          {letra:"D",etiqueta:"Personalizado y medido.",texto:"Según canal y perfil, y se mide cuántos avanzan.",valor:5},
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
        ayuda:"Carreras, duración, modalidad, salida laboral y diferencial.",
        opciones:[
          {letra:"A",etiqueta:"Difícil.",texto:"Información dispersa o técnica, sin un diferencial claro.",valor:1},
          {letra:"B",etiqueta:"Hay información, pero no convence.",texto:"Programas parecidos entre sí, sin explicar por qué elegirlos.",valor:2},
          {letra:"C",etiqueta:"Clara por programa.",texto:"Se entiende la oferta sin tener que consultar.",valor:4},
          {letra:"D",etiqueta:"Comparable y por perfil.",texto:"Herramientas para comparar programas según cada tipo de aspirante.",valor:5},
        ]
      },
      {
        texto:"¿Qué tan buena es la experiencia cuando un aspirante investiga su universidad?",
        ayuda:"El sitio web, Google, portales educativos y reseñas.",
        opciones:[
          {letra:"A",etiqueta:"Confusa.",texto:"Sitio difícil de navegar; no se siguen las reseñas.",valor:1},
          {letra:"B",etiqueta:"Funcional, sin gestión externa.",texto:"Sitio correcto, sin páginas por programa ni manejo de reseñas.",valor:2},
          {letra:"C",etiqueta:"Pensada para el aspirante.",texto:"Páginas por programa, perfil de Google cuidado y reseñas respondidas.",valor:4},
          {letra:"D",etiqueta:"Gestionada y medida.",texto:"Además, se mide qué páginas y fuentes llevan a contactarnos.",valor:5},
        ]
      },
      {
        texto:"¿Muestra evidencia concreta de que estudiar ahí es una buena decisión?",
        ayuda:"Testimonios, datos de empleo de egresados y casos de éxito.",
        opciones:[
          {letra:"A",etiqueta:"No hay evidencia.",texto:"Solo el nombre y la trayectoria de la institución.",valor:1},
          {letra:"B",etiqueta:"Poca o desactualizada.",texto:"Algunos testimonios genéricos, lejos de donde se decide.",valor:2},
          {letra:"C",etiqueta:"Real y visible.",texto:"Testimonios y datos de empleo actualizados en cada programa.",valor:4},
          {letra:"D",etiqueta:"Estrategia de prueba social.",texto:"Casos por carrera, datos verificables y eventos con egresados.",valor:5},
        ]
      },
      {
        texto:"Mientras el aspirante explora, ¿algo lo orienta hacia el próximo paso?",
        ayuda:"Chat, botones de contacto o formularios en el momento justo.",
        opciones:[
          {letra:"A",etiqueta:"Nada.",texto:"Navega solo y, si no encuentra lo que busca, se va.",valor:1},
          {letra:"B",etiqueta:"Solo navegación básica.",texto:"Menús y enlaces, sin invitarlo a una acción concreta.",valor:2},
          {letra:"C",etiqueta:"Contacto visible.",texto:"Chat, botones y formularios en las páginas clave.",valor:4},
          {letra:"D",etiqueta:"Guía según su recorrido.",texto:"El sitio le ofrece el paso más relevante según lo que miró.",valor:5},
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
        ayuda:"Por el canal que prefiera el aspirante y desde el celular.",
        opciones:[
          {letra:"A",etiqueta:"Pocos canales, en horario de oficina.",texto:"Formulario y teléfono; incómodo desde el celular.",valor:1},
          {letra:"B",etiqueta:"Varios canales, desparejos.",texto:"No todos responden siempre ni son fáciles de encontrar.",valor:2},
          {letra:"C",etiqueta:"Tres o más canales activos.",texto:"WhatsApp, formulario, teléfono o chat, con confirmación de recepción.",valor:4},
          {letra:"D",etiqueta:"Todo integrado.",texto:"Todos los canales en un mismo sistema, con tiempos garantizados.",valor:5},
        ]
      },
      {
        texto:"¿Cuánto tarda su universidad en responder una consulta?",
        ayuda:"Desde que el aspirante escribe o deja sus datos.",
        opciones:[
          {letra:"A",etiqueta:"Sin tiempo definido.",texto:"Puede tardar más de un día, según quién esté.",valor:1},
          {letra:"B",etiqueta:"El mismo día, si se puede.",texto:"Varía según el canal, la carga y el horario.",valor:2},
          {letra:"C",etiqueta:"Menos de 2 horas, con protocolo.",texto:"Hay un tiempo máximo por canal y se cumple.",valor:4},
          {letra:"D",etiqueta:"En minutos, automático.",texto:"Respuesta inmediata y un asesor sigue cuando hace falta.",valor:5},
        ]
      },
      {
        texto:"¿Qué tan buena es la primera respuesta que recibe el aspirante?",
        ayuda:"Si responde lo que preguntó y lo invita a seguir.",
        opciones:[
          {letra:"A",etiqueta:"Genérica.",texto:"Un mensaje estándar o un PDF con toda la oferta.",valor:1},
          {letra:"B",etiqueta:"Depende de quién responda.",texto:"Sin guía ni plantillas por programa.",valor:2},
          {letra:"C",etiqueta:"Plantillas por programa.",texto:"Responde lo consultado y propone un paso siguiente.",valor:4},
          {letra:"D",etiqueta:"Automática y personalizada.",texto:"Según programa y canal; un asesor continúa con el contexto.",valor:5},
        ]
      },
      {
        texto:"¿Cada primer contacto queda registrado para hacerle seguimiento?",
        ayuda:"En un sistema donde nadie se pierda.",
        opciones:[
          {letra:"A",etiqueta:"Disperso.",texto:"Correo, celulares y planillas; no sabemos a quién falta responder.",valor:1},
          {letra:"B",etiqueta:"Registro manual e incompleto.",texto:"Depende de que cada asesor lo cargue.",valor:2},
          {letra:"C",etiqueta:"CRM centralizado.",texto:"Cada contacto con programa, canal de origen y estado.",valor:4},
          {letra:"D",etiqueta:"Registro automático con alertas.",texto:"Historial completo; el sistema avisa si alguien queda sin atender.",valor:5},
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
        ayuda:"Cuántos contactos, cuándo, por qué canal y con qué contenido.",
        opciones:[
          {letra:"A",etiqueta:"No hay seguimiento.",texto:"Si no vuelve a escribir, no se lo contacta.",valor:1},
          {letra:"B",etiqueta:"Uno o dos intentos sueltos.",texto:"Sin secuencia ni criterio de cuándo insistir.",valor:2},
          {letra:"C",etiqueta:"Secuencia definida.",texto:"Se sabe qué contacto hacer, cuándo y por qué canal.",valor:4},
          {letra:"D",etiqueta:"Automática y adaptable.",texto:"El próximo contacto cambia según lo que hizo el aspirante.",valor:5},
        ]
      },
      {
        texto:"¿Qué recibe el aspirante mientras decide?",
        ayuda:"El contenido de los mensajes, no solo la cantidad.",
        opciones:[
          {letra:"A",etiqueta:"Solo recordatorios.",texto:"\"¿Pudo ver la información?\" o \"Inscripciones abiertas\".",valor:1},
          {letra:"B",etiqueta:"Lo mismo para todos.",texto:"Información del programa, igual para cualquier aspirante.",valor:2},
          {letra:"C",etiqueta:"Contenido útil por programa.",texto:"Testimonios, fechas, becas y respuestas a dudas frecuentes.",valor:4},
          {letra:"D",etiqueta:"Según su comportamiento.",texto:"Quien se enfrió recibe algo distinto de quien sigue activo.",valor:5},
        ]
      },
      {
        texto:"¿El acompañamiento cambia según el perfil del aspirante?",
        ayuda:"Por ejemplo, alguien que termina el secundario y un adulto que trabaja.",
        opciones:[
          {letra:"A",etiqueta:"Igual para todos.",texto:"Mismo proceso y mismos mensajes para cualquier perfil.",valor:1},
          {letra:"B",etiqueta:"Según el asesor.",texto:"Cada uno adapta el tono por intuición.",valor:2},
          {letra:"C",etiqueta:"Dos o más perfiles definidos.",texto:"Con mensajes y argumentos distintos para cada uno.",valor:4},
          {letra:"D",etiqueta:"Rutas automáticas por perfil.",texto:"Según perfil, programa y momento del proceso.",valor:5},
        ]
      },
      {
        texto:"¿Los asesores tienen lo necesario para hacer bien su trabajo?",
        ayuda:"Herramientas, metas y forma de detectar a quien se enfría.",
        opciones:[
          {letra:"A",etiqueta:"Cada uno a su manera.",texto:"Sin herramientas comunes, metas ni supervisión.",valor:1},
          {letra:"B",etiqueta:"Reuniones y poco más.",texto:"Sin métricas por asesor ni forma de reactivar a quien se enfría.",valor:2},
          {letra:"C",etiqueta:"Sistema y metas.",texto:"Hay un protocolo para reactivar aspirantes inactivos.",valor:4},
          {letra:"D",etiqueta:"Tableros y alertas en tiempo real.",texto:"El sistema detecta quién se enfría y activa la reactivación.",valor:5},
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
        ayuda:"Arancel, cuotas, becas y por qué elegirlos.",
        opciones:[
          {letra:"A",etiqueta:"Hay que consultar.",texto:"Costos y diferenciales no publicados; la respuesta tarda días.",valor:1},
          {letra:"B",etiqueta:"Solo el costo general.",texto:"Cuotas, becas y diferenciales requieren consultar.",valor:2},
          {letra:"C",etiqueta:"Todo publicado.",texto:"Costos, cuotas, becas y diferenciales, claros y comparables.",valor:4},
          {letra:"D",etiqueta:"Simulador propio.",texto:"Calcula cuotas y becas por su cuenta, desde cualquier dispositivo.",valor:5},
        ]
      },
      {
        texto:"¿Hay algo que reduzca el miedo del aspirante a equivocarse?",
        ayuda:"Clases de prueba, cambio de carrera o testimonios de perfiles similares.",
        opciones:[
          {letra:"A",etiqueta:"Nada.",texto:"El aspirante asume solo toda la incertidumbre.",valor:1},
          {letra:"B",etiqueta:"Solo de palabra.",texto:"Algunas flexibilidades, pero no se comunican con claridad.",valor:2},
          {letra:"C",etiqueta:"Mecanismos concretos y comunicados.",texto:"Clase de prueba, período de adaptación o cambio de programa.",valor:4},
          {letra:"D",etiqueta:"Garantías por perfil, con datos.",texto:"Argumentos respaldados por la experiencia de estudiantes similares.",valor:5},
        ]
      },
      {
        texto:"Cuando el aspirante decide inscribirse, ¿sabe exactamente qué hacer?",
        ayuda:"Pasos, documentos, plazos y fecha de inicio.",
        opciones:[
          {letra:"A",etiqueta:"No está claro.",texto:"Tiene que preguntar y las respuestas varían según el asesor.",valor:1},
          {letra:"B",etiqueta:"Se lo explican, sin material.",texto:"El asesor cuenta los pasos, pero no queda nada escrito.",valor:2},
          {letra:"C",etiqueta:"Resumen escrito.",texto:"Pasos, documentos y plazos apenas manifiesta su decisión.",valor:4},
          {letra:"D",etiqueta:"Guía personalizada con recordatorios.",texto:"Según su programa, con aviso de cada paso hasta terminar.",valor:5},
        ]
      },
      {
        texto:"¿Hay un proceso distinto para quien decide hoy y para quien necesita más tiempo?",
        ayuda:"Quien no se inscribe ahora, pero podría hacerlo el próximo ciclo.",
        opciones:[
          {letra:"A",etiqueta:"Se lo da por perdido.",texto:"No se mantiene el vínculo.",valor:1},
          {letra:"B",etiqueta:"Seguimiento esporádico.",texto:"Algunos asesores lo retoman, sin criterio común.",valor:2},
          {letra:"C",etiqueta:"Proceso manual definido.",texto:"El equipo los clasifica y los recontacta antes del próximo ciclo.",valor:4},
          {letra:"D",etiqueta:"Ruta automática de largo plazo.",texto:"Mensajes según su momento y reactivación antes de cada ciclo.",valor:5},
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
        ayuda:"Desde el celular, sin imprimir ni ir a la sede.",
        opciones:[
          {letra:"A",etiqueta:"Presencial y extensa.",texto:"Muchos pasos y documentos, con al menos una visita obligatoria.",valor:1},
          {letra:"B",etiqueta:"Casi digital.",texto:"Queda al menos un paso presencial o una validación manual.",valor:2},
          {letra:"C",etiqueta:"Todo en línea.",texto:"También desde el celular; lo presencial es la excepción.",valor:4},
          {letra:"D",etiqueta:"Digital y sin esperas.",texto:"Validación automática y confirmación inmediata de cada paso.",valor:5},
        ]
      },
      {
        texto:"Durante la inscripción, ¿el aspirante sabe en qué punto está?",
        ayuda:"Qué hizo, qué le falta y cuándo vence cada plazo.",
        opciones:[
          {letra:"A",etiqueta:"No lo sabe.",texto:"Tiene que llamar o escribir para saber si avanzó.",valor:1},
          {letra:"B",etiqueta:"Algún correo suelto.",texto:"Sin una vista del estado ni aviso de pendientes.",valor:2},
          {letra:"C",etiqueta:"Puede consultar su estado.",texto:"Y recibe un aviso cuando completa un paso o le falta algo.",valor:4},
          {letra:"D",etiqueta:"Estado en tiempo real.",texto:"Con recordatorios automáticos antes de cada vencimiento.",valor:5},
        ]
      },
      {
        texto:"Si surge un problema en la inscripción, ¿el aspirante tiene a quién recurrir?",
        ayuda:"Durante el trámite de inscripción.",
        opciones:[
          {letra:"A",etiqueta:"Al número general.",texto:"Lo derivan y no siempre pueden resolverlo.",valor:1},
          {letra:"B",etiqueta:"Hay soporte, pero lento.",texto:"No siempre resuelve los problemas frecuentes.",valor:2},
          {letra:"C",etiqueta:"Canal dedicado y rápido.",texto:"Con personas capacitadas para inscripciones.",valor:4},
          {letra:"D",etiqueta:"Soporte proactivo.",texto:"Se detecta a quien se trabó y se lo contacta antes de que abandone.",valor:5},
        ]
      },
      {
        texto:"¿La inscripción hace sentir al aspirante que está tomando una gran decisión?",
        ayuda:"Más allá del trámite: si genera entusiasmo por lo que viene.",
        opciones:[
          {letra:"A",etiqueta:"Puro trámite.",texto:"Nada refuerza la decisión.",valor:1},
          {letra:"B",etiqueta:"Una bienvenida y nada más.",texto:"El entusiasmo se pierde en el resto del trámite.",valor:2},
          {letra:"C",etiqueta:"Algún refuerzo en el camino.",texto:"Un mensaje, un testimonio o un adelanto de lo que viene.",valor:4},
          {letra:"D",etiqueta:"Diseñada para entusiasmar.",texto:"Cada paso celebra el avance y anticipa el inicio.",valor:5},
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
        ayuda:"Entre la inscripción y el primer día de clases.",
        opciones:[
          {letra:"A",etiqueta:"Silencio.",texto:"Un correo técnico de confirmación y nada más.",valor:1},
          {letra:"B",etiqueta:"Bienvenida genérica.",texto:"Un correo igual para todos, sin seguimiento.",valor:2},
          {letra:"C",etiqueta:"Bienvenida personalizada.",texto:"Inmediata, por programa, celebrando la decisión.",valor:4},
          {letra:"D",etiqueta:"Experiencia de bienvenida.",texto:"Contacto humano, docentes presentados y acceso anticipado a la plataforma.",valor:5},
        ]
      },
      {
        texto:"Antes del primer día, ¿el estudiante recibe todo lo que necesita saber?",
        ayuda:"Horarios, accesos, materiales y dudas frecuentes.",
        opciones:[
          {letra:"A",etiqueta:"Tiene que buscarlo solo.",texto:"No hay comunicación previa al inicio.",valor:1},
          {letra:"B",etiqueta:"Uno o dos correos generales.",texto:"Iguales para todos los programas.",valor:2},
          {letra:"C",etiqueta:"Secuencia planificada.",texto:"Contenido progresivo por programa y modalidad.",valor:4},
          {letra:"D",etiqueta:"Automática y personalizada.",texto:"Se ajusta a lo que cada estudiante ya abrió o completó.",valor:5},
        ]
      },
      {
        texto:"¿Detecta a los inscriptos que se están enfriando antes de que empiece el ciclo?",
        ayuda:"Quienes no abren mensajes ni entran a la plataforma.",
        opciones:[
          {letra:"A",etiqueta:"No.",texto:"Nos enteramos cuando no aparece el primer día.",valor:1},
          {letra:"B",etiqueta:"Solo si un asesor lo nota.",texto:"Sin señales definidas ni protocolo de acción.",valor:2},
          {letra:"C",etiqueta:"Indicadores y protocolo.",texto:"Se contacta a quien no muestra actividad.",valor:4},
          {letra:"D",etiqueta:"Alertas automáticas.",texto:"Un asesor interviene apenas aparecen señales de riesgo.",valor:5},
        ]
      },
      {
        texto:"¿El estudiante llega al primer día preparado y con ganas de empezar?",
        ayuda:"Sabe dónde ir, cómo entrar a los sistemas y qué traer.",
        opciones:[
          {letra:"A",etiqueta:"Lo descubre solo.",texto:"No hay preparación práctica para el primer día.",valor:1},
          {letra:"B",etiqueta:"Información parcial.",texto:"Horario y aula, sin anticipar las dudas típicas.",valor:2},
          {letra:"C",etiqueta:"Preparado.",texto:"Probó sus accesos, sabe dónde ir y tiene a quién preguntar.",valor:4},
          {letra:"D",etiqueta:"Acompañado de punta a punta.",texto:"Simulacro de acceso, video del docente y contacto la noche anterior.",valor:5},
        ]
      },
    ]
  },
];

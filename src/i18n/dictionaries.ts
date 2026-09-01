import type { Locale } from "./config";

export type Dictionary = {
  nav: {
    about: string;
    excursions: string;
    transfers: string;
    cruises: string;
    houses: string;
    contact: string;
    cart: string;
    manageBooking: string;
  };
  common: {
    from: string;
    book: string;
    view: string;
    seeAll: string;
    loading: string;
    send: string;
    phone: string;
    email: string;
    continue: string;
    backHome: string;
    max: string;
    adults: string;
    children: string;
    date: string;
    total: string;
    required: string;
    processing: string;
    close: string;
  };
  home: {
    ctaOffers: string;
    ctaCruise: string;
    marquee: string;
    advantages: string[];
    toursTitle: string;
    toursKicker: string;
    transfersKicker: string;
    transfersTitle: string;
    transfersCta: string;
    cruisesKicker: string;
    cruisesTitle: string;
    cruisesCta: string;
    agencyKicker: string;
    agencyTitle: string;
    agencyBody: string;
    agencyCta: string;
    islandKicker: string;
    islandTitle: string;
    islandBody: string;
    islandCta: string;
    reviewsKicker: string;
    reviewsTitle: string;
    reviewsSubtitle: string;
    reviewsBasedOn: string;
    reviewsCta: string;
    reviewsTraveler: string;
  };
  footer: {
    blurb: string;
    explore: string;
    contact247: string;
    privacy: string;
    terms: string;
    rights: string;
  };
  excursions: {
    title: string;
    subtitle: string;
    faqTitle: string;
    cruiseHint: string;
    cruiseLink: string;
    faqs: { q: string; a: string }[];
  };
  transfers: {
    title: string;
    airportHotel: string;
    hotelAirport: string;
    roundTrip: string;
    tableTitle: string;
    destination: string;
    duration: string;
    oneWay: string;
    return: string;
    extraPerson: string;
    faqTitle: string;
    faqs: { q: string; a: string }[];
  };
  cruises: {
    title: string;
    select: string;
    pickup: string;
    pickupText: string;
    return: string;
    returnText: string;
    essentials: string;
    essentialsText: string;
    recommended: string;
    recommendedText: string;
    privateTitle: string;
    privateText: string;
    scheduleKicker: string;
    scheduleTitle: string;
    scheduleText: string;
    scheduleEmpty: string;
    filterMonth: string;
    searchShip: string;
    searchPlaceholder: string;
    noResults: string;
    shipSingular: string;
    shipPlural: string;
    shipsToday: string;
    browseTitle: string;
    browseSubtitle: string;
    selectCruise: string;
    companiesTitle: string;
    companySailings: string;
    upcomingCruises: string;
    shipSailings: string;
    departure: string;
    nights: string;
    nightSingular: string;
    nightPlural: string;
    viewItinerary: string;
    noSailings: string;
    otherCompanies: string;
    itineraryTitle: string;
    callDay: string;
    seaDay: string;
    atSea: string;
    noToursYet: string;
    moreInfo: string;
    meetingPoint: string;
    meetingPointTitle: string;
    meetingPointBody: string;
    bookTour: string;
    placesToVisit: string;
    durationLabel: string;
    smallGroupMax: string;
    durationHours: string;
    breadcrumbCruises: string;
    seeExcursionsForShip: string;
    calendarHint: string;
    bookTourTitle: string;
    selectPassengers: string;
    passengerSingular: string;
    passengerPlural: string;
    perPerson: string;
    bookingTotal: string;
    confirmBooking: string;
    included: string;
    notIncluded: string;
    goToCart: string;
    dateCalendarKicker: string;
    dateCalendarTitle: string;
    dateCalendarText: string;
    dateCalendarLegend: string;
    dateCalendarEmptyDay: string;
    dateCalendarPickDay: string;
    dateCalendarNoItinerary: string;
    prevMonth: string;
    nextMonth: string;
    orBrowseByCompany: string;
  };
  about: {
    welcome: string;
    mission: string;
    missionText: string;
    vision: string;
    visionText: string;
    values: string;
    promise: string;
    contact: string;
    seeExcursions: string;
  };
  houses: {
    title: string;
    subtitle: string;
    cta: string;
    empty: string;
    guests: string;
    bedrooms: string;
    size: string;
  };
  contact: {
    title: string;
    subtitle: string;
    formTitle: string;
    infoTitle: string;
    name: string;
    message: string;
    send: string;
    sending: string;
    success: string;
    address: string;
  };
  cart: {
    title: string;
    empty: string;
    seeExcursions: string;
    hotel: string;
    payment: string;
    checkout: string;
    remove: string;
    now: string;
    cashDay: string;
  };
  manage: {
    title: string;
    subtitle: string;
    bookingId: string;
    lookup: string;
    searching: string;
    activity: string;
    people: string;
    status: string;
    payment: string;
    help: string;
    viewVoucher: string;
    cancelBooking: string;
    printVoucher: string;
  };
  cancel: {
    title: string;
    subtitle: string;
    intro: string;
    continue: string;
    back: string;
    backManage: string;
    whichService: string;
    serviceDate: string;
    passengers: string;
    freeCancel: string;
    feeCancel: string;
    reasonTitle: string;
    reasons: { id: string; label: string }[];
    submit: string;
    cancelling: string;
    doneTitle: string;
    success: string;
    alreadyCancelled: string;
    alreadyCompleted: string;
    statusPending: string;
    statusConfirmed: string;
    statusCompleted: string;
    statusCancelled: string;
  };
  voucher: {
    title: string;
    subtitle: string;
    issued: string;
    bookingDate: string;
    customer: string;
    serviceDate: string;
    serviceTime: string;
    returnDate: string;
    returnTime: string;
    language: string;
    pickupZone: string;
    flight: string;
    present: string;
    print: string;
    download: string;
    notFound: string;
    notFoundBody: string;
  };
  tourDetail: {
    reviews: string;
    maxPeople: string;
    alsoAvailable: string;
    sameItinerary: string;
    view: string;
    highlights: string;
    places: string;
    included: string;
    notIncluded: string;
    recommendations: string;
    cancellation: string;
    maxAbbrev: string;
    video: string;
    map: string;
    openMap: string;
    reviewsKicker: string;
    reviewsTitle: string;
    reviewsSubtitle: string;
    reviewsBasedOn: string;
    reviewsCta: string;
    reviewsTraveler: string;
  };
  blog: {
    eyebrow: string;
    readArticle: string;
    readMore: string;
    related: string;
  };
  booking: {
    date: string;
    time: string;
    name: string;
    hotel: string;
    cruiseShip: string;
    notes: string;
    paymentMethod: string;
    card: string;
    bizum: string;
    deposit: string;
    payOnDay: string;
    addToCart: string;
    bookNow: string;
    requestTour: string;
    requestHint: string;
    cancelPolicy: string;
    selectDate: string;
    fillRequired: string;
    added: string;
    payNow: string;
    cashLater: string;
    perAdult: string;
    perVehicle: string;
    flatPrice: string;
    passengersInGroup: string;
    hoursMin: string;
    bookError: string;
  };
  transferForm: {
    title: string;
    subtitle: string;
    destination: string;
    route: string;
    passengers: string;
    flight: string;
    hotelAddress: string;
    time: string;
    returnDate: string;
    returnTime: string;
    payment: string;
    confirm: string;
  };
  confirmation: {
    title: string;
    body: string;
    locator: string;
    service: string;
    paidOnline: string;
    cashPending: string;
    invoice: string;
    viewVoucher: string;
    manage: string;
    cancel: string;
    print: string;
  };
  payments: {
    card: string;
    bizum: string;
    pay_on_day: string;
    deposit_10: string;
    deposit_20: string;
  };
  chat: {
    title: string;
    subtitle: string;
    greeting: string;
    placeholder: string;
    writing: string;
    suggestions: string[];
    error: string;
  };
  contactWidget: {
    title: string;
    slug: string;
    help: string;
    questions: string;
    whatsapp: string;
    facebook: string;
  };
};

const es: Dictionary = {
  nav: {
    about: "Sobre nosotros",
    excursions: "Excursiones",
    transfers: "Traslados",
    cruises: "Cruceros",
    houses: "Casas",
    contact: "Contacto",
    cart: "Carrito",
    manageBooking: "Gestione su reserva",
  },
  common: {
    from: "Desde",
    book: "Reservar",
    view: "Ver",
    seeAll: "Ver todas",
    loading: "Cargando…",
    send: "Enviar",
    phone: "Teléfono",
    email: "Email",
    continue: "Continuar",
    backHome: "Volver al inicio",
    max: "Máx.",
    adults: "Adultos",
    children: "Niños",
    date: "Fecha",
    total: "Total",
    required: "Obligatorio",
    processing: "Procesando…",
    close: "Cerrar",
  },
  home: {
    ctaOffers: "Ver nuestras ofertas",
    ctaCruise: "Llegas en crucero",
    marquee:
      "Excursiones personalizadas · Empresa familiar de Lanzarote · Gracias por apoyar el comercio local · Grupos reducidos, solo en español",
    advantages: [
      "Mini-bus desinfectado con Ozono",
      "Climatizado y WIFI gratis",
      "Grupos máx. 14 personas",
      "Solo en español",
      "Recogida en su alojamiento",
    ],
    toursTitle: "Lanzarote tours",
    toursKicker: "Experiencias",
    transfersKicker: "Sin esperas",
    transfersTitle: "Traslados privados en Lanzarote",
    transfersCta: "Reservar traslado",
    cruisesKicker: "Escalas",
    cruisesTitle: "Excursiones para cruceros",
    cruisesCta: "Ver opciones",
    agencyKicker: "Empresa familiar",
    agencyTitle: "Agencia de excursiones",
    agencyBody:
      "Vigilamos la calidad con grupos pequeños, minibuses propios y visitas solo en español.",
    agencyCta: "Conocer LET",
    islandKicker: "La isla",
    islandTitle: "Aproveche al máximo su visita a Lanzarote",
    islandBody:
      "Reserva de la Biosfera, silencio, calma y un paisaje volcánico moldeado por César Manrique y Jesús Soto. Timanfaya, Cueva de los Verdes, Jardín de Cactus o Jameos del Agua: la isla se vive mejor con quien la conoce.",
    islandCta: "Empezar a planificar",
    reviewsKicker: "Tripadvisor",
    reviewsTitle: "Lo que dicen los viajeros",
    reviewsSubtitle:
      "Reseñas reales de quienes ya descubrieron Lanzarote con nosotros.",
    reviewsBasedOn: "Basado en {n} opiniones en Tripadvisor",
    reviewsCta: "Ver todas las reseñas en Tripadvisor",
    reviewsTraveler: "Viajero",
  },
  footer: {
    blurb:
      "Empresa familiar local. Excursiones en grupos reducidos, solo en español, con nuestros propios minibuses.",
    explore: "Explorar",
    contact247: "Contacto 24/7",
    privacy: "Privacidad",
    terms: "Condiciones",
    rights: "Todos los derechos reservados",
  },
  excursions: {
    title: "Actividades y excursiones guiadas en Lanzarote",
    subtitle:
      "Excursiones, actividades y visitas guiadas para descubrir lo mejor de Lanzarote.",
    faqTitle: "Preguntas frecuentes sobre nuestras excursiones en Lanzarote",
    cruiseHint: "¿Llega en crucero?",
    cruiseLink: "Vea las opciones para su escala",
    faqs: [
      {
        q: "¿Cuándo recibiré el bono para la excursión?",
        a: "Tras confirmar la reserva recibirá un email con el bono y los detalles de recogida.",
      },
      {
        q: "¿Cuáles son las formas de pago disponibles?",
        a: "En excursiones y cruceros: 20% con tarjeta y el resto en efectivo, o el 100% online (tarjeta/Bizum). Los traslados se pagan íntegros online.",
      },
      {
        q: "¿Dónde será el punto de encuentro?",
        a: "Le recogemos en la puerta de su alojamiento. El punto exacto aparece en su bono.",
      },
      {
        q: "¿Cuál es la política de cancelación?",
        a: "Cancelación gratuita hasta 48 horas antes de la recogida.",
      },
      {
        q: "¿Cuáles son los idiomas de las excursiones?",
        a: "No mezclamos idiomas: nuestras excursiones se realizan solo en español.",
      },
    ],
  },
  transfers: {
    title: "Traslados al aeropuerto de Lanzarote",
    airportHotel: "Aeropuerto al hotel",
    hotelAirport: "Hotel al aeropuerto",
    roundTrip: "Ida y Vuelta",
    tableTitle: "Traslados privados desde y hacia el aeropuerto de Lanzarote",
    destination: "Destino",
    duration: "Duración",
    oneWay: "Ida",
    return: "Ida y vuelta",
    extraPerson: "Persona extra",
    faqTitle: "Preguntas frecuentes sobre nuestros traslados en Lanzarote",
    faqs: [
      {
        q: "¿Dónde encontraré a mi chófer?",
        a: "Le esperamos en la terminal de llegadas con un cartel con su nombre.",
      },
      {
        q: "¿Qué pasa si mi vuelo tiene un retraso?",
        a: "Hacemos seguimiento de vuelos y adaptamos la recogida sin coste adicional.",
      },
      {
        q: "¿Cómo funciona la política de cancelación?",
        a: "Cancelación gratuita hasta 48 horas antes del servicio.",
      },
    ],
  },
  cruises: {
    title: "Excursiones para cruceros en las Islas Canarias",
    select: "Seleccione su excursión",
    pickup: "Recogida en puerto",
    pickupText:
      "Le esperamos cerca del muelle. Indíquenos su barco y hora de desembarque.",
    return: "Regreso a tiempo",
    returnText:
      "Adaptamos el itinerario a su all-aboard para que embarque con tranquilidad.",
    essentials: "Lo imprescindible",
    essentialsText:
      "Timanfaya, El Golfo, Jameos… lo mejor de la isla en el tiempo de su escala.",
    recommended: "Excursiones para cruceristas",
    recommendedText:
      "Experiencias únicas en cada escala, con grupos reducidos y solo en español.",
    privateTitle: "¿Prefiere algo privado?",
    privateText:
      "La opción más flexible si viaja en familia o quiere un itinerario a medida.",
    scheduleKicker: "Temporada",
    scheduleTitle: "Calendario de escalas en Lanzarote",
    scheduleText: "Consulta los barcos previstos en",
    scheduleEmpty: "Aún no hay escalas publicadas.",
    filterMonth: "Mes",
    searchShip: "Buscar",
    searchPlaceholder: "Barco o naviera…",
    noResults: "No hay escalas con estos filtros.",
    shipSingular: "barco",
    shipPlural: "barcos",
    shipsToday: "Barcos ese día",
    browseTitle: "Excursiones para cruceros en Canarias",
    browseSubtitle:
      "Lo más fácil: elija en el calendario el día de su escala en Lanzarote. También puede buscar por naviera, barco y salida.",
    selectCruise: "Seleccione su crucero",
    companiesTitle: "Compañías de cruceros",
    companySailings: "salidas previstas",
    upcomingCruises: "Próximos cruceros de",
    shipSailings: "salidas previstas",
    departure: "Salida prevista",
    nights: "noches",
    nightSingular: "noche",
    nightPlural: "noches",
    viewItinerary: "Ver itinerario y excursiones",
    noSailings: "Aún no hay salidas publicadas para esta naviera.",
    otherCompanies: "Excursiones para otras compañías de cruceros",
    itineraryTitle: "Escalas de este crucero",
    callDay: "Día de escala",
    seaDay: "Día",
    atSea: "Navegando",
    noToursYet:
      "Aún no ofrecemos excursiones en {port}. Estamos trabajando con otras agencias de confianza para ofrecerle las mejores experiencias en cada puerto.",
    moreInfo: "Más información",
    meetingPoint: "Punto de encuentro",
    meetingPointTitle: "Punto de encuentro en Lanzarote",
    meetingPointBody:
      "El punto de encuentro con la guía es el control de policía del puerto. El transporte estará en el aparcamiento externo (caminata de unos 10 minutos desde el barco, según atracadero).",
    bookTour: "Reservar",
    placesToVisit: "Lugares a visitar",
    durationLabel: "Duración del tour",
    smallGroupMax: "Excursión en grupos pequeños, máximo {n} personas",
    durationHours: "{n} horas",
    breadcrumbCruises: "Excursiones para crucero",
    seeExcursionsForShip: "Ver excursiones del crucero",
    calendarHint:
      "También puede buscar su barco en el calendario de escalas en Lanzarote.",
    bookTourTitle: "Reservar esta excursión",
    selectPassengers: "Seleccione el número de pasajeros",
    passengerSingular: "pasajero",
    passengerPlural: "pasajeros",
    perPerson: "persona",
    bookingTotal: "Precio total de su reserva",
    confirmBooking: "Confirmar reserva",
    included: "Incluido",
    notIncluded: "No incluido",
    goToCart: "Ir al carrito",
    dateCalendarKicker: "Fecha de escala",
    dateCalendarTitle: "Elija el día de su escala en Lanzarote",
    dateCalendarText:
      "Pulse en el calendario la fecha en la que atraca su barco y verá las salidas disponibles en",
    dateCalendarLegend:
      "Los días marcados tienen escalas. Pulse uno para ver los barcos y sus excursiones.",
    dateCalendarEmptyDay: "No hay barcos publicados este día.",
    dateCalendarPickDay: "Seleccione un día del calendario para continuar.",
    dateCalendarNoItinerary:
      "Itinerario completo aún no disponible para esta escala.",
    prevMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    orBrowseByCompany: "O busque por compañía de cruceros",
  },
  about: {
    welcome: "¡Bienvenidos a Lanzarote!",
    mission: "Misión",
    missionText:
      "Ofrecer visitas guiadas de calidad en Lanzarote, en grupos reducidos y solo en español.",
    vision: "Visión",
    visionText:
      "Ser la referencia local en experiencias auténticas de Lanzarote.",
    values: "Nuestros valores",
    promise: "Nuestra promesa",
    contact: "Contactar",
    seeExcursions: "Ver excursiones",
  },
  houses: {
    title: "Casas vacacionales en Lanzarote",
    subtitle:
      "Alojamientos en Playa Honda. Reserve directamente en cada ficha.",
    cta: "Ver y reservar",
    empty: "Pronto publicaremos nuestras casas vacacionales.",
    guests: "Huéspedes",
    bedrooms: "Dormitorios",
    size: "m²",
  },
  contact: {
    title: "¿Cómo podemos ayudarle?",
    subtitle: "Estamos para resolver todas sus dudas. Contacto 24 / 7.",
    formTitle: "Formulario de contacto",
    infoTitle: "Información de contacto",
    name: "Nombre",
    message: "Mensaje",
    send: "Enviar mensaje",
    sending: "Enviando…",
    success: "Mensaje enviado. Le contactaremos lo antes posible.",
    address: "Calle Calderetas, 100\n35550 San Bartolomé - Lanzarote",
  },
  cart: {
    title: "Actividades seleccionadas",
    empty: "Su carrito está vacío.",
    seeExcursions: "Ver excursiones",
    hotel: "Hotel / alojamiento",
    payment: "Método de pago",
    checkout: "Finalizar reserva",
    remove: "Eliminar",
    now: "Ahora",
    cashDay: "Efectivo",
  },
  manage: {
    title: "Gestionar su reserva",
    subtitle: "Introduzca su número de reserva y el email con el que compró.",
    bookingId: "Número de reserva",
    lookup: "Consultar reserva",
    searching: "Buscando…",
    activity: "Actividad",
    people: "Personas",
    status: "Estado",
    payment: "Pago",
    help: "¿Necesita cambios? Contáctenos.",
    viewVoucher: "Ver voucher",
    cancelBooking: "Cancelar reserva",
    printVoucher: "Imprimir voucher",
  },
  cancel: {
    title: "Cancelar reserva",
    subtitle:
      "Puede cancelar su reserva o algún servicio específico de una forma sencilla y segura.",
    intro:
      "Introduzca su localizador y el email de la reserva para continuar.",
    continue: "Continuar",
    back: "Volver atrás",
    backManage: "Gestionar reserva",
    whichService: "¿Qué servicio desea cancelar?",
    serviceDate: "Fecha del servicio",
    passengers: "pasajeros",
    freeCancel: "Cancelación gratuita (más de 48 h antes del servicio).",
    feeCancel:
      "La cancelación de este servicio tiene un cargo de {fee}",
    reasonTitle:
      "Nos gustaría saber el motivo por el que desea cancelar su reserva",
    reasons: [
      {
        id: "changed_plans",
        label: "He cambiado mis planes y no necesito este servicio",
      },
      { id: "not_interested", label: "Ya no me interesa este servicio" },
      { id: "better_price", label: "He encontrado un mejor precio" },
      {
        id: "personal",
        label: "Por razones personales y/o familiares",
      },
      { id: "other", label: "Por otros motivos" },
    ],
    submit: "Cancelar mi reserva",
    cancelling: "Cancelando…",
    doneTitle: "Reserva cancelada",
    success: "Su reserva se ha cancelado correctamente.",
    alreadyCancelled: "Esta reserva ya está cancelada.",
    alreadyCompleted: "No se puede cancelar un servicio ya realizado.",
    statusPending: "Pendiente",
    statusConfirmed: "Confirmado",
    statusCompleted: "Completado",
    statusCancelled: "Cancelado",
  },
  voucher: {
    title: "VOUCHER / CONFIRMACIÓN",
    subtitle: "Presente este documento el día del servicio",
    issued: "Emitido",
    bookingDate: "Fecha de reserva",
    customer: "Cliente",
    serviceDate: "Fecha del servicio",
    serviceTime: "Hora del servicio",
    returnDate: "Fecha de regreso",
    returnTime: "Hora de regreso",
    language: "Idioma",
    pickupZone: "Zona de recogida",
    flight: "Nº de vuelo",
    present:
      "Presente este voucher el día del servicio. Conservamos su localizador en nuestros sistemas.",
    print: "Imprimir",
    download: "Descargar",
    notFound: "Voucher no encontrado",
    notFoundBody: "Compruebe el localizador o consulte su reserva.",
  },
  tourDetail: {
    reviews: "opiniones",
    maxPeople: "Hasta {n} personas",
    alsoAvailable: "También disponible en {size}",
    sameItinerary: "Mismo itinerario desde {price}/adulto.",
    view: "Ver {name}",
    highlights: "Lo más destacado",
    places: "Lugares que visitaremos",
    included: "Incluido",
    notIncluded: "No incluido",
    recommendations: "Recomendaciones",
    cancellation: "Política de cancelación",
    maxAbbrev: "máx.",
    video: "Vídeo de la excursión",
    map: "Mapa del recorrido",
    openMap: "Abrir mapa",
    reviewsKicker: "Tripadvisor",
    reviewsTitle: "Opiniones de esta excursión",
    reviewsSubtitle:
      "Experiencias de viajeros en Tripadvisor y en nuestras salidas.",
    reviewsBasedOn: "Basado en {n} opiniones en Tripadvisor",
    reviewsCta: "Leer más en Tripadvisor",
    reviewsTraveler: "Viajero",
  },
  blog: {
    eyebrow: "Blog",
    readArticle: "Leer artículo",
    readMore: "Leer más",
    related: "También te puede interesar",
  },
  booking: {
    date: "Fecha *",
    time: "Hora del servicio",
    name: "Nombre completo *",
    hotel: "Hotel / punto de recogida",
    cruiseShip: "Barco de crucero (si aplica)",
    notes: "Notas",
    paymentMethod: "Método de pago",
    card: "100% online (tarjeta)",
    bizum: "100% online (Bizum)",
    deposit: "20% tarjeta + resto efectivo",
    payOnDay: "Pago el día del tour",
    addToCart: "Añadir al carrito",
    bookNow: "Reservar ahora",
    requestTour: "Solicitar excursión",
    requestHint:
      "Esta excursión es bajo petición. Envíe su solicitud y le confirmaremos disponibilidad.",
    cancelPolicy: "Cancelación gratis hasta 48 h antes",
    selectDate: "Seleccione una fecha para añadir al carrito.",
    fillRequired: "Complete los campos obligatorios.",
    added: "Añadido al carrito.",
    payNow: "Ahora (20% tarjeta)",
    cashLater: "Efectivo el día",
    perAdult: "por adulto",
    perVehicle: "por vehículo",
    flatPrice: "Precio cerrado",
    passengersInGroup: "Personas en el grupo",
    hoursMin: "Horas (mín. 4)",
    bookError: "Error al reservar",
  },
  transferForm: {
    title: "Reservar traslado",
    subtitle: "Privado · recibimiento con cartel con su nombre",
    destination: "Destino *",
    route: "Trayecto *",
    passengers: "Pasajeros",
    flight: "Nº de vuelo",
    hotelAddress: "Hotel / dirección *",
    time: "Hora del servicio *",
    returnDate: "Fecha de regreso",
    returnTime: "Hora de regreso",
    payment: "Pago",
    confirm: "Confirmar traslado",
  },
  confirmation: {
    title: "¡Reserva recibida!",
    body: "Le hemos enviado un email de confirmación. Nuestro equipo le contactará si necesita algún detalle adicional.",
    locator: "Localizador",
    service: "Servicio",
    paidOnline: "Pagado (tarjeta/online)",
    cashPending: "Pendiente en efectivo",
    invoice: "Factura",
    viewVoucher: "Ver / imprimir voucher",
    manage: "Gestionar reserva",
    cancel: "Cancelar reserva",
    print: "Imprimir confirmación",
  },
  payments: {
    card: "100% online (tarjeta)",
    bizum: "100% online (Bizum)",
    pay_on_day: "Pago el día del tour",
    deposit_10: "10% tarjeta + resto efectivo",
    deposit_20: "20% tarjeta + resto efectivo",
  },
  chat: {
    title: "Asistente LET",
    subtitle: "Excursiones, traslados y más",
    greeting:
      "¡Hola! Soy el asistente de Lanzarote Experience Tours. Pregúntame por excursiones, precios, traslados o si llega en crucero.",
    placeholder: "Escriba su pregunta…",
    writing: "Escribiendo…",
    suggestions: [
      "¿Timanfaya o Grand Tour?",
      "Traslado a Playa Blanca",
      "Vengo en crucero un día",
      "¿Puedo pagar 20% y el resto en efectivo?",
    ],
    error:
      "Ahora mismo no he podido responder. Pruebe de nuevo o llámenos al +34 646 08 05 85.",
  },
  contactWidget: {
    title: "Lanzarote Experience Tours",
    slug: "Contacto 24 / 7",
    help: "¿Necesita ayuda? Estamos para resolver todas sus dudas.",
    questions: "¿Preguntas?",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
  },
};

const en: Dictionary = {
  nav: {
    about: "About us",
    excursions: "Excursions",
    transfers: "Transfers",
    cruises: "Cruises",
    houses: "Homes",
    contact: "Contact",
    cart: "Cart",
    manageBooking: "Manage booking",
  },
  common: {
    from: "From",
    book: "Book",
    view: "View",
    seeAll: "See all",
    loading: "Loading…",
    send: "Send",
    phone: "Phone",
    email: "Email",
    continue: "Continue",
    backHome: "Back to home",
    max: "Max.",
    adults: "Adults",
    children: "Children",
    date: "Date",
    total: "Total",
    required: "Required",
    processing: "Processing…",
    close: "Close",
  },
  home: {
    ctaOffers: "See our offers",
    ctaCruise: "Arriving by cruise",
    marquee:
      "Tailored excursions · Family business from Lanzarote · Thank you for supporting local trade · Small groups, Spanish only",
    advantages: [
      "Ozone-disinfected mini-bus",
      "Air-conditioned with free WIFI",
      "Groups max. 14 people",
      "Spanish language only",
      "Hotel pick-up included",
    ],
    toursTitle: "Lanzarote tours",
    toursKicker: "Experiences",
    transfersKicker: "No waiting",
    transfersTitle: "Private transfers in Lanzarote",
    transfersCta: "Book a transfer",
    cruisesKicker: "Port calls",
    cruisesTitle: "Shore excursions",
    cruisesCta: "See options",
    agencyKicker: "Family business",
    agencyTitle: "Excursion agency",
    agencyBody:
      "We protect quality with small groups, our own minibuses and Spanish-only tours.",
    agencyCta: "Meet LET",
    islandKicker: "The island",
    islandTitle: "Make the most of your visit to Lanzarote",
    islandBody:
      "A Biosphere Reserve of silence, calm and volcanic landscapes shaped by César Manrique. Timanfaya, Cueva de los Verdes, Cactus Garden or Jameos del Agua: the island is better with those who know it.",
    islandCta: "Start planning",
    reviewsKicker: "Tripadvisor",
    reviewsTitle: "What travellers say",
    reviewsSubtitle:
      "Real reviews from people who have already discovered Lanzarote with us.",
    reviewsBasedOn: "Based on {n} Tripadvisor reviews",
    reviewsCta: "See all reviews on Tripadvisor",
    reviewsTraveler: "Traveller",
  },
  footer: {
    blurb:
      "Local family business. Small-group excursions in Spanish only, with our own minibuses.",
    explore: "Explore",
    contact247: "Contact 24/7",
    privacy: "Privacy",
    terms: "Terms",
    rights: "All rights reserved",
  },
  excursions: {
    title: "Guided activities and excursions in Lanzarote",
    subtitle:
      "Excursions and guided visits to discover the best of Lanzarote.",
    faqTitle: "Frequently asked questions about our Lanzarote excursions",
    cruiseHint: "Arriving by cruise?",
    cruiseLink: "See options for your port call",
    faqs: [
      {
        q: "When will I receive my excursion voucher?",
        a: "After confirmation you will receive an email with the voucher and pick-up details.",
      },
      {
        q: "Which payment methods are available?",
        a: "For excursions and cruises: 20% by card and the rest in cash, or 100% online (card/Bizum). Transfers are paid in full online.",
      },
      {
        q: "Where is the meeting point?",
        a: "We pick you up at your accommodation. The exact point is on your voucher.",
      },
      {
        q: "What is the cancellation policy?",
        a: "Free cancellation up to 48 hours before pick-up.",
      },
      {
        q: "Which languages are the tours in?",
        a: "We do not mix languages: our excursions are in Spanish only.",
      },
    ],
  },
  transfers: {
    title: "Lanzarote airport transfers",
    airportHotel: "Airport to hotel",
    hotelAirport: "Hotel to airport",
    roundTrip: "Return",
    tableTitle: "Private transfers to and from Lanzarote Airport",
    destination: "Destination",
    duration: "Duration",
    oneWay: "One way",
    return: "Return",
    extraPerson: "Extra person",
    faqTitle: "Frequently asked questions about our transfers",
    faqs: [
      {
        q: "Where will I find my driver?",
        a: "We meet you in arrivals with a sign with your name.",
      },
      {
        q: "What if my flight is delayed?",
        a: "We track flights and adjust pick-up at no extra cost.",
      },
      {
        q: "What is the cancellation policy?",
        a: "Free cancellation up to 48 hours before the service.",
      },
    ],
  },
  cruises: {
    title: "Shore excursions in the Canary Islands",
    select: "Choose your excursion",
    pickup: "Port pick-up",
    pickupText: "We meet you near the pier. Tell us your ship and disembarkation time.",
    return: "Back on time",
    returnText: "We adapt the itinerary to your all-aboard time.",
    essentials: "The essentials",
    essentialsText:
      "Timanfaya, El Golfo, Jameos… the best of the island in your time ashore.",
    recommended: "Shore excursions",
    recommendedText: "Unique experiences for every port call, in small Spanish-only groups.",
    privateTitle: "Prefer something private?",
    privateText: "The most flexible option for families or a custom itinerary.",
    scheduleKicker: "Season",
    scheduleTitle: "Lanzarote cruise call calendar",
    scheduleText: "See the ships scheduled at",
    scheduleEmpty: "No published port calls yet.",
    filterMonth: "Month",
    searchShip: "Search",
    searchPlaceholder: "Ship or cruise line…",
    noResults: "No port calls match these filters.",
    shipSingular: "ship",
    shipPlural: "ships",
    shipsToday: "Ships that day",
    browseTitle: "Shore excursions in the Canary Islands",
    browseSubtitle:
      "Easiest path: pick your Lanzarote port-call day on the calendar. You can also browse by cruise line, ship and sailing.",
    selectCruise: "Select your cruise",
    companiesTitle: "Cruise lines",
    companySailings: "scheduled sailings",
    upcomingCruises: "Upcoming cruises from",
    shipSailings: "scheduled sailings",
    departure: "Scheduled departure",
    nights: "nights",
    nightSingular: "night",
    nightPlural: "nights",
    viewItinerary: "View itinerary and excursions",
    noSailings: "No sailings published for this cruise line yet.",
    otherCompanies: "Shore excursions for other cruise lines",
    itineraryTitle: "Ports on this cruise",
    callDay: "Port day",
    seaDay: "Day",
    atSea: "At sea",
    noToursYet:
      "We do not yet offer excursions in {port}. We are working with trusted partners to bring you the best experiences in every port.",
    moreInfo: "More information",
    meetingPoint: "Meeting point",
    meetingPointTitle: "Meeting point in Lanzarote",
    meetingPointBody:
      "Meet your guide at the port police control. Transport waits in the outer car park (about a 10-minute walk from the ship, depending on berth).",
    bookTour: "Book",
    placesToVisit: "Places to visit",
    durationLabel: "Tour duration",
    smallGroupMax: "Small-group excursion, maximum {n} people",
    durationHours: "{n} hours",
    breadcrumbCruises: "Cruise excursions",
    seeExcursionsForShip: "See cruise excursions",
    calendarHint:
      "You can also find your ship in the Lanzarote port-call calendar.",
    bookTourTitle: "Book this excursion",
    selectPassengers: "Select number of passengers",
    passengerSingular: "passenger",
    passengerPlural: "passengers",
    perPerson: "person",
    bookingTotal: "Total booking price",
    confirmBooking: "Confirm booking",
    included: "Included",
    notIncluded: "Not included",
    goToCart: "Go to cart",
    dateCalendarKicker: "Port-call date",
    dateCalendarTitle: "Choose your Lanzarote port-call day",
    dateCalendarText:
      "Tap the calendar on the day your ship docks and see the available sailings at",
    dateCalendarLegend:
      "Marked days have port calls. Tap one to see the ships and shore excursions.",
    dateCalendarEmptyDay: "No ships published for this day.",
    dateCalendarPickDay: "Select a day on the calendar to continue.",
    dateCalendarNoItinerary:
      "Full itinerary is not available for this port call yet.",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    orBrowseByCompany: "Or browse by cruise line",
  },
  about: {
    welcome: "Welcome to Lanzarote!",
    mission: "Mission",
    missionText:
      "Deliver quality guided visits in Lanzarote, in small groups and Spanish only.",
    vision: "Vision",
    visionText: "Be the local reference for authentic Lanzarote experiences.",
    values: "Our values",
    promise: "Our promise",
    contact: "Contact",
    seeExcursions: "See excursions",
  },
  houses: {
    title: "Holiday homes in Lanzarote",
    subtitle: "Stays in Playa Honda. Book directly on each property page.",
    cta: "View & book",
    empty: "Our holiday homes will be published here soon.",
    guests: "Guests",
    bedrooms: "Bedrooms",
    size: "m²",
  },
  contact: {
    title: "How can we help you?",
    subtitle: "We are here to answer all your questions. Contact 24 / 7.",
    formTitle: "Contact form",
    infoTitle: "Contact information",
    name: "Name",
    message: "Message",
    send: "Send message",
    sending: "Sending…",
    success: "Message sent. We will contact you as soon as possible.",
    address: "Calle Calderetas, 100\n35550 San Bartolomé - Lanzarote",
  },
  cart: {
    title: "Selected activities",
    empty: "Your cart is empty.",
    seeExcursions: "See excursions",
    hotel: "Hotel / accommodation",
    payment: "Payment method",
    checkout: "Complete booking",
    remove: "Remove",
    now: "Now",
    cashDay: "Cash",
  },
  manage: {
    title: "Manage your booking",
    subtitle: "Enter your booking number and the email used to purchase.",
    bookingId: "Booking number",
    lookup: "Look up booking",
    searching: "Searching…",
    activity: "Activity",
    people: "Guests",
    status: "Status",
    payment: "Payment",
    help: "Need changes? Contact us.",
    viewVoucher: "View voucher",
    cancelBooking: "Cancel booking",
    printVoucher: "Print voucher",
  },
  cancel: {
    title: "Cancel booking",
    subtitle:
      "You can cancel your booking or a specific service simply and securely.",
    intro: "Enter your locator and the booking email to continue.",
    continue: "Continue",
    back: "Go back",
    backManage: "Manage booking",
    whichService: "Which service would you like to cancel?",
    serviceDate: "Service date",
    passengers: "passengers",
    freeCancel: "Free cancellation (more than 48 h before the service).",
    feeCancel: "Cancelling this service has a charge of {fee}",
    reasonTitle: "We would like to know why you wish to cancel your booking",
    reasons: [
      {
        id: "changed_plans",
        label: "I have changed my plans and no longer need this service",
      },
      { id: "not_interested", label: "I am no longer interested in this service" },
      { id: "better_price", label: "I have found a better price" },
      {
        id: "personal",
        label: "For personal and/or family reasons",
      },
      { id: "other", label: "For other reasons" },
    ],
    submit: "Cancel my booking",
    cancelling: "Cancelling…",
    doneTitle: "Booking cancelled",
    success: "Your booking has been cancelled successfully.",
    alreadyCancelled: "This booking is already cancelled.",
    alreadyCompleted: "A completed service cannot be cancelled.",
    statusPending: "Pending",
    statusConfirmed: "Confirmed",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
  },
  voucher: {
    title: "VOUCHER / CONFIRMATION",
    subtitle: "Please present this document on the day of the service",
    issued: "Issued",
    bookingDate: "Booking date",
    customer: "Customer",
    serviceDate: "Service date",
    serviceTime: "Service time",
    returnDate: "Return date",
    returnTime: "Return time",
    language: "Language",
    pickupZone: "Pick-up zone",
    flight: "Flight number",
    present:
      "Please present this voucher on the day of the service. We keep your locator in our systems.",
    print: "Print",
    download: "Download",
    notFound: "Voucher not found",
    notFoundBody: "Check the locator or look up your booking.",
  },
  tourDetail: {
    reviews: "reviews",
    maxPeople: "Up to {n} people",
    alsoAvailable: "Also available as {size}",
    sameItinerary: "Same itinerary from {price}/adult.",
    view: "View {name}",
    highlights: "Highlights",
    places: "Places we will visit",
    included: "Included",
    notIncluded: "Not included",
    recommendations: "Recommendations",
    cancellation: "Cancellation policy",
    maxAbbrev: "max.",
    video: "Tour video",
    map: "Tour map",
    openMap: "Open map",
    reviewsKicker: "Tripadvisor",
    reviewsTitle: "Reviews for this tour",
    reviewsSubtitle:
      "Traveller experiences from Tripadvisor and our own departures.",
    reviewsBasedOn: "Based on {n} Tripadvisor reviews",
    reviewsCta: "Read more on Tripadvisor",
    reviewsTraveler: "Traveller",
  },
  blog: {
    eyebrow: "Blog",
    readArticle: "Read article",
    readMore: "Read more",
    related: "You may also like",
  },
  booking: {
    date: "Date *",
    time: "Service time",
    name: "Full name *",
    hotel: "Hotel / pick-up point",
    cruiseShip: "Cruise ship (if applicable)",
    notes: "Notes",
    paymentMethod: "Payment method",
    card: "100% online (card)",
    bizum: "100% online (Bizum)",
    deposit: "20% card + cash balance",
    payOnDay: "Pay on the day",
    addToCart: "Add to cart",
    bookNow: "Book now",
    requestTour: "Request excursion",
    requestHint:
      "This excursion is on request. Send your request and we will confirm availability.",
    cancelPolicy: "Free cancellation up to 48 h before",
    selectDate: "Please select a date to add to cart.",
    fillRequired: "Please complete the required fields.",
    added: "Added to cart.",
    payNow: "Now (20% card)",
    cashLater: "Cash on the day",
    perAdult: "per adult",
    perVehicle: "per vehicle",
    flatPrice: "Fixed price",
    passengersInGroup: "People in the group",
    hoursMin: "Hours (min. 4)",
    bookError: "Booking failed",
  },
  transferForm: {
    title: "Book a transfer",
    subtitle: "Private · meet & greet with your name sign",
    destination: "Destination *",
    route: "Route *",
    passengers: "Passengers",
    flight: "Flight number",
    hotelAddress: "Hotel / address *",
    time: "Service time *",
    returnDate: "Return date",
    returnTime: "Return time",
    payment: "Payment",
    confirm: "Confirm transfer",
  },
  confirmation: {
    title: "Booking received!",
    body: "We have sent a confirmation email. Our team will contact you if any detail is needed.",
    locator: "Reference",
    service: "Service",
    paidOnline: "Paid (card/online)",
    cashPending: "Cash due",
    invoice: "Invoice",
    viewVoucher: "View / print voucher",
    manage: "Manage booking",
    cancel: "Cancel booking",
    print: "Print confirmation",
  },
  payments: {
    card: "100% online (card)",
    bizum: "100% online (Bizum)",
    pay_on_day: "Pay on the day",
    deposit_10: "10% card + cash balance",
    deposit_20: "20% card + cash balance",
  },
  chat: {
    title: "LET Assistant",
    subtitle: "Excursions, transfers and more",
    greeting:
      "Hi! I am the Lanzarote Experience Tours assistant. Ask me about excursions, prices, transfers or cruise calls.",
    placeholder: "Type your question…",
    writing: "Typing…",
    suggestions: [
      "Timanfaya or Grand Tour?",
      "Transfer to Playa Blanca",
      "I arrive by cruise for one day",
      "Can I pay 20% and the rest in cash?",
    ],
    error:
      "I could not reply right now. Please try again or call +34 646 08 05 85.",
  },
  contactWidget: {
    title: "Lanzarote Experience Tours",
    slug: "Contact 24 / 7",
    help: "Need help? We are here to answer all your questions.",
    questions: "Questions?",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
  },
};

const de: Dictionary = {
  nav: {
    about: "Über uns",
    excursions: "Ausflüge",
    transfers: "Transfers",
    cruises: "Kreuzfahrten",
    houses: "Häuser",
    contact: "Kontakt",
    cart: "Warenkorb",
    manageBooking: "Buchung verwalten",
  },
  common: {
    from: "Ab",
    book: "Buchen",
    view: "Ansehen",
    seeAll: "Alle ansehen",
    loading: "Laden…",
    send: "Senden",
    phone: "Telefon",
    email: "E-Mail",
    continue: "Weiter",
    backHome: "Zur Startseite",
    max: "Max.",
    adults: "Erwachsene",
    children: "Kinder",
    date: "Datum",
    total: "Gesamt",
    required: "Pflichtfeld",
    processing: "Wird verarbeitet…",
    close: "Schließen",
  },
  home: {
    ctaOffers: "Unsere Angebote ansehen",
    ctaCruise: "Mit dem Kreuzfahrtschiff",
    marquee:
      "Individuelle Ausflüge · Familienunternehmen aus Lanzarote · Danke für die Unterstützung lokaler Betriebe · Kleine Gruppen, nur auf Spanisch",
    advantages: [
      "Minibus mit Ozon desinfiziert",
      "Klimatisiert mit gratis WIFI",
      "Gruppen max. 14 Personen",
      "Nur auf Spanisch",
      "Abholung an Ihrer Unterkunft",
    ],
    toursTitle: "Lanzarote tours",
    toursKicker: "Erlebnisse",
    transfersKicker: "Ohne Warten",
    transfersTitle: "Private Transfers auf Lanzarote",
    transfersCta: "Transfer buchen",
    cruisesKicker: "Hafenstopps",
    cruisesTitle: "Landausflüge für Kreuzfahrten",
    cruisesCta: "Optionen ansehen",
    agencyKicker: "Familienunternehmen",
    agencyTitle: "Ausflugsagentur",
    agencyBody:
      "Wir sichern Qualität mit kleinen Gruppen, eigenen Minibussen und Touren nur auf Spanisch.",
    agencyCta: "LET kennenlernen",
    islandKicker: "Die Insel",
    islandTitle: "Holen Sie das Beste aus Ihrem Besuch auf Lanzarote",
    islandBody:
      "Biosphärenreservat, Stille, Ruhe und eine vulkanische Landschaft geprägt von César Manrique. Timanfaya, Cueva de los Verdes, Kakteengarten oder Jameos del Agua: die Insel erlebt man besser mit Kennern.",
    islandCta: "Jetzt planen",
    reviewsKicker: "Tripadvisor",
    reviewsTitle: "Das sagen Reisende",
    reviewsSubtitle:
      "Echte Bewertungen von Gästen, die Lanzarote mit uns entdeckt haben.",
    reviewsBasedOn: "Basierend auf {n} Tripadvisor-Bewertungen",
    reviewsCta: "Alle Bewertungen auf Tripadvisor",
    reviewsTraveler: "Reisender",
  },
  footer: {
    blurb:
      "Lokales Familienunternehmen. Ausflüge in kleinen Gruppen, nur auf Spanisch, mit eigenen Minibussen.",
    explore: "Entdecken",
    contact247: "Kontakt 24/7",
    privacy: "Datenschutz",
    terms: "Bedingungen",
    rights: "Alle Rechte vorbehalten",
  },
  excursions: {
    title: "Geführte Aktivitäten und Ausflüge auf Lanzarote",
    subtitle:
      "Ausflüge und Führungen, um das Beste von Lanzarote zu entdecken.",
    faqTitle: "Häufige Fragen zu unseren Ausflügen auf Lanzarote",
    cruiseHint: "Kommen Sie mit dem Kreuzfahrtschiff?",
    cruiseLink: "Optionen für Ihren Hafenstopp ansehen",
    faqs: [
      {
        q: "Wann erhalte ich meinen Ausflugsbon?",
        a: "Nach der Bestätigung erhalten Sie eine E-Mail mit Bon und Abholungsdetails.",
      },
      {
        q: "Welche Zahlungsmethoden gibt es?",
        a: "Bei Ausflügen und Kreuzfahrten: 20 % per Karte und Rest bar, oder 100 % online (Karte/Bizum). Transfers werden vollständig online bezahlt.",
      },
      {
        q: "Wo ist der Treffpunkt?",
        a: "Wir holen Sie an Ihrer Unterkunft ab. Der genaue Punkt steht auf dem Bon.",
      },
      {
        q: "Wie ist die Stornierungsregelung?",
        a: "Kostenlose Stornierung bis 48 Stunden vor der Abholung.",
      },
      {
        q: "In welchen Sprachen finden die Touren statt?",
        a: "Wir mischen keine Sprachen: unsere Ausflüge sind nur auf Spanisch.",
      },
    ],
  },
  transfers: {
    title: "Flughafentransfers Lanzarote",
    airportHotel: "Flughafen zum Hotel",
    hotelAirport: "Hotel zum Flughafen",
    roundTrip: "Hin und zurück",
    tableTitle: "Private Transfers vom und zum Flughafen Lanzarote",
    destination: "Ziel",
    duration: "Dauer",
    oneWay: "Einfach",
    return: "Hin und zurück",
    extraPerson: "Zusätzliche Person",
    faqTitle: "Häufige Fragen zu unseren Transfers",
    faqs: [
      {
        q: "Wo finde ich meinen Fahrer?",
        a: "Wir erwarten Sie in der Ankunftshalle mit einem Schild mit Ihrem Namen.",
      },
      {
        q: "Was passiert bei Flugverspätung?",
        a: "Wir verfolgen Flüge und passen die Abholung ohne Aufpreis an.",
      },
      {
        q: "Wie ist die Stornierungsregelung?",
        a: "Kostenlose Stornierung bis 48 Stunden vor dem Service.",
      },
    ],
  },
  cruises: {
    title: "Landausflüge auf den Kanarischen Inseln",
    select: "Wählen Sie Ihren Ausflug",
    pickup: "Abholung am Hafen",
    pickupText:
      "Wir erwarten Sie nahe dem Pier. Nennen Sie uns Schiff und Ausschiffungszeit.",
    return: "Pünktliche Rückkehr",
    returnText: "Wir passen die Route an Ihre All-aboard-Zeit an.",
    essentials: "Das Wesentliche",
    essentialsText:
      "Timanfaya, El Golfo, Jameos… das Beste der Insel in Ihrer Landzeit.",
    recommended: "Landausflüge",
    recommendedText:
      "Einzigartige Erlebnisse für jeden Hafenstopp, in kleinen spanischsprachigen Gruppen.",
    privateTitle: "Lieber privat?",
    privateText:
      "Die flexibelste Option für Familien oder eine individuelle Route.",
    scheduleKicker: "Saison",
    scheduleTitle: "Kreuzfahrtkalender Lanzarote",
    scheduleText: "Geplante Schiffe in",
    scheduleEmpty: "Noch keine veröffentlichten Anläufe.",
    filterMonth: "Monat",
    searchShip: "Suche",
    searchPlaceholder: "Schiff oder Reederei…",
    noResults: "Keine Anläufe für diese Filter.",
    shipSingular: "Schiff",
    shipPlural: "Schiffe",
    shipsToday: "Schiffe an diesem Tag",
    browseTitle: "Landausflüge auf den Kanarischen Inseln",
    browseSubtitle:
      "Am einfachsten: wählen Sie im Kalender Ihren Hafentag auf Lanzarote. Sie können auch nach Reederei, Schiff und Abfahrt suchen.",
    selectCruise: "Wählen Sie Ihre Kreuzfahrt",
    companiesTitle: "Kreuzfahrtgesellschaften",
    companySailings: "geplante Abfahrten",
    upcomingCruises: "Kommende Kreuzfahrten von",
    shipSailings: "geplante Abfahrten",
    departure: "Geplante Abfahrt",
    nights: "Nächte",
    nightSingular: "Nacht",
    nightPlural: "Nächte",
    viewItinerary: "Route und Ausflüge ansehen",
    noSailings: "Für diese Reederei sind noch keine Abfahrten veröffentlicht.",
    otherCompanies: "Landausflüge anderer Reedereien",
    itineraryTitle: "Häfen dieser Kreuzfahrt",
    callDay: "Hafentag",
    seaDay: "Tag",
    atSea: "Auf See",
    noToursYet:
      "In {port} bieten wir noch keine Ausflüge an. Wir arbeiten mit vertrauenswürdigen Partnern, um Ihnen in jedem Hafen die besten Erlebnisse zu bieten.",
    moreInfo: "Mehr Infos",
    meetingPoint: "Treffpunkt",
    meetingPointTitle: "Treffpunkt auf Lanzarote",
    meetingPointBody:
      "Treffen Sie Ihre Reiseleitung an der Hafenpolizei-Kontrolle. Der Transfer wartet auf dem äußeren Parkplatz (ca. 10 Minuten Fußweg vom Schiff, je nach Liegeplatz).",
    bookTour: "Buchen",
    placesToVisit: "Besichtigungen",
    durationLabel: "Tourdauer",
    smallGroupMax: "Kleine Gruppen, maximal {n} Personen",
    durationHours: "{n} Stunden",
    breadcrumbCruises: "Kreuzfahrtausflüge",
    seeExcursionsForShip: "Kreuzfahrtausflüge ansehen",
    calendarHint:
      "Sie finden Ihr Schiff auch im Lanzarote-Hafenkalender.",
    bookTourTitle: "Diesen Ausflug buchen",
    selectPassengers: "Anzahl der Passagiere wählen",
    passengerSingular: "Passagier",
    passengerPlural: "Passagiere",
    perPerson: "Person",
    bookingTotal: "Gesamtpreis Ihrer Buchung",
    confirmBooking: "Buchung bestätigen",
    included: "Inbegriffen",
    notIncluded: "Nicht inbegriffen",
    goToCart: "Zum Warenkorb",
    dateCalendarKicker: "Hafentag",
    dateCalendarTitle: "Wählen Sie Ihren Hafentag auf Lanzarote",
    dateCalendarText:
      "Tippen Sie im Kalender auf den Tag, an dem Ihr Schiff anlegt, und sehen Sie die verfügbaren Abfahrten in",
    dateCalendarLegend:
      "Markierte Tage haben Hafenstopps. Tippen Sie auf einen Tag, um Schiffe und Ausflüge zu sehen.",
    dateCalendarEmptyDay: "An diesem Tag sind keine Schiffe veröffentlicht.",
    dateCalendarPickDay: "Wählen Sie einen Tag im Kalender, um fortzufahren.",
    dateCalendarNoItinerary:
      "Die komplette Route ist für diesen Hafenstopp noch nicht verfügbar.",
    prevMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    orBrowseByCompany: "Oder nach Reederei suchen",
  },
  about: {
    welcome: "Willkommen auf Lanzarote!",
    mission: "Mission",
    missionText:
      "Hochwertige Führungen auf Lanzarote in kleinen Gruppen und nur auf Spanisch anbieten.",
    vision: "Vision",
    visionText:
      "Die lokale Referenz für authentische Lanzarote-Erlebnisse sein.",
    values: "Unsere Werte",
    promise: "Unser Versprechen",
    contact: "Kontakt",
    seeExcursions: "Ausflüge ansehen",
  },
  houses: {
    title: "Ferienhäuser auf Lanzarote",
    subtitle:
      "Unterkünfte in Playa Honda. Buchen Sie direkt auf jeder Objektseite.",
    cta: "Ansehen & buchen",
    empty: "Unsere Ferienhäuser erscheinen hier in Kürze.",
    guests: "Gäste",
    bedrooms: "Schlafzimmer",
    size: "m²",
  },
  contact: {
    title: "Wie können wir helfen?",
    subtitle: "Wir beantworten gerne alle Fragen. Kontakt 24 / 7.",
    formTitle: "Kontaktformular",
    infoTitle: "Kontaktinformationen",
    name: "Name",
    message: "Nachricht",
    send: "Nachricht senden",
    sending: "Wird gesendet…",
    success: "Nachricht gesendet. Wir melden uns so schnell wie möglich.",
    address: "Calle Calderetas, 100\n35550 San Bartolomé - Lanzarote",
  },
  cart: {
    title: "Ausgewählte Aktivitäten",
    empty: "Ihr Warenkorb ist leer.",
    seeExcursions: "Ausflüge ansehen",
    hotel: "Hotel / Unterkunft",
    payment: "Zahlungsmethode",
    checkout: "Buchung abschließen",
    remove: "Entfernen",
    now: "Jetzt",
    cashDay: "Bar",
  },
  manage: {
    title: "Buchung verwalten",
    subtitle: "Geben Sie Ihre Buchungsnummer und die verwendete E-Mail ein.",
    bookingId: "Buchungsnummer",
    lookup: "Buchung suchen",
    searching: "Suche…",
    activity: "Aktivität",
    people: "Personen",
    status: "Status",
    payment: "Zahlung",
    help: "Änderungen nötig? Kontaktieren Sie uns.",
    viewVoucher: "Voucher ansehen",
    cancelBooking: "Buchung stornieren",
    printVoucher: "Voucher drucken",
  },
  cancel: {
    title: "Buchung stornieren",
    subtitle:
      "Sie können Ihre Buchung oder einen bestimmten Service einfach und sicher stornieren.",
    intro:
      "Geben Sie Ihren Locator und die E-Mail der Buchung ein, um fortzufahren.",
    continue: "Weiter",
    back: "Zurück",
    backManage: "Buchung verwalten",
    whichService: "Welchen Service möchten Sie stornieren?",
    serviceDate: "Servicedatum",
    passengers: "Passagiere",
    freeCancel: "Kostenlose Stornierung (mehr als 48 Std. vor dem Service).",
    feeCancel: "Die Stornierung dieses Services kostet {fee}",
    reasonTitle: "Wir möchten gerne den Grund Ihrer Stornierung wissen",
    reasons: [
      {
        id: "changed_plans",
        label: "Ich habe meine Pläne geändert und brauche diesen Service nicht",
      },
      {
        id: "not_interested",
        label: "Dieser Service interessiert mich nicht mehr",
      },
      { id: "better_price", label: "Ich habe einen besseren Preis gefunden" },
      {
        id: "personal",
        label: "Aus persönlichen und/oder familiären Gründen",
      },
      { id: "other", label: "Aus anderen Gründen" },
    ],
    submit: "Meine Buchung stornieren",
    cancelling: "Wird storniert…",
    doneTitle: "Buchung storniert",
    success: "Ihre Buchung wurde erfolgreich storniert.",
    alreadyCancelled: "Diese Buchung ist bereits storniert.",
    alreadyCompleted: "Ein bereits durchgeführter Service kann nicht storniert werden.",
    statusPending: "Ausstehend",
    statusConfirmed: "Bestätigt",
    statusCompleted: "Abgeschlossen",
    statusCancelled: "Storniert",
  },
  voucher: {
    title: "VOUCHER / BESTÄTIGUNG",
    subtitle: "Bitte legen Sie dieses Dokument am Servicetag vor",
    issued: "Ausgestellt",
    bookingDate: "Buchungsdatum",
    customer: "Kunde",
    serviceDate: "Servicedatum",
    serviceTime: "Servicezeit",
    returnDate: "Rückreisedatum",
    returnTime: "Rückreisezeit",
    language: "Sprache",
    pickupZone: "Abholzone",
    flight: "Flugnummer",
    present:
      "Bitte legen Sie diesen Voucher am Servicetag vor. Wir speichern Ihren Locator in unseren Systemen.",
    print: "Drucken",
    download: "Herunterladen",
    notFound: "Voucher nicht gefunden",
    notFoundBody: "Prüfen Sie den Locator oder suchen Sie Ihre Buchung.",
  },
  tourDetail: {
    reviews: "Bewertungen",
    maxPeople: "Bis zu {n} Personen",
    alsoAvailable: "Auch verfügbar als {size}",
    sameItinerary: "Gleiche Route ab {price}/Erwachsener.",
    view: "{name} ansehen",
    highlights: "Highlights",
    places: "Orte, die wir besuchen",
    included: "Inbegriffen",
    notIncluded: "Nicht inbegriffen",
    recommendations: "Empfehlungen",
    cancellation: "Stornierungsbedingungen",
    maxAbbrev: "max.",
    video: "Video der Tour",
    map: "Kartenübersicht",
    openMap: "Karte öffnen",
    reviewsKicker: "Tripadvisor",
    reviewsTitle: "Bewertungen zu dieser Tour",
    reviewsSubtitle:
      "Erfahrungen von Reisenden auf Tripadvisor und bei unseren Touren.",
    reviewsBasedOn: "Basierend auf {n} Tripadvisor-Bewertungen",
    reviewsCta: "Mehr auf Tripadvisor lesen",
    reviewsTraveler: "Reisender",
  },
  blog: {
    eyebrow: "Blog",
    readArticle: "Artikel lesen",
    readMore: "Mehr lesen",
    related: "Das könnte Sie auch interessieren",
  },
  booking: {
    date: "Datum *",
    time: "Servicezeit",
    name: "Vollständiger Name *",
    hotel: "Hotel / Abholpunkt",
    cruiseShip: "Kreuzfahrtschiff (falls zutreffend)",
    notes: "Notizen",
    paymentMethod: "Zahlungsmethode",
    card: "100% online (Karte)",
    bizum: "100% online (Bizum)",
    deposit: "20% Karte + Rest bar",
    payOnDay: "Zahlung am Tourtag",
    addToCart: "In den Warenkorb",
    bookNow: "Jetzt buchen",
    requestTour: "Ausflug anfragen",
    requestHint:
      "Dieser Ausflug ist auf Anfrage. Senden Sie Ihre Anfrage und wir bestätigen die Verfügbarkeit.",
    cancelPolicy: "Kostenlose Stornierung bis 48 Std. vorher",
    selectDate: "Bitte wählen Sie ein Datum für den Warenkorb.",
    fillRequired: "Bitte füllen Sie die Pflichtfelder aus.",
    added: "Zum Warenkorb hinzugefügt.",
    payNow: "Jetzt (20% Karte)",
    cashLater: "Bar am Tag",
    perAdult: "pro Erwachsenem",
    perVehicle: "pro Fahrzeug",
    flatPrice: "Pauschalpreis",
    passengersInGroup: "Personen in der Gruppe",
    hoursMin: "Stunden (min. 4)",
    bookError: "Buchung fehlgeschlagen",
  },
  transferForm: {
    title: "Transfer buchen",
    subtitle: "Privat · Empfang mit Namensschild",
    destination: "Ziel *",
    route: "Strecke *",
    passengers: "Passagiere",
    flight: "Flugnummer",
    hotelAddress: "Hotel / Adresse *",
    time: "Servicezeit *",
    returnDate: "Rückreisedatum",
    returnTime: "Rückreisezeit",
    payment: "Zahlung",
    confirm: "Transfer bestätigen",
  },
  confirmation: {
    title: "Buchung erhalten!",
    body: "Wir haben eine Bestätigungs-E-Mail gesendet. Unser Team meldet sich bei Bedarf.",
    locator: "Referenz",
    service: "Service",
    paidOnline: "Bezahlt (Karte/online)",
    cashPending: "Bar noch offen",
    invoice: "Rechnung",
    viewVoucher: "Voucher ansehen / drucken",
    manage: "Buchung verwalten",
    cancel: "Buchung stornieren",
    print: "Bestätigung drucken",
  },
  payments: {
    card: "100% online (Karte)",
    bizum: "100% online (Bizum)",
    pay_on_day: "Zahlung am Tourtag",
    deposit_10: "10% Karte + Rest bar",
    deposit_20: "20% Karte + Rest bar",
  },
  chat: {
    title: "LET Assistent",
    subtitle: "Ausflüge, Transfers und mehr",
    greeting:
      "Hallo! Ich bin der Assistent von Lanzarote Experience Tours. Fragen Sie mich zu Ausflügen, Preisen, Transfers oder Kreuzfahrten.",
    placeholder: "Schreiben Sie Ihre Frage…",
    writing: "Schreibt…",
    suggestions: [
      "Timanfaya oder Grand Tour?",
      "Transfer nach Playa Blanca",
      "Ich komme einen Tag mit dem Schiff",
      "Kann ich 20% und den Rest bar zahlen?",
    ],
    error:
      "Ich konnte gerade nicht antworten. Bitte erneut versuchen oder +34 646 08 05 85 anrufen.",
  },
  contactWidget: {
    title: "Lanzarote Experience Tours",
    slug: "Kontakt 24 / 7",
    help: "Brauchen Sie Hilfe? Wir beantworten gerne alle Fragen.",
    questions: "Fragen?",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
  },
};

const dictionaries: Record<Locale, Dictionary> = { es, en, de };

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const base = dictionaries[locale] ?? dictionaries.es;
  if (locale === "es") return base;
  const { applyTranslationOverrides, getOverridesForLocale } = await import(
    "@/lib/ui-translations"
  );
  const overrides = await getOverridesForLocale(locale);
  return applyTranslationOverrides(base, overrides);
}

export function getDictionarySync(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.es;
}

export function getBaseDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.es;
}

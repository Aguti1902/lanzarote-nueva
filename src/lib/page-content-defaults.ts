import type { PageContentBlock, PageFaqItem } from "@/types";

/** FAQs exactas de la web en producción (excursiones). */
export const DEFAULT_EXCURSIONS_FAQS: PageFaqItem[] = [
  {
    id: "exc-faq-1",
    question: "¿Cuándo recibiré el bono para la excursión?",
    answer:
      "Una vez finalizado el proceso de compra recibirá un mail con la confirmación y el número de referencia. Así mismo, podrá descargar su factura e imprimir el bono que debe entregar al guía.",
  },
  {
    id: "exc-faq-2",
    question: "¿Cuáles son las formas de pago disponibles?",
    answer: "Puede pagar con tarjeta de crédito, PayPal o Stripe.",
  },
  {
    id: "exc-faq-3",
    question: "¿Dónde será el punto de encuentro con el guía?",
    answer:
      "Les recogemos en su alojamiento en las principales zonas turísticas de Lanzarote y en caso de que venga en un crucero, el punto de encuentro será el muelle donde atraque su crucero, una vez pasado la oficina del control de policía.",
  },
  {
    id: "exc-faq-4",
    question: "¿Cuál es la política de cancelación?",
    answer:
      "Puede cambiar el día o cancelar el viaje hasta las 24h antes de la hora de inicio. En el caso de cancelaciones con menos de 24 horas antes del tour no habrá devolución.",
  },
  {
    id: "exc-faq-5",
    question: "¿Qué tipo de vehículos utilizamos para las excursiones?",
    answer:
      "Utilizamos minibuses pero actualmente no tenemos micros adaptado para sillas de ruedas.",
  },
  {
    id: "exc-faq-6",
    question: "¿Cuáles son los idiomas de las excursiones?",
    answer:
      "Realizamos excursiones en español, inglés y alemán, pero no mezclamos idiomas.",
  },
  {
    id: "exc-faq-7",
    question: "¿Cómo consigo la factura por el servicio contratado?",
    answer:
      "Podrá descargar su bono de excursión y su factura una vez finalizado el proceso de compra.",
  },
  {
    id: "exc-faq-8",
    question: "¿Con cuánta anticipación debo reservar mi excursión?",
    answer:
      "Recomendamos hagan las reservas lo antes posible ya que las plazas son limitadas.",
  },
  {
    id: "exc-faq-9",
    question:
      "¿Cómo puedo reservar un tour privado para mi familia, grupo de amigos, instituto o asociación?",
    answer:
      "Ofrecemos tours privados que puede reservar en nuestra web o si lo prefiere puede contactarnos por mail.",
  },
  {
    id: "exc-faq-10",
    question: "¿Qué pasa si pierdo mi Bono de excursión?",
    answer:
      "Esto no es un problema en absoluto! Podrá mostrar al guía su bono a través de su teléfono móvil.",
  },
  {
    id: "exc-faq-11",
    question: "Si me olvida algo en el autobús, ¿cómo puedo recuperarlo?",
    answer: "Póngase en contacto con nuestra oficina al tf 0034 646 08 05 85",
  },
  {
    id: "exc-faq-12",
    question: "¿Qué pasa si me separé del grupo?",
    answer:
      "Nuestros guías siempre explican claramente los lugares y horarios de reunión y todas las excursiones se realizan a tiempo. Esperamos un máximo de 10 minutos sobre la hora establecida. Si su grupo ya se ha ido, por favor, póngase en contacto con nuestra oficina (0034 646 08 05 85).",
  },
];

/** FAQs exactas de la web en producción (traslados). */
export const DEFAULT_TRANSFER_FAQS: PageFaqItem[] = [
  {
    id: "tr-faq-1",
    question: "¿Dónde encontraré a mi chófer?",
    answer:
      "Todos nuestros traslados son servicios privados. Su conductor está en exclusividad para usted y estará esperando en la terminal con un cartel con su nombre para llevarle a su alojamiento o destino. Equipaje especial. Se acepta equipaje especial siempre que nos lo indique en la reserva para que podamos organizar el transporte adecuado. Las sillas para bebés y alzadores son gratuitos. Cada bicicleta tiene un costo adicional de 10.00 € por viaje que hay que abonar en efectivo al conductor",
  },
  {
    id: "tr-faq-2",
    question: "¿Qué sucede si no puedo encontrar a mi chófer?",
    answer:
      "En el caso improbable de que no localice inmediatamente a su conductor, le pedimos que nos llame a cualquiera de números teléfonos. Nos pondremos en contacto con el conductor y lo enviaremos directamente a su ubicación.",
  },
  {
    id: "tr-faq-3",
    question: "¿Qué pasa si mi vuelo tiene un retraso?",
    answer:
      "Cuando usted realiza su reserva debe indicar el número de su vuelo para que nuestro chófer pueda comprobar el estado de su vuelo y le recoja a la hora correcta.",
  },
  {
    id: "tr-faq-4",
    question: "¿Cómo funciona la política de cancelación?",
    answer: "No hay gastos de cancelación hasta 24 horas antes del servicio.",
  },
  {
    id: "tr-faq-5",
    question: "¿Cuándo es mejor reservar mi traslado?",
    answer:
      "Le sugerimos que haga la reserva tan pronto como conozca los detalles de su vuelo.",
  },
  {
    id: "tr-faq-6",
    question: "¿Cómo puedo recuperar un artículo olvidado en el vehículo?",
    answer:
      "Si cree que podría haber dejado algún artículo en el vehículo, póngase en contacto con nuestro Equipo de Servicio al Cliente. Confíe en nuestra profesionalidad para organizar su traslado en Lanzarote.",
  },
];

const IMG = "https://www.lanzaroteexperiencetours.com/dist/images/lanzarote";

/** Apartados «Lanzarote, una isla para descubrir» de /excursiones/ en producción. */
export const DEFAULT_EXCURSIONS_BLOCKS: PageContentBlock[] = [
  {
    id: "exc-block-1",
    layout: "featured",
    title: "Parque Nacional de Timanfaya: un mundo primigenio",
    text: "Timanfaya es otro mundo, con un paisaje marciano resultado de las erupciones ocurridas entre 1730 y 1736, y de nuevo en 1824, donde la escasa vegetación, la variedad de formas de las lavas, y sus colores primigenios crean uno de los panoramas que más impresionan de todas las islas Canarias.",
    image: `${IMG}/parque-nacional-de-timanfaya.jpg`,
    linkText: "Parque Nacional de Timanfaya",
    linkHref:
      "https://www.lanzaroteexperiencetours.com/blog/parque-nacional-de-timanfaya/",
  },
  {
    id: "exc-block-2",
    layout: "card",
    title: "Jameos del Agua: un lugar para enamorarse",
    text: "Jameos del Agua es un espacio único en el mundo ideado por César Manrique y Jesús Soto. Siente la armonía, la belleza, la paz y el sosiego de este túnel volcánico.",
    image: `${IMG}/jameos-del-agua.jpg`,
    linkText: "Jameos del Agua",
    linkHref:
      "https://www.lanzaroteexperiencetours.com/blog/los-jameos-del-agua-en-lanzarote/",
  },
  {
    id: "exc-block-3",
    layout: "card",
    title: "Cueva de los Verdes: una cueva que sorprende",
    text: "Hay pocos lugares como la Cueva de los Verdes. La belleza y singularidad de esta cueva la confirman como una de las maravillas más sorprendentes que esconden Lanzarote.",
    image: `${IMG}/cueva-de-los-verdes.jpg`,
    linkText: "Cueva de los verdes",
    linkHref:
      "https://www.lanzaroteexperiencetours.com/blog/cueva-de-los-verdes-excursiones-en-lanzarote/",
  },
  {
    id: "exc-block-4",
    layout: "card",
    title: "Mirador del Río: un regalo para la vista",
    text: "Se encuentra en la cima del imponente acantilado de Famara, cerca de una antigua batería militar del siglo XIX. Desde la terraza se disfruta las vistas sobre la isla de La Graciosa y los islotes del Archipiélago Chinijo.",
    image: `${IMG}/mirador-del-rio-la-graciosa.jpg`,
  },
  {
    id: "exc-block-5",
    layout: "card",
    title: "Jardín de Cactus: un jardín en una antigua rofera",
    text: "El Jardín de Cactus, fácilmente reconocible desde la carretera gracias al gran cactus metálico que hay a su entrada, es la última obra realizada por César Manrique en la isla.",
    image: `${IMG}/jardin-de-cactus.jpg`,
  },
  {
    id: "exc-block-6",
    layout: "card",
    title: "El Golfo y el Lago Verde: un cráter a nivel del mar",
    text: "El Charco de los Clicos o Lago Verde se encuentra en El Golfo, un volcán en el litoral de la costa oeste de Lanzarote que se formó durante las erupciones de 1730, donde la erosión de viento y mar le han configurado su silueta de teatro romano abierto al mar",
    image: `${IMG}/lago-verde-charco-clicos-el-golfo.jpg`,
  },
  {
    id: "exc-block-7",
    layout: "card",
    title: "Fundación César Manrique: Simbiosis de naturaleza y arte",
    text: "La Fundación César Manrique se ubica en la casa-estudio que habitó el artista hasta 1988. Es quizás la obra que mejor representa sus ideales personales y artísticos.",
    image: `${IMG}/fundacion-cesar-manrique.jpg`,
  },
];

export const DEFAULT_EXCURSIONS_BLOCKS_TITLE =
  "Lanzarote, una isla para descubrir";

export const DEFAULT_EXCURSIONS_BLOCKS_INTRO =
  "Lanzarote es una isla donde su paisaje volcánico, negro y rojo, hace que te sientas en un mundo diferente. Vas a encontrar una tierra de silencio y tranquilidad que te hará desconectar y recargarte de energía. Una isla donde te sentirás en casa por el trato de sus gentes hospitalarias, que han sabido respetar el paisaje y aprender a sobrevivir en un lugar donde el agua escasea.";

export const DEFAULT_EXCURSIONS_FAQ_TITLE =
  "Preguntas frecuentes sobre nuestras excursiones en Lanzarote";

export const DEFAULT_TRANSFER_FAQ_TITLE =
  "Preguntas frecuentes sobre nuestros traslados en Lanzarote";

export function newPageItemId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

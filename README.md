# Lanzarote Travels

Web de excursiones y traslados en Lanzarote (Next.js + React), con panel de administración para reservas y estadísticas.

## Arranque

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Panel admin

- URL: `/admin`
- Contraseña demo: `admin123`

Desde el panel puedes:

| Sección | Qué puedes hacer |
|---------|------------------|
| Dashboard | Estadísticas, accesos rápidos |
| Reservas | Ver todas, confirmar / completar / cancelar |
| Excursiones | Crear, editar, eliminar tours y precios |
| Traslados | Ver todos los destinos, precios ida/vuelta, ventajas |
| Cruceros | Calendario de escalas temporada 2026-2027 (crear / editar / ocultar) |
| Blog | Crear / editar / eliminar entradas |
| Ajustes web | Teléfono, email, textos de inicio, cruceristas, sobre nosotros |

Los cambios se guardan en `src/data/*.json` y se ven en la web al instante.

## Chat IA

Botón flotante **Chat IA** en la web pública. Responde sobre excursiones, traslados, precios y cruceristas usando el contenido de la web.

- Sin configuración: asistente local (funciona al instante).
- Con OpenAI: copia `.env.example` a `.env.local`, añade `OPENAI_API_KEY` y reinicia el servidor.

## Páginas públicas

- `/` — Inicio
- `/sobre-nosotros`
- `/excursiones` — listado (grupo reducido / grande / privados)
- `/excursiones/[slug]` — detalle + reserva
- `/excursiones-cruceros` — navieras, salidas e itinerarios con excursiones por escala
- `/crucero/[naviera]/[barco]/[salida]` — itinerario completo del crucero
- `/cruceristas` — landing + calendario de escalas en Lanzarote temporada 2026-2027
- `/traslados` — aeropuerto ↔ destinos
- `/blog`

## Pagos (grupo grande)

En Ruta Sur y Grand Tour de **grupo grande** el widget permite tarjeta, Bizum o pago el día del tour. En grupo reducido: tarjeta o Bizum.

> La pasarela real (Redsys/Stripe/Bizum) se puede conectar después; ahora las reservas se guardan en `src/data/bookings.json`.

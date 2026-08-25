# Lanzarote Travels

Web de excursiones y traslados en Lanzarote (Next.js + React), con panel de administración para reservas y estadísticas.

## Arranque

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Supabase (datos en producción)

Por defecto la app puede usar JSON locales. Con Supabase configurado, **todas las reservas, CMS, facturas, cruceros y uploads** pasan a la base de datos.

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el SQL Editor, ejecuta el script:
   `supabase/migrations/20260825170000_initial.sql`
3. En Storage, crea un bucket público llamado `uploads`.
4. Copia `.env.example` → `.env.local` y rellena:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_PASSWORD=tu-password-admin
```

5. Importa los datos demo actuales:

```bash
node --env-file=.env.local scripts/seed-supabase.mjs
```

6. En Vercel, añade las mismas variables de entorno y redespliega.

Si faltan las variables de Supabase, la app sigue funcionando con `src/data/*.json` (modo local).

## Panel admin

- URL: `/admin`
- Contraseña: la de `ADMIN_PASSWORD` (por defecto `admin123`)

Desde el panel puedes:

| Sección | Qué puedes hacer |
|---------|------------------|
| Dashboard | Estadísticas, accesos rápidos |
| Banner | Texto marquee ES/EN/DE (en Ajustes) |
| Reservas | Ver todas, confirmar / completar / cancelar |
| Reservas cruceros | Filtro de reservas con barco/escala |
| Grupos cruceros | Grupos de pax por barco/fecha/excursión |
| Importar reservas | CSV/Excel de proveedores → reservas |
| Pagos online | Crear enlaces de pago y marcar estados |
| Cobros efectivo | Seguir depósitos 10% y cobros del día |
| Facturas | Emitir / abonar |
| Estadísticas | Ingresos y métodos de pago |
| Excursiones | Crear, editar, eliminar tours y precios |
| Excursiones shore | Catálogo de shore excursions |
| Traslados | Destinos, precios ida/vuelta |
| Compañías / Puertos / Escalas | Catálogo de cruceros y calendario |
| Colaboradores | Agencias / hoteles B2B |
| Feedback | Valoraciones y sugerencias de clientes |
| Redirecciones | 301/302 SEO entre slugs |
| Traducciones | Textos UI ES → EN / DE |
| Blog | Crear / editar / eliminar entradas |
| Ajustes | Contacto, textos hero, datos fiscales |

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
- `/crucero/[naviera]/[barco]/[salida]` — itinerario completo; reserva y compra de excursiones en Lanzarote
- `/excursiones-cruceros/tour/[id]` — ficha de excursión de crucero con carrito / reserva
- `/cruceristas` — landing + calendario de escalas en Lanzarote temporada 2026-2027
- `/traslados` — aeropuerto ↔ destinos
- `/blog`

## Pagos (grupo grande)

En Ruta Sur y Grand Tour de **grupo grande** el widget permite tarjeta, Bizum o pago el día del tour. En grupo reducido: tarjeta o Bizum.

> La pasarela real (Redsys/Stripe/Bizum) se puede conectar después; ahora las reservas se guardan en `src/data/bookings.json`.

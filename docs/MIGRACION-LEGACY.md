# Migración de la web antigua (MariaDB) → web nueva

## Qué se ha migrado

Desde la base `lanzarote_experience_tours` del VPS:

| Origen | Destino | Cantidad aprox. |
|--------|---------|-----------------|
| `bookings` + `booking_items` | `Booking` (excursiones, traslados, privados) | ~6.105 ítems |
| `cruise_bookings` + `cruise_booking_items` | `Booking` con `customer.cruiseShip` | ~895 ítems con cabecera |
| `customers` | Embebidos en cada reserva | ~4.620 |

Los localizadores antiguos (`R…`, `CR…`) se conservan. Si una reserva tenía varios servicios, el id queda como `R…-i{itemId}`.

### Estados legacy

| Código | Significado en la web nueva |
|--------|----------------------------|
| `CF` | confirmada / realizada (si la fecha ya pasó) |
| `PP` | pendiente |
| `PC` | confirmada (pago en destino / pendiente de cobro) |
| `CX` | cancelada |

### Pagos

- Con `stripe_id` / `paypal_id` (o pago Stripe en crucero) → tarjeta / pagado.
- Sin referencia online → pago el día.
- Pagos parciales de crucero (`total_pay` < total) → depósito / parcial.

### Excursiones shore sin cabecera

Hay ~9.5k filas en `cruise_booking_items` cuyo `cruise_bookings` padre ya no existe (borrados). **No se importan**: no hay cliente/email. Son casi todas `PP`/`PC` históricas sin futuro.

## Supabase (importante en producción)

La web en Vercel puede leer reservas desde **Supabase Storage** (`bucket cms` → `bookings.json`). Si ese fichero sigue siendo el seed antiguo (~25 reservas), **pisa** el JSON grande del deploy.

Tras desplegar esta rama / merge a `main`:

1. En Admin → Reservas, pulsar **Sync CMS** (o `POST /api/admin/sync-bookings`).
2. O ejecutar en local con las env de Supabase:

```bash
npm run seed:supabase
```

Eso sube todo `src/data/*.json` al bucket `cms` (incl. las ~7k reservas).

En runtime, si el deploy tiene muchas más reservas legacy que Storage, la app **elige el del deploy y lo sube sola** a Storage.

## Cómo regenerar el JSON

1. En el VPS, exportar tablas a JSON (PHP/`mysqli`, sin subir contraseñas al repo).
2. En este proyecto:

```bash
node scripts/migrate-legacy-mysql.mjs /ruta/al/export --write
```

3. Opcional: Admin → Importar reservas → JSON legacy (idempotente por `id`).
4. Si usáis Supabase: **Sync CMS** o `npm run seed:supabase`.

## Panel admin

- Pestaña **Todos** (por defecto): ver el histórico completo.
- **Reservas actuales** = solo `confirmed` (pocas tras migrar; el pasado está en **Realizadas**).
- Buscador por id / cliente / email.
- Paginación de 100 en 100.

## Pendiente con Angela (Strato / pagos)

- Credenciales panel Strato (DNS del dominio → Vercel).
- Stripe / PayPal (claves live) para la web nueva.
- Acceso admin WordPress / panel antiguo si hace falta cortar la web vieja.
- **Rotar** contraseñas SSH y MySQL del VPS (quedaron expuestas en el traspaso).

## SSL / correo

- SSL: Let’s Encrypt en el VPS actual; en Vercel el certificado lo gestiona la plataforma.
- SMTP de reservas: confirmar con Angela si Strato sigue enviando correo o hay que configurar otro.

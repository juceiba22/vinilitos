# Vinilitos — Plataforma de páginas

Multitenant tipo Carrd/Linktree para los músicos que compran vinilitos: cada
uno activa un código (impreso o en el NFC/QR del vinilito), pega sus links de
Spotify/YouTube/SoundCloud/Apple Music/Bandcamp/lo que sea, y obtiene una
página propia estilo vinilo con portada y título auto-completados.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Prisma 6 + SQLite (`prisma/dev.db`) — pensado para migrar a Postgres en
  producción sin cambiar el código de la app, solo el `datasource` y el
  `DATABASE_URL`.
- Sin librerías externas de UI: todo el diseño "vinilo" es CSS/Tailwind +
  un componente `VinylDisc`.

## Cómo correrlo

```bash
npm install
npm run db:migrate   # crea prisma/dev.db con el esquema
npm run codes:generate "Nombre de la tirada" 10   # genera 10 códigos de activación
npm run dev
```

Abrí `http://localhost:3000`.

## Flujo de uso

1. **`/`** — landing explicando el producto.
2. **`/activar?code=VNLT-XXXXXX`** — el QR/NFC del vinilito apunta acá (con
   el código como query param, precargado en el input). El músico completa
   su nombre de artista y canjea el código.
3. Al canjear, se crea una `Page` con un `slug` público (derivado del
   nombre) y un `editToken` secreto, y redirige a
   **`/editor/[slug]/[editToken]`** — esa URL es la que el músico debe
   guardar para volver a editar su página. No hay login: la URL con el
   token *es* la credencial (igual que un link de edición de Canva/Figma
   compartido).
4. En el editor pega sus links; cada uno dispara `POST /api/links/preview`,
   que detecta la plataforma por dominio y trae título + miniatura vía
   oEmbed (Spotify/YouTube/SoundCloud) o, si la plataforma no tiene oEmbed
   público (Apple Music, Bandcamp, cualquier otra), hace fallback a scrapear
   las meta tags Open Graph de la página.
5. Al guardar, la página pública queda viva en **`/[slug]`**.

## Códigos de activación

`scripts/generate-codes.js` genera códigos únicos (`VNLT-XXXXXX`) asociados
a un `batchName` (ej. "Facundo Bronstein Vol.1 — tirada 50u"), pensado para
correr una vez por tirada de vinilitos antes de mandarla a imprimir/grabar
en los NFC. Cada código se puede canjear una sola vez.

En producción esto se reemplaza por un panel admin simple (no incluido en
este MVP) que liste tiradas, genere PDFs de QR para imprimir, y programe la
escritura de las tags NFC.

## Vencimiento y renovación anual

La suscripción **vence al año y hay que renovarla** — no es un pago único
de por vida. Cada `Page` tiene `subscriptionExpiresAt`, fijado a "fecha de
activación + 1 año" al canjear el código inicial.

- **Página pública (`/[slug]`)**: mientras la suscripción esté vigente
  muestra los links normalmente. Vencida, oculta los links y muestra un
  aviso de "suscripción vencida" — la página no desaparece (el slug y los
  datos se conservan), solo deja de exponer los links.
- **Editor (`/editor/[slug]/[editToken]`)**: siempre accesible, vencida o
  no (así el músico puede renovar). Muestra la fecha de vencimiento, un
  aviso si vence en ≤30 días, y un campo para canjear un **código de
  renovación**.
- **Renovación**: `scripts/generate-renewal-codes.js`
  (`npm run codes:renew "Nombre de la tirada" N`) genera códigos
  `RNVL-XXXXXX`, análogos a los de activación pero para páginas ya
  existentes. El músico los canjea desde su propio editor (autenticado con
  su `editToken`, sin necesidad de panel admin ni login). Si renueva antes
  de vencer, se suma un año a partir del vencimiento actual (no pierde el
  tiempo que le quedaba); si renueva después de vencer, se suma un año a
  partir de la fecha de renovación.

Este mecanismo de código de renovación es el mismo tanto para el canal
presencial (Vinilitos genera el lote y se lo entrega en persona al cobrar
la renovación) como, el día de mañana, para el canal autónomo online: un
webhook de pago confirmado podría generar y enviar por mail un
`RenewalCode` exactamente igual que hace `codes:renew` hoy a mano — no hace
falta un mecanismo distinto por canal.

### Aviso por mail antes de vencer

El músico puede cargar su mail (al activar, o después desde su editor) para
que le avisen antes de que su página venza. `GET /api/cron/send-reminders`
revisa todas las páginas activas con mail cargado y manda un recordatorio
cuando faltan exactamente 30, 15, 7 o 1 día para el vencimiento (una vez
por día por página, nunca duplicado), con un link directo a su editor para
renovar.

- **Envío de mails**: usa [Resend](https://resend.com) vía su API HTTP
  (sin SDK). Sin `RESEND_API_KEY` configurada, el mail se loguea en la
  consola del server en vez de enviarse — así se puede probar todo el
  flujo sin dar de alta una cuenta.
- **Quién dispara el cron**: el endpoint está protegido con `CRON_SECRET`
  (por query `?secret=` o header `Authorization: Bearer`). En Vercel, con
  `vercel.json` (ya incluido) y `CRON_SECRET` seteada en las variables de
  entorno del proyecto, Vercel Cron lo llama solo una vez por día — Vercel
  manda esa misma variable como el header `Authorization` automáticamente.
  Para probarlo en local:
  ```bash
  curl "http://localhost:3000/api/cron/send-reminders?secret=$CRON_SECRET"
  ```
- Variables nuevas en `.env` (ver `.env.example`): `CRON_SECRET`,
  `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL` (para armar el link al editor
  dentro del mail).

## Modelo de cobro

**Decisión actual: la suscripción va incluida en el precio del vinilito
físico.** No hay gateway de pago online — un código de activación *es* la
prueba de pago, y por eso `redeem` no chequea nada de dinero. Este es
exactamente el circuito para el **usuario presencial**: Vinilitos vende y
cobra el vinilito en persona (efectivo, transferencia, POS — por fuera del
sistema) y le entrega un código ya generado con `codes:generate`. **Este
canal ya funciona hoy, sin desarrollo adicional.**

El sistema está pensado para poder sumar, más adelante y sin romper lo
existente, un segundo canal para el **usuario autónomo**: alguien que
quiere pedir sus vinilitos online y pagarlos ahí mismo, sin pasar por
Vinilitos en persona. Para eso falta:

1. Un checkout de Mercado Pago (Checkout Pro es lo más simple para
   empezar).
2. Un modelo `Order` (pedido) que quede `pending` hasta que el webhook de
   Mercado Pago confirme el pago.
3. Al confirmarse el pago, generar automáticamente el/los
   `ActivationCode` del pedido y entregárselos al comprador (por mail, por
   ejemplo) en vez de por `codes:generate` manual.

Esto es una integración acotada (más o menos una jornada de trabajo para
una versión MVP: checkout + webhook + emisión de código) **si el pedido
online es solo la suscripción/código digital**. Si además el pedido online
tiene que disparar la producción y el envío físico del vinilito (impresión
3D + grabado del NFC + despacho), el alcance crece bastante más, porque ahí
ya no es solo software: hay que sumar captura de dirección, costo de
envío, y algún tablero para que producción sepa qué imprimir — coordinación
operativa, no solo una feature de la app.

El vencimiento y la renovación anual (que afecta a los dos canales por
igual) ya está resuelto — ver la sección "Vencimiento y renovación anual"
arriba.

## Qué falta para producción (fuera de alcance de este MVP)

- **Pagos online** (ver sección "Modelo de cobro" arriba) — Mercado Pago
  para el canal autónomo.
- **Base de datos productiva**: migrar de SQLite a Postgres (Vercel
  Postgres, Neon, Supabase) — solo cambia `prisma/schema.prisma`
  (`provider = "postgresql"`) y `DATABASE_URL`.
- **Dominio propio / subdominios** (`facubronstein.vinilitos.play`) en vez
  de `/[slug]`.
- **Panel admin** para Vinilitos: ver todas las páginas creadas, tiradas de
  códigos, y qué páginas están por vencer o ya vencieron.
- **Analytics** por página (clicks por link) — útil para que el músico vea
  qué plataforma le funciona mejor.
- **Editor de imagen de portada** (subida propia en vez de solo URL / auto
  desde el primer link).

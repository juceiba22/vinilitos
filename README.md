# Vinilitos — Plataforma de páginas

Multitenant tipo Carrd/Linktree para los músicos que compran vinilitos: cada
uno activa un código (impreso o en el NFC/QR del vinilito), pega sus links de
Spotify/YouTube/SoundCloud/Apple Music/Bandcamp/lo que sea, y obtiene una
página propia estilo vinilo con portada y título auto-completados.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Prisma 6 + Postgres (misma base para local y producción — ver
  `.env.example` para el formato de `DATABASE_URL`).
- Sin librerías externas de UI: todo el diseño "vinilo" es CSS/Tailwind +
  un componente `VinylDisc`.

## Cómo correrlo

```bash
npm install
# copiá .env.example a .env y completá DATABASE_URL con tu Postgres
npm run db:migrate   # aplica el esquema a tu base
npm run codes:generate "Nombre de la tirada" 10   # genera 10 códigos de activación
npm run dev
```

Abrí `http://localhost:3000`.

### Deploy en Vercel

El script `vercel-build` (`prisma migrate deploy && next build`) corre
las migraciones pendientes automáticamente en cada deploy — no hace falta
correrlas a mano contra producción. Solo hay que cargar en Settings →
Environment Variables del proyecto en Vercel las mismas variables que
`.env.example`: `DATABASE_URL`, `CRON_SECRET`, `ADMIN_PASSWORD`,
`RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL` (con el dominio real de
producción).

Las páginas que leen de la base en cada visita
(`/admin/codes`, `/admin/pages`, `/admin/renewals`) están marcadas
`export const dynamic = "force-dynamic"` a propósito: sin eso, Next.js
intenta pre-renderizarlas como estáticas en build time, lo que dispara una
consulta a la base durante el build — y en el entorno de build de Vercel
`DATABASE_URL` no está disponible de la misma forma que en runtime.

## Flujo de uso

1. **`/`** — landing explicando el producto.
2. **`/activar?code=VNLT-XXXXXX`** — el QR/NFC de cada vinilito físico
   apunta acá (con el código como query param, precargado en el input). El
   **primer** código de una tirada (`batchName`) que se canjea pide nombre
   de artista y crea la página. Los **demás** códigos de esa misma tirada
   — porque una tirada son varias copias físicas del mismo álbum, no
   álbumes distintos — no vuelven a mostrar el formulario: redirigen
   directo a la página ya creada (`Page.activationBatchName` es la
   relación 1 tirada → 1 página). Ninguno de esos códigos "de más" entrega
   acceso de edición — eso es solo para quien activó primero.
3. Al canjear el primer código, se crea una `Page` con un `slug` público
   (derivado del nombre) y un `editToken` secreto, y redirige a
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

Cada código único (`VNLT-XXXXXX`) se genera en lote, asociado a un
`batchName` (ej. "Facundo Bronstein Vol.1 — tirada 50u"), antes de mandar
esa tirada a producir/grabar en los NFC. Cada código se canjea una sola vez.

Dos formas de generarlos, ambas escriben lo mismo en la base:

- **Panel admin** (`/admin/codes`, ver sección siguiente) — pensado para el
  uso real del día a día, sin tocar código ni terminal.
- **`npm run codes:generate "Nombre de la tirada" 10`**
  ([scripts/generate-codes.js](scripts/generate-codes.js)) — útil para
  generar en bulk desde CI/un script, o si preferís la terminal.

## Panel admin

`/admin` (protegido con una contraseña compartida en `ADMIN_PASSWORD`) es
donde alguien de Vinilitos, sin tocar código, hace la operación del día a
día:

- **`/admin/codes`**: generar un lote nuevo de códigos de activación (nombre
  de tirada + cantidad) y ver las tiradas existentes con cuántos códigos
  están usados / grabados vs. pendientes.
  - **"Ver QR"** muestra los códigos de una tirada como grilla de QR
    imprimible (cada uno apunta a `/activar?code=...`), con un botón
    "Imprimir" pensado para mandar a producción.
  - **"Grabar NFC"** (`/admin/codes/nfc?batch=...`) es la vista para hacer
    el trabajo físico uno por uno: un código a la vez con su QR grande,
    botón "Marcar grabado y siguiente" que guarda el estado
    (`ActivationCode.nfcWritten`) y salta automáticamente al próximo
    pendiente, más una lista de todos los códigos de la tirada para saltar
    a cualquiera puntual. Pensada para usarse desde el celular mientras se
    graba cada tag.
- **`/admin/renewals`**: lo mismo pero para códigos de renovación (ver
  sección de vencimiento más abajo) — se generan cuando un músico paga la
  renovación presencialmente.
- **`/admin/pages`**: todas las páginas activadas, ordenadas por
  vencimiento, con su estado (activa / vence pronto / vencida), mail de
  contacto, y links directos a la página pública y al editor de cada una
  (el link al editor es sensible — solo para ayudar a un músico que perdió
  el suyo).

**Cómo funciona el login**: una sola contraseña compartida (`ADMIN_PASSWORD`
en `.env`), sin cuentas individuales — alcanza para un equipo chico. Al
loguearse, [`/api/admin/login`](src/app/api/admin/login/route.ts) firma una
cookie de sesión (HMAC con la propia contraseña como clave, sin guardar
nada en la base) válida 12hs. [`src/proxy.ts`](src/proxy.ts) — el
`middleware.ts` de versiones anteriores de Next.js, renombrado a `proxy.ts`
desde Next 16 — protege todo `/admin/*` y `/api/admin/*`, redirigiendo a
`/admin/login` sin sesión válida. Si cambiás `ADMIN_PASSWORD`, todas las
sesiones firmadas con la contraseña anterior quedan inválidas solas.

Los scripts de terminal (`codes:generate`, `codes:renew`) siguen andando
igual — el panel no los reemplaza, les da una alternativa sin terminal.

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
- **Cuentas individuales para el equipo de Vinilitos** (con roles/permisos
  distintos) si en algún momento son varias personas — hoy alcanza con la
  contraseña compartida del panel admin.
- **Generar PDFs de QR para imprimir** directamente desde `/admin/codes` en
  vez de solo la lista de códigos en texto.
- **Analytics** por página (clicks por link) — útil para que el músico vea
  qué plataforma le funciona mejor.
- **Editor de imagen de portada** (subida propia en vez de solo URL / auto
  desde el primer link).

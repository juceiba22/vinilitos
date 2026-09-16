# Vinilitos — Plataforma de páginas

Multitenant tipo Carrd/Linktree para los músicos que encargan vinilitos: el
equipo de Vinilitos arma la página del artista desde el panel admin —
cargando los links de Spotify/YouTube/SoundCloud/Apple Music/Bandcamp/lo que
sea que el músico les encargó— y genera un código QR/NFC por cada vinilito
físico, vinculado 1:1 al link/tema correspondiente.

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
npm run dev
```

Abrí `http://localhost:3000`, y `http://localhost:3000/admin` para el panel
(pide `ADMIN_PASSWORD`).

### Deploy en Vercel

El script `vercel-build` (`prisma migrate deploy && next build`) corre
las migraciones pendientes automáticamente en cada deploy — no hace falta
correrlas a mano contra producción. Solo hay que cargar en Settings →
Environment Variables del proyecto en Vercel las mismas variables que
`.env.example`: `DATABASE_URL`, `CRON_SECRET`, `ADMIN_PASSWORD`,
`RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL` (con el dominio real de
producción).

Las páginas que leen de la base en cada visita
(`/admin/pages`, `/admin/pages/[id]/edit`, `/admin/renewals`, `/t/[code]`)
están marcadas `export const dynamic = "force-dynamic"` a propósito: sin
eso, Next.js intenta pre-renderizarlas como estáticas en build time, lo que
dispara una consulta a la base durante el build — y en el entorno de build
de Vercel `DATABASE_URL` no está disponible de la misma forma que en
runtime.

## Flujo de uso

1. Un músico le encarga a Vinilitos sus vinilitos, con los links de cada
   tema/álbum que quiere que suene al escanearlos.
2. Desde **`/admin/pages`**, alguien de Vinilitos crea una página nueva con
   el nombre del artista (queda en borrador, `Page.published = false`) y
   entra al panel de armado (**`/admin/pages/[id]/edit`**).
3. Ahí pega cada link encargado: `POST /api/admin/pages/[id]/links` detecta
   la plataforma por dominio y trae título + miniatura vía oEmbed
   (Spotify/YouTube/SoundCloud) o, si la plataforma no tiene oEmbed público
   (Apple Music, Bandcamp, cualquier otra), hace fallback a scrapear las
   meta tags Open Graph de la página — la misma lógica que usa el editor del
   músico (`src/lib/linkPreview.ts`).
4. Por cada link, un botón **"Generar código"** crea un `LinkCode` —
   código único, en relación 1:1 con ese link puntual— y muestra su QR (para
   imprimir) y un checkbox para marcarlo grabado en el NFC. Ese código,
   escaneado, lleva a **`/t/[code]`**: una mini-página con la portada/título
   de ese tema y un botón para abrirlo en la plataforma original.
5. Con los links y códigos cargados, **"Publicar página"** pone
   `published = true`, genera el `editToken` secreto de la página y lo
   muestra en el panel — ese es el "código especial" que se le pasa al
   artista para que después pueda entrar a **`/editor/[slug]/[editToken]`**
   y sumarle más información (hoy: sus propios datos y links; a futuro:
   miembros de la banda, fotos, historia).
6. La página pública queda viva en **`/[slug]`**.

## Panel admin

`/admin` (protegido con una contraseña compartida en `ADMIN_PASSWORD`) es
donde alguien de Vinilitos, sin tocar código, hace la operación del día a
día:

- **`/admin/pages`**: todas las páginas (borrador o publicadas), con su
  estado, cuántos links tienen código generado, vencimiento, y accesos
  directos a "Armar" (el panel de edición), la página pública y el editor
  del artista.
- **`/admin/pages/[id]/edit`**: el panel de armado descrito arriba —
  datos del artista, links con preview automático, generación de código
  QR/NFC por link, grilla imprimible con todos los códigos generados de la
  página, y el botón de publicar.
- **`/admin/renewals`**: generar lotes de códigos de renovación (ver
  sección de vencimiento más abajo) — se generan cuando un músico paga la
  renovación presencialmente.

**Cómo funciona el login**: una sola contraseña compartida (`ADMIN_PASSWORD`
en `.env`), sin cuentas individuales — alcanza para un equipo chico. Al
loguearse, [`/api/admin/login`](src/app/api/admin/login/route.ts) firma una
cookie de sesión (HMAC con la propia contraseña como clave, sin guardar
nada en la base) válida 12hs. [`src/proxy.ts`](src/proxy.ts) — el
`middleware.ts` de versiones anteriores de Next.js, renombrado a `proxy.ts`
desde Next 16 — protege todo `/admin/*` y `/api/admin/*`, redirigiendo a
`/admin/login` sin sesión válida. Si cambiás `ADMIN_PASSWORD`, todas las
sesiones firmadas con la contraseña anterior quedan inválidas solas.

## Vencimiento y renovación anual

La suscripción **vence al año y hay que renovarla** — no es un pago único
de por vida. Cada `Page` tiene `subscriptionExpiresAt`, fijado a "fecha de
publicación + 1 año" al publicar la página desde el admin.

- **Página pública (`/[slug]`)**: mientras la suscripción esté vigente
  muestra los links normalmente. Vencida, oculta los links y muestra un
  aviso de "suscripción vencida" — la página no desaparece (el slug y los
  datos se conservan), solo deja de exponer los links. Lo mismo pasa en
  `/t/[code]` para cada link puntual.
- **Editor (`/editor/[slug]/[editToken]`)**: siempre accesible, vencida o
  no (así el músico puede renovar). Muestra la fecha de vencimiento, un
  aviso si vence en ≤30 días, y un campo para canjear un **código de
  renovación**.
- **Renovación**: `scripts/generate-renewal-codes.js`
  (`npm run codes:renew "Nombre de la tirada" N`) o el panel
  `/admin/renewals` generan códigos `RNVL-XXXXXX`. El músico los canjea
  desde su propio editor (autenticado con su `editToken`, sin necesidad de
  panel admin ni login). Si renueva antes de vencer, se suma un año a
  partir del vencimiento actual (no pierde el tiempo que le quedaba); si
  renueva después de vencer, se suma un año a partir de la fecha de
  renovación.

Este mecanismo de código de renovación es el mismo tanto para el canal
presencial (Vinilitos genera el lote y se lo entrega en persona al cobrar
la renovación) como, el día de mañana, para el canal autónomo online: un
webhook de pago confirmado podría generar y enviar por mail un
`RenewalCode` exactamente igual que hace `codes:renew` hoy a mano — no hace
falta un mecanismo distinto por canal.

### Aviso por mail antes de vencer

El músico puede cargar su mail (desde el panel admin al armar la página, o
después desde su propio editor) para que le avisen antes de que su página
venza. `GET /api/cron/send-reminders` revisa todas las páginas publicadas
con mail cargado y manda un recordatorio cuando faltan exactamente 30, 15,
7 o 1 día para el vencimiento (una vez por día por página, nunca
duplicado), con un link directo a su editor para renovar.

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
físico.** No hay gateway de pago online — Vinilitos vende y cobra el
vinilito en persona (efectivo, transferencia, POS — por fuera del sistema)
y arma/publica la página desde el panel admin. **Este canal ya funciona
hoy, sin desarrollo adicional.**

El vencimiento y la renovación anual ya está resuelto — ver la sección
"Vencimiento y renovación anual" arriba.

## Qué falta para producción (fuera de alcance de este MVP)

- **Pagos online** para que el músico encargue y pague sus vinilitos sin
  pasar por Vinilitos en persona.
- **Base de datos productiva**: confirmar el proveedor de Postgres en
  producción (Vercel Postgres, Neon, Supabase) — solo cambia
  `DATABASE_URL`.
- **Perfil extendido del artista** (miembros de la banda, fotos, historia)
  editable desde `/editor/[slug]/[editToken]` con el código que le entrega
  el admin al publicar — la base (editToken, editor) ya está lista, falta
  sumar esos campos.
- **Dominio propio / subdominios** (`facubronstein.vinilitos.play`) en vez
  de `/[slug]`.
- **Cuentas individuales para el equipo de Vinilitos** (con roles/permisos
  distintos) si en algún momento son varias personas — hoy alcanza con la
  contraseña compartida del panel admin.
- **Analytics** por página/link (ya se cuenta `LinkCode.scannedCount`, pero
  no hay UI que lo muestre) — útil para que el músico vea qué tema o
  plataforma le funciona mejor.
- **Editor de imagen de portada** (subida propia en vez de solo URL / auto
  desde el primer link).

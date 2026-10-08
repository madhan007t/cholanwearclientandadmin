# CHOLAN WEAR - E-commerce (MERN)

Premium streetwear store: customer storefront (no login, guest checkout, COD) + admin panel, on one REST API.

```
cholanwear/
  backend/    Express + MongoDB API  (controllers, routes, models, middleware, services, utils, config)
  frontend/   React + Vite + Tailwind  (customer site in src/store-front, admin in src/admin)
```

One React app serves both: the storefront lives at `/`, the admin at `/admin` (code-split, so customers never download admin code). Colours are defined once in `frontend/tailwind.config.js` (black, white, logo gold `#D2A24E`).

## 1. Requirements
- Node.js 20+ (built on 22) and npm
- MongoDB: a local install **or** a free MongoDB Atlas cluster. (For quick local dev you can skip installing Mongo - see below.)

## 2. Installation
```bash
cd backend  && npm install
cd ../frontend && npm install
```

## 3. MongoDB setup
Pick one:
- **Atlas (recommended for production):** create a cluster, a database user, allow your server's IP, copy the connection string into `MONGODB_URI`.
- **Local MongoDB:** `MONGODB_URI=mongodb://127.0.0.1:27017/cholanwear`
- **Zero-install dev mode:** leave `MONGODB_URI` empty and set `USE_MEMORY_DB=true`. A real `mongod` is downloaded on first run and its data is persisted in `backend/.mongo-data`. Dev only - never in production.

## 4. Environment variables
```bash
cp backend/.env.example backend/.env      # then edit
```
| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Mongo connection string |
| `JWT_SECRET` | **Required in production**, 32+ chars. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CLIENT_ORIGIN` | Allowed frontend origin(s), comma separated |
| `COOKIE_SAMESITE` / `COOKIE_SECURE` | `lax`/`true` when same site; `none`/`true` when the frontend and API are on different sites (needs HTTPS) |
| `ADMIN_NAME/EMAIL/PASSWORD` | Used only by the seed scripts (min 8 chars) |
| `UPLOAD_DIR`, `MAX_UPLOAD_MB`, `STORAGE_DRIVER` | Image storage |
| `SERVE_FRONTEND` | `true` = Express also serves `frontend/dist` (single-service deploy) |

Frontend (optional) `frontend/.env`: `VITE_API_URL=https://api.example.com` - only when the API is on a different domain. Leave empty otherwise.
Never commit `.env` (already git-ignored).

## 5. Running in development
Two terminals:
```bash
cd backend  && npm run seed    # admin + settings + sample categories/products (idempotent)
cd backend  && npm run dev     # API on :5000

cd frontend && npm run dev     # site on http://localhost:5173  (proxies /api and /uploads to :5000)
```
- Store: http://localhost:5173 - Admin: http://localhost:5173/admin/login

## 6. Admin creation
`npm run seed` / `npm run seed:admin` create the admin from `ADMIN_EMAIL` + `ADMIN_PASSWORD` (bcrypt-hashed; skipped if it already exists). Change the password afterwards in **Admin > Settings**. Use a strong password in production and remove `ADMIN_PASSWORD` from the server env after seeding.
`npm run seed -- --reset` wipes categories, products and orders first (development only!).

## 7. Sample data & placeholder images
Seed products use generated SVG t-shirt mock-ups in `backend/uploads/placeholders/` (and `frontend/public/placeholders/` for hero/gallery art). They are clearly separate: upload real photos via **Admin > Products** and delete the samples. Regenerate with `npm run placeholders`.

## 8. Testing
With the API running: `cd backend && npm run test:e2e` - 55 API checks (server-side pricing, validation, stock, auth, uploads, order lifecycle).

## 9. Production build
```bash
cd frontend && npm run build           # -> frontend/dist
cd ../backend && NODE_ENV=production SERVE_FRONTEND=true npm start
```
Express then serves the API, `/uploads` and the React app (SPA fallback) on one port - same origin, simplest and safest cookie setup.

## 10. Image storage
Uploads go through `POST /api/admin/uploads` (admin only): type is verified from the file's magic bytes (JPG/PNG/WEBP), max `MAX_UPLOAD_MB`, random file names. Only **URLs** are stored in MongoDB. Storage is behind `backend/services/storage/` - to use Cloudinary/S3, add a driver exporting `save()`/`remove()` that returns absolute URLs and set `STORAGE_DRIVER`. On hosts with ephemeral disks (Render, Heroku, Railway free tiers) local uploads are lost on redeploy - use a persistent volume or a cloud driver.

## 11. Deployment
**Option A - single service (simplest)**: Render / Railway / a VPS. Build the frontend, set env vars (`NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `SERVE_FRONTEND=true`, `CLIENT_ORIGIN=https://yourdomain`), start with `npm start` in `backend`. Put it behind HTTPS (the host or Nginx/Caddy). Mount a persistent disk at `backend/uploads`.

**Option B - split**: frontend on Netlify/Vercel/Cloudflare Pages (`VITE_API_URL=https://api.yourdomain`, add an SPA rewrite `/* -> /index.html`), API elsewhere with `CLIENT_ORIGIN=https://yourdomain`, `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`. Prefer subdomains of one domain with `lax` if you can.

VPS + PM2 + Nginx sketch: `pm2 start server.js --name cholan-api`; Nginx proxies `/` to `localhost:5000` and terminates TLS.

## Security notes
Helmet + CSP, restricted CORS, rate limits (login 10/15 min, orders 30/hour, general API), zod validation on every write, ObjectId validation, httpOnly + SameSite JWT cookie, bcrypt (12 rounds), uniform login errors, uploads verified by magic bytes. **Order prices are never read from the browser**: the API receives product ids/size/colour/quantity only, re-reads current prices and stock from MongoDB, reserves stock atomically and stores an immutable snapshot of each item.

## Adding online payments later
`paymentMethod`/`paymentStatus` already exist on orders. Add the method to `PAYMENT_METHODS` (`models/Order.js`) and the `createOrderSchema`, create the gateway order inside `services/orderService.js` after pricing, and add a verified webhook route that sets `paymentStatus`.

## Feature notes
- Stock is per product; ordering decrements it, cancelling an order returns it.
- Delivery charge and the free-delivery threshold are editable in Admin > Settings.
- The wishlist heart is saved on the visitor's device (no accounts).
- The Contact form opens WhatsApp / the visitor's email app pre-filled (there is no message inbox in the backend). There is no newsletter signup because no mailing service is configured.
- Product/category links in the header (`oversized-t-shirts`, `regular-t-shirts`, `customized-t-shirts`) rely on those category slugs; update `Header.jsx`/`Footer.jsx` if you rename them.

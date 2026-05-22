# Microclimate v2

v2 dipisah menjadi tiga bagian agar deploy bisa berdiri sendiri.

## Struktur

- `backend/`: backend data publik tanpa login. Dipakai dashboard lama/publik untuk mengambil data sensor.
- `user-backend/`: backend baru untuk fitur login, profil, konfigurasi data source, dan dashboard link custom.
- `frontend/`: React app v2. Dashboard publik memakai backend data, sedangkan area user memakai user backend.

## Backend Data Publik

Folder: `backend/`

Endpoint utamanya tetap untuk data sensor:

- `GET /petengoran/station1/history`
- `GET /petengoran/station2/history`
- `GET /petengoran/topic4/history`
- `GET /petengoran/topic5/history`
- `GET /dashboard/topic4/history`
- `GET /health`
- `GET /docs`

Jalankan:

```bash
cd v2/backend
npm install
npm run dev
```

## Backend User Login

Folder: `user-backend/`

Endpoint fitur user:

- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `PATCH /me/profile`
- `PATCH /me/email`
- `PATCH /me/password`
- `GET /user/configs`
- `POST /user/configs`
- `PATCH /user/configs/:id/active`
- `DELETE /user/configs/:id`
- `GET /user/dashboard-links`
- `POST /user/dashboard-links`
- `PATCH /user/dashboard-links/:id/publish`
- `DELETE /user/dashboard-links/:id`
- `GET /public/dashboard-links/:template/:slug`

Jalankan:

```bash
cd v2/user-backend
npm install
npm run dev
```

Default port user backend adalah `3001`.

## SQL Localhost

File SQL siap import:

```text
v2/user-backend/sql/001_user_features.sql
```

Contoh import PostgreSQL lokal:

```bash
psql -U postgres -d microclimate_user -f v2/user-backend/sql/001_user_features.sql
```

Env minimal untuk `user-backend/.env`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME_USER=microclimate_user
```

## Frontend Env

Frontend memakai dua base URL:

```env
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_USER_API_BASE_URL=http://localhost:3001
```

- `REACT_APP_API_BASE_URL`: backend data publik tanpa login.
- `REACT_APP_USER_API_BASE_URL`: backend login/config/dashboard link.

Jalankan:

```bash
cd v2/frontend
npm install
npm start
```

## Testing

Backend user:

```bash
cd v2/user-backend
npm test
```

Frontend:

```bash
cd v2/frontend
npm run build
```

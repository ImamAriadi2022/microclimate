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
- `GET /docs`
- `GET /docs.json`

Jalankan:

```bash
cd v2/user-backend
npm install
npm run dev
```

Default port user backend adalah `3001`.

## Database User Backend

Backend user v2 akan memakai MySQL. Env lokal sudah disiapkan di:

```text
v2/user-backend/.env
```

Template yang aman untuk repo:

```text
v2/user-backend/.env.example
```

Env minimal untuk `user-backend/.env`:

```env
PORT=3001
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=microclimate_user
MYSQL_CONNECTION_LIMIT=10
MYSQL_CONNECT_TIMEOUT_MS=5000
MYSQL_QUERY_TIMEOUT_MS=10000
```

File SQL MySQL siap import:

```text
v2/user-backend/sql/001_user_features.sql
```

Contoh import MySQL lokal:

```bash
mysql -u root -p < v2/user-backend/sql/001_user_features.sql
```

Dokumentasi Swagger backend user:

```text
http://localhost:3001/docs
http://localhost:3001/docs.json
```

## Frontend Env

Frontend memakai dua base URL:

```env
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_USER_API_BASE_URL=http://localhost:3001
```

- `REACT_APP_API_BASE_URL`: backend data publik tanpa login.
- `REACT_APP_USER_API_BASE_URL`: backend login/config/dashboard link.
- Env lama seperti `REACT_APP_API_PETENGORAN_GET_TOPIC4`, `REACT_APP_API_PETENGORAN_GET_TOPIC5`, dan env Kalimantan tetap didukung oleh frontend. Jangan hapus env tersebut dari deployment lama; cukup tambahkan `REACT_APP_USER_API_BASE_URL` untuk fitur login.

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

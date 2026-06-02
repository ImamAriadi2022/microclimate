# Microclimate Monitoring System

Microclimate Monitoring System adalah aplikasi web untuk pemantauan data iklim mikro berbasis sensor IoT. Sistem ini menampilkan data lingkungan seperti suhu udara, kelembaban, curah hujan, kecepatan angin, arah angin, radiasi matahari, tekanan udara, suhu sensor BMP, suhu air, dan oksigen terlarut dalam bentuk gauge, grafik, tabel, serta data unduhan.

Repositori ini berisi dua versi pengembangan:

- `v1`: versi awal sistem dashboard dan backend data sensor.
- `v2`: versi pengembangan lanjutan dengan pemisahan service, fitur login user, konfigurasi sumber data, dashboard custom, dan publikasi link dashboard.

Dokumen ini disusun sebagai ringkasan teknis yang dapat digunakan sebagai bahan pendukung penulisan skripsi.

## Latar Belakang Sistem

Pemantauan iklim mikro diperlukan untuk mengetahui kondisi lingkungan secara lebih cepat dan terukur. Data sensor yang dikirimkan ke database kemudian diolah oleh backend dan ditampilkan oleh frontend dalam bentuk visual yang mudah dipahami. Dengan adanya dashboard berbasis web, pengguna dapat melihat data historis, memantau kondisi terkini, mengunduh data, serta membuat dashboard khusus sesuai kebutuhan sumber data masing-masing.

## Tujuan Pengembangan

Tujuan pengembangan aplikasi ini adalah:

- Menyediakan dashboard monitoring iklim mikro berbasis web.
- Menampilkan data sensor secara visual melalui gauge, grafik, dan tabel.
- Menyediakan API backend untuk mengambil data sensor dari database.
- Menambahkan fitur manajemen user pada versi lanjutan.
- Memungkinkan user membuat konfigurasi sumber data sendiri.
- Memungkinkan user membuat dan membagikan link dashboard custom.
- Menyediakan dokumentasi API menggunakan Swagger/OpenAPI.

## Struktur Proyek

```text
microclimate/
|-- v1/
|   |-- backend/        # Backend versi awal untuk API data sensor
|   `-- frontend/       # Frontend React versi awal
|
|-- v2/
|   |-- backend/        # Backend data publik tanpa login
|   |-- user-backend/   # Backend fitur user, login, konfigurasi, dan link dashboard
|   `-- frontend/       # Frontend React versi lanjutan
|
`-- README.md
```

## Arsitektur Sistem Versi 2

Pada versi 2, sistem dipisahkan menjadi tiga bagian utama:

1. Frontend

   Aplikasi React yang digunakan pengguna untuk membuka halaman utama, dashboard publik, dashboard Petengoran, dashboard Kalimantan, dashboard user, konfigurasi data source, dan dashboard custom.

2. Backend Data Publik

   Backend Express yang menyediakan API data sensor. Backend ini mengambil data dari database PostgreSQL dan dapat digunakan oleh dashboard publik tanpa login.

3. User Backend

   Backend Express terpisah untuk fitur autentikasi, profil user, konfigurasi endpoint, konfigurasi dashboard link, publikasi dashboard, dan penyimpanan pengaturan tampilan. Backend ini menggunakan database MySQL.

Alur umum sistem:

```text
Sensor IoT -> Database -> Backend Data Publik -> Frontend Dashboard
                                      |
User -> Frontend User Dashboard -> User Backend -> Database User
                                      |
                                      `-> Dashboard Custom Publik
```

## Fitur Utama

### 1. Dashboard Monitoring Sensor

Sistem menampilkan data iklim mikro dari beberapa sumber/stasiun. Data yang divisualisasikan meliputi:

- Suhu udara.
- Kelembaban udara.
- Curah hujan.
- Kecepatan angin.
- Arah angin.
- Radiasi matahari.
- Tekanan udara.
- Suhu sensor BMP.
- Suhu air.
- Oksigen terlarut.

Tampilan dashboard terdiri dari:

- Gauge untuk nilai sensor terkini.
- Grafik tren data historis.
- Tabel data sensor.
- Filter rentang waktu.
- Informasi waktu data terakhir aktif.

### 2. Dashboard Petengoran dan Kalimantan

Frontend menyediakan halaman khusus untuk beberapa lokasi/sumber data:

- `/petengoran/*`
- `/kalimantan/*`
- `/dashboard/*`

Masing-masing halaman menggunakan komponen dashboard dan status sensor yang disesuaikan dengan kebutuhan data.

### 3. Pengambilan Data Historis

Backend data publik menyediakan endpoint untuk mengambil data historis dengan dukungan query:

- `limit`
- `offset`
- `atTime`
- `startTime`
- `endTime`

Validasi query dilakukan di backend agar request yang masuk tetap sesuai format dan tidak membebani server.

### 4. Data Latest dan Activity Calendar

Pada v2, backend mendukung endpoint tambahan untuk:

- Mengambil data terbaru dari stasiun.
- Melihat kalender aktivitas data sensor.
- Menjaga kompatibilitas endpoint lama seperti `/petengoran/topic4/history` dan `/petengoran/topic5/history`.

### 5. Download Data

Frontend menyediakan modal unduhan data dengan pilihan:

- Format CSV.
- Format JSON.
- Filter tanggal mulai dan akhir.
- Resampling data.
- Pemilihan interval resampling, misalnya 5 menit, 15 menit, 30 menit, 1 jam, 6 jam, 12 jam, dan 1 hari.
- Pemilihan metode agregasi, seperti mean, first, last, max, dan min.
- Pemilihan field sensor yang ingin disertakan.

### 6. Resampling dan Interpolasi Data

Sistem memiliki utilitas frontend untuk mengolah data time series, termasuk:

- Resampling berdasarkan interval waktu.
- Pengisian nilai rata-rata.
- Konversi data menjadi CSV.
- Pemrosesan data sebelum ditampilkan di grafik atau diunduh.

Fitur ini membantu ketika data sensor terlalu padat atau memiliki interval pengiriman yang tidak seragam.

### 7. Mode Realtime dan Simulasi

Dashboard custom mendukung dua mode data:

- Realtime: mengambil data dari endpoint backend yang dikonfigurasi.
- Simulasi: menghasilkan data contoh untuk pengujian tampilan dashboard.

Mode simulasi berguna untuk demonstrasi, pengujian UI, atau kondisi ketika backend sensor belum tersedia.

### 8. Login dan Registrasi User

Pada v2 ditambahkan user backend dengan fitur:

- Registrasi akun.
- Login akun.
- Validasi email.
- Validasi password minimal 8 karakter.
- Penyimpanan password menggunakan PBKDF2 SHA-256.
- Token session berbasis Bearer Token.
- Penyimpanan hash token menggunakan SHA-256.
- Masa berlaku session 30 hari.

### 9. Manajemen Profil User

User dapat mengelola data akun, yaitu:

- Nama lengkap.
- Username.
- Foto profil.
- Email.
- Password.

Endpoint profil dilindungi middleware autentikasi sehingga hanya user yang sudah login yang dapat mengaksesnya.

### 10. Konfigurasi Data Source

User dapat membuat konfigurasi sumber data untuk dashboard custom. Konfigurasi yang didukung:

- Backend API.
- MQTT/WebSocket sebagai rancangan sumber data.
- Base URL backend.
- Broker URL MQTT.
- Mapping endpoint sesuai template dashboard.
- Mapping topic MQTT.
- Single endpoint mode.
- Client-side resampling.
- Aktivasi satu konfigurasi utama per user.

Frontend juga menyediakan uji koneksi endpoint backend dengan fitur:

- Request langsung ke endpoint target.
- Menampilkan status HTTP.
- Menampilkan contoh response JSON.
- Validasi struktur data sensor.
- Pengecekan field penting seperti timestamp, humidity, temperature, rainfall, windSpeed, irradiation, direction, angle, bmpTemperature, dan airPressure.

### 11. Dashboard Link Custom

User dapat membuat link dashboard custom berdasarkan konfigurasi sumber data. Fitur ini mencakup:

- Membuat nama dashboard.
- Membuat slug link.
- Memilih template dashboard.
- Memilih konfigurasi data source.
- Menyimpan link sebagai draft.
- Publikasi link dashboard.
- Preview dashboard.
- Salin link.
- Hapus link.

Format route frontend untuk dashboard custom:

```text
/:username/:template/:slug
```

Contoh:

```text
/imam/station2/kebun-c-microclimate
```

### 12. Pengaturan Tampilan Dashboard Custom

Dashboard custom memiliki pengaturan UI yang dapat disimpan, antara lain:

- Menampilkan atau menyembunyikan gauge.
- Memilih sensor yang tampil pada gauge.
- Menampilkan atau menyembunyikan grafik.
- Menampilkan atau menyembunyikan tabel.
- Memilih kolom tabel.
- Menampilkan atau menyembunyikan tombol filter.
- Menampilkan atau menyembunyikan tombol download.
- Menyimpan pengaturan UI pada dashboard link.

### 13. Fallback LocalStorage

Frontend v2 menggunakan backend user ketika user login dan token tersedia. Jika backend user tidak dapat dihubungi, beberapa data konfigurasi dan link dashboard tetap dapat dibaca dari `localStorage`. Mekanisme ini membantu proses simulasi, pengembangan lokal, dan demonstrasi fitur.

### 14. Dokumentasi API

Backend menyediakan dokumentasi API menggunakan Swagger UI dan OpenAPI.

Endpoint dokumentasi:

```text
Backend data publik:
/docs
/docs.json

User backend:
/docs
/docs.json
```

Pada backend data publik, tampilan Swagger juga dikustomisasi dengan sidebar agar dokumentasi API lebih mudah dinavigasi.

## Perubahan dan Update Fitur dari v1 ke v2

Berikut ringkasan perubahan utama yang terdapat pada versi 2:

| Bagian | v1 | v2 |
| --- | --- | --- |
| Struktur service | Frontend dan backend utama | Dipisah menjadi frontend, backend data publik, dan user-backend |
| Backend data sensor | API data sensor dasar | API data publik dengan validasi query, rate limit, endpoint latest, endpoint history, activity calendar, simulasi, Swagger |
| Autentikasi | Belum tersedia sebagai service terpisah | Registrasi, login, Bearer Token, session, validasi user |
| Database user | Belum tersedia | MySQL dengan tabel user, session, endpoint config, dan dashboard link |
| Dashboard custom | Belum menjadi fitur utama | User dapat membuat dashboard custom berdasarkan template dan data source |
| Konfigurasi data source | Endpoint bersifat tetap dari environment | User dapat mengatur base URL, mapping endpoint, mapping topic, dan resampling |
| Publikasi dashboard | Dashboard bersifat umum | User dapat membuat link publik berdasarkan username, template, dan slug |
| Pengaturan UI dashboard | Tampilan relatif statis | Gauge, chart, table, filter, download, dan kolom tabel dapat dikonfigurasi |
| Download data | Tersedia pada dashboard | Dikembangkan dengan pilihan format, field, rentang tanggal, interval, dan metode resampling |
| Dokumentasi API | OpenAPI pada backend awal | Swagger/OpenAPI pada backend data dan user-backend |
| Deployment | Konfigurasi Vercel tersedia | Setiap service v2 memiliki konfigurasi deploy masing-masing |

## Teknologi yang Digunakan

### Frontend

Teknologi frontend yang digunakan:

- React 18.
- Create React App / React Scripts.
- React Router DOM untuk routing halaman.
- React Bootstrap dan Bootstrap untuk komponen UI.
- Recharts untuk visualisasi grafik.
- React Gauge Chart untuk visualisasi gauge sensor.
- React Icons untuk ikon antarmuka.
- React Awesome Reveal untuk animasi.
- File Saver untuk proses unduhan file.
- jsPDF dan jsPDF AutoTable untuk kebutuhan ekspor PDF.
- xlsx untuk pengolahan data spreadsheet.
- Web Vitals untuk metrik performa aplikasi.
- Testing Library untuk pengujian komponen React.

### Backend Data Publik

Teknologi backend data publik:

- Node.js.
- Express.js 5.
- CommonJS module system.
- PostgreSQL driver `pg`.
- CORS.
- dotenv untuk environment variable.
- express-rate-limit untuk pembatasan request.
- js-yaml untuk membaca file OpenAPI YAML.
- swagger-ui-express untuk dokumentasi API.
- OpenAPI YAML sebagai spesifikasi endpoint.

### User Backend

Teknologi user backend:

- Node.js.
- Express.js 5.
- MySQL driver `mysql2/promise`.
- CORS.
- dotenv.
- crypto bawaan Node.js untuk hashing password dan token.
- PBKDF2 SHA-256 untuk password hashing.
- SHA-256 untuk token hashing.
- js-yaml.
- swagger-ui-express.
- Node Test Runner untuk pengujian backend.

### Database

Database yang digunakan:

- PostgreSQL untuk data sensor pada backend data publik.
- MySQL untuk data user, session, konfigurasi endpoint, dan dashboard link.

Tabel utama user backend:

- `mc_users`
- `mc_user_sessions`
- `mc_endpoint_configs`
- `mc_dashboard_links`

### Deployment dan Dokumentasi

Teknologi pendukung:

- Vercel untuk deployment service.
- `vercel.json` pada frontend, backend, dan user-backend.
- Swagger UI untuk dokumentasi API interaktif.
- OpenAPI YAML untuk kontrak API.

## Endpoint Utama Backend Data Publik

Beberapa endpoint utama pada `v2/backend`:

```text
GET /health
GET /docs
GET /docs.json

GET /petengoran/station1/history
GET /petengoran/station1/latest
GET /petengoran/station1/activity-calendar

GET /petengoran/station2/history
GET /petengoran/station2/latest
GET /petengoran/station2/activity-calendar

GET /petengoran/topic4/history
GET /petengoran/topic4/latest
GET /petengoran/topic5/history
GET /petengoran/topic5/latest

GET /dashboard/topic4/history
GET /dashboard/topic4/latest

GET /simulate/:source/topic4/latest
GET /simulate/:source/topic4/history
```

## Endpoint Utama User Backend

Beberapa endpoint utama pada `v2/user-backend`:

```text
POST /auth/register
POST /auth/login

GET /me
PATCH /me/profile
PATCH /me/email
PATCH /me/password

GET /user/configs
POST /user/configs
PATCH /user/configs/:id/active
DELETE /user/configs/:id

GET /user/dashboard-links
POST /user/dashboard-links
PATCH /user/dashboard-links/:id/publish
PATCH /user/dashboard-links/:id/ui
DELETE /user/dashboard-links/:id

GET /public/dashboard-links/:username/:template/:slug
GET /public/dashboard-links/:template/:slug

GET /docs
GET /docs.json
```

Endpoint yang berhubungan dengan `/me`, `/user/configs`, dan `/user/dashboard-links` membutuhkan header:

```text
Authorization: Bearer <token>
```

## Environment Variable

### Frontend v2

Contoh konfigurasi environment:

```env
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_USER_API_BASE_URL=http://localhost:3001
```

Keterangan:

- `REACT_APP_API_BASE_URL`: base URL backend data publik.
- `REACT_APP_USER_API_BASE_URL`: base URL user backend.

Frontend juga masih mendukung environment endpoint lama seperti:

```env
REACT_APP_API_PETENGORAN_GET_TOPIC4=
REACT_APP_API_PETENGORAN_GET_TOPIC5=
REACT_APP_API_KALIMANTAN_ONEDAY_TOPIC1=
REACT_APP_API_KALIMANTAN_SEVENDAYS_TOPIC1=
REACT_APP_API_KALIMANTAN_ONEMONTH_TOPIC1=
```

### Backend Data Publik v2

Backend data publik membutuhkan konfigurasi koneksi PostgreSQL dan nama database sumber data. Variabel lengkap dapat dilihat pada file konfigurasi environment backend.

Contoh konsep konfigurasi:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=microclimate_petengoran
DB_NAME_DASHBOARD=microclimate_dashboard
DB_CONNECTION_TIMEOUT_MS=5000
DB_QUERY_TIMEOUT_MS=10000
TOPIC4_TABLE=topic4
TOPIC4_LIMIT=100
TOPIC4_OFFSET=0
TOPIC4_MAX_LIMIT=500
```

### User Backend v2

Contoh konfigurasi environment:

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

## Cara Menjalankan Proyek

### 1. Menjalankan Backend Data Publik

```bash
cd v2/backend
npm install
npm run dev
```

Default service berjalan pada port backend yang dikonfigurasi melalui environment.

### 2. Menjalankan User Backend

```bash
cd v2/user-backend
npm install
npm run dev
```

Default user backend berjalan pada:

```text
http://localhost:3001
```

### 3. Menjalankan Frontend

```bash
cd v2/frontend
npm install
npm start
```

Frontend React akan berjalan pada:

```text
http://localhost:3000
```

Catatan: Jika frontend menggunakan port `3000`, backend data publik dapat dijalankan pada port lain sesuai konfigurasi environment.

## Deployment

Deployment pada versi 2 dibuat terpisah untuk setiap service agar frontend, backend data publik, dan user-backend dapat berjalan secara mandiri. Setiap folder utama di dalam `v2` memiliki file `vercel.json`, sehingga masing-masing dapat dideploy sebagai project Vercel yang berbeda.

Service yang dideploy:

- `v2/frontend`: aplikasi React untuk antarmuka pengguna.
- `v2/backend`: API data sensor publik.
- `v2/user-backend`: API login, user, konfigurasi data source, dan dashboard link.

### Alur Deployment

Urutan deployment yang disarankan:

1. Siapkan database PostgreSQL untuk backend data publik.
2. Siapkan database MySQL untuk user-backend.
3. Deploy `v2/backend` ke Vercel.
4. Deploy `v2/user-backend` ke Vercel.
5. Masukkan URL backend hasil deploy ke environment frontend.
6. Deploy `v2/frontend` ke Vercel.
7. Uji endpoint `/health`, `/docs`, login user, dan dashboard custom.

### Deployment Backend Data Publik

Backend data publik berada pada:

```text
v2/backend
```

File deployment:

```text
v2/backend/vercel.json
```

Konfigurasi Vercel:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

Artinya seluruh request ke backend diarahkan ke serverless function:

```text
api/index.js
```

File tersebut memuat aplikasi Express dari:

```text
src/app.js
```

Environment variable yang perlu diatur pada project Vercel backend data publik:

```env
DB_HOST=
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_NAME=
DB_NAME_DASHBOARD=
DB_CONNECTION_TIMEOUT_MS=5000
DB_QUERY_TIMEOUT_MS=10000
TOPIC4_TABLE=topic4
TOPIC4_LIMIT=100
TOPIC4_OFFSET=0
TOPIC4_MAX_LIMIT=500
```

Setelah deploy, endpoint yang perlu diuji:

```text
https://domain-backend.vercel.app/health
https://domain-backend.vercel.app/docs
https://domain-backend.vercel.app/petengoran/station1/history
https://domain-backend.vercel.app/petengoran/station2/history
```

### Deployment User Backend

User backend berada pada:

```text
v2/user-backend
```

File deployment:

```text
v2/user-backend/vercel.json
```

Konfigurasi Vercel:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ]
}
```

Sama seperti backend data publik, seluruh request diarahkan ke serverless function `api/index.js`, lalu menjalankan aplikasi Express dari `src/app.js`.

Environment variable yang perlu diatur pada project Vercel user-backend:

```env
MYSQL_HOST=
MYSQL_PORT=3306
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=
MYSQL_CONNECTION_LIMIT=10
MYSQL_CONNECT_TIMEOUT_MS=5000
MYSQL_QUERY_TIMEOUT_MS=10000
```

Sebelum user-backend digunakan, tabel MySQL perlu dibuat menggunakan file SQL:

```text
v2/user-backend/sql/001_user_features.sql
v2/user-backend/sql/002_dashboard_link_ui_and_public_username.sql
```

Setelah deploy, endpoint yang perlu diuji:

```text
https://domain-user-backend.vercel.app/health
https://domain-user-backend.vercel.app/docs
https://domain-user-backend.vercel.app/docs.json
```

Fitur yang perlu diuji setelah deploy:

- Registrasi akun.
- Login akun.
- Update profil.
- Menyimpan konfigurasi data source.
- Membuat dashboard link.
- Publikasi dashboard link.
- Membuka dashboard custom publik.

### Deployment Frontend

Frontend berada pada:

```text
v2/frontend
```

File deployment:

```text
v2/frontend/vercel.json
```

Konfigurasi Vercel:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

Konfigurasi tersebut menunjukkan bahwa frontend dibangun sebagai static site dari React. Folder hasil build adalah:

```text
build
```

Route fallback ke `/index.html` diperlukan karena frontend menggunakan React Router. Dengan konfigurasi ini, route seperti `/dashboard`, `/petengoran`, `/:username/dashboard`, dan `/:username/:template/:slug` tetap dapat dibuka langsung dari browser setelah deploy.

Environment variable yang perlu diatur pada project Vercel frontend:

```env
REACT_APP_API_BASE_URL=https://domain-backend.vercel.app
REACT_APP_USER_API_BASE_URL=https://domain-user-backend.vercel.app
```

Jika masih menggunakan endpoint lama, variabel berikut juga dapat diisi:

```env
REACT_APP_API_PETENGORAN_GET_TOPIC4=
REACT_APP_API_PETENGORAN_GET_TOPIC5=
REACT_APP_API_KALIMANTAN_ONEDAY_TOPIC1=
REACT_APP_API_KALIMANTAN_SEVENDAYS_TOPIC1=
REACT_APP_API_KALIMANTAN_ONEMONTH_TOPIC1=
```

Setelah deploy, halaman yang perlu diuji:

```text
https://domain-frontend.vercel.app/
https://domain-frontend.vercel.app/dashboard
https://domain-frontend.vercel.app/petengoran
https://domain-frontend.vercel.app/kalimantan
https://domain-frontend.vercel.app/{username}/dashboard
https://domain-frontend.vercel.app/{username}/station2/{slug}
```

### Deploy Menggunakan Vercel CLI

Jika deployment dilakukan dari terminal, setiap service dapat dideploy dari folder masing-masing.

Backend data publik:

```bash
cd v2/backend
vercel
vercel --prod
```

User backend:

```bash
cd v2/user-backend
vercel
vercel --prod
```

Frontend:

```bash
cd v2/frontend
vercel
vercel --prod
```

Pada saat pertama kali menjalankan `vercel`, pilih atau buat project baru sesuai service yang sedang dideploy. Dengan pendekatan ini, project Vercel dapat dipisahkan menjadi:

```text
microclimate-frontend
microclimate-backend
microclimate-user-backend
```

### Deploy Melalui Dashboard Vercel

Deployment juga dapat dilakukan melalui dashboard Vercel:

1. Import repository dari GitHub.
2. Buat project untuk `v2/backend` dengan root directory `v2/backend`.
3. Buat project untuk `v2/user-backend` dengan root directory `v2/user-backend`.
4. Buat project untuk `v2/frontend` dengan root directory `v2/frontend`.
5. Tambahkan environment variable pada masing-masing project.
6. Jalankan deploy.
7. Setelah backend selesai deploy, salin URL backend ke environment variable frontend.
8. Redeploy frontend agar URL backend terbaru masuk ke build React.

### Catatan Penting Deployment

Beberapa hal yang perlu diperhatikan:

- Backend pada Vercel berjalan sebagai serverless function, bukan server Node.js yang selalu aktif.
- Database PostgreSQL dan MySQL harus dapat diakses dari Vercel melalui jaringan internet.
- Jangan menyimpan file `.env` berisi credential database ke repository publik.
- Environment variable frontend dengan prefix `REACT_APP_` dibaca saat proses build, sehingga frontend perlu di-redeploy jika URL backend berubah.
- CORS sudah diaktifkan pada backend menggunakan package `cors`.
- Dokumentasi Swagger dapat digunakan untuk menguji endpoint setelah deploy.
- Jika frontend berhasil deploy tetapi data tidak muncul, periksa `REACT_APP_API_BASE_URL`, `REACT_APP_USER_API_BASE_URL`, status endpoint `/health`, dan koneksi database.

## Cara Menyiapkan Database User Backend

File SQL tersedia pada:

```text
v2/user-backend/sql/001_user_features.sql
v2/user-backend/sql/002_dashboard_link_ui_and_public_username.sql
```

Import SQL ke MySQL:

```bash
mysql -u root -p < v2/user-backend/sql/001_user_features.sql
mysql -u root -p < v2/user-backend/sql/002_dashboard_link_ui_and_public_username.sql
```

Pastikan nama database pada file SQL dan file `.env` sudah sesuai dengan database lokal atau database deployment.

## Pengujian

### User Backend

```bash
cd v2/user-backend
npm test
```

Pengujian user backend menggunakan Node Test Runner dan mencakup utilitas user serta service akun.

### Frontend

```bash
cd v2/frontend
npm test
```

Untuk memastikan aplikasi frontend dapat dibangun:

```bash
cd v2/frontend
npm run build
```

### Backend Data Publik

```bash
cd v2/backend
npm test
```

Pada backend data publik, script test saat ini masih berupa placeholder.

## Kontribusi Sistem untuk Skripsi

Beberapa poin yang dapat dijelaskan pada bagian implementasi skripsi:

- Sistem menerapkan arsitektur client-server dengan pemisahan frontend dan backend.
- Backend data publik bertugas menyediakan API data sensor dari database PostgreSQL.
- User backend bertugas mengelola autentikasi, profil user, konfigurasi endpoint, dan dashboard link.
- Frontend React digunakan untuk menyajikan data sensor dalam bentuk visual interaktif.
- Sistem mendukung data historis, filter waktu, resampling, download data, dan dashboard custom.
- Sistem menyediakan dokumentasi API dengan Swagger/OpenAPI.
- Versi 2 menunjukkan pengembangan fitur dari dashboard monitoring biasa menjadi platform dashboard yang dapat dikonfigurasi oleh user.

## Ringkasan

Microclimate Monitoring System merupakan aplikasi monitoring iklim mikro berbasis web yang terdiri dari frontend React, backend data sensor, dan backend fitur user. Versi 2 menambahkan banyak pengembangan penting seperti login user, konfigurasi sumber data, dashboard custom, publikasi link, pengaturan tampilan dashboard, dokumentasi API, serta dukungan deployment terpisah. Dengan pengembangan tersebut, sistem tidak hanya menampilkan data sensor, tetapi juga menyediakan platform yang lebih fleksibel untuk membuat dashboard monitoring sesuai kebutuhan pengguna.

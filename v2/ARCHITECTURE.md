# Arsitektur v2

## Gambaran Umum
v2 adalah turunan dari v1 dengan fokus pada pengembangan frontend baru untuk fitur login dan konfigurasi endpoint user. Backend baru dihapus sementara; backend existing dari v1 tetap digunakan.

Komponen utama:
1. backend (existing): API data microclimate dari v1, dipertahankan.
2. frontend (existing + fitur baru): UI dashboard ditambah fitur login, konfigurasi endpoint, dan pembuatan dashboard link custom.

## Fokus Saat Ini
1. Menyusun struktur frontend baru dan dokumentasi folder.
2. Route baru akan ditambahkan nanti.
3. Tombol login tetap terhubung di frontend lama.

## Tujuan Fitur Baru (Frontend)
1. UI login dan session handling.
2. Form input backend URL milik user.
3. Form input MQTT URL milik user.
4. Pembuatan link dashboard custom berbasis tampilan Station2.

## Struktur Folder Frontend Baru
- frontend/src/features/auth/
- frontend/src/features/endpoint-config/
- frontend/src/features/dashboard-links/
- frontend/src/features/station-template/

## Catatan Implementasi Lanjutan
1. Tambahkan route baru ketika struktur UI siap.
2. Pastikan validasi URL di sisi frontend sebelum simpan.
3. Integrasi backend baru bisa ditambahkan kembali jika diperlukan.

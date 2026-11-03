import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

jest.mock('react-gauge-chart', () => () => <div data-testid="mock-gauge" />);
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="mock-responsive-container">{children}</div>,
  };
});
import PetengoranStation2 from './components/petengoran/Station2';
import LoginModal from './features/auth/LoginModal';
import DashboardLinksPanel from './features/dashboard-links/DashboardLinksPanel';
import EndpointConfigPanel from './features/endpoint-config/EndpointConfigPanel';
import TemplatePage from './features/user-dashboard/TemplatePage';
import {
  TOKEN_KEY,
  clearAuthSession,
  fetchMe,
  getAuthToken,
  storeAuthSession,
} from './features/user-dashboard/userApi';
import CustomDashboard from './pages/CustomDashboard';
import UserConfig from './pages/UserConfig';

describe('Integrasi Frontend v2 dengan User Backend & Konsistensi UI', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test('LoginModal tampil bersih tanpa alert banner permanen atau checkbox dummy, dan menyimpan sesi saat login berhasil', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        token: 'token-jwt-test-123',
        user: {
          id: 'u-1',
          email: 'imam@example.com',
          username: 'imam',
          fullName: 'Imam Ariadi',
          profilePhoto: '',
        },
      }),
    });

    const onHide = jest.fn();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LoginModal show={true} onHide={onHide} initialMode="login" />} />
          <Route path="/:username/dashboard" element={<div>Halaman Dashboard User</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Pastikan banner AI slop lama dan checkbox dummy sudah tidak ada
    expect(screen.queryByText(/Login terhubung ke backend user v2/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Ingat saya di perangkat ini/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'imam@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Masuk$/i }));

    await waitFor(() => {
      expect(getAuthToken()).toBe('token-jwt-test-123');
    });

    expect(localStorage.getItem('mc_v2_username')).toBe('imam');
    expect(localStorage.getItem('mc_v2_display_name')).toBe('Imam Ariadi');
    expect(onHide).toHaveBeenCalled();
  });

  test('UserConfig & OverviewPage melakukan sinkronisasi GET /me, /user/configs, dan /user/dashboard-links dari user-backend', async () => {
    storeAuthSession({
      token: 'valid-token-abc',
      user: {
        email: 'imam@example.com',
        username: 'imam',
        fullName: 'Imam Awal',
      },
    });

    global.fetch = jest.fn((url) => {
      if (url.endsWith('/me')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            user: {
              id: 'u-1',
              email: 'imam@example.com',
              username: 'imam',
              fullName: 'Imam Sinkron Backend',
              profilePhoto: '',
            },
          }),
        });
      }
      if (url.endsWith('/user/configs')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            result: [
              {
                id: 'cfg-1',
                name: 'API Stasiun Petengoran',
                type: 'backend',
                templateId: 'station2',
                baseUrl: 'https://api.microclimate.id',
                isActive: true,
              },
            ],
          }),
        });
      }
      if (url.endsWith('/user/dashboard-links')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            result: [
              {
                id: 'lnk-1',
                name: 'Stasiun Utama',
                slug: 'stasiun-utama',
                templateId: 'station2',
                published: true,
                configId: 'cfg-1',
              },
            ],
          }),
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(
      <MemoryRouter initialEntries={['/imam/dashboard']}>
        <Routes>
          <Route path="/:username/dashboard/*" element={<UserConfig />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Ringkasan Ruang Kerja — Imam Sinkron Backend/i })
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('API Stasiun Petengoran')).toBeInTheDocument();
    });

    expect(screen.getByText('https://api.microclimate.id')).toBeInTheDocument();
    expect(screen.getByText('Stasiun Utama')).toBeInTheDocument();
  });

  test('DashboardLinksPanel tidak menampilkan data dummy demo-1/demo-2 dan mempertahankan status published saat edit', async () => {
    storeAuthSession({
      token: 'valid-token-abc',
      user: { email: 'imam@example.com', username: 'imam', fullName: 'Imam' },
    });

    let savedPayload = null;

    global.fetch = jest.fn((url, options = {}) => {
      if (url.endsWith('/user/dashboard-links') && (!options.method || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            result: [
              {
                id: 'link-1',
                name: 'Kebun Percobaan',
                slug: 'kebun-percobaan',
                templateId: 'station2',
                published: true,
                configId: 'cfg-1',
              },
            ],
          }),
        });
      }
      if (url.endsWith('/user/configs')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            result: [
              {
                id: 'cfg-1',
                name: 'Config Utama',
                type: 'backend',
                templateId: 'station2',
                baseUrl: 'https://api.example.com',
                isActive: true,
              },
            ],
          }),
        });
      }
      if (url.endsWith('/user/dashboard-links') && options.method === 'POST') {
        savedPayload = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            result: savedPayload,
          }),
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    render(
      <MemoryRouter initialEntries={['/imam/dashboard/links']}>
        <Routes>
          <Route path="/:username/dashboard/links" element={<DashboardLinksPanel />} />
        </Routes>
      </MemoryRouter>
    );

    // Pastikan data dummy lama tidak muncul
    expect(screen.queryByText('Dashboard Lab 01')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Kebun Percobaan')).toBeInTheDocument();
    });

    // Klik Edit pada link yang sudah berstatus Publik (published: true)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }));

    const nameInput = screen.getByLabelText(/Nama Dashboard/i);
    fireEvent.change(nameInput, { target: { value: 'Kebun Percobaan Baru' } });

    fireEvent.click(screen.getByRole('button', { name: /Simpan Perubahan/i }));

    await waitFor(() => {
      expect(savedPayload).not.toBeNull();
    });

    // Pastikan published tetap true dan slug tidak dipaksa ditambah '-microclimate'
    expect(savedPayload.name).toBe('Kebun Percobaan Baru');
    expect(savedPayload.slug).toBe('kebun-percobaan');
    expect(savedPayload.published).toBe(true);
  });

  test('TemplatePage tidak menampilkan toggle Map palsu dan menyimpan perubahan UI ke user-backend', async () => {
    storeAuthSession({
      token: 'valid-token-abc',
      user: { email: 'imam@example.com', username: 'imam', fullName: 'Imam' },
    });

    let patchUiBody = null;

    global.fetch = jest.fn((url, options = {}) => {
      if (url.endsWith('/user/dashboard-links') && (!options.method || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            result: [
              {
                id: 'link-1',
                name: 'Stasiun Kebun A',
                slug: 'kebun-a',
                templateId: 'station2',
                published: true,
                configId: 'cfg-1',
                uiSettings: {},
              },
            ],
          }),
        });
      }
      if (url.endsWith('/user/dashboard-links/link-1/ui') && options.method === 'PATCH') {
        patchUiBody = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            result: {
              id: 'link-1',
              name: 'Stasiun Kebun A',
              slug: 'kebun-a',
              templateId: 'station2',
              published: true,
              configId: 'cfg-1',
              uiSettings: patchUiBody.uiSettings,
            },
          }),
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(
      <MemoryRouter initialEntries={['/imam/dashboard/templates']}>
        <Routes>
          <Route path="/:username/dashboard/templates" element={<TemplatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Stasiun Kebun A').length).toBeGreaterThan(0);
    });

    // Pastikan toggle Map palsu sudah dihapus
    expect(screen.queryByLabelText(/^Map$/i)).not.toBeInTheDocument();

    // Ubah switch Chart Time Series
    const chartSwitch = screen.getByLabelText(/Chart Time Series/i);
    fireEvent.click(chartSwitch);

    const saveBtn = screen.getByRole('button', { name: /Simpan Tampilan/i });
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(patchUiBody).not.toBeNull();
    });
    expect(patchUiBody.uiSettings.chart).toBe(false);
  });

  test('userApi menghapus token secara otomatis ketika menerima 401 Unauthorized dari user-backend', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired-token');

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Token login tidak valid atau sudah kedaluwarsa.' }),
    });

    await expect(fetchMe()).rejects.toMatchObject({
      status: 401,
      isUnauthorized: true,
    });

    expect(getAuthToken()).toBe('');
    clearAuthSession();
  });

  test('CustomDashboard memuat konfigurasi publik dari user-backend dan meneruskan endpointMap station2Daily ke CustomStation2', async () => {
    const requestedUrls = [];

    global.fetch = jest.fn((url) => {
      requestedUrls.push(url);

      if (url.includes('/public/dashboard-links/imam/station2/kebun-c')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            link: {
              id: 'lnk-1',
              username: 'imam',
              name: 'Stasiun Kebun C',
              slug: 'kebun-c',
              templateId: 'station2',
              published: true,
              configId: 'cfg-1',
              uiSettings: {
                gauges: false,
                chart: false,
                table: true,
                filterButtons: true,
                downloadButton: false,
              },
            },
            config: {
              id: 'cfg-1',
              name: 'API Kebun C',
              type: 'backend',
              templateId: 'station2',
              baseUrl: 'https://sensor-kebun.example.com/',
              endpointMap: {
                topic5History: 'custom/topic5',
                station2Daily: 'custom/station2-daily',
                station2Resample15m: '/custom/station2-15m',
              },
              useSingleEndpoint: false,
              clientResample: 'none',
            },
          }),
        });
      }

      if (url.startsWith('https://sensor-kebun.example.com/custom/station2-daily')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            result: [
              {
                timestamp: new Date().toISOString(),
                humidity: 75,
                temperature: 28.5,
                rainfall: 0,
                windSpeed: 4.2,
                pyrano: 510,
                direction: 'Utara',
                angle: 0,
                bmpTemperature: 28.4,
                airPressure: 1009.5,
              },
            ],
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ result: [] }),
      });
    });

    render(
      <MemoryRouter initialEntries={['/imam/kebun-c']}>
        <Routes>
          <Route path="/:username/:slug" element={<CustomDashboard />} />
          <Route path="/:username/:template/:slug" element={<CustomDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Stasiun Kebun C' })
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        requestedUrls.some((u) =>
          u.startsWith('https://sensor-kebun.example.com/custom/station2-daily?limit=500&offset=0')
        )
      ).toBe(true);
    });

    expect(screen.getByText('Publik')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mode Realtime/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mode Terakhir Aktif/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mode Simulasi/i })).not.toBeInTheDocument();
  });

  test('Dashboard Non-Login (Petengoran Station 2) mendukung 3 mode: Realtime, Terakhir Aktif, dan Simulasi dengan benar', async () => {
    // Buat timestamp data terakhir aktif 10 hari yang lalu (di luar rentang 24 jam hari ini)
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const tenDaysAgoIso = tenDaysAgo.toISOString();

    global.fetch = jest.fn((url) => {
      if (url.includes('/simulate/')) {
        // Simulasikan endpoint simulasi backend sedang mati untuk menguji fallback generator lokal
        return Promise.reject(new Error('Simulation backend offline'));
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          result: [
            {
              timestamp: tenDaysAgoIso,
              humidity: 82.5,
              temperature: 29.3,
              rainfall: 1.4,
              windSpeed: 6.8,
              pyrano: 540,
              direction: 'Utara',
              angle: 15,
              // Sengaja kosongkan bmpTemperature untuk menguji ketahanan terhadap sensor sekunder null
              bmpTemperature: null,
              AirPressure: 1010.2,
            },
          ],
        }),
      });
    });

    render(<PetengoranStation2 />);

    const realtimeBtn = screen.getByRole('button', { name: /Mode Realtime/i });
    const lastActiveBtn = screen.getByRole('button', { name: /Mode Terakhir Aktif/i });
    const simBtn = screen.getByRole('button', { name: /Mode Simulasi/i });

    // Tunggu sampai data riwayat dari 10 hari lalu selesai dimuat
    await waitFor(() => {
      expect(lastActiveBtn).not.toBeDisabled();
    });

    // 1. Pada Mode Realtime (default): karena data berusia 10 hari, tidak ada data hari ini
    expect(screen.getByText('Realtime')).toBeInTheDocument();
    expect(screen.getByText(/No data available for the selected filter/i)).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();

    // 2. Pindah ke Mode Terakhir Aktif: Gauge DAN Tabel harus menampilkan data 10 hari lalu (bukan kosong)
    fireEvent.click(lastActiveBtn);

    await waitFor(() => {
      expect(screen.getByText('Terakhir Aktif')).toBeInTheDocument();
    });

    expect(screen.getByText('82.5%')).toBeInTheDocument();
    expect(screen.getByText('29.3°C')).toBeInTheDocument();
    expect(screen.queryByText(/No data available for the selected filter/i)).not.toBeInTheDocument();
    expect(screen.getByText('North')).toBeInTheDocument();

    // 3. Pindah ke Mode Simulasi: menghasilkan data simulasi penuh meskipun endpoint /simulate offline
    fireEvent.click(simBtn);

    await waitFor(() => {
      expect(screen.getByText('Simulasi')).toBeInTheDocument();
    });

    expect(screen.queryByText(/No data available for the selected filter/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mode Simulasi ON/i })).toBeInTheDocument();

    // 4. Dari Mode Simulasi bisa langsung kembali ke Mode Terakhir Aktif atau Mode Realtime
    fireEvent.click(lastActiveBtn);
    await waitFor(() => {
      expect(screen.getByText('Terakhir Aktif')).toBeInTheDocument();
    });
    expect(screen.getByText('82.5%')).toBeInTheDocument();

    fireEvent.click(realtimeBtn);
    await waitFor(() => {
      expect(screen.getByText('Realtime')).toBeInTheDocument();
    });
  });

  test('EndpointConfigPanel menyajikan UX ramah pengguna tanpa istilah internal Topic 5 / Station 2 dan mendukung pemisahan URL otomatis', async () => {
    render(<EndpointConfigPanel />);

    fireEvent.click(screen.getByRole('button', { name: /Hubungkan Sumber Data Pertama/i }));

    // Pastikan istilah internal proyek sudah digantikan dengan bahasa produk yang ramah pengguna
    expect(screen.queryByText(/Topic 5 History/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Station 2 — Microclimate Lengkap/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Stasiun Cuaca & Iklim Lengkap \(Maks\. 8 Sensor\)/i)).toBeInTheDocument();

    // Ketika pengguna menempelkan URL lengkap (termasuk query string) ke Alamat Server API, otomatis memisahkan origin dan path
    const baseUrlInput = screen.getByLabelText(/Alamat Server API/i);
    fireEvent.change(baseUrlInput, {
      target: { value: 'https://202.155.17.57/api/readings?room=lab_td&range=30d&limit=100' },
    });
    fireEvent.blur(baseUrlInput);

    expect(baseUrlInput.value).toBe('https://202.155.17.57');
    const pathInput = screen.getByLabelText(/Path Endpoint Data Sensor/i);
    expect(pathInput.value).toBe('/api/readings?room=lab_td&range=30d');

    // Uji tes koneksi terhadap API eksternal dengan kolom waktu `recorded_at` berformat "YYYY-MM-DD HH:mm:ss" dan `wind_speed`
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: 837,
          temperature: 26.3,
          humidity: 50.5,
          wind_speed: 0.7,
          co2: 459,
          recorded_at: '2026-10-04 08:02:06',
          room: 'lab_td',
        },
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: /Tes Koneksi Sekarang/i }));

    await waitFor(() => {
      expect(screen.getByText(/Koneksi Berhasil Terhubung!/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/recorded_at: 2026-10-04 08:02:06/i)).toBeInTheDocument();
    expect(screen.getByText(/humidity: 50.5/i)).toBeInTheDocument();
    expect(screen.getByText(/temperature: 26.3/i)).toBeInTheDocument();
    expect(screen.getByText(/wind_speed: 0.7/i)).toBeInTheDocument();
  });
});

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

jest.mock('react-gauge-chart', () => () => <div data-testid="mock-gauge" />);
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
      <MemoryRouter initialEntries={['/imam/station2/kebun-c']}>
        <Routes>
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
  });
});

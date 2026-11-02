import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Row, Stack } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { getTemplateDisplayName } from '../station-template/stationTemplates';
import { getAuthToken, listDashboardLinks, saveDashboardLinkUi } from './userApi';

const LINKS_KEY = 'mc_v2_dashboard_links';
const UI_KEY = 'mc_v2_dashboard_link_ui';
const DEFAULT_UI = {
  gauges: true,
  gaugeItems: {
    humidity: true,
    temperature: true,
    rainfall: true,
    windspeed: true,
    irradiation: true,
    windDirection: true,
    airPressure: true,
    bmpTemperature: true,
  },
  tableColumns: {
    status: true,
    timestamp: true,
    humidity: true,
    temperature: true,
    rainfall: true,
    windspeed: true,
    irradiation: true,
    windDirection: true,
    airPressure: true,
    bmpTemperature: true,
  },
  chart: true,
  map: true,
  table: true,
  filterButtons: true,
  downloadButton: true,
};

const GAUGE_OPTIONS = [
  { key: 'humidity', label: 'Kelembaban Udara (Humidity)' },
  { key: 'temperature', label: 'Suhu Udara (Temperature)' },
  { key: 'rainfall', label: 'Curah Hujan (Rainfall)' },
  { key: 'windspeed', label: 'Kecepatan Angin (Wind Speed)' },
  { key: 'irradiation', label: 'Radiasi Matahari (Irradiation)' },
  { key: 'windDirection', label: 'Arah Angin (Wind Direction)' },
  { key: 'airPressure', label: 'Tekanan Udara (Air Pressure)' },
  { key: 'bmpTemperature', label: 'Suhu Alat / Cadangan (BMP Temperature)' },
];

const TABLE_COLUMNS = [
  { key: 'status', label: 'Penanda Data Terbaru (Status)' },
  { key: 'timestamp', label: 'Waktu Pencatatan (Timestamp)' },
  { key: 'humidity', label: 'Kelembaban Udara (%)' },
  { key: 'temperature', label: 'Suhu Udara (°C)' },
  { key: 'rainfall', label: 'Curah Hujan (mm)' },
  { key: 'windspeed', label: 'Kecepatan Angin (km/h)' },
  { key: 'irradiation', label: 'Radiasi Matahari (W/m²)' },
  { key: 'windDirection', label: 'Arah Angin' },
  { key: 'airPressure', label: 'Tekanan Udara (hPa)' },
  { key: 'bmpTemperature', label: 'Suhu Alat / Cadangan (°C)' },
];

const readUiSettingsFromLinks = (items) =>
  items.reduce((acc, item) => {
    if (item.id && item.uiSettings && Object.keys(item.uiSettings).length > 0) {
      acc[item.id] = item.uiSettings;
    }
    return acc;
  }, {});

const TemplatePage = () => {
  const { username = 'user' } = useParams();
  const activeUsername = localStorage.getItem('mc_v2_username') || username || 'user';
  const [links, setLinks] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [uiSettings, setUiSettings] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [status, setStatus] = useState({
    type: 'info',
    message: '',
  });

  useEffect(() => {
    const savedLinks = localStorage.getItem(LINKS_KEY);
    if (savedLinks) {
      try {
        const parsed = JSON.parse(savedLinks);
        setLinks(parsed);
        setSelectedId(parsed[0]?.id || '');
      } catch (_error) {
        setLinks([]);
      }
    }

    const savedUi = localStorage.getItem(UI_KEY);
    if (savedUi) {
      try {
        setUiSettings(JSON.parse(savedUi));
      } catch (_error) {
        setUiSettings({});
      }
    }

    if (getAuthToken()) {
      listDashboardLinks()
        .then((data) => {
          const remoteLinks = data.result || [];
          const remoteUi = readUiSettingsFromLinks(remoteLinks);
          setLinks(remoteLinks);
          setSelectedId(remoteLinks[0]?.id || '');
          setUiSettings((current) => {
            const next = { ...current, ...remoteUi };
            localStorage.setItem(UI_KEY, JSON.stringify(next));
            return next;
          });
          localStorage.setItem(LINKS_KEY, JSON.stringify(remoteLinks));
        })
        .catch(() => {
          setStatus({ type: 'warning', message: 'Backend user belum dapat dihubungi. Pengaturan memakai data lokal.' });
        });
    }
  }, []);

  const buildPreviewLink = (templateId, slug) => `/${activeUsername}/${templateId}/${slug}`;

  const selectedLink = useMemo(
    () => links.find((item) => item.id === selectedId) || null,
    [links, selectedId]
  );

  const activeUi = useMemo(() => {
    if (!selectedLink) return DEFAULT_UI;
    const stored = uiSettings[selectedLink.id] || {};
    return {
      ...DEFAULT_UI,
      ...stored,
      gaugeItems: {
        ...DEFAULT_UI.gaugeItems,
        ...(stored.gaugeItems || {}),
      },
      tableColumns: {
        ...DEFAULT_UI.tableColumns,
        ...(stored.tableColumns || {}),
      },
    };
  }, [selectedLink, uiSettings]);

  const updateUi = (next) => {
    setUiSettings(next);
    setHasUnsavedChanges(true);
    setStatus({ type: 'warning', message: 'Ada perubahan tampilan yang belum disimpan.' });
  };

  const handleToggle = (key) => {
    if (!selectedLink) return;
    const next = {
      ...uiSettings,
      [selectedLink.id]: {
        ...activeUi,
        [key]: !activeUi[key],
      },
    };
    updateUi(next);
  };

  const handleGaugeToggle = (key) => {
    if (!selectedLink) return;
    const next = {
      ...uiSettings,
      [selectedLink.id]: {
        ...activeUi,
        gaugeItems: {
          ...activeUi.gaugeItems,
          [key]: !activeUi.gaugeItems[key],
        },
      },
    };
    updateUi(next);
  };

  const handleTableToggle = (key) => {
    if (!selectedLink) return;
    const next = {
      ...uiSettings,
      [selectedLink.id]: {
        ...activeUi,
        tableColumns: {
          ...activeUi.tableColumns,
          [key]: !activeUi.tableColumns[key],
        },
      },
    };
    updateUi(next);
  };

  const handleReset = () => {
    if (!selectedLink) return;
    const next = { ...uiSettings, [selectedLink.id]: { ...DEFAULT_UI } };
    updateUi(next);
  };

  const handleSaveUi = async () => {
    if (!selectedLink) return;
    try {
      const linkUi = uiSettings[selectedLink.id] || activeUi;
      if (getAuthToken()) {
        const data = await saveDashboardLinkUi(selectedLink.id, linkUi);
        const savedLink = data.result;
        setLinks((current) => {
          const next = current.map((item) => (item.id === savedLink.id ? savedLink : item));
          localStorage.setItem(LINKS_KEY, JSON.stringify(next));
          return next;
        });
      }
      localStorage.setItem(UI_KEY, JSON.stringify(uiSettings));
      setHasUnsavedChanges(false);
      setStatus({
        type: 'success',
        message: 'Tampilan dashboard berhasil disimpan.',
      });
    } catch (error) {
      setStatus({ type: 'danger', message: error.message || 'Tampilan dashboard gagal disimpan.' });
    }
  };

  const hasLinks = links.length > 0;
  return (
    <section className="user-dashboard__page">
      <div className="user-dashboard__page-header">
        <h2>Atur Tampilan & Sensor Dashboard</h2>
        <p>Pilih sensor apa saja yang dimiliki alat Anda dan sesuaikan komponen yang ingin ditampilkan pada halaman publik.</p>
      </div>
      {status.message && <Alert variant={status.type}>{status.message}</Alert>}
      <Row className="g-4">
        <Col xs={12} lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Pilih Halaman Dashboard</Card.Title>
              <Card.Text>Klik salah satu halaman di bawah untuk mengatur sensor yang tampil.</Card.Text>
              {!hasLinks ? (
                <div className="text-muted">
                  Belum ada halaman dashboard. Silakan buat terlebih dahulu di menu Link Dashboard.
                </div>
              ) : (
                <ListGroup variant="flush">
                  {links.map((item) => (
                    <ListGroup.Item
                      key={item.id}
                      action
                      active={item.id === selectedId}
                      onClick={() => setSelectedId(item.id)}
                      className="template-link-item"
                    >
                      <div className="fw-semibold d-flex align-items-center gap-2">
                        {item.name}
                        <Badge bg={item.published ? 'success' : 'secondary'}>
                          {item.published ? 'Publik' : 'Draft'}
                        </Badge>
                      </div>
                      <div className="small text-muted template-link-meta">
                        {buildPreviewLink(item.templateId, item.slug)}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} lg={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                <div>
                  <Card.Title>Komponen & Parameter Sensor</Card.Title>
                  <Card.Text className="mb-0">
                    Matikan sensor yang tidak dimiliki oleh perangkat Anda agar halaman dashboard terlihat bersih.
                  </Card.Text>
                </div>
                <Stack direction="horizontal" gap={2} className="flex-wrap">
                  {hasUnsavedChanges && <Badge bg="warning" text="dark">Belum disimpan</Badge>}
                  <Button size="sm" variant="primary" onClick={handleSaveUi} disabled={!selectedLink || !hasUnsavedChanges}>
                    Simpan Tampilan
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={handleReset} disabled={!selectedLink}>
                    Tampilkan Semua
                  </Button>
                </Stack>
              </div>
              <div className="mt-3">
                {!selectedLink ? (
                  <div className="text-muted">Pilih halaman dashboard di sebelah kiri terlebih dahulu.</div>
                ) : (
                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <div className="template-toggle-list">
                        <Form.Check
                          type="switch"
                          id="toggle-gauges"
                          label="Kartu Indikator Sensor (Gauge Cards)"
                          checked={activeUi.gauges}
                          onChange={() => handleToggle('gauges')}
                        />
                        {activeUi.gauges && (
                          <div className="template-toggle-sublist">
                            {GAUGE_OPTIONS.map((item) => (
                              <Form.Check
                                key={item.key}
                                type="switch"
                                id={`toggle-gauge-${item.key}`}
                                label={item.label}
                                checked={activeUi.gaugeItems[item.key]}
                                onChange={() => handleGaugeToggle(item.key)}
                              />
                            ))}
                          </div>
                        )}
                        <Form.Check
                          type="switch"
                          id="toggle-chart"
                          label="Grafik Tren (Chart Time Series)"
                          checked={activeUi.chart}
                          onChange={() => handleToggle('chart')}
                        />
                      </div>
                    </Col>
                    <Col xs={12} md={6}>
                      <div className="template-toggle-list">
                        <Form.Check
                          type="switch"
                          id="toggle-table"
                          label="Tabel Riwayat Data (Table)"
                          checked={activeUi.table}
                          onChange={() => handleToggle('table')}
                        />
                        {activeUi.table && (
                          <div className="template-toggle-sublist">
                            {TABLE_COLUMNS.map((item) => (
                              <Form.Check
                                key={item.key}
                                type="switch"
                                id={`toggle-table-${item.key}`}
                                label={item.label}
                                checked={activeUi.tableColumns[item.key]}
                                onChange={() => handleTableToggle(item.key)}
                              />
                            ))}
                          </div>
                        )}
                        <Form.Check
                          type="switch"
                          id="toggle-filter"
                          label="Filter Rentang Waktu (1 Hari / 7 Hari / 1 Bulan)"
                          checked={activeUi.filterButtons}
                          onChange={() => handleToggle('filterButtons')}
                        />
                        <Form.Check
                          type="switch"
                          id="toggle-download"
                          label="Tombol Download Data (CSV / Excel)"
                          checked={activeUi.downloadButton}
                          onChange={() => handleToggle('downloadButton')}
                        />
                      </div>
                    </Col>
                  </Row>
                )}
              </div>
            </Card.Body>
          </Card>
          <Card className="shadow-sm mt-4">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <div>
                  <Card.Title className="mb-1">Pratinjau Susunan Halaman</Card.Title>
                  <Card.Text className="mb-0">
                    Gambaran tata letak komponen yang akan dilihat pengunjung pada halaman dashboard Anda.
                  </Card.Text>
                </div>
                {selectedLink && (
                  <Button
                    size="sm"
                    variant="outline-primary"
                    href={buildPreviewLink(selectedLink.templateId, selectedLink.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Buka Halaman Dashboard
                  </Button>
                )}
              </div>
              {!selectedLink ? (
                <div className="text-muted">Pilih halaman untuk melihat pratinjau tata letak.</div>
              ) : (
                <div className="template-preview mt-3">
                  <div className="template-preview__header">
                    <div>
                      <div className="template-preview__title">{selectedLink.name}</div>
                      <div className="template-preview__subtitle">
                        {getTemplateDisplayName(selectedLink.templateId)}
                      </div>
                    </div>
                    <Stack direction="horizontal" gap={2} className="flex-wrap">
                      {activeUi.filterButtons && (
                        <Button size="sm" variant="outline-primary">Filter Rentang</Button>
                      )}
                      {activeUi.downloadButton && (
                        <Button size="sm" variant="primary">Download Data</Button>
                      )}
                    </Stack>
                  </div>
                  {activeUi.gauges && (
                    <div className="template-preview__grid">
                      {GAUGE_OPTIONS.filter((item) => activeUi.gaugeItems[item.key]).map((item) => (
                        <div key={item.key} className="template-preview__card">
                          <div className="template-preview__card-title">{item.label}</div>
                          <div className="template-preview__card-value">--</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeUi.chart && (
                    <div className="template-preview__panel">
                      <div className="template-preview__panel-title">Grafik Tren Parameter</div>
                      <div className="template-preview__chart" />
                    </div>
                  )}
                  {activeUi.table && (
                    <div className="template-preview__panel">
                      <div className="template-preview__panel-title">Tabel Riwayat Pembacaan</div>
                      <div className="template-preview__table">
                        <div className="template-preview__table-head">
                          {TABLE_COLUMNS.filter((item) => activeUi.tableColumns[item.key]).map((item) => (
                            <span key={item.key}>{item.label}</span>
                          ))}
                        </div>
                        <div className="template-preview__table-row" />
                        <div className="template-preview__table-row" />
                        <div className="template-preview__table-row" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </section>
  );
};

export default TemplatePage;

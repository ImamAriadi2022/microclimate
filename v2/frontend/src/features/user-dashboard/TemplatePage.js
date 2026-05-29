import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Row, Stack } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { stationTemplates } from '../station-template/stationTemplates';
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
  { key: 'humidity', label: 'Humidity' },
  { key: 'temperature', label: 'Temperature' },
  { key: 'rainfall', label: 'Rainfall' },
  { key: 'windspeed', label: 'Wind Speed' },
  { key: 'irradiation', label: 'Irradiation' },
  { key: 'windDirection', label: 'Wind Direction' },
  { key: 'airPressure', label: 'Air Pressure' },
  { key: 'bmpTemperature', label: 'BMP Temperature' },
];

const TABLE_COLUMNS = [
  { key: 'status', label: 'Status' },
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'humidity', label: 'Humidity (%)' },
  { key: 'temperature', label: 'Temperature (°C)' },
  { key: 'rainfall', label: 'Rainfall (mm)' },
  { key: 'windspeed', label: 'Wind Speed (km/h)' },
  { key: 'irradiation', label: 'Irradiation (W/m²)' },
  { key: 'windDirection', label: 'Wind Direction' },
  { key: 'airPressure', label: 'Air Pressure (hPa)' },
  { key: 'bmpTemperature', label: 'BMP Temperature (°C)' },
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
    message: 'Pilih link, ubah tampilan, lalu tekan Simpan Tampilan.',
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
          setStatus({ type: 'warning', message: 'Backend user belum dapat dihubungi. Editor memakai data lokal.' });
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
    setStatus({ type: 'warning', message: 'Perubahan tampilan belum disimpan.' });
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
        message: 'Tampilan dashboard berhasil disimpan. Link dashboard akan memakai setelan terbaru.',
      });
    } catch (error) {
      setStatus({ type: 'danger', message: error.message || 'Tampilan dashboard gagal disimpan.' });
    }
  };

  const hasLinks = links.length > 0;
  return (
    <section className="user-dashboard__page">
      <div className="user-dashboard__page-header">
        <h2>Template microclimate</h2>
        <p>Kelola dashboard custom: pilih link, edit tampilan, dan lihat preview.</p>
      </div>
      <Alert variant={status.type}>{status.message}</Alert>
      <Row className="g-4">
        <Col xs={12} lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Link Dashboard</Card.Title>
              <Card.Text>Pilih link yang ingin kamu edit tampilannya.</Card.Text>
              {!hasLinks ? (
                <div className="text-muted">
                  Belum ada link. Buat link baru di menu Dashboard Link.
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
                  <Card.Title>Editor Tampilan</Card.Title>
                  <Card.Text className="mb-0">
                    Atur elemen dashboard yang ingin ditampilkan.
                  </Card.Text>
                </div>
                <Stack direction="horizontal" gap={2} className="flex-wrap">
                  {hasUnsavedChanges && <Badge bg="warning">Belum disimpan</Badge>}
                  <Button size="sm" variant="primary" onClick={handleSaveUi} disabled={!selectedLink || !hasUnsavedChanges}>
                    Simpan Tampilan
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={handleReset} disabled={!selectedLink}>
                    Reset ke Default
                  </Button>
                </Stack>
              </div>
              <div className="mt-3">
                {!selectedLink ? (
                  <div className="text-muted">Pilih link dashboard terlebih dulu.</div>
                ) : (
                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <div className="template-toggle-list">
                        <Form.Check
                          type="switch"
                          id="toggle-gauges"
                          label="Gauge Cards"
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
                          label="Chart Time Series"
                          checked={activeUi.chart}
                          onChange={() => handleToggle('chart')}
                        />
                        <Form.Check
                          type="switch"
                          id="toggle-map"
                          label="Map"
                          checked={activeUi.map}
                          onChange={() => handleToggle('map')}
                        />
                      </div>
                    </Col>
                    <Col xs={12} md={6}>
                      <div className="template-toggle-list">
                        <Form.Check
                          type="switch"
                          id="toggle-table"
                          label="Table"
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
                          label="Tombol Filter"
                          checked={activeUi.filterButtons}
                          onChange={() => handleToggle('filterButtons')}
                        />
                        <Form.Check
                          type="switch"
                          id="toggle-download"
                          label="Tombol Download"
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
              <Card.Title>Preview Dashboard (Mock)</Card.Title>
              <Card.Text>
                Tampilan ini hanya mock untuk melihat layout.
              </Card.Text>
              {!selectedLink ? (
                <div className="text-muted">Pilih link untuk melihat preview.</div>
              ) : (
                <div className="template-preview">
                  <div className="template-preview__header">
                    <div>
                      <div className="template-preview__title">{selectedLink.name}</div>
                      <div className="template-preview__subtitle">
                        {stationTemplates.find((t) => t.id === selectedLink.templateId)?.name || 'Station2'}
                      </div>
                    </div>
                    <Stack direction="horizontal" gap={2} className="flex-wrap">
                      {activeUi.filterButtons && (
                        <Button size="sm" variant="outline-primary">Filter</Button>
                      )}
                      {activeUi.downloadButton && (
                        <Button size="sm" variant="primary">Download</Button>
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
                      <div className="template-preview__panel-title">Chart Time Series</div>
                      <div className="template-preview__chart" />
                    </div>
                  )}
                  {activeUi.map && (
                    <div className="template-preview__panel">
                      <div className="template-preview__panel-title">Map</div>
                      <div className="template-preview__map" />
                    </div>
                  )}
                  {activeUi.table && (
                    <div className="template-preview__panel">
                      <div className="template-preview__panel-title">Table</div>
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

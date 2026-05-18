import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Row, Stack } from 'react-bootstrap';
import { getTemplateById, stationTemplates } from '../station-template/stationTemplates';

const STORAGE_KEY = 'mc_v2_user_configs';
const ACTIVE_KEY = 'mc_v2_active_config_id';

const buildEmptyMap = (items, keyField, defaultField) =>
  items.reduce((acc, item) => {
    acc[item[keyField]] = item[defaultField] || '';
    return acc;
  }, {});

const sanitizeName = (value) => value.trim();

const validateBackendResponse = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      validFormat: false,
      message: 'Data kosong atau bukan merupakan array.',
      fields: []
    };
  }
  
  const firstItem = rows[0];
  const fieldSpecs = [
    { key: 'timestamp', label: 'Timestamp', possibleKeys: ['timestamp', 'time', 'created_at'] },
    { key: 'humidity', label: 'Kelembaban', possibleKeys: ['humidity', 'hum', 'hum_dht22', 'kelembaban'] },
    { key: 'temperature', label: 'Suhu Udara', possibleKeys: ['temperature', 'temp', 'temp_dht22', 'suhu'] },
    { key: 'rainfall', label: 'Curah Hujan', possibleKeys: ['rainfall', 'rain', 'curah_hujan'] },
    { key: 'windSpeed', label: 'Kecepatan Angin', possibleKeys: ['windSpeed', 'windspeed', 'wind_speed', 'kecepatan_angin'] },
    { key: 'irradiation', label: 'Radiasi Matahari', possibleKeys: ['pyrano', 'irradiation', 'radiasi', 'solar'] },
    { key: 'direction', label: 'Arah Angin (Text)', possibleKeys: ['direction', 'windDirection', 'wind_direction', 'arah_angin'] },
    { key: 'angle', label: 'Sudut Angin (Derajat)', possibleKeys: ['angle', 'windAngle', 'wind_angle', 'sudut_angin'] },
    { key: 'bmpTemperature', label: 'Suhu Sensor Tekanan', possibleKeys: ['bmpTemperature', 'bmptemperature', 'bmp_temperature'] },
    { key: 'airPressure', label: 'Tekanan Udara', possibleKeys: ['AirPressure', 'airPressure', 'airpressure', 'air_pressure', 'tekanan_udara'] }
  ];

  const fieldsResult = fieldSpecs.map(spec => {
    const foundKey = spec.possibleKeys.find(k => firstItem.hasOwnProperty(k));
    return {
      key: spec.key,
      label: spec.label,
      status: foundKey ? 'ok' : 'missing',
      foundKey: foundKey || null,
      value: foundKey ? firstItem[foundKey] : null
    };
  });

  const hasTimestamp = fieldsResult.find(f => f.key === 'timestamp')?.status === 'ok';

  return {
    validFormat: true,
    hasTimestamp,
    fields: fieldsResult
  };
};

const EndpointConfigPanel = () => {
  const [configs, setConfigs] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('backend');
  const [templateId, setTemplateId] = useState('station2');
  const [baseUrl, setBaseUrl] = useState('');
  const [brokerUrl, setBrokerUrl] = useState('');
  const [endpointMap, setEndpointMap] = useState({});
  const [topicMap, setTopicMap] = useState({});
  const [status, setStatus] = useState({ type: 'info', message: '' });
  const [testKey, setTestKey] = useState('topic5History');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [useSingleEndpoint, setUseSingleEndpoint] = useState(false);
  const [clientResample, setClientResample] = useState('none');

  const template = useMemo(() => getTemplateById(templateId), [templateId]);
  const requiredEndpoints = useMemo(() => template.requiredEndpoints || [], [template]);
  const requiredTopics = useMemo(() => template.requiredTopics || [], [template]);

  useEffect(() => {
    const savedConfigs = localStorage.getItem(STORAGE_KEY);
    const savedActive = localStorage.getItem(ACTIVE_KEY);
    if (savedConfigs) {
      try {
        const parsed = JSON.parse(savedConfigs);
        setConfigs(parsed);
      } catch (error) {
        setStatus({ type: 'warning', message: 'Simulasi: data konfigurasi tidak terbaca.' });
      }
    }
    if (savedActive) {
      setActiveId(savedActive);
    }
  }, []);

  useEffect(() => {
    if (requiredEndpoints.length === 0) return;
    setEndpointMap((prev) => ({
      ...buildEmptyMap(requiredEndpoints, 'key', 'defaultPath'),
      ...prev,
    }));
    setTestKey(requiredEndpoints[0].key);
  }, [templateId, requiredEndpoints]);

  useEffect(() => {
    if (requiredTopics.length === 0) return;
    setTopicMap((prev) => ({
      ...buildEmptyMap(requiredTopics, 'key', 'defaultTopic'),
      ...prev,
    }));
  }, [templateId, requiredTopics]);

  const resetForm = () => {
    setEditingId('');
    setName('');
    setType('backend');
    setTemplateId('station2');
    setBaseUrl('');
    setBrokerUrl('');
    setEndpointMap(buildEmptyMap(requiredEndpoints, 'key', 'defaultPath'));
    setTopicMap(buildEmptyMap(requiredTopics, 'key', 'defaultTopic'));
    setTestResult(null);
    setUseSingleEndpoint(false);
    setClientResample('none');
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
    setStatus({ type: 'info', message: 'Isi form untuk membuat konfigurasi baru.' });
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setStatus({ type: 'info', message: 'Kembali ke daftar konfigurasi.' });
  };

  const persistConfigs = (next) => {
    setConfigs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleanName = sanitizeName(name);
    if (!cleanName) {
      setStatus({ type: 'danger', message: 'Nama konfigurasi wajib diisi.' });
      return;
    }

    if (type === 'backend' && !baseUrl.trim()) {
      setStatus({ type: 'danger', message: 'Base URL backend wajib diisi.' });
      return;
    }

    if (type === 'mqtt' && !brokerUrl.trim()) {
      setStatus({ type: 'danger', message: 'Broker MQTT wajib diisi.' });
      return;
    }

    const normalizedEndpointMap = requiredEndpoints.reduce((acc, item) => {
      const value = (endpointMap[item.key] || '').trim();
      acc[item.key] = value || item.defaultPath || '';
      return acc;
    }, {});

    const normalizedTopicMap = requiredTopics.reduce((acc, item) => {
      const value = (topicMap[item.key] || '').trim();
      acc[item.key] = value || item.defaultTopic || '';
      return acc;
    }, {});

    const payload = {
      id: editingId || `cfg-${Date.now()}`,
      name: cleanName,
      type,
      templateId,
      baseUrl: baseUrl.trim(),
      brokerUrl: brokerUrl.trim(),
      endpointMap: normalizedEndpointMap,
      topicMap: normalizedTopicMap,
      useSingleEndpoint,
      clientResample,
      updatedAt: new Date().toISOString(),
    };

    const nextConfigs = editingId
      ? configs.map((item) => (item.id === editingId ? payload : item))
      : [payload, ...configs];

    persistConfigs(nextConfigs);
    setActiveId(payload.id);
    localStorage.setItem(ACTIVE_KEY, payload.id);
    setStatus({ type: 'success', message: 'Simulasi: konfigurasi disimpan.' });
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (config) => {
    setEditingId(config.id);
    setName(config.name || '');
    setType(config.type || 'backend');
    setTemplateId(config.templateId || 'station2');
    setBaseUrl(config.baseUrl || '');
    setBrokerUrl(config.brokerUrl || '');
    setEndpointMap({
      ...buildEmptyMap(requiredEndpoints, 'key', 'defaultPath'),
      ...(config.endpointMap || {}),
    });
    setTopicMap({
      ...buildEmptyMap(requiredTopics, 'key', 'defaultTopic'),
      ...(config.topicMap || {}),
    });
    setTestResult(null);
    setUseSingleEndpoint(!!config.useSingleEndpoint);
    setClientResample(config.clientResample || 'none');
    setStatus({ type: 'info', message: 'Mode edit: ubah data lalu simpan.' });
    setShowForm(true);
  };

  const handleActivate = (configId) => {
    setActiveId(configId);
    localStorage.setItem(ACTIVE_KEY, configId);
    setStatus({ type: 'success', message: 'Konfigurasi aktif diperbarui.' });
  };

  const handleRemove = (configId) => {
    const next = configs.filter((item) => item.id !== configId);
    persistConfigs(next);
    if (activeId === configId) {
      setActiveId('');
      localStorage.removeItem(ACTIVE_KEY);
    }
    setStatus({ type: 'info', message: 'Konfigurasi dihapus.' });
  };

  const handleEndpointChange = (key, value) => {
    setEndpointMap((prev) => ({ ...prev, [key]: value }));
  };

  const handleTopicChange = (key, value) => {
    setTopicMap((prev) => ({ ...prev, [key]: value }));
  };

  const handleRunTest = async () => {
    if (!baseUrl) return;
    setIsTesting(true);
    setTestResult(null);

    const base = baseUrl.trim().replace(/\/$/, '');
    const path = (endpointMap[testKey] || '').trim().replace(/^\//, '');
    const defaultPath = requiredEndpoints.find(item => item.key === testKey)?.defaultPath || '';
    const finalPath = path || defaultPath.replace(/^\//, '');
    const fullUrl = `${base}/${finalPath}?limit=5`;

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse rows
      const rows = Array.isArray(data?.result)
        ? data.result
        : Array.isArray(data?.data?.result)
          ? data.data.result
          : Array.isArray(data)
            ? data
            : null;

      const validation = validateBackendResponse(rows);
      const sampleRecord = rows && rows.length > 0 ? rows[0] : data;

      setTestResult({
        success: true,
        status: response.status,
        data: sampleRecord,
        validation
      });
    } catch (error) {
      console.error('Test API error:', error);
      setTestResult({
        success: false,
        status: 0,
        error: error.message || 'Gagal menghubungi server. Pastikan URL benar, server aktif, dan CORS diaktifkan.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const renderTester = () => {
    if (type !== 'backend') {
      return (
        <Card className="border-warning mb-4">
          <Card.Body>
            <Card.Title className="text-warning">Uji Koneksi MQTT</Card.Title>
            <Card.Text>
              Uji koneksi langsung untuk MQTT saat ini belum didukung via browser. Harap pastikan broker MQTT Anda mendukung koneksi WebSocket (wss:// atau ws://).
            </Card.Text>
          </Card.Body>
        </Card>
      );
    }

    if (!baseUrl) {
      return (
        <div className="text-muted text-center py-5 border rounded bg-light">
          Masukkan <strong>Base URL Backend</strong> terlebih dahulu untuk memulai Uji GET.
        </div>
      );
    }

    return (
      <Card className="shadow-sm border-primary">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-semibold">Uji GET Endpoint</h6>
          <Badge bg="light" text="primary">Live Test</Badge>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Pilih Endpoint untuk Diuji</Form.Label>
            <Form.Select
              value={testKey}
              onChange={(e) => {
                setTestKey(e.target.value);
                setTestResult(null);
              }}
            >
              {requiredEndpoints
                .filter(item => !useSingleEndpoint || item.key === 'topic5History')
                .map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label} ({item.key})
                  </option>
                ))}
            </Form.Select>
          </Form.Group>

          <div className="mb-3">
            <div className="small fw-semibold text-muted mb-1">URL Target Uji:</div>
            <code className="d-block p-2 bg-light border rounded text-break" style={{ fontSize: '0.85rem' }}>
              {(() => {
                const base = baseUrl.trim().replace(/\/$/, '');
                const path = (endpointMap[testKey] || '').trim().replace(/^\//, '');
                const defaultPath = requiredEndpoints.find(item => item.key === testKey)?.defaultPath || '';
                const finalPath = path || defaultPath.replace(/^\//, '');
                return `${base}/${finalPath}?limit=5`;
              })()}
            </code>
          </div>

          <Button
            variant="outline-primary"
            className="w-100 mb-3 fw-semibold animate-pulse"
            onClick={handleRunTest}
            disabled={isTesting}
          >
            {isTesting ? 'Sedang Menghubungi API...' : 'Jalankan Uji GET'}
          </Button>

          {testResult && (
            <div className="mt-3">
              <Alert variant={testResult.success ? 'success' : 'danger'} className="py-2">
                <div className="fw-bold">{testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal!'}</div>
                <div className="small">Status Code: {testResult.status || 'N/A'}</div>
                {testResult.error && <div className="small mt-1 text-danger">{testResult.error}</div>}
              </Alert>

              {testResult.success && testResult.validation && (
                <div className="border rounded p-3 bg-white mb-3 shadow-xs">
                  <h6 className="fw-bold border-bottom pb-2 mb-2" style={{ fontSize: '0.9rem' }}>Hasil Validasi Struktur Data</h6>
                  
                  {testResult.validation.validFormat ? (
                    <>
                      <div className="d-flex align-items-center mb-3">
                        <Badge bg={testResult.validation.hasTimestamp ? 'success' : 'danger'} className="me-2">
                          {testResult.validation.hasTimestamp ? 'OK' : 'MISSING'}
                        </Badge>
                        <span className="small text-muted">Kolom Timestamp (Wajib untuk grafik/riwayat)</span>
                      </div>

                      <div className="fw-semibold mb-2" style={{ fontSize: '0.85rem' }}>Pencocokan Kolom Sensor:</div>
                      <div className="row g-2" style={{ fontSize: '0.8rem' }}>
                        {testResult.validation.fields.map(field => (
                          <div key={field.key} className="col-6 d-flex align-items-center justify-content-between border-bottom py-1">
                            <span className="text-muted">{field.label}:</span>
                            <Badge bg={field.status === 'ok' ? 'success' : 'secondary'}>
                              {field.status === 'ok' ? `${field.foundKey} (${field.value})` : 'Tidak ditemukan'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Alert variant="warning" className="py-2 mb-0" style={{ fontSize: '0.8rem' }}>
                      {testResult.validation.message}
                    </Alert>
                  )}
                </div>
              )}

              {testResult.data && (
                <div>
                  <div className="small fw-semibold text-muted mb-1">Response JSON (Sample 1 Record):</div>
                  <pre className="p-2 bg-dark text-light rounded text-start overflow-auto" style={{ fontSize: '0.75rem', maxHeight: '180px' }}>
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  const renderConfigList = () => (
    <>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
        <div className="fw-semibold">Daftar Konfigurasi</div>
        <Button size="sm" variant="primary" onClick={handleAddNew}>
          Tambah Konfigurasi
        </Button>
      </div>
      {configs.length === 0 ? (
        <div className="text-muted">Belum ada konfigurasi tersimpan.</div>
      ) : (
        <ListGroup>
          {configs.map((item) => (
            <ListGroup.Item key={item.id}>
              <Stack gap={2}>
                <div className="d-flex align-items-center gap-2">
                  <div className="fw-semibold">{item.name}</div>
                  <Badge bg={item.type === 'backend' ? 'primary' : 'warning'}>
                    {item.type === 'backend' ? 'Backend' : 'MQTT'}
                  </Badge>
                  <Badge bg="secondary">{item.templateId}</Badge>
                  {item.id === activeId && <Badge bg="success">Aktif</Badge>}
                </div>
                <div className="small text-muted">
                  {item.type === 'backend'
                    ? `Base URL: ${item.baseUrl || '-'} ${item.useSingleEndpoint ? '(Single Endpoint & Client Resample)' : ''}`
                    : `Broker: ${item.brokerUrl || '-'} `}
                </div>
                <Stack direction="horizontal" gap={2} className="flex-wrap">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => handleActivate(item.id)}
                  >
                    Gunakan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleRemove(item.id)}
                  >
                    Hapus
                  </Button>
                </Stack>
              </Stack>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </>
  );

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>Konfigurasi Data Source</Card.Title>
        <Card.Text>
          Pilih backend atau MQTT, lalu sesuaikan endpoint sesuai kebutuhan template.
        </Card.Text>
        <Alert variant={status.type || 'info'}>
          {status.message || 'Panel simulasi: data disimpan lokal.'}
        </Alert>
        {!showForm ? (
          <div className="mt-3">{renderConfigList()}</div>
        ) : (
          <Row className="g-4">
            <Col xs={12} lg={6}>
              <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="configName">
                <Form.Label>Nama Konfigurasi</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Misal: Kebun A - Backend"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Jenis Data Source</Form.Label>
                <Stack direction="horizontal" gap={3}>
                  <Form.Check
                    type="radio"
                    id="type-backend"
                    label="Backend"
                    checked={type === 'backend'}
                    onChange={() => setType('backend')}
                  />
                  <Form.Check
                    type="radio"
                    id="type-mqtt"
                    label="MQTT"
                    checked={type === 'mqtt'}
                    onChange={() => setType('mqtt')}
                  />
                </Stack>
              </Form.Group>
              <Form.Group className="mb-3" controlId="templateId">
                <Form.Label>Template</Form.Label>
                <Form.Select
                  value={templateId}
                  onChange={(event) => setTemplateId(event.target.value)}
                >
                  {stationTemplates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {type === 'backend' ? (
                <>
                  <Form.Group className="mb-3" controlId="backendUrl">
                    <Form.Label>Base URL Backend</Form.Label>
                    <Form.Control
                      type="url"
                      placeholder="https://api.example.com"
                      value={baseUrl}
                      onChange={(event) => setBaseUrl(event.target.value)}
                    />
                    <Form.Text className="text-muted">
                      Base URL akan digabungkan dengan mapping endpoint di bawah.
                    </Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="use-single-endpoint"
                      label="Gunakan Satu Endpoint Utama untuk Semua Filter (Resample di Client)"
                      checked={useSingleEndpoint}
                      onChange={(e) => setUseSingleEndpoint(e.target.checked)}
                    />
                    <Form.Text className="text-muted">
                      Aktifkan jika backend Anda hanya memiliki satu endpoint data mentah (tidak ada endpoint harian/resample khusus).
                    </Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="clientResample">
                    <Form.Label>Interval Resampling Client</Form.Label>
                    <Form.Select
                      value={clientResample}
                      onChange={(e) => setClientResample(e.target.value)}
                    >
                      <option value="none">Nonaktif (Gunakan data mentah)</option>
                      <option value="15">Resample 15 Menit (Rekomendasi)</option>
                      <option value="30">Resample 30 Menit</option>
                      <option value="60">Resample 1 Jam</option>
                      <option value="1440">Resample 1 Hari</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Membantu meringankan beban chart jika data mentah dari backend sangat padat.
                    </Form.Text>
                  </Form.Group>
                  <div className="mb-3">
                    <div className="fw-semibold mb-2">Mapping Endpoint Template</div>
                    {requiredEndpoints.map((item) => {
                      if (useSingleEndpoint && item.key !== 'topic5History') {
                        return null;
                      }
                      return (
                        <Form.Group className="mb-3" key={item.key}>
                          <Form.Label>{item.label}</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder={item.defaultPath}
                            value={endpointMap[item.key] || ''}
                            onChange={(event) => handleEndpointChange(item.key, event.target.value)}
                          />
                          <Form.Text className="text-muted">
                            {item.description} | Default: {item.defaultPath}
                          </Form.Text>
                        </Form.Group>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <Form.Group className="mb-3" controlId="mqttUrl">
                    <Form.Label>Broker MQTT</Form.Label>
                    <Form.Control
                      type="url"
                      placeholder="wss://broker.example.com"
                      value={brokerUrl}
                      onChange={(event) => setBrokerUrl(event.target.value)}
                    />
                    <Form.Text className="text-muted">
                      Contoh: mqtt://, ws://, atau wss://
                    </Form.Text>
                  </Form.Group>
                  <div className="mb-3">
                    <div className="fw-semibold mb-2">Mapping Topik MQTT</div>
                    {requiredTopics.map((item) => (
                      <Form.Group className="mb-3" key={item.key}>
                        <Form.Label>{item.label}</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder={item.defaultTopic}
                          value={topicMap[item.key] || ''}
                          onChange={(event) => handleTopicChange(item.key, event.target.value)}
                        />
                        <Form.Text className="text-muted">
                          {item.description} | Default: {item.defaultTopic}
                        </Form.Text>
                      </Form.Group>
                    ))}
                  </div>
                </>
              )}

                <Stack direction="horizontal" gap={2} className="flex-wrap">
                  <Button type="submit" variant="primary">
                    {editingId ? 'Simpan Perubahan' : 'Simpan Konfigurasi'}
                  </Button>
                  <Button type="button" variant="outline-secondary" onClick={handleCancel}>
                    Kembali
                  </Button>
                </Stack>
              </Form>
            </Col>
            <Col xs={12} lg={6}>
              {renderTester()}
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

export default EndpointConfigPanel;

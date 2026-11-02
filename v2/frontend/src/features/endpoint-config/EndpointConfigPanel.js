import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Row, Stack } from 'react-bootstrap';
import {
  getTemplateById,
  getTemplateDisplayName,
  stationTemplates,
} from '../station-template/stationTemplates';
import {
  activateEndpointConfig,
  deleteEndpointConfig,
  getAuthToken,
  listEndpointConfigs,
  saveEndpointConfig,
} from '../user-dashboard/userApi';

const STORAGE_KEY = 'mc_v2_user_configs';
const ACTIVE_KEY = 'mc_v2_active_config_id';

const buildEmptyMap = (items, keyField, defaultField) =>
  items.reduce((acc, item) => {
    acc[item[keyField]] = item[defaultField] || '';
    return acc;
  }, {});

const sanitizeName = (value) => value.trim();

const formatSampleValue = (val) => {
  if (val === null || val === undefined || val === '') return 'kosong';
  const str = String(val);
  return str.length > 22 ? `${str.slice(0, 22)}…` : str;
};

const validateBackendResponse = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      validFormat: false,
      message: 'Format data belum sesuai (respons API kosong atau bukan berupa daftar/array data).',
      fields: [],
      detectedCount: 0,
    };
  }

  const firstItem = rows[0];
  const fieldSpecs = [
    { key: 'timestamp', label: 'Waktu Pencatatan (Timestamp)', possibleKeys: ['timestamp', 'time', 'created_at', 'date', 'datetime'], required: true },
    { key: 'humidity', label: 'Kelembaban Udara', possibleKeys: ['humidity', 'hum', 'hum_dht22', 'kelembaban'] },
    { key: 'temperature', label: 'Suhu Udara', possibleKeys: ['temperature', 'temp', 'temp_dht22', 'suhu'] },
    { key: 'rainfall', label: 'Curah Hujan', possibleKeys: ['rainfall', 'rain', 'curah_hujan'] },
    { key: 'windSpeed', label: 'Kecepatan Angin', possibleKeys: ['windSpeed', 'windspeed', 'wind_speed', 'kecepatan_angin'] },
    { key: 'irradiation', label: 'Radiasi Matahari', possibleKeys: ['pyrano', 'irradiation', 'radiasi', 'solar'] },
    { key: 'direction', label: 'Arah Mata Angin (Teks)', possibleKeys: ['direction', 'windDirection', 'wind_direction', 'arah_angin'] },
    { key: 'angle', label: 'Sudut Arah Angin (°)', possibleKeys: ['angle', 'windAngle', 'wind_angle', 'sudut_angin'] },
    { key: 'airPressure', label: 'Tekanan Udara', possibleKeys: ['AirPressure', 'airPressure', 'airpressure', 'air_pressure', 'tekanan_udara'] },
    { key: 'bmpTemperature', label: 'Suhu Alat / Cadangan', possibleKeys: ['bmpTemperature', 'bmptemperature', 'bmp_temperature', 'suhuAir', 'waterTemperature'] },
  ];

  const fieldsResult = fieldSpecs.map((spec) => {
    const foundKey = spec.possibleKeys.find((k) => Object.prototype.hasOwnProperty.call(firstItem, k));
    return {
      key: spec.key,
      label: spec.label,
      required: Boolean(spec.required),
      status: foundKey ? 'ok' : 'missing',
      foundKey: foundKey || null,
      value: foundKey ? firstItem[foundKey] : null,
    };
  });

  const hasTimestamp = fieldsResult.find((f) => f.key === 'timestamp')?.status === 'ok';
  const sensorFields = fieldsResult.filter((f) => !f.required);
  const detectedCount = sensorFields.filter((f) => f.status === 'ok').length;

  return {
    validFormat: true,
    hasTimestamp,
    fields: fieldsResult,
    sensorFields,
    detectedCount,
    totalSensorCount: sensorFields.length,
  };
};

const buildResolvedTestUrl = (baseUrl, customPath) => {
  const cleanBase = String(baseUrl || '').trim().replace(/\/$/, '');
  const cleanPath = String(customPath || '').trim().replace(/^\//, '');
  if (!cleanBase) return '';
  const combined = cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
  return combined.includes('?') ? `${combined}&limit=5` : `${combined}?limit=5`;
};

const EndpointConfigPanel = () => {
  const [configs, setConfigs] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
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
  const [useSingleEndpoint, setUseSingleEndpoint] = useState(true);
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
      } catch (_error) {
        setStatus({ type: 'warning', message: 'Data konfigurasi lokal tidak dapat dibaca.' });
      }
    }
    if (savedActive) {
      setActiveId(savedActive);
    }

    if (getAuthToken()) {
      listEndpointConfigs()
        .then((data) => {
          const remoteConfigs = data.result || [];
          setConfigs(remoteConfigs);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteConfigs));
          const activeConfig = remoteConfigs.find((item) => item.isActive);
          if (activeConfig) {
            setActiveId(activeConfig.id);
            localStorage.setItem(ACTIVE_KEY, activeConfig.id);
          }
        })
        .catch((error) => {
          setStatus({
            type: 'warning',
            message: error?.isUnauthorized
              ? 'Sesi login telah berakhir. Menampilkan konfigurasi lokal.'
              : 'Server user belum dapat dihubungi. Menampilkan konfigurasi lokal.',
          });
        });
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
    setUseSingleEndpoint(true);
    setClientResample('none');
    setShowAdvanced(false);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
    setStatus({ type: 'info', message: '' });
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setStatus({ type: 'info', message: '' });
  };

  const persistConfigs = (next) => {
    setConfigs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleBaseUrlBlur = () => {
    const raw = baseUrl.trim();
    if (!raw) return;
    try {
      const parsed = new URL(raw);
      if (parsed.pathname && parsed.pathname !== '/' && !(endpointMap.topic5History || '').trim()) {
        setBaseUrl(parsed.origin);
        setEndpointMap((prev) => ({
          ...prev,
          topic5History: parsed.pathname,
        }));
      }
    } catch (_e) {
      // Biarkan apa adanya jika bukan URL penuh
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanName = sanitizeName(name);
    if (!cleanName) {
      setStatus({ type: 'danger', message: 'Nama sumber data wajib diisi.' });
      return;
    }

    if (type === 'backend' && !baseUrl.trim()) {
      setStatus({ type: 'danger', message: 'Alamat Server API (Base URL) wajib diisi.' });
      return;
    }

    if (type === 'mqtt' && !brokerUrl.trim()) {
      setStatus({ type: 'danger', message: 'Alamat Broker MQTT wajib diisi.' });
      return;
    }

    let finalBaseUrl = baseUrl.trim();
    const currentEndpointMap = { ...endpointMap };

    if (type === 'backend') {
      try {
        const parsed = new URL(finalBaseUrl);
        if (parsed.pathname && parsed.pathname !== '/' && !(currentEndpointMap.topic5History || '').trim()) {
          finalBaseUrl = parsed.origin;
          currentEndpointMap.topic5History = parsed.pathname;
        }
      } catch (_e) {
        // Ignore
      }
    }

    const normalizedEndpointMap = requiredEndpoints.reduce((acc, item) => {
      const value = (currentEndpointMap[item.key] || '').trim();
      acc[item.key] = value || item.defaultPath || '';
      return acc;
    }, {});

    if (useSingleEndpoint && normalizedEndpointMap.topic5History) {
      if (!normalizedEndpointMap.station2Daily) {
        normalizedEndpointMap.station2Daily = normalizedEndpointMap.topic5History;
      }
      if (!normalizedEndpointMap.station2Resample15m) {
        normalizedEndpointMap.station2Resample15m = normalizedEndpointMap.topic5History;
      }
    }

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
      baseUrl: finalBaseUrl,
      brokerUrl: brokerUrl.trim(),
      endpointMap: normalizedEndpointMap,
      topicMap: normalizedTopicMap,
      useSingleEndpoint,
      clientResample,
      updatedAt: new Date().toISOString(),
    };

    try {
      const saved = getAuthToken() ? (await saveEndpointConfig(payload)).result : payload;
      const nextConfigs = editingId
        ? configs.map((item) => (item.id === editingId ? saved : item))
        : [saved, ...configs];

      persistConfigs(nextConfigs);
      if (getAuthToken()) {
        await activateEndpointConfig(saved.id);
      }
      setActiveId(saved.id);
      localStorage.setItem(ACTIVE_KEY, saved.id);
      setStatus({ type: 'success', message: 'Sumber data berhasil disimpan dan diaktifkan.' });
      resetForm();
      setShowForm(false);
    } catch (error) {
      setStatus({ type: 'danger', message: error.message || 'Sumber data gagal disimpan.' });
    }
  };

  const handleEdit = (config) => {
    const isSingle = config.useSingleEndpoint !== undefined ? Boolean(config.useSingleEndpoint) : true;
    const hasCustomResample = Boolean(config.clientResample && config.clientResample !== 'none');
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
    setUseSingleEndpoint(isSingle);
    setClientResample(config.clientResample || 'none');
    setShowAdvanced(!isSingle || hasCustomResample);
    setStatus({ type: 'info', message: 'Perbarui pengaturan sumber data di bawah lalu klik Simpan Perubahan.' });
    setShowForm(true);
  };

  const handleActivate = async (configId) => {
    try {
      if (getAuthToken()) {
        await activateEndpointConfig(configId);
      }
      const next = configs.map((item) => ({ ...item, isActive: item.id === configId }));
      persistConfigs(next);
      setActiveId(configId);
      localStorage.setItem(ACTIVE_KEY, configId);
      setStatus({ type: 'success', message: 'Sumber data utama berhasil diperbarui.' });
    } catch (error) {
      setStatus({ type: 'danger', message: error.message || 'Gagal mengaktifkan sumber data.' });
    }
  };

  const handleRemove = async (configId) => {
    try {
      if (getAuthToken()) {
        await deleteEndpointConfig(configId);
      }
      const next = configs.filter((item) => item.id !== configId);
      persistConfigs(next);
      if (activeId === configId) {
        setActiveId('');
        localStorage.removeItem(ACTIVE_KEY);
      }
      setStatus({ type: 'info', message: 'Sumber data telah dihapus.' });
    } catch (error) {
      setStatus({ type: 'danger', message: error.message || 'Gagal menghapus sumber data.' });
    }
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

    const activePath = endpointMap[testKey] || '';
    const fullUrl = buildResolvedTestUrl(baseUrl, activePath);

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Server merespons dengan status ${response.status} (${response.statusText || 'Error'})`);
      }

      const data = await response.json();

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
        validation,
      });
    } catch (error) {
      setTestResult({
        success: false,
        status: 0,
        error:
          error.message ||
          'Gagal menghubungi server API. Pastikan alamat URL benar, server aktif, dan mengizinkan akses CORS.',
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
            <Card.Title className="text-warning h6 fw-bold">Informasi Koneksi MQTT</Card.Title>
            <Card.Text className="small text-muted mb-0">
              Pastikan broker MQTT Anda mendukung protokol WebSocket (<code>ws://</code> atau <code>wss://</code>) agar dapat diakses langsung oleh browser pada halaman dashboard.
            </Card.Text>
          </Card.Body>
        </Card>
      );
    }

    if (!baseUrl) {
      return (
        <div className="text-muted text-center p-4 border rounded bg-light">
          <div className="fw-semibold text-dark mb-1">Panel Tes Koneksi Sensor</div>
          <div className="small">
            Isi <strong>Alamat Server API</strong> di sebelah kiri terlebih dahulu untuk menguji apakah data sensor Anda dapat terbaca.
          </div>
        </div>
      );
    }

    const previewTestUrl = buildResolvedTestUrl(baseUrl, endpointMap[testKey]);

    return (
      <Card className="shadow-sm border-primary">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-2">
          <h6 className="mb-0 fw-semibold">Tes Koneksi & Cek Data Sensor</h6>
          <Badge bg="light" text="primary">Cek Otomatis</Badge>
        </Card.Header>
        <Card.Body>
          {!useSingleEndpoint && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Pilih Path Endpoint yang Ingin Diuji</Form.Label>
              <Form.Select
                size="sm"
                value={testKey}
                onChange={(e) => {
                  setTestKey(e.target.value);
                  setTestResult(null);
                }}
              >
                {requiredEndpoints.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          <div className="mb-3">
            <div className="small fw-semibold text-muted mb-1">Alamat URL yang Diuji:</div>
            <code className="d-block p-2 bg-light border rounded text-break" style={{ fontSize: '0.82rem' }}>
              {previewTestUrl}
            </code>
          </div>

          <Button
            variant="outline-primary"
            className="w-100 mb-3 fw-semibold"
            onClick={handleRunTest}
            disabled={isTesting}
          >
            {isTesting ? 'Sedang Mengecek Koneksi API...' : 'Tes Koneksi Sekarang'}
          </Button>

          {testResult && (
            <div className="mt-3">
              <Alert variant={testResult.success ? 'success' : 'danger'} className="py-2 px-3">
                <div className="fw-bold">
                  {testResult.success ? 'Koneksi Berhasil Terhubung!' : 'Koneksi Gagal'}
                </div>
                <div className="small">
                  {testResult.success
                    ? `Status HTTP ${testResult.status} — Server merespons dengan data JSON.`
                    : testResult.error}
                </div>
              </Alert>

              {testResult.success && testResult.validation && (
                <div className="border rounded p-3 bg-white mb-3">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2 flex-wrap gap-1">
                    <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>
                      Kesesuaian Kolom Sensor
                    </h6>
                    {testResult.validation.validFormat && (
                      <Badge bg="primary" pill>
                        {testResult.validation.detectedCount} dari {testResult.validation.totalSensorCount} sensor terbaca
                      </Badge>
                    )}
                  </div>

                  {testResult.validation.validFormat ? (
                    <>
                      <div className="d-flex align-items-center justify-content-between py-2 px-2 rounded bg-light mb-2">
                        <div>
                          <div className="fw-semibold small">Waktu Pencatatan (Timestamp)</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            Wajib ada untuk menampilkan grafik & riwayat waktu
                          </div>
                        </div>
                        <Badge bg={testResult.validation.hasTimestamp ? 'success' : 'danger'}>
                          {testResult.validation.hasTimestamp ? 'Tersedia' : 'Tidak Ditemukan'}
                        </Badge>
                      </div>

                      <div className="d-flex flex-column">
                        {testResult.validation.sensorFields.map((field) => (
                          <div
                            key={field.key}
                            className="d-flex align-items-center justify-content-between border-bottom py-2 gap-2"
                            style={{ fontSize: '0.82rem' }}
                          >
                            <span className="text-dark fw-medium">{field.label}</span>
                            {field.status === 'ok' ? (
                              <Badge bg="success" className="fw-normal text-truncate" style={{ maxWidth: '210px' }}>
                                {field.foundKey}: {formatSampleValue(field.value)}
                              </Badge>
                            ) : (
                              <Badge bg="secondary" className="fw-normal opacity-75">
                                Tidak ada di API
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="small text-muted mt-2" style={{ fontSize: '0.76rem' }}>
                        <strong>Tips:</strong> Tidak masalah jika alat Anda hanya memiliki sebagian sensor di atas. Anda dapat memilih sensor mana saja yang ingin ditampilkan melalui menu <strong>Atur Tampilan</strong>.
                      </div>
                    </>
                  ) : (
                    <Alert variant="warning" className="py-2 mb-0" style={{ fontSize: '0.82rem' }}>
                      {testResult.validation.message}
                    </Alert>
                  )}
                </div>
              )}

              {testResult.data && (
                <details className="small">
                  <summary className="fw-semibold text-muted mb-1" style={{ cursor: 'pointer' }}>
                    Lihat Contoh Data Mentah (JSON)
                  </summary>
                  <pre
                    className="p-2 bg-dark text-light rounded text-start overflow-auto mt-1 mb-0"
                    style={{ fontSize: '0.75rem', maxHeight: '180px' }}
                  >
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  const renderConfigList = () => (
    <>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <div className="fw-semibold">Sumber Data yang Tersimpan</div>
          <div className="small text-muted">
            Pilih sumber data aktif atau tambahkan koneksi baru dari perangkat sensor Anda.
          </div>
        </div>
        <Button size="sm" variant="primary" onClick={handleAddNew}>
          + Tambah Sumber Data
        </Button>
      </div>
      {configs.length === 0 ? (
        <div className="text-center py-4 border rounded bg-light text-muted">
          <div className="fw-semibold text-dark mb-1">Belum ada sumber data sensor</div>
          <div className="small mb-3">
            Hubungkan API atau broker MQTT milik Anda agar data sensor dapat ditampilkan di dashboard.
          </div>
          <Button size="sm" variant="primary" onClick={handleAddNew}>
            Hubungkan Sumber Data Pertama
          </Button>
        </div>
      ) : (
        <ListGroup>
          {configs.map((item) => {
            const primaryPath = item.endpointMap?.topic5History || item.endpointMap?.station2Daily || '';
            return (
              <ListGroup.Item key={item.id} className="py-3">
                <Stack gap={2}>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <div className="fw-semibold">{item.name}</div>
                    <Badge bg={item.type === 'backend' ? 'primary' : 'warning'}>
                      {item.type === 'backend' ? 'REST API' : 'MQTT'}
                    </Badge>
                    <Badge bg="light" text="dark" className="border">
                      {getTemplateDisplayName(item.templateId)}
                    </Badge>
                    {(item.id === activeId || item.isActive) && <Badge bg="success">Digunakan</Badge>}
                  </div>
                  <div className="small text-muted">
                    {item.type === 'backend' ? (
                      <>
                        Alamat API: <code>{item.baseUrl || '-'}{primaryPath}</code>
                      </>
                    ) : (
                      <>
                        Broker MQTT: <code>{item.brokerUrl || '-'}</code>
                      </>
                    )}
                  </div>
                  <Stack direction="horizontal" gap={2} className="flex-wrap">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleActivate(item.id)}
                    >
                      Jadikan Utama
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
            );
          })}
        </ListGroup>
      )}
    </>
  );

  return (
    <Card className="shadow-sm">
      <Card.Body>
        {status.message && (
          <Alert variant={status.type || 'info'} className="mb-3">
            {status.message}
          </Alert>
        )}
        {!showForm ? (
          <div>{renderConfigList()}</div>
        ) : (
          <Row className="g-4">
            <Col xs={12} lg={6}>
              <div className="p-3 rounded bg-light border mb-3 small">
                <div className="fw-bold text-dark mb-1">Panduan Cepat Menghubungkan Alat:</div>
                <ol className="mb-0 ps-3 text-muted">
                  <li>Beri nama koneksi dan masukkan alamat URL API dari perangkat/server Anda.</li>
                  <li>Klik tombol <strong>Tes Koneksi Sekarang</strong> di panel kanan untuk mengecek pembacaan sensor.</li>
                  <li>Jika sudah sesuai, klik <strong>Simpan Sumber Data</strong>.</li>
                </ol>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="configName">
                  <Form.Label className="fw-semibold">Nama Sumber Data / Stasiun</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Contoh: Stasiun Cuaca Kebun Kopi"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Metode Koneksi Alat</Form.Label>
                  <Stack direction="horizontal" gap={3}>
                    <Form.Check
                      type="radio"
                      id="type-backend"
                      label="REST API (Web / HTTP)"
                      checked={type === 'backend'}
                      onChange={() => setType('backend')}
                    />
                    <Form.Check
                      type="radio"
                      id="type-mqtt"
                      label="MQTT Broker"
                      checked={type === 'mqtt'}
                      onChange={() => setType('mqtt')}
                    />
                  </Stack>
                </Form.Group>

                <Form.Group className="mb-3" controlId="templateId">
                  <Form.Label className="fw-semibold">Model Tampilan Dashboard</Form.Label>
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
                  <Form.Text className="text-muted">
                    {template.description}
                  </Form.Text>
                </Form.Group>

                {type === 'backend' ? (
                  <>
                    <Form.Group className="mb-3" controlId="backendUrl">
                      <Form.Label className="fw-semibold">Alamat Server API (Base URL)</Form.Label>
                      <Form.Control
                        type="url"
                        placeholder="https://api-sensor-anda.com"
                        value={baseUrl}
                        onChange={(event) => setBaseUrl(event.target.value)}
                        onBlur={handleBaseUrlBlur}
                      />
                      <Form.Text className="text-muted">
                        Masukkan alamat utama server API Anda (atau tempel langsung URL lengkap endpoint data sensor Anda).
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="primaryEndpointPath">
                      <Form.Label className="fw-semibold">Path Endpoint Data Sensor</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="/api/sensor/history"
                        value={endpointMap.topic5History || ''}
                        onChange={(event) => handleEndpointChange('topic5History', event.target.value)}
                      />
                      <Form.Text className="text-muted">
                        Path URL tempat data riwayat sensor diambil (misal: <code>/api/data</code> atau <code>/v1/history</code>).
                      </Form.Text>
                    </Form.Group>

                    <div className="mb-3">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="p-0 text-decoration-none fw-semibold"
                        onClick={() => setShowAdvanced((prev) => !prev)}
                      >
                        {showAdvanced
                          ? '▾ Sembunyikan Pengaturan Lanjutan'
                          : '▸ Pengaturan Lanjutan (Opsional)'}
                      </Button>

                      {showAdvanced && (
                        <div className="mt-2 p-3 border rounded bg-light">
                          <Form.Group className="mb-3" controlId="clientResample">
                            <Form.Label className="fw-semibold small">
                              Peringkas Data Grafik (Resampling Otomatis)
                            </Form.Label>
                            <Form.Select
                              size="sm"
                              value={clientResample}
                              onChange={(e) => setClientResample(e.target.value)}
                            >
                              <option value="none">Tampilkan Data Asli (Tanpa diringkas)</option>
                              <option value="15">Rata-rata per 15 Menit (Disarankan jika data sangat padat)</option>
                              <option value="30">Rata-rata per 30 Menit</option>
                              <option value="60">Rata-rata per 1 Jam</option>
                              <option value="1440">Rata-rata per 1 Hari</option>
                            </Form.Select>
                            <Form.Text className="text-muted" style={{ fontSize: '0.78rem' }}>
                              Berguna jika alat Anda mengirim data setiap detik/menit agar grafik tetap ringan dibuka.
                            </Form.Text>
                          </Form.Group>

                          <Form.Group className="mb-2">
                            <Form.Check
                              type="checkbox"
                              id="use-separate-endpoints"
                              label="Server API saya memiliki path terpisah untuk data Harian & Bulanan"
                              checked={!useSingleEndpoint}
                              onChange={(e) => setUseSingleEndpoint(!e.target.checked)}
                            />
                          </Form.Group>

                          {!useSingleEndpoint && (
                            <div className="mt-2 pt-2 border-top">
                              {requiredEndpoints
                                .filter((item) => item.key !== 'topic5History')
                                .map((item) => (
                                  <Form.Group className="mb-2" key={item.key}>
                                    <Form.Label className="small fw-semibold mb-1">{item.label}</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      type="text"
                                      placeholder={item.placeholder || '/api/sensor/history'}
                                      value={endpointMap[item.key] || ''}
                                      onChange={(event) => handleEndpointChange(item.key, event.target.value)}
                                    />
                                    <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                                      {item.description}
                                    </Form.Text>
                                  </Form.Group>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Form.Group className="mb-3" controlId="mqttUrl">
                      <Form.Label className="fw-semibold">Alamat Broker MQTT (WebSocket)</Form.Label>
                      <Form.Control
                        type="url"
                        placeholder="wss://broker.hivemq.com:8884/mqtt"
                        value={brokerUrl}
                        onChange={(event) => setBrokerUrl(event.target.value)}
                      />
                      <Form.Text className="text-muted">
                        Gunakan format protokol WebSocket seperti <code>ws://</code> atau <code>wss://</code>.
                      </Form.Text>
                    </Form.Group>
                    <div className="mb-3">
                      {requiredTopics.map((item) => (
                        <Form.Group className="mb-3" key={item.key}>
                          <Form.Label className="fw-semibold">{item.label}</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder={item.defaultTopic}
                            value={topicMap[item.key] || ''}
                            onChange={(event) => handleTopicChange(item.key, event.target.value)}
                          />
                          <Form.Text className="text-muted">{item.description}</Form.Text>
                        </Form.Group>
                      ))}
                    </div>
                  </>
                )}

                <Stack direction="horizontal" gap={2} className="flex-wrap">
                  <Button type="submit" variant="primary">
                    {editingId ? 'Simpan Perubahan' : 'Simpan Sumber Data'}
                  </Button>
                  <Button type="button" variant="outline-secondary" onClick={handleCancel}>
                    Batal
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

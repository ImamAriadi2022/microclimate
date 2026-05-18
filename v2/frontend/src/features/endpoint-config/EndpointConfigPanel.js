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

  const template = useMemo(() => getTemplateById(templateId), [templateId]);
  const requiredEndpoints = template.requiredEndpoints || [];
  const requiredTopics = template.requiredTopics || [];

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
  }, [templateId]);

  useEffect(() => {
    if (requiredTopics.length === 0) return;
    setTopicMap((prev) => ({
      ...buildEmptyMap(requiredTopics, 'key', 'defaultTopic'),
      ...prev,
    }));
  }, [templateId]);

  const resetForm = () => {
    setEditingId('');
    setName('');
    setType('backend');
    setTemplateId('station2');
    setBaseUrl('');
    setBrokerUrl('');
    setEndpointMap(buildEmptyMap(requiredEndpoints, 'key', 'defaultPath'));
    setTopicMap(buildEmptyMap(requiredTopics, 'key', 'defaultTopic'));
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

  const renderConfigList = () => (
    <>
      <div className="d-flex align-items-center justify-content-between mb-2">
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
                    ? `Base URL: ${item.baseUrl || '-'} `
                    : `Broker: ${item.brokerUrl || '-'} `}
                </div>
                <Stack direction="horizontal" gap={2}>
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
                  <div className="mb-3">
                    <div className="fw-semibold mb-2">Mapping Endpoint Template</div>
                    {requiredEndpoints.map((item) => (
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
                    ))}
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

                <Stack direction="horizontal" gap={2}>
                  <Button type="submit" variant="primary">
                    {editingId ? 'Simpan Perubahan' : 'Simpan Konfigurasi'}
                  </Button>
                  <Button type="button" variant="outline-secondary" onClick={handleCancel}>
                    Kembali
                  </Button>
                </Stack>
              </Form>
            </Col>
            <Col xs={12} lg={6}>{renderConfigList()}</Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

export default EndpointConfigPanel;

import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Form, ListGroup, Stack } from 'react-bootstrap';
import { getTemplateById, stationTemplates } from '../station-template/stationTemplates';

const STORAGE_KEY = 'mc_v2_dashboard_links';
const CONFIG_KEY = 'mc_v2_user_configs';
const ACTIVE_CONFIG_KEY = 'mc_v2_active_config_id';
const slugPattern = /^[a-z0-9-]{3,32}$/;

const buildPreviewLink = (templateId, slug) => {
  const template = getTemplateById(templateId);
  return `${template.basePath}/${slug}`;
};

const DashboardLinksPanel = () => {
  const [links, setLinks] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [activeConfigId, setActiveConfigId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [templateId, setTemplateId] = useState('station2');
  const [configId, setConfigId] = useState('');
  const [status, setStatus] = useState({ type: 'info', message: '' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setLinks([
        {
          id: 'demo-1',
          name: 'Dashboard Kebun C',
          slug: 'kebun-c',
          templateId: 'station2',
          published: true,
          configId: '',
        },
        {
          id: 'demo-2',
          name: 'Dashboard Lab 01',
          slug: 'lab-01',
          templateId: 'station2',
          published: false,
          configId: '',
        },
      ]);
      return;
    }
    try {
      setLinks(JSON.parse(saved));
    } catch (error) {
      setStatus({ type: 'warning', message: 'Simulasi: data link tidak terbaca.' });
    }
  }, []);

  useEffect(() => {
    const savedConfigs = localStorage.getItem(CONFIG_KEY);
    const savedActive = localStorage.getItem(ACTIVE_CONFIG_KEY);
    if (savedConfigs) {
      try {
        setConfigs(JSON.parse(savedConfigs));
      } catch (error) {
        setStatus({ type: 'warning', message: 'Simulasi: konfigurasi tidak terbaca.' });
      }
    }
    if (savedActive) {
      setActiveConfigId(savedActive);
    }
  }, []);

  const configOptions = useMemo(() => configs, [configs]);

  const persistLinks = (nextLinks) => {
    setLinks(nextLinks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLinks));
  };

  const resetForm = () => {
    setEditingId('');
    setName('');
    setSlug('');
    setTemplateId('station2');
    setConfigId(activeConfigId || (configs[0]?.id ?? ''));
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
    setStatus({ type: 'info', message: 'Isi form untuk membuat link baru.' });
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setStatus({ type: 'info', message: 'Kembali ke daftar link.' });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanSlug = slug.trim().toLowerCase();

    if (!cleanName) {
      setStatus({ type: 'danger', message: 'Nama dashboard wajib diisi.' });
      return;
    }
    if (!slugPattern.test(cleanSlug)) {
      setStatus({ type: 'danger', message: 'Slug harus 3-32 karakter (a-z, 0-9, tanda hubung).' });
      return;
    }
    if (links.some((item) => item.slug === cleanSlug && item.id !== editingId)) {
      setStatus({ type: 'danger', message: 'Slug sudah dipakai. Gunakan slug lain.' });
      return;
    }

    if (!configId) {
      setStatus({ type: 'danger', message: 'Pilih konfigurasi data source.' });
      return;
    }

    const payload = {
      id: editingId || `${Date.now()}-${cleanSlug}`,
      name: cleanName,
      slug: cleanSlug,
      templateId,
      published: false,
      configId,
    };

    const nextLinks = editingId
      ? links.map((item) => (item.id === editingId ? payload : item))
      : [payload, ...links];

    persistLinks(nextLinks);
    setStatus({ type: 'success', message: 'Simulasi: link dashboard disimpan.' });
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setName(item.name || '');
    setSlug(item.slug || '');
    setTemplateId(item.templateId || 'station2');
    setConfigId(item.configId || activeConfigId || (configs[0]?.id ?? ''));
    setShowForm(true);
    setStatus({ type: 'info', message: 'Mode edit: ubah data lalu simpan.' });
  };

  const handleRemove = (id) => {
    const nextLinks = links.filter((item) => item.id !== id);
    persistLinks(nextLinks);
    setStatus({ type: 'info', message: 'Simulasi: link dashboard dihapus.' });
  };

  const handleCopy = async (template, itemSlug) => {
    const link = buildPreviewLink(template, itemSlug);
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
      setStatus({ type: 'success', message: 'Simulasi: link berhasil disalin.' });
      return;
    }
    setStatus({ type: 'info', message: `Salin manual: ${link}` });
  };

  const handlePreview = (template, itemSlug) => {
    const link = buildPreviewLink(template, itemSlug);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handlePublish = (id) => {
    const target = links.find((item) => item.id === id);
    if (!target) return;
    if (target.published) {
      setStatus({ type: 'info', message: 'Link ini sudah dipublikasikan.' });
      return;
    }
    const nextLinks = links.map((item) =>
      item.id === id ? { ...item, published: true } : item
    );
    persistLinks(nextLinks);
    setStatus({ type: 'success', message: 'Simulasi: link dipublikasikan.' });
  };

  const getConfigLabel = (id) => configs.find((item) => item.id === id)?.name || '-';

  const renderLinkList = () => (
    <>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="fw-semibold">Link yang sudah dibuat</div>
        <Button size="sm" variant="primary" onClick={handleAddNew}>
          Tambah Link
        </Button>
      </div>
      {links.length === 0 ? (
        <div className="text-muted">Belum ada link dashboard.</div>
      ) : (
        <ListGroup variant="flush">
          {links.map((item) => (
            <ListGroup.Item key={item.id}>
              <Stack direction="horizontal" gap={2} className="flex-wrap">
                <div className="me-auto">
                  <div className="fw-semibold">{item.name}</div>
                  <div className="text-muted">
                    {buildPreviewLink(item.templateId, item.slug)}
                  </div>
                  <div className="small text-muted mt-1 d-flex align-items-center gap-2">
                    <span>
                      Status:{' '}
                      <Badge bg={item.published ? 'success' : 'secondary'}>
                        {item.published ? 'Publik' : 'Draft'}
                      </Badge>
                    </span>
                    <span>
                      Konfigurasi:{' '}
                      <Badge bg="info">{getConfigLabel(item.configId)}</Badge>
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleCopy(item.templateId, item.slug)}
                >
                  Salin
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handlePreview(item.templateId, item.slug)}
                >
                  Preview
                </Button>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => handlePublish(item.id)}
                >
                  Publikasi
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleRemove(item.id)}
                >
                  Hapus
                </Button>
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
        <Card.Title>Dashboard Link</Card.Title>
        <Card.Text>Buat link dashboard custom berbasis template Station2.</Card.Text>
        <Alert variant={status.type || 'info'}>
          {status.message || 'Panel simulasi: data disimpan lokal.'}
        </Alert>
        {!showForm ? (
          <div className="mt-2">{renderLinkList()}</div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="dashboardName">
              <Form.Label>Nama Dashboard</Form.Label>
              <Form.Control
                type="text"
                placeholder="Dashboard Kebun C"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="dashboardSlug">
              <Form.Label>Slug Link</Form.Label>
              <Form.Control
                type="text"
                placeholder="kebun-c"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              />
              <Form.Text className="text-muted">
                Contoh: kebun-c, lab-01, stasiun-utama
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3" controlId="templateId">
              <Form.Label>Template</Form.Label>
              <Form.Select
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
              >
                {stationTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId="configId">
              <Form.Label>Konfigurasi Data Source</Form.Label>
              <Form.Select
                value={configId}
                onChange={(event) => setConfigId(event.target.value)}
                disabled={configOptions.length === 0}
              >
                <option value="">Pilih konfigurasi</option>
                {configOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                {configOptions.length === 0
                  ? 'Belum ada konfigurasi. Buat konfigurasi di menu Konfigurasi Data Source.'
                  : 'Pilih konfigurasi yang akan dipakai oleh dashboard ini.'}
              </Form.Text>
            </Form.Group>
            <Stack direction="horizontal" gap={2}>
              <Button type="submit" variant="primary">
                {editingId ? 'Simpan Perubahan' : 'Simpan Link'}
              </Button>
              <Button type="button" variant="outline-secondary" onClick={handleCancel}>
                Kembali
              </Button>
            </Stack>
          </Form>
        )}
      </Card.Body>
      {showForm && <Card.Footer>{renderLinkList()}</Card.Footer>}
    </Card>
  );
};

export default DashboardLinksPanel;

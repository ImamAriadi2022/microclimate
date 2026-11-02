import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Form, ListGroup, Stack } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { stationTemplates } from '../station-template/stationTemplates';
import {
  deleteDashboardLink,
  getAuthToken,
  listDashboardLinks,
  listEndpointConfigs,
  publishDashboardLink,
  saveDashboardLink,
} from '../user-dashboard/userApi';

const STORAGE_KEY = 'mc_v2_dashboard_links';
const CONFIG_KEY = 'mc_v2_user_configs';
const ACTIVE_CONFIG_KEY = 'mc_v2_active_config_id';
const slugPattern = /^[a-z0-9-]{3,45}$/;

const normalizeSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const DashboardLinksPanel = () => {
  const { username = 'user' } = useParams();
  const activeUsername = localStorage.getItem('mc_v2_username') || username || 'user';
  const [links, setLinks] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [activeConfigId, setActiveConfigId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [templateId, setTemplateId] = useState('station2');
  const [configId, setConfigId] = useState('');
  const [status, setStatus] = useState({ type: 'info', message: '' });

  const buildPreviewLink = (tplId, itemSlug) => {
    return `/${activeUsername}/${tplId}/${itemSlug}`;
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLinks(JSON.parse(saved));
      } catch (_error) {
        setStatus({ type: 'warning', message: 'Data link lokal tidak dapat dibaca.' });
      }
    }

    if (getAuthToken()) {
      listDashboardLinks()
        .then((data) => {
          const remoteLinks = data.result || [];
          setLinks(remoteLinks);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteLinks));
        })
        .catch((error) => {
          setStatus({
            type: 'warning',
            message: error?.isUnauthorized
              ? 'Sesi login telah berakhir. Menampilkan link lokal.'
              : 'Server user belum dapat dihubungi. Menampilkan link lokal.',
          });
        });
    }
  }, []);

  useEffect(() => {
    const savedConfigs = localStorage.getItem(CONFIG_KEY);
    const savedActive = localStorage.getItem(ACTIVE_CONFIG_KEY);
    if (savedConfigs) {
      try {
        setConfigs(JSON.parse(savedConfigs));
      } catch (_error) {
        setStatus({ type: 'warning', message: 'Data konfigurasi lokal tidak dapat dibaca.' });
      }
    }
    if (savedActive) {
      setActiveConfigId(savedActive);
    }

    if (getAuthToken()) {
      listEndpointConfigs()
        .then((data) => {
          const remoteConfigs = data.result || [];
          setConfigs(remoteConfigs);
          localStorage.setItem(CONFIG_KEY, JSON.stringify(remoteConfigs));
          const activeConfig = remoteConfigs.find((item) => item.isActive);
          if (activeConfig) {
            setActiveConfigId(activeConfig.id);
            localStorage.setItem(ACTIVE_CONFIG_KEY, activeConfig.id);
          }
        })
        .catch(() => {});
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
    setSlugTouched(false);
    setTemplateId('station2');
    setConfigId(activeConfigId || (configs[0]?.id ?? ''));
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

  const handleNameChange = (event) => {
    const nextName = event.target.value;
    setName(nextName);
    if (!editingId && !slugTouched) {
      setSlug(normalizeSlug(nextName));
    }
  };

  const handleSlugChange = (event) => {
    setSlugTouched(true);
    setSlug(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanSlug = normalizeSlug(slug || cleanName);

    if (!cleanName) {
      setStatus({ type: 'danger', message: 'Nama dashboard wajib diisi.' });
      return;
    }
    if (!slugPattern.test(cleanSlug)) {
      setStatus({
        type: 'danger',
        message: 'Alamat singkat (Slug) harus terdiri dari 3–45 karakter huruf kecil, angka, atau tanda hubung (-).',
      });
      return;
    }
    if (links.some((item) => item.slug === cleanSlug && item.id !== editingId)) {
      setStatus({ type: 'danger', message: 'Alamat tautan tersebut sudah digunakan. Silakan pilih nama/slug lain.' });
      return;
    }

    if (!configId) {
      setStatus({ type: 'danger', message: 'Pilih sumber data sensor terlebih dahulu.' });
      return;
    }

    const existingLink = editingId ? links.find((item) => item.id === editingId) : null;

    const payload = {
      id: editingId || `${Date.now()}-${cleanSlug}`,
      name: cleanName,
      slug: cleanSlug,
      templateId,
      published: existingLink ? Boolean(existingLink.published) : false,
      configId,
    };

    try {
      const saved = getAuthToken() ? (await saveDashboardLink(payload)).result : payload;
      const nextLinks = editingId
        ? links.map((item) => (item.id === editingId ? saved : item))
        : [saved, ...links];

      persistLinks(nextLinks);
      setStatus({ type: 'success', message: 'Halaman dashboard berhasil disimpan.' });
      resetForm();
      setShowForm(false);
    } catch (error) {
      setStatus({ type: 'danger', message: error.message || 'Halaman dashboard gagal disimpan.' });
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setName(item.name || '');
    setSlug(item.slug || '');
    setSlugTouched(true);
    setTemplateId(item.templateId || 'station2');
    setConfigId(item.configId || activeConfigId || (configs[0]?.id ?? ''));
    setShowForm(true);
    setStatus({ type: 'info', message: '' });
  };

  const handleRemove = async (id) => {
    try {
      if (getAuthToken()) {
        await deleteDashboardLink(id);
      }
      const nextLinks = links.filter((item) => item.id !== id);
      persistLinks(nextLinks);
      setStatus({ type: 'info', message: 'Halaman dashboard dihapus.' });
    } catch (error) {
      setStatus({ type: 'danger', message: error.message || 'Gagal menghapus halaman dashboard.' });
    }
  };

  const handleCopy = async (template, itemSlug) => {
    const link = buildPreviewLink(template, itemSlug);
    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${link}` : link;
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(fullUrl);
      setStatus({ type: 'success', message: 'Tautan dashboard berhasil disalin ke clipboard.' });
      return;
    }
    setStatus({ type: 'info', message: `Salin manual: ${fullUrl}` });
  };

  const handlePreview = (template, itemSlug) => {
    const link = buildPreviewLink(template, itemSlug);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handlePublish = async (id) => {
    const target = links.find((item) => item.id === id);
    if (!target) return;
    if (target.published) {
      setStatus({ type: 'info', message: 'Halaman dashboard ini sudah berstatus Publik.' });
      return;
    }
    try {
      const published = getAuthToken()
        ? (await publishDashboardLink(id)).result
        : { ...target, published: true };
      const nextLinks = links.map((item) =>
        item.id === id ? { ...item, ...published, published: true } : item
      );
      persistLinks(nextLinks);
      setStatus({ type: 'success', message: 'Halaman dashboard berhasil dipublikasikan dan kini dapat diakses umum.' });
    } catch (error) {
      setStatus({ type: 'danger', message: error.message || 'Gagal mempublikasikan halaman dashboard.' });
    }
  };

  const getConfigLabel = (id) => configs.find((item) => item.id === id)?.name || '-';

  const renderLinkList = () => (
    <>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <div className="fw-semibold">Daftar Halaman Dashboard Anda</div>
          <div className="small text-muted">
            Bagikan tautan di bawah ini untuk menampilkan data pantauan stasiun Anda.
          </div>
        </div>
        <Button size="sm" variant="primary" onClick={handleAddNew}>
          + Buat Halaman Baru
        </Button>
      </div>
      {links.length === 0 ? (
        <div className="text-center py-4 border rounded bg-light text-muted">
          <div className="fw-semibold text-dark mb-1">Belum ada halaman dashboard</div>
          <div className="small mb-3">
            Buat halaman baru untuk mengubah sumber data sensor Anda menjadi tampilan visual yang siap dibagikan.
          </div>
          <Button size="sm" variant="primary" onClick={handleAddNew}>
            Buat Halaman Pertama
          </Button>
        </div>
      ) : (
        <ListGroup variant="flush">
          {links.map((item) => (
            <ListGroup.Item key={item.id} className="py-3 px-0">
              <Stack direction="horizontal" gap={2} className="flex-wrap">
                <div className="me-auto">
                  <div className="fw-semibold">{item.name}</div>
                  <div className="text-muted small">
                    <code>{buildPreviewLink(item.templateId, item.slug)}</code>
                  </div>
                  <div className="small text-muted mt-1 d-flex align-items-center gap-3 flex-wrap">
                    <span>
                      Akses:{' '}
                      <Badge bg={item.published ? 'success' : 'secondary'}>
                        {item.published ? 'Publik' : 'Draft'}
                      </Badge>
                    </span>
                    <span>
                      Sumber Data:{' '}
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
                  Salin Link
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handlePreview(item.templateId, item.slug)}
                >
                  Buka
                </Button>
                {!item.published && (
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => handlePublish(item.id)}
                  >
                    Publikasi
                  </Button>
                )}
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
        {status.message && (
          <Alert variant={status.type || 'info'}>
            {status.message}
          </Alert>
        )}
        {!showForm ? (
          <div>{renderLinkList()}</div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="dashboardName">
              <Form.Label className="fw-semibold">Nama Dashboard</Form.Label>
              <Form.Control
                type="text"
                placeholder="Contoh: Stasiun Cuaca Kebun Kopi"
                value={name}
                onChange={handleNameChange}
              />
              <Form.Text className="text-muted">
                Judul utama yang akan tampil di bagian atas halaman dashboard Anda.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="dashboardSlug">
              <Form.Label className="fw-semibold">Alamat Tautan Unik (Slug)</Form.Label>
              <Form.Control
                type="text"
                placeholder="kebun-kopi"
                value={slug}
                onChange={handleSlugChange}
              />
              <Form.Text className="text-muted d-block mt-1">
                Pratinjau alamat halaman:{' '}
                <code>{buildPreviewLink(templateId, normalizeSlug(slug) || 'nama-stasiun')}</code>
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="templateId">
              <Form.Label className="fw-semibold">Model Tampilan Dashboard</Form.Label>
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
              <Form.Label className="fw-semibold">Pilih Sumber Data Sensor</Form.Label>
              <Form.Select
                value={configId}
                onChange={(event) => setConfigId(event.target.value)}
                disabled={configOptions.length === 0}
              >
                <option value="">-- Pilih sumber data --</option>
                {configOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                {configOptions.length === 0
                  ? 'Belum ada sumber data. Hubungkan alat Anda terlebih dahulu di menu Sumber Data Sensor.'
                  : 'Pilih koneksi API/MQTT yang menyuplai data untuk halaman dashboard ini.'}
              </Form.Text>
            </Form.Group>

            <Stack direction="horizontal" gap={2}>
              <Button type="submit" variant="primary">
                {editingId ? 'Simpan Perubahan' : 'Simpan Link'}
              </Button>
              <Button type="button" variant="outline-secondary" onClick={handleCancel}>
                Batal
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

import { useMemo } from 'react';
import { Badge, Button, Col, Row } from 'react-bootstrap';
import {
  FiActivity,
  FiArrowRight,
  FiCheckCircle,
  FiDatabase,
  FiLink2,
  FiSettings,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const CONFIG_KEY = 'mc_v2_user_configs';
const LINKS_KEY = 'mc_v2_dashboard_links';
const ACTIVE_CONFIG_KEY = 'mc_v2_active_config_id';

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
};

const OverviewPage = ({ basePath, displayName }) => {
  const configs = readJson(CONFIG_KEY, []);
  const links = readJson(LINKS_KEY, []);
  const activeConfigId = localStorage.getItem(ACTIVE_CONFIG_KEY);

  const activeConfig = useMemo(
    () => configs.find((item) => item.id === activeConfigId) || null,
    [configs, activeConfigId]
  );

  const publishedLinks = links.filter((item) => item.published).length;
  const draftLinks = links.length - publishedLinks;

  const setupSteps = [
    {
      title: 'Data source',
      done: configs.length > 0,
      detail: configs.length > 0 ? `${configs.length} konfigurasi tersimpan` : 'Belum ada konfigurasi',
      to: `${basePath}/endpoint`,
    },
    {
      title: 'Link dashboard',
      done: links.length > 0,
      detail: links.length > 0 ? `${links.length} link dibuat` : 'Belum ada link',
      to: `${basePath}/links`,
    },
    {
      title: 'Tampilan publik',
      done: publishedLinks > 0,
      detail: publishedLinks > 0 ? `${publishedLinks} link publik` : 'Masih draft',
      to: `${basePath}/templates`,
    },
  ];

  return (
    <section className="user-dashboard__page user-dashboard__page--overview">
      <div className="overview-hero">
        <div>
          <Badge bg="light" text="dark" className="overview-hero__badge">
            Ruang kerja user
          </Badge>
          <h1>{displayName ? `Halo, ${displayName}` : 'Dashboard User'}</h1>
          <p>
            Pantau kesiapan dashboard, kelola sumber data, dan bagikan link stasiun
            dari satu tempat yang lebih ringkas.
          </p>
        </div>
        <div className="overview-hero__actions">
          <Button as={Link} to={`${basePath}/endpoint`} variant="light">
            <FiSettings size={16} />
            Atur Data
          </Button>
          <Button as={Link} to={`${basePath}/links`} variant="primary">
            <FiLink2 size={16} />
            Buat Link
          </Button>
        </div>
      </div>

      <Row className="g-3 mt-1">
        <Col xs={12} md={4}>
          <div className="metric-card">
            <div className="metric-card__icon metric-card__icon--blue">
              <FiDatabase size={20} />
            </div>
            <div>
              <div className="metric-card__value">{configs.length}</div>
              <div className="metric-card__label">Data source</div>
            </div>
          </div>
        </Col>
        <Col xs={12} md={4}>
          <div className="metric-card">
            <div className="metric-card__icon metric-card__icon--green">
              <FiLink2 size={20} />
            </div>
            <div>
              <div className="metric-card__value">{links.length}</div>
              <div className="metric-card__label">Link dashboard</div>
            </div>
          </div>
        </Col>
        <Col xs={12} md={4}>
          <div className="metric-card">
            <div className="metric-card__icon metric-card__icon--amber">
              <FiActivity size={20} />
            </div>
            <div>
              <div className="metric-card__value">{publishedLinks}</div>
              <div className="metric-card__label">Link publik</div>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-4 mt-1">
        <Col xs={12} lg={7}>
          <div className="section-panel">
            <div className="section-panel__header">
              <div>
                <h2>Langkah Berikutnya</h2>
                <p>Selesaikan urutan ini agar dashboard bisa dipakai pengguna akhir.</p>
              </div>
            </div>
            <div className="setup-list">
              {setupSteps.map((step) => (
                <Link to={step.to} className="setup-item" key={step.title}>
                  <span className={`setup-item__status ${step.done ? 'is-done' : ''}`}>
                    <FiCheckCircle size={18} />
                  </span>
                  <span className="setup-item__body">
                    <strong>{step.title}</strong>
                    <span>{step.detail}</span>
                  </span>
                  <FiArrowRight size={18} />
                </Link>
              ))}
            </div>
          </div>
        </Col>
        <Col xs={12} lg={5}>
          <div className="section-panel">
            <div className="section-panel__header">
              <div>
                <h2>Status Aktif</h2>
                <p>Konfigurasi yang akan dipakai link baru.</p>
              </div>
            </div>
            {activeConfig ? (
              <div className="active-source">
                <Badge bg={activeConfig.type === 'backend' ? 'primary' : 'warning'}>
                  {activeConfig.type === 'backend' ? 'Backend' : 'MQTT'}
                </Badge>
                <h3>{activeConfig.name}</h3>
                <p>
                  {activeConfig.type === 'backend'
                    ? activeConfig.baseUrl || 'Base URL belum diisi'
                    : activeConfig.brokerUrl || 'Broker belum diisi'}
                </p>
                <Button as={Link} to={`${basePath}/endpoint`} variant="outline-primary" size="sm">
                  Periksa konfigurasi
                </Button>
              </div>
            ) : (
              <div className="empty-state">
                <FiDatabase size={24} />
                <strong>Belum ada konfigurasi aktif</strong>
                <span>Buat atau aktifkan data source agar link dashboard punya sumber data.</span>
              </div>
            )}
          </div>
          <div className="section-panel mt-4">
            <div className="section-panel__header">
              <div>
                <h2>Publikasi</h2>
                <p>{draftLinks > 0 ? `${draftLinks} link masih draft.` : 'Tidak ada draft tertunda.'}</p>
              </div>
              <Button as={Link} to={`${basePath}/links`} variant="outline-secondary" size="sm">
                Kelola
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </section>
  );
};

export default OverviewPage;

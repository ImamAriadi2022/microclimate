import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Col, Row } from 'react-bootstrap';
import {
  FiArrowRight,
  FiCheckCircle,
  FiDatabase,
  FiExternalLink,
  FiLink2,
  FiSettings,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getTemplateDisplayName } from '../station-template/stationTemplates';
import { getAuthToken, listDashboardLinks, listEndpointConfigs } from './userApi';

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
  const [configs, setConfigs] = useState(() => readJson(CONFIG_KEY, []));
  const [links, setLinks] = useState(() => readJson(LINKS_KEY, []));
  const [activeConfigId, setActiveConfigId] = useState(
    () => localStorage.getItem(ACTIVE_CONFIG_KEY) || ''
  );

  useEffect(() => {
    if (!getAuthToken()) return;
    let cancelled = false;

    Promise.all([
      listEndpointConfigs().catch(() => null),
      listDashboardLinks().catch(() => null),
    ]).then(([configRes, linkRes]) => {
      if (cancelled) return;

      if (configRes && Array.isArray(configRes.result)) {
        const remoteConfigs = configRes.result;
        setConfigs(remoteConfigs);
        localStorage.setItem(CONFIG_KEY, JSON.stringify(remoteConfigs));
        const active = remoteConfigs.find((item) => item.isActive);
        if (active) {
          setActiveConfigId(active.id);
          localStorage.setItem(ACTIVE_CONFIG_KEY, active.id);
        }
      }

      if (linkRes && Array.isArray(linkRes.result)) {
        const remoteLinks = linkRes.result;
        setLinks(remoteLinks);
        localStorage.setItem(LINKS_KEY, JSON.stringify(remoteLinks));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeConfig = useMemo(
    () =>
      configs.find((item) => item.isActive) ||
      configs.find((item) => item.id === activeConfigId) ||
      null,
    [configs, activeConfigId]
  );

  const publishedLinks = links.filter((item) => item.published).length;
  const draftLinks = links.length - publishedLinks;
  const activeUsername = localStorage.getItem('mc_v2_username') || 'user';

  const setupSteps = [
    {
      title: '1. Hubungkan Sumber Data Sensor',
      done: configs.length > 0,
      detail:
        configs.length > 0
          ? `${configs.length} sumber data telah terhubung`
          : 'Masukkan alamat API atau broker MQTT dari alat sensor Anda',
      to: `${basePath}/endpoint`,
    },
    {
      title: '2. Buat Halaman & Link Dashboard',
      done: links.length > 0,
      detail:
        links.length > 0
          ? `${links.length} halaman dashboard telah dibuat`
          : 'Beri nama stasiun Anda dan buat alamat tautan khusus',
      to: `${basePath}/links`,
    },
    {
      title: '3. Pilih Sensor & Publikasikan',
      done: publishedLinks > 0,
      detail:
        publishedLinks > 0
          ? `${publishedLinks} halaman aktif dan siap diakses publik`
          : 'Pilih sensor yang ingin ditampilkan lalu bagikan ke publik',
      to: `${basePath}/templates`,
    },
  ];

  return (
    <section className="user-dashboard__page">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 pb-3 mb-4 border-bottom">
        <div className="user-dashboard__page-header">
          <h2 className="mb-1">Ringkasan Ruang Kerja{displayName ? ` — ${displayName}` : ''}</h2>
          <p className="mb-0">
            Hubungkan alat sensor Anda, buat halaman pantauan sendiri, dan bagikan datanya dengan mudah.
          </p>
        </div>
        <div className="overview-hero__actions">
          <Button as={Link} to={`${basePath}/endpoint`} variant="outline-primary" size="sm">
            <FiSettings size={15} />
            Sumber Data Sensor
          </Button>
          <Button as={Link} to={`${basePath}/links`} variant="primary" size="sm">
            <FiLink2 size={15} />
            Buat Link Dashboard
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col xs={12} md={4}>
          <div className="metric-card">
            <div>
              <div className="metric-card__label">Sumber Data Terhubung</div>
              <div className="metric-card__value">{configs.length}</div>
            </div>
            <div className="metric-card__icon metric-card__icon--primary">
              <FiDatabase size={20} />
            </div>
          </div>
        </Col>
        <Col xs={12} md={4}>
          <div className="metric-card">
            <div>
              <div className="metric-card__label">Halaman Dashboard</div>
              <div className="metric-card__value">{links.length}</div>
            </div>
            <div className="metric-card__icon metric-card__icon--primary">
              <FiLink2 size={20} />
            </div>
          </div>
        </Col>
        <Col xs={12} md={4}>
          <div className="metric-card">
            <div>
              <div className="metric-card__label">Siap Diakses Publik</div>
              <div className="metric-card__value">
                {publishedLinks}
                {draftLinks > 0 && (
                  <span className="metric-card__subvalue">{draftLinks} draft</span>
                )}
              </div>
            </div>
            <div className="metric-card__icon metric-card__icon--primary">
              <FiCheckCircle size={20} />
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        <Col xs={12} lg={7}>
          <div className="section-panel h-100">
            <div className="section-panel__header">
              <div>
                <h2>Langkah Membuat Dashboard Anda</h2>
                <p>Ikuti 3 langkah mudah berikut untuk menampilkan data sensor Anda.</p>
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
                  <FiArrowRight size={16} className="text-muted" />
                </Link>
              ))}
            </div>
          </div>
        </Col>
        <Col xs={12} lg={5}>
          <div className="section-panel h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="section-panel__header">
                <div>
                  <h2>Sumber Data Utama</h2>
                  <p>Sumber data yang otomatis dipilih saat Anda membuat link baru.</p>
                </div>
              </div>
              {activeConfig ? (
                <div className="active-source">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Badge bg={activeConfig.type === 'backend' ? 'primary' : 'warning'}>
                      {activeConfig.type === 'backend' ? 'REST API' : 'MQTT'}
                    </Badge>
                    <Badge bg="light" text="dark" className="border">
                      {getTemplateDisplayName(activeConfig.templateId)}
                    </Badge>
                  </div>
                  <h3 className="mt-1">{activeConfig.name}</h3>
                  <code className="d-block p-2 rounded small text-break">
                    {activeConfig.type === 'backend'
                      ? activeConfig.baseUrl || 'Alamat URL belum diisi'
                      : activeConfig.brokerUrl || 'Alamat Broker belum diisi'}
                  </code>
                </div>
              ) : (
                <div className="empty-state">
                  <FiDatabase size={22} />
                  <strong>Belum ada sumber data terhubung</strong>
                  <span>Hubungkan API atau MQTT alat Anda di menu Sumber Data Sensor.</span>
                </div>
              )}
            </div>

            {links.length > 0 && (
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-semibold small">Halaman Dashboard Terbaru</span>
                  <Link to={`${basePath}/links`} className="small text-decoration-none">
                    Lihat semua
                  </Link>
                </div>
                <div className="d-grid gap-2">
                  {links.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="d-flex align-items-center justify-content-between p-2 border rounded bg-light"
                    >
                      <div className="text-truncate me-2">
                        <div className="fw-semibold small text-truncate">{item.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                          /{activeUsername}/{item.templateId}/{item.slug}
                        </div>
                      </div>
                      <Button
                        as={Link}
                        to={`/${activeUsername}/${item.templateId}/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outline-primary"
                        size="sm"
                      >
                        <FiExternalLink size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </section>
  );
};

export default OverviewPage;

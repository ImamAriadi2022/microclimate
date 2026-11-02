import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Container } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CustomStation2 from '../components/custom/CustomStation2';
import { getTemplateById } from '../features/station-template/stationTemplates';
import { fetchPublicDashboardLink } from '../features/user-dashboard/userApi';
import '../features/user-dashboard/userDashboard.css';

const STORAGE_KEY = 'mc_v2_dashboard_links';
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

const mergeUiSettings = (settings) => ({
  ...DEFAULT_UI,
  ...(settings || {}),
  gaugeItems: {
    ...DEFAULT_UI.gaugeItems,
    ...((settings && settings.gaugeItems) || {}),
  },
  tableColumns: {
    ...DEFAULT_UI.tableColumns,
    ...((settings && settings.tableColumns) || {}),
  },
});

const readStoredUiForLink = (link) => {
  if (!link?.id) return DEFAULT_UI;

  if (link.uiSettings && Object.keys(link.uiSettings).length > 0) {
    return mergeUiSettings(link.uiSettings);
  }

  try {
    const savedUi = localStorage.getItem(UI_KEY);
    const parsedUi = savedUi ? JSON.parse(savedUi) : {};
    return mergeUiSettings(parsedUi[link.id]);
  } catch (_error) {
    return DEFAULT_UI;
  }
};

const CustomDashboard = () => {
  const navigate = useNavigate();
  const { username = 'user', template, slug } = useParams();
  const templateInfo = useMemo(() => getTemplateById(template), [template]);
  const [linkData, setLinkData] = useState(null);
  const [configData, setConfigData] = useState(null);
  const [uiSettings, setUiSettings] = useState(DEFAULT_UI);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadLocal = () => {
      const savedLinks = localStorage.getItem(STORAGE_KEY);
      const savedConfigs = localStorage.getItem('mc_v2_user_configs');
      if (!savedLinks) {
        setIsLoading(false);
        return;
      }
      try {
        const parsedLinks = JSON.parse(savedLinks);
        const foundLink = parsedLinks.find(
          (item) => item.slug === slug && item.templateId === template
        );
        setLinkData(foundLink || null);
        setUiSettings(readStoredUiForLink(foundLink));

        if (foundLink && foundLink.configId && savedConfigs) {
          const parsedConfigs = JSON.parse(savedConfigs);
          const foundConfig = parsedConfigs.find((c) => c.id === foundLink.configId);
          setConfigData(foundConfig || null);
        } else {
          setConfigData(null);
        }
      } catch (_error) {
        setLinkData(null);
        setConfigData(null);
        setUiSettings(DEFAULT_UI);
      }
      setIsLoading(false);
    };

    setIsLoading(true);
    fetchPublicDashboardLink(username, template, slug)
      .then((data) => {
        if (cancelled) return;
        const remoteLink = data.link || null;
        setLinkData(remoteLink);
        setConfigData(data.config || null);
        setUiSettings(readStoredUiForLink(remoteLink));
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          loadLocal();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, template, username]);

  const isPublished = Boolean(linkData?.published);
  const loggedInUsername = localStorage.getItem('mc_v2_username') || '';
  const hasSession = Boolean(localStorage.getItem('mc_v2_auth_token') || loggedInUsername);

  if (isLoading) {
    return (
      <div className="user-dashboard d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-muted fw-semibold">Memuat konfigurasi dashboard...</div>
      </div>
    );
  }

  if (templateInfo?.id === 'station2') {
    return (
      <div className="user-dashboard d-flex flex-column" style={{ minHeight: '100vh' }}>
        <header className="mc-custom-topbar">
          <Container className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <Link to="/" className="mc-custom-topbar__brand text-decoration-none">
                Microclimate
              </Link>
              <span className="text-muted">/</span>
              <span className="fw-semibold">{linkData?.name || slug}</span>
              <Badge bg={isPublished ? 'success' : 'secondary'}>
                {isPublished ? 'Publik' : 'Pratinjau Draft'}
              </Badge>
            </div>
            <div className="d-flex align-items-center gap-2">
              {hasSession && (
                <Button
                  as={Link}
                  to={`/${loggedInUsername || username}/dashboard/links`}
                  variant="outline-primary"
                  size="sm"
                >
                  Kelola Link
                </Button>
              )}
            </div>
          </Container>
        </header>
        <div style={{ flex: 1 }}>
          <CustomStation2
            customConfig={configData}
            customTitle={linkData?.name || slug}
            uiSettings={uiSettings}
          />
        </div>
        <footer className="mc-custom-footer">
          Dashboard pemantauan iklim mikro berbasis platform <strong>Microclimate</strong>
        </footer>
      </div>
    );
  }

  return (
    <div className="user-dashboard py-5">
      <Container>
        <Card className="shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <Card.Title>{linkData?.name || 'Dashboard Custom'}</Card.Title>
                <Card.Text className="text-muted">
                  Template: {templateInfo?.name || template}
                </Card.Text>
              </div>
              <Badge bg={isPublished ? 'success' : 'secondary'}>
                {isPublished ? 'Dipublikasikan' : 'Draft'}
              </Badge>
            </div>

            {!linkData && (
              <Alert variant="warning" className="mt-3">
                Tautan dashboard dengan slug <strong>{slug}</strong> tidak ditemukan.
              </Alert>
            )}

            <div className="d-flex gap-2 mt-4">
              <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                Kembali
              </Button>
              <Button variant="primary" onClick={() => navigate('/')}>
                Ke Beranda
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default CustomDashboard;

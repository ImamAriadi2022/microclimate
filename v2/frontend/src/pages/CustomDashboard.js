import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Container } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import CustomStation2 from '../components/custom/CustomStation2';
import { getTemplateById } from '../features/station-template/stationTemplates';

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

const CustomDashboard = () => {
  const navigate = useNavigate();
  const { template, slug } = useParams();
  const templateInfo = useMemo(() => getTemplateById(template), [template]);
  const [linkData, setLinkData] = useState(null);
  const [configData, setConfigData] = useState(null);
  const [uiSettings, setUiSettings] = useState(DEFAULT_UI);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedLinks = localStorage.getItem(STORAGE_KEY);
    const savedConfigs = localStorage.getItem('mc_v2_user_configs');
    const savedUi = localStorage.getItem(UI_KEY);
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

      if (savedUi) {
        try {
          const parsedUi = JSON.parse(savedUi);
          const linkUi = foundLink ? parsedUi[foundLink.id] : null;
          setUiSettings({
            ...DEFAULT_UI,
            ...(linkUi || {}),
            gaugeItems: {
              ...DEFAULT_UI.gaugeItems,
              ...((linkUi && linkUi.gaugeItems) || {}),
            },
            tableColumns: {
              ...DEFAULT_UI.tableColumns,
              ...((linkUi && linkUi.tableColumns) || {}),
            },
          });
        } catch (_error) {
          setUiSettings(DEFAULT_UI);
        }
      } else {
        setUiSettings(DEFAULT_UI);
      }

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
  }, [slug, template]);

  const isPublished = Boolean(linkData?.published);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (templateInfo?.id === 'station2') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1 }}>
          <CustomStation2
            customConfig={configData}
            customTitle={linkData?.name}
            uiSettings={uiSettings}
          />
        </div>
        <footer 
          style={{ 
            textAlign: 'center', 
            padding: '15px', 
            backgroundColor: '#ffffff', 
            color: '#6c757d',
            fontSize: '0.9rem',
            borderTop: '1px solid #dee2e6',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
          }}
        >
          Dashboard ini dibuat menggunakan platform <strong>Microclimate</strong>
        </footer>
      </div>
    );
  }

  return (
    <Container className="py-5">
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
              {isPublished ? 'Dipublikasikan' : 'Belum dipublikasikan'}
            </Badge>
          </div>

          {!linkData && (
            <Alert variant="warning" className="mt-3">
              Link ini belum terdaftar di konfigurasi lokal.
            </Alert>
          )}

          <Card.Text className="mt-3">
            Halaman ini adalah simulasi dashboard custom untuk slug <strong>{slug}</strong>.
            Silakan lanjutkan integrasi data sesuai template.
          </Card.Text>

          <div className="d-flex gap-2 mt-4">
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              Kembali
            </Button>
            <Button variant="primary" onClick={() => navigate('/')}>
              Ke Home
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CustomDashboard;

import { Slide } from 'react-awesome-reveal';
import { Card, Col, Container, Row } from 'react-bootstrap';
import { FaBell, FaChartLine, FaCogs, FaDatabase, FaDesktop, FaFileExport } from 'react-icons/fa';

const features = [
  {
    icon: <FaDesktop size={40} color="#007bff" />,
    title: 'Responsive Dashboard',
    description: 'Features a user-friendly and responsive interface, enabling seamless access across all devices, including desktops, tablets, and mobile phones.',
  },
  {
    icon: <FaDatabase size={40} color="#007bff" />,
    title: 'Historical Data Storage and Access',
    description: 'Provides access to historical climate data for trend analysis, weather prediction, and data-driven planning.',
  },
  {
    icon: <FaBell size={40} color="#007bff" />,
    title: 'Automated Alert System',
    description: 'Sends instant notifications to users when extreme weather conditions occur or microclimate parameters exceed predefined thresholds.',
  },
  {
    icon: <FaCogs size={40} color="#007bff" />,
    title: 'Sensor Integration',
    description: 'Connects to various field sensors to gather accurate and up-to-date microclimate data.',
  },
  {
    icon: <FaFileExport size={40} color="#007bff" />,
    title: 'Data Export and Download',
    description: 'Allows users to export data in various formats, such as CSV or excel, for further analysis or reporting.',
  },
  {
    icon: <FaChartLine size={40} color="#007bff" />,
    title: 'Real-Time Data Monitoring',
    description: 'Displays microclimate parameters such as temperature, humidity, rainfall, wind speed, and wind direction in real time through interactive charts and visualizations.',
  },
];

const CardFitur = () => {
  return (
    <section className="card-features-section py-5">
      <Container>
        <Row className="g-4">
          {features.map((feature, index) => (
            <Col xs={12} sm={6} md={4} key={index}>
              <Slide direction="up" triggerOnce>
                <Card className="h-100 text-center">
                  <Card.Body>
                    <div className="mb-3">{feature.icon}</div>
                    <Card.Title style={{ fontWeight: 'bold', color: '#000' }}>{feature.title}</Card.Title>
                    <Card.Text>{feature.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Slide>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default CardFitur;
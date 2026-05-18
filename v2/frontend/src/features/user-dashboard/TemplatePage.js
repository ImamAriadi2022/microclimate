import { Card, ListGroup } from 'react-bootstrap';
import { stationTemplates } from '../station-template/stationTemplates';

const TemplatePage = () => {
  return (
    <section className="user-dashboard__page">
      <div className="user-dashboard__page-header">
        <h2>Template Station</h2>
        <p>Pilih template acuan untuk dashboard custom kamu.</p>
      </div>
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>Daftar Template</Card.Title>
          <Card.Text>Gunakan template berikut sebagai dasar layout dashboard.</Card.Text>
          <ListGroup variant="flush">
            {stationTemplates.map((template) => (
              <ListGroup.Item key={template.id}>
                <div className="fw-semibold">{template.name}</div>
                <div className="text-muted">{template.description}</div>
                <div className="small text-muted">Base path: {template.basePath}</div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>
    </section>
  );
};

export default TemplatePage;

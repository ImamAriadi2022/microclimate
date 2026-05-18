import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Slide } from 'react-awesome-reveal';

const categories = [
  { title: 'Temperature', description: 'Monitor real-time temperature data.' },
  { title: 'Humidity', description: 'Track humidity levels accurately.' },
  { title: 'Rainfall', description: 'Analyze rainfall patterns and trends.' },
  { title: 'Wind Speed', description: 'Measure wind speed effectively.' },
  { title: 'Irradiation', description: 'Monitor solar irradiation levels.' },
  { title: 'Wind Direction', description: 'Determine wind direction precisely.' },
];

const Category = () => {
  return (
    <section className="category-section py-5">
      <Container>
        <Row className="g-4">
          {categories.map((category, index) => (
            <Col md={4} key={index}>
              <Slide direction="up" triggerOnce>
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title>{category.title}</Card.Title>
                    <Card.Text>{category.description}</Card.Text>
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

export default Category;
import { Slide } from 'react-awesome-reveal';
import { Col, Container, Row } from 'react-bootstrap';

const Hero = () => {
  return (
    <section
      className="hero-section bg-light py-5"
      style={{ paddingTop: '120px' }} // Menambahkan padding atas
    >
      <Container>
        <Row className="align-items-center" style={{ paddingTop: '50px' }}>
          {/* Grid Kiri */}
          <Col md={6}>
            <Slide direction="left" triggerOnce>
              <h4>Hello, Welcome to</h4>
              <h1 className="display-4">Microclimate Dashboard Monitoring System</h1>
              <p className="mt-3">
                Discover the power of real-time climate monitoring and analysis. Our intuitive platform brings together essential environmental data—temperature, humidity, rainfall, wind speed, and more—into one comprehensive system. Whether you're a researcher, policymaker, or environmental enthusiast, this dashboard empowers you to make informed decisions, track trends, and respond swiftly to climate changes. Together, let's embrace innovation for a sustainable future.
              </p>
              {/* <Button variant="primary" as={Link} to="/dashboard">
                Get Started
              </Button> */}
            </Slide>
          </Col>

          {/* Grid Kanan */}
          <Col md={6}>
            <Slide direction="right" triggerOnce>
              <img
                src="./img/hero.png" // Ganti dengan path gambar ilustrasi Anda
                alt="Illustration"
                className="img-fluid"
              />
            </Slide>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Hero;
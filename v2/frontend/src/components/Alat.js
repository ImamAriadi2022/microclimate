import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Slide } from 'react-awesome-reveal';

const Alat = () => {
  return (
    <section className="alat-section py-5">
      <Container>
        <Row className="align-items-center">
          {/* Bagian Kiri */}
          <Col md={6}>
            <Slide direction="left" triggerOnce>
              <img
                src="./img/product.png" // Ganti dengan path gambar produk Anda
                alt="Product"
                className="img-fluid"
              />
            </Slide>
          </Col>

          {/* Bagian Kanan */}
          <Col md={6}>
            <Slide direction="right" triggerOnce>
              {/* Tulisan dengan background hijau untuk kata "New" */}
              <h5>
                <span
                  style={{
                    backgroundColor: '#28a745', // Warna hijau
                    color: '#fff', // Warna teks putih
                    padding: '2px 8px', // Padding untuk teks
                    borderRadius: '5px', // Sudut tidak lancip
                  }}
                >
                  New
                </span>{' '}
                MicroClimate Monitoring System
              </h5>

              {/* Judul utama */}
              <h2 className="fw-bold mt-3">
                A Complete Dashboard Monitor For Climate Sensing
              </h2>

              {/* Paragraf */}
              <p className="mt-3">
                A real-time system for monitoring, analyzing, and alerting climate data to support research and disaster mitigation efforts.
              </p>

              {/* Poin-poin */}
              <div className="mt-4">
                <div className="mb-3">
                  <h5 className="fw-bold">01</h5>
                  <h6>React 18 and JavaScript</h6>
                  <p>
                    Power the Microclimate Monitoring Dashboard with real-time updates, fast performance, and reliable, scalable data management.
                  </p>
                </div>
                <div>
                  <h5 className="fw-bold">02</h5>
                  <h6>User Friendly</h6>
                  <p>
                    Featuring an intuitive interface, clear navigation, and responsive design, making it easy for users to monitor and analyze microclimate data across all devices.
                  </p>
                </div>
              </div>
            </Slide>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Alat;
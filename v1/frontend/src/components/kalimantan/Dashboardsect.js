import React from 'react';
import { Container } from 'react-bootstrap';
import { Slide } from 'react-awesome-reveal';

const DashboardSect = () => {
  return (
    <section
      className="dashboard-section py-5"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
      }}
    >
      <Container>
        <Slide direction="up" triggerOnce>
          <div style={{ textAlign: 'center' }}>
            <h1 className="fw-bold" style={{ color: '#007bff' }}>
              Wellcome to dashboard microclimate Kalimantan
            </h1>
            <p style={{ fontSize: '18px', color: '#6c757d' }}>
              Explore and manage your microclimate data efficiently.
            </p>
          </div>
        </Slide>
      </Container>
    </section>
  );
};

export default DashboardSect;
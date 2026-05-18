import { Slide } from 'react-awesome-reveal';
import { Container } from 'react-bootstrap';

const CoreFitur = () => {
  return (
    <section className="core-features-section py-5" style={{ textAlign: 'center' }}>
      <Container>
        <Slide direction="down" triggerOnce>
          {/* Elemen dengan background biru muda langit */}
          <div
            style={{
              backgroundColor: '#87CEEB', // Warna biru muda langit
              color: '#000', // Warna teks hitam
              borderRadius: '15px', // Sudut tidak lancip
              padding: '10px 20px', // Padding untuk teks
              display: 'inline-block', // Supaya elemen tidak memenuhi lebar penuh
            }}
          >
            <h5 className="mb-0">CLIMATE FEATURES</h5>
          </div>
        </Slide>

        <Slide direction="up" triggerOnce>
          {/* Konten utama */}
          <h3 className="fw-bold mt-4">Core Features of Solid</h3>
          <p className="mt-3 core-features-text">
            Microclimate Dashboard Monitoring System is a web-based platform designed to monitor and analyze microclimate data in real time. This system is equipped with key features such as
          </p>
        </Slide>
      </Container>
    </section>
  );
};

export default CoreFitur;
import { Slide } from 'react-awesome-reveal';
import { Container } from 'react-bootstrap';

const CoreFitur = () => {
  return (
    <section id="fitur" className="core-features-section py-5" style={{ textAlign: 'center' }}>
      <Container>
        <Slide direction="down" triggerOnce>
          <div
            style={{
              backgroundColor: '#e7f7ef',
              color: '#08754c',
              borderRadius: '8px',
              padding: '6px 14px',
              display: 'inline-block',
              fontWeight: 600,
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
            }}
          >
            FITUR UTAMA
          </div>
        </Slide>

        <Slide direction="up" triggerOnce>
          {/* Konten utama */}
          <h3 className="fw-bold mt-3">Pemantauan & Konfigurasi Stasiun Terpadu</h3>
          <p className="mt-2 core-features-text text-muted">
            Microclimate Monitoring System menyajikan telemetri sensor secara real-time, dilengkapi pengelolaan sumber data mandiri serta publikasi dashboard kustom untuk setiap stasiun.
          </p>
        </Slide>
      </Container>
    </section>
  );
};

export default CoreFitur;
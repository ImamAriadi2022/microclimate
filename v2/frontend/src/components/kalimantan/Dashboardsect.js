import React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const DashboardSect = () => {
  return (
    <section className="mc-station-page">
      <Container>
        <div className="mc-station-header mb-4">
          <div>
            <span className="mc-station-header__eyebrow">Wilayah Pemantauan Kalimantan</span>
            <h2 className="mc-station-header__title">
              Dashboard Microclimate Kalimantan
            </h2>
            <p className="mc-station-header__subtitle">
              Pilih stasiun di panel samping atau melalui kartu di bawah untuk melihat telemetri sensor secara langsung.
            </p>
          </div>
        </div>

        <div className="mc-section-card">
          <div className="mc-section-card__header">
            <div>
              <h4 className="mc-section-card__title">Stasiun Tersedia</h4>
              <p className="mc-section-card__subtitle">
                Akses tampilan gauge, grafik tren, serta riwayat data sensor
              </p>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-3">
            <Link to="/kalimantan/station1" className="btn btn-primary fw-semibold px-4">
              Buka Station 1 (Kalimantan)
            </Link>
            <Link to="/kalimantan/download" className="btn btn-outline-primary fw-semibold px-4">
              Download Data
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default DashboardSect;

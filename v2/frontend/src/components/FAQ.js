import React, { useState } from 'react';
import { Container, Row, Col, Accordion } from 'react-bootstrap';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { Slide } from 'react-awesome-reveal';
import './FAQ.css';

const FAQ = () => {
  const [activeKey, setActiveKey] = useState(null);

  const toggleAccordion = (key) => {
    setActiveKey(activeKey === key ? null : key);
  };

  return (
    <section className="faq-section py-5">
      <Container>
        <Row>
          {/* Bagian Kiri */}
          <Col md={4}>
            <Slide direction="left" triggerOnce>
              <h5>Our FAQs</h5>
              <h2 className="fw-bold">Frequently Asked Questions</h2>
            </Slide>
          </Col>

          {/* Bagian Kanan */}
          <Col md={8}>
            <Slide direction="right" triggerOnce>
              <Accordion activeKey={activeKey} className="custom-accordion">
                {/* Pertanyaan 1 */}
                <Accordion.Item eventKey="0">
                  <Accordion.Header onClick={() => toggleAccordion("0")}>
                    <div className="d-flex justify-content-between w-100">
                      <span>Bagaimana cara mengakses data microclimate?</span>
                      {activeKey === "0" ? <FaMinus /> : <FaPlus />}
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    Anda dapat mengakses data Microclimate dengan masuk ke halaman utama dashboard kami. Data akan ditampilkan secara real-time dan Anda dapat memilih parameter spesifik yang ingin ditampilkan, seperti suhu, kelembapan, kecepatan angin, dan parameter cuaca lainnya.
                  </Accordion.Body>
                </Accordion.Item>

                {/* Pertanyaan 2 */}
                <Accordion.Item eventKey="1">
                  <Accordion.Header onClick={() => toggleAccordion("1")}>
                    <div className="d-flex justify-content-between w-100">
                      <span>Apakah saya bisa mengunduh data microclimate?</span>
                      {activeKey === "1" ? <FaMinus /> : <FaPlus />}
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    Ya, Anda dapat mengunduh data Microclimate dalam format CSV atau Excel. Fitur unduh ini tersedia di bagian Data Export pada menu dashboard, sehingga memudahkan Anda untuk melakukan analisis lebih lanjut.
                  </Accordion.Body>
                </Accordion.Item>

                {/* Pertanyaan 3 */}
                <Accordion.Item eventKey="2">
                  <Accordion.Header onClick={() => toggleAccordion("2")}>
                    <div className="d-flex justify-content-between w-100">
                      <span>Apakah web ini menyediakan visualisasi data?</span>
                      {activeKey === "2" ? <FaMinus /> : <FaPlus />}
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    Tentu, web ini menyediakan berbagai bentuk visualisasi data, seperti grafik garis, histogram, dan peta interaktif, yang memudahkan Anda untuk memahami tren dan pola dari data Microclimate secara jelas dan informatif.
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Slide>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default FAQ;
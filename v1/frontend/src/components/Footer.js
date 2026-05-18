import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="footer-section bg-white text-dark py-5" style={{ borderTop: '1px solid rgb(26, 28, 29)' }}>
      <Container>
        <Row>
          {/* Kolom Logo dan Alamat */}
          <Col md={4}>
            <img
              src="./img/logo.png" // Ganti dengan path logo Anda
              alt="Logo"
              className="mb-3"
              style={{ width: '100px' }}
            />
            <p>
              Jl. Prof. Dr. Ir. Sumantri Brojonegoro No.1, Gedong Meneng, Kec. Rajabasa, Kota Bandar Lampung, Lampung 35141.
            </p>
            <p>Contact: microclimate@gmail.com</p>
          </Col>

          {/* Kolom Quick Links */}
          <Col md={4}>
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li><a href="/" className="text-dark text-decoration-none">Home</a></li>
              <li><a href="/product" className="text-dark text-decoration-none">Product</a></li>
              <li><a href="/careers" className="text-dark text-decoration-none">Careers</a></li>
            </ul>
          </Col>

          {/* Kolom Support */}
          <Col md={4}>
            <h5>Support</h5>
            <ul className="list-unstyled">
              <li><a href="/" className="text-dark text-decoration-none">Home</a></li>
              <li><a href="/press-media" className="text-dark text-decoration-none">Press Media</a></li>
              <li><a href="/blog" className="text-dark text-decoration-none">Our Blog</a></li>
              <li><a href="/contact" className="text-dark text-decoration-none">Contact Us</a></li>
              <li><a href="/privacy-policy" className="text-dark text-decoration-none">Privacy Policy</a></li>
              <li><a href="/support" className="text-dark text-decoration-none">Support</a></li>
            </ul>
          </Col>
        </Row>
        <hr className="bg-dark" />
        <Row>
          <Col className="text-center">
            <p className="mb-0">© 2025 Climate. All rights reserved</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
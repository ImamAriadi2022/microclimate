import { useState } from 'react';
import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import LoginModal from '../features/auth/LoginModal';

const CustomNavbar = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const openLogin = () => {
    setAuthMode('login');
    setShowLogin(true);
  };
  const openRegister = () => {
    setAuthMode('register');
    setShowLogin(true);
  };
  const closeLogin = () => setShowLogin(false);

  return (
    <Navbar bg="light" expand="lg" fixed="top">
      <Container>
        {/* Logo dan Nama Produk */}
        <Navbar.Brand as={Link} to="/">
          <img
            src="./img/logo.png" // Ganti dengan path logo Anda
            alt="Logo"
            className="d-inline-block align-top navbar-logo"
          />{' '}
        </Navbar.Brand>

        {/* Tombol Toggle untuk Navbar di layar kecil */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Link di sebelah kiri */}
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/features">Fitur</Nav.Link>
            <Nav.Link as={Link} to="/faq">FAQ</Nav.Link>
            <Nav.Link as={Link} to="/help">Bantuan</Nav.Link>
          </Nav>

          <Nav className="ms-auto">
            <Button variant="outline-primary" onClick={openLogin}>
              Login
            </Button>
            <Button variant="primary" className="ms-2" onClick={openRegister}>
              Daftar
            </Button>
          </Nav>

        </Navbar.Collapse>
        <LoginModal show={showLogin} onHide={closeLogin} initialMode={authMode} />
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
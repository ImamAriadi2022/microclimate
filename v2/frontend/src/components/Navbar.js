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

  const savedUsername = localStorage.getItem('mc_v2_username') || '';
  const hasSession = Boolean(localStorage.getItem('mc_v2_auth_token') || savedUsername);

  return (
    <Navbar bg="white" expand="lg" fixed="top" className="mc-public-navbar shadow-xs border-bottom">
      <Container>
        {/* Logo dan Nama Produk */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2 fw-bold">
          <img
            src="./img/logo.png"
            alt="Logo"
            className="d-inline-block align-top navbar-logo"
          />
        </Navbar.Brand>

        {/* Tombol Toggle untuk Navbar di layar kecil */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Link di sebelah kiri */}
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Beranda</Nav.Link>
            <Nav.Link href="#fitur">Fitur</Nav.Link>
            <Nav.Link href="#faq">FAQ</Nav.Link>
          </Nav>

          <Nav className="ms-auto align-items-lg-center gap-2 mt-2 mt-lg-0">
            {hasSession ? (
              <Button as={Link} to={`/${savedUsername || 'user'}/dashboard`} variant="primary">
                Dashboard Saya
              </Button>
            ) : (
              <>
                <Button variant="outline-primary" onClick={openLogin}>
                  Masuk
                </Button>
                <Button variant="primary" onClick={openRegister}>
                  Daftar
                </Button>
              </>
            )}
          </Nav>

        </Navbar.Collapse>
        <LoginModal show={showLogin} onHide={closeLogin} initialMode={authMode} />
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
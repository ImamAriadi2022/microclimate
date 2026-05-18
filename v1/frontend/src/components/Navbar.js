import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const CustomNavbar = () => {
  return (
    <Navbar bg="light" expand="lg" fixed="top">
      <Container>
        {/* Logo dan Nama Produk */}
        <Navbar.Brand as={Link} to="/">
          <img
            src="./img/logo.png" // Ganti dengan path logo Anda
            alt="Logo"
            width="200"
            height="40"
            className="d-inline-block align-top"
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

        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
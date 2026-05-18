import { useMemo } from 'react';
import { Container, Dropdown, Navbar } from 'react-bootstrap';
import { FiMenu } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const UserNavbar = ({ username, isSidebarOpen, onToggleSidebar }) => {
  const navigate = useNavigate();
  const safeName = username || 'user';
  const initials = useMemo(() => safeName.charAt(0).toUpperCase(), [safeName]);

  const handleLogout = () => {
    localStorage.removeItem('mc_v2_login_email');
    localStorage.removeItem('mc_v2_username');
    localStorage.removeItem('mc_v2_display_name');
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" fixed="top" className="user-navbar">
      <Container fluid>
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="user-navbar__collapse"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
          >
            <FiMenu size={18} />
          </button>
          <Navbar.Brand className="user-navbar__brand">Dashboard User</Navbar.Brand>
        </div>
        <Dropdown align="end">
          <Dropdown.Toggle
            id="user-menu"
            as="button"
            type="button"
            className="user-navbar__toggle"
          >
            <span className="user-navbar__avatar">{initials}</span>
            <span className="user-navbar__name">{safeName}</span>
          </Dropdown.Toggle>
          <Dropdown.Menu className="user-navbar__menu">
            <Dropdown.Header>Profil</Dropdown.Header>
            <Dropdown.Item>Profil Utama</Dropdown.Item>
            <Dropdown.Item>Profil Kedua</Dropdown.Item>
            <Dropdown.Item disabled>Tambah Profil (segera)</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout} className="text-danger">
              Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Container>
    </Navbar>
  );
};

export default UserNavbar;

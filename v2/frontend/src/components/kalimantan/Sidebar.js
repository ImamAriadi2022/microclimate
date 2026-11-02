import { FaDownload, FaHome, FaMapMarkerAlt, FaTachometerAlt } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const isOverview = pathname === '/kalimantan' || pathname === '/kalimantan/';
  const isStation1 = pathname.includes('/kalimantan/station1');
  const isDownload = pathname.includes('/kalimantan/download');

  return (
    <div className={`sidebar ${isOpen ? '' : 'sidebar--closed'}`}>
      {isOpen && (
        <div className="sidebar-logo">
          <img src="/img/logo.png" alt="Microclimate Logo" />
          <span className="sidebar-region-badge">Kalimantan</span>
        </div>
      )}

      {isOpen && (
        <nav>
          <div className="sidebar-section-label">Menu Navigasi</div>
          <ul className="sidebar-nav">
            <li>
              <Link to="/" className="sidebar-link">
                <FaHome />
                Go Home
              </Link>
            </li>
            <li>
              <Link
                to="/kalimantan"
                className={`sidebar-link ${isOverview ? 'sidebar-link--active' : ''}`}
              >
                <FaTachometerAlt />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/kalimantan/station1"
                className={`sidebar-link ${isStation1 ? 'sidebar-link--active' : ''}`}
              >
                <FaMapMarkerAlt />
                Station 1
              </Link>
            </li>
            <li>
              <Link
                to="/kalimantan/download"
                className={`sidebar-link ${isDownload ? 'sidebar-link--active' : ''}`}
              >
                <FaDownload />
                Download Data
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default Sidebar;

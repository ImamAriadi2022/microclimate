import { FaDownload, FaHome, FaMapMarkerAlt, FaTachometerAlt } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const isOverview = pathname === '/petengoran' || pathname === '/petengoran/';
  const isStation1 = pathname.includes('/petengoran/station1');
  const isStation2 = pathname.includes('/petengoran/station2');
  const isDownload = pathname.includes('/petengoran/download');

  return (
    <div className={`sidebar ${isOpen ? '' : 'sidebar--closed'}`}>
      {isOpen && (
        <div className="sidebar-logo">
          <img src="/img/logo.png" alt="Microclimate Logo" />
          <span className="sidebar-region-badge">Petengoran</span>
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
                to="/petengoran"
                className={`sidebar-link ${isOverview ? 'sidebar-link--active' : ''}`}
              >
                <FaTachometerAlt />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/petengoran/station1"
                className={`sidebar-link ${isStation1 ? 'sidebar-link--active' : ''}`}
              >
                <FaMapMarkerAlt />
                Station 1
              </Link>
            </li>
            <li>
              <Link
                to="/petengoran/station2"
                className={`sidebar-link ${isStation2 ? 'sidebar-link--active' : ''}`}
              >
                <FaMapMarkerAlt />
                Station 2
              </Link>
            </li>
            <li>
              <Link
                to="/petengoran/download"
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
